import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";

export function DocumentDefaultsSettingsPage() {
  const { documentDefaults, setDocumentDefaults } = useApp();
  const [local, setLocal] = React.useState(documentDefaults);

  React.useEffect(() => {
    setLocal(documentDefaults);
  }, [documentDefaults]);

  const save = async () => {
    await setDocumentDefaults(local);
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading">Document Defaults</CardTitle>
          <p className="text-sm text-muted-foreground">Default notes/footers used across documents.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Quotation default notes</Label>
            <Textarea
              value={local.quotation_notes}
              onChange={(e) => setLocal((p) => ({ ...p, quotation_notes: e.target.value }))}
              className="min-h-[110px] rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Invoice default payment notes</Label>
            <Textarea
              value={local.invoice_payment_notes}
              onChange={(e) => setLocal((p) => ({ ...p, invoice_payment_notes: e.target.value }))}
              className="min-h-[110px] rounded-xl"
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
