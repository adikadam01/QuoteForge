// src/components/service-configurator/ServiceCalculation.tsx

import type { ServiceConfig } from "@/lib/service-configs";
import type { ServiceConfigState } from "@/lib/pricing-engine";

interface ServiceCalculationProps {
  config: ServiceConfig;
  state: ServiceConfigState;
  total: number;
  currency: "INR" | "USD";
}

/**
 * Read-only calculation breakdown. NOT a summary card — just shows how the
 * total was derived, to be displayed inside the existing Pricing card.
 */
export default function ServiceCalculation({ config, state, total, currency }: ServiceCalculationProps) {
  const symbol = currency === "INR" ? "₹" : "$";

  return (
    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-2">
      {config.type === "quantity" && config.field && state.type === "quantity" && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {state.values[config.field.key] ?? 0} {config.field.label} × {symbol}{config.field.rate.toLocaleString()}
          </span>
          <span className="font-semibold">{symbol}{total.toLocaleString()}</span>
        </div>
      )}

      {config.type === "dual-quantity" && config.fields && state.type === "dual-quantity" && (
        <>
          {config.fields.map((f) => (
            <div key={f.key} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {state.values[f.key] ?? 0} {f.label} × {symbol}{f.rate.toLocaleString()}
              </span>
              <span className="font-medium">
                {symbol}{((state.values[f.key] ?? 0) * f.rate).toLocaleString()}
              </span>
            </div>
          ))}
        </>
      )}

      {config.type === "platform-select" && config.platforms && state.type === "platform-select" && (
        <>
          {config.platforms
            .filter((p) => state.selected[p.key])
            .map((p) => (
              <div key={p.key} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{p.label}</span>
                <span className="font-medium">{symbol}{p.rate.toLocaleString()}</span>
              </div>
            ))}
        </>
      )}

      <div className="border-t pt-2 flex justify-between text-base font-bold">
        <span>Total</span>
        <span>{symbol}{total.toLocaleString()}</span>
      </div>
    </div>
  );
}