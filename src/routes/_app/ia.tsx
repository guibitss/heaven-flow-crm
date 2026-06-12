// Agente IA — coluna única de configuração (configuracoes_ia id=1).
// Seções numeradas 01..05, persistência via use-ia-config + DirtyStateBar.

import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  Database,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { DirtyStateBar } from "@/components/common/dirty-state-bar";
import { EmptyState } from "@/components/common/empty-state";
import {
  FOLLOWUPS_SUGERIDOS,
  formatarHora,
  useIaConfig,
  useReprocessarScores,
  type FollowUp,
  type PerguntaItem,
} from "@/hooks/use-ia-config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/ia")({
  component: IaPage,
});

// ------------------------------------------------------------------ helpers UI

const VARIAVEIS = ["{{nome}}", "{{empresa}}", "{{cidade}}"] as const;
const EXEMPLO: Record<string, string> = {
  "{{nome}}": "João",
  "{{empresa}}": "Solar Tech",
  "{{cidade}}": "Maringá",
};

function substituirVariaveis(texto: string): string {
  return texto.replace(/\{\{\s*(nome|empresa|cidade)\s*\}\}/g, (_m, v: string) => EXEMPLO[`{{${v}}}`]);
}

function SectionHeader({ num, title, desc }: { num: string; title: string; desc?: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-xs text-muted-foreground tabular-nums">{num}</span>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {desc && <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>}
      </div>
    </div>
  );
}

function WhatsPreview({ texto }: { texto: string }) {
  const corpo = substituirVariaveis(texto.trim());
  return (
    <div className="rounded-lg bg-[#0B141A] p-4 min-h-32 flex items-end justify-end">
      {corpo ? (
        <div
          className="max-w-[85%] rounded-lg rounded-br-none bg-[#005C4B] px-3 py-2 text-sm text-[#E9EDEF] shadow"
          aria-label="Prévia da mensagem no WhatsApp"
        >
          <p className="whitespace-pre-wrap break-words">{corpo}</p>
          <span className="mt-1 flex items-center justify-end gap-1 text-[10px] font-mono text-[#8696A0]">
            14:32
            <span className="flex text-[#53BDEB]" aria-label="Lida (check duplo)">
              <Check className="size-3" aria-hidden />
              <Check className="-ml-1.5 size-3" aria-hidden />
            </span>
          </span>
        </div>
      ) : (
        <p className="w-full text-center text-xs text-muted-foreground self-center">
          Digite a mensagem para ver a prévia
        </p>
      )}
    </div>
  );
}

