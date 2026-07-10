import type { QuotationSectionsState } from '@/lib/quotationSections';

export type Currency = 'INR' | 'USD';

// Phase 4: keep legacy statuses for backward compatibility, but lifecycle is now linear:
// draft → sent → accepted → invoiced
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'invoiced' | 'declined' | 'expired';

// Service Library pricing models
export type PricingModel = 'fixed' | 'monthly' | 'per_unit' | 'package' | 'custom';

export type ClientSize = 'small' | 'medium' | 'enterprise';

export type TermsCategory = 'payment' | 'delivery' | 'revision' | 'cancellation' | 'ownership' | 'confidentiality' | 'general';

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';

// Invoice lifecycle for the app UI (Phase-1)
export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export interface BrandKit {
  id: string;
  logo_url: string | null;
  company_name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  default_currency: Currency;
}

export type ServiceMilestoneTemplate = { label: string; amount: number };

export interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  subcategory?: string | null;

  /** How this service is billed by default when used in quotations. */
  billing_type?: BillingType;

  /**
   * For one-time: total price
   * For monthly: monthly amount
   */
  base_price: number;

  /** Only for monthly */
  duration_months?: number | null;

  /** Only for milestone billing */
  milestone_template?: ServiceMilestoneTemplate[] | null;

  // Legacy (kept for backward compatibility)
  pricing_model: PricingModel;

  is_active: boolean;
  addons?: ServiceAddon[];

  /** Service-specific scope/terms (used to seed quotation service blocks). */
  scope_of_work?: string | null;
  deliverables?: string | null;
  timeline?: string | null;
  service_terms?: string | null;
  payment_terms?: string | null;
}

export interface ServiceAddon {
  id: string;
  service_id: string;
  name: string;
  price: number;
}

export interface Client {
  id: string;
  /** Contact person */
  name: string;
  email: string | null;
  business_name: string | null;

  /** Legacy field kept for backward compatibility */
  size: ClientSize;

  /** New, canonical business type */
  business_type?: string | null;
  custom_business_type?: string | null;

  industry: string | null;
  custom_industry: string | null;

  phone: string | null;
  whatsapp?: string | null;

  location: string | null;
  address?: string | null;
  gst_number?: string | null;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
}

export type ClientOptions = {
  businessTypes: string[];
  industries: string[];
};

export interface TermsClause {
  id: string;
  title: string;
  content: string;
  category: TermsCategory;
  applicable_service_types: string[] | null;
  applicable_payment_models: string[] | null;
  applicable_client_sizes: string[] | null;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
}

export type BillingType = 'monthly' | 'one_time' | 'package' | 'milestone' | 'retainer';

export interface QuotationService {
  id: string;
  quotation_id: string;
  service_id: string | null;
  service_name: string;
  description: string | null;
  pricing_model: PricingModel;
  /** Per quotation override for how this line is billed */
  billing_type?: BillingType;
  quantity: number;
  unit_price: number;
  total: number;
  is_included: boolean;
  custom_notes: string | null;
  sort_order: number;
  addons?: QuotationServiceAddon[];
}

export interface QuotationServiceAddon {
  id: string;
  quotation_service_id: string;
  addon_id: string | null;
  name: string;
  price: number;
  is_included: boolean;
}

export interface QuotationTerm {
  id: string;
  quotation_id: string;
  terms_clause_id: string | null;
  title: string;
  content: string;
  is_custom: boolean;
  sort_order: number;
}

export type QuotationWizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export type QuotationSectionToggles = {
  introduction: boolean;
  scope_of_work: boolean;
  payment_terms: boolean;
  terms_conditions: boolean;
};

export type QuotationAcceptanceDraft = {
  name: string;
  date: string; // YYYY-MM-DD
  signature_data_url?: string; // optional future
};

export interface Quotation {
  id: string;
  quotation_number: string;
  client_id: string | null;
  title: string;
  introduction: string | null;
  scope_of_work: string | null;
  currency: Currency;
  subtotal: number;
  discount: number;
  discount_type: 'percentage' | 'fixed';
  tax_rate: number;
  tax_amount: number;
  total: number;
  quote_date: string | null; // YYYY-MM-DD
  valid_until: string | null; // YYYY-MM-DD
  status: QuotationStatus;
  sent_at: string | null; // ISO timestamp
  accepted_at: string | null; // ISO timestamp
  accepted_by_name?: string | null;
  invoiced_at?: string | null; // ISO timestamp (locked from edits once invoiced)
  is_template: boolean;
  template_name: string | null;
  notes: string | null;
  payment_terms_text?: string | null;
  terms_conditions_text?: string | null;
  // Wizard metadata (local-first)
  wizard_step?: QuotationWizardStep;

  // Section-level toggles (Step 3)
  section_toggles?: QuotationSectionToggles;
  current_step?: number;

