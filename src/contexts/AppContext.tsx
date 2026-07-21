//AppContext.tsx

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type {
  BrandKit,
  Client,
  ClientOptions,
  Currency,
  Invoice,
  InvoiceItem,
  Notification,
  Quotation,
  Service,
} from "@/lib/types";
import type { QuotationPointTemplateRow } from "@/repo/types";
import { getRepo } from "@/repo";
import { newId } from "@/lib/id";
import { nowIso } from "@/lib/dates";


const [notifications, setNotifications] = useState<Notification[]>([]);

type AppContextType = {
  // Local preferences
  invoiceAutoFromQuotation: boolean;
  setInvoiceAutoFromQuotation: (enabled: boolean) => void;

  // Auth (stubbed for local-only single-user mode)
  user: { id: string; email?: string } | null;
  session: { user: { id: string; email?: string } } | null;
  loading: boolean;
  loadingProgress: number;
  signIn: (email: string, password: string) => Promise<{ error: null | Error }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: null | Error }>;
  signOut: () => Promise<void>;

  currency: Currency;
  setCurrency: (currency: Currency) => Promise<void>;

  // Business Profile (Settings-driven). Backward-compatible with existing BrandKit storage.
  businessProfile: {
    company_name: string;
    logo_url: string | null;
    address: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    document_footer_text: string;
  };
  setBusinessProfile: (profile: AppContextType["businessProfile"]) => Promise<void>;

  documentDefaults: {
    quotation_notes: string;
    invoice_payment_notes: string;
  };
  setDocumentDefaults: (next: AppContextType["documentDefaults"]) => Promise<void>;

  serviceOptions: {
    /** Legacy - kept for backward compatibility */
    default_service_billing_type: "one_time" | "monthly";

    /**
     * Configurable category/subcategory options for the Services page.
     * If not set, Services falls back to built-in defaults.
     */
    service_categories?: Record<string, string[]>;
  };
  createReceipt: (receipt: import('@/lib/types').Receipt) => Promise<void>;
  refreshReceipts: () => Promise<void>;
  receipts: import('@/lib/types').Receipt[];
  setServiceOptions: (next: AppContextType["serviceOptions"]) => Promise<void>;

  // Legacy BrandKit (kept for existing rendering paths; sourced from Business Profile where applicable)
  brandKit: BrandKit | null;
  setBrandKit: (kit: BrandKit) => Promise<void>;
  refreshBrandKit: () => Promise<void>;

  notifications: Notification[];
  refreshNotifications: () => Promise<void>;
  services: Service[];
  addService: (service: Omit<Service, "id" | "created_at">) => Promise<void>;
  termsConditions: any[];
  updateService: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  refreshServices: () => Promise<void>;

  clients: Client[];
  clientOptions: ClientOptions;
  setClientOptions: (options: ClientOptions) => Promise<void>;
  addClient: (client: Omit<Client, "id" | "created_at" | "is_deleted" | "deleted_at">) => Promise<string | null>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  refreshClients: () => Promise<void>;

  quotations: Quotation[];
  addQuotation: (
    quotation: Omit<Quotation, "id" | "created_at" | "updated_at" | "client">,
  ) => Promise<string | null>;
  updateQuotation: (quotation: Quotation) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;
  refreshQuotations: () => Promise<void>;
  getQuotationById: (id: string) => Quotation | undefined;

  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  refreshInvoices: () => Promise<void>;
  refreshInvoiceItems: () => Promise<void>;

  updateInvoice: (invoice: Invoice) => Promise<void>;
  listInvoiceItemsByInvoice: (invoiceId: string) => InvoiceItem[];
  getInvoiceById: (id: string) => Invoice | undefined;

  quotationPointTemplates: QuotationPointTemplateRow[];
  refreshQuotationPointTemplates: () => Promise<void>;
  createQuotationPointTemplate: (row: QuotationPointTemplateRow) => Promise<void>;
  updateQuotationPointTemplate: (row: QuotationPointTemplateRow) => Promise<void>;
  updateQuotationPointTemplates: (rows: QuotationPointTemplateRow[]) => Promise<void>;
  deleteQuotationPointTemplate: (id: string) => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const repo = useMemo(() => getRepo(), []);

  // Local single-user session stub
  const [user] = useState<AppContextType["user"]>({ id: "local-user", email: "local@user" });
  const [session] = useState<AppContextType["session"]>({ user: { id: "local-user", email: "local@user" } });

  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [brandKit, setBrandKitState] = useState<BrandKit | null>(null);
  const [currency, setCurrencyState] = useState<Currency>("INR");

  const LS_KEYS = {
    businessProfile: "qf_business_profile_v1",
    documentDefaults: "qf_document_defaults_v1",
    serviceOptions: "qf_service_options_v1",
  } as const;

  const [businessProfile, setBusinessProfileState] = useState<AppContextType["businessProfile"]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.businessProfile);
      if (raw) return JSON.parse(raw) as AppContextType["businessProfile"];
    } catch {
      // ignore
    }
    return {
      company_name: "Triple S Production",
      logo_url: null,
      address: null,
      email: null,
      phone: null,
      whatsapp: null,
      document_footer_text: "",
    };
  });

  const [documentDefaults, setDocumentDefaultsState] = useState<AppContextType["documentDefaults"]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.documentDefaults);
      if (raw) return JSON.parse(raw) as AppContextType["documentDefaults"];
    } catch {
      // ignore
    }
    return {
      quotation_notes: "",
      invoice_payment_notes: "",
    };
  });

  const [serviceOptions, setServiceOptionsState] = useState<AppContextType["serviceOptions"]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.serviceOptions);
      if (raw) return JSON.parse(raw) as AppContextType["serviceOptions"];
    } catch {
      // ignore
    }
    return {
      default_service_billing_type: "one_time",
      service_categories: undefined,
    };
  });

  const [clients, setClients] = useState<Client[]>([]);
  useEffect(() => {
    // console.log("CLIENTS STATE =", clients);
  }, [clients]);

  const DEFAULT_CLIENT_OPTIONS: ClientOptions = {
    businessTypes: ["Startup", "Brand", "Local Shop", "Agency", "MNC", "Freelancer", "Other"],
    industries: [
      "Fashion / Apparel",
      "E-commerce",
      "Restaurant / Cafe",
      "Real Estate",
      "Education",
      "Healthcare",
      "Manufacturing",
      "Services",
      "Influencer / Creator",
      "Technology / SaaS",
      "Other",
    ],
  };

  const [clientOptions, setClientOptionsState] = useState<ClientOptions>(DEFAULT_CLIENT_OPTIONS);
  const [services, setServices] = useState<Service[]>([]);
  const [termsConditions, setTermsConditions] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [receipts, setReceipts] = useState<import('@/lib/types').Receipt[]>([]);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [quotationPointTemplates, setQuotationPointTemplates] = useState<QuotationPointTemplateRow[]>([]);

  const [invoiceAutoFromQuotation, setInvoiceAutoFromQuotationState] = useState<boolean>(() => {
    try {
      return localStorage.getItem("qf_invoice_auto_from_quotation") === "1";
    } catch {
      return false;
    }
  });

  const setInvoiceAutoFromQuotation = (enabled: boolean) => {
    setInvoiceAutoFromQuotationState(enabled);
    try {
      localStorage.setItem("qf_invoice_auto_from_quotation", enabled ? "1" : "0");
    } catch {
      // ignore
    }
  };

  const migrateBusinessProfileFromBrandKit = (kit: BrandKit): AppContextType["businessProfile"] => {
    // Keep deterministic defaults; no data loss.
    return {
      company_name: kit.company_name || "Triple S Production",
      logo_url: kit.logo_url || null,
      address: kit.address || null,
      email: kit.email || null,
      phone: kit.phone || null,
      whatsapp: null,
      document_footer_text: "",
    };
  };

  const setBusinessProfile: AppContextType["setBusinessProfile"] = async (profile) => {
    const next = {
      ...profile,
      company_name: (profile.company_name || "").trim() || "Triple S Production",
    };

    setBusinessProfileState(next);
    try {
      localStorage.setItem(LS_KEYS.businessProfile, JSON.stringify(next));
    } catch {
      // ignore
    }

    // Backward compatibility: keep BrandKit updated for existing renderers.
    if (brandKit) {
      await setBrandKit({
        ...brandKit,
        company_name: next.company_name,
        logo_url: next.logo_url,
        address: next.address,
        email: next.email,
        phone: next.phone,
      } as BrandKit);
    }
  };

  const setDocumentDefaults: AppContextType["setDocumentDefaults"] = async (next) => {
    setDocumentDefaultsState(next);
    try {
      localStorage.setItem(LS_KEYS.documentDefaults, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const setServiceOptions: AppContextType["setServiceOptions"] = async (next) => {
    setServiceOptionsState(next);
    try {
      localStorage.setItem(LS_KEYS.serviceOptions, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const refreshBrandKit = async () => {
    const existing = await repo.getBrandKit();
    if (existing) {
      setBrandKitState(existing);
      setCurrencyState(existing.default_currency as Currency);

      // If no business profile saved yet, seed from BrandKit for backward compatibility.
      try {
        if (!localStorage.getItem(LS_KEYS.businessProfile)) {
          const migrated = migrateBusinessProfileFromBrandKit(existing);
          setBusinessProfileState(migrated);
          localStorage.setItem(LS_KEYS.businessProfile, JSON.stringify(migrated));
        }
      } catch {
        // ignore
      }

      return;
    }

    const kit: BrandKit = {
      id: newId(),
      company_name: businessProfile.company_name || "Triple S Production",
      logo_url: businessProfile.logo_url || null,
      primary_color: "#111827",
      secondary_color: null,
      font_heading: "Montserrat",
      font_body: "Inter",
      website: null,
      email: businessProfile.email || null,
      phone: businessProfile.phone || null,
      address: businessProfile.address || null,
      default_currency: currency,
      created_at: nowIso(),
      updated_at: nowIso(),
    } as unknown as BrandKit;

    await repo.upsertBrandKit(kit);
    setBrandKitState(kit);
  };

  const setBrandKit = async (kit: BrandKit) => {
    const next = { ...kit, updated_at: nowIso() } as BrandKit;
    await repo.upsertBrandKit(next);
    setBrandKitState(next);
  };

  const setCurrency = async (c: Currency) => {
    setCurrencyState(c);
    if (brandKit) {
      await setBrandKit({ ...brandKit, default_currency: c } as BrandKit);
    }
  };

  const normalizeClientOptions = (options: ClientOptions): ClientOptions => {
    const normalizeList = (items: string[]) => Array.from(new Set(items.map((s) => s.trim()).filter(Boolean)));

    const bt = normalizeList(options.businessTypes || []);
    const ind = normalizeList(options.industries || []);

    return {
      businessTypes: bt.includes("Other") ? bt : [...bt, "Other"],
      industries: ind.includes("Other") ? ind : [...ind, "Other"],
    };
  };

  const refreshClientOptions = async () => {
    const options = await repo.getClientOptions();
    if (options) {
      setClientOptionsState(normalizeClientOptions(options));
    } else {
      await repo.setClientOptions(DEFAULT_CLIENT_OPTIONS);
      setClientOptionsState(DEFAULT_CLIENT_OPTIONS);
    }
  };

  const setClientOptions = async (options: ClientOptions) => {
    const normalized = normalizeClientOptions(options);

    // Persist first (IndexedDB is source of truth)
    await repo.setClientOptions(normalized);

    // Force re-read from repo after write
    const stored = await repo.getClientOptions();
    const nextOptions = stored ? normalizeClientOptions(stored) : normalized;
    setClientOptionsState(nextOptions);

    // IMPORTANT: do not rewrite client rows when options change.
    // If a client uses a deleted option, we keep the stored value and render it as "Archived" in the UI.
    await refreshClients();
  };

  // const refreshClients = async () => {
  //   const list = await repo.listClients();
  //   setClients(list.filter((c) => !c.is_deleted));
  // };

  const refreshClients = async () => {

    // console.log("REFRESH CLIENTS START");

    const list = await repo.listClients();

    // console.log("CLIENTS FROM API =", list);

    const filtered = list.filter((c) => !c.is_deleted);

    // console.log("FILTERED CLIENTS =", filtered);

    setClients(filtered);

    // console.log("CLIENTS STATE UPDATED");
  };

  const addClient: AppContextType["addClient"] = async (client) => {
    const id = newId();
    const now = nowIso();
    const row: Client = {
      ...client,
      id,
      created_at: now,
      is_deleted: false,
      deleted_at: null,
    } as Client;

    await repo.createClient(row);
    await refreshClients();
    return id;
  };

  const updateClient = async (client: Client) => {
    await repo.updateClient(client);
    await refreshClients();
  };

  // const deleteClient = async (id: string) => {
  //   const c = clients.find((x) => x.id === id);
  //   if (!c) return;
  //   await repo.updateClient({ ...c, is_deleted: true, deleted_at: nowIso() });
  //   await refreshClients();
  // };

  const deleteClient = async (id: string) => {
    await repo.deleteClient(id);
    await refreshClients();
  };

  const refreshServices = async () => {
    const list = await repo.listServices();
    setServices(list.filter((s) => s.is_active));
  };

  // const refreshTermsConditions = async () => {
  //     const list = await repo.listTermsConditions();
  //     setTermsConditions(list);
  // };


  const refreshTermsConditions = async () => {
    try {
      const list = await repo.listTermsConditions();

      // console.log("TERMS LOADED", list);

      setTermsConditions(list);
    } catch (err) {
      // console.error("FAILED TO LOAD TERMS", err);
    }
  };
  const addService: AppContextType["addService"] = async (service) => {
    const now = nowIso();
    const row: Service = {
      ...service,
      id: newId(),
      created_at: now,
      addons: service.addons || [],
    } as Service;

    await repo.createService(row);
    await refreshServices();
  };

  const updateService = async (service: Service) => {
    await repo.updateService(service);
    await refreshServices();
  };

  const deleteService = async (id: string) => {
    const s = services.find((x) => x.id === id);
    if (!s) return;
    await repo.updateService({ ...s, is_active: false });
    await refreshServices();
  };

  // const refreshQuotations = async () => {
  //   const list = await repo.listQuotations();
  //   // hydrate client relation for UI convenience
  //   const byClientId = new Map(clients.map((c) => [c.id, c]));
  //   setQuotations(
  //     list.map((q) => ({
  //       ...q,
  //       status: ((q as Quotation).status || 'draft') as Quotation['status'],
  //       client: q.client_id ? byClientId.get(q.client_id) : undefined,
  //     })),
  //   );
  // };

  const refreshQuotations = async () => {

    const [list, clientList] = await Promise.all([
      repo.listQuotations(),
      repo.listClients(),
    ]);

    const byClientId = new Map(
      clientList.map((c) => [c.id, c])
    );



    setQuotations(
      list.map((q) => ({
        ...q,
        status: ((q as Quotation).status || 'draft') as Quotation['status'],
        client: q.client_id
          ? byClientId.get(q.client_id)
          : undefined,
      }))
    );
  };

  const addQuotation: AppContextType["addQuotation"] = async (quotation) => {

    const id = newId();
    const now = nowIso();
    const row: Quotation = {
      ...quotation,
      id,
      created_at: now,
      updated_at: now,
    } as Quotation;

    // console.log("ROW =", row);

    // for (const [key, value] of Object.entries(row)) {
    //   try {
    //     JSON.stringify(value);
    //   } catch {
    //     console.error("❌ Circular field:", key, value);
    //   }
    // }

    await repo.createQuotation(row);
    await refreshQuotations();
    return id;
  };

  // const updateQuotation = async (quotation: Quotation) => {
  //   // keep funnel timestamps
  //   const now = nowIso();
  //   const sent_at = quotation.status === "sent" ? quotation.sent_at || now : quotation.sent_at || null;
  //   const accepted_at = quotation.status === "accepted" ? quotation.accepted_at || now : quotation.accepted_at || null;

  //   const next = { ...quotation, sent_at, accepted_at, updated_at: now } as Quotation;
  //   await repo.updateQuotation(next);
  //   await refreshQuotations();

  //   // Contract automation removed for now (Phase 4 scope).
  // };


  const updateQuotation = async (quotation: Quotation) => {
    const now = nowIso();
    const sent_at = quotation.status === "sent" ? quotation.sent_at || now : quotation.sent_at || null;
    const accepted_at = quotation.status === "accepted" ? quotation.accepted_at || now : quotation.accepted_at || null;

    const next = { ...quotation, sent_at, accepted_at, updated_at: now } as Quotation;
    await repo.updateQuotation(next);
    await refreshQuotations();

    // Clear draft pointer if this quotation moved past draft stage
    if (quotation.status !== 'draft') {
      try {
        const storedId = localStorage.getItem('currentDraftId');
        if (storedId === quotation.id) {
          localStorage.removeItem('currentDraftId');
        }
      } catch { /* ignore */ }
    }
  };


  const deleteQuotation = async (id: string) => {
    await repo.deleteQuotation(id);
    await refreshQuotations();
  };

  const getQuotationById = (id: string) => quotations.find((q) => q.id === id);

  // const refreshInvoices = async () => {
  //   const list = await repo.listInvoices();
  //   setInvoices(list);
  // };

  const refreshInvoices = async () => {
    const [invoiceList, quotationList, clientList] = await Promise.all([
      repo.listInvoices(),
      repo.listQuotations(),
      repo.listClients(),
    ]);

    const quotationMap = new Map(
      quotationList.map((q) => [q.id, q])
    );

    const clientMap = new Map(
      clientList.map((c) => [c.id, c])
    );

    setInvoices(
      invoiceList.map((invoice) => ({
        ...invoice,
        quotation: invoice.quotation_id
          ? quotationMap.get(invoice.quotation_id)
          : undefined,
        client: invoice.client_id
          ? clientMap.get(invoice.client_id)
          : undefined,
      }))
    );
  };

  const refreshInvoiceItems = async () => {
    const list = await repo.listInvoiceItems();
    setInvoiceItems(list);
  };

  const refreshReceipts = async () => {
    const list = await repo.listReceipts();
    setReceipts(list);
  };

  const refreshNotifications = async () => {
    const list = await repo.listNotifications();
    setNotifications(list);
  };

  const createReceipt = async (receipt: import('@/lib/types').Receipt) => {
    await repo.createReceipt(receipt);
    await refreshReceipts();
  };

  const updateInvoice = async (invoice: Invoice) => {
    await repo.updateInvoice(invoice);
    await refreshInvoices();
    await refreshNotifications();
  };

  const listInvoiceItemsByInvoice = (invoiceId: string) =>
    invoiceItems
      .filter((it) => it.invoice_id === invoiceId)
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const getInvoiceById = (id: string) => invoices.find((i) => i.id === id);

  // const refreshQuotationPointTemplates = async () => {
  //   let list = await repo.listQuotationPointTemplates();
  //   if (list.length === 0) {
  //     const { makeDefaultPointTemplates } = await import('@/lib/defaultPointTemplates');
  //     list = makeDefaultPointTemplates();
  //     // seed
  //     await repo.importJson({
  //       ...(await repo.exportJson()),
  //       quotationPointTemplates: list,
  //     });
  //   }
  //   setQuotationPointTemplates(list);
  // };

  const refreshQuotationPointTemplates = async () => {
    try {
      const list = await repo.listQuotationPointTemplates();
      setQuotationPointTemplates(list);
    } catch (err) {
      console.warn("Quotation templates unavailable", err);
      setQuotationPointTemplates([]);
    }
  };

  const createQuotationPointTemplate = async (row: QuotationPointTemplateRow) => {
    await repo.createQuotationPointTemplate(row);
    await refreshQuotationPointTemplates();
  };

  const updateQuotationPointTemplate = async (row: QuotationPointTemplateRow) => {
    await repo.updateQuotationPointTemplate(row);
    await refreshQuotationPointTemplates();
  };

  const updateQuotationPointTemplates = async (rows: QuotationPointTemplateRow[]) => {
    await repo.updateQuotationPointTemplates(rows);
    await refreshQuotationPointTemplates();
  };

  const deleteQuotationPointTemplate = async (id: string) => {
    await repo.deleteQuotationPointTemplate(id);
    await refreshQuotationPointTemplates();
  };

  // Auth stubs
  const signIn = async () => ({ error: null });
  const signUp = async () => ({ error: null });
  const signOut = async () => { };

  useEffect(() => {
    (async () => {
      const tasks = [
        refreshBrandKit(),
        refreshClientOptions(),
        refreshClients(),
        refreshServices(),
        refreshQuotations(),
        refreshTermsConditions(),
        refreshInvoices(),
        refreshInvoiceItems(),
        refreshReceipts(),
        refreshQuotationPointTemplates(),
        refreshNotifications(),
      ];

      const total = tasks.length;
      let completed = 0;

      setLoadingProgress(0);

      try {
        await Promise.all(
          tasks.map((task) =>
            task
              .catch((err) => {
                if (import.meta.env.DEV) console.error("Startup task failed", err);
              })
              .finally(() => {
                completed += 1;
                setLoadingProgress(Math.round((completed / total) * 100));
              })
          )
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        session,
        loading,
        loadingProgress,
        signIn,
        signUp,
        signOut,
        currency,
        setCurrency,
        termsConditions,

        businessProfile,
        setBusinessProfile,
        documentDefaults,
        setDocumentDefaults,
        serviceOptions,
        setServiceOptions,

        brandKit,
        setBrandKit,
        refreshBrandKit,
        services,
        addService,
        updateService,
        deleteService,
        refreshServices,
        clients,
        clientOptions,
        setClientOptions,
        addClient,
        updateClient,
        deleteClient,
        refreshClients,
        quotations,
        addQuotation,
        updateQuotation,
        deleteQuotation,
        refreshQuotations,
        getQuotationById,
        invoices,
        invoiceItems,
        receipts,
        refreshInvoices,
        refreshInvoiceItems,
        refreshReceipts,
        createReceipt,
        updateInvoice,
        listInvoiceItemsByInvoice,
        getInvoiceById,

        invoiceAutoFromQuotation,
        setInvoiceAutoFromQuotation,
        quotationPointTemplates,
        refreshQuotationPointTemplates,
        createQuotationPointTemplate,
        updateQuotationPointTemplate,
        updateQuotationPointTemplates,
        deleteQuotationPointTemplate,

        notifications,
        refreshNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
}
