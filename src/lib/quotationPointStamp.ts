import type { QuotationPointTemplate } from "@/lib/quotationPoints";

export type SelectedPointWithMeta = {
  enabled: boolean;
  section: string;
  title: string;
  content: string;
  sort_order: number;
};

export type SelectedPointsWithMeta = Record<string, SelectedPointWithMeta>;

/**
 * Copies section/title/sort_order from templates at save time.
 * Content and enabled state are taken from the current selectedPoints object.
 */
export function stampSelectedPointsWithTemplateMeta(
  templates: QuotationPointTemplate[],
  selectedPoints: Record<string, { enabled?: boolean; content?: string; section?: string; title?: string; sort_order?: number }>,
): SelectedPointsWithMeta {
  // const byKey = new Map(templates.map((t) => [t.key, t]));

  const result: SelectedPointsWithMeta = {};

  // Prefer template keys (so ordering/titles come strictly from templates)
  for (const t of templates) {
    const current = selectedPoints[t.key];
    result[t.key] = {
      enabled: Boolean(current?.enabled),
      content: String(current?.content ?? t.default_content ?? ""),
      section: t.section,
      title: t.title,
      sort_order: Number(t.sort_order ?? 0),
    };
  }

  // Preserve any extra keys (if present) but only if they already have metadata.
  for (const [key, val] of Object.entries(selectedPoints || {})) {
    if (result[key]) continue;
    if (!val) continue;
    if (!val.section || !val.title || typeof val.sort_order !== "number") continue;
    result[key] = {
      enabled: Boolean(val.enabled),
      content: String(val.content ?? ""),
      section: String(val.section),
      title: String(val.title),
      sort_order: Number(val.sort_order),
    };
  }

  return result;
}
