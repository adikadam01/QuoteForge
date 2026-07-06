import { useMemo, useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import type { Quotation } from '@/lib/types';
import { getRepo } from '@/repo';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: Quotation;
  onGenerated: (invoiceId: string) => void;
};

type Mode = 'full' | 'partial' | 'milestone' | 'monthly';

export function GenerateInvoiceModal({ open, onOpenChange, quotation, onGenerated }: Props) {
  const [mode, setMode] = useState<Mode>('full');
  const [partialRaw, setPartialRaw] = useState('50%');
  const [monthlyAmountRaw, setMonthlyAmountRaw] = useState('');
  const [totalMonths, setTotalMonths] = useState('1');
  const [milestones, setMilestones] = useState<Array<{ label: string; amount: string }>>([
    { label: 'Milestone 1', amount: '' },
    { label: 'Milestone 2', amount: '' },
  ]);
  const [busy, setBusy] = useState(false);

  const total = Number(quotation.total || 0);

  const partialAmount = useMemo(() => {
    const t = total;
    const raw = partialRaw.trim();
    if (!raw) return 0;
    if (raw.endsWith('%')) {
      const pct = Number(raw.replace('%', '').trim());
      if (!Number.isFinite(pct)) return 0;
      return Math.round((t * Math.max(0, Math.min(100, pct))) / 100);
    }
    const amt = Number(raw);
    return Number.isFinite(amt) ? Math.max(0, Math.min(t, amt)) : 0;
  }, [partialRaw, total]);

  const balance = Math.max(0, total - partialAmount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>Select how you want to invoice this quotation.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="full" id="inv-full" />
              <Label htmlFor="inv-full">Full Payment</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="partial" id="inv-partial" />
              <Label htmlFor="inv-partial">Partial Payment</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="milestone" id="inv-milestone" />
              <Label htmlFor="inv-milestone">Milestone Based</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="monthly" id="inv-monthly" />
              <Label htmlFor="inv-monthly">Monthly Payment</Label>
            </div>
          </RadioGroup>

          {mode === 'full' ? (
            <Card className="p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Amount</p>
                  <p className="text-sm text-muted-foreground">Full quotation total</p>
                </div>
                <div className="font-heading font-bold text-lg">{total.toLocaleString()}</div>
              </div>
            </Card>
          ) : null}

          {mode === 'partial' ? (
            <Card className="p-4 rounded-xl space-y-3">
              <div className="space-y-2">
                <Label>Advance amount or %</Label>
                <Input className="rounded-xl" value={partialRaw} onChange={(e) => setPartialRaw(e.target.value)} placeholder="e.g. 5000 or 30%" />
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-between">
                <span>Advance</span>
                <span className="text-foreground font-medium">{partialAmount.toLocaleString()}</span>
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-between">
                <span>Balance</span>
                <span className="text-foreground font-medium">{balance.toLocaleString()}</span>
              </div>
            </Card>
          ) : null}

          {mode === 'milestone' ? (
            <Card className="p-4 rounded-xl space-y-3">
              <div className="text-sm text-muted-foreground">Define milestones (first one will be invoiced now).</div>
              <div className="space-y-3">
                {milestones.map((m, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-2">
                    <Input
                      className="rounded-xl"
                      value={m.label}
                      onChange={(e) =>
                        setMilestones((prev) => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                      }
                      placeholder="Label"
                    />
                    <Input
                      className="rounded-xl"
                      value={m.amount}
                      onChange={(e) =>
                        setMilestones((prev) => prev.map((x, i) => (i === idx ? { ...x, amount: e.target.value } : x)))
                      }
                      placeholder="Amount"
                      type="number"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => setMilestones((p) => [...p, { label: `Milestone ${p.length + 1}`, amount: '' }])}
                >
                  Add milestone
                </Button>
              </div>
            </Card>
          ) : null}

          {mode === 'monthly' ? (
            <Card className="p-4 rounded-xl space-y-3">
              <div className="text-sm text-muted-foreground">
                First month will be invoiced now; later months can be generated when due.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Monthly amount</Label>
                  <Input
                    className="rounded-xl"
                    type="number"
                    value={monthlyAmountRaw}
                    onChange={(e) => setMonthlyAmountRaw(e.target.value)}
                    placeholder="e.g. 10000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Number of months</Label>
                  <Input
                    className="rounded-xl"
                    type="number"
                    min={1}
                    value={totalMonths}
                    onChange={(e) => setTotalMonths(e.target.value)}
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-between">
                <span>Total ({totalMonths || 0} months)</span>
                <span className="text-foreground font-medium">
                  {(Number(monthlyAmountRaw || 0) * Number(totalMonths || 0)).toLocaleString()}
                </span>
              </div>
            </Card>
          ) : null}
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
                const { generateInvoiceForQuotationPlan } = await import('@/lib/phase4Invoicing');

                // Re-fetch fresh quotation so service_blocks are guaranteed hydrated
                const repo = getRepo();
                const freshQuotation = await repo.getQuotation(quotation.id);
                const quotationToUse = freshQuotation ?? quotation;

                const invoiceId = await generateInvoiceForQuotationPlan(
                  quotationToUse,
                  mode === 'full'
                    ? { type: 'full' }
                    : mode === 'partial'
                      ? { type: 'partial', amount: partialAmount }
                      : mode === 'monthly'
                        ? {
                          type: 'monthly',
                          monthlyAmount: Number(monthlyAmountRaw || 0),
                          totalMonths: Math.max(1, Number(totalMonths || 1)),
                        }
                        : {
                          type: 'milestone',
                          milestones: milestones
                            .map((m) => ({ label: m.label, amount: Number(m.amount || 0) }))
                            .filter((m) => m.label.trim() && Number(m.amount) > 0),
                        },
                );
                onGenerated(invoiceId);
                onOpenChange(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {mode === 'full'
              ? 'Generate Invoice'
              : mode === 'partial'
                ? 'Generate Advance Invoice'
                : mode === 'monthly'
                  ? 'Generate First Month Invoice'
                  : 'Generate First Milestone Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}