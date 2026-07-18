import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ReceiptText } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency } from "@/lib/types";

export default function Receipts() {
    const {
        currency,
        receipts,
        invoices,
    } = useApp();

    const [searchQuery, setSearchQuery] = useState("");

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        return receipts.filter((receipt) => {
            const invoice = invoices.find(
                (i) => i.id === receipt.invoice_id
            );

            const client =
                invoice?.client ||
                receipt.client;

            if (!q) return true;

            return (
                receipt.receipt_number?.toLowerCase().includes(q) ||

                invoice?.invoice_number
                    ?.toLowerCase()
                    .includes(q) ||

                client?.name
                    ?.toLowerCase()
                    .includes(q) ||

                client?.business_name
                    ?.toLowerCase()
                    .includes(q)
            );
        });
    }, [receipts, invoices, searchQuery]);

    return (
        <div className="space-y-8 animate-fade-in">

            {/* Header */}

            <div>
                <h1 className="text-3xl font-heading font-bold">
                    Receipts
                </h1>

                <p className="text-muted-foreground mt-1">
                    View and manage payment receipts.
                </p>
            </div>

            {/* Search */}

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

                <Input
                    placeholder="Search receipts..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) =>
                        setSearchQuery(e.target.value)
                    }
                />
            </div>

            {/* Loading */}

            <div className="space-y-3">

                {filtered.map((receipt) => {
                    const invoice = invoices.find(
                        (i) => i.id === receipt.invoice_id
                    );

                    const client =
                        invoice?.client ||
                        receipt.client;

                    const cur =
                        receipt.currency ||
                        invoice?.currency ||
                        currency;

                    return (
                        <Card
                            key={receipt.id}
                            className="border-border/50 shadow-card card-hover"
                        >
                            <CardContent className="p-0">

                                <Link
                                    to={`/receipts/${receipt.id}`}
                                    className="block"
                                >
                                    <div className="flex items-center justify-between p-5">

                                        {/* Left */}

                                        <div className="flex items-center gap-4 flex-1 min-w-0">

                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <ReceiptText className="w-6 h-6 text-primary" />
                                            </div>

                                            <div className="min-w-0">

                                                <h3 className="font-heading font-semibold text-foreground truncate">
                                                    {invoice?.quotation?.title || receipt.receipt_number} Receipt
                                                </h3>

                                                <div className="text-sm text-muted-foreground mt-1 space-y-1">

                                                    <p>
                                                        {client?.business_name ||
                                                            client?.name ||
                                                            "No Client"}
                                                    </p>

                                                    <p>
                                                        Invoice:{" "}
                                                        {invoice?.invoice_number ||
                                                            "—"}
                                                    </p>

                                                    <p>
                                                        Paid on{" "}
                                                        {receipt.payment_date}
                                                    </p>

                                                </div>

                                            </div>

                                        </div>

                                        {/* Right */}

                                        <div className="text-right">

                                            <p className="text-xs text-muted-foreground">
                                                Amount Received
                                            </p>

                                            <p className="font-heading font-bold text-xl">
                                                {formatCurrency(
                                                    Number(receipt.amount),
                                                    cur
                                                )}
                                            </p>

                                            <p className="text-xs text-green-600 font-medium mt-1">
                                                Paid
                                            </p>

                                        </div>

                                    </div>
                                </Link>

                            </CardContent>
                        </Card>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="text-center py-16">

                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                            <ReceiptText className="w-8 h-8 text-muted-foreground" />
                        </div>

                        <p className="text-muted-foreground mb-1">
                            No receipts found
                        </p>

                        <p className="text-sm text-muted-foreground">
                            Receipts will appear here once invoice
                            payments are received.
                        </p>

                    </div>
                )}

            </div>
        </div>
    );
}
