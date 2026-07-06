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

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    // 1. Check for stateless data param
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('data');

    if (dataParam) {
      import('@/lib/shareLink').then(({ decodeInvoiceData }) => {
        const decoded = decodeInvoiceData(dataParam);
        if (decoded) {
          const { invoice: rawInv, items: rawItems, client, brandKit } = decoded;
          // Hydrate invoice with embedded client/items
          const hydrated = {
            ...rawInv,
            client: client || rawInv.client,
            // We can attach items if we want, but listInvoiceItemsByInvoice reads from repo.
            // Since we are in public view "stateless", we must inject items into the view.
            // We'll handle items via a special override or by mocking the repo call result? 
            // Actually, `items` in component state is pulled from memory or repo. 
            // We need to bypass repo for items.
          } as Invoice;

          setInvoice(hydrated);
          // We need to pass `items` to the view. But `PublicInvoice` uses `listInvoiceItemsByInvoice`.
          // We will store items in a local state override.
          setStatelessItems(rawItems);
          setStatelessBrand(brandKit || undefined);
          setLoading(false);
        } else {
          setLoading(false); // bad data
        }
      });
      return;
    }

    // 2. Fallback to existing logic (local repo)
    if (!invoiceId || invoiceId === 'shared') {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await refreshInvoices();
        await refreshInvoiceItems();
        const inv = getInvoiceById(invoiceId);
        if (!inv) {
          if (!cancelled) setInvoice(null);
          return;
        }

        const q = inv.quotation_id ? quotations.find((x) => x.id === inv.quotation_id) : undefined;
        const clientId = inv.client_id || q?.client_id || null;
        const client = clientId ? clients.find((c) => c.id === clientId) : undefined;
        const hydrated = {
          ...inv,
          client_id: clientId,
          client: inv.client || q?.client || client,
          quotation: inv.quotation || q,
        } as Invoice;

        if (!cancelled) setInvoice(hydrated);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const [statelessItems, setStatelessItems] = useState<InvoiceItem[]>([]);
  const [statelessBrand, setStatelessBrand] = useState<BrandKit | undefined>(undefined);

  const items = useMemo(() => {
    if (statelessItems) return statelessItems;
    return invoice ? listInvoiceItemsByInvoice(invoice.id) : [];
  }, [invoice, listInvoiceItemsByInvoice, statelessItems]);

  // Use stateless brand if available, else from context
  const displayBrand = statelessBrand !== undefined ? statelessBrand : brandKit;

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    try {
      const { printDocument } = await import('@/lib/printer');
      const { InvoiceDocument } = await import('@/documents/InvoiceDocument');
      const safe = invoice.invoice_number.replace(/[^a-zA-Z0-9-_]/g, "_");

      await printDocument(
        <InvoiceDocument invoice={invoice} brandKit={displayBrand} />,
        { title: `Invoice_${safe}` }
      );
    } catch (err) {
      console.error('Print failed', err);
    }
  };

  if (!invoiceId) return null;

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 rounded-full bg-primary/20" />
        </div>
      </div>
    );
  }

  if (!invoice) {
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
