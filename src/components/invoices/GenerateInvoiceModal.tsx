//GenerateInvoiceModal
import type { Quotation } from '@/lib/types';
import { getRepo } from '@/repo';
import { getQuotationServiceBlocks } from "@/lib/quotationServiceBlocks";

import { useEffect, useMemo, useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import InvoiceServiceSelector from "./InvoiceServiceSelector";


type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: Quotation;
  selectedServiceId?: string | null;
  onGenerated: (invoiceId: string) => void;
};

type Mode = 'full' | 'partial' | 'milestone' | 'monthly';

export function GenerateInvoiceModal({
  open,
  onOpenChange,
  quotation,
  selectedServiceId,
  onGenerated,
}: Props) {
  const [mode, setMode] = useState<Mode>('full');
  const [partialRaw, setPartialRaw] = useState('50%');
  const [monthlyAmountRaw, setMonthlyAmountRaw] = useState('');
  const [totalMonths, setTotalMonths] = useState('1');
  const [milestones, setMilestones] = useState<Array<{ label: string; amount: string }>>([
    { label: 'Milestone 1', amount: '' },
    { label: 'Milestone 2', amount: '' },
  ]);
  const [busy, setBusy] = useState(false);

  // Service Navigator
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);

  const [step, setStep] = useState<"services" | "invoice">("services");

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const serviceBlocks =
    getQuotationServiceBlocks(quotation);

  const filteredServiceBlocks =
    selectedServiceIds.length === 0
      ? serviceBlocks
      : serviceBlocks.filter((service) =>
        selectedServiceIds.includes(service.service_id)
      );

  const currentService =
    filteredServiceBlocks[currentServiceIndex] ?? null;


  useEffect(() => {
    if (!currentService) return;

    switch (currentService.billing_type) {
      case "milestone":
        setMode("milestone");
        break;

      case "monthly":
        setMode("monthly");
        break;

      case "retainer":
        setMode("monthly");
        break;

      default:
        setMode("full");
        break;
    }
  }, [currentService]);

  const currentMilestones = useMemo(() => {
    if (!currentService) return [];

    return currentService.milestone_template ?? [];
  }, [currentService]);

  const total = Number(currentService?.price ?? quotation.total ?? 0);
  // ===== PASTE BELOW THIS =====

  const milestonePlans = useMemo(() => {
    return (quotation.service_blocks ?? [])
      .filter((block) => block.billing_type === "milestone")
      .flatMap((block) => block.milestone_template ?? []);
  }, [quotation]);

  const monthlyPlans = useMemo(() => {
    return (quotation.service_blocks ?? [])
      .filter((block) => block.billing_type === "monthly");
  }, [quotation]);

  // ===== END PASTE =====

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
      <DialogContent className="p-6 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto scrollbar-modern">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>Select how you want to invoice this quotation.</DialogDescription>
        </DialogHeader>

        {step === "services" ? (

          <InvoiceServiceSelector
            serviceBlocks={serviceBlocks}
            selectedIds={selectedServiceIds}
            onSelectionChange={setSelectedServiceIds}
          />

        ) : (

          <div className="space-y-4">
            <RadioGroup
              value={mode}
              disabled
              className="opacity-60 pointer-events-none"
            >
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

            {currentService && (
              <Card className="p-4 rounded-xl">
                <div className="flex items-center justify-between mb-4">

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentServiceIndex === 0}
                    onClick={() =>
                      setCurrentServiceIndex((i) => Math.max(0, i - 1))
                    }
                  >
                    ←
                  </Button>

                  <div className="text-center flex-1">
                    <h3 className="font-semibold text-lg">
                      {currentService.service_name}
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      Service {currentServiceIndex + 1} of {filteredServiceBlocks.length}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentServiceIndex === filteredServiceBlocks.length - 1}
                    onClick={() =>
                      setCurrentServiceIndex((i) =>
                        Math.min(filteredServiceBlocks.length - 1, i + 1)
                      )
                    }
                  >
                    →
                  </Button>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Billing Type
                  </span>

                  <span className="font-medium capitalize">
                    {currentService.billing_type?.replace("_", " ")}
                  </span>
                </div>

                <div className="flex justify-between mt-2">
                  <span className="text-muted-foreground">
                    Project Value
                  </span>

                  <span className="font-bold">
                    ₹{Number(currentService.price).toLocaleString()}
                  </span>
                </div>
              </Card>
            )}

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

            {mode === "milestone" && currentService?.billing_type === "milestone" && (
              <Card className="p-5 rounded-xl space-y-4">

                <div className="text-sm text-muted-foreground">
                  Milestone payment plan from the quotation.
                </div>

                <div className="space-y-3">

                  {currentMilestones.map((milestone, index) => (

                    <div
                      key={milestone.id ?? index}
                      className="grid grid-cols-[1fr_100px_140px] gap-3 items-center border rounded-xl px-4 py-3"
                    >

                      <div>
                        <p className="font-medium">
                          {milestone.label}
                        </p>
                      </div>

                      <div className="text-center">
                        <span className="font-medium">
                          {milestone.percentage}%
                        </span>
                      </div>

                      <div className="text-right font-semibold">
                        ₹{Number(milestone.amount).toLocaleString()}
                      </div>

                    </div>

                  ))}

                </div>

                <div className="border-t pt-4 flex justify-between">

                  <span className="font-medium">
                    Total
                  </span>

                  <span className="font-bold">
                    ₹{Number(currentService.price).toLocaleString()}
                  </span>

                </div>

              </Card>
            )}
            {mode === "monthly" &&
              currentService?.billing_type === "monthly" && (
                <Card className="p-5 rounded-xl space-y-4 max-h-[360px]  ">

                  <div className="text-sm text-muted-foreground">
                    Monthly payment plan from the quotation.
                  </div>

                  <div className="border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Monthly Amount
                      </p>

                      <p className="text-xl font-semibold">
                        ₹{Number(currentService.monthly_amount ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Duration
                      </p>

                      <p className="text-xl font-semibold">
                        {currentService.duration_months} Months
                      </p>
                    </div>
                  </div>

                  <div className="border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Invoices Generated
                      </p>

                      <p className="text-xl font-semibold">
                        0 / {currentService.duration_months}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4 flex items-center justify-between">

                    <span className="font-medium">
                      Total Contract Value
                    </span>

                    <span className="font-bold text-lg">
                      ₹{Number(currentService.price).toLocaleString()}
                    </span>

                  </div>

                </Card>
              )}
          </div>
        )}

        <DialogFooter>

          {step === "services" ? (

            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>

              <Button
                disabled={selectedServiceIds.length === 0}
                onClick={() => {
                  setCurrentServiceIndex(0);
                  setStep("invoice");
                }}
              >
                Continue
              </Button>
            </>

          ) : (

            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("services");
                }}
              >
                Back
              </Button>

              <Button
                className="rounded-xl"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);

                  try {
                    const { generateInvoiceForQuotationPlan } = await import(
                      "@/lib/phase4Invoicing"
                    );

                    const repo = getRepo();
                    const freshQuotation = await repo.getQuotation(quotation.id);
                    const quotationToUse = freshQuotation ?? quotation;

                    const invoiceId = await generateInvoiceForQuotationPlan(
                      quotationToUse,
                      mode === "full"
                        ? {
                          type: "full",
                          selectedServiceIds,
                        }
                        : mode === "partial"
                          ? {
                            type: "partial",
                            amount: partialAmount,
                            selectedServiceIds,
                          }
                          : mode === "monthly"
                            ? {
                              type: "monthly",
                              monthlyAmount: Number(currentService?.monthly_amount ?? 0),
                              totalMonths: Number(currentService?.duration_months ?? 1),
                              selectedServiceIds,
                            }
                            : {
                              type: "milestone",
                              milestones: currentMilestones.map((m) => ({
                                label: m.label,
                                amount: m.amount,
                                status: "pending" as const,
                              })),
                              selectedServiceIds,
                            }
                    );

                    onGenerated(invoiceId);
                    onOpenChange(false);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {mode === "full"
                  ? "Generate Invoice"
                  : mode === "partial"
                    ? "Generate Advance Invoice"
                    : mode === "monthly"
                      ? "Generate First Month Invoice"
                      : "Generate First Milestone Invoice"}
              </Button>
            </>

          )}

        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}