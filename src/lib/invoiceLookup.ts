import { getRepo } from "@/repo";

export async function findInvoiceIdForQuotation(quotationId: string): Promise<string | null> {
  const repo = getRepo();
  const invoices = await repo.listInvoices();
  const inv = invoices.find((i) => i.quotation_id === quotationId);
  return inv?.id || null;
}
