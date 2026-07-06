import { useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Invoice } from '@/lib/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onConfirm: (payload: { method: string; reference?: string | null }) => Promise<void>;
};

const METHODS = ['Cash', 'Online', 'Bank Transfer', 'UPI', 'Card', 'Cheque', 'Other'] as const;

export function MarkPaymentReceivedModal({ open, onOpenChange, invoice, onConfirm }: Props) {
  const [method, setMethod] = useState<string>(invoice.payment_method || 'Cash');
  const [reference, setReference] = useState<string>(invoice.payment_reference || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Reset fields whenever the modal opens so the Select is always in sync.
    setMethod(invoice.payment_method || 'Cash');
    setReference(invoice.payment_reference || '');
  }, [open, invoice.payment_method, invoice.payment_reference]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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
              try {
                await onConfirm({ method, reference: reference.trim() ? reference.trim() : null });
                onOpenChange(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
