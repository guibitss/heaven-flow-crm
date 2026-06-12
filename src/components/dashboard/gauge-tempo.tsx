import { useDashboardKpis } from "@/hooks/use-crm-data";
import { Skeleton } from "@/components/ui/skeleton";
import { formatarTempo, corPorTempo, corTempoHex } from "@/lib/format-tempo";

// GaugeTempo — instrumento-assinatura da sala de controle: semicírculo SVG
// do tempo médio de resposta (handoff → primeira mensagem do vendedor).
// Escala: 0 → 2h (limite do warning). Alvo < 2min = ótimo.

const ESCALA_MAX_S = 7200; // 2h — acima disso é danger e o ponteiro encosta no fim

export function GaugeTempo({ periodo }: { periodo: number }) {
  const { data: kpis, isLoading } = useDashboardKpis(periodo);
  const segundos = kpis?.tempo_medio_resposta_segundos ?? null;

  // geometria do semicírculo
  const r = 80;
  const arcLen = Math.PI * r; // ~251.3
  const frac = segundos != null ? Math.min(1, segundos / ESCALA_MAX_S) : 0;
  const hex = segundos != null ? corTempoHex(corPorTempo(segundos)) : "rgba(255,255,255,0.25)";

  return (
    <div className="energized-top relative h-full rounded-lg bg-bg-secondary p-5">
      <h3 className="text-base font-semibold">Tempo de resposta</h3>
      <p className="label-xs mt-0.5">Handoff → primeira mensagem</p>

      {isLoading ? (
        <div className="flex flex-col items-center gap-3 pt-6">
          <Skeleton className="shimmer-heaven h-[100px] w-[200px] rounded-t-full" />
          <Skeleton className="shimmer-heaven h-4 w-24" />
        </div>
      ) : (
        <div className="flex flex-col items-center pt-4">
          <div className="relative">
            <svg
              width="220"
              height="120"
              viewBox="0 0 220 120"
              role="img"
              aria-label={
                segundos != null
                  ? `Tempo médio de resposta: ${formatarTempo(segundos)}`
                  : "Sem dados de tempo de resposta"
              }
            >
              {/* arco de fundo */}
              <path
                d={`M ${110 - r} 110 A ${r} ${r} 0 0 1 ${110 + r} 110`}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* arco de valor */}
              {segundos != null && (
                <path
                  d={`M ${110 - r} 110 A ${r} ${r} 0 0 1 ${110 + r} 110`}
                  fill="none"
                  stroke={hex}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.max(arcLen * frac, 1)} ${arcLen}`}
                />
              )}
              {/* marcas de escala: 30min (fim do ótimo) e 2h */}
              {[1800 / ESCALA_MAX_S, 1].map((f) => {
                const ang = Math.PI * (1 - f);
                const x1 = 110 + Math.cos(ang) * (r - 12);
                const y1 = 110 - Math.sin(ang) * (r - 12);
                const x2 = 110 + Math.cos(ang) * (r + 10);
                const y2 = 110 - Math.sin(ang) * (r + 10);
                return (
                  <line
                    key={f}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth="1"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-x-0 bottom-0 text-center">
              <span
                className="font-mono text-[28px] font-semibold leading-none"
                style={{ color: segundos != null ? hex : undefined }}
              >
                {segundos != null ? formatarTempo(segundos) : "—"}
              </span>
            </div>
          </div>
          <div className="mt-3 flex w-full max-w-[220px] justify-between font-mono text-[10px] text-muted-foreground">
            <span>0</span>
            <span>2h+</span>
          </div>
          <p className="label-xs mt-2">
            {segundos == null
              ? "Sem respostas no período"
              : segundos <= 120
                ? "Alvo < 2min · ótimo"
                : "Alvo < 2min"}
          </p>
        </div>
      )}
    </div>
  );
}
