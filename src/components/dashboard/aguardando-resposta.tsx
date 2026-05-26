import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { useLeadsAguardando } from "@/hooks/use-crm-data";
import { formatarTempo, corPorTempo, corTempoClass } from "@/lib/format-tempo";

export function AguardandoResposta() {
  const { data, isLoading } = useLeadsAguardando();
  const [tick, setTick] = useState(0);

  // re-render every 1s so counters update
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const items = (data as any[]) ?? [];

  return (
    <div className="bg-bg-secondary border border-border rounded-lg flex flex-col h-[420px]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-base font-semibold">Aguardando resposta</h3>
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-heaven-orange animate-ping opacity-75" />
              <span className="relative rounded-full h-2 w-2 bg-heaven-orange" />
            </span>
            <span className="text-xs text-muted-foreground font-medium">{items.length} pendente{items.length > 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center px-4">
            ✅ Todos os leads transferidos já foram respondidos
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((l) => {
              const segundosVivo = Math.floor((Date.now() - new Date(l.handoff_em).getTime()) / 1000);
              const cor = corPorTempo(segundosVivo);
              const isCritico = cor === "danger";
              return (
                <div key={l.lead_id} className="flex items-center gap-3 p-2 rounded-md hover:bg-bg-tertiary/50 transition-colors">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-bg-tertiary border border-border shrink-0">
                    {l.vendedor_avatar && <img src={l.vendedor_avatar} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to="/crm/$id" params={{ id: l.lead_id }} className="text-sm font-medium truncate block hover:text-heaven-orange transition-colors">
                      {l.razao_social}
                    </Link>
                    <div className="text-[10px] text-muted-foreground truncate">{l.vendedor_nome ?? "Sem vendedor"}</div>
                  </div>
                  <div className={`font-mono text-xs font-semibold shrink-0 ${corTempoClass(cor)} ${isCritico ? "animate-pulse" : ""}`}>
                    {formatarTempo(segundosVivo)}
                  </div>
                  <button className="h-7 w-7 rounded-md bg-bg-tertiary hover:bg-heaven-orange/20 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
