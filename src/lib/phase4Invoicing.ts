import { getRepo } from "@/repo";
import { newId } from '@/lib/id';
import { nowIso } from '@/lib/dates';
import type { Invoice, InvoiceItem, InvoiceMilestone, InvoicePaymentType, PricingModel, Quotation } from '@/lib/types';
import {
  getQuotationTotalsForDisplay,
  getQuotationServiceBlocks,
  type QuotationServiceBlock,
} from "@/lib/quotationServiceBlocks";

//helper
function updateServiceProgress(
  quotation: Quotation,
  selectedServiceIds: string[]
): Quotation {

  const updatedBlocks = (quotation.service_blocks || []).map(service => {

    if (!selectedServiceIds.includes(service.service_id))
      return service;

    const progress = service.invoice_progress ?? {
      generated: 0,
      total:
        service.billing_type === "milestone"
          ? service.milestone_template?.length ?? 1
          : service.billing_type === "monthly"
            ? Number(service.duration_months ?? 1)
            : 1,
      completed: false,
    };

    const generated = progress.generated + 1;

    return {
      ...service,

      invoice_progress: {
        generated,
        total: progress.total,
        completed: generated >= progress.total,
      },
    };

  });

  const allCompleted =
    updatedBlocks.length > 0 &&
    updatedBlocks.every(
      service => service.invoice_progress?.completed
    );

  return {
    ...quotation,
    status: allCompleted ? "invoiced" : quotation.status,
    service_blocks: updatedBlocks,
  };
}


export async function getInvoicesForService(
  quotationId: string,
  serviceId: string,
  preFetched?: { invoices: Invoice[]; items: InvoiceItem[] }
) {
  if (!preFetched) {
    console.warn("[SLOW PATH] getInvoicesForService fetching fresh — no preFetched data passed!");
  }
  const invoices = preFetched?.invoices ?? (await getRepo().listInvoices());
  const items = preFetched?.items ?? (await getRepo().listInvoiceItems());

  return invoices.filter((invoice) => {
    if (invoice.quotation_id !== quotationId) return false;

    return items.some(
      (item) =>
        item.invoice_id === invoice.id &&
        item.service_id === serviceId
    );
  });
}

export async function getServiceProgress(
  quotation: Quotation,
  service: QuotationServiceBlock
): Promise<{
  generated: number;
  total: number;
  completed: boolean;
  next: number;
  canGenerate: boolean;
  reason: string | null;
}> {

  const invoices = await getInvoicesForService(

    quotation.id,

    service.service_id

  );

  const generated = invoices.length;

  let total = 1;

  switch (service.billing_type) {

    case "monthly":

      total = Number(service.duration_months ?? 1);

      break;

    case "milestone":

      total = service.milestone_template?.length ?? 1;

      break;

    case "one_time":

    case "retainer":

    default:

      total = 1;

      break;

  }
  const latestInvoice =
    invoices.length > 0
      ? invoices.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )[0]
      : null;

  const previousInvoicePaid =
    !latestInvoice ||
    latestInvoice.invoice_status === "paid";

  return {
    generated,
    total,
    completed: generated >= total,
    next: generated + 1,

    canGenerate:
      generated < total &&
      previousInvoicePaid,

    reason:
      generated >= total
        ? "Completed"
        : !previousInvoicePaid
          ? "Previous invoice must be paid first"
          : null,
  };
}

export type GenerateInvoicePlan =
  | {
    type: "full";
    selectedServiceIds?: string[];
  }
  | {
    type: "partial";
    amount: number;
    selectedServiceIds?: string[];
  }
  | {
    type: "monthly";
    monthlyAmount: number;
    totalMonths: number;
    selectedServiceIds?: string[];
  }
  | {
    type: "milestone";
    milestones: InvoiceMilestone[];
    selectedServiceIds?: string[];
  };

function buildInvoiceBase(quotation: Quotation, invoiceId: string, now: string): Invoice {
  const safeTotals = getQuotationTotalsForDisplay(quotation);
  const invoiceNumber = `INV-${Date.now()}`;

  const inv: Invoice = {
    id: invoiceId,
    invoice_number: invoiceNumber,
    quotation_id: quotation.id,
    client_id: quotation.client_id,
    quotation_selected_points: quotation.selected_points ?? null,
    currency: quotation.currency,
    subtotal: safeTotals.subtotal,
    discount: quotation.discount,
    tax_amount: quotation.tax_amount,
    total: safeTotals.total,
    amount_paid: 0,
    amount_due: safeTotals.total,
    status: 'draft',
    invoice_status: 'draft',
    sent_at: null,
    paid_at: null,
    due_date: null,
    notes: null,
    share_token: null,
    created_at: now,
    updated_at: now,
  } as unknown as Invoice;

  return inv;
}


