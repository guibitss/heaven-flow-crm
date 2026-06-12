import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

// PulseFlash — O pulso único do app para eventos realtime (feed, kanban,
// sino, mensagens). Flash de 600ms em bg-heaven-orange/10 quando `pulseKey`
// muda. Orçamento: máx. 2 elementos pulsando por viewport; zero loops.

interface PulseFlashProps {
  /** Quando este valor muda, o elemento pisca uma vez. */
  pulseKey: string | number;
  className?: string;
  children: React.ReactNode;
}

export function PulseFlash({ pulseKey, className, children }: PulseFlashProps) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(pulseKey);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (prev.current === pulseKey) return;
    prev.current = pulseKey;
    if (reduced) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 600);
    return () => clearTimeout(t);
  }, [pulseKey, reduced]);

  return (
    <div
      className={cn(
        "transition-colors duration-[600ms]",
        flash && "bg-heaven-orange/10",
        className,
      )}
    >
      {children}
    </div>
  );
}
