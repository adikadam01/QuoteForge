import { useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, ReceiptText, Sparkles } from 'lucide-react';
import type { Invoice } from '@/lib/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onConfirm: (payload: { method: string; reference?: string | null }) => Promise<void>;
};

const METHODS = ['Cash', 'Online', 'Bank Transfer', 'UPI', 'Card', 'Cheque', 'Other'] as const;

const PAYMENT_LOADING_MESSAGES = [
  "Recording your payment...",
  "Generating receipt...",
  "Updating invoice status...",
];

type Stage = 'idle' | 'processing' | 'success';

export function MarkPaymentReceivedModal({ open, onOpenChange, invoice, onConfirm }: Props) {
  const [method, setMethod] = useState<string>(invoice.payment_method || 'Cash');
  const [reference, setReference] = useState<string>(invoice.payment_reference || '');
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    // Reset fields whenever the modal opens so the Select is always in sync.
    setMethod(invoice.payment_method || 'Cash');
    setReference(invoice.payment_reference || '');
    setStage('idle');
  }, [open, invoice.payment_method, invoice.payment_reference]);

  useEffect(() => {
    if (stage !== 'processing') {
      setMsgIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % PAYMENT_LOADING_MESSAGES.length);
    }, 1100);
    return () => clearInterval(interval);
  }, [stage]);

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
                  try {
                    await onConfirm({ method, reference: reference.trim() ? reference.trim() : null });
                    setStage('success');
                    // Let the success checkmark breathe for a moment before closing.
                    //   await new Promise((r) => setTimeout(r, 900));
                    //   onOpenChange(false);
                    // } finally {
                    //   setBusy(false);
                    //   setStage('idle');
                    // }

                    await new Promise((r) => setTimeout(r, 900));
                    onOpenChange(false);
                  } finally {
                    setBusy(false);
                    // Don't reset stage here — the dialog is still animating
                    // closed at this point, and flipping stage back to 'idle'
                    // mid-animation flashes the payment form before it fully
                    // closes. The `open` effect above already resets stage to
                    // 'idle' the next time the modal opens.
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
              <svg className="absolute inset-2 -rotate-90 animate-spin" style={{ animationDuration: "1.3s" }} viewBox="0 0 100 100">
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
                  strokeDashoffset={2 * Math.PI * 45 * 0.72}
                  style={{ filter: "drop-shadow(0 0 6px rgba(16,185,129,0.5))" }}
                />
              </svg>
              <ReceiptText className="relative w-8 h-8 text-emerald-600 animate-pulse" strokeWidth={2} />
              <Sparkles className="absolute top-2 right-4 w-4 h-4 text-emerald-400 animate-ping" style={{ animationDuration: "1.6s" }} />
            </div>

            <div className="mt-8 h-5 relative overflow-hidden">
              <p
                key={msgIndex}
                className="text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                {PAYMENT_LOADING_MESSAGES[msgIndex]}
              </p>
            </div>

            <div className="flex gap-1.5 mt-4">
              {PAYMENT_LOADING_MESSAGES.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${i === msgIndex ? "bg-emerald-500" : "bg-emerald-500/20"
                    }`}
                />
              ))}
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