async function getServiceAmountDue(
  quotation: Quotation,
  service: QuotationServiceBlock,
  preFetched: { invoices: Invoice[]; items: InvoiceItem[] }
): Promise<number> {

  switch (service.billing_type) {

    case "milestone": {

      const previousInvoices =
        await getInvoicesForService(
          quotation.id,
          service.service_id,
          preFetched
        );

      const milestoneIndex =
        previousInvoices.length;

      const milestone =
        service.milestone_template?.[milestoneIndex];

      return Number(milestone?.amount ?? 0);
    }

    case "monthly":

      return Number(service.monthly_amount ?? 0);

    default:

      return Number(service.price ?? 0);
  }
}

async function snapshotInvoiceItems(
  invoiceId: string,
  quotation: Quotation,
  now: string,
  plan: GenerateInvoicePlan,
  preFetched?: { invoices: Invoice[]; items: InvoiceItem[] },
  validServiceIds?: Set<string>
): Promise<void> {


  const repo = getRepo();

  const resolvedPreFetched =
    preFetched ??
    {
      invoices: await repo.listInvoices(),
      items: await repo.listInvoiceItems(),
    };

  // Fallback: if not provided (e.g. called from generateNextMilestoneInvoice /
  // generateNextMonthlyInvoice), fetch the current valid service ids so we
  // never try to insert an invoice_item referencing a deleted service.
  const resolvedValidServiceIds =
    validServiceIds ?? new Set((await repo.listServices()).map((s) => s.id));
  console.log("========== SNAPSHOT ==========");
  console.log("Quotation:", quotation);

  console.log("service_blocks =", quotation.service_blocks);

  const quoteServices = (quotation.service_blocks || []).filter(service => {

    if (!plan.selectedServiceIds?.length) return true;

    return plan.selectedServiceIds.includes(service.service_id);

  });

  // console.log(
  //   "Selected Services:",
  //   quoteServices.map(s => s.service_name)
  // );

  // console.log("quoteServices =", quoteServices);

  // console.log("PLAN TYPE =", plan.type);

  console.log("QUOTE SERVICES =", quoteServices);
  const items: InvoiceItem[] = await Promise.all(
    quoteServices.map(async (s, idx) => {

      console.log(
        s.service_name,
        s.billing_type,
        s.milestone_template
      );
      let description = s.description ?? "";
      const monthlyValue =
        Number(
          s.monthly_amount ??
          (
            Number(s.price || 0) /
            Math.max(1, Number(s.duration_months || 1))
          )
        );

      let unitPrice = monthlyValue;
      let total = monthlyValue;

      // --------------------------
      // Milestone Invoice
      // --------------------------

      if (s.billing_type === "milestone") {

        const previousInvoices =
          await getInvoicesForService(
            quotation.id,
            s.service_id,
            resolvedPreFetched
          );

        const milestoneIndex = previousInvoices.length;

        const currentMilestone =
          s.milestone_template?.[milestoneIndex];

        if (currentMilestone) {

          description =
            `${currentMilestone.label} (${currentMilestone.percentage}%)`;

          unitPrice = Number(currentMilestone.amount);

          total = unitPrice;
        }
      }

      // --------------------------
      // Monthly Invoice
      // --------------------------


      console.log("MONTHLY SERVICE", {
        service: s.service_name,
        price: s.price,
        monthly_amount: s.monthly_amount,
        duration: s.duration_months,
      });

      if (s.billing_type === "monthly") {

        const previousInvoices =
          await getInvoicesForService(
            quotation.id,
            s.service_id
          );

        const monthNumber =
          previousInvoices.length + 1;

        description =
          `Month ${monthNumber} of ${s.duration_months}`;

        unitPrice =
          Number(s.monthly_amount ?? 0);

        total =
          unitPrice;
      }
      const safeServiceId =
        s.service_id && resolvedValidServiceIds.has(s.service_id)
          ? s.service_id
          : null;

      return {

        id: newId(),

        invoice_id: invoiceId,

        quotation_id: quotation.id,

        service_id: safeServiceId,

        name: s.service_name ?? "",

        description,

        pricing_model: "fixed",

        quantity: 1,

        unit_price: unitPrice,

        total,

        sort_order: idx,

        created_at: now,

      };
    })
  );

  console.log("Invoice Items =", items);

  if (items.length > 0) {

    console.log("Calling upsertInvoiceItemsForInvoice...");

    await repo.upsertInvoiceItemsForInvoice(invoiceId, items);

    console.log("Finished upsert.");

  } else {

    console.log("NO ITEMS TO SAVE");

  }
}


