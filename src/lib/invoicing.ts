import { getRepo } from "@/repo";
import { newId } from "@/lib/id";
import { nowIso } from "@/lib/dates";
import type { Invoice, InvoiceItem, Quotation } from "@/lib/types";
import { getQuotationTotalsForDisplay } from "@/lib/quotationServiceBlocks";

export type CreateInvoiceResult = {
  invoiceId: string;
};

export async function createInvoiceFromQuotation(quotation: Quotation): Promise<CreateInvoiceResult> {
  if (quotation.status !== "accepted" || !quotation.accepted_at) {
    throw new Error("Only accepted quotations can generate invoices.");
  }

  const repo = getRepo();

  // Prevent duplicates
  const existing = (await repo.listInvoices()).find((i) => i.quotation_id === quotation.id);
  if (existing) return { invoiceId: existing.id };

  const now = nowIso();
  const invoiceId = newId();

  const invoiceNumber = `INV-${Date.now()}`;

  const safeTotals = getQuotationTotalsForDisplay(quotation);

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
    status: "pending",
    invoice_status: "draft",
    sent_at: null,
    paid_at: null,
    due_date: null,
    notes: null,
    share_token: null,
    created_at: now,
    updated_at: now,
  } as unknown as Invoice;

  await repo.createInvoice(inv);

  // Snapshot line items: for now, invoice items are derived from quotation service list if present.
  // In local-first mode, quotations currently store services in quotation.services (optional).
  const quoteServices = quotation.services || [];
  const items: InvoiceItem[] = quoteServices.map((s, idx) => ({
    id: newId(),
    invoice_id: invoiceId,
    quotation_id: quotation.id,
    service_id: s.service_id,
    name: s.service_name,
    description: s.description,
    pricing_model: s.pricing_model,
    quantity: Number(s.quantity || 1),
    unit_price: Number(s.unit_price || 0),
    total: Number(s.total || 0),
    sort_order: idx,
    created_at: now,
  }));

  if (items.length > 0) {
    await repo.upsertInvoiceItemsForInvoice(invoiceId, items);
  }

  // Lock quotation
  await repo.updateQuotation({ ...quotation, invoiced_at: now });

  return { invoiceId };
}
