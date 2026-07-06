import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import type { PricingModel, Quotation } from "@/lib/types";
import type { QuotationPointTemplate, QuotationSelectedPoints } from "@/lib/quotationPoints";
import { QuotationPointsEditor } from "@/components/quotation/QuotationPointsEditor";
import { initSelectedPointsFromTemplates, validateMandatorySections } from "@/lib/quotationPointInit";
import { stampSelectedPointsWithTemplateMeta } from "@/lib/quotationPointStamp";

export default function QuotationEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    clients,
    services,
    currency,
    quotationPointTemplates,
    refreshQuotations,
    getQuotationById,
    updateQuotation,
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<Quotation | null>(null);

  const [templates, setTemplates] = useState<QuotationPointTemplate[]>([]);
  const [usePointSystem, setUsePointSystem] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState<QuotationSelectedPoints>({});

  const [formData, setFormData] = useState({
    title: "",
    client_id: "",
    notes: "",
    quote_date: "",
    valid_until: "",
    status: "draft" as Quotation["status"],
  });

  // Local-only line items stored on quotation.services
  const [lineItems, setLineItems] = useState<
    Array<{
      service_id: string;
      service_name: string;
      description: string | null;
      pricing_model: PricingModel;
      quantity: number;
      unit_price: number;
      total: number;
      sort_order: number;
    }>
  >([]);

  useEffect(() => {
    const list = (quotationPointTemplates || []) as unknown as QuotationPointTemplate[];
    setTemplates(list.filter((t) => t.is_active));
  }, [quotationPointTemplates]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await refreshQuotations();
        const q = getQuotationById(id);
        if (cancelled) return;

        if (!q) {
          setQuotation(null);
          return;
        }

        setQuotation(q);

        setFormData({
          title: q.title || "",
          client_id: q.client_id || "",
          notes: q.notes || "",
          quote_date: q.quote_date || "",
          valid_until: q.valid_until || "",
          status: q.status,
        });

        setLineItems(
          (q.services || []).map((s, idx) => ({
            service_id: s.service_id || "",
            service_name: s.service_name,
            description: s.description,
            pricing_model: s.pricing_model,
            quantity: Number(s.quantity || 1),
            unit_price: Number(s.unit_price || 0),
            total: Number(s.total || 0),
            sort_order: idx,
          })),
        );

        if (q.selected_points) {
          setUsePointSystem(true);
          setSelectedPoints(q.selected_points as unknown as QuotationSelectedPoints);
        } else {
          setUsePointSystem(false);
          setSelectedPoints({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, it) => sum + Number(it.total || 0), 0);
  }, [lineItems]);

  const validatePointSystem = () => {
    if (!usePointSystem) return true;
    const v = validateMandatorySections(templates, selectedPoints);
    if (!v.ok) {
      toast({
        title: "Select at least 1 point per section",
        description: `Missing: ${v.missing.join(", ")}`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!quotation) return;
    if (quotation.invoiced_at || quotation.status === 'accepted') {
      toast({
        title: "Locked",
        description: "This quotation has already been invoiced and can no longer be edited.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Please enter a title", variant: "destructive" });
      return;
    }

    if (!validatePointSystem()) return;

    try {
      const next: Quotation = {
        ...quotation,
        title: formData.title,
        client_id: formData.client_id || null,
        notes: formData.notes || null,
        quote_date: formData.quote_date || null,
        valid_until: formData.valid_until || null,
        status: formData.status,
        currency: quotation.currency || currency,
        selected_points: usePointSystem
          ? stampSelectedPointsWithTemplateMeta(templates, selectedPoints)
          : quotation.selected_points ?? null,
        subtotal,
        total: subtotal,
        // Phase 1 internal-only: keep a single default service block in sync.
        service_blocks: [
          {
            service_id: "default",
            service_name: formData.title || quotation.title || "Service",
            description: quotation.introduction || "",
            scope_of_work: quotation.scope_of_work || "",
            deliverables: "",
            timeline: "",
            price: subtotal,
            payment_terms: quotation.payment_terms_text || undefined,
            service_terms: quotation.terms_conditions_text || undefined,
          },
        ],
        services: lineItems.map((it, idx) => ({
          id: `${quotation.id}-${it.service_id}`,
          quotation_id: quotation.id,
          service_id: it.service_id,
          service_name: it.service_name,
          description: it.description,
          pricing_model: it.pricing_model,
          quantity: it.quantity,
          unit_price: it.unit_price,
          total: it.total,
          is_included: true,
          custom_notes: null,
          sort_order: idx,
          created_at: quotation.created_at,
        })),
      };

      await updateQuotation(next);
      toast({ title: "Saved", description: "Quotation updated" });
      navigate(`/quotations/${quotation.id}/preview`);
    } catch (err) {
      if (import.meta.env.DEV) console.error("Quotation update failed", err);
      toast({ title: "Error", description: "Failed to update quotation", variant: "destructive" });
    }
  };

  if (!id) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Invalid quotation.</p>
        <Button onClick={() => navigate("/quotations")}>Back</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 rounded-full bg-primary/20"></div>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Quotation not found.</p>
        <Button onClick={() => navigate("/quotations")}>Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/quotations/${quotation.id}/preview`}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Edit Quotation</h1>
            {quotation.invoiced_at ? (
              <p className="text-muted-foreground mt-1">Locked (already invoiced)</p>
            ) : (
              <p className="text-muted-foreground mt-1">Update quotation details</p>
            )}
          </div>
        </div>
        <Button className="gap-2 rounded-xl" onClick={handleSave} disabled={Boolean(quotation.invoiced_at)}>
          <Save className="w-4 h-4" /> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Quotation Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Client</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} {client.business_name && `- ${client.business_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quotation Date</Label>
                  <Input
                    type="date"
                    value={formData.quote_date}
                    onChange={(e) => setFormData({ ...formData, quote_date: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as Quotation["status"] })
                  }
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  disabled={Boolean(quotation.invoiced_at)}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                  <option value="declined">Declined</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="min-h-[100px] rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading">Quotation Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {usePointSystem ? (
                <QuotationPointsEditor
                  templates={templates}
                  selected={selectedPoints}
                  onChange={setSelectedPoints}
                  requireOnePerSection
                />
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    This quotation uses the legacy content fields. To keep existing quotations unchanged, the point framework is not enabled automatically.
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      if (templates.length === 0) {
                        toast({
                          title: "Templates not loaded",
                          description: "Cannot enable point framework yet.",
                          variant: "destructive",
                        });
                        return;
                      }
                      setSelectedPoints(initSelectedPointsFromTemplates(templates));
                      setUsePointSystem(true);
                    }}
                    disabled={Boolean(quotation.invoiced_at)}
                  >
                    Enable point framework for this quotation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading">Services & Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              {services.length > 0 ? (
                <div className="space-y-2">
                  {services.filter((s) => s.is_active).map((service) => {
                    const checked = lineItems.some((it) => it.service_id === service.id);
                    return (
                      <label
                        key={service.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setLineItems((prev) => [
                                ...prev,
                                {
                                  service_id: service.id,
                                  service_name: service.name,
                                  description: service.description,
                                  pricing_model: service.pricing_model,
                                  quantity: 1,
                                  unit_price: service.base_price,
                                  total: service.base_price,
                                  sort_order: prev.length,
                                },
                              ]);
                            } else {
                              setLineItems((prev) => prev.filter((it) => it.service_id !== service.id));
                            }
                          }}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{service.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(quotation.currency === "INR" ? "₹" : "$")}{service.base_price.toLocaleString()}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No services available.</p>
              )}

              {lineItems.length > 0 && (
                <div className="mt-4 space-y-3">
                  {lineItems.map((it) => (
                    <div key={it.service_id} className="p-3 rounded-xl border border-border/50">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium text-foreground">{it.service_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(quotation.currency === "INR" ? "₹" : "$")}{it.total.toLocaleString()}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            value={it.quantity}
                            min={0}
                            onChange={(e) => {
                              const qty = Number(e.target.value);
                              setLineItems((prev) =>
                                prev.map((x) =>
                                  x.service_id === it.service_id
                                    ? { ...x, quantity: qty, total: qty * x.unit_price }
                                    : x,
                                ),
                              );
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Unit price</Label>
                          <Input
                            type="number"
                            value={it.unit_price}
                            min={0}
                            onChange={(e) => {
                              const unit = Number(e.target.value);
                              setLineItems((prev) =>
                                prev.map((x) =>
                                  x.service_id === it.service_id
                                    ? { ...x, unit_price: unit, total: x.quantity * unit }
                                    : x,
                                ),
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-border/50 mt-4 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-heading font-semibold text-foreground">
                    {(quotation.currency === "INR" ? "₹" : "$")}{subtotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
