import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/types';
import type { Quotation } from '@/lib/types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Send,
  CheckCircle,
  TrendingUp,
  DollarSign,
  BarChart3,
} from 'lucide-react';

export default function Analytics() {
  const { quotations, currency, receipts, clients } = useApp();

  const liveQuotes = quotations.filter((q) => !q.is_template);

  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const totalCreated = liveQuotes.length;
  const totalSent = liveQuotes.filter((q) => q.sent_at !== null || q.status === 'sent').length;
  const approved = liveQuotes.filter((q) => (q.status === 'accepted' || q.status === 'invoiced') && q.accepted_at !== null);
  const totalApproved = approved.length;
  const approvalRate = totalSent > 0 ? Math.round((totalApproved / totalSent) * 100) : 0;

  const totalApprovedValue = approved.reduce((sum, q) => sum + Number(q.total || 0), 0);

  const displayCurrency: Quotation['currency'] =
    (approved[0]?.currency || liveQuotes[0]?.currency || currency) as Quotation['currency'];

  /*
  const funnelData = useMemo(
  () => [
    { stage: 'Created', value: totalCreated },
    { stage: 'Sent', value: totalSent },
    { stage: 'Approved', value: totalApproved },
  ],
    [totalCreated, totalApproved, totalSent],
  );
  */

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    liveQuotes.forEach((q) => {
      const d = new Date(q.created_at);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.add(key);
    });

    return Array.from(months)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((key) => {
        const [y, m] = key.split('-');
        const d = new Date(Number(y), Number(m) - 1, 1);
        const label = d.toLocaleString(undefined, { month: 'short', year: 'numeric' });
        return { key, label };
      });
  }, [liveQuotes]);

  const filteredQuotesForServices = useMemo(() => {
    if (selectedMonth === 'all') return liveQuotes;
    return liveQuotes.filter((q) => {
      const d = new Date(q.created_at);
      if (Number.isNaN(d.getTime())) return false;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    });
  }, [liveQuotes, selectedMonth]);

  const topServices = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();

    const add = (name: string, amount: number) => {
      const key = (name || 'Service').trim() || 'Service';
      const current = map.get(key) || { name: key, count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += Number.isFinite(amount) ? amount : 0;
      map.set(key, current);
    };

    filteredQuotesForServices.forEach((q) => {
      const blocks = q.service_blocks || [];
      if (blocks.length > 0) {
        blocks.forEach((b) => add(b.service_name || 'Service', Number(b.price || 0)));
        return;
      }

      const lines = q.services || [];
      if (lines.length > 0) {
        lines.forEach((s) => add(s.service_name || 'Service', Number(s.total || 0)));
        return;
      }

      // No line-item detail: attribute the quotation total to the quotation title.
      add(q.title || 'Quotation', Number(q.total || 0));
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [filteredQuotesForServices]);

  const topClients = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number }>();

    receipts.forEach((r) => {
      const client = clients.find((c) => c.id === r.client_id);
      const name = (client?.business_name || client?.name || 'Unknown Client').trim() || 'Unknown Client';
      const current = map.get(name) || { name, revenue: 0 };
      current.revenue += Number(r.amount || 0);
      map.set(name, current);
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [receipts, clients]);

  const trendData = useMemo(() => {
    // last 6 months (month buckets)
    const now = new Date();
    const buckets: { key: string; label: string; created: number; approved: number }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString(undefined, { month: 'short' });
      buckets.push({ key, label, created: 0, approved: 0 });
    }

    const byKey = new Map(buckets.map((b) => [b.key, b]));

    liveQuotes.forEach((q) => {
      const date = new Date(q.created_at);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = byKey.get(key);
      if (!bucket) return;
      bucket.created += 1;
      if (q.status === 'accepted' || q.status === 'invoiced') bucket.approved += 1;
    });

    return buckets;
  }, [liveQuotes]);

  const chartConfig = {
    created: { label: 'Created', color: 'hsl(var(--primary))' },
    approved: { label: 'Approved', color: 'hsl(var(--accent))' },
    value: { label: 'Count', color: 'hsl(var(--primary))' },
    revenue: { label: 'Revenue', color: 'hsl(var(--primary))' },
  } as const;

  const kpis = [
    { label: 'Quotations Created', value: totalCreated, icon: BarChart3 },
    { label: 'Quotations Sent', value: totalSent, icon: Send },
    { label: 'Quotations Approved', value: totalApproved, icon: CheckCircle },
    { label: 'Approval Rate', value: `${approvalRate}%`, icon: TrendingUp },
    { label: 'Approved Value', value: formatCurrency(totalApprovedValue, displayCurrency), icon: DollarSign },
  ];

  if (liveQuotes.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Performance insights and metrics</p>
        </div>

        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-2">No data yet</p>
          <p className="text-sm text-muted-foreground">Create and send quotations to start tracking approvals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shrink-0 shadow-sm">
          <BarChart3 className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Performance insights and metrics</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {kpis.map((kpi) => (
          // <Card key={kpi.label} className="glass-card">
          <Card
            key={kpi.label}
            className="glass-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.22)]"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-secondary/50">
                  <kpi.icon className="w-5 h-5 text-foreground" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-heading font-bold text-foreground">{kpi.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Top Paying Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topClients.length > 0 ? (
                topClients.map((c, idx) => (
                  <div key={c.name} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-sm font-heading font-bold">
                        {idx + 1}
                      </div>
                      <div className="font-medium text-foreground truncate max-w-[240px]">{c.name}</div>
                    </div>
                    <div className="font-heading font-bold text-foreground">
                      {formatCurrency(c.revenue, displayCurrency)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No payments received yet.</p>
              )}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Based on payments received (receipts).</p>
          </CardContent>
        </Card>

        <Card className="glass-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
          <CardHeader>
            <CardTitle className="font-heading text-lg">6-Month Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <LineChart data={trendData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="created" stroke="var(--color-created)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="approved" stroke="var(--color-approved)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="glass-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="font-heading text-lg">Top Services (Revenue)</CardTitle>
            <div className="w-full sm:w-56">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="rounded-xl h-9">
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  {monthOptions.map((m) => (
                    <SelectItem key={m.key} value={m.key}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ revenue: { label: 'Revenue', color: 'hsl(var(--primary))' } }}
              className="h-[260px] w-full"
            >
              <BarChart data={topServices} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} hide />
                <YAxis allowDecimals={false} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => {
                        if (typeof value === 'number') {
                          return (
                            <div className="flex flex-1 justify-between leading-none items-center">
                              <span className="text-muted-foreground">Revenue</span>
                              <span className="font-mono font-medium tabular-nums text-foreground">
                                {formatCurrency(value, displayCurrency)}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      }}
                      labelFormatter={(label, payload) => {
                        const p = payload?.[0]?.payload as { name?: string } | undefined;
                        return p?.name || String(label);
                      }}
                    />
                  }
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={8} />
              </BarChart>
            </ChartContainer>
            <div className="mt-3 text-xs text-muted-foreground">
              Showing up to {topServices.length} services.
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}