export async function generateInvoiceForQuotationPlan(
  quotation: Quotation,
  plan: GenerateInvoicePlan
): Promise<string> {

  const t0 = performance.now();
  const mark = (label: string) => console.log(`[TIMING] ${label}: ${(performance.now() - t0).toFixed(0)}ms`);

  console.log("========== GENERATE INVOICE ==========");
  console.log("Quotation ID:", quotation.id);
  console.log("Quotation Status:", quotation.status);
  console.log("Quotation Object:", quotation);
  console.log("Invoice Plan:", plan);

  if (quotation.status !== "accepted") {
    console.error(
      "Invoice generation blocked. Quotation status is:",
      quotation.status
    );

    throw new Error("Only accepted quotations can generate invoices.");
  }

  const repo = getRepo();
  const now = nowIso();
  const invoiceId = newId();

  console.log("Invoice ID:", invoiceId);

  const base = buildInvoiceBase(quotation, invoiceId, now);

  const selectedServices = (quotation.service_blocks || []).filter(service => {

    if (!plan.selectedServiceIds?.length) return true;

    return plan.selectedServiceIds.includes(service.service_id);

  });
  base.service_id =
    selectedServices.length === 1
      ? selectedServices[0].service_id
      : null;

  base.selected_service_ids =
    plan.selectedServiceIds ?? [];

  // const selectedTotal = selectedServices.reduce(
  //   (sum, service) => sum + Number(service.price || 0),
  //   0
  // );

  const invoiceServices = selectedServices;

  // Fetch invoices/items ONCE for this whole invoice generation instead of
  // re-fetching per service (was causing N+1 network round trips).
  const [allInvoices, allInvoiceItems, allServices] = await Promise.all([
    repo.listInvoices(),
    repo.listInvoiceItems(),
    repo.listServices(),
  ]);
  mark("Fetched invoices+items+services");
  const preFetched = { invoices: allInvoices, items: allInvoiceItems };
  const validServiceIds = new Set(allServices.map((s) => s.id));

  let calculatedSubtotal = 0;
  for (const service of invoiceServices) {
    calculatedSubtotal += Number(service.price || 0);
  }

  const amountDueList = await Promise.all(
    invoiceServices.map((service) => getServiceAmountDue(quotation, service, preFetched))
  );
  const calculatedAmountDue = amountDueList.reduce((sum, v) => sum + v, 0);


  // -------------------------------------
  // Full Payment
  // -------------------------------------

  if (plan.type === "full") {

    base.type = "full";

    base.subtotal = calculatedSubtotal;
    base.total = calculatedSubtotal;

    base.amount_due = calculatedAmountDue;
    base.balance_amount = 0;
  }

  // -------------------------------------
  // Partial Payment
  // -------------------------------------

  if (plan.type === "partial") {

    base.type = "partial";

    const amount = Math.max(
      0,
      Math.min(
        calculatedSubtotal,
        Number(plan.amount || 0)
      )
    );

    base.subtotal = calculatedSubtotal;
    base.total = calculatedSubtotal;

    base.amount_due = amount;
    base.balance_amount =
      calculatedSubtotal - amount;
  }

  // -------------------------------------
  // Milestone Invoice
  // -------------------------------------

  if (plan.type === "milestone") {

    const ms: InvoiceMilestone[] =
      plan.milestones.map((m) => ({
        label: (m.label || "").trim() || "Milestone",
        amount: Number(m.amount || 0),
        status: "pending",
      }));

    // Find which milestone this invoice represents
    const milestoneService =
      invoiceServices.find(
        s => s.billing_type === "milestone"
      );

    if (milestoneService) {

      const previousInvoices =
        await getInvoicesForService(
          quotation.id,
          milestoneService.service_id,
          preFetched
        );

      base.milestone_index =
        previousInvoices.length;

      base.milestone_index =
        previousInvoices.length;

      if (ms[base.milestone_index]) {
        ms[base.milestone_index].status = "invoiced";
      }
    }

    base.type = "milestone";
    base.milestones = ms;

    base.subtotal = calculatedSubtotal;
    base.total = calculatedSubtotal;

    base.amount_due = calculatedAmountDue;

    base.balance_amount =
      calculatedSubtotal - calculatedAmountDue;
  }

  // -------------------------------------
  // Monthly Invoice
  // -------------------------------------

  if (plan.type === "monthly") {

    const monthlyAmount =
      Number(plan.monthlyAmount || 0);

    const totalMonths =
      Math.max(
        1,
        Number(plan.totalMonths || 1)
      );

    if (monthlyAmount <= 0) {
      throw new Error("Monthly amount required");
    }

    const monthlyService =
      invoiceServices.find(
        s => s.billing_type === "monthly"
      );

    if (monthlyService) {

      const previousInvoices =
        await getInvoicesForService(
          quotation.id,
          monthlyService.service_id,
          preFetched
        );

      base.month_index =
        previousInvoices.length;
    }

    base.type = "monthly";
    base.monthly_amount = monthlyAmount;
    base.total_months = totalMonths;

    base.subtotal = calculatedSubtotal;
    base.total = calculatedSubtotal;

    base.amount_due = calculatedAmountDue;

    base.balance_amount =
      calculatedSubtotal - calculatedAmountDue;
  }


  // updateServiceProgress is pure computation — doesn't depend on the invoice
  // being created yet, so we can prepare it and start the quotation update
  // in parallel with invoice/item creation instead of waiting for both first.
  const updatedQuotation = updateServiceProgress(
    quotation,
    plan.selectedServiceIds ?? []
  );

  console.log("Creating invoice...");
  const createInvoicePromise = repo.createInvoice(base).then(async () => {
    mark("Created invoice");

    console.log("Creating invoice items...");
    await snapshotInvoiceItems(
      invoiceId,
      quotation,
      now,
      plan,
      preFetched,
      validServiceIds
    );
    mark("Created invoice items");
  });

  console.log("Updating quotation...");
  const updateQuotationPromise = repo.updateQuotation(updatedQuotation).then(() => {
    mark("Updated quotation");
  });

  await Promise.all([createInvoicePromise, updateQuotationPromise]);

  console.log("Invoice generation completed.");

  return invoiceId;
}

