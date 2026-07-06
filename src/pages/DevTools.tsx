import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { nowIso } from "@/lib/dates";
import { newId } from "@/lib/id";
import type { RepoSnapshot } from "@/repo/types";
import { getRepo } from "@/repo";
import type { BrandKit, Client, Quotation, Service } from "@/lib/types";

export default function DevTools() {
  const { toast } = useToast();
  const repo = useMemo(() => getRepo(), []);

  const [busy, setBusy] = useState(false);

  const makeDemoSnapshot = (): RepoSnapshot => {
    const now = nowIso();
    const today = new Date().toISOString().split("T")[0];
    const plus30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

    const brandKit: BrandKit = {
      id: newId(),
      company_name: "[DEMO] Triple S Agency",
      logo_url: null,
      primary_color: "#111827",
      secondary_color: null,
      accent_color: "#2563eb",
      font_heading: "Montserrat",
      font_body: "Inter",
      website: "https://example.com",
      email: "demo@agency.com",
      phone: "+91 90000 00000",
      address: "Demo Street\nDemo City, IN",
      default_currency: "INR",
      created_at: now,
      updated_at: now,
    } as unknown as BrandKit;

    const clients: Client[] = [
      {
        id: newId(),
        name: "[DEMO] Arclight Studios",
        email: "demo.arclight@example.com",
        business_name: "Arclight Studios",
        size: "small",
        industry: "Marketing & Advertising",
        custom_industry: null,
        location: "Mumbai, IN",
        phone: "+91 90000 00001",
        notes: "DEMO / seeded client",
        is_deleted: false,
        deleted_at: null,
        created_at: now,
      },
      {
        id: newId(),
        name: "[DEMO] Northwind Media",
        email: "demo.northwind@example.com",
        business_name: "Northwind Media",
        size: "medium",
        industry: "Media",
        custom_industry: null,
        location: "Bengaluru, IN",
        phone: "+91 90000 00002",
        notes: "DEMO / seeded client",
        is_deleted: false,
        deleted_at: null,
        created_at: now,
      },
    ];

    const services: Service[] = [
      {
        id: newId(),
        name: "[DEMO] Monthly Social Media Retainer",
        description: "Monthly content planning, posting schedule, and reporting.",
        category: "Retainer",
        pricing_model: "monthly",
        base_price: 45000,
        is_active: true,
        created_at: now,
        addons: [],
      } as unknown as Service,
      {
        id: newId(),
        name: "[DEMO] Posters (per poster)",
        description: "Static creatives designed per unit.",
        category: "Design",
        pricing_model: "per_unit",
        base_price: 1500,
        is_active: true,
        created_at: now,
        addons: [],
      } as unknown as Service,
    ];

    const mkQuoteNo = (n: number) => `DEMO-QT-${String(n).padStart(3, "0")}`;

    const quotations: Quotation[] = [
      {
        id: newId(),
        quotation_number: mkQuoteNo(1),
        client_id: clients[0]?.id || null,
        title: "[DEMO] Social Media Retainer - Q1",
        introduction: null,
        scope_of_work: null,
        currency: "INR",
        subtotal: 45000,
        discount: 0,
        discount_type: "percentage",
        tax_rate: 0,
        tax_amount: 0,
        total: 45000,
        quote_date: today,
        valid_until: plus30,
        status: "draft",
        sent_at: null,
        accepted_at: null,
        invoiced_at: null,
        is_template: false,
        template_name: null,
        notes: "DEMO / seeded quotation",
        payment_terms_text: null,
        terms_conditions_text: null,
        wizard_step: 1,
        section_toggles: {
          introduction: true,
          scope_of_work: true,
          payment_terms: true,
          terms_conditions: true,
        },
        acceptance_draft: undefined,
        quotation_sections: null,
        selected_points: {
          "intro.demo": {
            enabled: true,
            section: "introduction",
            title: "About us",
            content: "We are a demo agency. Replace this copy with your own.",
            sort_order: 0,
          },
          "scope.demo": {
            enabled: true,
            section: "scope_of_work",
            title: "Scope",
            content: "• Deliverables\n• Timelines\n• Assumptions",
            sort_order: 0,
          },
        },
        share_token: null,
        created_at: now,
        updated_at: now,
        services: [],
        terms: [],
      } as unknown as Quotation,
    ];

    return {
      brandKit,
      clients,
      services,
      quotations,
      invoices: [],
      invoiceItems: [],
      quotationPointTemplates: [],
      contracts: [],
      workflowInvoices: [],
      paymentReceipts: [],
      receipts: [],
      clientOptions: {
        businessTypes: [],
        industries: [],
      },
    };
  };

  const seedDemo = async () => {
    setBusy(true);
    try {
      const existing = await repo.exportJson();
      const hasDemo = existing.clients.some((c) => (c.name || "").toLowerCase().startsWith("[demo]"));
      if (hasDemo) {
        toast({ title: "Demo already seeded", description: "Found existing [DEMO] clients. Skipping." });
        return;
      }

      const snapshot = makeDemoSnapshot();

      await repo.importJson({
        ...existing,
        brandKit: snapshot.brandKit,
        clients: [...snapshot.clients, ...existing.clients],
        services: [...snapshot.services, ...existing.services],
        quotations: [...snapshot.quotations, ...existing.quotations],
        invoices: existing.invoices,
        invoiceItems: existing.invoiceItems,
        quotationPointTemplates:
          existing.quotationPointTemplates.length > 0 ? existing.quotationPointTemplates : snapshot.quotationPointTemplates,
      });

      toast({ title: "Seeded demo data", description: "Refresh the page to see updated lists." });
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
      toast({ title: "Seed failed", description: "See console for details", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const clearLocal = async () => {
    setBusy(true);
    try {
      await repo.clearAll();
      toast({ title: "Cleared local data", description: "Refresh the page to re-initialize defaults." });
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
      toast({ title: "Clear failed", description: "See console for details", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading">Dev Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Seeds demo data into the local-first storage (IndexedDB/localforage). This does not touch Supabase.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={seedDemo} disabled={busy}>
              Seed local demo data
            </Button>
            <Button variant="destructive" onClick={clearLocal} disabled={busy}>
              Clear local data
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: after seeding/clearing, refresh the browser tab so the AppContext reloads from storage.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