  // Draft acceptance block (Step 5)
  acceptance_draft?: QuotationAcceptanceDraft;

  // legacy section toggles (will be deprecated by point-based system)
  quotation_sections?: QuotationSectionsState | null;

  // point-based system (snapshot metadata stored for deterministic rendering)
  selected_points?: Record<
    string,
    {
      enabled: boolean;
      section?: string;
      title?: string;
      content: string;
      sort_order?: number;
    }
  > | null;
  share_token: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;

  /**
   * Line items used by the current UI (qty/unit_price/total).
   * Kept intact for backward compatibility.
   */
  services?: QuotationService[];

  /**
   * Phase 1 (internal-only): Multi-service quotation blocks.
   *
   * IMPORTANT:
   * - Do not assume this exists for older quotations.
   * - Do not rely on this for current UI rendering yet.
   */
  service_blocks?: import("@/lib/quotationServiceBlocks").QuotationServiceBlock[];

  terms?: QuotationTerm[];
}

export type InvoicePaymentType = 'full' | 'partial' | 'milestone' | 'monthly';
export type InvoiceMilestoneStatus = 'pending' | 'invoiced' | 'paid';
export type InvoiceMilestone = { label: string; amount: number; status: InvoiceMilestoneStatus };

export interface Invoice {
  id: string;
  invoice_number: string;
  quotation_id: string | null;
  client_id: string | null;
  currency: Currency;
  subtotal: number;
  discount: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  amount_due: number;

  // Existing DB column (payment_status) kept for compatibility
  status: PaymentStatus;

  // New app-driven invoice lifecycle status
  invoice_status: InvoiceStatus;
  sent_at: string | null;
  paid_at: string | null;

  // Phase 4 payment mode
  type?: InvoicePaymentType;
  balance_amount?: number;
  milestones?: InvoiceMilestone[];
  milestone_index?: number;
  payment_method?: string | null;
  payment_reference?: string | null;
  payment_received_at?: string | null;
  // Monthly payment mode
  monthly_amount?: number;
  total_months?: number;
  month_index?: number;

  // Audit snapshot (copied from quotation at invoice creation time)
  quotation_selected_points?: Quotation["selected_points"] | null;

  due_date: string | null;
  notes: string | null;
  share_token: string | null;
  created_at: string;
  client?: Client;
  updated_at: string;

  service_id?: string | null;

  /**
   * Used when one invoice contains multiple services.
   */
  selected_service_ids?: string[];
  quotation?: Quotation;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  quotation_id: string | null;
  service_id: string | null;
  name: string;
  description: string | null;
  pricing_model: PricingModel;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
  created_at: string;
}

export interface Receipt {
  id: string;
  receipt_id?: string; // alias
  receipt_number: string;
  invoice_id: string | null;
  client_id: string | null;
  currency: Currency;
  amount: number;
  payment_method: string | null;
  payment_reference?: string | null;
  payment_date: string;
  notes: string | null;
  share_token: string | null;
  created_at: string;
  client?: Client;
  invoice?: Invoice;
}

// =====================================================
// Phase 4 workflow entities (local-first)
// =====================================================

export type ContractStatus = 'draft' | 'sent' | 'signed';

export interface Contract {
  id: string;
  quotation_id: string;
  client_id: string;
  status: ContractStatus;
  content_snapshot: string;
  created_at: string;
}

export type WorkflowInvoiceType = 'advance' | 'final';
export type WorkflowInvoiceStatus = 'draft' | 'sent' | 'paid';

export interface WorkflowInvoice {
  id: string;
  quotation_id: string;
  contract_id: string;
  client_id: string;
  type: WorkflowInvoiceType;
  amount: number;
  status: WorkflowInvoiceStatus;
  created_at: string;
}

export interface PaymentReceipt {
  id: string;
  invoice_id: string;
  client_id: string;
  amount: number;
  payment_date: string;
  created_at: string;
}

export interface AnalyticsData {
  totalQuotations: number;
  sentQuotations: number;
  acceptedQuotations: number;
  conversionRate: number;
  totalRevenue: number;
  averageDealValue: number;
  topServices: { name: string; count: number; revenue: number }[];
}

// Industry options
export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Retail',
  'Manufacturing',
  'Education',
  'Real Estate',
  'Hospitality',
  'Food & Beverage',
  'Entertainment',
  'Marketing & Advertising',
  'Legal',
  'Non-Profit',
  'Other'
] as const;

// Pricing model labels
export const PRICING_MODEL_LABELS: Record<PricingModel, string> = {
  fixed: 'Fixed Project',
  monthly: 'Monthly Retainer',
  per_unit: 'Per Unit',
  package: 'Package',
  custom: 'Custom / Scope-based',
};

// Currency formatting
export const formatCurrency = (amount: number, currency: Currency): string => {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const getCurrencySymbol = (currency: Currency): string => {
  return currency === 'INR' ? '₹' : '$';
};