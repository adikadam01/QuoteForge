// src/components/service-configurator/QuantitySlider.tsx

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { QuantityFieldConfig } from "@/lib/service-configs";

interface QuantitySliderProps {
  field: QuantityFieldConfig;
  value: number;
  onChange: (value: number) => void;
  currency: "INR" | "USD";
}

export default function QuantitySlider({ field, value, onChange, currency }: QuantitySliderProps) {
  const symbol = currency === "INR" ? "₹" : "$";
  const lineTotal = value * field.rate;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wide text-foreground font-bold">
          {field.label}
        </Label>
        <span className="text-sm font-semibold text-foreground">
          {value} × {symbol}{field.rate.toLocaleString()} = {symbol}{lineTotal.toLocaleString()}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Slider
          value={[value]}
          min={field.min}
          max={field.max}
          step={field.step || 1}
          onValueChange={([v]) => onChange(v)}
          className="flex-1"
        />
        <Input
          type="number"
          min={field.min}
          max={field.max}
          value={value}
          onChange={(e) => {
            const next = Math.min(field.max, Math.max(field.min, Number(e.target.value) || field.min));
            onChange(next);
          }}
          className="w-20 rounded-xl"
        />
      </div>
    </div>
  );
}