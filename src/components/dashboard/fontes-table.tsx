const fontes = [
  { nome: "Google Maps", cor: "bg-info/15 text-info", leads: 187, qualif: 64, fechados: 12, roi: 245 },
  { nome: "Receita Federal", cor: "bg-heaven-orange/15 text-heaven-orange", leads: 98, qualif: 41, fechados: 9, roi: 312 },
  { nome: "Indicação", cor: "bg-success/15 text-success", leads: 57, qualif: 32, fechados: 8, roi: 489 },
];

export function FontesTable() {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-5 h-full">
      <h3 className="text-base font-semibold mb-1">Performance por fonte</h3>
      <p className="text-xs text-muted-foreground mb-4">Conversão e ROI</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs label-xs">
            <th className="text-left pb-3">Fonte</th>
            <th className="text-right pb-3">Leads</th>
            <th className="text-right pb-3">Qualif.</th>
            <th className="text-right pb-3">Fech.</th>
            <th className="text-right pb-3">ROI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {fontes.map((f) => (
            <tr key={f.nome}>
              <td className="py-3">
                <span className={`text-xs px-2 py-1 rounded-sm ${f.cor}`}>{f.nome}</span>
              </td>
              <td className="py-3 text-right font-mono">{f.leads}</td>
              <td className="py-3 text-right font-mono">{f.qualif}</td>
              <td className="py-3 text-right font-mono">{f.fechados}</td>
              <td className={`py-3 text-right font-mono font-semibold ${f.roi > 0 ? "text-success" : "text-danger"}`}>
                {f.roi > 0 ? "+" : ""}{f.roi}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
