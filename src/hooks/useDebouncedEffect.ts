import { useEffect, useRef } from "react";

export function useDebouncedEffect(effect: () => void, delayMs: number, deps: React.DependencyList) {
  const first = useRef(true);
  const latestEffectRef = useRef(effect);
  latestEffectRef.current = effect;

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }

    const t = window.setTimeout(() => {
      latestEffectRef.current();
    }, delayMs);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delayMs, ...deps]);
}
