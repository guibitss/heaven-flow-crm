import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { ChevronDown, ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_HEAT, STATUS_LABEL, type LeadStatus } from "@/lib/heat";
import { EmptyState } from "@/components/common/empty-state";
import { LeadCard, type LeadKanban } from "@/components/crm/lead-card";
import { formatBRLCompact } from "@/components/crm/crm-shared";

// Coluna do kanban: header com dot térmico do estágio, contagem mono,
// soma de valor estimado e LoadBar de 2px (% do total de leads do board).

interface ColunaProps {
  status: LeadStatus;
  leads: LeadKanban[];
  totalBoard: number;
  mobile?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
  columnRef?: (el: HTMLDivElement | null) => void;
}

export function KanbanColumn({ status, leads, totalBoard, mobile = false, highlighted = false, dimmed = false, columnRef }: ColunaProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const valorTotal = leads.reduce((s, l) => s + (l.valor_estimado ?? 0), 0);
  const [open, setOpen] = useState(true);
  const showBody = !mobile || open;
  const cor = STATUS_HEAT[status];
  const pct = totalBoard > 0 ? Math.round((leads.length / totalBoard) * 100) : 0;

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        columnRef?.(el);
      }}
      className={cn(
        "flex flex-col rounded-lg border bg-bg-secondary hairline-top transition-all",
        mobile ? "w-full" : "w-[300px]",
        isOver ? "border-heaven-orange bg-heaven-orange/[0.04]" : "border-border",
        highlighted && "border-heaven-orange",
        dimmed && "opacity-40",
      )}
    >
      <button
        type="button"
        onClick={() => mobile && setOpen((v) => !v)}
        className={cn("relative px-4 py-3 border-b border-border text-left", mobile ? "cursor-pointer" : "cursor-default")}
        aria-expanded={mobile ? open : undefined}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 min-w-0">
            {mobile && (open ? <ChevronDown className="h-4 w-4 shrink-0" aria-hidden /> : <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />)}
            <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: cor }} aria-hidden />
            <span className="label-xs truncate">{STATUS_LABEL[status]}</span>
            <span className="font-mono tabular-nums text-xs text-foreground shrink-0">{leads.length}</span>
          </span>
          <span className="font-mono tabular-nums text-xs text-muted-foreground shrink-0">
            {valorTotal > 0 ? formatBRLCompact(valorTotal) : "—"}
          </span>
        </span>
        {/* LoadBar — carga relativa do estágio (2px) */}
        <span className="absolute inset-x-0 bottom-0 block h-0.5 bg-transparent" aria-hidden>
          <span
            className="block h-full transition-all duration-300"
            style={{ width: `${pct}%`, backgroundColor: cor }}
          />
        </span>
      </button>

      {showBody && (
        <div className={cn("flex-1 p-3 space-y-2", mobile ? "min-h-[80px]" : "min-h-[200px] overflow-y-auto max-h-[calc(100vh-360px)]")}>
          {leads.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Sem leads nesta etapa"
              className="px-4 py-8 gap-1 border-0"
            />
          ) : (
            leads.map((l) => <LeadCard key={l.id} lead={l} />)
          )}
        </div>
      )}
    </div>
  );
}
