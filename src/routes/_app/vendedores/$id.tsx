import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { vendedores, leads } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/vendedores/$id")({
  component: VendedorDetail,
});

function VendedorDetail() {
  const { id } = Route.useParams();
  const v = vendedores.find((x) => x.id === id);
  if (!v) return <div>Não encontrado</div>;

  const meusLeads = leads.filter((l) => l.vendedor_id === id).slice(0, 10);
  const data = Array.from({ length: 12 }, (_, i) => ({
    dia: i + 1,
    fechamentos: Math.floor(Math.random() * 8000 + 2000),
  }));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <Link to="/vendedores" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"><ArrowLeft className="h-4 w-4" /> Vendedores</Link>

      <div className="flex items-start gap-6 bg-bg-secondary border border-border rounded-lg p-6">
        <div className="h-24 w-24 rounded-full bg-bg-tertiary overflow-hidden border border-border-strong">
          <img src={v.avatar_url} alt="" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{v.nome}</h1>
          <p className="text-muted-foreground">{v.cargo} • {v.regiao}</p>
          <div className="flex gap-2 mt-3">
            <span className="text-xs px-2 py-1 rounded bg-success/15 text-success">{v.status === "ativo" ? "Ativo" : "Pausado"}</span>
            <span className="text-xs px-2 py-1 rounded bg-bg-tertiary border border-border font-mono">{v.email}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Em aberto", "24"],
          ["Fech. mês", `R$ ${(v.fechamentos_mes / 1000).toFixed(1)}k`],
          ["Ticket médio", `R$ ${v.ticket_medio}`],
          ["Conversão", `${v.taxa_conversao}%`],
        ].map(([l, val]) => (
          <div key={l} className="bg-bg-secondary border border-border rounded-lg p-4">
            <div className="label-xs">{l}</div>
            <div className="font-mono text-2xl font-bold mt-1">{val}</div>
          </div>
        ))}
      </div>

      <div className="bg-bg-secondary border border-border rounded-lg p-5">
        <h3 className="text-base font-semibold mb-4">Performance no mês</h3>
        <div className="h-[260px]">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="dia" stroke="#A8A8A8" fontSize={11} />
              <YAxis stroke="#A8A8A8" fontSize={11} />
              <Tooltip contentStyle={{ background: "#161616", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6 }} />
              <Line type="monotone" dataKey="fechamentos" stroke="#F27F1B" strokeWidth={2} dot={{ fill: "#F27F1B" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-bg-secondary border border-border rounded-lg p-5">
        <h3 className="text-base font-semibold mb-4">Últimos leads atribuídos</h3>
        <table className="w-full text-sm">
          <thead className="text-xs label-xs"><tr><th className="text-left pb-3">Razão Social</th><th className="text-left pb-3">CNPJ</th><th className="text-left pb-3">Status</th><th className="text-right pb-3">Valor</th></tr></thead>
          <tbody className="divide-y divide-border">
            {meusLeads.map((l) => (
              <tr key={l.id}>
                <td className="py-3">{l.razao_social}</td>
                <td className="py-3 font-mono text-xs text-muted-foreground">{l.cnpj}</td>
                <td className="py-3 text-xs"><span className="px-2 py-0.5 rounded bg-bg-tertiary">{l.status}</span></td>
                <td className="py-3 text-right font-mono">R$ {(l.valor_estimado ?? 0).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-bg-secondary border border-border rounded-lg p-5">
        <h3 className="text-base font-semibold mb-4">Configurações</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="label-xs block mb-2">Limite de leads em aberto</label>
            <input type="number" defaultValue={v.limite_leads_abertos} className="w-full h-10 px-3 rounded-md bg-bg-tertiary border border-border text-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
