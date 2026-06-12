import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

// CountUpNumber — número-herói que anima do valor anterior ao novo (~600ms,
// ease-out). Sempre renderizar dentro de .font-mono (tabular-nums).

interface CountUpProps {
  value: number;
  /** Formatador (ex.: v => v.toLocaleString('pt-BR')). Padrão: inteiro pt-BR. */
  format?: (v: number) => string;
  durationMs?: number;
}

export function CountUp({ value, format, durationMs = 600 }: CountUpProps) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (reduced || fromRef.current === value) {
      fromRef.current = value;
      setShown(value);
      return;
    }
    const from = fromRef.current;
    fromRef.current = value;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(from + (value - from) * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, durationMs, reduced]);

  const fmt = format ?? ((v: number) => Math.round(v).toLocaleString("pt-BR"));
  return <span>{fmt(shown)}</span>;
}
