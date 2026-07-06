import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

import { ReceiptLayout } from '@/components/documents/ReceiptLayout';

export default function ReceiptView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { brandKit, clients, invoices, receipts, refreshReceipts, refreshInvoices } = useApp();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await refreshInvoices();
        await refreshReceipts();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const receipt = useMemo(() => receipts.find((r) => r.id === id), [id, receipts]);
  const invoice = useMemo(() => invoices.find((i) => i.id === receipt?.invoice_id), [invoices, receipt?.invoice_id]);
  const client = useMemo(() => {
    const cid = receipt?.client_id || invoice?.client_id || null;
    return cid ? clients.find((c) => c.id === cid) : null;
  }, [clients, invoice?.client_id, receipt?.client_id]);

  // Ensure we have the full quotation object populated if possible
  const quotation = useMemo(() => {
    if (!invoice?.quotation) return null;
    return invoice.quotation;
  }, [invoice]);

  // const handleDownloadPdf = async () => {
  //   if (!receipt || !invoice) return;
  //   const qStatus = (invoice?.quotation?.status || 'draft');
  //   if (qStatus === 'draft') return;

  const handleDownloadPdf = async () => {
    if (!receipt || !invoice) return;

    try {
      setLoading(true);
      const { printDocument } = await import('@/lib/printer');
      const { ReceiptDocument } = await import('@/documents/ReceiptDocument');
      const safe = (receipt.receipt_number || receipt.id).replace(/[^a-zA-Z0-9-_]/g, '_');
      const clientName = (client?.name || client?.business_name || 'Client').replace(/[^a-zA-Z0-9-_]/g, '_');
      const dateStr = (receipt.payment_date || new Date().toISOString()).slice(0, 10);

      await printDocument(
        <ReceiptDocument
          receipt={receipt}
          invoice={invoice}
          client={client}
          brandKit={brandKit}
          quotation={quotation}
        />,
        { title: `Receipt_${safe}_${clientName}_${dateStr}` }
      );
    } catch (err) {
      console.error('Print failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (!id) return null;

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 rounded-full bg-primary/20" />
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Receipt not found.</p>
        <Button onClick={() => navigate('/invoices')}>Back</Button>
      </div>
    );
  }

  // const cur = receipt.currency || invoice?.currency || currency;

  return (
    <div className="quotation-preview-page space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={invoice ? `/invoices/${invoice.id}` : '/invoices'}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Payment Receipt</h1>
            <p className="text-sm text-muted-foreground mt-1">{receipt.receipt_number}</p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" /> Immutable
          </div>
          <Button className="rounded-xl gap-2" onClick={handleDownloadPdf}>
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </div>
      </div>

      <div>
        <ReceiptLayout
          receipt={receipt}
          invoice={invoice}
          client={invoice?.client || receipt.client || client}
          brandKit={brandKit}
          mode="screen"
          quotation={quotation}
        />
      </div>
    </div>
  );
}
