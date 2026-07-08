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

  return {
    ...quotation,
    service_blocks: updatedBlocks,
  };
}


export async function getInvoicesForService(
  quotationId: string,
  serviceId: string
) {
  const repo = getRepo();

  const invoices = await repo.listInvoices();
  const items = await repo.listInvoiceItems();

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

) {

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

    default:

      total = 1;

  }

  return {

    generated,

    total,

    completed: generated >= total,

    next: generated + 1,

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


async function snapshotInvoiceItems(
  invoiceId: string,
  quotation: Quotation,
  now: string,
  plan: GenerateInvoicePlan
): Promise<void> {


  const repo = getRepo();

  console.log("========== SNAPSHOT ==========");
  console.log("Quotation:", quotation);

  console.log("service_blocks =", quotation.service_blocks);

  const quoteServices = (quotation.service_blocks || []).filter(service => {

    if (!plan.selectedServiceIds?.length) return true;

    return plan.selectedServiceIds.includes(service.service_id);

  });

  console.log(
    "Selected Services:",
    quoteServices.map(s => s.service_name)
  );

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
      let unitPrice = Number(s.price ?? 0);
      let total = unitPrice;

      // --------------------------
      // Milestone Invoice
      // --------------------------

      if (
        plan.type === "milestone" &&
        s.billing_type === "milestone"
      ) {

        const previousInvoices = await getInvoicesForService(
          quotation.id,
          s.service_id
        );

        const milestoneIndex =
          plan.type === "milestone"
            ? previousInvoices.length
            : 0;

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

      if (
        plan.type === "monthly" &&
        s.billing_type === "monthly"
      ) {

        description =
          `Month 1 of ${s.duration_months}`;

        unitPrice =
          Number(s.monthly_amount ?? 0);

        total = unitPrice;
      }

      return {

        id: newId(),

        invoice_id: invoiceId,

        quotation_id: quotation.id,

        service_id: s.service_id ?? null,

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

  const selectedTotal = selectedServices.reduce(
    (sum, service) => sum + Number(service.price || 0),
    0
  );

  if (plan.type === "full") {
    base.type = "full";
    // base.amount_due = Number(base.total || 0);
    base.total = selectedTotal;
    base.subtotal = selectedTotal;

    base.amount_due = selectedTotal;
    base.balance_amount = 0;
  }

  if (plan.type === "partial") {
    // const total = Number(base.total || 0);
    const total = selectedTotal;

    base.total = total;
    base.subtotal = total;
    const amount = Math.max(0, Math.min(total, Number(plan.amount || 0)));

    base.type = "partial";
    base.amount_due = amount;

    // base.total = selectedTotal;
    // base.subtotal = selectedTotal;

    // base.amount_due = selectedTotal;

    base.balance_amount = Math.max(0, total - amount);
  }

  if (plan.type === "milestone") {

    const ms: InvoiceMilestone[] = plan.milestones.map((m) => ({
      label: (m.label || "").trim() || "Milestone",
      amount: Number(m.amount || 0),
      status: "pending",
    }));

    if (ms.length === 0) {
      throw new Error("Milestones required");
    }

    ms[0].status = "invoiced";

    base.type = "milestone";
    base.milestones = ms;
    base.milestone_index = 0;
    // base.amount_due = Number(ms[0].amount);

    base.total = selectedTotal;
    base.subtotal = selectedTotal;

    base.amount_due = Number(ms[0].amount);

    base.balance_amount =
      Number(base.total || 0) - Number(ms[0].amount);
  }

  if (plan.type === "monthly") {
    const monthlyAmount = Number(plan.monthlyAmount || 0);
    const totalMonths = Math.max(1, Number(plan.totalMonths || 1));

    if (monthlyAmount <= 0) {
      throw new Error("Monthly amount required");
    }

    base.type = "monthly";
    base.monthly_amount = monthlyAmount;
    base.total_months = totalMonths;
    base.month_index = 0;
    // base.amount_due = monthlyAmount;

    base.total = selectedTotal;
    base.subtotal = selectedTotal;

    base.amount_due = monthlyAmount;

    base.balance_amount = Math.max(0, monthlyAmount * totalMonths - monthlyAmount);
  }


  console.log("Creating invoice...");
  await repo.createInvoice(base);

  console.log("Creating invoice items...");
  await snapshotInvoiceItems(
    invoiceId,
    quotation,
    now,
    plan
  );

  console.log("Updating quotation...");
  const updatedQuotation = updateServiceProgress(
    quotation,
    plan.selectedServiceIds ?? []
  );

  // await repo.updateQuotation(updatedQuotation);
  // await updateQuotationStatusIfCompleted(quotation);
  await repo.updateQuotation(updatedQuotation);

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
        selectedServiceIds: [base.service_id!],
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
        selectedServiceIds: [base.service_id!],
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
