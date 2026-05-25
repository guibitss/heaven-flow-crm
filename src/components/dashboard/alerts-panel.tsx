import { AlertTriangle, Users, TrendingDown } from "lucide-react";

const alerts = [
  { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", titulo: "12 leads qualificados sem ação há +24h", desc: "Risco de esfriarem e perder oportunidade." },
  { icon: Users, color: "text-info", bg: "bg-info/10", titulo: "Distribuição desbalanceada", desc: "Carlos tem 30 leads em aberto, José apenas 5." },
  { icon: TrendingDown, color: "text-danger", bg: "bg-danger/10", titulo: "Queda na taxa de resposta", desc: "Google Maps caiu 30% essa semana vs semana anterior." },
];

export function AlertsPanel() {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg h-[420px] flex flex-col">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-base font-semibold">Alertas e ações sugeridas</h3>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {alerts.map((a, i) => {
          const Icon = a.icon;
          return (
            <div key={i} className="border border-border rounded-md p-4 hover:border-border-strong transition-colors">
              <div className="flex items-start gap-3">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${a.bg}`}>
                  <Icon className={`h-4 w-4 ${a.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-snug">{a.titulo}</div>
                  <div className="text-xs text-muted-foreground mt-1">{a.desc}</div>
                  <button className="mt-3 text-xs font-medium text-heaven-orange hover:text-heaven-orange-deep">
                    Resolver →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
