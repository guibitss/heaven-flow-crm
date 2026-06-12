import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatHero } from "@/components/dashboard/stat-hero";
import { GaugeTempo } from "@/components/dashboard/gauge-tempo";
import { FlowPipeline } from "@/components/dashboard/flow-pipeline";
import { TelemetryFeed } from "@/components/dashboard/telemetry-feed";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { MapaUf } from "@/components/dashboard/mapa-uf";
import { FontesCard } from "@/components/dashboard/fontes-card";
import { RankingVelocidade } from "@/components/dashboard/ranking-velocidade";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

// Total absoluto de leads no banco (head:true) — decide o empty-state global
// "forja fria" sem baixar linha nenhuma.
function useTotalLeads() {
  return useQuery({
    queryKey: ["leads-total-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60000,
  });
}

function Dashboard() {
  const [periodo, setPeriodo] = useState(30);
  const { data: totalLeads, isLoading: loadingTotal } = useTotalLeads();

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sala de controle</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-success" aria-hidden />
            Dados em tempo real
          </p>
        </div>
        <Select value={String(periodo)} onValueChange={(v) => setPeriodo(Number(v))}>
          <SelectTrigger className="w-[180px]" aria-label="Período de análise">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loadingTotal ? (
        <div className="space-y-6">
          <Skeleton className="shimmer-heaven h-28 w-full" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Skeleton className="shimmer-heaven h-64 lg:col-span-2" />
            <Skeleton className="shimmer-heaven h-64" />
          </div>
        </div>
      ) : totalLeads === 0 ? (
        <EmptyState
          icon={Flame}
          title="Forja fria — nenhum lead captado ainda"
          description="Ligue a captação para o painel acender: os instrumentos desta sala de controle mostram apenas dados reais."
          action={
            <Button asChild className="glow-orange">
              <Link to="/captacao">Ativar captação</Link>
            </Button>
          }
          className="py-24"
        />
      ) : (
        <>
          {/* Faixa de KPIs — números-herói sem caixas */}
          <div className="hairline-top rounded-lg bg-bg-secondary px-5">
            <StatHero periodo={periodo} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <FlowPipeline periodo={periodo} />
            </div>
            <GaugeTempo periodo={periodo} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TelemetryFeed />
            <AlertsPanel />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <MapaUf periodo={periodo} />
            <FontesCard />
            <RankingVelocidade periodo={periodo} />
          </div>
        </>
      )}
    </div>
  );
}