export async function generateNextMilestoneInvoice(currentInvoice: Invoice): Promise<string | null> {
  console.log("generateInvoiceForQuotationPlan called");

  if (currentInvoice.type !== 'milestone') return null;
  if (!currentInvoice.quotation_id) return null;

  const repo = getRepo();
  const all = await repo.listInvoices();

  // Find the "template" milestone plan: use the most recent milestone invoice for the quotation.
  const siblings = all
    .filter((i: Invoice) => i.quotation_id === currentInvoice.quotation_id && i.type === 'milestone')
    .sort((a: Invoice, b: Invoice) => String(b.created_at).localeCompare(String(a.created_at)));
  const base = siblings[0] || currentInvoice;

  const milestones = (base.milestones || []).map((m: InvoiceMilestone) => ({ ...m }));
  const currentIndex = typeof base.milestone_index === 'number' ? base.milestone_index : 0;
  const nextIndex = milestones.findIndex((m: InvoiceMilestone, idx: number) => idx > currentIndex && m.status === 'pending');
  if (nextIndex === -1) return null;

  milestones[nextIndex].status = 'invoiced';

  const now = nowIso();
  const invoiceId = newId();
  const invoiceNumber = `INV-${Date.now()}`;

  const nextInv = {
    ...base,
    id: invoiceId,
    invoice_number: invoiceNumber,
    invoice_status: 'draft',
    status: 'draft',
    sent_at: null,
    paid_at: null,
    payment_method: null,
    payment_reference: null,
    payment_received_at: null,
    milestones,
    milestone_index: nextIndex,
    amount_paid: 0,
    amount_due: Math.max(0, Number(milestones[nextIndex].amount || 0)),
    created_at: now,
    updated_at: now,
  } as unknown as Invoice;

  await repo.createInvoice(nextInv);

  // No new items; reuse the same quotation snapshot items when present.
  // const items = await repo.listInvoiceItemsByInvoice(base.id);
  // if (items.length) {
  //   const cloned = items.map((it) => ({ ...it, id: newId(), invoice_id: invoiceId, created_at: now }));
  //   await repo.upsertInvoiceItemsForInvoice(invoiceId, cloned);
  // }

  const quotation = await repo.getQuotation(base.quotation_id!);

  if (quotation) {

    await snapshotInvoiceItems(
      invoiceId,
      quotation,
      now,

      {
        type: "milestone",
        milestones: base.milestones ?? [],
        selectedServiceIds:
          base.selected_service_ids ??
          (base.service_id
            ? [base.service_id]
            : []),
      }
    );

  }

  return invoiceId;
}

