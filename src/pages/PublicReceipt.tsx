import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getRepo } from "@/repo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/contexts/AppContext";
import { type BrandKit, type Receipt, type Invoice, type InvoiceItem } from "@/lib/types";
import { ReceiptLayout } from "@/components/documents/ReceiptLayout";

const RECEIPT_LOADING_MESSAGES = [
    "Loading receipt...",
    "Fetching invoice details...",
    "Preparing document...",
];

export default function PublicReceipt() {
    const { receiptId } = useParams<{ receiptId: string }>();
    const { brandKit } = useApp();

    const [initialFetchDone, setInitialFetchDone] = useState(false);
    const [notFoundGraceExpired, setNotFoundGraceExpired] = useState(false);
    const [receipt, setReceipt] = useState<Receipt | null>(null);
    const [directBrand, setDirectBrand] = useState<BrandKit | null>(null);
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
    const [loadMsgIndex, setLoadMsgIndex] = useState(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const repo = getRepo();
                const kit = await repo.getBrandKit();
                if (!cancelled) setDirectBrand(kit);
            } catch (err) {
                console.error("Failed to load brand kit", err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!receiptId) {
            setInitialFetchDone(true);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const repo = getRepo();
                const rec = await repo.getReceipt(receiptId);
                if (cancelled) return;

                if (rec) {
                    setReceipt(rec);
                    if (rec.invoice_id) {
                        try {
                            const items = await repo.listInvoiceItemsByInvoice(rec.invoice_id);
                            if (!cancelled) setInvoiceItems(items);
                        } catch (err) {
                            console.error("Failed to load invoice items", err);
                        }
                    }
                } else {
                    setReceipt(null);
                }
            } catch (err) {
                console.error("Failed to load public receipt", err);
                if (!cancelled) setReceipt(null);
            } finally {
                if (!cancelled) setInitialFetchDone(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [receiptId]);

    useEffect(() => {
        if (receipt) {
            setNotFoundGraceExpired(false);
            return;
        }
        if (!initialFetchDone) return;
        const t = setTimeout(() => setNotFoundGraceExpired(true), 2500);
        return () => clearTimeout(t);
    }, [receipt, initialFetchDone]);

    useEffect(() => {
        if (receipt) return;
        const interval = setInterval(() => {
            setLoadMsgIndex((i) => (i + 1) % RECEIPT_LOADING_MESSAGES.length);
        }, 1400);
        return () => clearInterval(interval);
    }, [receipt]);

    const displayBrand = directBrand || brandKit;

    const invoice: Invoice | null | undefined = receipt?.invoice;
    const client = receipt?.client || invoice?.client || null;
    const quotation = invoice?.quotation || null;

    const handleDownloadPdf = async () => {
        if (!receipt) return;
        try {
            const { printDocument } = await import("@/lib/printer");
            const { ReceiptDocument } = await import("@/documents/ReceiptDocument");
            const safe = (receipt.receipt_number || receipt.id).replace(/[^a-zA-Z0-9-_]/g, "_");
            const clientName = (client?.name || client?.business_name || "Client").replace(/[^a-zA-Z0-9-_]/g, "_");
            const dateStr = (receipt.payment_date || new Date().toISOString()).slice(0, 10);

            await printDocument(
                <ReceiptDocument
                    receipt={receipt}
                    invoice={invoice || undefined}
                    client={client}
                    brandKit={displayBrand}
                    quotation={quotation}
                    invoiceItems={invoiceItems}
                />,
                { title: `Receipt_${safe}_${clientName}_${dateStr}` }
            );
        } catch (err) {
            console.error("PDF generation failed", err);
        }
    };

    if (!receiptId) return null;

    if (!receipt) {
        if (!notFoundGraceExpired) {
            return (
                <div className="min-h-[60vh] flex flex-col items-center justify-center">
                    <p className="text-sm text-muted-foreground">{RECEIPT_LOADING_MESSAGES[loadMsgIndex]}</p>
                </div>
            );
        }
        return (
            <div className="max-w-3xl mx-auto p-6">
                <Card className="glass-card">
                    <CardContent className="p-6">
                        <p className="text-muted-foreground">Receipt not found.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="quotation-preview-page max-w-[1100px] mx-auto p-4 md:p-6 space-y-6" style={{ background: "#ffffff" }}>
            <div className="no-print">
                <Button className="rounded-xl" onClick={handleDownloadPdf}>
                    Download Receipt PDF
                </Button>
            </div>

            <ReceiptLayout
                receipt={receipt}
                invoice={invoice}
                client={client}
                brandKit={displayBrand}
                quotation={quotation}
                invoiceItems={invoiceItems}
                mode="screen"
            />
        </div>
    );
}