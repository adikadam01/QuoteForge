// Core quotation framework (content-backed toggles)
export type QuotationSectionKey =
  | "introduction"
  | "scope_of_work"
  | "payment_terms"
  | "terms_conditions";

export type QuotationSectionsState = Record<QuotationSectionKey, boolean>;

export const DEFAULT_QUOTATION_SECTIONS: QuotationSectionsState = {
  introduction: true,
  scope_of_work: true,
  payment_terms: true,
  terms_conditions: true,
};

export const QUOTATION_SECTION_LABELS: Record<QuotationSectionKey, string> = {
  introduction: "Introduction",
  scope_of_work: "Scope of Work",
  payment_terms: "Payment Terms",
  terms_conditions: "Terms & Conditions",
};

export function normalizeQuotationSections(
  input: unknown,
  fallback: QuotationSectionsState = DEFAULT_QUOTATION_SECTIONS,
): QuotationSectionsState {
  if (!input || typeof input !== "object") return { ...fallback };
  const obj = input as Record<string, unknown>;
  const next: Partial<QuotationSectionsState> = {};
  (Object.keys(fallback) as Array<keyof QuotationSectionsState>).forEach((k) => {
    const v = obj[k];
    next[k] = typeof v === "boolean" ? v : fallback[k];
  });
  return next as QuotationSectionsState;
}