export async function generateNextMonthlyInvoice(currentInvoice: Invoice): Promise<string | null> {
  if (currentInvoice.type !== 'monthly') return null;
  if (!currentInvoice.quotation_id) return null;

  const repo = getRepo();
  const all = await repo.listInvoices();

  const siblings = all
    .filter((i: Invoice) => i.quotation_id === currentInvoice.quotation_id && i.type === 'monthly')
    .sort((a: Invoice, b: Invoice) => String(b.created_at).localeCompare(String(a.created_at)));
  const base = siblings[0] || currentInvoice;

  const totalMonths = Number(base.total_months || 1);
  const currentIndex = typeof base.month_index === 'number' ? base.month_index : 0;
  const nextIndex = currentIndex + 1;

  if (nextIndex >= totalMonths) return null; // all months already invoiced

  const now = nowIso();
  const invoiceId = newId();
  const invoiceNumber = `INV-${Date.now()}`;
  const monthlyAmount = Number(base.monthly_amount || 0);

  const nextInv = {
    ...base,
    id: invoiceId,
    invoice_number: invoiceNumber,
    invoice_status: 'draft',
    status: 'draft',
    sent_at: null,
    paid_at: null,
    payment_method: null,
    payment_reference: null,
    payment_received_at: null,
    month_index: nextIndex,
    amount_paid: 0,
    amount_due: monthlyAmount,
    balance_amount: Math.max(0, monthlyAmount * (totalMonths - nextIndex - 1)),
    created_at: now,
    updated_at: now,
  } as unknown as Invoice;

  await repo.createInvoice(nextInv);

  // const items = await repo.listInvoiceItemsByInvoice(base.id);
  // if (items.length) {
  //   const cloned = items.map((it) => ({ ...it, id: newId(), invoice_id: invoiceId, created_at: now }));
  //   await repo.upsertInvoiceItemsForInvoice(invoiceId, cloned);
  // }

  const quotation = await repo.getQuotation(base.quotation_id!);

  if (quotation) {

    await snapshotInvoiceItems(
      invoiceId,
      quotation,
      now,
      {
        type: "monthly",
        monthlyAmount: Number(base.monthly_amount ?? 0),
        totalMonths: Number(base.total_months ?? 1),
        selectedServiceIds:
          base.selected_service_ids ??
          (base.service_id
            ? [base.service_id]
            : []),
      }
    );

  }

  return invoiceId;
}

export async function generateBalanceInvoice(currentInvoice: Invoice): Promise<string | null> {
  if (currentInvoice.type !== 'partial') return null;
  if (!currentInvoice.quotation_id) return null;

  const repo = getRepo();
  const all = await repo.listInvoices();

  // Check if a balance invoice already exists
  const siblings = all.filter((i: Invoice) => i.quotation_id === currentInvoice.quotation_id);
  const alreadyHasBalance = siblings.some((i: Invoice) => (i.type === 'full' && i.created_at > currentInvoice.created_at));
  if (alreadyHasBalance) return null;

  const now = nowIso();
  const invoiceId = newId();
  const invoiceNumber = `INV-${Date.now()}`;

  const balanceAmount = Number(currentInvoice.balance_amount || 0);

  const nextInv: Invoice = {
    ...currentInvoice,
    id: invoiceId,
    invoice_number: invoiceNumber,
    type: 'full', // Finalizing the payment
    invoice_status: 'draft',
    status: 'draft',
    sent_at: null,
    paid_at: null,
    payment_method: null,
    payment_reference: null,
    payment_received_at: null,
    amount_paid: 0,
    amount_due: balanceAmount,
    balance_amount: 0,
    created_at: now,
    updated_at: now,
  } as unknown as Invoice;

  await repo.createInvoice(nextInv);

  // Snapshot a "Balance Payment" item instead of copying all items again, 
  // or copy items but show they are for balance?
  // Use a single line item for clarity on balance invoices usually.
  const balanceItem: InvoiceItem = {
    id: newId(),
    invoice_id: invoiceId,
    quotation_id: currentInvoice.quotation_id,
    service_id: null,
    name: "Balance Payment",
    description: `Remaining balance for Invoice ${currentInvoice.invoice_number}`,
    pricing_model: 'fixed',
    quantity: 1,
    unit_price: balanceAmount,
    total: balanceAmount,
    sort_order: 0,
    created_at: now
  };

  await repo.upsertInvoiceItemsForInvoice(invoiceId, [balanceItem]);

  return invoiceId;
}
