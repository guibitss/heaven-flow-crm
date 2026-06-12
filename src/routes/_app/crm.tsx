import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLeads, useVendedores, useUpdateLeadStatus, useLeadsRealtime } from "@/hooks/use-crm-data";
import { mapLeadFromDb } from "@/lib/db-mappers";
import {
  PIPELINE_ORDER, STATUS_LABEL, STATUS_HEAT, TEMPERATURA_LABEL, corPorTemperatura,
  type LeadStatus, type Temperatura,
} from "@/lib/heat";
import { KanbanColumn } from "@/components/crm/kanban-column";
import { LeadCard, type LeadKanban } from "@/components/crm/lead-card";
import { NovoLeadDialog } from "@/components/crm/novo-lead-dialog";
import { PerdidoZone, MotivoPerdaDialog } from "@/components/crm/perdido-zone";

const STATUS_VALIDOS: LeadStatus[] = [...PIPELINE_ORDER, "perdido"];

type CrmSearch = { status?: LeadStatus };

export const Route = createFileRoute("/_app/crm")({
  validateSearch: (search: Record<string, unknown>): CrmSearch => {
    const s = search.status;
    return STATUS_VALIDOS.includes(s as LeadStatus) ? { status: s as LeadStatus } : {};
  },
  component: CrmPage,
});

type TempFiltro = "all" | Temperatura;

function CrmPage() {
  useLeadsRealtime();
  const { data: leadsRaw = [] } = useLeads();
  const { data: vendedoresData = [] } = useVendedores();
  const updateStatus = useUpdateLeadStatus();
  const navigate = useNavigate({ from: Route.fullPath });
  const { status: statusParam } = Route.useSearch();

  const vendedores = vendedoresData as { id: string; nome: string }[];

  const [activeId, setActiveId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [tempF, setTempF] = useState<TempFiltro>("all");
  const [vendedorF, setVendedorF] = useState("all");
  const [novoOpen, setNovoOpen] = useState(false);
  const [leadPerdido, setLeadPerdido] = useState<{ id: string; razao_social: string } | null>(null);
  // Optimistic: status local enquanto a mutation roda (rollback = remover override).
  const [overrides, setOverrides] = useState<Record<string, LeadStatus>>({});

  const leads = useMemo(
    () => (leadsRaw as unknown[]).map(mapLeadFromDb).map((l) => {
      const ov = overrides[l.id];
      return (ov ? { ...l, status: ov } : l) as LeadKanban;
    }),
    [leadsRaw, overrides],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const isMobile = useIsMobile();

  const filtered = useMemo(
    () => leads.filter((l) => {
      if (busca && !l.razao_social.toLowerCase().includes(busca.toLowerCase()) && !(l.cnpj ?? "").includes(busca)) return false;
      if (tempF !== "all" && l.temperatura !== tempF) return false;
      if (vendedorF !== "all" && l.vendedor_id !== vendedorF) return false;
      return true;
    }),
    [leads, busca, tempF, vendedorF],
  );

  const byCol = useMemo(() => {
    const map = Object.fromEntries(STATUS_VALIDOS.map((s) => [s, [] as LeadKanban[]])) as Record<LeadStatus, LeadKanban[]>;
    filtered.forEach((l) => { (map[l.status] ??= []).push(l); });
    return map;
  }, [filtered]);

  const totalPipeline = PIPELINE_ORDER.reduce((s, c) => s + (byCol[c]?.length ?? 0), 0);
  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  // ?status=… → scrolla até a coluna destacada (uma vez por mudança do param)
  const colRefs = useRef<Partial<Record<LeadStatus, HTMLDivElement | null>>>({});
  useEffect(() => {
    if (statusParam && colRefs.current[statusParam]) {
      colRefs.current[statusParam]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [statusParam]);

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const overId = e.over?.id;
    if (!overId) return;
    const novoStatus = String(overId) as LeadStatus;
    const id = String(e.active.id);
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === novoStatus) return;

    if (novoStatus === "perdido") {
      setLeadPerdido({ id, razao_social: lead.razao_social });
      return;
    }

    setOverrides((prev) => ({ ...prev, [id]: novoStatus }));
    updateStatus.mutate(
      { id, status: novoStatus },
      {
        onSettled: () => {
          // sucesso: refetch confirma; erro: remover override = rollback visual
          setOverrides((prev) => {
            const { [id]: _removed, ...rest } = prev;
            return rest;
          });
        },
      },
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline comercial</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-mono tabular-nums">{filtered.length}</span> leads no funil
          </p>
        </div>
        <button
          onClick={() => setNovoOpen(true)}
          className="h-10 px-4 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground font-medium text-sm flex items-center gap-2 glow-orange transition-all"
        >
          <Plus className="h-4 w-4" aria-hidden /> Novo lead manual
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input className="pl-9" placeholder="Buscar por razão social ou CNPJ…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>

        {/* Chips de temperatura — dot + texto (cor nunca sozinha) */}
        <div className="flex items-center gap-1.5" role="group" aria-label="Filtrar por temperatura">
          <Chip active={tempF === "all"} onClick={() => setTempF("all")}>Todos</Chip>
          {(["quente", "morno", "frio"] as Temperatura[]).map((t) => (
            <Chip key={t} active={tempF === t} onClick={() => setTempF(tempF === t ? "all" : t)}>
              <span className="size-1.5 rounded-full" style={{ backgroundColor: corPorTemperatura(t) }} aria-hidden />
              {TEMPERATURA_LABEL[t]}
            </Chip>
          ))}
        </div>

        <Select value={vendedorF} onValueChange={setVendedorF}>
          <SelectTrigger className="w-[180px]" aria-label="Filtrar por vendedor"><SelectValue placeholder="Vendedor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos vendedores</SelectItem>
            {vendedores.map((v) => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
          </SelectContent>
        </Select>

        {statusParam && (
          <button
            onClick={() => navigate({ search: {} })}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full border border-heaven-orange bg-heaven-orange/10 text-xs font-medium text-heaven-orange"
            aria-label={`Remover filtro de etapa ${STATUS_LABEL[statusParam]}`}
          >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: STATUS_HEAT[statusParam] }} aria-hidden />
            Etapa: {STATUS_LABEL[statusParam]}
            <X className="h-3 w-3" aria-hidden />
          </button>
        )}
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className={cn("flex-1 pb-1", isMobile ? "overflow-y-auto" : "overflow-x-auto")}>
          <div className={cn(isMobile ? "flex flex-col gap-3" : "flex gap-4 min-w-max")}>
            {PIPELINE_ORDER.map((col) => (
              <KanbanColumn
                key={col}
                status={col}
                leads={byCol[col] ?? []}
                totalBoard={totalPipeline}
                mobile={isMobile}
                highlighted={statusParam === col}
                dimmed={!!statusParam && statusParam !== col}
                columnRef={(el) => { colRefs.current[col] = el; }}
              />
            ))}
          </div>
        </div>

        <PerdidoZone count={byCol.perdido?.length ?? 0} dragging={!!activeId} />

        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} dragging /> : null}
        </DragOverlay>
      </DndContext>

      <NovoLeadDialog open={novoOpen} onOpenChange={setNovoOpen} />
      <MotivoPerdaDialog lead={leadPerdido} onClose={() => setLeadPerdido(null)} />

      <Outlet />
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-medium transition-colors",
        active
          ? "border-heaven-orange bg-heaven-orange/10 text-heaven-orange"
          : "border-border bg-bg-secondary text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
