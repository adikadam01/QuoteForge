import React from "react";
import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";


import type { BrandKit as BrandKitType } from "@/lib/types";
import ClientOptionsPage from "@/pages/ClientOptions";
import DataSettings from "@/pages/DataSettings";
import QuotationTemplates from "@/pages/QuotationTemplates";

function DocumentDefaultsPage() {
  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading">Quotation Templates</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Manage reusable quotation point templates used during quotation creation.
        </CardContent>
      </Card>

      <QuotationTemplates />
    </div>
  );
}

const tabBase = "text-sm font-medium px-3 py-2 rounded-xl";
const active = "bg-muted text-foreground";
const inactive = "text-muted-foreground hover:text-foreground hover:bg-muted/50";

function SettingsShell(props: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Settings</h1>
        {props.description ? <p className="text-muted-foreground mt-1">{props.description}</p> : null}
      </div>

      <div className="w-full overflow-x-auto">
        <div className="inline-flex items-center gap-1 rounded-2xl border border-border/50 bg-background/50 p-1">
          <NavLink to="/settings/business" className={({ isActive }) => `${tabBase} ${isActive ? active : inactive}`}
          >
            Business
          </NavLink>
          <NavLink to="/settings/client-fields" className={({ isActive }) => `${tabBase} ${isActive ? active : inactive}`}
          >
            Client Fields
          </NavLink>
          <NavLink to="/settings/document-defaults" className={({ isActive }) => `${tabBase} ${isActive ? active : inactive}`}
          >
            Document Defaults
          </NavLink>
          <NavLink to="/settings/data" className={({ isActive }) => `${tabBase} ${isActive ? active : inactive}`}
          >
            Data
          </NavLink>
        </div>
      </div>

      {props.children}
    </div>
  );
}

const defaultBrandKit: BrandKitType = {
  id: "",
  logo_url: null,
  company_name: "Your Company",
  primary_color: "#000000",
  secondary_color: "#ffffff",
  accent_color: "#666666",
  font_heading: "Montserrat",
  font_body: "Inter",
  email: null,
  phone: null,
  address: null,
  website: null,
  default_currency: "INR",
} as unknown as BrandKitType;

function isHexColor(value: string) {
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(value);
}

function safeColor(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  return isHexColor(value) ? value : fallback;
}

function normalizeColors(brand: BrandKitType): BrandKitType {
  return {
    ...brand,
    primary_color: safeColor(brand.primary_color, defaultBrandKit.primary_color),
    secondary_color: safeColor(brand.secondary_color, defaultBrandKit.secondary_color),
    accent_color: safeColor(brand.accent_color, defaultBrandKit.accent_color),
  };
}

