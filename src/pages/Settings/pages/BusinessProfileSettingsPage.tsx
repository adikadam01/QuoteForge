import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/contexts/AppContext";

export function BusinessProfileSettingsPage() {
  const { businessProfile, setBusinessProfile } = useApp();

  const fileRef = React.useRef<HTMLInputElement>(null);
  const [local, setLocal] = React.useState(businessProfile);

  React.useEffect(() => {
    setLocal(businessProfile);
  }, [businessProfile]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocal((p) => ({ ...p, logo_url: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    await setBusinessProfile(local);
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading">Business Profile</CardTitle>
          <p className="text-sm text-muted-foreground">This information is used on quotations and invoices.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border/50">
              {local.logo_url ? (
                <img src={local.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="text-xs text-muted-foreground">No logo</div>
              )}
            </div>
            <div className="space-y-2">
              <Input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <Button variant="outline" className="rounded-xl" onClick={() => fileRef.current?.click()}>
                Upload Logo
              </Button>
              <p className="text-xs text-muted-foreground">PNG/JPG recommended.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company name</Label>
              <Input value={local.company_name} onChange={(e) => setLocal((p) => ({ ...p, company_name: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={local.email || ""} onChange={(e) => setLocal((p) => ({ ...p, email: e.target.value || null }))} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={local.phone || ""} onChange={(e) => setLocal((p) => ({ ...p, phone: e.target.value || null }))} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input value={local.whatsapp || ""} onChange={(e) => setLocal((p) => ({ ...p, whatsapp: e.target.value || null }))} className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea
              value={local.address || ""}
              onChange={(e) => setLocal((p) => ({ ...p, address: e.target.value || null }))}
              className="min-h-[90px] rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Document footer text</Label>
            <Textarea
              value={local.document_footer_text || ""}
              onChange={(e) => setLocal((p) => ({ ...p, document_footer_text: e.target.value }))}
              className="min-h-[90px] rounded-xl"
              placeholder="Shown at the bottom of quotations and invoices."
            />
          </div>

          <div className="flex justify-end">
            <Button className="rounded-xl" onClick={() => void save()}>
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
