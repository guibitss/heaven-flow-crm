import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  AtSign,
  Briefcase,
  Building2,
  Loader2,
  MapPin,
  Play,
  Plus,
  Radio,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PulseFlash } from "@/components/common/pulse-flash";
import { CountUp } from "@/components/common/count-up";
import { DirtyStateBar } from "@/components/common/dirty-state-bar";
import { EmptyState } from "@/components/common/empty-state";
import { heatColor } from "@/lib/heat";
import {
  DEFAULT_INSTAGRAM_CONFIG,
  DEFAULT_LINKEDIN_CONFIG,
  DEFAULT_MAPS_CONFIG,
  DEFAULT_RECEITA_CONFIG,
  parseInstagramConfig,
  parseLinkedInConfig,
  parseMapsConfig,
  parseReceitaConfig,
  useCaptacaoConfig,
  useCaptacaoRealtime,
  useCaptadosHoje,
  useSalvarCaptacao,
  useUltimaCaptacao,
  type GoogleMapsConfig,
  type InstagramConfig,
  type LinkedInConfig,
  type ReceitaConfig,
} from "@/hooks/use-captacao";

export const Route = createFileRoute("/_app/captacao")({
  component: CaptacaoPage,
});

const CNAES_PADRAO: { codigo: string; descricao: string }[] = [
  { codigo: "35.11", descricao: "Geração de energia elétrica" },
  { codigo: "43.21", descricao: "Instalações elétricas" },
  { codigo: "43.22", descricao: "Instalações hidráulicas e de climatização" },
  { codigo: "71.12", descricao: "Serviços de engenharia" },
  { codigo: "47.42", descricao: "Comércio de material elétrico" },
];

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

function CaptacaoPage() {
  const { data: cfg, isLoading } = useCaptacaoConfig();
  const salvar = useSalvarCaptacao();
  useCaptacaoRealtime();

  // Drafts dos jsonbs (DirtyStateBar). Switches persistem imediato, fora daqui.
  const [receita, setReceita] = useState<ReceitaConfig>(DEFAULT_RECEITA_CONFIG);
  const [maps, setMaps] = useState<GoogleMapsConfig>(DEFAULT_MAPS_CONFIG);
  const [insta, setInsta] = useState<InstagramConfig>(DEFAULT_INSTAGRAM_CONFIG);
  const [linkedin, setLinkedin] = useState<LinkedInConfig>(DEFAULT_LINKEDIN_CONFIG);
  const [initialized, setInitialized] = useState(false);

  const savedReceita = useMemo(
    () => parseReceitaConfig(cfg?.receita_config),
    [cfg?.receita_config],
  );
  const savedMaps = useMemo(
    () => parseMapsConfig(cfg?.google_maps_config),
    [cfg?.google_maps_config],
  );
  const savedInsta = useMemo(
    () => parseInstagramConfig(cfg?.instagram_config),
    [cfg?.instagram_config],
  );
  const savedLinkedin = useMemo(
    () => parseLinkedInConfig(cfg?.linkedin_config),
    [cfg?.linkedin_config],
  );

  useEffect(() => {
    if (cfg !== undefined && !initialized) {
      setReceita(savedReceita);
      setMaps(savedMaps);
      setInsta(savedInsta);
      setLinkedin(savedLinkedin);
      setInitialized(true);
    }
  }, [cfg, initialized, savedReceita, savedMaps, savedInsta, savedLinkedin]);

  const dirty =
    initialized &&
    (JSON.stringify(receita) !== JSON.stringify(savedReceita) ||
      JSON.stringify(maps) !== JSON.stringify(savedMaps) ||
      JSON.stringify(insta) !== JSON.stringify(savedInsta) ||
      JSON.stringify(linkedin) !== JSON.stringify(savedLinkedin));

  const salvarConfigs = () => {
    salvar.mutate(
      {
        receita_config: JSON.parse(JSON.stringify(receita)),
        google_maps_config: JSON.parse(JSON.stringify(maps)),
        instagram_config: JSON.parse(JSON.stringify(insta)),
        linkedin_config: JSON.parse(JSON.stringify(linkedin)),
      },
      { onSuccess: () => toast.success("Configurações de captação salvas") },
    );
  };

  const descartar = () => {
    setReceita(savedReceita);
    setMaps(savedMaps);
    setInsta(savedInsta);
    setLinkedin(savedLinkedin);
  };

  // Switches persistem imediato (sem dirty bar).
  const toggleCampo = (
    campo:
      | "captacao_ativa"
      | "receita_ativo"
      | "google_maps_ativo"
      | "instagram_ativo"
      | "linkedin_ativo",
    valor: boolean,
    labelOn: string,
    labelOff: string,
  ) => {
    salvar.mutate(
      { [campo]: valor },
      { onSuccess: () => toast.success(valor ? labelOn : labelOff) },
    );
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="shimmer-heaven h-9 w-64" />
        <Skeleton className="shimmer-heaven h-32 w-full" />
        <Skeleton className="shimmer-heaven h-72 w-full" />
        <Skeleton className="shimmer-heaven h-64 w-full" />
      </div>
    );
  }

  const captacaoAtiva = cfg?.captacao_ativa ?? false;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Captação</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Painel de controle do agente de prospecção — fontes, filtros e volume.
        </p>
      </div>

      <PowerSwitch
        ativa={captacaoAtiva}
        saving={salvar.isPending}
        onToggle={(v) =>
          toggleCampo(
            "captacao_ativa",
            v,
            "Captação ativada",
            "Captação em espera",
          )
        }
        volumeMax={savedReceita.volume_diario_max}
      />

      <CanalReceita
        ativo={cfg?.receita_ativo ?? false}
        onToggleAtivo={(v) =>
          toggleCampo(
            "receita_ativo",
            v,
            "Canal Receita Federal ativado",
            "Canal Receita Federal desativado",
          )
        }
        config={receita}
        onChange={setReceita}
      />

      <CanalGoogleMaps
        ativo={cfg?.google_maps_ativo ?? false}
        onToggleAtivo={(v) =>
          toggleCampo(
            "google_maps_ativo",
            v,
            "Canal Google Maps ativado",
            "Canal Google Maps desativado",
          )
        }
        config={maps}
        onChange={setMaps}
      />

      <CanalInstagram
        ativo={cfg?.instagram_ativo ?? false}
        onToggleAtivo={(v) =>
          toggleCampo(
            "instagram_ativo",
            v,
            "Canal Instagram ativado",
            "Canal Instagram desativado",
          )
        }
        config={insta}
        onChange={setInsta}
      />

      <CanalLinkedin
        ativo={cfg?.linkedin_ativo ?? false}
        onToggleAtivo={(v) =>
          toggleCampo(
            "linkedin_ativo",
            v,
            "Canal LinkedIn ativado",
            "Canal LinkedIn desativado",
          )
        }
        config={linkedin}
        onChange={setLinkedin}
      />

      <UltimasExecucoes />

      <DirtyStateBar
        dirty={dirty}
        saving={salvar.isPending}
        onSave={salvarConfigs}
        onDiscard={descartar}
        label="Alterações de captação não salvas"
      />
    </div>
  );
}

