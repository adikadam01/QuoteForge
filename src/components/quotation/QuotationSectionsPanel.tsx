import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuotationSectionsState, QuotationSectionKey } from "@/lib/quotationSections";
import { QUOTATION_SECTION_LABELS } from "@/lib/quotationSections";

type Props = {
  value: QuotationSectionsState;
  onChange: (next: QuotationSectionsState) => void;
};

export function QuotationSectionsPanel({ value, onChange }: Props) {
  const keys = Object.keys(value) as QuotationSectionKey[];

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-heading">Include Sections</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {keys.map((k) => (
          <div key={k} className="flex items-center justify-between gap-4">
            <Label className="text-sm text-foreground">{QUOTATION_SECTION_LABELS[k]}</Label>
            <Switch
              checked={value[k]}
              onCheckedChange={(checked) => onChange({ ...value, [k]: checked })}
            />
          </div>
        ))}
        <p className="text-xs text-muted-foreground pt-2">
          Toggles control visibility only. Data is preserved even when a section is hidden.
        </p>
      </CardContent>
    </Card>
  );
}
