export type QuotationPointSection =
  | "introduction"
  | "scope_of_work"
  | "payment_terms"
  | "terms_conditions";

export type QuotationPointKey = string;

export type QuotationPointTemplate = {
  id: string;
  section: QuotationPointSection;
  key: QuotationPointKey;
  title: string;
  default_content: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type QuotationSelectedPoint = {
  enabled: boolean;
  content: string;
  // Snapshot metadata (copied from template at save time)
  section?: QuotationPointSection;
  title?: string;
  sort_order?: number;
};

export type QuotationSelectedPoints = Record<QuotationPointKey, QuotationSelectedPoint>;

export function ensureAtLeastOneEnabled(
  templates: QuotationPointTemplate[],
  selected: QuotationSelectedPoints,
  section: QuotationPointSection,
): boolean {
  const keys = templates.filter((t) => t.section === section && t.is_active).map((t) => t.key);
  const enabledCount = keys.filter((k) => selected[k]?.enabled).length;
  return enabledCount > 0;
}
