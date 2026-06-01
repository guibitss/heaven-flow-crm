import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play, Plus, Trash2, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_app/captacao")({
  component: CaptacaoPage,
});

const cnaesList = [
  { c: "35.11-5/01", d: "Geração de energia elétrica" },
  { c: "43.21-5/00", d: "Instalação e manutenção elétrica" },
  { c: "71.12-0/00", d: "Serviços de engenharia" },
  { c: "47.42-3/00", d: "Comércio varejista de materiais elétricos" },
];

type CfgRow = {
  id: number;
  captacao_ativa: boolean;
  google_maps_ativo: boolean;
  google_maps_config: any;
  receita_ativo: boolean;
  receita_config: any;
};

const defaultMaps = { cidades: ["Curitiba", "São Paulo"], raio_km: 50, palavras_chave: ["energia solar"], volume_diario_max: 150 };
const defaultReceita = { ufs: ["PR", "SP"], cnaes: cnaesList.map((c) => c.c), capital_minimo: 50000, anos_mercado_min: 2 };

function CaptacaoPage() {
  const qc = useQueryClient();

  const { data: cfg, isLoading } = useQuery({
    queryKey: ["configuracoes_captacao"],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracoes_captacao").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return (data ?? { id: 1, captacao_ativa: true, google_maps_ativo: false, google_maps_config: defaultMaps, receita_ativo: false, receita_config: defaultReceita }) as CfgRow;
    },
  });

  const [maps, setMaps] = useState<any>(defaultMaps);
  const [receita, setReceita] = useState<any>(defaultReceita);
  const [ativa, setAtiva] = useState(true);

  useEffect(() => {
    if (cfg) {
      setMaps({ ...defaultMaps, ...(cfg.google_maps_config ?? {}) });
      setReceita({ ...defaultReceita, ...(cfg.receita_config ?? {}) });
      setAtiva(cfg.captacao_ativa);
    }
  }, [cfg]);

  const saveCfg = useMutation({
    mutationFn: async (patch: Partial<CfgRow>) => {
      const { error } = await supabase
        .from("configuracoes_captacao")
        .upsert({ id: 1, captacao_ativa: ativa, google_maps_config: maps, receita_config: receita, ...patch, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configuração salva");
      qc.invalidateQueries({ queryKey: ["configuracoes_captacao"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Captação automatizada</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure as regras para encontrar empresas automaticamente e transformar oportunidades em leads no CRM.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <div className="bg-bg-secondary border border-border rounded-lg p-5 flex items-center justify-between">
            <div>
              <div className="font-semibold">Captação automática</div>
              <div className="text-xs text-muted-foreground mt-1">
                {ativa ? "Ativada" : "Desativada"}
              </div>
            </div>
            <Switch
              checked={ativa}
              onCheckedChange={(v) => {
                setAtiva(v);
                saveCfg.mutate({ captacao_ativa: v });
              }}
            />
          </div>

          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <Tabs defaultValue="maps">
              <TabsList>
                <TabsTrigger value="maps">Google Maps</TabsTrigger>
                <TabsTrigger value="receita">Receita Federal</TabsTrigger>
                <TabsTrigger value="blacklist">Blacklist</TabsTrigger>
              </TabsList>

              <TabsContent value="maps" className="mt-4 bg-bg-secondary border border-border rounded-lg p-5 space-y-5">
                <p className="text-sm text-muted-foreground">
                  Busca empresas por cidade, raio e palavras-chave, como energia solar, construção ou engenharia.
                </p>
                <Section title="Cidades alvo" hint="">
                  <ChipInput value={maps.cidades ?? []} onChange={(cidades) => setMaps({ ...maps, cidades })} />
                </Section>
                <Section title="Raio (km)" hint="">
                  <SliderField value={maps.raio_km ?? 50} onChange={(raio_km) => setMaps({ ...maps, raio_km })} min={1} max={200} suffix="km" />
                </Section>
                <Section title="Palavras-chave" hint="">
                  <ChipInput value={maps.palavras_chave ?? []} onChange={(palavras_chave) => setMaps({ ...maps, palavras_chave })} />
                </Section>
                <Section title="Volume diário máximo" hint="Limite de leads criados por dia">
                  <SliderField value={maps.volume_diario_max ?? 150} onChange={(volume_diario_max) => setMaps({ ...maps, volume_diario_max })} min={10} max={500} suffix=" leads/dia" />
                </Section>
                <div className="pt-2">
                  <button onClick={() => saveCfg.mutate({})} disabled={saveCfg.isPending} className="h-9 px-4 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground text-sm font-medium">
                    {saveCfg.isPending ? "Salvando..." : "Salvar Google Maps"}
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="receita" className="mt-4 bg-bg-secondary border border-border rounded-lg p-5 space-y-5">
                <p className="text-sm text-muted-foreground">
                  Filtra empresas por UF, CNAE, capital social e tempo de mercado para encontrar leads com maior potencial.
                </p>
                <Section title="UFs" hint="">
                  <ChipInput value={receita.ufs ?? []} onChange={(ufs) => setReceita({ ...receita, ufs })} />
                </Section>
                <Section title="CNAEs" hint="Segmentos de empresas que serão buscados">
                  <div className="space-y-2">
                    {cnaesList.map((c) => {
                      const checked = (receita.cnaes ?? []).includes(c.c);
                      return (
                        <label key={c.c} className="flex items-center gap-3 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              const list = new Set<string>(receita.cnaes ?? []);
                              if (v) list.add(c.c); else list.delete(c.c);
                              setReceita({ ...receita, cnaes: Array.from(list) });
                            }}
                          />
                          <span className="font-mono text-xs text-muted-foreground">{c.c}</span>
                          <span>{c.d}</span>
                        </label>
                      );
                    })}
                  </div>
                </Section>
                <Section title="Capital social mínimo (R$)" hint="">
                  <input
                    type="number"
                    value={receita.capital_minimo ?? 0}
                    onChange={(e) => setReceita({ ...receita, capital_minimo: Number(e.target.value) })}
                    className="w-48 h-10 px-3 rounded-md bg-bg-tertiary border border-border text-sm"
                  />
                </Section>
                <Section title="Tempo mínimo de mercado (anos)" hint="">
                  <SliderField value={receita.anos_mercado_min ?? 0} onChange={(anos_mercado_min) => setReceita({ ...receita, anos_mercado_min })} min={0} max={20} suffix=" anos" />
                </Section>
                <div className="pt-2">
                  <button onClick={() => saveCfg.mutate({})} disabled={saveCfg.isPending} className="h-9 px-4 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground text-sm font-medium">
                    {saveCfg.isPending ? "Salvando..." : "Salvar Receita"}
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="blacklist" className="mt-4 bg-bg-secondary border border-border rounded-lg p-5">
                <p className="text-sm text-muted-foreground mb-3">
                  Empresas cadastradas aqui não serão importadas para o CRM. Use para bloquear concorrentes, clientes atuais ou empresas que não devem entrar no funil.
                </p>
                <BlacklistTab />
              </TabsContent>
            </Tabs>
          )}
        </div>

        <SidebarStatus ativa={ativa} />
      </div>
    </div>
  );
}

function SidebarStatus({ ativa }: { ativa: boolean }) {
  const qc = useQueryClient();

  const { data: ultimo } = useQuery({
    queryKey: ["eventos-captacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventos_feed")
        .select("*")
        .eq("tipo", "captacao")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const executar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("eventos_feed").insert({
        tipo: "captacao" as any,
        texto: "Captação manual solicitada",
        metadata: { manual: true, ativa },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Captação solicitada. A execução real será conectada na integração.");
      qc.invalidateQueries({ queryKey: ["eventos-captacao"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao executar"),
  });

  return (
    <aside className="bg-bg-secondary border border-border rounded-lg p-5 h-fit sticky top-20 space-y-4">
      <div>
        <div className="label-xs mb-2">Status</div>
        <div className="text-sm">{ativa ? "Captação ativa" : "Captação desativada"}</div>
      </div>
      <div className="border-t border-border pt-4">
        <div className="label-xs mb-1">Última execução</div>
        {ultimo ? (
          <>
            <div className="text-sm">{ultimo.texto}</div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              {formatDistanceToNow(new Date(ultimo.created_at!), { addSuffix: true, locale: ptBR })}
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground">Nenhuma captação executada ainda.</div>
        )}
      </div>
      <button
        onClick={() => executar.mutate()}
        disabled={executar.isPending}
        className="w-full h-10 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 glow-orange disabled:opacity-50"
      >
        {executar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        Executar agora
      </button>
    </aside>
  );
}

function BlacklistTab() {
  const qc = useQueryClient();
  const [cnpj, setCnpj] = useState("");
  const [razao, setRazao] = useState("");
  const [motivo, setMotivo] = useState("");

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["blacklist"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blacklist").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addItem = useMutation({
    mutationFn: async () => {
      if (!cnpj.trim()) throw new Error("Informe o CNPJ");
      const { error } = await supabase.from("blacklist").insert({ cnpj: cnpj.trim(), razao_social: razao || null, motivo: motivo || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Adicionado à blacklist");
      setCnpj(""); setRazao(""); setMotivo("");
      qc.invalidateQueries({ queryKey: ["blacklist"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao adicionar"),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blacklist").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removido");
      qc.invalidateQueries({ queryKey: ["blacklist"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao remover"),
  });

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="CNPJ" className="h-9 px-3 rounded-md bg-bg-tertiary border border-border text-sm font-mono w-44" />
        <input value={razao} onChange={(e) => setRazao(e.target.value)} placeholder="Razão social" className="h-9 px-3 rounded-md bg-bg-tertiary border border-border text-sm flex-1 min-w-[180px]" />
        <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo" className="h-9 px-3 rounded-md bg-bg-tertiary border border-border text-sm flex-1 min-w-[180px]" />
        <button onClick={() => addItem.mutate()} disabled={addItem.isPending} className="h-9 px-3 rounded-md bg-heaven-orange text-primary-foreground text-sm font-medium flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : itens.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">Nenhum CNPJ na blacklist</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-xs label-xs">
            <tr>
              <th className="text-left pb-3">CNPJ</th>
              <th className="text-left pb-3">Razão Social</th>
              <th className="text-left pb-3">Motivo</th>
              <th className="text-left pb-3">Adicionado</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {itens.map((b: any) => (
              <tr key={b.id}>
                <td className="py-3 font-mono text-xs">{b.cnpj}</td>
                <td className="py-3">{b.razao_social ?? "—"}</td>
                <td className="py-3 text-muted-foreground">{b.motivo ?? "—"}</td>
                <td className="py-3 font-mono text-xs text-muted-foreground">
                  {b.created_at ? new Date(b.created_at).toLocaleDateString("pt-BR") : "—"}
                </td>
                <td className="py-3 text-right">
                  <button onClick={() => removeItem.mutate(b.id)} className="text-muted-foreground hover:text-danger">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-xs mb-1">{title}</div>
      {hint ? <div className="text-xs text-muted-foreground mb-2">{hint}</div> : null}
      {children}
    </div>
  );
}

function ChipInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="border border-border rounded-md bg-bg-tertiary p-2 flex flex-wrap gap-2 min-h-[44px]">
      {value.map((c) => (
        <span key={c} className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-heaven-orange/15 text-heaven-orange border border-heaven-orange/30">
          {c}
          <button onClick={() => onChange(value.filter((x) => x !== c))}>×</button>
        </span>
      ))}
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && v.trim()) {
            e.preventDefault();
            onChange([...value, v.trim()]);
            setV("");
          }
        }}
        className="flex-1 min-w-[100px] bg-transparent outline-none text-sm"
        placeholder="Digite e pressione Enter..."
      />
    </div>
  );
}

function SliderField({ value, onChange, min, max, suffix }: { value: number; onChange: (v: number) => void; min: number; max: number; suffix: string }) {
  return (
    <div className="flex items-center gap-4">
      <Slider value={[value]} onValueChange={(vs) => onChange(vs[0])} min={min} max={max} className="flex-1" />
      <span className="font-mono text-sm w-28 text-right">{value}{suffix}</span>
    </div>
  );
}
