import { ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  Plus,
  Settings,
  ChevronRight,
  Receipt,
  BarChart3,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Analytics', href: '/analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Clients', href: '/clients', icon: <Users className="w-5 h-5" /> },
  { label: 'Services', href: '/services', icon: <Package className="w-5 h-5" /> },
  { label: 'Quotations', href: '/quotations', icon: <FileText className="w-5 h-5" /> },
  { label: 'Invoices', href: '/invoices', icon: <Receipt className="w-5 h-5" /> },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { brandKit, businessProfile, user, loading, signOut } = useApp();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Keep favicon in sync with the configured company logo.
  useEffect(() => {
    const href = brandKit?.logo_url || "/favicon.ico";
    const head = document.head;

    const ensureLink = (rel: string) => {
      let link = head.querySelector<HTMLLinkElement>(`link[rel='${rel}']`);
      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        head.appendChild(link);
      }
      link.href = href;
    };

    ensureLink("icon");
    ensureLink("shortcut icon");
  }, [brandKit?.logo_url]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <div className="w-12 h-12 rounded-full bg-primary/20"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Redirecting to login…</p>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 sidebar-glass text-sidebar-foreground flex flex-col fixed h-full z-50">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            {businessProfile.logo_url || brandKit?.logo_url ? (
              <img
                src={businessProfile.logo_url || brandKit?.logo_url || "/favicon.ico"}
                alt="Logo"
                className="w-10 h-10 object-contain rounded-lg"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-heading font-bold text-lg">
                  {(businessProfile.company_name || "Q").trim()[0]?.toUpperCase?.() || "Q"}
                </span>
              </div>
            )}
            <div>
              <h1 className="font-heading font-bold text-sidebar-foreground">{businessProfile.company_name || "QuoteForge"}</h1>
              <p className="text-xs text-sidebar-foreground/60">Operating System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "nav-item",
                  isActive && "nav-item-active"
                )}
              >
                <span className={cn(
                  "transition-colors",
                  isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                )}>
                  {item.icon}
                </span>
                <span className={cn(
                  "font-medium transition-colors",
                  isActive ? "text-sidebar-foreground" : "text-sidebar-foreground/70"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto text-sidebar-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Action */}
        <div className="p-4 border-t border-sidebar-border">
          <Link to="/quotations/new">
            <Button className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 font-heading gap-2 rounded-xl">
              <Plus className="w-4 h-4" />
              New Quotation
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Link
            to="/settings"
            className="nav-item text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="nav-item text-sidebar-foreground/60 hover:text-sidebar-foreground w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}