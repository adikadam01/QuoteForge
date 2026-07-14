import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { getRepo } from '@/repo';
import type { BrandKit, Quotation } from '@/lib/types';
import ProfessionalQuotationLayout from '@/components/quotation/ProfessionalQuotationLayout';

export default function PublicQuotation() {
  const { id } = useParams<{ id: string }>();
  const quotationId = id;
  const { brandKit, clients, refreshQuotations, getQuotationById, updateQuotation } = useApp();

  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [acceptedBy, setAcceptedBy] = useState('');
  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acceptedModalOpen, setAcceptedModalOpen] = useState(false);

  useEffect(() => {
    if ((quotation?.status || 'draft') === 'accepted') {
      setAcceptedModalOpen(true);
    }
  }, [quotation?.status]);

  useEffect(() => {
    // 1. Check for stateless data
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('data');

    if (dataParam) {
      import('@/lib/shareLink').then(({ decodeQuotationData }) => {
        const decoded = decodeQuotationData(dataParam);
        if (decoded) {
          const { quotation: rawQ, client, brandKit } = decoded;
          setQuotation({
            ...rawQ,
            client: client || rawQ.client,
            status: (rawQ.status || 'draft') as Quotation['status']
          } as Quotation);
          setStatelessBrand(brandKit || undefined);
          setLoading(false);
        } else {
          setLoading(false);
        }
      });
      return;
    }

    // 2. Fallback to existing logic
    if (!quotationId || quotationId === 'shared') {
      if (!dataParam) setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await refreshQuotations();
        const q = getQuotationById(quotationId);
        if (q) {
          if (!cancelled) setQuotation(q);
          return;
        }

        // Fallback: load directly from repo (ensures link works even if state hydration lags)
        // Also critical for public API access where listQuotations is protected but getQuotation is public.
        const repo = getRepo();
        const direct = await repo.getQuotation(quotationId);
        console.log("DIRECT FROM API", direct);
        console.log("DIRECT CLIENT", direct?.client);

        // console.log("PUBLIC QUOTATION ID =", quotationId);
        // console.log("PUBLIC API RESULT =", direct);
        // console.log("CLIENT =", direct.client);
        // console.log("CLIENT ID =", direct.client_id);
        // console.log("FULL OBJECT =", JSON.stringify(direct, null, 2));

        if (!direct) {
          if (!cancelled) setQuotation(null);
          return;
        }

        // Prefer the client returned by the API.
        // Only fall back to AppContext if it is missing.
        const client =
          direct.client ??
          (direct.client_id
            ? clients.find((c) => c.id === direct.client_id)
            : undefined);

        if (!cancelled)
          setQuotation({
            ...direct,
            status: (direct.status || "draft") as Quotation["status"],
            client,
          });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationId]);

  const [statelessBrand, setStatelessBrand] = useState<BrandKit | undefined>(undefined);
  const displayBrand = statelessBrand !== undefined ? statelessBrand : brandKit;

  const isAlreadyAccepted = quotation?.status === 'accepted';


  const handleDownloadPdf = async () => {
    if (!quotation) return;
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const {
        default: ProfessionalQuotationPDF,
      } = await import(
        '@/components/quotation/ProfessionalQuotationPDF'
      );

      const blob = await pdf(
        <ProfessionalQuotationPDF
          quotation={quotation}
          client={quotation.client}
          brandKit={displayBrand || { ...brandKit, id: "temp" } as BrandKit}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QT-${new Date(quotation.created_at).toISOString().slice(2, 10).replace(/-/g, '')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: unknown) {
      console.error('PDF generation failed', err);
    }
  };

  if (!quotationId) return null;

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 rounded-full bg-primary/20" />
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="glass-card">
          <CardContent className="p-6">
            <p className="text-muted-foreground">Quotation not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted || isAlreadyAccepted) {
    return (
      <div className="quotation-preview-page max-w-[1100px] mx-auto p-4 md:p-6 space-y-6" style={{ background: '#ffffff' }}>
        <Dialog open={acceptedModalOpen} onOpenChange={setAcceptedModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Quotation Accepted</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Quotation accepted successfully. Our team will contact you.</p>
              <Button className="rounded-xl w-full" onClick={handleDownloadPdf}>
                Download PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="glass-card no-print">
          <CardHeader>
            <CardTitle className="font-heading">Quotation accepted successfully. Our team will contact you.</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Accepted by:
            </p>
          </CardContent>
        </Card>

        <div className="quotation-card p-6 md:p-10 mb-8 border border-gray-100 shadow-sm">
          <ProfessionalQuotationLayout
            quotation={quotation}
            brandKit={displayBrand}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="quotation-preview-page max-w-[1100px] mx-auto p-4 md:p-6 space-y-6" style={{ background: '#ffffff' }}>
      {quotation.status === 'accepted' || quotation.status === 'invoiced' ? (
        <div className="no-print">
          <Button className="rounded-xl" onClick={handleDownloadPdf}>
            Download PDF
          </Button>
        </div>
      ) : (
        <div className="no-print">
          <p className="text-sm text-muted-foreground">Please review and accept this quotation to download the PDF.</p>
        </div>
      )}

      <Dialog open={acceptedModalOpen} onOpenChange={setAcceptedModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quotation Accepted</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Quotation accepted successfully. Our team will contact you.</p>
            <Button className="rounded-xl w-full" onClick={handleDownloadPdf}>
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProfessionalQuotationLayout
        quotation={quotation}
        brandKit={displayBrand}
      />

      {/* Acceptance section (bottom only) */}
      {quotation.status === 'sent' || quotation.status === 'draft' ? (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Acceptance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} />
              <span className="text-sm text-foreground">I accept this quotation</span>
            </div>

            <div className="space-y-2">
              <Label>Accepted by (name)</Label>
              <Input
                value={acceptedBy}
                onChange={(e) => setAcceptedBy(e.target.value)}
                className="rounded-xl"
                placeholder="Enter your full name"
              />
            </div>

            <Button
              className="rounded-xl"
              disabled={!agree || !acceptedBy.trim() || saving}
              onClick={async () => {
                setSaving(true);
                const now = new Date().toISOString();
                const next: Quotation = {
                  ...quotation,
                  status: 'accepted',
                  accepted_at: quotation.accepted_at || now,
                  // accepted_by_name: acceptedBy.trim(),
                };

                // Try to persist, but don't block UI if it fails (external user)
                try {
                  await updateQuotation(next);

                  console.log("Quotation saved successfully");

                } catch (err) {
                  console.error("Quotation update failed:", err);

                  alert("Failed to save quotation status.");

                  return;
                }

                // Always update local UI state to show success
                setQuotation(next);
                setAccepted(true);
                setAcceptedModalOpen(true);
                setSaving(false);
              }}
            >
              Accept Quotation
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
