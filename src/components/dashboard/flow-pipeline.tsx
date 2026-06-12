import { Link } from "@tanstack/react-router";
import { useFunil } from "@/hooks/use-crm-data";
import { PIPELINE_ORDER, STATUS_HEAT, STATUS_LABEL } from "@/lib/heat";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { Filter } from "lucide-react";

// FlowPipeline — funil horizontal da sala de controle. Esquenta rumo a
// 'ganho' (rampa térmica STATUS_HEAT). Cada estágio é clicável → /crm?status=.

export function FlowPipeline({ periodo }: { periodo: number }) {
  const { data: raw, isLoading } = useFunil(periodo);
  const map = new Map<string, number>(
    ((raw as { status: string; total: number }[]) ?? []).map((r) => [r.status, Number(r.total)]),
  );
  const stages = PIPELINE_ORDER.map((s) => ({
    status: s,
    label: STATUS_LABEL[s],
    cor: STATUS_HEAT[s],
    total: map.get(s) ?? 0,
  }));
  const max = Math.max(...stages.map((s) => s.total), 1);
  const hasData = stages.some((s) => s.total > 0);

  return (
    <div className="h-full rounded-lg bg-bg-secondary p-5 hairline-top border border-border">
      <div className="mb-5 flex items-baseline justify-between">
        <h3 className="text-base font-semibold">Funil de conversão</h3>
        <span className="label-xs">Últimos {periodo} dias</span>
      </div>

      {isLoading ? (
        <div className="flex items-end gap-3 pt-8">
          {PIPELINE_ORDER.map((s) => (
            <Skeleton key={s} className="shimmer-heaven h-24 flex-1" />
          ))}
        </div>
      ) : !hasData ? (
        <EmptyState
          icon={Filter}
          title="Funil vazio no período"
          description="Nenhum lead transitou pelo pipeline nos últimos dias."
        />
      ) : (
        <div className="flex items-stretch">
          {stages.map((s, i) => {
            const prev = stages[i - 1];
            const conv =
              prev && prev.total > 0 ? Math.round((s.total / prev.total) * 100) : null;
            const barH = Math.max(6, Math.round((s.total / max) * 72));
            return (
              <div key={s.status} className="flex flex-1 items-stretch">
                {i > 0 && (
                  <div className="flex w-10 shrink-0 flex-col items-center justify-end pb-12">
                    <span className="label-xs font-mono">
                      {conv !== null ? `${conv}%` : "—"}
                    </span>
                    <span className="text-muted-foreground" aria-hidden>
                      →
                    </span>
                  </div>
                )}
                <Link
                  to="/crm"
                  search={{ status: s.status } as never}
                  aria-label={`Ver leads no estágio ${s.label} (${s.total})`}
                  className="group flex min-w-0 flex-1 flex-col justify-end gap-1.5 rounded-md px-1.5 pb-1 pt-2 transition-colors hover:bg-bg-tertiary/60"
                >
                  <span className="font-mono text-2xl font-semibold leading-none">
                    {s.total.toLocaleString("pt-BR")}
                  </span>
                  <div
                    className="w-full rounded-sm transition-all"
                    style={{ height: barH, background: s.cor }}
                    aria-hidden
                  />
                  <span className="label-xs truncate group-hover:text-foreground">
                    {s.label}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
