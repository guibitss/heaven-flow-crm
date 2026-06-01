import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { X, Download, Edit, ChevronDown, FileText, Shield } from "lucide-react";
import { format } from "date-fns";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLeadDetail } from "@/hooks/use-crm-data";
import { mapLeadFromDb } from "@/lib/db-mappers";
import { fonteLabels, statusLabels } from "@/lib/mock-data";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TempoIndicador } from "@/components/crm/tempo-indicador";

export const Route = createFileRoute("/_app/crm/$id")({
  component: LeadDetail,
});

function LeadDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: raw, isLoading, error } = useLeadDetail(id);

  function close() { navigate({ to: "/crm" }); }

  const lead = useMemo(() => (raw ? mapLeadFromDb(raw) : null), [raw]);
  const vendedor = (raw as any)?.vendedor ?? null;
  const mensagens = ((raw as any)?.mensagens ?? []) as any[];
  const notas = ((raw as any)?.notas ?? []) as any[];
  const anexos = ((raw as any)?.anexos ?? []) as any[];
  const tags = (((raw as any)?.lead_tags ?? []) as any[]).map((lt) => lt.tag).filter(Boolean);

  const consentimentos = useQuery({
    queryKey: ["lead_consentimentos", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_consentimentos")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={close}>
        <div className="bg-bg-secondary p-8 rounded-lg text-sm text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={close}>
        <div className="bg-bg-secondary p-8 rounded-lg">Lead não encontrado</div>
      </div>
    );
  }

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
              {tags.map((t: any) => (
                <span key={t.id} className="text-xs px-2 py-0.5 rounded bg-heaven-rust/20 text-heaven-orange border border-heaven-rust/40" style={t.cor ? { color: t.cor, borderColor: t.cor } : undefined}>{t.nome}</span>
              ))}
              <span className="text-xs px-2 py-0.5 rounded bg-bg-tertiary border border-border">{statusLabels[lead.status]}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-bg-tertiary border border-border">{fonteLabels[lead.fonte]}</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded border font-medium",
                lead.temperatura === "quente" && "bg-heaven-orange/15 text-heaven-orange border-heaven-orange/40",
                lead.temperatura === "morno" && "bg-yellow-500/15 text-yellow-500 border-yellow-500/40",
                lead.temperatura === "frio" && "bg-heaven-gray/15 text-muted-foreground border-heaven-gray/40",
              )}>
                {lead.temperatura === "quente" ? "🔥 Quente" : lead.temperatura === "morno" ? "🌡️ Morno" : "❄️ Frio"} · {lead.score}
              </span>
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
            <TabsTrigger value="notas">Notas</TabsTrigger>
            <TabsTrigger value="anexos">Anexos</TabsTrigger>
            <TabsTrigger value="bling">Bling</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TabsContent value="dados" className="mt-0 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Razão Social" value={lead.razao_social} />
              <Field label="CNPJ" value={lead.cnpj} mono />
              <Field label="Telefone" value={lead.telefone || "—"} mono />
              <Field label="Site" value={lead.site ?? "—"} />
              <Field label="CNAE" value={lead.cnae ? `${lead.cnae} — ${lead.cnae_descricao}` : "—"} />
              <Field label="Porte" value={lead.porte} />
              <Field label="Capital social" value={`R$ ${lead.capital_social.toLocaleString("pt-BR")}`} mono />
              <Field label="Endereço" value={`${lead.endereco.logradouro}, ${lead.endereco.cidade}/${lead.endereco.uf} — ${lead.endereco.cep}`} />
              <div className="md:col-span-2 border-t border-border pt-4 mt-2">
                <h3 className="text-sm font-semibold mb-3">Decisor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Nome" value={lead.decisor.nome || "—"} />
                  <Field label="Cargo" value={lead.decisor.cargo || "—"} />
                  <Field label="Telefone" value={lead.decisor.telefone || "—"} mono />
                  <Field label="Email" value={lead.decisor.email ?? "—"} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conversa" className="mt-0 flex flex-col h-full">
              {vendedor && (
                <div className="text-xs text-muted-foreground bg-bg-tertiary border border-border rounded-md px-3 py-2 mb-4 flex items-center justify-between gap-3 flex-wrap">
                  <span>Atribuído a <span className="text-heaven-orange font-medium">{vendedor.nome}</span></span>
                  <TempoIndicador
                    handoffEm={(raw as any)?.handoff_em ?? null}
                    primeiraRespostaEm={(raw as any)?.primeira_resposta_vendedor_em ?? null}
                    tempoSegundos={(raw as any)?.tempo_primeira_resposta_segundos ?? null}
                  />
                </div>
              )}

              <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                {mensagens.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">Sem mensagens ainda</div>
                ) : mensagens.map((m: any) => {
                  const ownerRight = m.autor === "lead";
                  return (
                    <div key={m.id} className={cn("flex", ownerRight && "justify-end")}>
                      <div className={cn(
                        "max-w-[70%] rounded-lg px-4 py-2 text-sm",
                        m.autor === "ia" && "bg-bg-tertiary text-foreground",
                        m.autor === "vendedor" && "bg-heaven-orange/20 border border-heaven-orange/40 text-foreground",
                        m.autor === "lead" && "bg-foreground text-background",
                      )}>
                        {m.autor !== "lead" && <div className="text-[10px] font-semibold mb-1 opacity-70">{m.autor === "ia" ? "IA" : "Vendedor"}</div>}
                        <div className="leading-snug">{m.conteudo}</div>
                        <div className={cn("text-[10px] mt-1 font-mono", m.autor === "lead" ? "text-background/60" : "text-muted-foreground")}>
                          {format(new Date(m.enviada_em ?? m.created_at), "HH:mm")}
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

            <TabsContent value="notas" className="mt-0 space-y-4">
              <div>
                <textarea className="w-full h-24 p-3 rounded-md bg-bg-tertiary border border-border text-sm resize-none" placeholder="Adicionar uma nota..." />
                <button onClick={() => toast.success("Nota salva")} className="mt-2 h-9 px-4 rounded-md bg-heaven-orange text-primary-foreground text-sm font-medium">Salvar nota</button>
              </div>
              <div className="space-y-3">
                {notas.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-6 text-center">Nenhuma nota</div>
                ) : notas.map((n: any) => (
                  <div key={n.id} className="bg-bg-tertiary border border-border rounded-md p-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span className="font-medium text-foreground">{n.autor?.nome ?? "—"}</span>
                      <span className="font-mono">{format(new Date(n.created_at), "dd/MM HH:mm")}</span>
                    </div>
                    <p className="text-sm">{n.conteudo}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="anexos" className="mt-0 grid grid-cols-2 md:grid-cols-3 gap-3">
              {anexos.length === 0 ? (
                <div className="col-span-full text-sm text-muted-foreground py-6 text-center">Nenhum anexo</div>
              ) : anexos.map((a: any) => (
                <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="bg-bg-tertiary border border-border rounded-md p-4 flex items-center gap-3 hover:border-border-strong">
                  <div className="h-10 w-10 rounded bg-heaven-orange/15 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-heaven-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate font-medium">{a.nome}</div>
                    <div className="text-xs text-muted-foreground">{a.tamanho_bytes ? `${(Number(a.tamanho_bytes) / 1024 / 1024).toFixed(1)} MB` : ""}</div>
                  </div>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </TabsContent>

            <TabsContent value="bling" className="mt-0">
              {lead.bling_cliente_id ? (
                <div className="text-sm text-muted-foreground py-12 text-center">
                  Cliente Bling: <span className="font-mono text-foreground">{lead.bling_cliente_id}</span>
                </div>
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
