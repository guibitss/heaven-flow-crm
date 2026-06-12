import * as SliderPrimitive from "@radix-ui/react-slider";
import { Plus, RotateCcw, Trash2, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DirtyStateBar } from "@/components/common/dirty-state-bar";
import { ScoreRing } from "@/components/common/score-ring";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  calcularScore,
  type LeadSimulado,
  PORTES,
  type ScoreConfig,
  somaMaximaTeorica,
  temperaturaDoScore,
  UFS,
  useReprocessarScores,
  useSaveScoreConfig,
  useScoreConfig,
} from "@/hooks/use-score-config";
import { heatColor, TEMPERATURA_LABEL } from "@/lib/heat";

// Score Studio — calibragem do score de leads (configuracoes_captacao.score_config)
// com simulador ao vivo espelhando a fórmula do trigger SQL.

const CNAE_PREFIX_RE = /^\d{2}\.\d{2}$/;

const PORTE_LABEL: Record<string, string> = {
  GRANDE: "Grande",
  MEDIA: "Média",
  EPP: "EPP",
  ME: "ME",
};

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-bg-secondary hairline-top p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PesoSlider({
  label,
  value,
  max,
  onChange,
}: {
  label: React.ReactNode;
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 text-sm">{label}</div>
      <Slider
        value={[value]}
        min={0}
        max={max}
        step={1}
        onValueChange={([v]) => onChange(v)}
        aria-label={typeof label === "string" ? `Peso ${label}` : "Peso"}
        className="flex-1"
      />
      <span className="w-8 shrink-0 text-right font-mono text-sm tabular-nums">
        {value}
      </span>
    </div>
  );
}

/** Range duplo 0-100 com faixa pintada FRIO / MORNO / QUENTE. */
function TemperaturaRange({
  morno,
  quente,
  onChange,
}: {
  morno: number;
  quente: number;
  onChange: (morno: number, quente: number) => void;
}) {
  return (
    <div>
      <SliderPrimitive.Root
        value={[morno, quente]}
        min={0}
        max={100}
        step={1}
        minStepsBetweenThumbs={1}
        onValueChange={([m, q]) => onChange(m, q)}
        className="relative flex w-full touch-none select-none items-center"
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full">
          <span
            className="absolute inset-y-0 left-0 bg-heat-1"
            style={{ width: `${morno}%` }}
            aria-hidden
          />
          <span
            className="absolute inset-y-0 bg-heat-3"
            style={{ left: `${morno}%`, width: `${Math.max(0, quente - morno)}%` }}
            aria-hidden
          />
          <span
            className="absolute inset-y-0 bg-heat-5"
            style={{ left: `${quente}%`, width: `${100 - quente}%` }}
            aria-hidden
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label={`Limiar morno: ${morno}`}
          className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <SliderPrimitive.Thumb
          aria-label={`Limiar quente: ${quente}`}
          className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </SliderPrimitive.Root>
      <div className="mt-2 flex justify-between font-mono text-xs tabular-nums text-muted-foreground">
        <span>
          FRIO <span className="text-foreground">0–{morno - 1}</span>
        </span>
        <span>
          MORNO <span className="text-foreground">{morno}–{quente - 1}</span>
        </span>
        <span>
          QUENTE <span className="text-foreground">{quente}–100</span>
        </span>
      </div>
    </div>
  );
}

