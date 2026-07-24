// import { useState } from "react";
// import { Banknote, Smartphone, CreditCard, Landmark, FileText, Globe, MoreHorizontal, CheckCircle2 } from "lucide-react";
// import { cn } from "@/lib/utils";

// type Method = "Cash" | "Online" | "Bank Transfer" | "UPI" | "Card" | "Cheque" | "Other";

// const METHODS: { id: Method; label: string; icon: typeof Banknote; description: string }[] = [
//     { id: "UPI", label: "UPI", icon: Smartphone, description: "Pay instantly via UPI apps" },
//     { id: "Bank Transfer", label: "Bank Transfer", icon: Landmark, description: "NEFT / IMPS / RTGS" },
//     { id: "Card", label: "Card", icon: CreditCard, description: "Credit or Debit card" },
//     { id: "Online", label: "Online", icon: Globe, description: "Payment gateway link" },
//     { id: "Cash", label: "Cash", icon: Banknote, description: "Pay in person" },
//     { id: "Cheque", label: "Cheque", icon: FileText, description: "Pay via cheque" },
//     { id: "Other", label: "Other", icon: MoreHorizontal, description: "Alternative arrangement" },
// ];

// // NOTE: These are placeholder values. Replace with your real UPI ID / bank
// // details, or wire them up from your brandKit/settings once those fields exist.
// const PAYMENT_INSTRUCTIONS: Record<Method, string> = {
//     UPI: "Scan the QR code or pay to UPI ID: yourbusiness@upi",
//     "Bank Transfer": "A/C Name: Triple S Production • A/C No: XXXXXXXXXX • IFSC: XXXX0000000",
//     Card: "Card payments are processed via our secure payment link. Please contact us to receive the link.",
//     Online: "Please contact us to receive a secure online payment link.",
//     Cash: "Cash payments can be made in person. Please coordinate a time with our team.",
//     Cheque: "Please make the cheque payable to Triple S Production and share the reference once sent.",
//     Other: "Please contact us to arrange an alternative payment method.",
// };

// type Props = {
//     paymentNotes?: string | null;
// };

// export function PaymentMethodSelector({ paymentNotes }: Props) {
//     const [selected, setSelected] = useState<Method | null>(null);

//     return (
//         <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
//             <div className="px-5 py-4 border-b border-border/50">
//                 <p className="font-heading font-bold text-foreground">How would you like to pay?</p>
//                 <p className="text-sm text-muted-foreground mt-0.5">Select a payment method to see instructions.</p>
//             </div>

//             <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
//                 {METHODS.map((m) => {
//                     const Icon = m.icon;
//                     const isSelected = selected === m.id;
//                     return (
//                         <button
//                             key={m.id}
//                             type="button"
//                             onClick={() => setSelected(isSelected ? null : m.id)}
//                             className={cn(
//                                 "relative flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all duration-150",
//                                 isSelected
//                                     ? "border-black bg-black text-white shadow-sm"
//                                     : "border-border/60 bg-background hover:border-black/30 hover:bg-secondary/40"
//                             )}
//                         >
//                             {isSelected && (
//                                 <CheckCircle2 className="absolute top-2.5 right-2.5 w-4 h-4 text-white" />
//                             )}
//                             <Icon className={cn("w-5 h-5", isSelected ? "text-white" : "text-foreground")} strokeWidth={2} />
//                             <div>
//                                 <p className="text-sm font-semibold">{m.label}</p>
//                                 <p className={cn("text-[11px] mt-0.5", isSelected ? "text-white/70" : "text-muted-foreground")}>
//                                     {m.description}
//                                 </p>
//                             </div>
//                         </button>
//                     );
//                 })}
//             </div>

//             {selected && (
//                 <div className="mx-4 mb-4 rounded-xl border border-border/60 bg-secondary/30 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
//                     <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">
//                         {selected} Instructions
//                     </p>
//                     <p className="text-sm text-foreground leading-relaxed">
//                         {PAYMENT_INSTRUCTIONS[selected]}
//                     </p>
//                 </div>
//             )}

//             {paymentNotes && (
//                 <div className="mx-4 mb-4 rounded-xl border border-dashed border-border/60 p-4">
//                     <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">
//                         Additional Payment Notes
//                     </p>
//                     <p className="text-sm text-foreground whitespace-pre-wrap">{paymentNotes}</p>
//                 </div>
//             )}
//         </div>
//     );
// }



