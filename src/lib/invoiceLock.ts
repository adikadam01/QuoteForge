import type { Invoice } from "@/lib/types";

export function isInvoiceEditable(invoice: Invoice | null | undefined): boolean {
  return Boolean(invoice && invoice.invoice_status === "draft");
}

export function assertInvoiceEditable(invoice: Invoice | null | undefined): void {
  if (!invoice) throw new Error("Invoice not loaded");
  if (invoice.invoice_status !== "draft") {
    throw new Error("Invoice is locked. Editing is allowed only in Draft.");
  }
}
