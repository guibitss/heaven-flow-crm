import { Link } from "@tanstack/react-router";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { corPorTemperatura, TEMPERATURA_LABEL, type Temperatura } from "@/lib/heat";
import { ScoreRing } from "@/components/common/score-ring";
import { PulseFlash } from "@/components/common/pulse-flash";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TempoIndicador } from "@/components/crm/tempo-indicador";
import { formatBRL, iniciais } from "@/components/crm/crm-shared";
import type { Lead } from "@/types";

// Card-instrumento do kanban: borda esquerda 2px = temperatura,
// score em anel + número mono, badge textual (cor nunca sozinha).

export type LeadKanban = Lead & {
  fonte_raw?: string;
  updated_at?: string;
  vendedor?: { id: string; nome: string; avatar_url: string | null } | null;
  handoff_em?: string;
  primeira_resposta_vendedor_em?: string;
  tempo_primeira_resposta_segundos?: number;
};

function TemperaturaBadge({ temperatura }: { temperatura: Temperatura }) {
  const cor = corPorTemperatura(temperatura);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-bg-secondary px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
      <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: cor }} aria-hidden />
      {TEMPERATURA_LABEL[temperatura]}
    </span>
  );
}

export function LeadCard({ lead, dragging }: { lead: LeadKanban; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  const showTempo = lead.status === "qualificado" || lead.status === "negociacao";
  const tempCor = corPorTemperatura(lead.temperatura);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "rounded-md border border-border border-l-2 bg-bg-tertiary cursor-grab active:cursor-grabbing transition-all",
        dragging && "shadow-lg rotate-2",
        !dragging && "hover:-translate-y-0.5 hover:border-border-strong",
        isDragging && "opacity-30",
      )}
      style={{ borderLeftColor: tempCor }}
    >
      <PulseFlash pulseKey={lead.updated_at ?? `${lead.status}-${lead.score}`} className="rounded-md p-3">
        <Link
          to="/crm/$id"
          params={{ id: lead.id }}
          onClick={(e) => isDragging && e.preventDefault()}
          className="block space-y-2"
          aria-label={`Abrir lead ${lead.razao_social}`}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="min-w-0 flex-1 truncate text-sm font-semibold leading-snug">{lead.razao_social}</h4>
            <span className="flex items-center gap-1 shrink-0">
              <ScoreRing score={lead.score} size={20} showValue={false} />
              <span className="font-mono tabular-nums text-xs font-semibold" style={{ color: tempCor }}>
                {lead.score}
              </span>
            </span>
          </div>

          {lead.cnpj && (
            <div className="text-[11px] font-mono tabular-nums text-muted-foreground">{lead.cnpj}</div>
          )}

          <div className="flex items-center justify-between gap-2">
            <TemperaturaBadge temperatura={lead.temperatura} />
            {lead.valor_estimado != null && (
              <span className="font-mono tabular-nums text-xs text-foreground">{formatBRL(lead.valor_estimado)}</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            {lead.vendedor ? (
              <span className="flex items-center gap-1.5 min-w-0">
                <Avatar className="size-5">
                  {lead.vendedor.avatar_url && <AvatarImage src={lead.vendedor.avatar_url} alt="" />}
                  <AvatarFallback className="text-[9px] bg-bg-secondary">{iniciais(lead.vendedor.nome)}</AvatarFallback>
                </Avatar>
                <span className="truncate text-[11px] text-muted-foreground">{lead.vendedor.nome}</span>
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">Sem vendedor</span>
            )}
            {showTempo && (
              <TempoIndicador
                handoffEm={lead.handoff_em ?? null}
                primeiraRespostaEm={lead.primeira_resposta_vendedor_em ?? null}
                tempoSegundos={lead.tempo_primeira_resposta_segundos ?? null}
              />
            )}
          </div>
        </Link>
      </PulseFlash>
    </div>
  );
}
