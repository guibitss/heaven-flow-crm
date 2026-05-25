import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { vendedores } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/vendedores/")({
  component: VendedoresPage,
});

function VendedoresPage() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendedores</h1>
          <p className="text-sm text-muted-foreground mt-1">{vendedores.length} ativos na equipe</p>
        </div>
        <button className="h-10 px-4 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground font-medium text-sm flex items-center gap-2 glow-orange">
          <Plus className="h-4 w-4" /> Adicionar vendedor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendedores.map((v) => {
          const pct = Math.min(100, (v.fechamentos_mes / v.meta_mensal) * 100);
          return (
            <div key={v.id} className="bg-bg-secondary border border-border rounded-lg p-5 hover:border-border-strong hover:-translate-y-0.5 hover:glow-orange transition-all">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-full bg-bg-tertiary border border-border-strong overflow-hidden shrink-0">
                  <img src={v.avatar_url} alt={v.nome} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold truncate">{v.nome}</h3>
                  <p className="text-xs text-muted-foreground">{v.cargo}</p>
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-bg-tertiary border border-border">{v.regiao}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Stat label="Em aberto" value="24" />
                <Stat label="Fech. mês" value={`R$ ${(v.fechamentos_mes / 1000).toFixed(1)}k`} />
                <Stat label="Ticket médio" value={`R$ ${v.ticket_medio}`} />
                <Stat label="Conversão" value={`${v.taxa_conversao}%`} />
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="label-xs">Meta</span>
                  <span className="font-mono text-muted-foreground">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                  <div className="h-full bg-heaven-orange rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Link to="/vendedores/$id" params={{ id: v.id }} className="flex-1 h-9 rounded-md bg-bg-tertiary hover:bg-bg-tertiary/70 text-sm flex items-center justify-center">Ver perfil</Link>
                <button className="h-9 px-3 rounded-md border border-border hover:bg-bg-tertiary text-sm">
                  {v.status === "ativo" ? "Pausar" : "Ativar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-tertiary rounded-md p-2.5">
      <div className="label-xs text-[10px]">{label}</div>
      <div className="font-mono text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}
