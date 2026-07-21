import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { type BrandKit, type Invoice, type InvoiceItem } from '@/lib/types';
import { InvoiceLayout } from '@/components/documents/InvoiceLayout';

export default function PublicInvoice() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { brandKit, currency, clients, quotations, refreshInvoices, refreshInvoiceItems, getInvoiceById, listInvoiceItemsByInvoice } = useApp();

  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [notFoundGraceExpired, setNotFoundGraceExpired] = useState(false);
  const [statelessInvoice, setStatelessInvoice] = useState<Invoice | null>(null);
  const [statelessItems, setStatelessItems] = useState<InvoiceItem[] | null>(null);
  const [statelessBrand, setStatelessBrand] = useState<BrandKit | undefined>(undefined);

  const usingStatelessData = statelessInvoice !== null;

  // Handle legacy stateless (?data=) links, if any old ones are still floating around.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('data');
    if (!dataParam) {
      setInitialFetchDone(true);
      return;
    }

    import('@/lib/shareLink').then(({ decodeInvoiceData }) => {
      const decoded = decodeInvoiceData(dataParam);
      if (decoded) {
        const { invoice: rawInv, items: rawItems, client, brandKit: sharedBrand } = decoded;
        const hydrated = {
          ...rawInv,
          client: client || rawInv.client,
        } as Invoice;

        setStatelessInvoice(hydrated);
        setStatelessItems(rawItems);
        setStatelessBrand(sharedBrand || undefined);
      }
      setInitialFetchDone(true);
    });
  }, []);

  // Fetch live data once on mount (short-link path: /public/invoice/:invoiceId, no ?data=).
  useEffect(() => {
    if (usingStatelessData) return;
    if (!invoiceId || invoiceId === 'shared') {
      setInitialFetchDone(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await Promise.all([refreshInvoices(), refreshInvoiceItems()]);
      } finally {
        if (!cancelled) setInitialFetchDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, usingStatelessData]);

  // Derive invoice reactively from context — no stale closure.
  const liveInvoice = useMemo<Invoice | null>(() => {
    if (usingStatelessData) return null;
    if (!invoiceId || invoiceId === 'shared') return null;

    const inv = getInvoiceById(invoiceId);
    if (!inv) return null;

    const q = inv.quotation_id ? quotations.find((x) => x.id === inv.quotation_id) : undefined;
    const clientId = inv.client_id || q?.client_id || null;
    const client = clientId ? clients.find((c) => c.id === clientId) : undefined;

    return {
      ...inv,
      client_id: clientId,
      client: inv.client || q?.client || client,
      quotation: inv.quotation || q,
    } as Invoice;
  }, [invoiceId, usingStatelessData, getInvoiceById, quotations, clients]);

  const invoice = usingStatelessData ? statelessInvoice : liveInvoice;

  // Grace period before showing "not found" — give context a moment to catch up
  // after the initial fetch, since state updates can lag one render behind.
  useEffect(() => {
    if (invoice) {
      setNotFoundGraceExpired(false);
      return;
    }
    if (!initialFetchDone) return;
    const t = setTimeout(() => setNotFoundGraceExpired(true), 1500);
    return () => clearTimeout(t);
  }, [invoice, initialFetchDone]);

  const items = useMemo(() => {
    if (statelessItems) return statelessItems;
    return invoice ? listInvoiceItemsByInvoice(invoice.id) : [];
  }, [invoice, listInvoiceItemsByInvoice, statelessItems]);

  // Use stateless brand if available, else from context
  const displayBrand = statelessBrand !== undefined ? statelessBrand : brandKit;

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { default: InvoiceDocument } = await import('@/documents/InvoiceDocument');

      const safe = invoice.invoice_number.replace(/[^a-zA-Z0-9-_]/g, "_");
      const clientName = invoice.client?.business_name || invoice.client?.name || "Client";
      const safeClientName = clientName.replace(/[^a-zA-Z0-9-_ ]/g, "").trim();

      const blob = await pdf(
        <InvoiceDocument invoice={invoice} items={items} brandKit={displayBrand} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeClientName} - ${safe}.pdf`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed', err);
    }
  };

  if (!invoiceId) return null;

  if (!invoice) {
    if (!notFoundGraceExpired) {
      return (
        <div className="min-h-[40vh] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading invoice…</p>
        </div>
      );
    }
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="glass-card">
          <CardContent className="p-6">
            <p className="text-muted-foreground">Invoice not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="quotation-preview-page max-w-[1100px] mx-auto p-4 md:p-6 space-y-6" style={{ background: '#ffffff' }}>
      <div className="no-print">
        <Button className="rounded-xl" onClick={handleDownloadPdf}>
          Download Invoice PDF
        </Button>
      </div>

      <div data-doc-quotation-status={invoice.quotation?.status || 'draft'}>
        <InvoiceLayout invoice={invoice} items={items} brandKit={displayBrand} mode="screen" />
      </div>

      <div className="text-xs text-muted-foreground">
        Status: {invoice.status.toUpperCase()} • Amount due: {(invoice.amount_due || 0).toLocaleString()} {invoice.currency || currency}
      </div>
    </div>
  );
}