export function ScoreStudio() {
  const { data: saved, isLoading } = useScoreConfig();
  const saveMutation = useSaveScoreConfig();
  const reprocessar = useReprocessarScores();

  const [draft, setDraft] = useState<ScoreConfig | null>(null);
  const [novoCnae, setNovoCnae] = useState("");
  const [sim, setSim] = useState<LeadSimulado>({
    cnaePrefix: "35.11",
    capitalSocial: 500000,
    porte: "MEDIA",
    uf: "MG",
    temTelefone: true,
    temSite: true,
    temDecisor: false,
  });

  const config = draft ?? saved ?? null;
  const dirty =
    draft != null && saved != null && JSON.stringify(draft) !== JSON.stringify(saved);

  const score = useMemo(
    () => (config ? calcularScore(config, sim) : 0),
    [config, sim],
  );
  const somaMax = config ? somaMaximaTeorica(config) : 0;

  if (isLoading || !config) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full shimmer-heaven" />
        <Skeleton className="h-32 w-full shimmer-heaven" />
        <Skeleton className="h-32 w-full shimmer-heaven" />
      </div>
    );
  }

  const patch = (p: Partial<ScoreConfig>) => setDraft({ ...config, ...p });

  const cnaeEntries = Object.entries(config.cnae)
    .filter(([k]) => k !== "default")
    .sort(([a], [b]) => a.localeCompare(b));

  const addCnae = () => {
    const v = novoCnae.trim();
    if (!CNAE_PREFIX_RE.test(v)) {
      toast.error("Prefixo de CNAE inválido — use o formato dd.dd (ex.: 35.11).");
      return;
    }
    if (config.cnae[v] != null) {
      toast.error(`O prefixo ${v} já está configurado.`);
      return;
    }
    patch({ cnae: { ...config.cnae, [v]: 10 } });
    setNovoCnae("");
  };

  const removeCnae = (prefix: string) => {
    const { [prefix]: _removed, ...rest } = config.cnae;
    patch({ cnae: rest });
  };

  const handleSave = () => saveMutation.mutate(config);

  const handleSaveEReprocessar = () => {
    saveMutation.mutate(config, {
      onSuccess: () => reprocessar.mutate(),
    });
  };

  const handleRestaurar = () => {
    saveMutation.mutate({}, { onSuccess: () => setDraft(null) });
  };

  const temp = temperaturaDoScore(config, score);

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_300px]">
      {/* ===== Coluna de calibragem ===== */}
      <div className="min-w-0 space-y-4">
        {(somaMax < 100 || somaMax > 140) && (
          <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
            Soma máxima teórica de{" "}
            <span className="font-mono tabular-nums">{somaMax}</span> pontos —
            recomendado entre 100 e 140 para usar bem a escala 0–100.
          </div>
        )}

        <SectionCard
          title="CNAE"
          description="Peso por prefixo de atividade econômica. Leads cujo CNAE não casa com nenhum prefixo recebem o peso de 'demais CNAEs'."
        >
          <div className="space-y-3">
            {cnaeEntries.map(([prefix, peso]) => (
              <div key={prefix} className="flex items-center gap-3">
                <span className="w-28 shrink-0 font-mono text-sm tabular-nums">
                  {prefix}
                </span>
                <Slider
                  value={[peso]}
                  min={0}
                  max={40}
                  step={1}
                  onValueChange={([v]) =>
                    patch({ cnae: { ...config.cnae, [prefix]: v } })
                  }
                  aria-label={`Peso do CNAE ${prefix}`}
                  className="flex-1"
                />
                <span className="w-8 shrink-0 text-right font-mono text-sm tabular-nums">
                  {peso}
                </span>
                <button
                  type="button"
                  onClick={() => removeCnae(prefix)}
                  aria-label={`Remover CNAE ${prefix}`}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-3 border-t border-border pt-3">
              <span className="w-28 shrink-0 text-sm text-muted-foreground">
                demais CNAEs
              </span>
              <Slider
                value={[config.cnae.default ?? 0]}
                min={0}
                max={40}
                step={1}
                onValueChange={([v]) =>
                  patch({ cnae: { ...config.cnae, default: v } })
                }
                aria-label="Peso dos demais CNAEs"
                className="flex-1"
              />
              <span className="w-8 shrink-0 text-right font-mono text-sm tabular-nums">
                {config.cnae.default ?? 0}
              </span>
              <span className="size-4 shrink-0" aria-hidden />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Input
                value={novoCnae}
                onChange={(e) => setNovoCnae(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCnae()}
                placeholder="dd.dd"
                className="h-8 w-24 font-mono text-sm"
                aria-label="Novo prefixo de CNAE"
              />
              <Button type="button" variant="outline" size="sm" onClick={addCnae}>
                <Plus className="mr-1 size-3.5" /> Adicionar CNAE
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Capital social"
          description="Pontos = capital ÷ divisor, limitado ao máximo. Ex.: divisor R$ 20.000 → R$ 500 mil de capital vale 25 pontos."
        >
          <div className="space-y-4">
            <PesoSlider
              label="Máximo"
              value={config.capital.max}
              max={40}
              onChange={(v) => patch({ capital: { ...config.capital, max: v } })}
            />
            <div className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-sm">Divisor</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">R$</span>
                <Input
                  type="number"
                  min={1}
                  value={config.capital.divisor}
                  onChange={(e) =>
                    patch({
                      capital: {
                        ...config.capital,
                        divisor: Math.max(1, Number(e.target.value) || 1),
                      },
                    })
                  }
                  className="h-8 w-32 font-mono text-sm tabular-nums"
                  aria-label="Divisor do capital social em reais por ponto"
                />
                <span className="text-xs text-muted-foreground">por ponto</span>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Porte" description="Peso pelo porte cadastral da empresa.">
          <div className="space-y-3">
            {PORTES.map((p) => (
              <PesoSlider
                key={p}
                label={PORTE_LABEL[p]}
                value={config.porte[p] ?? 0}
                max={30}
                onChange={(v) => patch({ porte: { ...config.porte, [p]: v } })}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="UF"
          description="Peso por estado (0–20). O fundo de cada célula esquenta com o peso."
        >
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
            {UFS.map((uf) => {
              const peso = config.uf[uf] ?? config.uf.default ?? 0;
              return (
                <label
                  key={uf}
                  className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5"
                  style={{
                    backgroundColor: `${heatColor((peso / 20) * 100)}${peso > 0 ? "26" : "14"}`,
                  }}
                >
                  <span className="font-mono text-xs">{uf}</span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={peso}
                    onChange={(e) =>
                      patch({
                        uf: {
                          ...config.uf,
                          [uf]: Math.max(0, Math.min(20, Number(e.target.value) || 0)),
                        },
                      })
                    }
                    aria-label={`Peso da UF ${uf}`}
                    className="w-full min-w-0 bg-transparent text-right font-mono text-xs tabular-nums outline-none"
                  />
                </label>
              );
            })}
            <label className="col-span-2 flex items-center gap-1.5 rounded-md border border-dashed border-border px-2 py-1.5">
              <span className="text-xs text-muted-foreground">demais</span>
              <input
                type="number"
                min={0}
                max={20}
                value={config.uf.default ?? 0}
                onChange={(e) =>
                  patch({
                    uf: {
                      ...config.uf,
                      default: Math.max(0, Math.min(20, Number(e.target.value) || 0)),
                    },
                  })
                }
                aria-label="Peso das demais UFs"
                className="w-full min-w-0 bg-transparent text-right font-mono text-xs tabular-nums outline-none"
              />
            </label>
          </div>
        </SectionCard>

        <SectionCard
          title="Completude do cadastro"
          description="Pontos extras quando o lead tem dado de contato/decisor preenchido."
        >
          <div className="space-y-3">
            <PesoSlider
              label="Telefone"
              value={config.completude.telefone}
              max={10}
              onChange={(v) =>
                patch({ completude: { ...config.completude, telefone: v } })
              }
            />
            <PesoSlider
              label="Site"
              value={config.completude.site}
              max={10}
              onChange={(v) => patch({ completude: { ...config.completude, site: v } })}
            />
            <PesoSlider
              label="Decisor"
              value={config.completude.decisor}
              max={10}
              onChange={(v) =>
                patch({ completude: { ...config.completude, decisor: v } })
              }
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Temperatura"
          description="Limiares de score que classificam o lead como MORNO e QUENTE."
        >
          <TemperaturaRange
            morno={config.temperatura.morno}
            quente={config.temperatura.quente}
            onChange={(morno, quente) => patch({ temperatura: { morno, quente } })}
          />
        </SectionCard>

        {/* Ações secundárias */}
        <div className="flex flex-wrap items-center gap-2 pb-20">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={saveMutation.isPending || reprocessar.isPending}
              >
                <Zap className="mr-1.5 size-3.5" />
                Salvar e reprocessar leads
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Salvar e reprocessar scores?</AlertDialogTitle>
                <AlertDialogDescription>
                  A configuração será salva e o score de todos os leads existentes
                  será recalculado com os novos pesos. A operação roda no banco e
                  pode levar alguns segundos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleSaveEReprocessar}>
                  Salvar e reprocessar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={saveMutation.isPending || reprocessar.isPending}
              >
                <RotateCcw className="mr-1.5 size-3.5" />
                Restaurar padrão
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restaurar configuração padrão?</AlertDialogTitle>
                <AlertDialogDescription>
                  Todos os pesos customizados serão descartados e o banco voltará a
                  usar os valores padrão. Esta ação não reprocessa leads existentes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleRestaurar}>
                  Restaurar padrão
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <p className="basis-full text-xs text-muted-foreground">
            Salvar sem reprocessar só afeta leads novos ou alterados — os scores
            existentes permanecem como estão.
          </p>
        </div>
      </div>

      {/* ===== Simulador ao vivo ===== */}
      <aside className="lg:sticky lg:top-4">
        <div className="rounded-lg border border-border bg-bg-secondary energized-top p-5">
          <h3 className="text-sm font-semibold">Simulador</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Lead fictício pontuado ao vivo com os pesos acima.
          </p>

          <div className="mt-4 flex items-center gap-4">
            <ScoreRing score={score} size={64} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: heatColor(score) }}
                  aria-hidden
                />
                <span className="text-sm font-semibold">
                  {TEMPERATURA_LABEL[temp]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                vira {TEMPERATURA_LABEL[temp]} com os limiares atuais
              </p>
            </div>
          </div>

          {/* Barra térmica do score */}
          <div className="mt-3">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-bg-tertiary">
              <span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${score}%`, backgroundColor: heatColor(score) }}
                aria-hidden
              />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
              <span>0</span>
              <span>{config.temperatura.morno}</span>
              <span>{config.temperatura.quente}</span>
              <span>100</span>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <span className="label-xs mb-1 block">CNAE</span>
              <Select
                value={sim.cnaePrefix}
                onValueChange={(v) => setSim({ ...sim, cnaePrefix: v })}
              >
                <SelectTrigger className="h-8 font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cnaeEntries.map(([prefix]) => (
                    <SelectItem key={prefix} value={prefix} className="font-mono text-xs">
                      {prefix}
                    </SelectItem>
                  ))}
                  <SelectItem value="__outro__" className="text-xs">
                    Outro (demais CNAEs)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <span className="label-xs mb-1 block">Capital social</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">R$</span>
                <Input
                  type="number"
                  min={0}
                  value={sim.capitalSocial}
                  onChange={(e) =>
                    setSim({
                      ...sim,
                      capitalSocial: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="h-8 font-mono text-xs tabular-nums"
                  aria-label="Capital social simulado"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="label-xs mb-1 block">Porte</span>
                <Select
                  value={sim.porte}
                  onValueChange={(v) => setSim({ ...sim, porte: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PORTES.map((p) => (
                      <SelectItem key={p} value={p} className="text-xs">
                        {PORTE_LABEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span className="label-xs mb-1 block">UF</span>
                <Select value={sim.uf} onValueChange={(v) => setSim({ ...sim, uf: v })}>
                  <SelectTrigger className="h-8 font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UFS.map((uf) => (
                      <SelectItem key={uf} value={uf} className="font-mono text-xs">
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              {(
                [
                  ["temTelefone", "Tem telefone"],
                  ["temSite", "Tem site"],
                  ["temDecisor", "Tem decisor"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs">{label}</span>
                  <Switch
                    checked={sim[key]}
                    onCheckedChange={(c) => setSim({ ...sim, [key]: c })}
                    aria-label={label}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="label-xs">Soma máx. teórica</span>
              <span className="font-mono text-sm tabular-nums">{somaMax}</span>
            </div>
          </div>
        </div>
      </aside>

      <DirtyStateBar
        dirty={dirty}
        saving={saveMutation.isPending}
        onSave={handleSave}
        onDiscard={() => setDraft(null)}
        label="Pesos de score alterados"
      />
    </div>
  );
}
