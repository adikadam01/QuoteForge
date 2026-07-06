import type { BrandKit, Client, Contract, Invoice, InvoiceItem, PaymentReceipt, Quotation, Service, WorkflowInvoice } from "@/lib/types";
import type { QuotationPointTemplateRow, RepoSnapshot } from "@/repo/types";

export interface Repository {
  // snapshot utilities
  exportJson(): Promise<RepoSnapshot>;
  importJson(snapshot: RepoSnapshot): Promise<void>;
  clearAll(): Promise<void>;

  // brand kit
  getBrandKit(): Promise<BrandKit | null>;
  upsertBrandKit(kit: BrandKit): Promise<void>;

  // clients
  listClients(): Promise<Client[]>;
  createClient(client: Client): Promise<void>;
  updateClient(client: Client): Promise<void>;
  deleteClient(id: string): Promise<void>;

  // services
  listServices(): Promise<Service[]>;
  listTermsConditions(): Promise<any[]>;
  createService(service: Service): Promise<void>;
  updateService(service: Service): Promise<void>;
  deleteService(id: string): Promise<void>;

  // quotations
  listQuotations(): Promise<Quotation[]>;
  getQuotation(id: string): Promise<Quotation | null>;
  createQuotation(q: Quotation): Promise<void>;
  updateQuotation(q: Quotation): Promise<void>;
  deleteQuotation(id: string): Promise<void>;

  // invoices
  listInvoices(): Promise<Invoice[]>;
  createInvoice(inv: Invoice): Promise<void>;
  updateInvoice(inv: Invoice): Promise<void>;
  deleteInvoice(id: string): Promise<void>;

  // invoice items
  listInvoiceItems(): Promise<InvoiceItem[]>;
  listInvoiceItemsByInvoice(invoiceId: string): Promise<InvoiceItem[]>;
  upsertInvoiceItemsForInvoice(invoiceId: string, items: InvoiceItem[]): Promise<void>;

  // Phase 4 workflow entities
  listContracts(): Promise<Contract[]>;
  createContract(contract: Contract): Promise<void>;
  updateContract(contract: Contract): Promise<void>;

  listWorkflowInvoices(): Promise<WorkflowInvoice[]>;
  createWorkflowInvoice(inv: WorkflowInvoice): Promise<void>;
  updateWorkflowInvoice(inv: WorkflowInvoice): Promise<void>;

  listPaymentReceipts(): Promise<PaymentReceipt[]>;
  createPaymentReceipt(receipt: PaymentReceipt): Promise<void>;

  // receipts
  listReceipts(): Promise<import('@/lib/types').Receipt[]>;
  createReceipt(receipt: import('@/lib/types').Receipt): Promise<void>;

  // client options (business types & industries)
  getClientOptions(): Promise<import("@/lib/types").ClientOptions | null>;
  setClientOptions(options: import("@/lib/types").ClientOptions): Promise<void>;

  // quotation point templates
  listQuotationPointTemplates(): Promise<QuotationPointTemplateRow[]>;
  createQuotationPointTemplate(row: QuotationPointTemplateRow): Promise<void>;
  updateQuotationPointTemplate(row: QuotationPointTemplateRow): Promise<void>;
  updateQuotationPointTemplates(rows: QuotationPointTemplateRow[]): Promise<void>;
  deleteQuotationPointTemplate(id: string): Promise<void>;
}
