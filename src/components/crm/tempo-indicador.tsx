import { Timer } from "lucide-react";
import { formatarTempo, corPorTempo, corTempoClass } from "@/lib/format-tempo";

interface Props {
  handoffEm: string | null;
  primeiraRespostaEm: string | null;
  tempoSegundos: number | null;
}

export function TempoIndicador({ handoffEm, primeiraRespostaEm, tempoSegundos }: Props) {
  if (!handoffEm) return null;

  if (primeiraRespostaEm && tempoSegundos !== null) {
    const cor = corPorTempo(tempoSegundos);
    return (
      <div className={`flex items-center gap-1 text-[10px] font-medium ${corTempoClass(cor)}`}>
        <Timer className="h-3 w-3" />
        Respondido em {formatarTempo(tempoSegundos)}
      </div>
    );
  }

  const aguardando = Math.floor((Date.now() - new Date(handoffEm).getTime()) / 1000);
  const cor = corPorTempo(aguardando);
  return (
    <div className={`flex items-center gap-1 text-[10px] font-medium ${corTempoClass(cor)} ${cor === "danger" ? "animate-pulse" : ""}`}>
      <Timer className="h-3 w-3" />
      Aguardando há {formatarTempo(aguardando)}
    </div>
  );
}
