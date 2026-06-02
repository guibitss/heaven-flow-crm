import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GripVertical, Plus, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/ia")({
  component: IaPage,
});

const variaveis = ["{nome_empresa}", "{cidade}", "{decisor}", "{cnae}"];

type Pergunta = { id: string; pergunta: string; tipo: string; criterio: string };
type Tentativa = { dias: number; mensagem: string; ativo: boolean };

const defaultPerguntas: Pergunta[] = [
  { id: "p1", pergunta: "Vocês fazem instalação ou só venda?", tipo: "escolha", criterio: "Faz instalação" },
  { id: "p2", pergunta: "Quantos sistemas por mês?", tipo: "texto", criterio: "≥ 5 sistemas" },
  { id: "p3", pergunta: "Já tem fornecedor de estrutura?", tipo: "sim_nao", criterio: "Aberto a trocar" },
];

const defaultReativacao: Tentativa[] = [
  { dias: 3, mensagem: "Olá! Notei que ainda não conseguimos conversar. Posso te ajudar com algo sobre estruturas para painéis?", ativo: true },
  { dias: 6, mensagem: "Continuamos à disposição — posso enviar um material rápido sobre nossos diferenciais?", ativo: false },
  { dias: 9, mensagem: "Última tentativa por aqui. Se preferir, te mando uma proposta direto no WhatsApp.", ativo: false },
];

