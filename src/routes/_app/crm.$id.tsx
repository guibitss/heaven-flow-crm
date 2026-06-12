import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLeadDetail, useUpdateLeadStatus, useVendedores } from "@/hooks/use-crm-data";
import {
  STATUS_HEAT, STATUS_LABEL, PIPELINE_ORDER, TEMPERATURA_LABEL, corPorTemperatura,
  type LeadStatus, type Temperatura,
} from "@/lib/heat";
import { cn } from "@/lib/utils";
import { ScoreRing } from "@/components/common/score-ring";
import { PulseFlash } from "@/components/common/pulse-flash";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PipelineProgress } from "@/components/crm/pipeline-progress";
import { DadosTab } from "@/components/crm/dados-tab";
import { ConversaTab } from "@/components/crm/conversa-tab";
import { TimelineTab } from "@/components/crm/timeline-tab";
import { NotasTab } from "@/components/crm/notas-tab";
import { FONTE_LABEL, iniciais } from "@/components/crm/crm-shared";

export const Route = createFileRoute("/_app/crm/$id")({
  component: LeadDossie,
});

const ABAS = ["dados", "conversa", "timeline", "notas"] as const;
type Aba = (typeof ABAS)[number];

const ABA_LABEL: Record<Aba, string> = {
  dados: "Dados",
  conversa: "Conversa",
  timeline: "Timeline",
  notas: "Notas",
};

function LeadDossie() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: raw, isLoading, error } = useLeadDetail(id);
  const { data: vendedoresData = [] } = useVendedores();
  const updateStatus = useUpdateLeadStatus();
  const [aba, setAba] = useState<Aba>("dados");

  const vendedores = vendedoresData as { id: string; nome: string; avatar_url: string | null }[];

  function close() { navigate({ to: "/crm" }); }

  const atribuir = useMutation({
    mutationFn: async (vendedorId: string) => {
      const { error: err } = await supabase.from("leads").update({ vendedor_id: vendedorId } as never).eq("id", id);
      if (err) throw err;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead", id] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Vendedor atribuído");
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao atribuir vendedor"),
  });

  if (isLoading) {
    return (
      <Overlay onClose={close}>
        <div className="space-y-4 p-6">
          <Skeleton className="h-10 w-2/3 shimmer-heaven" />
          <Skeleton className="h-4 w-1/3 shimmer-heaven" />
          <Skeleton className="h-40 w-full shimmer-heaven" />
        </div>
      </Overlay>
    );
  }

  if (error || !raw) {
    return (
      <Overlay onClose={close}>
        <div className="p-8 text-sm text-muted-foreground">Lead não encontrado.</div>
      </Overlay>
    );
  }

  const lead = raw as Record<string, unknown>;
  const temperatura = (lead.temperatura ?? "frio") as Temperatura;
  const status = lead.status as LeadStatus;
  const vendedor = lead.vendedor as { id: string; nome: string; avatar_url: string | null } | null;
  const tempCor = corPorTemperatura(temperatura);
  const fonte = String(lead.fonte ?? "");

  return (
    <Overlay onClose={close}>
      {/* faixa superior 2px na cor da temperatura */}
      <div className="h-0.5 shrink-0" style={{ backgroundColor: tempCor }} aria-hidden />

      <header className="border-b border-border p-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <ScoreRing score={lead.score as number | null} size={40} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-bold leading-tight">{String(lead.razao_social)}</h1>
                <span className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-bg-tertiary px-2 py-0.5 text-[10px] font-medium tracking-wide">
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: tempCor }} aria-hidden />
                  {TEMPERATURA_LABEL[temperatura]}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 font-mono tabular-nums text-xs text-muted-foreground">
                {lead.cnpj ? <span>{String(lead.cnpj)}</span> : null}
                <span>{FONTE_LABEL[fonte] ?? fonte}</span>
                {lead.fonte_ref ? <span className="truncate">{String(lead.fonte_ref)}</span> : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-9 items-center gap-1.5 rounded-md bg-bg-tertiary px-3 text-sm hover:bg-bg-tertiary/70">
                Mover etapa <ChevronDown className="h-4 w-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-bg-secondary">
                {[...PIPELINE_ORDER, "perdido" as LeadStatus].map((s) => (
                  <DropdownMenuItem
                    key={s}
                    disabled={s === status}
                    onClick={() => updateStatus.mutate({ id, status: s })}
                    className="gap-2"
                  >
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: STATUS_HEAT[s] }} aria-hidden />
                    {STATUS_LABEL[s]}
                    {s === status && <span className="label-xs ml-auto">atual</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <PulseFlash pulseKey={String(lead.vendedor_id ?? "sem")} className="rounded-md">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-9 items-center gap-1.5 rounded-md bg-bg-tertiary px-3 text-sm hover:bg-bg-tertiary/70">
                {vendedor ? (
                  <>
                    <Avatar className="size-5">
                      {vendedor.avatar_url && <AvatarImage src={vendedor.avatar_url} alt="" />}
                      <AvatarFallback className="text-[9px] bg-bg-secondary">{iniciais(vendedor.nome)}</AvatarFallback>
                    </Avatar>
                    <span className="max-w-32 truncate">{vendedor.nome}</span>
                  </>
                ) : (
                  "Atribuir"
                )}
                <ChevronDown className="h-4 w-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-bg-secondary">
                {vendedores.length === 0 ? (
                  <DropdownMenuItem disabled>Nenhum vendedor ativo</DropdownMenuItem>
                ) : vendedores.map((v) => (
                  <DropdownMenuItem
                    key={v.id}
                    disabled={v.id === lead.vendedor_id}
                    onClick={() => atribuir.mutate(v.id)}
                    className="gap-2"
                  >
                    <Avatar className="size-5">
                      {v.avatar_url && <AvatarImage src={v.avatar_url} alt="" />}
                      <AvatarFallback className="text-[9px] bg-bg-tertiary">{iniciais(v.nome)}</AvatarFallback>
                    </Avatar>
                    {v.nome}
                    {v.id === lead.vendedor_id && <span className="label-xs ml-auto">atual</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            </PulseFlash>

            <button
              onClick={close}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-bg-tertiary hover:bg-bg-tertiary/70"
              aria-label="Fechar dossiê"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div className="mt-5">
          <PipelineProgress status={status} />
        </div>
      </header>

      {/* abas tipográficas — underline laranja 2px, sem pills */}
      <nav className="flex gap-6 border-b border-border px-6" role="tablist" aria-label="Seções do dossiê">
        {ABAS.map((a) => (
          <button
            key={a}
            role="tab"
            aria-selected={aba === a}
            onClick={() => setAba(a)}
            className={cn(
              "relative py-3 text-sm font-medium transition-colors",
              aba === a ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {ABA_LABEL[a]}
            {aba === a && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-heaven-orange" aria-hidden />
            )}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {aba === "dados" && <DadosTab raw={lead} />}
        {aba === "conversa" && (
          <ConversaTab
            leadId={id}
            handoffEm={(lead.handoff_em as string | null) ?? null}
            tempoPrimeiraRespostaSegundos={(lead.tempo_primeira_resposta_segundos as number | null) ?? null}
          />
        )}
        {aba === "timeline" && <TimelineTab leadId={id} />}
        {aba === "notas" && <NotasTab leadId={id} />}
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-border bg-bg-secondary animate-in zoom-in-95"
        role="dialog"
        aria-modal="true"
        aria-label="Dossiê do lead"
      >
        {children}
      </div>
    </div>
  );
}
