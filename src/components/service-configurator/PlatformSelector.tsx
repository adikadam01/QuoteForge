// src/components/service-configurator/PlatformSelector.tsx

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { PlatformOption } from "@/lib/service-configs";

interface PlatformSelectorProps {
  platforms: PlatformOption[];
  selected: { [key: string]: boolean };
  onChange: (key: string, checked: boolean) => void;
  currency: "INR" | "USD";
}

export default function PlatformSelector({ platforms, selected, onChange, currency }: PlatformSelectorProps) {
  const symbol = currency === "INR" ? "₹" : "$";

  return (
    <div className="space-y-2.5">
      <Label className="text-xs uppercase tracking-wide text-foreground font-bold">
        Select Platforms
      </Label>
      <div className="grid grid-cols-2 gap-3">
        {platforms.map((p) => (
          <label
            key={p.key}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-border/70 cursor-pointer hover:bg-muted/40 transition-colors"
          >
            <Checkbox
              checked={!!selected[p.key]}
              onCheckedChange={(checked) => onChange(p.key, checked === true)}
            />
            <span className="text-sm font-medium flex-1">{p.label}</span>
            <span className="text-xs text-muted-foreground">{symbol}{p.rate.toLocaleString()}</span>
          </label>
        ))}
      </div>
    </div>
  );
}