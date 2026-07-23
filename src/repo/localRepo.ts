//localRepo.ts

import localforage from "localforage";
import type { Repository } from "@/repo/repository";
import type { RepoSnapshot, QuotationPointTemplateRow } from "@/repo/types";
import type {
  BrandKit,
  Client,
  ClientOptions,
  Contract,
  Invoice,
  InvoiceItem,
  Notification,
  PaymentReceipt,
  Quotation,
  Service,
  WorkflowInvoice,
} from "@/lib/types";

const db = localforage.createInstance({
  name: "agency-quote-maker",
  storeName: "data",
});

const KEY = {
  brandKit: "brandKit",
  clients: "clients",
  services: "services",
  quotations: "quotations",
  invoices: "invoices",
  invoiceItems: "invoiceItems",
  notifications: "notifications",

  // Phase 4 workflow entities
  contracts: "contracts",
  workflowInvoices: "workflowInvoices",
  paymentReceipts: "paymentReceipts",
  receipts: "receipts",

  clientOptions: "clientOptions",
  quotationPointTemplates: "quotationPointTemplates",
} as const;

async function getArray<T>(key: string): Promise<T[]> {
  return ((await db.getItem<T[]>(key)) || []) as T[];
}

async function setArray<T>(key: string, value: T[]): Promise<void> {
  await db.setItem(key, value);
}

// Mutex helper to prevent race conditions during read-modify-write cycles
async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('agency-repo-lock', fn);
  }
  // Fallback for environments without Web Locks API (rare in modern browsers)
  return fn();
}

