import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Send, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import type { Quotation } from "@/lib/types";
import { QuotationLayout } from "@/components/quotation/QuotationLayout";
// import { createInvoiceFromQuotation } from "@/lib/invoicing";
import { GenerateInvoiceModal } from "@/components/invoices/GenerateInvoiceModal";
import { getQuotationTotalsForDisplay } from "@/lib/quotationServiceBlocks";

export default function QuotationPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { brandKit, loading: appLoading, updateQuotation, refreshQuotations, refreshInvoices, getQuotationById, invoices } = useApp();

  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  // const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<null | 'sent'>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await refreshQuotations();
        const q = getQuotationById(id);
        if (cancelled) return;
        setQuotation(q ? { ...q, status: (q.status || 'draft') as Quotation['status'] } : null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);



  if (!id) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Invalid quotation.</p>
        <Button onClick={() => navigate("/quotations")}>Back</Button>
      </div>
    );
  }

  if (appLoading || loading) {
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

  const safeTotals = getQuotationTotalsForDisplay(quotation);

  // Phase 4 (contracts) removed for now.
  // const linkedContract = undefined;
  // const linkedInvoices: never[] = [];
  // const advanceInvoice = undefined;
  // const finalInvoice = undefined;

  const subtotal = Number(safeTotals.subtotal || 0);
  const oneTime = Number(safeTotals.one_time_total || 0);
  const monthly = Number(safeTotals.monthly_total || 0);
  const tax = Number(quotation.tax_amount || 0);
  const total = Number(safeTotals.total || 0);

  return (
    <div className="quotation-preview-page" style={{ background: "#ffffff" }}>
      {/* Header (no-print) */}
      <div className="quotation-preview-actions no-print">
        <div className="flex items-center gap-4">
          <Link to="/quotations">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="quotation-preview-title">Quotation</h1>
            <p className="quotation-preview-subtitle mt-1">{quotation.quotation_number}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to={`/quotations/${quotation.id}/edit`}>
            <Button variant="outline" className="rounded-xl" disabled={quotation.status !== 'draft'}>
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <GenerateInvoiceModal
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        quotation={quotation}
        onGenerated={async (invoiceId) => {
          // Wait for persistence then navigate (race-condition safe)
          await refreshQuotations();
          await refreshInvoices();
          const updated = getQuotationById(quotation.id);
          if (updated) setQuotation(updated);
          navigate(`/invoices/${invoiceId}`);
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 max-w-[1320px] mx-auto">
        {/* Left: Document (single source of truth for PDF) */}
        <div>
          <QuotationLayout quotation={quotation} brandKit={brandKit} mode="screen" />
        </div>

        {/* Right: Summary + Actions */}
        <aside className="no-print lg:sticky lg:top-6 h-fit">
          <div className="glass-card p-6 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Summary</p>
              <p className="font-heading font-bold text-xl text-foreground mt-1">{quotation.client?.business_name || quotation.client?.name || "Client"}</p>
              <p className="text-sm text-muted-foreground mt-1">{quotation.title || "Quotation"}</p>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-2">
              {monthly > 0 ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monthly total</span>
                  <span className="text-foreground font-medium">{monthly.toLocaleString()}</span>
                </div>
              ) : null}
              {oneTime > 0 ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">One-time total</span>
                  <span className="text-foreground font-medium">{oneTime.toLocaleString()}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground font-medium">{subtotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-foreground font-medium">{tax.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="font-heading font-semibold text-foreground">Total</span>
                <span className="font-heading font-bold text-2xl text-foreground">{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              {quotation.status === 'accepted' || quotation.status === 'invoiced' ? (
                <Button
                  className="w-full gap-2 rounded-xl"
                  onClick={async () => {
                    if (!quotation) return;
                    try {
                      const { printDocument } = await import('@/lib/printer');
                      const { QuotationDocument } = await import('@/documents/QuotationDocument');
                      const safe = `QT-${new Date(quotation.created_at).toISOString().slice(2, 10).replace(/-/g, '')}`;
                      const title = quotation.title.replace(/[^a-zA-Z0-9-_]/g, '_');

                      await printDocument(
                        <QuotationDocument
                          quotation={quotation}
                          client={quotation.client}
                          brandKit={brandKit}
                        />,
                        { title: `Quotation_${safe}_${title}` }
                      );
                    } catch (err) {
                      console.error('Print failed', err);
                    }
                  }}
                >
                  <Download className="w-4 h-4" /> Download PDF
                </Button>
              ) : null}

              {/* Actions by status (strict lifecycle) */}
              {quotation.status === 'draft' ? (
                <div className="rounded-xl border border-border/50 p-3 bg-secondary/30">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Actions</p>
                  <div className="mt-2 space-y-2">
                    <Button
                      className="w-full gap-2 rounded-xl"
                      disabled={updatingStatus !== null}
                      onClick={async () => {
                        setUpdatingStatus('sent');
                        try {
                          const now = new Date().toISOString();
                          await updateQuotation({ ...quotation, status: 'sent', sent_at: now });
                          setQuotation({ ...quotation, status: 'sent', sent_at: now });

                          // const { encodeQuotationData } = await import('@/lib/shareLink');

                          // Prevent URL overflow from large base64 logos
                          // const safeBrandKit = brandKit ? {
                          //   ...brandKit,
                          //   logo_url: (brandKit.logo_url?.startsWith('data:') || brandKit.logo_url?.startsWith('blob:'))
                          //     ? null
                          //     : brandKit.logo_url
                          // } : null;

                          // const qData = {
                          //   v: 1,
                          //   quotation: { ...quotation, status: 'sent', sent_at: now, client: undefined } as Quotation,
                          //   client: quotation.client,
                          //   brandKit: safeBrandKit,
                          //   senderName: "Triple S Production"
                          // };

                          // const encoded = encodeQuotationData(qData);
                          const publicUrl =
                            `${window.location.origin}/public/quotation/${quotation.id}`;

                          const textArea = document.createElement("textarea");
                          textArea.value = publicUrl;
                          textArea.style.position = "fixed";
                          textArea.style.left = "-9999px";

                          document.body.appendChild(textArea);

                          textArea.focus();
                          textArea.select();

                          const copied = document.execCommand("copy");

                          document.body.removeChild(textArea);

                          if (copied) {
                            toast({
                              title: "Quotation marked as sent",
                              description: publicUrl,
                            });
                          } else {
                            window.prompt("Copy quotation link:", publicUrl);
                          }
                        } catch (err) {
                          console.error(err);
                          toast({ title: 'Error', description: 'Failed to share quotation', variant: 'destructive' });
                        } finally {
                          setUpdatingStatus(null);
                        }
                      }}
                    >
                      <Send className="w-4 h-4" /> Share Quotation Link
                    </Button>
                    <Link to={`/quotations/${quotation.id}/edit`}>
                      <Button variant="outline" className="w-full rounded-xl">Edit</Button>
                    </Link>
                  </div>
                </div>
              ) : null}

              {quotation.status === 'sent' ? (
                <div className="rounded-xl border border-border/50 p-3 bg-secondary/30">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
                  <p className="text-sm text-foreground mt-2">Waiting for acceptance</p>
                  <div className="mt-3 space-y-2">
                    <Button
                      variant="outline"
                      className="w-full gap-2 rounded-xl"
                      onClick={async () => {
                        const publicUrl =
                          `${window.location.origin}/public/quotation/${quotation.id}`;

                        try {

                          console.log("COPYING URL:", publicUrl);

                          if (navigator.clipboard?.writeText) {

                            await navigator.clipboard.writeText(publicUrl);

                          } else {

                            const textArea = document.createElement("textarea");
                            textArea.value = publicUrl;

                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand("copy");
                            document.body.removeChild(textArea);
                          }

                          console.log("COPY SUCCESS");

                          toast({
                            title: "Quotation marked as sent",
                            description: publicUrl,
                          });

                        } catch (err) {

                          console.error("COPY FAILED", err);

                          toast({
                            title: "Copy failed",
                            description: publicUrl,
                            variant: "destructive",
                          });

                        }
                      }}
                    >
                      <Send className="w-4 h-4" /> Share Quotation Link
                    </Button>
                  </div>
                </div>
              ) : null}

              {quotation.status === 'accepted' ? (
                <div className="rounded-xl border border-border/50 p-3 bg-secondary/30">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
                  <p className="text-sm text-foreground mt-2">Accepted</p>
                  <div className="mt-3 space-y-2">
                    <Button className="w-full gap-2 rounded-xl" onClick={() => setInvoiceModalOpen(true)}>
                      <CreditCard className="w-4 h-4" /> Generate Invoice
                    </Button>
                  </div>
                </div>
              ) : null}

              {quotation.status === 'invoiced' ? (
                <div className="rounded-xl border border-border/50 p-3 bg-secondary/30">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
                  <p className="text-sm text-foreground mt-2">Invoiced</p>
                  <div className="mt-3 space-y-2">
                    {(() => {
                      const inv = invoices
                        .filter((i) => i.quotation_id === quotation.id)
                        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
                      if (!inv) return null;
                      return (
                        <Link to={`/invoices/${inv.id}`}>
                          <Button variant="outline" className="w-full rounded-xl">View Invoice</Button>
                        </Link>
                      );
                    })()}
                    <Button variant="outline" className="w-full rounded-xl" disabled>
                      View Payments
                    </Button>
                  </div>
                </div>
              ) : null}

            </div>

            <div className="border-t border-border/50 pt-4 space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Lifecycle</p>
              <p className="text-sm text-foreground">{quotation.status.toUpperCase()}</p>
              {/* <p className="text-xs text-muted-foreground">Draft → Sent → Accepted → Invoiced</p> */}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}