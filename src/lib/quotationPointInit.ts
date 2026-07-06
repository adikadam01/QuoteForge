import type {
  QuotationPointSection,
  QuotationPointTemplate,
  QuotationSelectedPoints,
} from "@/lib/quotationPoints";

const SECTIONS: QuotationPointSection[] = [
  "introduction",
  "scope_of_work",
  "payment_terms",
  "terms_conditions",
];

/**
 * Initializes selected points so that:
 * - exactly the first active template (by sort_order) per mandatory section is enabled
 * - all other points are disabled
 * - content is seeded from template.default_content
 */
export function initSelectedPointsFromTemplates(
  templates: QuotationPointTemplate[],
): QuotationSelectedPoints {
  const active = templates.filter((t) => t.is_active);
  const sorted = active.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const firstKeyBySection = new Map<QuotationPointSection, string>();
  for (const section of SECTIONS) {
    const first = sorted.find((t) => t.section === section);
    if (first) firstKeyBySection.set(section, first.key);
  }

  const selected: QuotationSelectedPoints = {};
  for (const t of sorted) {
    selected[t.key] = {
      enabled: firstKeyBySection.get(t.section) === t.key,
      content: t.default_content,
      section: t.section,
      title: t.title,
      sort_order: t.sort_order ?? 0,
    };
  }
  return selected;
}

export function validateMandatorySections(
  templates: QuotationPointTemplate[],
  selected: QuotationSelectedPoints,
): { ok: boolean; missing: QuotationPointSection[] } {
  const missing: QuotationPointSection[] = [];
  for (const section of SECTIONS) {
    const keys = templates
      .filter((t) => t.section === section && t.is_active)
      .map((t) => t.key);
    const enabledCount = keys.filter((k) => selected[k]?.enabled).length;
    if (enabledCount <= 0) missing.push(section);
  }
  return { ok: missing.length === 0, missing };
}
