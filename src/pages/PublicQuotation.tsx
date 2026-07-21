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
  const {
    updateQuotation,
    refreshQuotations,
    getQuotationById,
    clients,
    brandKit,
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [acceptedBy, setAcceptedBy] = useState('');
  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acceptedModalOpen, setAcceptedModalOpen] = useState(false);

  const [declining, setDeclining] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declineSaving, setDeclineSaving] = useState(false);
  const [declined, setDeclined] = useState(false);

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
  const isAlreadyDeclined = quotation?.status === 'declined';


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

  if (declined || isAlreadyDeclined) {
    return (
      <div className="quotation-preview-page max-w-[1100px] mx-auto p-4 md:p-6 space-y-6" style={{ background: '#ffffff' }}>
        <Card className="glass-card no-print">
          <CardHeader>
            <CardTitle className="font-heading">Quotation Declined</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You've declined this quotation. Our team has been notified.
            </p>
            {quotation?.declined_reason ? (
              <div className="rounded-xl border border-border/50 p-3 bg-secondary/30">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Your note</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{quotation.declined_reason}</p>
              </div>
            ) : null}
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
      {/* Acceptance section (bottom only) */}
      {quotation.status === 'sent' || quotation.status === 'draft' ? (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Acceptance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!declining ? (
              <>
                <div className="flex items-center gap-2">
                  <Checkbox checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} />
                  <span className="text-sm text-foreground">I accept this quotation</span>
                </div>

                <div className="space-y-2">
                  <Label>Digital Signature(Name)</Label>
                  <Input
                    value={acceptedBy}
                    onChange={(e) => setAcceptedBy(e.target.value)}
                    className="rounded-xl"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="rounded-xl flex-1"
                    disabled={!agree || !acceptedBy.trim() || saving}
                    onClick={async () => {
                      setSaving(true);
                      const now = new Date().toISOString();
                      const next: Quotation = {
                        ...quotation,
                        status: "accepted",
                        accepted_at: quotation.accepted_at || now,
                        accepted_by: acceptedBy.trim(),
                      };

                      try {
                        await updateQuotation(next);
                        await refreshQuotations();
                      } catch (err) {
                        console.error("Quotation update failed:", err);
                        alert("Failed to save quotation status.");
                        return;
                      }

                      setQuotation(next);
                      setAccepted(true);
                      setAcceptedModalOpen(true);
                      setSaving(false);
                    }}
                  >
                    Accept Quotation
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-xl border-black text-foreground hover:text-red-600 hover:bg-transparent"
                    disabled={saving}
                    onClick={() => setDeclining(true)}
                  >
                    Decline Quotation
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Let us know why (optional but helpful)</Label>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-full min-h-[100px] rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none"
                    placeholder="e.g. Budget doesn't fit, chose another vendor, need more time..."
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    className="rounded-xl"
                    disabled={!agree || !acceptedBy.trim() || saving}
                    onClick={async () => {
                      setDeclineSaving(true);
                      const next: Quotation = {
                        ...quotation,
                        status: "declined",
                        declined_reason: declineReason.trim() || null,
                      };

                      try {
                        await updateQuotation(next);
                        await refreshQuotations();
                      } catch (err) {
                        console.error("Quotation decline failed:", err);
                        alert("Failed to save quotation status.");
                        setDeclineSaving(false);
                        return;
                      }

                      setQuotation(next);
                      setDeclined(true);
                      setDeclineSaving(false);
                    }}
                  >
                    Confirm Decline
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-xl"
                    disabled={declineSaving}
                    onClick={() => {
                      setDeclining(false);
                      setDeclineReason('');
                    }}
                  >
                    Back
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}