function EditorMensagem({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const inserirVariavel = (v: string) => {
    const el = ref.current;
    if (!el) {
      onChange(value + v);
      return;
    }
    const ini = el.selectionStart ?? value.length;
    const fim = el.selectionEnd ?? value.length;
    const novo = value.slice(0, ini) + v + value.slice(fim);
    onChange(novo);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(ini + v.length, ini + v.length);
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-3">
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-40 resize-none bg-bg-tertiary"
        />
        <div>
          <div className="label-xs mb-2">Variáveis — clique para inserir no cursor</div>
          <div className="flex flex-wrap gap-2">
            {VARIAVEIS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => inserirVariavel(v)}
                className="rounded border border-border bg-bg-tertiary px-2 py-1 font-mono text-xs text-foreground hover:border-heaven-orange/50 hover:text-heaven-orange"
                aria-label={`Inserir variável ${v}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
      <WhatsPreview texto={value} />
    </div>
  );
}

// --------------------------------------------------------- 02 pergunta sortável

function PerguntaRow({
  item,
  onChange,
  onRemove,
}: {
  item: PerguntaItem;
  onChange: (texto: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-md border border-border bg-bg-tertiary p-2.5",
        isDragging && "opacity-70 border-border-strong",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        aria-label="Arrastar para reordenar pergunta"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <input
        value={item.texto}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Texto da pergunta"
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        aria-label="Editar pergunta de qualificação"
      />
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground hover:text-danger"
        aria-label="Remover pergunta"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </div>
  );
}

// ------------------------------------------------------------ 04 follow-up dot

const COOL_RAMP = ["bg-heat-5", "bg-heat-3", "bg-heat-1"] as const;
const coolClass = (i: number) => COOL_RAMP[Math.min(i, COOL_RAMP.length - 1)];

function FollowUpDot({
  fu,
  index,
  onChange,
  onRemove,
}: {
  fu: FollowUp;
  index: number;
  onChange: (f: FollowUp) => void;
  onRemove: () => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex min-w-28 flex-col items-center gap-2 rounded-md border border-border bg-bg-tertiary px-3 py-3 text-left hover:border-border-strong"
          aria-label={`Editar follow-up do dia ${fu.dias}`}
        >
          <span className={cn("size-3 rounded-full", coolClass(index))} aria-hidden />
          <span className="font-mono text-sm tabular-nums">Dia {fu.dias}</span>
          <span className="line-clamp-2 max-w-36 text-center text-xs text-muted-foreground">
            {fu.mensagem || "Sem mensagem"}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            <Pencil className="size-3" aria-hidden /> editar
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3" align="center">
        <div className="space-y-1.5">
          <label className="label-xs" htmlFor={`fu-dias-${index}`}>Disparar após (dias sem resposta)</label>
          <Input
            id={`fu-dias-${index}`}
            type="number"
            min={1}
            value={fu.dias}
            onChange={(e) => onChange({ ...fu, dias: Math.max(1, Number(e.target.value) || 1) })}
            className="w-24 font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <label className="label-xs" htmlFor={`fu-msg-${index}`}>Mensagem</label>
          <Textarea
            id={`fu-msg-${index}`}
            value={fu.mensagem}
            onChange={(e) => onChange({ ...fu, mensagem: e.target.value })}
            className="h-24 resize-none"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove} className="text-danger hover:text-danger">
          <Trash2 className="mr-1.5 size-3.5" aria-hidden /> Remover follow-up
        </Button>
      </PopoverContent>
    </Popover>
  );
}

// ------------------------------------------------------------------------ page

const DIAS = [
  { key: "seg", label: "Seg" },
  { key: "ter", label: "Ter" },
  { key: "qua", label: "Qua" },
  { key: "qui", label: "Qui" },
  { key: "sex", label: "Sex" },
  { key: "sab", label: "Sáb" },
  { key: "dom", label: "Dom" },
] as const;

const HACHURA =
  "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.05) 4px, rgba(255,255,255,0.05) 8px)";

function IaPage() {
  const { form, patch, dirty, saving, save, discard, isLoading, novaPergunta } = useIaConfig();
  const reproc = useReprocessarScores();
  const [variante, setVariante] = useState<"a" | "b">("a");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  if (isLoading || !form) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Skeleton className="h-9 w-48 shimmer-heaven" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-44 w-full shimmer-heaven" />
        ))}
      </div>
    );
  }

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = form.perguntas.findIndex((p) => p.id === active.id);
    const newIndex = form.perguntas.findIndex((p) => p.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    patch({ perguntas: arrayMove(form.perguntas, oldIndex, newIndex) });
  };

  const toggleDia = (key: string) => {
    const ativos = form.diasSemana.includes(key)
      ? form.diasSemana.filter((d) => d !== key)
      : [...form.diasSemana, key];
    if (ativos.length === 0) return; // pelo menos um dia ativo
    patch({ diasSemana: ativos });
  };

  const reativacaoOrdenada = form.reativacao;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 pb-24">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Agente IA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Abordagem, qualificação, expediente e reativação do agente
        </p>
      </div>

      {/* 01 — mensagem de abertura */}
      <section className="space-y-4 rounded-lg border border-border bg-bg-secondary p-5 hairline-top">
        <SectionHeader
          num="01"
          title="Mensagem de abertura"
          desc="Primeira mensagem enviada ao lead. Use as variáveis para personalizar."
        />
        <Tabs value={variante} onValueChange={(v) => setVariante(v as "a" | "b")}>
          <TabsList>
            <TabsTrigger value="a">Variante A</TabsTrigger>
            <TabsTrigger value="b">Variante B</TabsTrigger>
          </TabsList>
          <TabsContent value="a" className="mt-4">
            <EditorMensagem
              value={form.mensagemAbertura}
              onChange={(v) => patch({ mensagemAbertura: v })}
              placeholder="Olá {{nome}}! Vimos que a {{empresa}} atua com energia solar em {{cidade}}…"
            />
          </TabsContent>
          <TabsContent value="b" className="mt-4">
            <EditorMensagem
              value={form.varianteB}
              onChange={(v) => patch({ varianteB: v })}
              placeholder="Variante B para teste A/B (opcional)"
            />
          </TabsContent>
        </Tabs>
      </section>

      {/* 02 — perguntas de qualificação */}
      <section className="space-y-4 rounded-lg border border-border bg-bg-secondary p-5 hairline-top">
        <SectionHeader
          num="02"
          title="Perguntas de qualificação"
          desc="O agente percorre as perguntas nesta ordem. Arraste para reordenar."
        />
        {form.perguntas.length === 0 ? (
          <EmptyState
            title="Nenhuma pergunta cadastrada"
            description="Sem perguntas, o agente faz o handoff logo após a primeira resposta."
          />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={form.perguntas.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {form.perguntas.map((p) => (
                  <PerguntaRow
                    key={p.id}
                    item={p}
                    onChange={(texto) =>
                      patch({ perguntas: form.perguntas.map((q) => (q.id === p.id ? { ...q, texto } : q)) })
                    }
                    onRemove={() => patch({ perguntas: form.perguntas.filter((q) => q.id !== p.id) })}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => patch({ perguntas: [...form.perguntas, novaPergunta()] })}
        >
          <Plus className="mr-1.5 size-4" aria-hidden /> Nova pergunta
        </Button>
      </section>

      {/* 03 — expediente */}
      <section className="space-y-5 rounded-lg border border-border bg-bg-secondary p-5 hairline-top">
        <SectionHeader
          num="03"
          title="Expediente"
          desc="Fora deste horário o agente não dispara mensagens."
        />
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="label-xs">Janela de atendimento</span>
            <span className="font-mono text-sm tabular-nums">
              {formatarHora(form.horarioInicio)} — {formatarHora(form.horarioFim)}
            </span>
          </div>
          <SliderPrimitive.Root
            value={[form.horarioInicio, form.horarioFim]}
            onValueChange={([ini, fim]) => patch({ horarioInicio: ini, horarioFim: fim })}
            min={0}
            max={24}
            step={0.5}
            minStepsBetweenThumbs={1}
            className="relative flex w-full touch-none select-none items-center"
            aria-label="Janela de expediente"
          >
            <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-bg-tertiary">
              <SliderPrimitive.Range
                className="absolute h-full opacity-80"
                style={{ background: "linear-gradient(90deg, var(--heat-2), var(--heat-4))" }}
              />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb
              className="block size-4 rounded-full border border-border-strong bg-foreground shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Início do expediente"
            />
            <SliderPrimitive.Thumb
              className="block size-4 rounded-full border border-border-strong bg-foreground shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Fim do expediente"
            />
          </SliderPrimitive.Root>
          <div className="flex justify-between font-mono text-[10px] text-muted-foreground tabular-nums">
            <span>00:00</span>
            <span>12:00</span>
            <span>24:00</span>
          </div>
        </div>
        <div>
          <div className="label-xs mb-2">Dias ativos</div>
          <div className="flex flex-wrap gap-1.5">
            {DIAS.map((d) => {
              const ativo = form.diasSemana.includes(d.key);
              const fimDeSemana = d.key === "sab" || d.key === "dom";
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => toggleDia(d.key)}
                  aria-pressed={ativo}
                  aria-label={`${d.label} — ${ativo ? "ativo" : "inativo"}`}
                  style={!ativo && fimDeSemana ? { backgroundImage: HACHURA } : undefined}
                  className={cn(
                    "h-9 w-12 rounded-md border text-xs font-medium transition-colors",
                    ativo
                      ? "border-heaven-orange/50 bg-heaven-orange/15 text-heaven-orange"
                      : "border-border bg-bg-tertiary text-muted-foreground",
                  )}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 04 — reativação */}
      <section className="space-y-4 rounded-lg border border-border bg-bg-secondary p-5 hairline-top">
        <SectionHeader
          num="04"
          title="Reativação"
          desc="Follow-ups automáticos enquanto o lead esfria — cada tentativa mais fria que a anterior."
        />
        {reativacaoOrdenada.length === 0 ? (
          <EmptyState
            title="Nenhum follow-up configurado"
            description="Leads sem resposta não serão reativados automaticamente."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => patch({ reativacao: FOLLOWUPS_SUGERIDOS })}
              >
                Usar sequência sugerida (dias 3, 6 e 9)
              </Button>
            }
          />
        ) : (
          <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
            {reativacaoOrdenada.map((fu, i) => (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && <span className="h-px w-6 shrink-0 bg-border" aria-hidden />}
                <FollowUpDot
                  fu={fu}
                  index={i}
                  onChange={(novo) =>
                    patch({
                      reativacao: reativacaoOrdenada
                        .map((x, j) => (j === i ? novo : x))
                        .sort((a, b) => a.dias - b.dias),
                    })
                  }
                  onRemove={() => patch({ reativacao: reativacaoOrdenada.filter((_, j) => j !== i) })}
                />
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="h-px w-6 shrink-0 bg-border" aria-hidden />
              <button
                type="button"
                onClick={() => {
                  const ultimo = reativacaoOrdenada[reativacaoOrdenada.length - 1];
                  patch({
                    reativacao: [
                      ...reativacaoOrdenada,
                      { dias: (ultimo?.dias ?? 0) + 3, mensagem: "" },
                    ],
                  });
                }}
                className="flex min-w-20 flex-col items-center gap-1 rounded-md border border-dashed border-border px-3 py-3 text-muted-foreground hover:border-border-strong hover:text-foreground"
                aria-label="Adicionar follow-up"
              >
                <Plus className="size-4" aria-hidden />
                <span className="text-xs">Adicionar</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 05 — motor de score */}
      <section className="space-y-4 rounded-lg border border-border bg-bg-secondary p-5 hairline-top">
        <SectionHeader num="05" title="Motor de score" />
        <div className="flex items-start gap-3 rounded-md border border-border bg-bg-tertiary p-4">
          <Database className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            O score é calculado pelo banco a cada alteração do lead — mudanças nos pesos de
            captação só valem para leads novos, a menos que você reprocesse a base.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={reproc.isPending}>
              {reproc.isPending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="mr-1.5 size-4" aria-hidden />
              )}
              Reprocessar todos os scores
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reprocessar todos os scores?</AlertDialogTitle>
              <AlertDialogDescription>
                Todos os leads serão recalculados com a configuração de score atual. Scores e
                temperaturas podem mudar em toda a base. A ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => reproc.mutate()}>Reprocessar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      <DirtyStateBar dirty={dirty} saving={saving} onSave={save} onDiscard={discard} />
    </div>
  );
}
