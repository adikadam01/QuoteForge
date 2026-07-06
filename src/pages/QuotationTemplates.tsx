import { useEffect, useMemo, useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";

import { SettingsTopMenu } from "@/components/settings/SettingsTopMenu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import type { QuotationPointTemplate, QuotationPointSection } from "@/lib/quotationPoints";
import { newId } from "@/lib/id";
import { nowIso } from "@/lib/dates";

const SECTION_LABELS: Record<QuotationPointSection, string> = {
  introduction: "Introduction",
  scope_of_work: "Scope of Work",
  payment_terms: "Payment Terms",
  terms_conditions: "Terms & Conditions",
};

type DragState = {
  templateId: string;
  section: QuotationPointSection;
} | null;

export default function QuotationTemplates() {
  const { toast } = useToast();
  const {
    quotationPointTemplates,
    refreshQuotationPointTemplates,
    createQuotationPointTemplate,
    updateQuotationPointTemplate,
    updateQuotationPointTemplates,
    deleteQuotationPointTemplate,
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingOrderSection, setSavingOrderSection] = useState<QuotationPointSection | null>(null);
  const [templates, setTemplates] = useState<QuotationPointTemplate[]>([]);
  const [dragging, setDragging] = useState<DragState>(null);

  const setBoxDragImage = (e: React.DragEvent<HTMLElement>) => {
    const node = e.currentTarget;
    const clone = node.cloneNode(true) as HTMLElement;
    clone.style.position = "absolute";
    clone.style.top = "-1000px";
    clone.style.left = "-1000px";
    clone.style.width = `${node.getBoundingClientRect().width}px`;
    clone.style.pointerEvents = "none";
    clone.style.opacity = "0.98";
    document.body.appendChild(clone);

    // Use the clone as drag preview (box-style), then cleanup.
    e.dataTransfer.setDragImage(clone, 16, 16);
    setTimeout(() => {
      clone.remove();
    }, 0);
  };

  const fetchTemplates = async () => {
    setLoading(true);
    await refreshQuotationPointTemplates();
    setLoading(false);
  };

  useEffect(() => {
    void fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTemplates(quotationPointTemplates as unknown as QuotationPointTemplate[]);
  }, [quotationPointTemplates]);

  const grouped = useMemo(() => {
    const map = new Map<QuotationPointSection, QuotationPointTemplate[]>();
    templates.forEach((t) => {
      const sec = t.section;
      map.set(sec, [...(map.get(sec) || []), t]);
    });

    (Array.from(map.entries()) as Array<[QuotationPointSection, QuotationPointTemplate[]]>).forEach(([sec, list]) => {
      map.set(sec, [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
    });

    return map;
  }, [templates]);

  const updateLocal = (id: string, patch: Partial<QuotationPointTemplate>) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const addPointToSection = async (section: QuotationPointSection) => {
    const id = newId();
    const next: QuotationPointTemplate = {
      id,
      section,
      key: `custom_${id.slice(0, 8)}`,
      title: "New point",
      default_content: "",
      sort_order: (grouped.get(section)?.length || 0) + 1,
      is_active: true,
      created_at: nowIso(),
      updated_at: nowIso(),
    };

    try {
      await createQuotationPointTemplate(next as unknown as import("@/repo/types").QuotationPointTemplateRow);
      toast({ title: "Added", description: "Point added." });
    } catch (err) {
      if (import.meta.env.DEV) console.error("Failed to create template", err);
      toast({ title: "Error", description: "Failed to add point", variant: "destructive" });
    }
  };

  const deletePoint = async (id: string) => {
    const ok = window.confirm("Delete this point template? This only affects future quotations.");
    if (!ok) return;
    try {
      await deleteQuotationPointTemplate(id);
      toast({ title: "Deleted", description: "Point removed." });
    } catch (err) {
      if (import.meta.env.DEV) console.error("Failed to delete template", err);
      toast({ title: "Error", description: "Failed to delete point", variant: "destructive" });
    }
  };

  const saveTemplate = async (t: QuotationPointTemplate) => {
    setSavingId(t.id);
    try {
      await updateQuotationPointTemplate({
        id: t.id,
        section: t.section,
        key: t.key,
        title: t.title,
        default_content: t.default_content,
        sort_order: t.sort_order,
        is_active: t.is_active,
        created_at: t.created_at,
        updated_at: new Date().toISOString(),
      });
      toast({ title: "Saved", description: "Template updated" });
      await refreshQuotationPointTemplates();
    } catch (err) {
      if (import.meta.env.DEV) console.error("Failed to update quotation_point_templates", err);
      toast({ title: "Error", description: "Failed to save template", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const reorderWithinSection = (section: QuotationPointSection, draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    const list = grouped.get(section) || [];
    const fromIdx = list.findIndex((t) => t.id === draggedId);
    const toIdx = list.findIndex((t) => t.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;

    const nextList = [...list];
    const [moved] = nextList.splice(fromIdx, 1);
    nextList.splice(toIdx, 0, moved);

    // Re-assign deterministic sort_order (1..n)
    const updated = nextList.map((t, idx) => ({ ...t, sort_order: idx + 1 }));

    setTemplates((prev) =>
      prev.map((t) => {
        const u = updated.find((x) => x.id === t.id);
        return u ? u : t;
      }),
    );
  };

  const persistSectionOrder = async (section: QuotationPointSection) => {
    const list = grouped.get(section) || [];
    if (list.length === 0) return;

    setSavingOrderSection(section);
    try {
      const now = new Date().toISOString();
      await updateQuotationPointTemplates(
        list.map((t) => ({
          id: t.id,
          section: t.section,
          key: t.key,
          title: t.title,
          default_content: t.default_content,
          sort_order: t.sort_order,
          is_active: t.is_active,
          created_at: t.created_at,
          updated_at: now,
        })) as unknown as import("@/repo/types").QuotationPointTemplateRow[],
      );

      toast({ title: "Order saved", description: "Template order updated." });
    } catch (err) {
      if (import.meta.env.DEV) console.error("Failed to save template order", err);
      toast({ title: "Error", description: "Failed to save order", variant: "destructive" });
    } finally {
      setSavingOrderSection(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <SettingsTopMenu />

      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Quotation Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">Drag and drop templates to reorder.</p>
      </div>

      {loading ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <div className="animate-pulse">
            <div className="w-12 h-12 rounded-full bg-primary/20" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {(Array.from(grouped.entries()) as Array<[QuotationPointSection, QuotationPointTemplate[]]>).map(
            ([section, list]) => (
              <Card key={section} className="glass-card">
                <CardHeader className="py-3 flex-row items-center justify-between">
                  <CardTitle className="font-heading text-base">{SECTION_LABELS[section]}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => void addPointToSection(section)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add point
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => void persistSectionOrder(section)}
                      disabled={savingOrderSection === section}
                    >
                      {savingOrderSection === section ? "Saving…" : "Save order"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No templates found for this section.</p>
                  ) : (
                    <Accordion type="multiple" className="w-full space-y-2">
                      {list.map((t) => (
                        <AccordionItem
                          key={t.id}
                          value={t.id}
                          className="border-none"
                          onDragOver={(e) => {
                            if (dragging?.section !== section) return;
                            e.preventDefault();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (!dragging || dragging.section !== section) return;
                            reorderWithinSection(section, dragging.templateId, t.id);
                            setDragging(null);
                          }}
                        >
                          <AccordionTrigger className="hover:no-underline py-1">
                            <div
                              className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/50 px-3 py-2"
                              draggable
                              onDragStart={(e) => {
                                setDragging({ templateId: t.id, section });
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", t.id);
                                setBoxDragImage(e);
                              }}
                              onDragEnd={() => setDragging(null)}
                            >
                              <div className="min-w-0 text-left">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground cursor-grab active:cursor-grabbing" aria-hidden>
                                    <GripVertical className="h-4 w-4" />
                                  </span>
                                  <span className="truncate font-medium">{t.title || "Untitled"}</span>
                                  {!t.is_active ? <Badge variant="secondary">Inactive</Badge> : null}
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent>
                            <div className="space-y-3 pt-2">
                              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                                <div className="space-y-2 flex-1">
                                  <Label>Title</Label>
                                  <Input
                                    value={t.title}
                                    onChange={(e) => updateLocal(t.id, { title: e.target.value })}
                                    className="rounded-xl"
                                  />
                                </div>
                                <div className="flex items-center gap-3 justify-between md:justify-end">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm">Active</Label>
                                    <Switch
                                      checked={t.is_active}
                                      onCheckedChange={(checked) => updateLocal(t.id, { is_active: checked })}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      className="rounded-xl"
                                      onClick={() => void deletePoint(t.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      onClick={() => void saveTemplate(t)}
                                      disabled={savingId === t.id}
                                      className="rounded-xl"
                                    >
                                      {savingId === t.id ? "Saving…" : "Save"}
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Content</Label>
                                <Textarea
                                  value={t.default_content}
                                  onChange={(e) => updateLocal(t.id, { default_content: e.target.value })}
                                  className="min-h-[120px] rounded-xl focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary/40"
                                />
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}
    </div>
  );
}
