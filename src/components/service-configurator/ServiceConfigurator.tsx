// src/components/service-configurator/ServiceConfigurator.tsx

import { useEffect } from "react";
import { getServiceConfig } from "@/lib/service-configs";
import {
  calculateServicePrice,
  getDefaultServiceConfigState,
  type ServiceConfigState,
} from "@/lib/pricing-engine";
import QuantitySlider from "./QuantitySlider";
import PlatformSelector from "./PlatformSelector";
import ServiceCalculation from "./ServiceCalculation";

interface ServiceConfiguratorProps {
  serviceName: string;
  currency: "INR" | "USD";
  /** Current persisted config state for this block, if any. */
  configState: ServiceConfigState | undefined;
  /** Called whenever config state OR computed price changes. Parent should call updateBlock(idx, { service_config: state, price }). */
  onChange: (state: ServiceConfigState, price: number) => void;
}

/**
 * Returns null if this service has no dynamic config — caller should
 * fall back to the existing manual price Input in that case.
 */
export default function ServiceConfigurator({
  serviceName,
  currency,
  configState,
  onChange,
}: ServiceConfiguratorProps) {
  const config = getServiceConfig(serviceName);

  // Initialize default state on first mount if none exists yet.
  useEffect(() => {
    if (!config) return;
    if (configState) return;

    const defaultState = getDefaultServiceConfigState(config);
    const price = calculateServicePrice(config, defaultState);
    onChange(defaultState, price);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, configState]);

  if (!config) return null;
  if (!configState) return null; // waiting for init effect above

  const total = calculateServicePrice(config, configState);

  const handleQuantityChange = (fieldKey: string, value: number) => {
    if (configState.type !== "quantity" && configState.type !== "dual-quantity") return;
    const nextState: ServiceConfigState = {
      ...configState,
      values: { ...configState.values, [fieldKey]: value },
    };
    const price = calculateServicePrice(config, nextState);
    onChange(nextState, price);
  };

  const handlePlatformChange = (key: string, checked: boolean) => {
    if (configState.type !== "platform-select") return;
    const nextState: ServiceConfigState = {
      ...configState,
      selected: { ...configState.selected, [key]: checked },
    };
    const price = calculateServicePrice(config, nextState);
    onChange(nextState, price);
  };

  return (
    <div className="space-y-4">
      {config.type === "quantity" && config.field && configState.type === "quantity" && (
        <QuantitySlider
          field={config.field}
          value={configState.values[config.field.key] ?? config.field.defaultValue}
          onChange={(v) => handleQuantityChange(config.field!.key, v)}
          currency={currency}
        />
      )}

      {config.type === "dual-quantity" && config.fields && configState.type === "dual-quantity" && (
        <>
          {config.fields.map((f) => (
            <QuantitySlider
              key={f.key}
              field={f}
              value={configState.values[f.key] ?? f.defaultValue}
              onChange={(v) => handleQuantityChange(f.key, v)}
              currency={currency}
            />
          ))}
        </>
      )}

      {config.type === "platform-select" && config.platforms && configState.type === "platform-select" && (
        <PlatformSelector
          platforms={config.platforms}
          selected={configState.selected}
          onChange={handlePlatformChange}
          currency={currency}
        />
      )}

      <ServiceCalculation config={config} state={configState} total={total} currency={currency} />
    </div>
  );
}