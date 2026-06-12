import { Gauge } from "lucide-react";
import { useRankingVelocidade } from "@/hooks/use-crm-data";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { formatarTempo, corPorTempo, corTempoHex } from "@/lib/format-tempo";

// RankingVelocidade — tempo médio entre handoff e primeira mensagem por
// vendedor, colorido pela escala de tempo (success/warning/danger reais).

type RankingRow = {
  vendedor_id: string;
  nome: string;
  avatar_url: string | null;
  tempo_medio_segundos: number;
  total_respostas: number;
  taxa_excelencia: number | null;
};

export function RankingVelocidade({ periodo = 30 }: { periodo?: number }) {
  const { data, isLoading } = useRankingVelocidade(periodo);
  const rows = (data as RankingRow[]) ?? [];

  return (
    <div className="h-full rounded-lg border border-border bg-bg-secondary p-5">
      <h3 className="text-base font-semibold">Velocidade de resposta</h3>
      <p className="label-xs mt-0.5 mb-4">Handoff → primeira mensagem, por vendedor</p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="shimmer-heaven h-10 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="Sem respostas no período"
          description="O ranking aparece quando os vendedores responderem aos primeiros handoffs."
        />
      ) : (
        <div className="space-y-3">
          {(() => {
            const max = Math.max(...rows.map((d) => d.tempo_medio_segundos), 1);
            return rows.map((v) => {
              const pct = (v.tempo_medio_segundos / max) * 100;
              const hex = corTempoHex(corPorTempo(v.tempo_medio_segundos));
              return (
                <div key={v.vendedor_id} className="flex items-center gap-3">
                  <div className="size-8 shrink-0 overflow-hidden rounded-full border border-border bg-bg-tertiary">
                    {v.avatar_url && (
                      <img src={v.avatar_url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="truncate text-sm font-medium">{v.nome}</span>
                      <span
                        className="ml-2 shrink-0 font-mono text-xs font-semibold"
                        style={{ color: hex }}
                      >
                        {formatarTempo(v.tempo_medio_segundos)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: hex }}
                      />
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                      {v.total_respostas} respostas · {v.taxa_excelencia ?? 0}% em &lt;30min
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}
