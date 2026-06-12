import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardKpis } from "@/hooks/use-crm-data";
import { CountUp } from "@/components/common/count-up";
import { Skeleton } from "@/components/ui/skeleton";
import { formatarTempo, corPorTempo, corTempoHex } from "@/lib/format-tempo";

// StatHero — faixa de KPIs estilo balance sheet: sem caixas, números-herói
// em mono com hairlines verticais entre eles.

function useSerieCaptacao(dias = 14) {
  return useQuery({
    queryKey: ["serie-captacao", dias],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_serie_captacao", { dias });
      if (error) throw error;
      return (data ?? []) as { dia: string; total: number }[];
    },
    refetchInterval: 60000,
  });
}

function Sparkline({ serie }: { serie: { dia: string; total: number }[] }) {
  if (serie.length < 2) return null;
  const w = 56;
  const h = 20;
  const max = Math.max(...serie.map((p) => p.total), 1);
  const points = serie
    .map((p, i) => {
      const x = (i / (serie.length - 1)) * w;
      const y = h - 2 - (p.total / max) * (h - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Captação dos últimos 14 dias"
      className="mt-1.5"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--heaven-orange)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function fmtPct(n: number | null | undefined) {
  return n !== null && n !== undefined ? `${Number(n).toLocaleString("pt-BR")}%` : "—";
}

function fmtBRL(n: number) {
  return `R$ ${Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function Stat({
  label,
  children,
  sub,
}: {
  label: string;
  children: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-[140px] flex-1 flex-col gap-1.5 px-5 py-4 first:pl-0 last:pr-0">
      <span className="label-xs">{label}</span>
      <span className="font-mono text-[34px] font-semibold leading-none tracking-tight">
        {children}
      </span>
      {sub}
    </div>
  );
}

export function StatHero({ periodo }: { periodo: number }) {
  const { data: kpis, isLoading } = useDashboardKpis(periodo);
  const { data: serie } = useSerieCaptacao(14);

  if (isLoading || !kpis) {
    return (
      <div className="flex flex-wrap divide-x divide-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex min-w-[140px] flex-1 flex-col gap-2 px-5 py-4 first:pl-0">
            <Skeleton className="shimmer-heaven h-3 w-24" />
            <Skeleton className="shimmer-heaven h-8 w-20" />
          </div>
        ))}
      </div>
    );
  }

  const deltaLeads = kpis.leads_captados - (kpis.leads_captados_anterior ?? 0);
  const tempo = kpis.tempo_medio_resposta_segundos;
  const tempoHex = tempo != null ? corTempoHex(corPorTempo(tempo)) : undefined;

  return (
    <div className="flex flex-wrap divide-x divide-border">
      <Stat
        label="Leads captados"
        sub={
          <div className="flex items-end gap-3">
            <span className="font-mono text-xs text-muted-foreground">
              {deltaLeads === 0 ? "= 0" : deltaLeads > 0 ? `▲ +${deltaLeads}` : `▼ ${deltaLeads}`}{" "}
              vs anterior
            </span>
            {serie && <Sparkline serie={serie} />}
          </div>
        }
      >
        <CountUp value={kpis.leads_captados} />
      </Stat>

      <Stat label="Taxa de resposta">
        {kpis.taxa_resposta != null ? (
          <CountUp value={Number(kpis.taxa_resposta)} format={fmtPct} />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </Stat>

      <Stat label="Taxa de qualificação">
        {kpis.taxa_qualificacao != null ? (
          <CountUp value={Number(kpis.taxa_qualificacao)} format={fmtPct} />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </Stat>

      <Stat label="Conversão final">
        {kpis.conversao_final != null ? (
          <CountUp value={Number(kpis.conversao_final)} format={fmtPct} />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </Stat>

      <Stat label="Ticket médio">
        {kpis.ticket_medio != null ? (
          <CountUp value={Number(kpis.ticket_medio)} format={fmtBRL} />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </Stat>

      <Stat
        label="Tempo médio de resposta"
        sub={
          tempo != null ? (
            <span className="font-mono text-xs text-muted-foreground">alvo &lt; 2min</span>
          ) : undefined
        }
      >
        {tempo != null ? (
          <span style={{ color: tempoHex }}>{formatarTempo(tempo)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </Stat>
    </div>
  );
}
