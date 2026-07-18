// src/components/invoices/InvoiceHistoryModal.tsx

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/contexts/AppContext";
import type { Quotation } from "@/lib/types";
import { formatCurrency } from "@/lib/types";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quotation: Quotation | null;
};

const invoiceStatusColor: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
};

export default function InvoiceHistoryModal({ open, onOpenChange, quotation }: Props) {
    const { invoices, receipts, currency } = useApp();
    const navigate = useNavigate();

    const quotationInvoices = useMemo(() => {
        if (!quotation) return [];
        return invoices
            .filter((inv) => inv.quotation_id === quotation.id)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }, [invoices, quotation]);

    const receiptsByInvoiceId = useMemo(() => {
        const map = new Map<string, typeof receipts>();
        for (const r of receipts) {
            if (!r.invoice_id) continue;
            const list = map.get(r.invoice_id) || [];
            list.push(r);
            map.set(r.invoice_id, list);
        }
        return map;
    }, [receipts]);

    if (!quotation) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-6 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-modern">
                <DialogHeader>
                    <DialogTitle>Invoice History</DialogTitle>
                    <DialogDescription>
                        {quotation.title || quotation.quotation_number} — {quotationInvoices.length} invoice(s)
                    </DialogDescription>
                </DialogHeader>

                {quotationInvoices.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">No invoices generated yet for this quotation.</p>
                ) : (
                    <div className="space-y-4">
                        {quotationInvoices.map((inv, idx) => {
                            const invCurrency = inv.currency || currency;
                            const invReceipts = receiptsByInvoiceId.get(inv.id) || [];
                            const statusColor = invoiceStatusColor[inv.invoice_status] || invoiceStatusColor.draft;

                            return (
                                <Card key={inv.id} className="rounded-xl border-border/60">
                                    <CardContent className="p-5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-foreground">
                                                    Invoice #{idx + 1} — {inv.invoice_number}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {inv.type ? inv.type.replace("_", " ").toUpperCase() : "FULL"}
                                                    {inv.created_at ? ` • ${new Date(inv.created_at).toLocaleDateString()}` : ""}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={`${statusColor} text-[10px]  px-1.5 py-0`}>{(inv.invoice_status || "draft").toUpperCase()}</Badge>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    title="Open invoice"
                                                    onClick={() => {
                                                        onOpenChange(false);
                                                        navigate(`/invoices/${inv.id}`);
                                                    }}
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="flex justify-between border rounded-lg px-3 py-2">
                                                <span className="text-muted-foreground">Total</span>
                                                <span className="font-semibold">{formatCurrency(Number(inv.total), invCurrency)}</span>
                                            </div>
                                            <div className="flex justify-between border rounded-lg px-3 py-2">
                                                <span className="text-muted-foreground">Paid</span>
                                                <span className="font-semibold">{formatCurrency(Number(inv.amount_paid || 0), invCurrency)}</span>
                                            </div>
                                            <div className="flex justify-between border rounded-lg px-3 py-2 col-span-2">
                                                <span className="text-muted-foreground">Due</span>
                                                <span className="font-semibold">{formatCurrency(Number(inv.amount_due || 0), invCurrency)}</span>
                                            </div>
                                        </div>

                                        {invReceipts.length > 0 && (
                                            <div className="pt-2 border-t border-border/50">
                                                <p className="text-xs uppercase tracking-wide text-muted-foreground font-bold mb-2">
                                                    Receipts
                                                </p>
                                                <div className="space-y-2">
                                                    {invReceipts.map((r) => (
                                                        <div
                                                            key={r.id}
                                                            className="flex items-center justify-between text-sm border rounded-lg px-3 py-2 bg-muted/30"
                                                        >
                                                            <div>
                                                                <p className="font-medium">{r.receipt_number}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {r.payment_method || "—"} • {new Date(r.payment_date).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <span className="font-semibold">
                                                                {formatCurrency(Number(r.amount), r.currency || invCurrency)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}