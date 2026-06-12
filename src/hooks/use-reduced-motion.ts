import { useSyncExternalStore } from "react";

// Hook central de prefers-reduced-motion — TODA animação do app (canvas,
// count-up, pulsos, shake, shimmer) deve consultar este hook. Não duplique
// matchMedia em componentes.

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

function getSnapshot() {
  return typeof window !== "undefined" && window.matchMedia(QUERY).matches;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
