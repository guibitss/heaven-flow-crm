import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Play, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/captacao")({
  component: CaptacaoPage,
});

const cnaesList = [
  { c: "35.11-5/01", d: "Geração de energia elétrica" },
  { c: "43.21-5/00", d: "Instalação e manutenção elétrica" },
  { c: "71.12-0/00", d: "Serviços de engenharia" },
  { c: "47.42-3/00", d: "Comércio varejista de materiais elétricos" },
];

const blacklist = [
  { cnpj: "12.345.678/0001-99", razao: "Empresa X LTDA", motivo: "Solicitação do cliente", data: "12/10/2025" },
  { cnpj: "98.765.432/0001-11", razao: "Concorrente Solar", motivo: "Concorrente direto", data: "03/09/2025" },
];

function CaptacaoPage() {
  const [ativo, setAtivo] = useState(true);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Captação automatizada</h1>
        <p className="text-sm text-muted-foreground mt-1">Configuração de fontes e regras</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <div className="bg-bg-secondary border border-border rounded-lg p-5 flex items-center justify-between">
            <div>
              <div className="font-semibold">Captação automática</div>
              <div className="text-xs text-muted-foreground mt-1">
                {ativo ? "Capturando: 23 leads hoje" : "Desativada"}
              </div>
            </div>
            <Switch checked={ativo} onCheckedChange={setAtivo} />
          </div>

          <Tabs defaultValue="maps">
            <TabsList>
              <TabsTrigger value="maps">Google Maps</TabsTrigger>
              <TabsTrigger value="receita">Receita Federal</TabsTrigger>
              <TabsTrigger value="blacklist">Blacklist</TabsTrigger>
            </TabsList>

            <TabsContent value="maps" className="mt-4 bg-bg-secondary border border-border rounded-lg p-5 space-y-5">
              <Section title="Cidades alvo">
                <ChipInput defaults={["Curitiba", "São Paulo", "Joinville", "Londrina"]} />
              </Section>
              <Section title="Raio (km)">
                <SliderField defaultValue={50} min={1} max={200} suffix="km" />
              </Section>
              <Section title="Palavras-chave">
                <ChipInput defaults={["energia solar", "integradora solar", "instalação solar"]} />
              </Section>
              <Section title="Volume diário máximo">
                <SliderField defaultValue={150} min={10} max={500} suffix=" leads/dia" />
              </Section>
            </TabsContent>

            <TabsContent value="receita" className="mt-4 bg-bg-secondary border border-border rounded-lg p-5 space-y-5">
              <Section title="UFs">
                <ChipInput defaults={["PR", "SP", "SC", "RS", "MG"]} />
              </Section>
              <Section title="CNAEs">
                <div className="space-y-2">
                  {cnaesList.map((c) => (
                    <label key={c.c} className="flex items-center gap-3 text-sm">
                      <Checkbox defaultChecked />
                      <span className="font-mono text-xs text-muted-foreground">{c.c}</span>
                      <span>{c.d}</span>
                    </label>
                  ))}
                </div>
              </Section>
              <Section title="Capital social mínimo">
                <input type="text" defaultValue="R$ 50.000" className="w-48 h-10 px-3 rounded-md bg-bg-tertiary border border-border text-sm" />
              </Section>
              <Section title="Tempo mínimo de mercado (anos)">
                <SliderField defaultValue={2} min={0} max={20} suffix=" anos" />
              </Section>
            </TabsContent>

            <TabsContent value="blacklist" className="mt-4 bg-bg-secondary border border-border rounded-lg p-5">
              <div className="flex justify-end mb-4">
                <button className="h-9 px-3 rounded-md bg-heaven-orange text-primary-foreground text-sm font-medium flex items-center gap-1.5"><Plus className="h-4 w-4" /> Adicionar CNPJ</button>
              </div>
              <table className="w-full text-sm">
                <thead className="text-xs label-xs"><tr><th className="text-left pb-3">CNPJ</th><th className="text-left pb-3">Razão Social</th><th className="text-left pb-3">Motivo</th><th className="text-left pb-3">Data</th><th></th></tr></thead>
                <tbody className="divide-y divide-border">
                  {blacklist.map((b) => (
                    <tr key={b.cnpj}>
                      <td className="py-3 font-mono text-xs">{b.cnpj}</td>
                      <td className="py-3">{b.razao}</td>
                      <td className="py-3 text-muted-foreground">{b.motivo}</td>
                      <td className="py-3 font-mono text-xs text-muted-foreground">{b.data}</td>
                      <td className="py-3 text-right"><button className="text-muted-foreground hover:text-danger"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="bg-bg-secondary border border-border rounded-lg p-5 h-fit sticky top-20 space-y-4">
          <div>
            <div className="label-xs mb-2">Status da execução</div>
            <div className="text-sm">Próxima execução:</div>
            <div className="font-mono font-semibold text-heaven-orange">06:00 amanhã</div>
          </div>
          <div className="border-t border-border pt-4">
            <div className="text-xs text-muted-foreground">Última execução: hoje 06:00</div>
            <div className="text-sm mt-1">47 leads captados</div>
          </div>
          <button
            onClick={() => toast.success("Captação iniciada")}
            className="w-full h-10 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 glow-orange"
          >
            <Play className="h-4 w-4" /> Executar agora
          </button>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-xs mb-3">{title}</div>
      {children}
    </div>
  );
}

function ChipInput({ defaults }: { defaults: string[] }) {
  const [chips, setChips] = useState(defaults);
  const [v, setV] = useState("");
  return (
    <div className="border border-border rounded-md bg-bg-tertiary p-2 flex flex-wrap gap-2 min-h-[44px]">
      {chips.map((c) => (
        <span key={c} className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-heaven-orange/15 text-heaven-orange border border-heaven-orange/30">
          {c}
          <button onClick={() => setChips(chips.filter((x) => x !== c))}>×</button>
        </span>
      ))}
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && v.trim()) { setChips([...chips, v.trim()]); setV(""); }
        }}
        className="flex-1 min-w-[100px] bg-transparent outline-none text-sm"
        placeholder="Digite e pressione Enter..."
      />
    </div>
  );
}

function SliderField({ defaultValue, min, max, suffix }: { defaultValue: number; min: number; max: number; suffix: string }) {
  const [v, setV] = useState(defaultValue);
  return (
    <div className="flex items-center gap-4">
      <Slider value={[v]} onValueChange={(vs) => setV(vs[0])} min={min} max={max} className="flex-1" />
      <span className="font-mono text-sm w-28 text-right">{v}{suffix}</span>
    </div>
  );
}
