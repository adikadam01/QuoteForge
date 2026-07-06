import type { Quotation } from "@/lib/types";
import type {
  QuotationPointSection,
  QuotationPointTemplate,
  QuotationSelectedPoints,
} from "@/lib/quotationPoints";

export type RenderPoint = {
  key: string;
  title: string;
  content: string;
};

export type RenderSection = {
  section: QuotationPointSection;
  title: string;
  points: RenderPoint[];
};

const SECTION_TITLES: Record<QuotationPointSection, string> = {
  introduction: "Introduction",
  scope_of_work: "Scope of Work",
  payment_terms: "Payment Terms",
  terms_conditions: "Terms & Conditions",
};

export function getSelectedPoints(q: Quotation): QuotationSelectedPoints {
  return (q.selected_points || {}) as unknown as QuotationSelectedPoints;
}

export function buildRenderSections(
  templates: QuotationPointTemplate[],
  quotation: Quotation,
): RenderSection[] {
  const selected = getSelectedPoints(quotation);

  const bySection = new Map<QuotationPointSection, QuotationPointTemplate[]>();
  templates
    .filter((t) => t.is_active)
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .forEach((t) => {
      bySection.set(t.section, [...(bySection.get(t.section) || []), t]);
    });

  const sections: QuotationPointSection[] = [
    "introduction",
    "scope_of_work",
    "payment_terms",
    "terms_conditions",
  ];

  return sections.map((section) => {
    const list = bySection.get(section) || [];
    const points: RenderPoint[] = list
      .filter((t) => selected[t.key]?.enabled)
      .map((t) => ({
        key: t.key,
        title: t.title,
        content: selected[t.key]?.content || "",
      }))
      .filter((p) => p.content.trim().length > 0);

    return {
      section,
      title: SECTION_TITLES[section],
      points,
    };
  });
}