import { useState } from "react";
import { Banknote, Smartphone, CreditCard, Landmark, FileText, Globe, MoreHorizontal, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Method = "Cash" | "Online" | "Bank Transfer" | "UPI" | "Card" | "Cheque" | "Other";

const METHODS: { id: Method; label: string; icon: typeof Banknote; description: string }[] = [
    { id: "UPI", label: "UPI", icon: Smartphone, description: "Pay instantly via UPI apps" },
    { id: "Bank Transfer", label: "Bank Transfer", icon: Landmark, description: "NEFT / IMPS / RTGS" },
    { id: "Card", label: "Card", icon: CreditCard, description: "Credit or Debit card" },
    { id: "Online", label: "Online", icon: Globe, description: "Payment gateway link" },
    { id: "Cash", label: "Cash", icon: Banknote, description: "Pay in person" },
    { id: "Cheque", label: "Cheque", icon: FileText, description: "Pay via cheque" },
    { id: "Other", label: "Other", icon: MoreHorizontal, description: "Alternative arrangement" },
];

const PAYMENT_INSTRUCTIONS: Record<Exclude<Method, "Online" | "Card">, string> = {
    UPI: "Scan the QR code or pay to UPI ID: yourbusiness@upi",
    "Bank Transfer": "A/C Name: Triple S Production • A/C No: XXXXXXXXXX • IFSC: XXXX0000000",
    Cash: "Cash payments can be made in person. Please coordinate a time with our team.",
    Cheque: "Please make the cheque payable to Triple S Production and share the reference once sent.",
    Other: "Please contact us to arrange an alternative payment method.",
};

const API_BASE = import.meta.env.VITE_API_URL as string; // adjust if repo.ts uses a different constant

type Props = {
    invoiceId: string;
    invoiceNumber: string;
    clientName?: string | null;
    clientEmail?: string | null;
    paymentNotes?: string | null;
};

declare global {
    interface Window {
        Razorpay: any;
    }
}

function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export function PaymentMethodSelector({ invoiceId, invoiceNumber, clientName, clientEmail, paymentNotes }: Props) {
    const [selected, setSelected] = useState<Method | null>(null);
    const [payingOnline, setPayingOnline] = useState(false);
    const [paymentSubmitted, setPaymentSubmitted] = useState(false);
    const [payError, setPayError] = useState<string | null>(null);

    const handleOnlinePayment = async () => {
        setPayError(null);
        setPayingOnline(true);
        try {
            const scriptOk = await loadRazorpayScript();
            if (!scriptOk) throw new Error("Could not load payment gateway. Check your connection.");

            const res = await fetch(`${API_BASE}/invoices/${invoiceId}/razorpay-order`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Could not start payment. Please try again.");
            const order = await res.json();

            const rzp = new window.Razorpay({
                key: order.key_id,
                amount: order.amount,
                currency: order.currency,
                order_id: order.order_id,
                name: "Triple S Production",
                description: `Invoice ${invoiceNumber}`,
                prefill: {
                    name: clientName || "",
                    email: clientEmail || "",
                },
                // This handler is UX-only. The invoice is marked paid by the
                // Razorpay webhook on the backend, never from this callback —
                // a browser-side "success" signal can be spoofed.
                handler: function () {
                    setPaymentSubmitted(true);
                },
                modal: {
                    ondismiss: function () {
                        setPayingOnline(false);
                    },
                },
                theme: { color: "#000000" },
            });

            rzp.on("payment.failed", function () {
                setPayError("Payment failed. You can try again.");
                setPayingOnline(false);
            });

            rzp.open();
        } catch (err) {
            setPayError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setPayingOnline(false);
        }
    };

    if (paymentSubmitted) {
        return (
            <div className="rounded-2xl border border-border/60 bg-card p-5 text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                <p className="font-heading font-bold text-foreground">Payment submitted</p>
                <p className="text-sm text-muted-foreground mt-1">
                    We're confirming your payment — this page will update once it clears.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50">
                <p className="font-heading font-bold text-foreground">How would you like to pay?</p>
                <p className="text-sm text-muted-foreground mt-0.5">Select a payment method to see instructions.</p>
            </div>

            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {METHODS.map((m) => {
                    const Icon = m.icon;
                    const isSelected = selected === m.id;
                    const isOnlineType = m.id === "Online" || m.id === "Card";
                    return (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                                setSelected(isSelected ? null : m.id);
                                setPayError(null);
                                if (!isSelected && isOnlineType) handleOnlinePayment();
                            }}
                            disabled={payingOnline}
                            className={cn(
                                "relative flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all duration-150",
                                isSelected
                                    ? "border-black bg-black text-white shadow-sm"
                                    : "border-border/60 bg-background hover:border-black/30 hover:bg-secondary/40",
                                payingOnline && isOnlineType && "opacity-60"
                            )}
                        >
                            {isSelected && !isOnlineType && (
                                <CheckCircle2 className="absolute top-2.5 right-2.5 w-4 h-4 text-white" />
                            )}
                            {isSelected && isOnlineType && payingOnline && (
                                <Loader2 className="absolute top-2.5 right-2.5 w-4 h-4 text-white animate-spin" />
                            )}
                            <Icon className={cn("w-5 h-5", isSelected ? "text-white" : "text-foreground")} strokeWidth={2} />
                            <div>
                                <p className="text-sm font-semibold">{m.label}</p>
                                <p className={cn("text-[11px] mt-0.5", isSelected ? "text-white/70" : "text-muted-foreground")}>
                                    {m.description}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {payError && (
                <div className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {payError}
                </div>
            )}

            {selected && selected !== "Online" && selected !== "Card" && (
                <div className="mx-4 mb-4 rounded-xl border border-border/60 bg-secondary/30 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">
                        {selected} Instructions
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                        {PAYMENT_INSTRUCTIONS[selected]}
                    </p>
                </div>
            )}

            {paymentNotes && (
                <div className="mx-4 mb-4 rounded-xl border border-dashed border-border/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">
                        Additional Payment Notes
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{paymentNotes}</p>
                </div>
            )}
        </div>
    );
}