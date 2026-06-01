import { useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Phone, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { statusLabels, fonteLabels, fonteCores } from "@/lib/mock-data";
import type { Lead, LeadStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLeads, useVendedores, useUpdateLeadStatus, useLeadsRealtime } from "@/hooks/use-crm-data";
import { mapLeadFromDb } from "@/lib/db-mappers";
import { TempoIndicador } from "@/components/crm/tempo-indicador";

export const Route = createFileRoute("/_app/crm")({
  component: CrmPage,
});

const colunas: LeadStatus[] = ["bruto", "abordado", "respondeu", "qualificado", "negociacao", "ganho"];

function CrmPage() {
  useLeadsRealtime();
  const { data: leadsRaw = [] } = useLeads();
  const { data: vendedoresData = [] } = useVendedores();
  const updateStatus = useUpdateLeadStatus();

  const leads = useMemo(() => (leadsRaw as any[]).map(mapLeadFromDb), [leadsRaw]);
  const vendedores = vendedoresData as any[];

  const [activeId, setActiveId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [vendedorF, setVendedorF] = useState("all");
  const [fonteF, setFonteF] = useState("all");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const isMobile = useIsMobile();

  const filtered = useMemo(
    () => leads.filter((l) => {
      if (busca && !l.razao_social.toLowerCase().includes(busca.toLowerCase()) && !l.cnpj.includes(busca)) return false;
      if (vendedorF !== "all" && l.vendedor_id !== vendedorF) return false;
      if (fonteF !== "all" && l.fonte !== fonteF) return false;
      return true;
    }),
    [leads, busca, vendedorF, fonteF],
  );

  const byCol = useMemo(() => {
    const map: Record<LeadStatus, Lead[]> = { bruto: [], abordado: [], respondeu: [], qualificado: [], negociacao: [], ganho: [], perdido: [] };
    filtered.forEach((l) => { (map[l.status] ??= []).push(l); });
    return map;
  }, [filtered]);

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const overId = e.over?.id;
    if (!overId) return;
    const novoStatus = String(overId) as LeadStatus;
    const id = String(e.active.id);
    updateStatus.mutate({ id, status: novoStatus });
    toast.success(`Lead movido para ${statusLabels[novoStatus]}`);
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline comercial</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} leads ativos</p>
        </div>
        <button
          onClick={() => toast.success("Novo lead criado")}
          className="h-10 px-4 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground font-medium text-sm flex items-center gap-2 glow-orange transition-all"
        >
          <Plus className="h-4 w-4" /> Novo lead manual
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar lead..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Select value={vendedorF} onValueChange={setVendedorF}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Vendedor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos vendedores</SelectItem>
            {vendedores.map((v) => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fonteF} onValueChange={setFonteF}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Fonte" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as fontes</SelectItem>
            <SelectItem value="google_maps">Google Maps</SelectItem>
            <SelectItem value="receita_federal">Receita Federal</SelectItem>
            <SelectItem value="indicacao">Indicação</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className={cn("flex-1 pb-3", isMobile ? "overflow-y-auto" : "overflow-x-auto")}>
          <div className={cn(isMobile ? "flex flex-col gap-3" : "flex gap-4 min-w-max")}>
            {colunas.map((col) => (
              <Coluna key={col} status={col} leads={byCol[col] ?? []} mobile={isMobile} />
            ))}
          </div>
        </div>
        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} dragging /> : null}
        </DragOverlay>
      </DndContext>

      <Outlet />
    </div>
  );
}

function Coluna({ status, leads, mobile = false }: { status: LeadStatus; leads: Lead[]; mobile?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const total = leads.reduce((s, l) => s + (l.valor_estimado ?? 0), 0);
  const [open, setOpen] = useState(true);
  const showBody = !mobile || open;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg bg-bg-secondary border",
        mobile ? "w-full" : "w-[300px]",
        isOver ? "border-heaven-orange" : "border-border",
      )}
    >
      <div className="border-t-2 rounded-t-lg" style={{ borderColor: getColColor(status) }} />
      <button
        type="button"
        onClick={() => mobile && setOpen((v) => !v)}
        className={cn("px-4 py-3 border-b border-border text-left", mobile ? "cursor-pointer" : "cursor-default")}
      >
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {mobile && (open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />)}
            <h3 className="text-sm font-semibold truncate">{statusLabels[status]}</h3>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-bg-tertiary shrink-0">{leads.length}</span>
        </div>
        <div className="text-xs font-mono text-muted-foreground mt-1">R$ {total.toLocaleString("pt-BR")}</div>
      </button>
      {showBody && (
        <div className={cn("flex-1 p-3 space-y-2", mobile ? "min-h-[80px]" : "min-h-[200px] overflow-y-auto max-h-[calc(100vh-340px)]")}>
          {leads.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8">
              <div className="opacity-50 mb-2">∅</div>
              Sem leads nessa etapa ainda
            </div>
          ) : leads.map((l) => <LeadCard key={l.id} lead={l} />)}
        </div>
      )}
    </div>
  );
}

function getColColor(s: LeadStatus): string {
  const map: Record<LeadStatus, string> = {
    bruto: "#595954", abordado: "#FFA94D", respondeu: "#F27F1B",
    qualificado: "#D9560B", negociacao: "#3B82F6", ganho: "#22C55E", perdido: "#EF4444",
  };
  return map[s];
}

function LeadCard({ lead, dragging }: { lead: Lead & { handoff_em?: string; primeira_resposta_vendedor_em?: string; tempo_primeira_resposta_segundos?: number }; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });

  const tempBorder = lead.temperatura === "quente" ? "border-l-heaven-orange" : lead.temperatura === "morno" ? "border-l-yellow-500" : "border-l-heaven-gray";
  const scoreCor = lead.score > 80 ? "bg-heaven-orange/20 text-heaven-orange glow-orange" : lead.score > 50 ? "bg-yellow-500/20 text-yellow-500" : "bg-bg-tertiary text-muted-foreground";
  const showTempo = lead.status === "qualificado" || lead.status === "negociacao";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "bg-bg-tertiary border border-border border-l-[3px] rounded-md p-3 cursor-grab active:cursor-grabbing transition-all",
        tempBorder,
        !dragging && "hover:-translate-y-0.5 hover:glow-orange hover:border-border-strong",
        isDragging && "opacity-30",
      )}
    >
      <Link to="/crm/$id" params={{ id: lead.id }} onClick={(e) => isDragging && e.preventDefault()} className="block space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold leading-snug line-clamp-2">{lead.razao_social}</h4>
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0", scoreCor)}>{lead.score}</span>
        </div>
        <div className="text-[11px] font-mono text-muted-foreground">{lead.cnpj}</div>
        <div className="text-xs text-muted-foreground">
          <div className="truncate">{lead.decisor.nome}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <Phone className="h-3 w-3" />
            <span className="font-mono">{lead.decisor.telefone}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 gap-2">
          <span className={cn("text-[10px] px-2 py-0.5 rounded-sm border shrink-0", fonteCores[lead.fonte])}>{fonteLabels[lead.fonte]}</span>
          {showTempo && (
            <TempoIndicador
              handoffEm={lead.handoff_em ?? null}
              primeiraRespostaEm={lead.primeira_resposta_vendedor_em ?? null}
              tempoSegundos={lead.tempo_primeira_resposta_segundos ?? null}
            />
          )}
        </div>
      </Link>
    </div>
  );
}
