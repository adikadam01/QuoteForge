import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Receipt } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import type { PaymentStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/types";

const statusConfig = {
  draft: {
    label: "Draft",
    color: "bg-muted text-muted-foreground",
  },
  impending: {
    label: "Impending",
    color: "bg-blue-100 text-blue-700",
  },
  overdue: {
    label: "Overdue",
    color: "bg-red-100 text-red-700",
  },
  paid: {
    label: "Paid",
    color: "bg-green-100 text-green-700",
  },
  partially_paid: {
    label: "Partially Paid",
    color: "bg-amber-100 text-amber-700",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-600",
  },
} as const;

export default function Invoices() {
  const { currency, invoices, refreshInvoices } = useApp();
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'paid'>('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshInvoices();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return invoices
      .filter((inv) => (statusFilter === 'all' ? true : inv.invoice_status === statusFilter))
      .filter((inv) => {
        if (!q) return true;
        return (
          inv.invoice_number.toLowerCase().includes(q) ||
          (inv.client?.name || "").toLowerCase().includes(q) ||
          (inv.client?.business_name || "").toLowerCase().includes(q)
        );
      });
  }, [invoices, searchQuery, statusFilter]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">View and manage invoices.</p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['all', 'draft', 'sent', 'paid'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 h-10 rounded-md border border-input text-sm transition-colors ${statusFilter === s ? 'bg-secondary' : 'bg-background'
                }`}
              type="button"
            >
              {s === 'all' ? 'All' : s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <div className="animate-pulse">
            <div className="w-12 h-12 rounded-full bg-primary/20"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((invoice) => {
            const cfg = statusConfig[(invoice.status as keyof typeof statusConfig) || 'draft'] ?? statusConfig.draft;
            const invCurrency = invoice.currency || currency;
            return (
              <Card key={invoice.id} className="border-border/50 shadow-card card-hover">
                <CardContent className="p-0">
                  <Link to={`/invoices/${invoice.id}`} className="block">
                    <div className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Receipt className="w-6 h-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-heading font-semibold text-foreground truncate">
                              {invoice.invoice_number}
                            </h3>
                            <Badge className={cfg.color}>{invoice.invoice_status?.toUpperCase?.() || cfg.label}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              {invoice.client?.business_name || invoice.client?.name || "No client"}
                            </span>
                            {invoice.due_date && <span>Due: {invoice.due_date}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-heading font-bold text-xl text-foreground">
                          {formatCurrency(Number(invoice.total), invCurrency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Due: {formatCurrency(Number(invoice.amount_due), invCurrency)}
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
                <Receipt className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-1">No invoices yet</p>
              <p className="text-sm text-muted-foreground">
                Create an invoice from an approved quotation to see it here.
              </p>
              <Link to="/quotations" className="inline-block mt-4">
                <span className="text-sm text-primary underline">Go to quotations</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
