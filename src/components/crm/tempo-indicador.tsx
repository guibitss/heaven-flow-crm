import { Timer } from "lucide-react";
import { formatarTempo, corPorTempo, corTempoClass } from "@/lib/format-tempo";
import { useLiveClock } from "@/hooks/use-live-clock";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

// Indicador de tempo de resposta pós-handoff. Usa o relógio global
// compartilhado (tick 30s) — NUNCA um setInterval por card.
// animate-pulse SOMENTE em danger real.

interface Props {
  handoffEm: string | null;
  primeiraRespostaEm: string | null;
  tempoSegundos: number | null;
}

export function TempoIndicador({ handoffEm, primeiraRespostaEm, tempoSegundos }: Props) {
  const agora = useLiveClock();
  const reduced = usePrefersReducedMotion();

  if (!handoffEm) return null;

  if (primeiraRespostaEm && tempoSegundos !== null) {
    const cor = corPorTempo(tempoSegundos);
    return (
      <div className={`flex items-center gap-1 text-[10px] font-medium font-mono tabular-nums ${corTempoClass(cor)}`}>
        <Timer className="h-3 w-3" aria-hidden />
        Respondido em {formatarTempo(tempoSegundos)}
      </div>
    );
  }

  const aguardando = Math.floor((agora - new Date(handoffEm).getTime()) / 1000);
  const cor = corPorTempo(aguardando);
  return (
    <div className={`flex items-center gap-1 text-[10px] font-medium font-mono tabular-nums ${corTempoClass(cor)} ${cor === "danger" && !reduced ? "animate-pulse" : ""}`}>
      <Timer className="h-3 w-3" aria-hidden />
      Aguardando há {formatarTempo(aguardando)}
    </div>
  );
}
