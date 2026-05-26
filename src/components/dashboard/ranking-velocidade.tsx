import { useRankingVelocidade } from "@/hooks/use-crm-data";
import { formatarTempo, corPorTempo, corTempoHex } from "@/lib/format-tempo";

export function RankingVelocidade() {
  const { data, isLoading } = useRankingVelocidade(30);

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-5 h-full">
      <h3 className="text-base font-semibold">Velocidade de resposta dos vendedores</h3>
      <p className="text-xs text-muted-foreground mb-4">Tempo médio entre handoff e primeira mensagem</p>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Carregando...</div>
      ) : !data || data.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Sem dados de resposta no período</div>
      ) : (
        <div className="space-y-3">
          {(() => {
            const max = Math.max(...(data as any[]).map((d) => d.tempo_medio_segundos));
            return (data as any[]).map((v) => {
              const pct = (v.tempo_medio_segundos / max) * 100;
              const cor = corPorTempo(v.tempo_medio_segundos);
              const hex = corTempoHex(cor);
              return (
                <div key={v.vendedor_id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-bg-tertiary border border-border shrink-0">
                    {v.avatar_url && <img src={v.avatar_url} alt={v.nome} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-medium truncate">{v.nome}</span>
                      <span className="font-mono text-xs font-semibold ml-2 shrink-0" style={{ color: hex }}>
                        {formatarTempo(v.tempo_medio_segundos)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: hex }} />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
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
