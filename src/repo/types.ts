import type {
  BrandKit,
  Client,
  Service,
  Quotation,
  Invoice,
  InvoiceItem,
  Contract,
  WorkflowInvoice,
  PaymentReceipt,
} from "@/lib/types";

export type EntityId = string;

export type RepoSnapshot = {
  brandKit: BrandKit | null;
  clients: Client[];
  services: Service[];
  quotations: Quotation[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];

  // Phase 4 workflow entities
  contracts: Contract[];
  workflowInvoices: WorkflowInvoice[];
  paymentReceipts: PaymentReceipt[];

  // Phase 4 receipts (Invoice payments)
  receipts: import("@/lib/types").Receipt[];

  clientOptions: import("@/lib/types").ClientOptions | null;
  quotationPointTemplates: Array<{
    id: string;
    section: string;
    key: string;
    title: string;
    default_content: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>;
};

export type QuotationPointTemplateRow = RepoSnapshot["quotationPointTemplates"][number];