// ---------------------------------------------------------------- PowerSwitch

function PowerSwitch({
  ativa,
  saving,
  onToggle,
  volumeMax,
}: {
  ativa: boolean;
  saving: boolean;
  onToggle: (v: boolean) => void;
  volumeMax: number;
}) {
  return (
    <section className="energized-top rounded-lg border border-border bg-bg-secondary p-6">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className={
              ativa
                ? "glow-orange inline-block size-3 rounded-full bg-heaven-orange"
                : "inline-block size-3 rounded-full bg-heaven-gray"
            }
          />
          <div>
            <div
              className={
                "font-mono text-2xl font-bold tracking-widest tabular-nums " +
                (ativa ? "text-heaven-orange" : "text-muted-foreground")
              }
            >
              {ativa ? "GERANDO" : "EM ESPERA"}
            </div>
            <div className="label-xs mt-1">
              {ativa
                ? "Agente de prospecção em operação"
                : "Agente de prospecção pausado"}
            </div>
          </div>
        </div>
        <Switch
          checked={ativa}
          disabled={saving}
          onCheckedChange={onToggle}
          aria-label={ativa ? "Desativar captação" : "Ativar captação"}
          className="scale-150"
        />
      </div>
      <CapacityBar volumeMax={volumeMax} />
    </section>
  );
}

