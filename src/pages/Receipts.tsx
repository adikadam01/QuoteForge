// import { useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import { Search, ReceiptText } from "lucide-react";

// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { useApp } from "@/contexts/AppContext";
// import { formatCurrency } from "@/lib/types";

// export default function Receipts() {
//     const {
//         currency,
//         receipts,
//         invoices,
//     } = useApp();

//     const [searchQuery, setSearchQuery] = useState("");

//     const filtered = useMemo(() => {
//         const q = searchQuery.trim().toLowerCase();

//         return receipts.filter((receipt) => {
//             const invoice = invoices.find(
//                 (i) => i.id === receipt.invoice_id
//             );

//             const client =
//                 invoice?.client ||
//                 receipt.client;

//             if (!q) return true;

//             return (
//                 receipt.receipt_number?.toLowerCase().includes(q) ||

//                 invoice?.invoice_number
//                     ?.toLowerCase()
//                     .includes(q) ||

//                 client?.name
//                     ?.toLowerCase()
//                     .includes(q) ||

//                 client?.business_name
//                     ?.toLowerCase()
//                     .includes(q)
//             );
//         });
//     }, [receipts, invoices, searchQuery]);

//     return (
//         <div className="space-y-8 animate-fade-in">

//             {/* Header */}

//             <div className="flex items-center gap-4">
//                 <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shrink-0 shadow-sm">
//                     <ReceiptText className="w-6 h-6 text-white" strokeWidth={2} />
//                 </div>
//                 <div>
//                     <h1 className="text-3xl font-heading font-bold">
//                         Receipts
//                     </h1>
//                     <p className="text-muted-foreground mt-1">
//                         View and manage payment receipts.
//                     </p>
//                 </div>
//             </div>

//             {/* Search */}

//             <div className="relative max-w-md">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

//                 <Input
//                     placeholder="Search receipts..."
//                     className="pl-10"
//                     value={searchQuery}
//                     onChange={(e) =>
//                         setSearchQuery(e.target.value)
//                     }
//                 />
//             </div>

//             {/* Loading */}

//             <div className="space-y-3">

//                 {filtered.map((receipt) => {
//                     const invoice = invoices.find(
//                         (i) => i.id === receipt.invoice_id
//                     );

//                     const client =
//                         invoice?.client ||
//                         receipt.client;

//                     const cur =
//                         receipt.currency ||
//                         invoice?.currency ||
//                         currency;

//                     return (
//                         <Card
//                             key={receipt.id}
//                             className="border-border/50 shadow-card card-hover"
//                         >
//                             <CardContent className="p-0">

//                                 <Link
//                                     to={`/receipts/${receipt.id}`}
//                                     className="block"
//                                 >
//                                     <div className="flex items-center justify-between p-5">

//                                         {/* Left */}

//                                         <div className="flex items-center gap-4 flex-1 min-w-0">

//                                             <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
//                                                 <ReceiptText className="w-6 h-6 text-primary" />
//                                             </div>

//                                             <div className="min-w-0">

//                                                 <h3 className="font-heading font-semibold text-foreground truncate">
//                                                     {invoice?.quotation?.title || receipt.receipt_number} Receipt
//                                                 </h3>

//                                                 <div className="text-sm text-muted-foreground mt-1 space-y-1">

//                                                     <p>
//                                                         {client?.business_name ||
//                                                             client?.name ||
//                                                             "No Client"}
//                                                     </p>

//                                                     <p>
//                                                         Invoice:{" "}
//                                                         {invoice?.invoice_number ||
//                                                             "—"}
//                                                     </p>

//                                                     <p>
//                                                         Paid on{" "}
//                                                         {receipt.payment_date}
//                                                     </p>

//                                                 </div>

//                                             </div>

//                                         </div>

//                                         {/* Right */}

//                                         <div className="text-right">

//                                             <p className="text-xs text-muted-foreground">
//                                                 Amount Received
//                                             </p>

//                                             <p className="font-heading font-bold text-xl">
//                                                 {formatCurrency(
//                                                     Number(receipt.amount),
//                                                     cur
//                                                 )}
//                                             </p>

//                                             <p className="text-xs text-green-600 font-medium mt-1">
//                                                 Paid
//                                             </p>

//                                         </div>

//                                     </div>
//                                 </Link>

//                             </CardContent>
//                         </Card>
//                     );
//                 })}

//                 {filtered.length === 0 && (
//                     <div className="text-center py-16">

//                         <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
//                             <ReceiptText className="w-8 h-8 text-muted-foreground" />
//                         </div>

//                         <p className="text-muted-foreground mb-1">
//                             No receipts found
//                         </p>

//                         <p className="text-sm text-muted-foreground">
//                             Receipts will appear here once invoice
//                             payments are received.
//                         </p>

//                     </div>
//                 )}

//             </div>
//         </div>
//     );
// }



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

            <div className="flex items-center gap-4 pb-2 border-b border-border/60">
                <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center shrink-0 shadow-md shadow-black/10 ring-1 ring-black/5">
                    <ReceiptText className="w-7 h-7 text-white" strokeWidth={2} />
                </div>
                <div>
                    <h1 className="text-3xl font-heading font-bold tracking-tight">
                        Receipts
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage payment receipts.
                    </p>
                </div>
            </div>

            {/* Search */}

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

                <Input
                    placeholder="Search receipts..."
                    className="pl-10 rounded-xl border-border/70 focus-visible:ring-black/20"
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
                            className="border border-border/60 hover:border-black/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden"
                        >
                            <CardContent className="p-0">

                                <Link
                                    to={`/receipts/${receipt.id}`}
                                    className="block"
                                >
                                    <div className="flex items-center justify-between p-5">

                                        {/* Left */}

                                        <div className="flex items-center gap-4 flex-1 min-w-0">

                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                                <ReceiptText className="w-6 h-6 text-primary" />
                                            </div>

                                            <div className="min-w-0">

                                                <h3 className="font-heading font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                    {invoice?.quotation?.title || receipt.receipt_number} Receipt
                                                </h3>

                                                <div className="text-sm text-muted-foreground mt-1 space-y-0.5">

                                                    <p className="truncate">
                                                        {client?.business_name ||
                                                            client?.name ||
                                                            "No Client"}
                                                    </p>

                                                    <p className="truncate">
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

                                        <div className="text-right shrink-0 pl-4">

                                            <p className="text-xs text-muted-foreground">
                                                Amount Received
                                            </p>

                                            <p className="font-heading font-bold text-xl tabular-nums">
                                                {formatCurrency(
                                                    Number(receipt.amount),
                                                    cur
                                                )}
                                            </p>

                                            <span className="inline-block mt-1 text-xs font-medium text-green-700 bg-green-100 rounded-full px-2.5 py-0.5">
                                                Paid
                                            </span>

                                        </div>

                                    </div>
                                </Link>

                            </CardContent>
                        </Card>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="text-center py-20 rounded-2xl border border-dashed border-border/70 bg-secondary/20">

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