import { useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, ReceiptText, Sparkles } from 'lucide-react';
import type { Invoice } from '@/lib/types';

type ProgressReporter = (pct: number, label?: string) => void;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onConfirm: (
    payload: { method: string; reference?: string | null },
    reportProgress: ProgressReporter
  ) => Promise<void>;
};

const METHODS = ['Cash', 'Online', 'Bank Transfer', 'UPI', 'Card', 'Cheque', 'Other'] as const;

type Stage = 'idle' | 'processing' | 'success';

export function MarkPaymentReceivedModal({ open, onOpenChange, invoice, onConfirm }: Props) {
  const [method, setMethod] = useState<string>(invoice.payment_method || 'Cash');
  const [reference, setReference] = useState<string>(invoice.payment_reference || '');
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [progressPct, setProgressPct] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Recording your payment...');

  useEffect(() => {
    if (!open) return;
    setMethod(invoice.payment_method || 'Cash');
    setReference(invoice.payment_reference || '');
    setStage('idle');
    setProgressPct(0);
    setProgressLabel('Recording your payment...');
  }, [open, invoice.payment_method, invoice.payment_reference]);

  useEffect(() => {
    if (stage !== 'processing') return;

    const interval = setInterval(() => {
      setProgressPct((p) => {
        // Creep toward 95% max, slowing down as it approaches — never claims 100% on its own.
        if (p >= 95) return p;
        const remaining = 95 - p;
        return p + remaining * 0.03;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [stage]);

  const reportProgress: ProgressReporter = (targetPct, label) => {
    if (label) setProgressLabel(label);

    // Animate smoothly from current value toward targetPct instead of jumping.
    const start = performance.now();
    const startPct = progressPct;
    const duration = 600; // ms

    const step = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setProgressPct(startPct + (targetPct - startPct) * eased);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  return (
    <Dialog open={open} onOpenChange={busy ? undefined : onOpenChange}>
      <DialogContent className="max-w-lg">
        {stage === 'idle' && (
          <>
            <DialogHeader>
              <DialogTitle>Mark Payment Received</DialogTitle>
              <DialogDescription>Record a payment and generate a receipt.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={method ? method : undefined} onValueChange={setMethod}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reference (optional)</Label>
                <Input className="rounded-xl" value={reference} onChange={(e) => setReference(e.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)} disabled={busy}>
                Cancel
              </Button>
              <Button
                className="rounded-xl"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setStage('processing');
                  setProgressPct(0);
                  setProgressLabel('Recording your payment...');
                  try {
                    await onConfirm(
                      { method, reference: reference.trim() ? reference.trim() : null },
                      reportProgress
                    );
                    setProgressPct(100);
                    setStage('success');
                    await new Promise((r) => setTimeout(r, 700));
                    onOpenChange(false);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Confirm Payment
              </Button>
            </DialogFooter>
          </>
        )}

        {stage === 'processing' && (
          <div className="flex flex-col items-center justify-center py-14">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/25 animate-spin"
                style={{ animationDuration: "5s" }}
              />
              <div
                className="absolute w-40 h-40 rounded-full bg-emerald-500/20 blur-2xl animate-pulse"
                style={{ animationDuration: "1.8s" }}
              />
              <svg className="absolute inset-2 -rotate-90" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="paymentLoaderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-emerald-500/10" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#paymentLoaderGradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 * (1 - progressPct / 100)}
                  style={{
                    filter: "drop-shadow(0 0 6px rgba(16,185,129,0.5))",
                    transition: "stroke-dashoffset 0.4s ease-out",
                  }}
                />
              </svg>
              <span className="relative text-lg font-heading font-bold text-emerald-700">
                {Math.round(progressPct)}%
              </span>
              <Sparkles className="absolute top-2 right-4 w-4 h-4 text-emerald-400 animate-ping" style={{ animationDuration: "1.6s" }} />
            </div>

            <div className="mt-8 h-5 relative overflow-hidden">
              <p
                key={progressLabel}
                className="text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {progressLabel}
              </p>
            </div>

            <div className="mt-4 w-48 h-1.5 rounded-full bg-emerald-500/10 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${progressPct}%`, transition: "width 0.4s ease-out" }}
              />
            </div>
          </div>
        )}

        {stage === 'success' && (
          <div className="flex flex-col items-center justify-center py-16 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/15 animate-ping" style={{ animationDuration: "1s", animationIterationCount: 1 }} />
              <div className="absolute inset-0 rounded-full bg-emerald-50 border-2 border-emerald-500" />
              <CheckCircle2
                className="relative w-12 h-12 text-emerald-600 animate-in zoom-in-50 duration-500"
                strokeWidth={2}
              />
            </div>
            <p className="mt-6 font-heading font-semibold text-foreground text-lg">Payment Recorded</p>
            <p className="text-sm text-muted-foreground mt-1">Receipt generated successfully.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}