import { Link } from 'react-router-dom';
import {
  FileText,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Send,
  CheckCircle,
  Calendar,
  Receipt
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/types';
import { format } from 'date-fns';
import { NotificationBell } from "@/components/NotificationBell";

export default function Dashboard() {
  const { quotations, invoices } = useApp();

  // Calculate KPIs
  const activeQuotations = quotations.filter((q) => !q.is_template);

  const ongoingProjects = activeQuotations.filter((q) => q.status === 'accepted' && !invoices.some((i) => i.quotation_id === q.id && i.invoice_status === 'paid')).length;
  const pendingPayments = invoices.filter((i) => i.invoice_status !== 'paid').length;
  const completedProjects = activeQuotations.filter((q) => invoices.some((i) => i.quotation_id === q.id && i.invoice_status === 'paid')).length;
  const totalQuotations = quotations.filter(q => !q.is_template).length;
  const sentQuotations = quotations.filter(q => q.status === 'sent' || q.status === 'accepted' || q.status === 'declined').length;
  const acceptedQuotations = quotations.filter(q => q.status === 'accepted').length;
  const conversionRate = sentQuotations > 0 ? Math.round((acceptedQuotations / sentQuotations) * 100) : 0;

  const stats = [
    {
      label: 'Ongoing Projects',
      value: ongoingProjects,
      icon: Calendar,
      color: 'text-foreground',
    },
    {
      label: 'Pending Payments',
      value: pendingPayments,
      icon: Receipt,
      color: 'text-amber-600',
    },
    {
      label: 'Completed Projects',
      value: completedProjects,
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      label: 'Total Quotations',
      value: totalQuotations,
      icon: FileText,
      color: 'text-primary'
    },
    {
      label: 'Sent Quotations',
      value: sentQuotations,
      icon: Send,
      color: 'text-blue-500'
    },
    {
      label: 'Accepted Quotations',
      value: acceptedQuotations,
      icon: CheckCircle,
      color: 'text-green-500'
    },
    {
      label: 'Conversion Rate',
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: 'text-accent'
    },
  ];

  const recentQuotations = quotations
    .filter(q => !q.is_template)
    .slice(0, 5);

  const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    sent: 'bg-primary/10 text-primary',
    accepted: 'bg-green-100 text-green-700',
    declined: 'bg-destructive/10 text-destructive',
    expired: 'bg-muted text-muted-foreground',
  };


  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your quotation overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <Link to="/quotations/new">
            <Button className="font-heading gap-2 rounded-xl">
              <Plus className="w-4 h-4" />
              Create Quotation
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="glass-card card-hover">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl bg-secondary`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-heading font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Quotations */}
        <Card className="lg:col-span-2 glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="font-heading text-lg">Recent Quotations</CardTitle>
            <Link to="/quotations">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:bg-black hover:text-white focus-visible:text-white cursor-pointer">
                View all <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentQuotations.length > 0 ? (
              <div className="space-y-3">
                {recentQuotations.map((quote) => (
                  <Link
                    key={quote.id}
                    to={`/quotations/${quote.id}/preview`}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {quote.client?.name || quote.client?.business_name || 'No client'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {quote.title || `Quote #${quote.quotation_number}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-heading font-semibold text-foreground">
                          {formatCurrency(quote.total, quote.currency)}
                        </p>
                        {quote.valid_until && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Valid: {format(new Date(quote.valid_until), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      <Badge className={statusColors[quote.status]}>
                        {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No quotations yet</p>
                <Link to="/quotations/new">
                  <Button variant="outline" className="gap-2 rounded-xl">
                    <Plus className="w-4 h-4" /> Create your first quotation
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/quotations/new" className="block">
              <div className="p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">New Quotation</p>
                    <p className="text-sm text-muted-foreground">Create a new quote</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link to="/clients" className="block">
              <div className="p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Add Client</p>
                    <p className="text-sm text-muted-foreground">Register new client</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link to="/analytics" className="block">
              <div className="p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">View Analytics</p>
                    <p className="text-sm text-muted-foreground">Performance insights</p>
                  </div>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}