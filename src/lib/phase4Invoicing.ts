import { getRepo } from '@/repo';
import { newId } from '@/lib/id';
import { nowIso } from '@/lib/dates';
import type { Invoice, InvoiceItem, InvoiceMilestone, InvoicePaymentType, PricingModel, Quotation } from '@/lib/types';
import { getQuotationTotalsForDisplay } from '@/lib/quotationServiceBlocks';

export type GenerateInvoicePlan =
  | { type: 'full' }
  | { type: 'partial'; amount: number }
  | { type: 'milestone'; milestones: { label: string; amount: number }[] }
  | { type: 'monthly'; monthlyAmount: number; totalMonths: number };

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
  now: string
): Promise<void> {


  const repo = getRepo();

  console.log("========== SNAPSHOT ==========");
  console.log("Quotation:", quotation);

  console.log("service_blocks =", quotation.service_blocks);

  const quoteServices = quotation.service_blocks || [];

  console.log("quoteServices =", quoteServices);

  const items: InvoiceItem[] = quoteServices.map((s, idx) => ({
    id: newId(),
    invoice_id: invoiceId,
    quotation_id: quotation.id,

    service_id: s.service_id ?? null,

    name: s.service_name ?? "",
    description: s.description ?? "",

    pricing_model: "fixed",

    quantity: 1,

    unit_price: Number(s.price ?? 0),

    total: Number(s.price ?? 0),

    sort_order: idx,

    created_at: now,
  }));

  console.log("Invoice Items =", items);

  if (items.length > 0) {

    console.log("Calling upsertInvoiceItemsForInvoice...");

    await repo.upsertInvoiceItemsForInvoice(invoiceId, items);

    console.log("Finished upsert.");

  } else {

    console.log("NO ITEMS TO SAVE");

  }
}

// export async function generateInvoiceForQuotationPlan(quotation: Quotation, plan: GenerateInvoicePlan): Promise<string> {
//   // Backward compatibility: some older accepted quotations may not have accepted_at populated.
//   if (quotation.status !== 'accepted') {
//     throw new Error('Only accepted quotations can generate invoices.');
//   }

//   const repo = getRepo();
//   const now = nowIso();
//   const invoiceId = newId();

//   const base = buildInvoiceBase(quotation, invoiceId, now);

//   if (plan.type === 'full') {
//     base.type = 'full' satisfies InvoicePaymentType;
//     base.amount_due = Number(base.total || 0);
//     base.balance_amount = 0;
//   }

//   if (plan.type === 'partial') {
//     const total = Number(base.total || 0);
//     const amount = Math.max(0, Math.min(total, Number(plan.amount || 0)));
//     base.type = 'partial' satisfies InvoicePaymentType;
//     base.amount_due = amount;
//     base.balance_amount = Math.max(0, total - amount);
//   }

//   if (plan.type === 'milestone') {
//     const ms: InvoiceMilestone[] = plan.milestones.map((m) => ({
//       label: (m.label || '').trim() || 'Milestone',
//       amount: Number(m.amount || 0),
//       status: 'pending',
//     }));

//     if (ms.length === 0) throw new Error('Milestones required');

//     // First milestone invoice
//     ms[0].status = 'invoiced';

//     base.type = 'milestone' satisfies InvoicePaymentType;
//     base.milestones = ms;
//     base.milestone_index = 0;
//     base.amount_due = Math.max(0, Number(ms[0].amount || 0));
//     base.balance_amount = Math.max(0, Number(base.total || 0) - base.amount_due);
//   }

//   await repo.createInvoice(base);
//   await snapshotInvoiceItems(invoiceId, quotation, now);

//   // Lock quotation after generating any invoice.
//   await repo.updateQuotation({ ...quotation, status: 'invoiced', invoiced_at: quotation.invoiced_at || now });

//   return invoiceId;
// }


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

  if (plan.type === "full") {
    base.type = "full";
    base.amount_due = Number(base.total || 0);
    base.balance_amount = 0;
  }

  if (plan.type === "partial") {
    const total = Number(base.total || 0);
    const amount = Math.max(0, Math.min(total, Number(plan.amount || 0)));

    base.type = "partial";
    base.amount_due = amount;
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
    base.amount_due = monthlyAmount;
    base.balance_amount = Math.max(0, monthlyAmount * totalMonths - monthlyAmount);
  }

  console.log("Creating invoice...");
  await repo.createInvoice(base);

  console.log("Creating invoice items...");
  await snapshotInvoiceItems(invoiceId, quotation, now);

  console.log("Updating quotation...");
  await repo.updateQuotation({
    ...quotation,
    status: "invoiced",
    invoiced_at: quotation.invoiced_at || now,
  });

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
    .filter((i) => i.quotation_id === currentInvoice.quotation_id && i.type === 'milestone')
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const base = siblings[0] || currentInvoice;

  const milestones = (base.milestones || []).map((m) => ({ ...m }));
  const currentIndex = typeof base.milestone_index === 'number' ? base.milestone_index : 0;
  const nextIndex = milestones.findIndex((m, idx) => idx > currentIndex && m.status === 'pending');
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
  const items = await repo.listInvoiceItemsByInvoice(base.id);
  if (items.length) {
    const cloned = items.map((it) => ({ ...it, id: newId(), invoice_id: invoiceId, created_at: now }));
    await repo.upsertInvoiceItemsForInvoice(invoiceId, cloned);
  }

  return invoiceId;
}

export async function generateNextMonthlyInvoice(currentInvoice: Invoice): Promise<string | null> {
  if (currentInvoice.type !== 'monthly') return null;
  if (!currentInvoice.quotation_id) return null;

  const repo = getRepo();
  const all = await repo.listInvoices();

  const siblings = all
    .filter((i) => i.quotation_id === currentInvoice.quotation_id && i.type === 'monthly')
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
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

  const items = await repo.listInvoiceItemsByInvoice(base.id);
  if (items.length) {
    const cloned = items.map((it) => ({ ...it, id: newId(), invoice_id: invoiceId, created_at: now }));
    await repo.upsertInvoiceItemsForInvoice(invoiceId, cloned);
  }

  return invoiceId;
}

export async function generateBalanceInvoice(currentInvoice: Invoice): Promise<string | null> {
  if (currentInvoice.type !== 'partial') return null;
  if (!currentInvoice.quotation_id) return null;

  const repo = getRepo();
  const all = await repo.listInvoices();

  // Check if a balance invoice already exists
  const siblings = all.filter(i => i.quotation_id === currentInvoice.quotation_id);
  const alreadyHasBalance = siblings.some(i => (i.type === 'full' && i.created_at > currentInvoice.created_at));
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