function IaPage() {
  const qc = useQueryClient();

  const cfg = useQuery({
    queryKey: ["configuracoes_ia"],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracoes_ia").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [msg, setMsg] = useState("");
  const [perguntas, setPerguntas] = useState<Pergunta[]>(defaultPerguntas);
  const [regraHandoff, setRegraHandoff] = useState<string>("round");
  const [canais, setCanais] = useState<string[]>(["WhatsApp pessoal", "Email", "Push no CRM"]);
  const [hIni, setHIni] = useState(8);
  const [hFim, setHFim] = useState(18);
  const [dias, setDias] = useState<string[]>(["seg", "ter", "qua", "qui", "sex"]);
  const [reativacao, setReativacao] = useState<Tentativa[]>(defaultReativacao);

  useEffect(() => {
    if (!cfg.data) return;
    const d: any = cfg.data;
    setMsg(d.mensagem_abertura ?? "Olá {decisor}! Aqui é a Heaven, vimos que a {nome_empresa} atua com energia solar em {cidade}. Podemos ajudar com estruturas e suporte de painéis?");
    if (Array.isArray(d.perguntas_qualificacao) && d.perguntas_qualificacao.length) setPerguntas(d.perguntas_qualificacao);
    const rh = d.regras_handoff ?? {};
    setRegraHandoff(rh.regra ?? "round");
    if (Array.isArray(rh.canais)) setCanais(rh.canais);
    if (d.horario_inicio) setHIni(parseInt(String(d.horario_inicio).slice(0, 2)));
    if (d.horario_fim) setHFim(parseInt(String(d.horario_fim).slice(0, 2)));
    if (Array.isArray(d.dias_semana)) setDias(d.dias_semana);
    if (Array.isArray(d.reativacao) && d.reativacao.length) setReativacao(d.reativacao);
  }, [cfg.data]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        id: 1,
        mensagem_abertura: msg,
        perguntas_qualificacao: perguntas,
        regras_handoff: { regra: regraHandoff, canais },
        horario_inicio: `${String(hIni).padStart(2, "0")}:00:00`,
        horario_fim: `${String(hFim).padStart(2, "0")}:00:00`,
        dias_semana: dias,
        reativacao,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("configuracoes_ia").upsert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["configuracoes_ia"] });
      toast.success("Configurações da IA salvas");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const reprocMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("reprocessar_scores");
      if (error) throw error;
      return data as number;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`${n ?? 0} leads reprocessados`);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao reprocessar"),
  });

  const toggleCanal = (c: string) =>
    setCanais((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">Agente IA</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure abordagem, qualificação e handoff</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => reprocMut.mutate()}
            disabled={reprocMut.isPending}
            className="h-9 px-4 rounded-md border border-border hover:bg-bg-tertiary text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {reprocMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Reprocessar scores
          </button>
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || cfg.isLoading}
            className="h-9 px-4 rounded-md bg-heaven-orange text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {saveMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar configurações
          </button>
        </div>
      </div>

      <Tabs defaultValue="abertura" className="w-full max-w-full">
        <TabsList className="grid grid-cols-2 sm:inline-flex sm:h-9 h-auto w-full sm:w-auto gap-1 sm:gap-0">
          <TabsTrigger value="abertura">Mensagem de abertura</TabsTrigger>
          <TabsTrigger value="perguntas">Qualificação</TabsTrigger>
          <TabsTrigger value="handoff">Handoff</TabsTrigger>
          <TabsTrigger value="reativacao">Reativação</TabsTrigger>
        </TabsList>

        <TabsContent value="abertura" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-bg-secondary border border-border rounded-lg p-5 space-y-4">
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} className="w-full h-48 p-3 rounded-md bg-bg-tertiary border border-border text-sm resize-none" />
            <div>
              <div className="label-xs mb-2">Variáveis disponíveis</div>
              <div className="flex flex-wrap gap-2">
                {variaveis.map((v) => (
                  <button key={v} onClick={() => setMsg((m) => m + " " + v)} className="text-xs px-2 py-1 rounded bg-heaven-orange/15 text-heaven-orange border border-heaven-orange/30 font-mono hover:bg-heaven-orange/25">{v}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-lg p-5">
            <div className="label-xs mb-3">Preview</div>
            <div className="bg-[#1a1a1a] rounded-lg p-4 max-w-sm">
              <div className="bg-bg-tertiary rounded-lg px-4 py-3 text-sm">{msg}</div>
              <div className="text-[10px] font-mono text-muted-foreground mt-1.5 text-right">14:32 ✓✓</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="perguntas" className="mt-4 bg-bg-secondary border border-border rounded-lg p-3 sm:p-5">
          <div className="space-y-2">
            {perguntas.map((p, idx) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-bg-tertiary rounded-md border border-border">
                <div className="flex items-center gap-2 w-full sm:flex-1 min-w-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                  <input
                    value={p.pergunta}
                    onChange={(e) => setPerguntas((xs) => xs.map((q, i) => (i === idx ? { ...q, pergunta: e.target.value } : q)))}
                    className="flex-1 min-w-0 bg-transparent text-sm outline-none"
                  />
                </div>
                <Select value={p.tipo} onValueChange={(v) => setPerguntas((xs) => xs.map((q, i) => (i === idx ? { ...q, tipo: v } : q)))}>
                  <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="texto">Texto</SelectItem>
                    <SelectItem value="sim_nao">Sim/Não</SelectItem>
                    <SelectItem value="escolha">Escolha</SelectItem>
                  </SelectContent>
                </Select>
                <input
                  value={p.criterio}
                  onChange={(e) => setPerguntas((xs) => xs.map((q, i) => (i === idx ? { ...q, criterio: e.target.value } : q)))}
                  className="w-full sm:w-44 h-9 px-2 rounded bg-bg-secondary border border-border text-xs"
                />
                <button onClick={() => setPerguntas((x) => x.filter((q) => q.id !== p.id))} className="text-muted-foreground hover:text-danger self-end sm:self-auto shrink-0"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <button onClick={() => setPerguntas([...perguntas, { id: `p${Date.now()}`, pergunta: "Nova pergunta", tipo: "texto", criterio: "" }])} className="mt-4 h-9 px-4 rounded-md bg-heaven-orange text-primary-foreground text-sm font-medium flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Nova pergunta
          </button>
        </TabsContent>

        <TabsContent value="handoff" className="mt-4 bg-bg-secondary border border-border rounded-lg p-3 sm:p-5 space-y-6">
          <div>
            <div className="label-xs mb-3">Regra de distribuição</div>
            <RadioGroup value={regraHandoff} onValueChange={setRegraHandoff}>
              {[["round", "Round-robin"], ["regiao", "Por região"], ["especifico", "Vendedor específico"]].map(([v, l]) => (
                <div key={v} className="flex items-center gap-2"><RadioGroupItem value={v} id={v} /><Label htmlFor={v}>{l}</Label></div>
              ))}
            </RadioGroup>
          </div>
          <div>
            <div className="label-xs mb-3">Canais de notificação</div>
            <div className="flex flex-wrap gap-2">
              {["WhatsApp pessoal", "Email", "Push no CRM"].map((c) => (
                <label key={c} className="px-3 py-1.5 rounded border border-heaven-orange/40 bg-heaven-orange/10 text-heaven-orange text-xs flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={canais.includes(c)} onChange={() => toggleCanal(c)} className="accent-heaven-orange" /> {c}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 max-w-2xl">
            <div>
              <div className="label-xs mb-3">Início do expediente — {hIni}h</div>
              <Slider value={[hIni]} onValueChange={(v) => setHIni(v[0])} min={0} max={23} />
            </div>
            <div>
              <div className="label-xs mb-3">Fim do expediente — {hFim}h</div>
              <Slider value={[hFim]} onValueChange={(v) => setHFim(v[0])} min={0} max={23} />
            </div>
          </div>
          <div>
            <div className="label-xs mb-3">Dias da semana</div>
            <ToggleGroup type="multiple" value={dias} onValueChange={(v) => v.length && setDias(v)}>
              {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map((d) => (
                <ToggleGroupItem key={d} value={d.toLowerCase().slice(0,3)}>{d}</ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </TabsContent>

        <TabsContent value="reativacao" className="mt-4 bg-bg-secondary border border-border rounded-lg p-5 space-y-4">
          {reativacao.map((t, n) => (
            <div key={n} className="border border-border rounded-md p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="font-semibold text-sm">Tentativa {n + 1}</div>
                <Switch checked={t.ativo} onCheckedChange={(v) => setReativacao((xs) => xs.map((x, i) => i === n ? { ...x, ativo: v } : x))} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs">Após</span>
                <input
                  type="number"
                  value={t.dias}
                  onChange={(e) => setReativacao((xs) => xs.map((x, i) => i === n ? { ...x, dias: Number(e.target.value) } : x))}
                  className="w-20 h-9 px-2 rounded bg-bg-tertiary border border-border text-sm font-mono"
                />
                <span className="text-xs">dias</span>
              </div>
              <textarea
                value={t.mensagem}
                onChange={(e) => setReativacao((xs) => xs.map((x, i) => i === n ? { ...x, mensagem: e.target.value } : x))}
                className="w-full h-20 p-3 rounded bg-bg-tertiary border border-border text-sm resize-none"
              />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