function CapacityBar({ volumeMax }: { volumeMax: number }) {
  const { data: hoje, isLoading } = useCaptadosHoje();
  const captados = hoje ?? 0;
  const pct = volumeMax > 0 ? Math.min(100, (captados / volumeMax) * 100) : 0;
  const cor = heatColor(pct);

  return (
    <div className="mt-6">
      <div className="flex items-end justify-between">
        <span className="label-xs">Captados hoje</span>
        {isLoading ? (
          <Skeleton className="shimmer-heaven h-8 w-24" />
        ) : (
          <span className="font-mono text-[34px] font-bold leading-none tabular-nums">
            <CountUp value={captados} />
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              / {volumeMax}
            </span>
          </span>
        )}
      </div>
      <div
        className="mt-2 h-0.5 w-full rounded-full bg-bg-tertiary"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={volumeMax}
        aria-valuenow={captados}
        aria-label={`Captados hoje: ${captados} de ${volumeMax}`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: cor,
            boxShadow: pct > 70 ? `0 0 8px ${cor}` : undefined,
          }}
        />
      </div>
    </div>
  );
}

// ----------------------------------------------------------- Canal Receita

function CanalReceita({
  ativo,
  onToggleAtivo,
  config,
  onChange,
}: {
  ativo: boolean;
  onToggleAtivo: (v: boolean) => void;
  config: ReceitaConfig;
  onChange: (c: ReceitaConfig) => void;
}) {
  const [novoCnae, setNovoCnae] = useState("");

  const addCnae = () => {
    const v = novoCnae.trim();
    if (!/^\d{2}\.\d{2}$/.test(v)) {
      toast.error("CNAE deve estar no formato 00.00 (ex.: 43.21)");
      return;
    }
    if (config.cnaes.includes(v)) {
      toast.error("CNAE já adicionado");
      return;
    }
    onChange({ ...config, cnaes: [...config.cnaes, v] });
    setNovoCnae("");
  };

  const toggleUf = (uf: string) => {
    const tem = config.ufs.includes(uf);
    onChange({
      ...config,
      ufs: tem ? config.ufs.filter((u) => u !== uf) : [...config.ufs, uf],
    });
  };

  return (
    <section className="energized-top rounded-lg border border-border bg-bg-secondary p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="size-5 text-muted-foreground" aria-hidden />
          <div>
            <h2 className="text-base font-semibold">Receita Federal</h2>
            <p className="text-xs text-muted-foreground">
              Empresas por CNAE e UF, direto da base de CNPJs.
            </p>
          </div>
        </div>
        <Switch
          checked={ativo}
          onCheckedChange={onToggleAtivo}
          aria-label={
            ativo
              ? "Desativar canal Receita Federal"
              : "Ativar canal Receita Federal"
          }
        />
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <div className="label-xs mb-2">CNAEs monitorados</div>
          <div className="flex flex-wrap gap-2">
            {CNAES_PADRAO.map((c) => {
              const selecionado = config.cnaes.includes(c.codigo);
              return (
                <button
                  key={c.codigo}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...config,
                      cnaes: selecionado
                        ? config.cnaes.filter((x) => x !== c.codigo)
                        : [...config.cnaes, c.codigo],
                    })
                  }
                  aria-pressed={selecionado}
                  className={
                    "rounded-md border px-2.5 py-1.5 text-xs transition-colors " +
                    (selecionado
                      ? "border-heaven-orange/40 bg-heaven-orange/10 text-foreground"
                      : "border-border bg-bg-tertiary text-muted-foreground hover:text-foreground")
                  }
                >
                  <span className="font-mono tabular-nums">{c.codigo}</span>
                  <span className="ml-1.5">{c.descricao}</span>
                </button>
              );
            })}
            {config.cnaes
              .filter((c) => !CNAES_PADRAO.some((p) => p.codigo === c))
              .map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-md border border-heaven-orange/40 bg-heaven-orange/10 px-2.5 py-1.5 font-mono text-xs tabular-nums"
                >
                  {c}
                  <button
                    type="button"
                    aria-label={`Remover CNAE ${c}`}
                    onClick={() =>
                      onChange({
                        ...config,
                        cnaes: config.cnaes.filter((x) => x !== c),
                      })
                    }
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Input
              value={novoCnae}
              onChange={(e) => setNovoCnae(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCnae();
                }
              }}
              placeholder="Adicionar CNAE (ex.: 42.21)"
              className="h-8 w-52 font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCnae}
              aria-label="Adicionar CNAE"
            >
              <Plus className="size-3.5" aria-hidden /> Adicionar
            </Button>
          </div>
        </div>

        <div>
          <div className="label-xs mb-2">
            UFs{" "}
            {config.ufs.length === 0 ? (
              <span className="normal-case text-muted-foreground">
                — nenhuma selecionada: Brasil inteiro
              </span>
            ) : (
              <span className="font-mono normal-case text-muted-foreground">
                — {config.ufs.length} selecionada(s)
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-1 gap-y-1.5">
            {UFS.map((uf) => {
              const sel = config.ufs.includes(uf);
              return (
                <button
                  key={uf}
                  type="button"
                  onClick={() => toggleUf(uf)}
                  aria-pressed={sel}
                  aria-label={
                    sel ? `Remover UF ${uf}` : `Selecionar UF ${uf}`
                  }
                  className={
                    "rounded px-2 py-1 font-mono text-xs tabular-nums transition-colors " +
                    (sel
                      ? "text-foreground underline decoration-heaven-orange decoration-2 underline-offset-4"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {uf}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-bg-tertiary px-4 py-3">
          <div>
            <div className="text-sm font-medium">Gate solar</div>
            <div className="text-xs text-muted-foreground">
              Só nomes com termo solar viram lead.
            </div>
          </div>
          <Switch
            checked={config.solar_gate}
            onCheckedChange={(v) => onChange({ ...config, solar_gate: v })}
            aria-label={
              config.solar_gate ? "Desativar gate solar" : "Ativar gate solar"
            }
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="label-xs">Volume diário máximo</div>
            <div className="text-xs text-muted-foreground">
              Limite de leads importados por dia.
            </div>
          </div>
          <Input
            type="number"
            min={1}
            value={config.volume_diario_max}
            onChange={(e) =>
              onChange({
                ...config,
                volume_diario_max: Math.max(1, Number(e.target.value) || 1),
              })
            }
            aria-label="Volume diário máximo"
            className="h-9 w-28 text-right font-mono tabular-nums"
          />
        </div>

        <p className="border-t border-border pt-3 text-xs text-muted-foreground">
          A importação roda via ETL local — as configurações valem para a
          próxima execução.
        </p>
      </div>
    </section>
  );
}

// ------------------------------------------------------- Canal Google Maps

function CanalGoogleMaps({
  ativo,
  onToggleAtivo,
  config,
  onChange,
}: {
  ativo: boolean;
  onToggleAtivo: (v: boolean) => void;
  config: GoogleMapsConfig;
  onChange: (c: GoogleMapsConfig) => void;
}) {
  const qc = useQueryClient();

  const executar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "discover_google_maps",
        { body: {} },
      );
      if (error) throw error;
      return data as { encontrados?: number; inseridos?: number } | null;
    },
    onSuccess: (data) => {
      toast.success(
        `Busca concluída: ${data?.encontrados ?? 0} encontrados, ${data?.inseridos ?? 0} inseridos`,
      );
      qc.invalidateQueries({ queryKey: ["captacao-execucoes"] });
      qc.invalidateQueries({ queryKey: ["captacao-captados-hoje"] });
    },
    onError: (e: Error) => {
      toast.error(`Falha na busca: ${e.message || "erro desconhecido"}`);
    },
  });

  return (
    <section className="rounded-lg border border-border bg-bg-secondary p-6 hairline-top">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MapPin className="size-5 text-muted-foreground" aria-hidden />
          <div>
            <h2 className="text-base font-semibold">Google Maps</h2>
            <p className="text-xs text-muted-foreground">
              Empresas do setor solar por cidade e termo de busca.
            </p>
          </div>
        </div>
        <Switch
          checked={ativo}
          onCheckedChange={onToggleAtivo}
          aria-label={
            ativo
              ? "Desativar canal Google Maps"
              : "Ativar canal Google Maps"
          }
        />
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <div className="label-xs mb-2">Cidades alvo</div>
          <TagInput
            value={config.cities}
            onChange={(cities) => onChange({ ...config, cities })}
            placeholder="Ex.: Maringá, PR — Enter para adicionar"
            removeLabel={(c) => `Remover cidade ${c}`}
          />
        </div>

        <div>
          <div className="label-xs mb-2">Termos de busca</div>
          <TagInput
            value={config.queries}
            onChange={(queries) => onChange({ ...config, queries })}
            placeholder="Ex.: energia solar — Enter para adicionar"
            removeLabel={(q) => `Remover termo ${q}`}
          />
        </div>

        <div>
          <div className="label-xs mb-2">Profundidade da busca</div>
          <div className="flex items-center gap-4">
            <Slider
              value={[config.max_pages]}
              onValueChange={(vs) =>
                onChange({ ...config, max_pages: vs[0] ?? 2 })
              }
              min={1}
              max={3}
              step={1}
              className="max-w-xs flex-1"
              aria-label="Páginas por cidade"
            />
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              ~{config.max_pages}×20 resultados/cidade
            </span>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <Button
            type="button"
            onClick={() => executar.mutate()}
            disabled={executar.isPending}
            className="glow-orange"
          >
            {executar.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Play className="size-4" aria-hidden />
            )}
            {executar.isPending ? "Executando..." : "Executar agora"}
          </Button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------- Canal Instagram

function CanalInstagram({
  ativo,
  onToggleAtivo,
  config,
  onChange,
}: {
  ativo: boolean;
  onToggleAtivo: (v: boolean) => void;
  config: InstagramConfig;
  onChange: (c: InstagramConfig) => void;
}) {
  const qc = useQueryClient();
  const executar = useMutation({
    mutationFn: async () => {
      // Graph só enriquece; Apify descobre por hashtag.
      const mode = config.provider === "apify" ? "discover" : "enrich";
      const { data, error } = await supabase.functions.invoke(
        "discover_instagram",
        { body: { mode } },
      );
      if (error) throw error;
      return data as { encontrados?: number; inseridos?: number; enriquecidos?: number } | null;
    },
    onSuccess: (data) => {
      toast.success(
        config.provider === "apify"
          ? `Descoberta: ${data?.encontrados ?? 0} achados, ${data?.inseridos ?? 0} novos`
          : `Enriquecimento: ${data?.enriquecidos ?? 0} perfis`,
      );
      qc.invalidateQueries({ queryKey: ["captacao-execucoes"] });
    },
    onError: (e: Error) => toast.error(`Falha: ${e.message || "erro"}`),
  });

  return (
    <section className="rounded-lg border border-border bg-bg-secondary p-6 hairline-top">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AtSign className="size-5 text-muted-foreground" aria-hidden />
          <div>
            <h2 className="text-base font-semibold">Instagram</h2>
            <p className="text-xs text-muted-foreground">
              Perfis do setor solar por hashtag (Apify) ou enriquecimento (Graph).
            </p>
          </div>
        </div>
        <Switch
          checked={ativo}
          onCheckedChange={onToggleAtivo}
          aria-label={ativo ? "Desativar canal Instagram" : "Ativar canal Instagram"}
        />
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <div className="label-xs mb-2">Provedor</div>
          <div className="flex gap-2">
            {(["graph", "apify"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onChange({ ...config, provider: p })}
                className={
                  "rounded-md border px-3 py-1.5 text-sm transition-colors " +
                  (config.provider === p
                    ? "border-heaven-orange text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                {p === "graph" ? "Graph (grátis, enriquece)" : "Apify (pago, descobre)"}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {config.provider === "graph"
              ? "Graph API: completa dados de perfis que você já conhece (precisa de @). Dentro do ToS."
              : "Apify: descobre perfis novos por hashtag (scraping, pago por uso)."}
          </p>
        </div>

        {config.provider === "apify" ? (
          <div>
            <div className="label-xs mb-2">Hashtags</div>
            <TagInput
              value={config.hashtags}
              onChange={(hashtags) => onChange({ ...config, hashtags })}
              placeholder="Ex.: energiasolar — Enter para adicionar"
              removeLabel={(h) => `Remover hashtag ${h}`}
            />
          </div>
        ) : (
          <div>
            <div className="label-xs mb-2">@ conhecidos (para enriquecer)</div>
            <TagInput
              value={config.handles}
              onChange={(handles) => onChange({ ...config, handles })}
              placeholder="Ex.: @solartech — Enter para adicionar"
              removeLabel={(h) => `Remover ${h}`}
            />
          </div>
        )}

        <div className="border-t border-border pt-4">
          <Button type="button" onClick={() => executar.mutate()} disabled={executar.isPending}>
            {executar.isPending
              ? <Loader2 className="size-4 animate-spin" aria-hidden />
              : <Play className="size-4" aria-hidden />}
            {executar.isPending ? "Executando..." : "Executar agora"}
          </Button>
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------- Canal LinkedIn

function CanalLinkedin({
  ativo,
  onToggleAtivo,
  config,
  onChange,
}: {
  ativo: boolean;
  onToggleAtivo: (v: boolean) => void;
  config: LinkedInConfig;
  onChange: (c: LinkedInConfig) => void;
}) {
  const qc = useQueryClient();
  const podeExecutar = ativo && config.habilitado_risco;
  const executar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("discover_linkedin", { body: {} });
      if (error) throw error;
      return data as { encontrados?: number; inseridos?: number } | null;
    },
    onSuccess: (data) =>
      toast.success(`LinkedIn: ${data?.encontrados ?? 0} achados, ${data?.inseridos ?? 0} novos`),
    onError: (e: Error) => toast.error(`Falha: ${e.message || "erro"}`),
  });

  return (
    <section className="rounded-lg border border-border bg-bg-secondary p-6 hairline-top">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Briefcase className="size-5 text-muted-foreground" aria-hidden />
          <div>
            <h2 className="text-base font-semibold">LinkedIn</h2>
            <p className="text-xs text-muted-foreground">
              Empresas do setor por busca (scraping de terceiros).
            </p>
          </div>
        </div>
        <Switch
          checked={ativo}
          onCheckedChange={onToggleAtivo}
          aria-label={ativo ? "Desativar canal LinkedIn" : "Ativar canal LinkedIn"}
        />
      </div>

      <div className="mt-5 space-y-5">
        <div className="flex items-start gap-3 rounded-md border border-danger/40 bg-danger/5 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <div className="flex-1">
            <p className="text-xs text-foreground">
              O scraping de LinkedIn viola o ToS da plataforma e pode bloquear a
              conta usada. Ative só se entender e aceitar o risco.
            </p>
            <label className="mt-2 flex items-center gap-2 text-xs">
              <Switch
                checked={config.habilitado_risco}
                onCheckedChange={(v) => onChange({ ...config, habilitado_risco: v })}
                aria-label="Aceitar risco do scraping de LinkedIn"
              />
              Entendo e aceito o risco
            </label>
          </div>
        </div>

        <div>
          <div className="label-xs mb-2">Termos de busca</div>
          <TagInput
            value={config.queries}
            onChange={(queries) => onChange({ ...config, queries })}
            placeholder="Ex.: integradora solar — Enter para adicionar"
            removeLabel={(q) => `Remover termo ${q}`}
          />
        </div>

        <div className="border-t border-border pt-4">
          <Button
            type="button"
            variant={podeExecutar ? "default" : "ghost"}
            onClick={() => executar.mutate()}
            disabled={!podeExecutar || executar.isPending}
            title={podeExecutar ? undefined : "Ative o canal e aceite o risco para executar"}
          >
            {executar.isPending
              ? <Loader2 className="size-4 animate-spin" aria-hidden />
              : <Play className="size-4" aria-hidden />}
            {executar.isPending ? "Executando..." : "Executar agora"}
          </Button>
        </div>
      </div>
    </section>
  );
}

function TagInput({
  value,
  onChange,
  placeholder,
  removeLabel,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  removeLabel: (item: string) => string;
}) {
  const [texto, setTexto] = useState("");

  const add = () => {
    const v = texto.trim();
    if (!v) return;
    if (value.includes(v)) {
      toast.error("Item já adicionado");
      return;
    }
    onChange([...value, v]);
    setTexto("");
  };

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-md border border-border bg-bg-tertiary p-2">
      {value.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-1.5 rounded border border-border bg-bg-secondary px-2 py-1 text-xs"
        >
          {item}
          <button
            type="button"
            aria-label={removeLabel(item)}
            onClick={() => onChange(value.filter((x) => x !== item))}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        placeholder={placeholder}
        className="min-w-[180px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

// ------------------------------------------------------ Últimas execuções

function UltimasExecucoes() {
  const { data: eventos, isLoading } = useUltimaCaptacao();

  return (
    <section className="rounded-lg border border-border bg-bg-secondary p-6 hairline-top">
      <div className="mb-4 flex items-center gap-2">
        <Radio className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="label-xs">Últimas execuções</h2>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="shimmer-heaven h-10 w-full" />
          <Skeleton className="shimmer-heaven h-10 w-full" />
          <Skeleton className="shimmer-heaven h-10 w-full" />
        </div>
      ) : !eventos || eventos.length === 0 ? (
        <EmptyState
          title="Nenhuma execução registrada"
          description="Quando o agente captar empresas, cada execução aparece aqui."
        />
      ) : (
        <PulseFlash pulseKey={eventos[0]?.id ?? "vazio"}>
          <ul className="divide-y divide-border">
            {eventos.map((ev) => (
              <li
                key={ev.id}
                className="flex items-baseline justify-between gap-4 py-2.5"
              >
                <span className="text-sm">{ev.texto}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {ev.created_at
                    ? formatDistanceToNow(new Date(ev.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })
                    : "—"}
                </span>
              </li>
            ))}
          </ul>
        </PulseFlash>
      )}
    </section>
  );
}
