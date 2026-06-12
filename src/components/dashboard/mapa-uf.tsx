import { useQuery } from "@tanstack/react-query";
import { Map as MapIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// MapaUf — tile grid geográfico do Brasil (27 UFs). Intensidade do tile =
// densidade de leads (alpha do heaven-orange proporcional ao total).
// Acessibilidade: sigla + tooltip com números — cor nunca sozinha.

type UfRow = {
  uf: string;
  total: number;
  quentes: number;
  qualificados: number;
  score_medio: number;
};

// [coluna, linha] num grid 7×8 — aproximação geográfica em tile map
const TILE_POS: Record<string, [number, number]> = {
  RR: [3, 1], AP: [5, 1],
  AM: [2, 2], PA: [4, 2], MA: [5, 2], CE: [6, 2], RN: [7, 2],
  AC: [1, 3], RO: [2, 3], MT: [3, 3], TO: [4, 3], PI: [5, 3], PE: [6, 3], PB: [7, 3],
  GO: [4, 4], BA: [5, 4], SE: [6, 4], AL: [7, 4],
  MS: [3, 5], DF: [4, 5], MG: [5, 5], ES: [6, 5],
  PR: [3, 6], SP: [4, 6], RJ: [5, 6],
  SC: [3, 7],
  RS: [3, 8],
};

function useLeadsPorUf(periodoDias: number) {
  return useQuery({
    queryKey: ["leads-por-uf", periodoDias],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_leads_por_uf", {
        periodo_dias: periodoDias,
      });
      if (error) throw error;
      return (data ?? []) as UfRow[];
    },
    refetchInterval: 60000,
  });
}

export function MapaUf({ periodo }: { periodo: number }) {
  const { data, isLoading } = useLeadsPorUf(periodo);
  const byUf = new Map((data ?? []).map((r) => [r.uf?.toUpperCase(), r]));
  const max = Math.max(...(data ?? []).map((r) => Number(r.total)), 1);
  const hasData = (data ?? []).some((r) => Number(r.total) > 0);

  return (
    <div className="h-full rounded-lg border border-border bg-bg-secondary p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-base font-semibold">Leads por UF</h3>
        <span className="label-xs">Últimos {periodo} dias</span>
      </div>

      {isLoading ? (
        <Skeleton className="shimmer-heaven mx-auto h-[336px] w-[294px]" />
      ) : !hasData ? (
        <EmptyState
          icon={MapIcon}
          title="Nenhum lead com UF no período"
          description="O mapa acende conforme a captação preenche os endereços."
        />
      ) : (
        <TooltipProvider delayDuration={100}>
          <div
            className="mx-auto grid w-fit gap-0.5"
            style={{
              gridTemplateColumns: "repeat(7, 40px)",
              gridTemplateRows: "repeat(8, 40px)",
            }}
            role="img"
            aria-label="Mapa do Brasil com densidade de leads por estado"
          >
            {Object.entries(TILE_POS).map(([uf, [col, row]]) => {
              const d = byUf.get(uf);
              const total = Number(d?.total ?? 0);
              const alpha = total > 0 ? Math.max(0.04, (total / max) * 0.85) : 0.04;
              return (
                <Tooltip key={uf}>
                  <TooltipTrigger asChild>
                    <div
                      tabIndex={0}
                      aria-label={`${uf}: ${total} lead${total === 1 ? "" : "s"}`}
                      className="flex cursor-default items-center justify-center rounded-sm border border-border outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring"
                      style={{
                        gridColumn: col,
                        gridRow: row,
                        background: `rgba(242, 127, 27, ${alpha.toFixed(3)})`,
                      }}
                    >
                      <span
                        className={`font-mono text-[11px] font-medium ${total > 0 ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {uf}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="space-y-0.5 font-mono text-xs">
                      <div className="font-semibold">{uf}</div>
                      <div>Total: {total}</div>
                      <div>Quentes: {Number(d?.quentes ?? 0)}</div>
                      <div>Qualificados: {Number(d?.qualificados ?? 0)}</div>
                      <div>Score médio: {d?.score_medio != null ? Math.round(Number(d.score_medio)) : "—"}</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
