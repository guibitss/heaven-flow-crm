import { createFileRoute } from "@tanstack/react-router";
import { Radar, MessageSquare, Filter, Target, DollarSign, Receipt } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { LiveFeed } from "@/components/dashboard/live-feed";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { FunnelCard } from "@/components/dashboard/funnel-card";
import { FontesTable } from "@/components/dashboard/fontes-table";
import { MapaCard, RankingCard } from "@/components/dashboard/mapa-ranking";
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

function Dashboard() {
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
              Última atualização: agora há pouco
            </span>
          </p>
        </div>
        <Select defaultValue="30d">
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="custom">Customizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Leads captados" value="342" delta="+18%" positive icon={Radar} />
        <KpiCard label="Taxa de resposta" value="23.4%" delta="+2.1pp" positive icon={MessageSquare} />
        <KpiCard label="Taxa de qualificação" value="41.2%" delta="-3.4pp" positive={false} icon={Filter} />
        <KpiCard label="Conversão final" value="8.7%" delta="+0.9pp" positive icon={Target} />
        <KpiCard label="CPL qualificado" value="R$ 47,30" delta="-12%" positive icon={DollarSign} />
        <KpiCard label="Ticket médio" value="R$ 4.890" delta="+R$ 320" positive icon={Receipt} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3"><FunnelCard /></div>
        <div className="lg:col-span-2"><FontesTable /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LiveFeed />
        <AlertsPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MapaCard />
        <RankingCard />
      </div>
    </div>
  );
}