function BusinessSettingsPage() {
  const { brandKit, setBrandKit, setCurrency, invoiceAutoFromQuotation, setInvoiceAutoFromQuotation } = useApp();
  const [localBrand, setLocalBrand] = React.useState<BrandKitType>(brandKit || defaultBrandKit);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (brandKit) setLocalBrand(brandKit);
  }, [brandKit]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalBrand((prev) => ({ ...prev, logo_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const next = normalizeColors(localBrand);
    await setBrandKit(next);
    setLocalBrand(next);
  };

  return (
    <SettingsShell title="Settings" description="Business">
      <div className="space-y-6 max-w-4xl">
        {/* 1) Business Profile */}
        <Card className="glass-card">
          <CardHeader className="space-y-1">
            <CardTitle className="font-heading">Business Profile</CardTitle>
            <p className="text-sm text-muted-foreground">Company details used on quotations and invoices.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={localBrand.company_name || ""}
                  onChange={(e) => setLocalBrand((p) => ({ ...p, company_name: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Website (optional)</Label>
                <Input
                  value={localBrand.website || ""}
                  onChange={(e) => setLocalBrand((p) => ({ ...p, website: e.target.value || null }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={localBrand.email || ""}
                  onChange={(e) => setLocalBrand((p) => ({ ...p, email: e.target.value || null }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={localBrand.phone || ""}
                  onChange={(e) => setLocalBrand((p) => ({ ...p, phone: e.target.value || null }))}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address (optional)</Label>
              <Input
                value={localBrand.address || ""}
                onChange={(e) => setLocalBrand((p) => ({ ...p, address: e.target.value || null }))}
                className="rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* 2) Brand & Identity */}
        <Card className="glass-card">
          <CardHeader className="space-y-1">
            <CardTitle className="font-heading">Brand & Identity</CardTitle>
            <p className="text-sm text-muted-foreground">Logo, colors and typography used across documents.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border/50">
                {localBrand.logo_url ? (
                  <img src={localBrand.logo_url} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-xs text-muted-foreground">No logo</div>
                )}
              </div>
              <div className="space-y-2">
                <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" />
                <Button variant="outline" className="rounded-xl" onClick={() => fileInputRef.current?.click()}>
                  Upload Logo
                </Button>
                <p className="text-xs text-muted-foreground">PNG/JPG recommended. Transparent background works best.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Colors</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 rounded-xl border border-border/50 p-3">
                  <input
                    type="color"
                    value={safeColor(localBrand.primary_color, defaultBrandKit.primary_color)}
                    onChange={(e) => setLocalBrand((p) => ({ ...p, primary_color: e.target.value }))}
                    className="h-9 w-12 rounded-lg bg-transparent"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Primary</p>
                    <p className="text-xs text-muted-foreground">{safeColor(localBrand.primary_color, defaultBrandKit.primary_color)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border/50 p-3">
                  <input
                    type="color"
                    value={safeColor(localBrand.secondary_color, defaultBrandKit.secondary_color)}
                    onChange={(e) => setLocalBrand((p) => ({ ...p, secondary_color: e.target.value }))}
                    className="h-9 w-12 rounded-lg bg-transparent"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Secondary</p>
                    <p className="text-xs text-muted-foreground">{safeColor(localBrand.secondary_color, defaultBrandKit.secondary_color)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border/50 p-3">
                  <input
                    type="color"
                    value={safeColor(localBrand.accent_color, defaultBrandKit.accent_color)}
                    onChange={(e) => setLocalBrand((p) => ({ ...p, accent_color: e.target.value }))}
                    className="h-9 w-12 rounded-lg bg-transparent"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Accent</p>
                    <p className="text-xs text-muted-foreground">{safeColor(localBrand.accent_color, defaultBrandKit.accent_color)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Heading font</Label>
                <Input
                  value={localBrand.font_heading || ""}
                  onChange={(e) => setLocalBrand((p) => ({ ...p, font_heading: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Body font</Label>
                <Input
                  value={localBrand.font_body || ""}
                  onChange={(e) => setLocalBrand((p) => ({ ...p, font_body: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3) Business Defaults */}
        <Card className="glass-card">
          <CardHeader className="space-y-1">
            <CardTitle className="font-heading">Business Defaults</CardTitle>
            <p className="text-sm text-muted-foreground">Defaults applied when creating new documents.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Currency</Label>
                <Select
                  value={localBrand.default_currency || "INR"}
                  onValueChange={(v) => {
                    const next = v === "USD" ? "USD" : "INR";
                    setLocalBrand((p) => ({ ...p, default_currency: next } as BrandKitType));
                    void setCurrency(next);
                  }}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Used for new quotations and invoices.</p>
              </div>

              <div className="space-y-2">
                <Label>Invoice workflow</Label>
                <div className="rounded-xl border border-border/50 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Auto-generate invoice</p>
                      <p className="text-xs text-muted-foreground">Create invoice automatically when a quotation is approved.</p>
                    </div>
                    <Switch checked={invoiceAutoFromQuotation} onCheckedChange={setInvoiceAutoFromQuotation} />
                  </div>

                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end">
          <Button className="rounded-xl" onClick={() => void handleSave()}>
            Save Changes
          </Button>
        </div>
      </div>
    </SettingsShell>
  );
}

function BusinessPage() {
  const location = useLocation();

  return (
    <Routes location={location}>
      <Route index element={<BusinessSettingsPage />} />
      <Route path="brand-kit" element={<BusinessSettingsPage />} />
    </Routes>
  );
}

function DataPage() {
  return (
    <SettingsShell title="Settings" description="Data">
      <DataSettings />
    </SettingsShell>
  );
}

export default function SettingsHub() {
  const location = useLocation();

  return (
    <Routes location={location}>
      <Route index element={<Navigate to="/settings/business" replace />} />

      <Route path="business/*" element={<BusinessPage />} />
      <Route path="billing" element={<Navigate to="/settings/business" replace />} />
      <Route path="client-fields" element={(
        <SettingsShell title="Settings" description="Client Fields">
          <ClientOptionsPage />
        </SettingsShell>
      )} />
      <Route path="document-defaults" element={(
        <SettingsShell title="Settings" description="Document Defaults">
          <DocumentDefaultsPage />
        </SettingsShell>
      )} />
      <Route path="data" element={<DataPage />} />

      {/* Legacy routes kept working via internal redirects */}
      <Route path="profile" element={<Navigate to="/settings/business" replace />} />
      <Route path="brand-kit" element={<Navigate to="/settings/business/brand-kit" replace />} />
      <Route path="client-options" element={<Navigate to="/settings/client-fields" replace />} />
      <Route path="quotation-templates" element={<Navigate to="/settings/document-defaults" replace />} />
    </Routes>
  );
}
