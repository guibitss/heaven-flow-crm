import { Timer, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatarTempo, corPorTempo } from "@/lib/format-tempo";

interface Props {
  segundos: number | null;
  anterior: number | null;
}

export function TempoRespostaKpi({ segundos, anterior }: Props) {
  const valor = segundos ?? 0;
  const cor = corPorTempo(valor);
  const bg = cor === "success" ? "rgba(34,197,94,0.12)"
    : cor === "warning" ? "rgba(242,127,27,0.12)"
    : "rgba(239,68,68,0.12)";
  const iconColor = cor === "success" ? "text-success"
    : cor === "warning" ? "text-heaven-orange" : "text-danger";

  let deltaText = "—";
  let deltaPositive = true;
  if (anterior && segundos) {
    const diffPct = ((segundos - anterior) / anterior) * 100;
    deltaPositive = diffPct < 0; // diminuir é bom
    deltaText = `${diffPct > 0 ? "+" : ""}${diffPct.toFixed(1)}%`;
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-5 hover:border-border-strong transition-all hover:-translate-y-0.5">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: bg }}>
          <Timer className={cn("h-5 w-5", iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="label-xs">Tempo médio de resposta</div>
          <div className="font-mono text-3xl font-bold mt-1 leading-none truncate">
            {segundos ? formatarTempo(segundos) : "—"}
          </div>
          <div className={cn("text-xs mt-2 flex items-center gap-1 font-medium",
            deltaPositive ? "text-success" : "text-danger")}>
            {deltaPositive ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            {deltaText} vs período anterior
          </div>
        </div>
      </div>
    </div>
  );
}
