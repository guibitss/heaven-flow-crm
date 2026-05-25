import { vendedores } from "@/lib/mock-data";

export function MapaCard() {
  // Simple Brazil map stub with hotspots
  const pontos = [
    { x: 220, y: 200, r: 16, label: "PR" },
    { x: 240, y: 170, r: 22, label: "SP" },
    { x: 230, y: 230, r: 12, label: "SC" },
    { x: 270, y: 150, r: 14, label: "RJ" },
    { x: 220, y: 130, r: 10, label: "MG" },
    { x: 170, y: 200, r: 8, label: "MS" },
  ];
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-5 h-full">
      <h3 className="text-base font-semibold mb-1">Distribuição geográfica</h3>
      <p className="text-xs text-muted-foreground mb-4">Densidade de leads por estado</p>
      <div className="flex items-center justify-center">
        <svg viewBox="80 60 280 280" className="w-full max-h-[280px]">
          {/* Brazil silhouette (very simplified) */}
          <path
            d="M180 80 L280 90 L320 130 L330 200 L300 280 L240 320 L160 310 L120 260 L110 180 L130 120 Z"
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
          />
          {pontos.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={p.r * 1.8} fill="rgba(242,127,27,0.15)" />
              <circle cx={p.x} cy={p.y} r={p.r} fill="rgba(242,127,27,0.5)" />
              <circle cx={p.x} cy={p.y} r={p.r / 2.5} fill="#F27F1B" />
              <text x={p.x} y={p.y + p.r + 14} textAnchor="middle" fontSize="10" fill="#A8A8A8" className="font-mono">{p.label}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-heaven-orange" />Leads</div>
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />Fechamentos</div>
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning animate-pulse" />Hot spot</div>
      </div>
    </div>
  );
}

export function RankingCard() {
  const top5 = [...vendedores].sort((a, b) => b.fechamentos_mes - a.fechamentos_mes).slice(0, 5);
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-5 h-full">
      <h3 className="text-base font-semibold mb-1">Top 5 vendedores</h3>
      <p className="text-xs text-muted-foreground mb-4">Performance do mês</p>
      <div className="space-y-3">
        {top5.map((v, i) => {
          const pct = Math.min(100, (v.fechamentos_mes / v.meta_mensal) * 100);
          return (
            <div key={v.id} className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
              <div className="h-9 w-9 rounded-full bg-bg-tertiary overflow-hidden shrink-0">
                <img src={v.avatar_url} alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm">
                  <span className="truncate font-medium">{v.nome}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    R$ {(v.fechamentos_mes / 1000).toFixed(1)}k
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-bg-tertiary mt-1.5 overflow-hidden">
                  <div className="h-full bg-heaven-orange rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
