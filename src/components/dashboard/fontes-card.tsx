import { useQuery } from "@tanstack/react-query";
import { Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { heatColor } from "@/lib/heat";

// FontesCard — volume real por fonte de captação (count head:true por fonte).
// Barras horizontais finas (2px) pintadas pela rampa térmica conforme a
// participação relativa; valor sempre em mono ao lado.

const FONTES = [
  { key: "google_maps", label: "Google Maps" },
  { key: "receita_federal", label: "Receita Federal" },
  { key: "indicacao", label: "Indicação" },
  { key: "manual", label: "Manual" },
] as const;

function useFontesCount() {
  return useQuery({
    queryKey: ["fontes-count"],
    queryFn: async () => {
      const results = await Promise.all(
        FONTES.map(async (f) => {
          const { count, error } = await supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
            .eq("fonte", f.key);
          if (error) throw error;
          return { ...f, total: count ?? 0 };
        }),
      );
      return results;
    },
    refetchInterval: 60000,
  });
}

export function FontesCard() {
  const { data, isLoading } = useFontesCount();
  const max = Math.max(...(data ?? []).map((f) => f.total), 1);
  const hasData = (data ?? []).some((f) => f.total > 0);

  return (
    <div className="h-full rounded-lg border border-border bg-bg-secondary p-5">
      <h3 className="text-base font-semibold">Fontes de captação</h3>
      <p className="label-xs mt-0.5 mb-5">Volume total por origem</p>

      {isLoading ? (
        <div className="space-y-5">
          {FONTES.map((f) => (
            <div key={f.key} className="space-y-2">
              <Skeleton className="shimmer-heaven h-3 w-32" />
              <Skeleton className="shimmer-heaven h-[2px] w-full" />
            </div>
          ))}
        </div>
      ) : !hasData ? (
        <EmptyState
          icon={Database}
          title="Nenhuma fonte ativa ainda"
          description="As barras acendem quando as fontes começarem a captar."
        />
      ) : (
        <div className="space-y-5">
          {(data ?? []).map((f) => {
            const pct = (f.total / max) * 100;
            return (
              <div key={f.key}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-sm">{f.label}</span>
                  <span className="font-mono text-sm font-semibold">
                    {f.total.toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="h-[2px] w-full overflow-hidden rounded-full bg-bg-tertiary">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(pct, f.total > 0 ? 2 : 0)}%`, background: heatColor(pct) }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
