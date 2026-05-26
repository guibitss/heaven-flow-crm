import { createFileRoute } from "@tanstack/react-router";
import { Radar, MessageSquare, Filter, Target, DollarSign, Receipt } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { TempoRespostaKpi } from "@/components/dashboard/tempo-resposta-kpi";
import { LiveFeed } from "@/components/dashboard/live-feed";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { FunnelCard } from "@/components/dashboard/funnel-card";
import { FontesTable } from "@/components/dashboard/fontes-table";
import { MapaCard, RankingCard } from "@/components/dashboard/mapa-ranking";
import { RankingVelocidade } from "@/components/dashboard/ranking-velocidade";
import { AguardandoResposta } from "@/components/dashboard/aguardando-resposta";
import { useDashboardKpis } from "@/hooks/use-crm-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const [periodo, setPeriodo] = useState(30);
  const { data: kpis } = useDashboardKpis(periodo);

  const formatPct = (n: number | null | undefined) => n !== null && n !== undefined ? `${n}%` : "—";
  const formatBRL = (n: number | null | undefined) => n ? `R$ ${Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "—";
  const deltaLeads = kpis && kpis.leads_captados_anterior
    ? `${(((kpis.leads_captados - kpis.leads_captados_anterior) / kpis.leads_captados_anterior) * 100).toFixed(0)}%`
    : "—";
  const positiveLeads = kpis ? kpis.leads_captados >= (kpis.leads_captados_anterior ?? 0) : true;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visão geral</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
                <span className="relative rounded-full h-2 w-2 bg-success" />
              </span>
              Atualização em tempo real
            </span>
          </p>
        </div>
        <Select value={String(periodo)} onValueChange={(v) => setPeriodo(Number(v))}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Hoje</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Leads captados" value={String(kpis?.leads_captados ?? 0)} delta={deltaLeads} positive={positiveLeads} icon={Radar} />
        <KpiCard label="Taxa de resposta" value={formatPct(kpis?.taxa_resposta)} delta="+2.1pp" positive icon={MessageSquare} />
        <KpiCard label="Taxa de qualificação" value={formatPct(kpis?.taxa_qualificacao)} delta="-3.4pp" positive={false} icon={Filter} />
        <KpiCard label="Conversão final" value={formatPct(kpis?.conversao_final)} delta="+0.9pp" positive icon={Target} />
        <KpiCard label="Ticket médio" value={formatBRL(kpis?.ticket_medio)} delta="+R$ 320" positive icon={Receipt} />
        <KpiCard label="CPL qualificado" value="R$ 47,30" delta="-12%" positive icon={DollarSign} />
        <TempoRespostaKpi
          segundos={kpis?.tempo_medio_resposta_segundos ?? null}
          anterior={kpis?.tempo_medio_resposta_anterior ?? null}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3"><FunnelCard /></div>
        <div className="lg:col-span-2"><FontesTable /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LiveFeed />
        <AlertsPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><RankingVelocidade /></div>
        <div className="lg:col-span-1"><AguardandoResposta /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MapaCard />
        <RankingCard />
      </div>
    </div>
  );
}
