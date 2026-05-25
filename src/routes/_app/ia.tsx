import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/ia")({
  component: IaPage,
});

const variaveis = ["{nome_empresa}", "{cidade}", "{decisor}", "{cnae}"];

function IaPage() {
  const [msg, setMsg] = useState("Olá {decisor}! Aqui é a Heaven, vimos que a {nome_empresa} atua com energia solar em {cidade}. Podemos ajudar com estruturas e suporte de painéis?");
  const [perguntas, setPerguntas] = useState([
    { id: "p1", pergunta: "Vocês fazem instalação ou só venda?", tipo: "escolha", criterio: "Faz instalação" },
    { id: "p2", pergunta: "Quantos sistemas por mês?", tipo: "texto", criterio: "≥ 5 sistemas" },
    { id: "p3", pergunta: "Já tem fornecedor de estrutura?", tipo: "sim_nao", criterio: "Aberto a trocar" },
  ]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agente IA</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure abordagem, qualificação e handoff</p>
      </div>

      <Tabs defaultValue="abertura">
        <TabsList>
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
            <div className="flex gap-2">
              <button onClick={() => toast.success("Mensagem salva")} className="h-9 px-4 rounded-md bg-heaven-orange text-primary-foreground text-sm font-medium">Salvar</button>
              <button className="h-9 px-4 rounded-md border border-border hover:bg-bg-tertiary text-sm">Iniciar A/B test</button>
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

        <TabsContent value="perguntas" className="mt-4 bg-bg-secondary border border-border rounded-lg p-5">
          <div className="space-y-2">
            {perguntas.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-md border border-border">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <input defaultValue={p.pergunta} className="flex-1 bg-transparent text-sm outline-none" />
                <Select defaultValue={p.tipo}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="texto">Texto</SelectItem>
                    <SelectItem value="sim_nao">Sim/Não</SelectItem>
                    <SelectItem value="escolha">Escolha</SelectItem>
                  </SelectContent>
                </Select>
                <input defaultValue={p.criterio} className="w-44 h-9 px-2 rounded bg-bg-secondary border border-border text-xs" />
                <button onClick={() => setPerguntas((x) => x.filter((q) => q.id !== p.id))} className="text-muted-foreground hover:text-danger"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <button onClick={() => setPerguntas([...perguntas, { id: `p${Date.now()}`, pergunta: "Nova pergunta", tipo: "texto", criterio: "" }])} className="mt-4 h-9 px-4 rounded-md bg-heaven-orange text-primary-foreground text-sm font-medium flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Nova pergunta
          </button>
        </TabsContent>

        <TabsContent value="handoff" className="mt-4 bg-bg-secondary border border-border rounded-lg p-5 space-y-6">
          <div>
            <div className="label-xs mb-3">Regra de distribuição</div>
            <RadioGroup defaultValue="round">
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
                  <input type="checkbox" defaultChecked className="accent-heaven-orange" /> {c}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 max-w-2xl">
            <div>
              <div className="label-xs mb-3">Início do expediente</div>
              <Slider defaultValue={[8]} min={0} max={23} />
            </div>
            <div>
              <div className="label-xs mb-3">Fim do expediente</div>
              <Slider defaultValue={[18]} min={0} max={23} />
            </div>
          </div>
          <div>
            <div className="label-xs mb-3">Dias da semana</div>
            <ToggleGroup type="multiple" defaultValue={["seg","ter","qua","qui","sex"]}>
              {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map((d) => (
                <ToggleGroupItem key={d} value={d.toLowerCase().slice(0,3)}>{d}</ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </TabsContent>

        <TabsContent value="reativacao" className="mt-4 bg-bg-secondary border border-border rounded-lg p-5 space-y-4">
          {[1,2,3].map((n) => (
            <div key={n} className="border border-border rounded-md p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="font-semibold text-sm">Tentativa {n}</div>
                <Switch defaultChecked={n === 1} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs">Após</span>
                <input type="number" defaultValue={n * 3} className="w-20 h-9 px-2 rounded bg-bg-tertiary border border-border text-sm font-mono" />
                <span className="text-xs">dias</span>
              </div>
              <textarea defaultValue={`Olá! Notei que ainda não conseguimos conversar. Posso te ajudar com algo sobre estruturas para painéis?`} className="w-full h-20 p-3 rounded bg-bg-tertiary border border-border text-sm resize-none" />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