export function createLocalRepo(): Repository {
  return {
    async exportJson(): Promise<RepoSnapshot> {
      return {
        brandKit: ((await db.getItem(KEY.brandKit)) as BrandKit | null) || null,
        clients: await getArray<Client>(KEY.clients),
        services: await getArray<Service>(KEY.services),
        quotations: await getArray<Quotation>(KEY.quotations),
        invoices: await getArray<Invoice>(KEY.invoices),
        invoiceItems: await getArray<InvoiceItem>(KEY.invoiceItems),
        contracts: await getArray<Contract>(KEY.contracts),
        workflowInvoices: await getArray<WorkflowInvoice>(KEY.workflowInvoices),
        paymentReceipts: await getArray<PaymentReceipt>(KEY.paymentReceipts),
        receipts: await getArray<import('@/lib/types').Receipt>(KEY.receipts),
        clientOptions: ((await db.getItem(KEY.clientOptions)) as ClientOptions | null) || null,
        quotationPointTemplates: await getArray<QuotationPointTemplateRow>(KEY.quotationPointTemplates),
      };
    },

    async importJson(snapshot: RepoSnapshot): Promise<void> {
      return withLock(async () => {
        await db.setItem(KEY.brandKit, snapshot.brandKit);
        await setArray(KEY.clients, snapshot.clients);
        await setArray(KEY.services, snapshot.services);
        await setArray(KEY.quotations, snapshot.quotations);
        await setArray(KEY.invoices, snapshot.invoices);
        await setArray(KEY.invoiceItems, snapshot.invoiceItems);
        await setArray(KEY.contracts, snapshot.contracts || []);
        await setArray(KEY.workflowInvoices, snapshot.workflowInvoices || []);
        await setArray(KEY.paymentReceipts, snapshot.paymentReceipts || []);
        await setArray(KEY.receipts, ("receipts" in snapshot ? (snapshot as unknown as { receipts?: import('@/lib/types').Receipt[] }).receipts : undefined) || []);
        await db.setItem(KEY.clientOptions, snapshot.clientOptions || null);
        await setArray(KEY.quotationPointTemplates, snapshot.quotationPointTemplates);
      });
    },

    async clearAll(): Promise<void> {
      return withLock(async () => {
        await Promise.all(Object.values(KEY).map((k) => db.removeItem(k)));
      });
    },

    async getBrandKit() {
      return ((await db.getItem(KEY.brandKit)) as BrandKit | null) || null;
    },

    async upsertBrandKit(kit: BrandKit) {
      return withLock(async () => {
        await db.setItem(KEY.brandKit, kit);
      });
    },

    async listClients() {
      return await getArray<Client>(KEY.clients);
    },

    async createClient(client: Client) {
      return withLock(async () => {
        const list = await getArray<Client>(KEY.clients);
        await setArray(KEY.clients, [client, ...list]);
      });
    },

    async updateClient(client: Client) {
      return withLock(async () => {
        const list = await getArray<Client>(KEY.clients);
        await setArray(KEY.clients, list.map((c) => (c.id === client.id ? client : c)));
      });
    },

    async deleteClient(id: string) {
      return withLock(async () => {
        const list = await getArray<Client>(KEY.clients);
        await setArray(KEY.clients, list.filter((c) => c.id !== id));
      });
    },

    async getClientOptions() {
      return ((await db.getItem(KEY.clientOptions)) as ClientOptions | null) || null;
    },

    async setClientOptions(options: ClientOptions) {
      return withLock(async () => {
        await db.setItem(KEY.clientOptions, options);
      });
    },

    async listServices() {
      return await getArray<Service>(KEY.services);
    },

    async listTermsConditions() {
      return [];
    },

    async createService(service: Service) {
      return withLock(async () => {
        const list = await getArray<Service>(KEY.services);
        await setArray(KEY.services, [service, ...list]);
      });
    },

    async updateService(service: Service) {
      return withLock(async () => {
        const list = await getArray<Service>(KEY.services);
        await setArray(KEY.services, list.map((s) => (s.id === service.id ? service : s)));
      });
    },

    async deleteService(id: string) {
      return withLock(async () => {
        const list = await getArray<Service>(KEY.services);
        await setArray(KEY.services, list.filter((s) => s.id !== id));
      });
    },

    async listQuotations() {
      return await getArray<Quotation>(KEY.quotations);
    },

    async getQuotation(id: string) {
      const all = await getArray<Quotation>(KEY.quotations);
      return all.find((q) => q.id === id) || null;
    },

    async createQuotation(q: Quotation) {
      return withLock(async () => {
        const list = await getArray<Quotation>(KEY.quotations);
        await setArray(KEY.quotations, [q, ...list]);
      });
    },

    async updateQuotation(q: Quotation) {
      return withLock(async () => {
        const list = await getArray<Quotation>(KEY.quotations);
        await setArray(KEY.quotations, list.map((x) => (x.id === q.id ? q : x)));
      });
    },

    async deleteQuotation(id: string) {
      return withLock(async () => {
        const list = await getArray<Quotation>(KEY.quotations);
        await setArray(KEY.quotations, list.filter((q) => q.id !== id));
      });
    },

    async listInvoices() {
      return await getArray<Invoice>(KEY.invoices);
    },

    async getInvoice(id: string) {
      const all = await getArray<Invoice>(KEY.invoices);
      return all.find((i) => i.id === id) || null;
    },

    async createInvoice(inv: Invoice) {
      return withLock(async () => {
        const list = await getArray<Invoice>(KEY.invoices);
        await setArray(KEY.invoices, [inv, ...list]);
      });
    },

    async updateInvoice(inv: Invoice) {
      return withLock(async () => {
        const list = await getArray<Invoice>(KEY.invoices);
        await setArray(KEY.invoices, list.map((x) => (x.id === inv.id ? inv : x)));
      });
    },

    async deleteInvoice(id: string) {
      return withLock(async () => {
        const list = await getArray<Invoice>(KEY.invoices);
        await setArray(KEY.invoices, list.filter((i) => i.id !== id));
        // also remove invoice items
        const items = await getArray<InvoiceItem>(KEY.invoiceItems);
        await setArray(KEY.invoiceItems, items.filter((it) => it.invoice_id !== id));
      });
    },

    async listInvoiceItems() {
      return await getArray<InvoiceItem>(KEY.invoiceItems);
    },

    async listInvoiceItemsByInvoice(invoiceId: string) {
      const items = await getArray<InvoiceItem>(KEY.invoiceItems);
      return items.filter((it) => it.invoice_id === invoiceId).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    },

    async upsertInvoiceItemsForInvoice(invoiceId: string, items: InvoiceItem[]) {
      return withLock(async () => {
        const all = await getArray<InvoiceItem>(KEY.invoiceItems);
        const kept = all.filter((it) => it.invoice_id !== invoiceId);
        await setArray(KEY.invoiceItems, [...kept, ...items]);
      });
    },

    // Phase 4 workflow entities
    async listContracts() {
      return await getArray<Contract>(KEY.contracts);
    },

    async createContract(contract: Contract) {
      return withLock(async () => {
        const list = await getArray<Contract>(KEY.contracts);
        await setArray(KEY.contracts, [contract, ...list]);
      });
    },

    async updateContract(contract: Contract) {
      return withLock(async () => {
        const list = await getArray<Contract>(KEY.contracts);
        await setArray(KEY.contracts, list.map((c) => (c.id === contract.id ? contract : c)));
      });
    },

    async listWorkflowInvoices() {
      return await getArray<WorkflowInvoice>(KEY.workflowInvoices);
    },

    async createWorkflowInvoice(inv: WorkflowInvoice) {
      return withLock(async () => {
        const list = await getArray<WorkflowInvoice>(KEY.workflowInvoices);
        await setArray(KEY.workflowInvoices, [inv, ...list]);
      });
    },

    async updateWorkflowInvoice(inv: WorkflowInvoice) {
      return withLock(async () => {
        const list = await getArray<WorkflowInvoice>(KEY.workflowInvoices);
        await setArray(KEY.workflowInvoices, list.map((x) => (x.id === inv.id ? inv : x)));
      });
    },

    async listPaymentReceipts() {
      return await getArray<PaymentReceipt>(KEY.paymentReceipts);
    },

    async createPaymentReceipt(receipt: PaymentReceipt) {
      return withLock(async () => {
        const list = await getArray<PaymentReceipt>(KEY.paymentReceipts);
        await setArray(KEY.paymentReceipts, [receipt, ...list]);
      });
    },

    async listReceipts() {
      return await getArray<import('@/lib/types').Receipt>(KEY.receipts);
    },

    async createReceipt(receipt: import('@/lib/types').Receipt) {
      return withLock(async () => {
        const list = await getArray<import('@/lib/types').Receipt>(KEY.receipts);
        await setArray(KEY.receipts, [receipt, ...list]);
      });
    },

    async listNotifications() {
      return await getArray<Notification>(KEY.notifications);
    },

    async markNotificationRead(id: string) {
      return withLock(async () => {
        const list = await getArray<Notification>(KEY.notifications);
        await setArray(
          KEY.notifications,
          list.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      });
    },

    async listQuotationPointTemplates() {
      return await getArray<QuotationPointTemplateRow>(KEY.quotationPointTemplates);
    },

    async createQuotationPointTemplate(row: QuotationPointTemplateRow) {
      return withLock(async () => {
        const list = await getArray<QuotationPointTemplateRow>(KEY.quotationPointTemplates);
        await setArray(KEY.quotationPointTemplates, [row, ...list]);
      });
    },

    async updateQuotationPointTemplate(row: QuotationPointTemplateRow) {
      return withLock(async () => {
        const list = await getArray<QuotationPointTemplateRow>(KEY.quotationPointTemplates);
        await setArray(KEY.quotationPointTemplates, list.map((t) => (t.id === row.id ? row : t)));
      });
    },

    async updateQuotationPointTemplates(rows: QuotationPointTemplateRow[]) {
      return withLock(async () => {
        const list = await getArray<QuotationPointTemplateRow>(KEY.quotationPointTemplates);
        const byId = new Map(rows.map((r) => [r.id, r] as const));
        await setArray(KEY.quotationPointTemplates, list.map((t) => byId.get(t.id) || t));
      });
    },

    async deleteQuotationPointTemplate(id: string) {
      return withLock(async () => {
        const list = await getArray<QuotationPointTemplateRow>(KEY.quotationPointTemplates);
        await setArray(KEY.quotationPointTemplates, list.filter((t) => t.id !== id));
      });
    },
  };
}
