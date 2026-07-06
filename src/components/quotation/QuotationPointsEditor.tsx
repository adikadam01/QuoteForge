import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  QuotationPointSection,
  QuotationPointTemplate,
  QuotationSelectedPoints,
} from "@/lib/quotationPoints";

const SECTION_LABELS: Record<QuotationPointSection, string> = {
  introduction: "Introduction",
  scope_of_work: "Scope of Work",
  payment_terms: "Payment Terms",
  terms_conditions: "Terms & Conditions",
};

type Props = {
  templates: QuotationPointTemplate[];
  selected: QuotationSelectedPoints;
  onChange: (next: QuotationSelectedPoints) => void;
  /** Enforce mandatory: at least one enabled per section. */
  requireOnePerSection?: boolean;
};

export function QuotationPointsEditor({
  templates,
  selected,
  onChange,
  requireOnePerSection = true,
}: Props) {
  const bySection = useMemo(() => {
    const map = new Map<QuotationPointSection, QuotationPointTemplate[]>();
    templates
      .filter((t) => t.is_active)
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .forEach((t) => {
        map.set(t.section, [...(map.get(t.section) || []), t]);
      });
    return map;
  }, [templates]);

  const sectionEnabledCount = (section: QuotationPointSection) => {
    const list = bySection.get(section) || [];
    return list.filter((t) => selected[t.key]?.enabled).length;
  };

  const togglePoint = (key: string, enabled: boolean, section: QuotationPointSection) => {
    if (!enabled && requireOnePerSection) {
      const count = sectionEnabledCount(section);
      if (count <= 1) return; // prevent disabling the last enabled point
    }

    const tpl = (bySection.get(section) || []).find((t) => t.key === key);
    const current = selected[key];

    onChange({
      ...selected,
      [key]: {
        enabled,
        content: current?.content ?? tpl?.default_content ?? "",
        // preserve or seed metadata
        section: current?.section || tpl?.section,
        title: current?.title || tpl?.title,
        sort_order: typeof current?.sort_order === "number" ? current.sort_order : (tpl?.sort_order ?? 0),
      },
    });
  };

  const updateContent = (key: string, content: string) => {
    const current = selected[key];
    onChange({
      ...selected,
      [key]: {
        ...current,
        enabled: Boolean(current?.enabled),
        content,
      },
    });
  };

  return (
    <div className="space-y-6">
      {(Array.from(bySection.entries()) as Array<[QuotationPointSection, QuotationPointTemplate[]]>).map(
        ([section, list]) => (
          <Card key={section} className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading">{SECTION_LABELS[section]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {list.map((t) => {
                const isOn = Boolean(selected[t.key]?.enabled);
                const isLastEnabled = requireOnePerSection && isOn && sectionEnabledCount(section) <= 1;

                return (
                  <div key={t.key} className="p-4 rounded-xl border border-border/50 bg-background/50">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{t.key}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLastEnabled && (
                          <span className="text-xs text-muted-foreground">Required</span>
                        )}
                        <Switch
                          checked={isOn}
                          onCheckedChange={(checked) => togglePoint(t.key, checked, section)}
                        />
                      </div>
                    </div>

                    {isOn && (
                      <div className="mt-3 space-y-2">
                        <Label className="text-sm">Content</Label>
                        <Textarea
                          value={selected[t.key]?.content || ""}
                          onChange={(e) => updateContent(t.key, e.target.value)}
                          className="min-h-[120px]"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ),
      )}
    </div>
  );
}
