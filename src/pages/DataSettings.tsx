import { useRef, useState } from "react";
// import { ArrowLeft } from "lucide-react";
// import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getRepo } from "@/repo";
import type { RepoSnapshot } from "@/repo/types";

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DataSettings() {
  const { toast } = useToast();
  const DRAFT_LS_KEY = "currentDraftId";
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  // const handleExport = async () => {
  //   setBusy(true);
  //   try {
  //     const repo = getRepo();
  //     const snapshot = await repo.exportJson();
  //     downloadTextFile(`agency_data_backup_${Date.now()}.json`, JSON.stringify(snapshot, null, 2));
  //     toast({ title: "Exported", description: "Backup JSON downloaded." });
  //   } catch (err) {
  //     if (import.meta.env.DEV) console.error("Export failed", err);
  //     toast({ title: "Error", description: "Failed to export data", variant: "destructive" });
  //   } finally {
  //     setBusy(false);
  //   }
  // };

  const handleExport = async () => {
    setBusy(true);
    try {
      const repo = getRepo();
      const [
        clients, services, quotations, invoices, invoiceItems, receipts
      ] = await Promise.all([
        repo.listClients(),
        repo.listServices(),
        repo.listQuotations(),
        repo.listInvoices(),
        repo.listInvoiceItems(),
        repo.listReceipts(),
      ]);

      const snapshot = { clients, services, quotations, invoices, invoiceItems, receipts };
      downloadTextFile(`agency_data_backup_${Date.now()}.json`, JSON.stringify(snapshot, null, 2));
      toast({ title: "Exported", description: "Backup JSON downloaded." });
    } catch (err) {
      if (import.meta.env.DEV) console.error("Export failed", err);
      toast({ title: "Error", description: "Failed to export data", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };
  
  const handleImportClick = () => fileRef.current?.click();

  const handleImport = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const snapshot = JSON.parse(text) as RepoSnapshot;
      const repo = getRepo();
      await repo.importJson(snapshot);
      // Imported data may not contain the previously referenced draft; clear pointer to avoid stale resume.
      localStorage.removeItem(DRAFT_LS_KEY);
      toast({ title: "Imported", description: "Data restored. Refresh the page to see updates." });
    } catch (err) {
      if (import.meta.env.DEV) console.error("Import failed", err);
      toast({ title: "Error", description: "Failed to import data", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("This will remove all local data in this browser. Continue?")) return;
    setBusy(true);
    try {
      const repo = getRepo();
      await repo.clearAll();
      // Clear any draft pointer since underlying data is gone.
      localStorage.removeItem(DRAFT_LS_KEY);
      toast({ title: "Cleared", description: "Local data cleared. Refresh the page." });
    } catch (err) {
      if (import.meta.env.DEV) console.error("Clear failed", err);
      toast({ title: "Error", description: "Failed to clear data", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleDemo = async () => {
    // Minimal demo seed (local only)
    setBusy(true);
    try {
      const repo = getRepo();
      // Demo seed can invalidate the current draft context; clear pointer to avoid stale resume behavior.
      localStorage.removeItem(DRAFT_LS_KEY);
      const now = new Date().toISOString();

      const demoClientId = generateId();
      const demoServiceId = generateId();
      const demoQuotationId = generateId();
      const demoInvoiceId = generateId();

      await repo.createClient({
        id: demoClientId,
        name: "[DEMO] Arclight Studios",
        email: "demo.arclight@example.com",
        business_name: "Arclight Studios",
        size: "small",
        industry: "Marketing & Advertising",
        custom_industry: null,
        location: "Mumbai, IN",
        phone: "+91 90000 00001",
        notes: "Local demo client",
        is_deleted: false,
        deleted_at: null,
        created_at: now,
      });

      await repo.createService({
        id: demoServiceId,
        name: "[DEMO] Monthly Retainer",
        description: "Monthly creative + marketing support",
        category: "Retainer",
        pricing_model: "monthly",
        base_price: 45000,
        is_active: true,
        // created_at: now,
        addons: [],
      });

      await repo.createQuotation({
        id: demoQuotationId,
        quotation_number: "QT-DEMO-001",
        client_id: demoClientId,
        title: "[DEMO] Monthly Retainer Quotation",
        introduction: null,
        scope_of_work: null,
        payment_terms_text: null,
        terms_conditions_text: null,
        currency: "INR",
        subtotal: 45000,
        discount: 0,
        discount_type: "percentage",
        tax_rate: 0,
        tax_amount: 0,
        total: 45000,
        quote_date: now.slice(0, 10),
        valid_until: now.slice(0, 10),
        status: "sent",
        sent_at: now,
        accepted_at: null,
        invoiced_at: null,
        is_template: false,
        template_name: null,
        notes: "Local demo quotation",
        wizard_step: 4,
        quotation_sections: null,
        section_toggles: {
          introduction: true,
          scope_of_work: true,
          payment_terms: true,
          terms_conditions: true,
        },
        services: [
          {
            id: generateId(),
            quotation_id: demoQuotationId,
            service_id: demoServiceId,
            service_name: "[DEMO] Monthly Retainer",
            description: "Monthly creative + marketing support",
            pricing_model: "monthly",
            quantity: 1,
            unit_price: 45000,
            total: 45000,
            sort_order: 1,
            is_included: true,
            custom_notes: null,
            addons: [],
          },
        ],
        selected_points: {
          'intro.project_overview': {
            enabled: true,
            section: 'introduction',
            title: 'Project Overview',
            sort_order: 1,
            content: 'This quotation outlines the proposed services, scope of work, and commercial terms for Monthly Retainer.',
          },
          'scope.services_included': {
            enabled: true,
            section: 'scope_of_work',
            title: 'Services Included',
            sort_order: 1,
            content: 'The agency will provide the services listed in this quotation as per the agreed scope and timelines.',
          },
          'pay.advance': {
            enabled: true,
            section: 'payment_terms',
            title: 'Advance Payment',
            sort_order: 1,
            content: 'An advance payment of 50% is required before commencement of work.',
          },
          'tac.ownership': {
            enabled: true,
            section: 'terms_conditions',
            title: 'Ownership of Work',
            sort_order: 2,
            content: 'All creative assets remain the property of the agency until full payment is received.',
          },
        },
        share_token: null,
        created_at: now,
        updated_at: now,
      });

      await repo.createInvoice({
        id: demoInvoiceId,
        invoice_number: "INV-DEMO-001",
        quotation_id: demoQuotationId,
        client_id: demoClientId,
        currency: "INR",
        subtotal: 45000,
        discount: 0,
        tax_amount: 0,
        total: 45000,
        amount_paid: 0,
        amount_due: 45000,
        status: "draft" as unknown as import('@/lib/types').PaymentStatus,
        invoice_status: "draft",
        sent_at: null,
        paid_at: null,
        due_date: null,
        notes: "Local demo invoice",
        share_token: null,
        created_at: now,
        quotation_selected_points: null,
        updated_at: now,
      });

      await repo.upsertInvoiceItemsForInvoice(demoInvoiceId, [
        {
          id: generateId(),
          invoice_id: demoInvoiceId,
          quotation_id: demoQuotationId,
          service_id: demoServiceId,
          name: "Monthly Retainer",
          description: "Monthly creative + marketing support",
          pricing_model: "monthly",
          quantity: 1,
          unit_price: 45000,
          total: 45000,
          sort_order: 1,
          created_at: now,
        },
      ]);

      toast({
        title: "Demo data loaded",
        description: "Demo data saved locally. Refresh to see it everywhere.",
      });
    } catch (err) {
      if (import.meta.env.DEV) console.error("Demo seed failed", err);
      toast({ title: "Error", description: "Failed to load demo data", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Data</h1>
        <p className="text-muted-foreground mt-1">Local storage, backups, and demo data.</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading">Backup & Restore</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button className="rounded-xl" onClick={handleExport} disabled={busy}>
            Export JSON
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={handleImportClick} disabled={busy}>
            Import JSON
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={handleClear} disabled={busy}>
            Clear local data
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImport(f);
              e.currentTarget.value = "";
            }}
          />
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading">Demo Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Loads demo clients/services/one quotation/one invoice into local storage for this browser.
          </p>
          <Button className="rounded-xl" onClick={handleDemo} disabled={true}>
            Load Demo Data (Unavailable)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
