import { Link } from "@tanstack/react-router";
import { CheckCircle2, Timer } from "lucide-react";
import { useLeadsAguardando } from "@/hooks/use-crm-data";
import { useLiveClock } from "@/hooks/use-live-clock";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { formatarTempo, corPorTempo, corTempoClass } from "@/lib/format-tempo";

// AlertsPanel — leads transferidos (handoff) ainda sem primeira resposta do
// vendedor. Contador vivo via relógio compartilhado (tick 30s).

type LeadAguardando = {
  lead_id: string;
  razao_social: string;
  handoff_em: string;
  segundos_aguardando: number;
  vendedor_id: string | null;
  vendedor_nome: string | null;
  vendedor_avatar: string | null;
};

export function AlertsPanel() {
  const { data, isLoading } = useLeadsAguardando();
  const now = useLiveClock();
  const items = ((data as LeadAguardando[]) ?? []).slice().sort(
    (a, b) => new Date(a.handoff_em).getTime() - new Date(b.handoff_em).getTime(),
  );

  return (
    <div className="flex h-[420px] flex-col rounded-lg border border-border bg-bg-secondary">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-base font-semibold">Aguardando resposta</h3>
        {items.length > 0 && (
          <span className="label-xs font-mono">
            {items.length} pendente{items.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="shimmer-heaven h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nenhum lead aguardando"
            description="Todos os leads transferidos já receberam a primeira resposta."
            className="h-full border-0"
          />
        ) : (
          <ul className="space-y-1">
            {items.map((l) => {
              const segundos = Math.max(
                0,
                Math.floor((now - new Date(l.handoff_em).getTime()) / 1000),
              );
              const cor = corPorTempo(segundos);
              return (
                <li key={l.lead_id}>
                  <Link
                    to="/crm/$id"
                    params={{ id: l.lead_id }}
                    className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-bg-tertiary/60"
                    aria-label={`Abrir lead ${l.razao_social}, aguardando há ${formatarTempo(segundos)}`}
                  >
                    <div className="size-8 shrink-0 overflow-hidden rounded-full border border-border bg-bg-tertiary">
                      {l.vendedor_avatar && (
                        <img
                          src={l.vendedor_avatar}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{l.razao_social}</div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {l.vendedor_nome ?? "Sem vendedor"}
                      </div>
                    </div>
                    <span
                      className={`flex shrink-0 items-center gap-1 font-mono text-xs font-semibold ${corTempoClass(cor)}`}
                    >
                      <Timer className="size-3" aria-hidden />
                      {formatarTempo(segundos)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
