import { useApp } from "@/contexts/AppContext";

export type SafeClientOptions = {
  businessTypes: string[];
  industries: string[];
};

/**
 * Crash-proof client options hook.
 * Always returns arrays (never undefined) and never throws.
 */
export function useClientOptions(): SafeClientOptions {
  const { clientOptions } = useApp();

  const businessTypes = clientOptions?.businessTypes ?? [];
  const industries = clientOptions?.industries ?? [];

  return {
    businessTypes: Array.isArray(businessTypes) ? businessTypes : [],
    industries: Array.isArray(industries) ? industries : [],
  };
}
