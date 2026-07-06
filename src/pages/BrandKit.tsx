import { useState, useRef } from "react";
import { Palette, Upload, Check, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { BrandKit as BrandKitType } from "@/lib/types";

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
};

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

export default function BrandKit() {
  const { brandKit, setBrandKit } = useApp();
  const [localBrand, setLocalBrand] = useState<BrandKitType>(brandKit || defaultBrandKit);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalBrand((prev) => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const next = normalizeColors(localBrand);
    setBrandKit(next);
    setLocalBrand(next);
    toast({
      title: "Brand Kit Updated",
      description: "Your brand settings have been saved successfully.",
    });
  };

  const handleReset = () => {
    setLocalBrand({ ...defaultBrandKit, id: localBrand.id });
    toast({
      title: "Reset to Default",
      description: "Brand kit has been reset to default values.",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Brand Kit</h1>
          <p className="text-muted-foreground mt-1">Customize your company's branding for quotations and invoices</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} className="rounded-xl gap-2">
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
          <Button onClick={handleSave} className="rounded-xl gap-2">
            <Check className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Logo Upload */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Company Logo
          </CardTitle>
          <CardDescription>Upload your company logo to appear on quotations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
              {localBrand.logo_url ? (
                <img src={localBrand.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Palette className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-xl">
                Choose File
              </Button>
              <p className="text-sm text-muted-foreground">PNG, JPG up to 2MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading">Company Information</CardTitle>
          <CardDescription>Basic company details for documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={localBrand.company_name}
                onChange={(e) => setLocalBrand((prev) => ({ ...prev, company_name: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={localBrand.website || ""}
                onChange={(e) => setLocalBrand((prev) => ({ ...prev, website: e.target.value || null }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={localBrand.email || ""}
                onChange={(e) => setLocalBrand((prev) => ({ ...prev, email: e.target.value || null }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={localBrand.phone || ""}
                onChange={(e) => setLocalBrand((prev) => ({ ...prev, phone: e.target.value || null }))}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={localBrand.address || ""}
              onChange={(e) => setLocalBrand((prev) => ({ ...prev, address: e.target.value || null }))}
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
