import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { X, Download, Edit, ChevronDown, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { leads, conversas, vendedores, timelineMock, notasMock, fonteLabels, statusLabels } from "@/lib/mock-data";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/crm/$id")({
  component: LeadDetail,
});

function LeadDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const lead = leads.find((l) => l.id === id);

  function close() { navigate({ to: "/crm" }); }

  if (!lead) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={close}>
        <div className="bg-bg-secondary p-8 rounded-lg">Lead não encontrado</div>
      </div>
    );
  }

  const msgs = conversas[lead.id] ?? [];
  const vendedor = vendedores.find((v) => v.id === lead.vendedor_id);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-in fade-in" onClick={close}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-secondary border border-border rounded-lg w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95"
      >
        <header className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold">{lead.razao_social}</h1>
            <div className="flex gap-2 mt-2 flex-wrap">
              {lead.tags.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded bg-heaven-rust/20 text-heaven-orange border border-heaven-rust/40">{t}</span>
              ))}
              <span className="text-xs px-2 py-0.5 rounded bg-bg-tertiary border border-border">{statusLabels[lead.status]}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toast("Modo de edição")} className="h-9 px-3 rounded-md bg-bg-tertiary hover:bg-bg-tertiary/70 text-sm flex items-center gap-1.5"><Edit className="h-4 w-4" />Editar</button>
            <button className="h-9 px-3 rounded-md bg-bg-tertiary hover:bg-bg-tertiary/70 text-sm flex items-center gap-1.5">Mover etapa <ChevronDown className="h-4 w-4" /></button>
            <button className="h-9 px-3 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground text-sm flex items-center gap-1.5 font-medium">Atribuir <ChevronDown className="h-4 w-4" /></button>
            <button onClick={close} className="h-9 w-9 rounded-md bg-bg-tertiary hover:bg-bg-tertiary/70 flex items-center justify-center ml-2"><X className="h-4 w-4" /></button>
          </div>
        </header>

        <Tabs defaultValue="dados" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 self-start">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="conversa">Conversa</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="notas">Notas</TabsTrigger>
            <TabsTrigger value="anexos">Anexos</TabsTrigger>
            <TabsTrigger value="bling">Bling</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TabsContent value="dados" className="mt-0 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Razão Social" value={lead.razao_social} />
              <Field label="CNPJ" value={lead.cnpj} mono />
              <Field label="Telefone" value={lead.telefone} mono />
              <Field label="Site" value={lead.site ?? "—"} />
              <Field label="CNAE" value={`${lead.cnae} — ${lead.cnae_descricao}`} />
              <Field label="Porte" value={lead.porte} />
              <Field label="Capital social" value={`R$ ${lead.capital_social.toLocaleString("pt-BR")}`} mono />
              <Field label="Endereço" value={`${lead.endereco.logradouro}, ${lead.endereco.cidade}/${lead.endereco.uf} — ${lead.endereco.cep}`} />
              <div className="md:col-span-2 border-t border-border pt-4 mt-2">
                <h3 className="text-sm font-semibold mb-3">Decisor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Nome" value={lead.decisor.nome} />
                  <Field label="Cargo" value={lead.decisor.cargo} />
                  <Field label="Telefone" value={lead.decisor.telefone} mono />
                  <Field label="Email" value={lead.decisor.email ?? "—"} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conversa" className="mt-0 flex flex-col h-full">
              {vendedor && (
                <div className="text-xs text-muted-foreground bg-bg-tertiary border border-border rounded-md px-3 py-2 mb-4">
                  Atendido pela IA até 14h32 — Transferido para <span className="text-heaven-orange font-medium">{vendedor.nome}</span> às 14h33
                </div>
              )}
              <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                {msgs.map((m) => {
                  const ownerRight = m.autor === "lead";
                  return (
                    <div key={m.id} className={cn("flex", ownerRight && "justify-end")}>
                      <div className={cn(
                        "max-w-[70%] rounded-lg px-4 py-2 text-sm",
                        m.autor === "ia" && "bg-bg-tertiary text-foreground",
                        m.autor === "vendedor" && "bg-heaven-orange/20 border border-heaven-orange/40 text-foreground",
                        m.autor === "lead" && "bg-foreground text-background",
                      )}>
                        {m.autor !== "lead" && <div className="text-[10px] font-semibold mb-1 opacity-70">{m.autor === "ia" ? "IA" : m.autor_nome}</div>}
                        <div className="leading-snug">{m.conteudo}</div>
                        <div className={cn("text-[10px] mt-1 font-mono", m.autor === "lead" ? "text-background/60" : "text-muted-foreground")}>
                          {format(m.timestamp, "HH:mm")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); toast.success("Mensagem enviada"); }} className="mt-4 flex gap-2">
                <input className="flex-1 h-10 px-3 rounded-md bg-bg-tertiary border border-border text-sm" placeholder="Digite uma mensagem..." />
                <button className="h-10 px-4 rounded-md bg-heaven-orange text-primary-foreground font-medium text-sm">Enviar</button>
              </form>
            </TabsContent>

            <TabsContent value="timeline" className="mt-0">
              <ol className="space-y-4 border-l border-border ml-3 pl-6 relative">
                {timelineMock.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-heaven-orange ring-4 ring-background" />
                    <div className="text-sm">{e.texto}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{format(e.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}{e.autor && ` — ${e.autor}`}</div>
                  </li>
                ))}
              </ol>
            </TabsContent>

            <TabsContent value="notas" className="mt-0 space-y-4">
              <div>
                <textarea className="w-full h-24 p-3 rounded-md bg-bg-tertiary border border-border text-sm resize-none" placeholder="Adicionar uma nota..." />
                <button onClick={() => toast.success("Nota salva")} className="mt-2 h-9 px-4 rounded-md bg-heaven-orange text-primary-foreground text-sm font-medium">Salvar nota</button>
              </div>
              <div className="space-y-3">
                {notasMock.map((n) => (
                  <div key={n.id} className="bg-bg-tertiary border border-border rounded-md p-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span className="font-medium text-foreground">{n.autor}</span>
                      <span className="font-mono">{format(n.timestamp, "dd/MM HH:mm")}</span>
                    </div>
                    <p className="text-sm">{n.texto}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="anexos" className="mt-0 grid grid-cols-2 md:grid-cols-3 gap-3">
              {["Catalogo-Heaven-2025.pdf", "Proposta-comercial.pdf", "Foto-telhado.jpg"].map((f, i) => (
                <div key={f} className="bg-bg-tertiary border border-border rounded-md p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-heaven-orange/15 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-heaven-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate font-medium">{f}</div>
                    <div className="text-xs text-muted-foreground">{[2.4, 0.8, 1.6][i]} MB</div>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground"><Download className="h-4 w-4" /></button>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="bling" className="mt-0">
              {lead.bling_cliente_id ? (
                <table className="w-full text-sm">
                  <thead className="text-xs label-xs"><tr><th className="text-left pb-3">Data</th><th className="text-left pb-3">Pedido</th><th className="text-right pb-3">Valor</th><th className="text-right pb-3">Status</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    {[1,2,3].map(i => (
                      <tr key={i}>
                        <td className="py-3 font-mono">{format(new Date(Date.now() - i*86400000*15), "dd/MM/yyyy")}</td>
                        <td className="py-3 font-mono">#PED-{1000 + i}</td>
                        <td className="py-3 text-right font-mono">R$ {(2400 * i).toLocaleString("pt-BR")},00</td>
                        <td className="py-3 text-right"><span className="text-xs px-2 py-0.5 rounded bg-success/15 text-success">Faturado</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-16 text-muted-foreground text-sm">
                  Este lead ainda não é cliente no Bling.
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="label-xs mb-1">{label}</div>
      <div className={cn("text-sm", mono && "font-mono")}>{value}</div>
    </div>
  );
}
