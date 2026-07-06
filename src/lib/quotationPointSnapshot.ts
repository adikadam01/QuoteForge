import type { Quotation } from "@/lib/types";

export type PointSection = "introduction" | "scope_of_work" | "payment_terms" | "terms_conditions";

export type SelectedPointSnapshot = {
  enabled: boolean;
  content: string;
  // Optional metadata to avoid depending on live templates
  section?: PointSection;
  title?: string;
  sort_order?: number;
};

export type SelectedPointsSnapshot = Record<string, SelectedPointSnapshot>;

const SECTION_TITLES: Record<PointSection, string> = {
  introduction: "Introduction",
  scope_of_work: "Scope of Work",
  payment_terms: "Payment Terms",
  terms_conditions: "Terms & Conditions",
};

export function getSelectedPointsSnapshot(q: Quotation): SelectedPointsSnapshot {
  return (q.selected_points || {}) as unknown as SelectedPointsSnapshot;
}

function inferSection(key: string): PointSection {
  if (key.startsWith("intro.")) return "introduction";
  if (key.startsWith("scope.")) return "scope_of_work";
  if (key.startsWith("pay.")) return "payment_terms";
  if (key.startsWith("tac.")) return "terms_conditions";
  // default
  return "introduction";
}

function inferTitle(key: string): string {
  const raw = key.split(".").slice(1).join(" ") || key;
  const words = raw
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export type RenderPoint = { key: string; title: string; content: string; sort_order: number };
export type RenderSection = { section: PointSection; title: string; points: RenderPoint[] };

export function buildSectionsFromSnapshot(q: Quotation): RenderSection[] {
  const selected = getSelectedPointsSnapshot(q);

  const sections: PointSection[] = [
    "introduction",
    "scope_of_work",
    "payment_terms",
    "terms_conditions",
  ];

  const bySection = new Map<PointSection, RenderPoint[]>();

  Object.entries(selected).forEach(([key, val]) => {
    if (!val?.enabled) return;
    const content = (val.content || "").trim();
    if (!content) return;

    const section = val.section || inferSection(key);
    const title = val.title || inferTitle(key);
    const sort_order = typeof val.sort_order === "number" ? val.sort_order : 999;

    const pt: RenderPoint = { key, title, content, sort_order };
    bySection.set(section, [...(bySection.get(section) || []), pt]);
  });

  return sections.map((section) => {
    const pts = (bySection.get(section) || []).slice().sort((a, b) => a.sort_order - b.sort_order);
    return { section, title: SECTION_TITLES[section], points: pts };
  });
}
