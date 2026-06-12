import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useVendedores } from "@/hooks/use-crm-data";
import { STATUS_LABEL, STATUS_HEAT, corPorTemperatura, TEMPERATURA_LABEL, type LeadStatus, type Temperatura } from "@/lib/heat";
import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/relatorios")({
  component: RelatoriosPage,
});

const STATUS_OPTIONS = Object.keys(STATUS_LABEL) as LeadStatus[];

type Filtros = { periodo: string; vendedorId: string; status: string };

function cutoffIso(periodoDias: string): string {
  const d = new Date();
  d.setDate(d.getDate() - parseInt(periodoDias, 10));
  return d.toISOString();
}

async function buscarLeads(filtros: Filtros, limit?: number) {
  let q = supabase
    .from("leads")
    .select(
      "id, razao_social, cnpj, endereco_cidade, endereco_uf, telefone, decisor_nome, porte, status, score, temperatura, fonte, valor_estimado, criado_em, vendedor:profiles(id,nome)",
    )
    .gte("criado_em", cutoffIso(filtros.periodo))
    .order("criado_em", { ascending: false });
  if (filtros.vendedorId !== "all") q = q.eq("vendedor_id", filtros.vendedorId);
  if (filtros.status !== "all") q = q.eq("status", filtros.status as LeadStatus);
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

// Campo CSV genérico: aspas duplas escapadas, separador ;
function csvCampo(v: unknown): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

// CNPJ/telefone como texto (evita o Excel converter para número/notação científica)
function csvTexto(v: unknown): string {
  const s = String(v ?? "").replace(/"/g, "");
  return s ? `"=""${s}"""` : '""';
}

function gerarCsv(linhas: any[]): string {
  const header = [
    "Razão Social",
    "CNPJ",
    "Cidade",
    "UF",
    "Telefone",
    "Decisor",
    "Porte",
    "Status",
    "Score",
    "Temperatura",
    "Fonte",
    "Valor Estimado",
    "Vendedor",
    "Criado em",
  ].join(";");
  const rows = linhas.map((l) =>
    [
      csvCampo(l.razao_social),
      csvTexto(l.cnpj),
      csvCampo(l.endereco_cidade),
      csvCampo(l.endereco_uf),
      csvTexto(l.telefone),
      csvCampo(l.decisor_nome),
      csvCampo(l.porte),
      csvCampo(STATUS_LABEL[l.status as LeadStatus] ?? l.status),
      csvCampo(l.score),
      csvCampo(l.temperatura ? TEMPERATURA_LABEL[l.temperatura as Temperatura] : ""),
      csvCampo(l.fonte),
      csvCampo(l.valor_estimado != null ? String(Number(l.valor_estimado)).replace(".", ",") : ""),
      csvCampo(l.vendedor?.nome ?? ""),
      csvCampo(l.criado_em ? format(new Date(l.criado_em), "dd/MM/yyyy HH:mm") : ""),
    ].join(";"),
  );
  return [header, ...rows].join("\r\n");
}

function RelatoriosPage() {
  const [filtros, setFiltros] = useState<Filtros>({ periodo: "30", vendedorId: "all", status: "all" });
  const [exportando, setExportando] = useState(false);
  const { data: vendedores = [] } = useVendedores();

  const { data: previa = [], isLoading: loadingPrevia } = useQuery({
    queryKey: ["relatorio-previa", filtros.periodo, filtros.vendedorId, filtros.status],
    queryFn: () => buscarLeads(filtros, 20),
  });

  const exportarCsv = async () => {
    setExportando(true);
    try {
      const linhas = await buscarLeads(filtros);
      if (linhas.length === 0) {
        toast.info("Nenhum lead encontrado para os filtros selecionados");
        return;
      }
      const csv = gerarCsv(linhas as any[]);
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `heaven-leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${linhas.length} lead${linhas.length > 1 ? "s" : ""} exportado${linhas.length > 1 ? "s" : ""} em CSV`);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao exportar CSV");
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">Exportação de dados do funil</p>
      </div>

      <div className="bg-bg-secondary energized-top border border-border rounded-lg p-5">
        <h3 className="label-xs mb-4">Exportar leads (CSV)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="label-xs block mb-1.5">Período</label>
            <Select value={filtros.periodo} onValueChange={(v) => setFiltros((f) => ({ ...f, periodo: v }))}>
              <SelectTrigger aria-label="Período">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label-xs block mb-1.5">Vendedor</label>
            <Select value={filtros.vendedorId} onValueChange={(v) => setFiltros((f) => ({ ...f, vendedorId: v }))}>
              <SelectTrigger aria-label="Vendedor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os vendedores</SelectItem>
                {(vendedores as any[]).map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="label-xs block mb-1.5">Status</label>
            <Select value={filtros.status} onValueChange={(v) => setFiltros((f) => ({ ...f, status: v }))}>
              <SelectTrigger aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <button
          type="button"
          onClick={exportarCsv}
          disabled={exportando}
          className="h-10 px-4 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground text-sm font-medium flex items-center gap-2 disabled:opacity-50 glow-orange"
        >
          {exportando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
          Exportar CSV
        </button>
      </div>

      <div className="bg-bg-secondary hairline-top border border-border rounded-lg p-5">
        <h3 className="label-xs mb-4">Prévia — primeiras 20 linhas</h3>
        {loadingPrevia ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full shimmer-heaven" />
            ))}
          </div>
        ) : previa.length === 0 ? (
          <EmptyState
            title="Nenhum lead nos filtros selecionados"
            description="Ajuste período, vendedor ou status para visualizar dados."
            className="py-10"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-3 pr-3 label-xs">Razão Social</th>
                  <th className="text-left pb-3 pr-3 label-xs">CNPJ</th>
                  <th className="text-left pb-3 pr-3 label-xs">Status</th>
                  <th className="text-right pb-3 pr-3 label-xs">Score</th>
                  <th className="text-left pb-3 pr-3 label-xs">Temperatura</th>
                  <th className="text-left pb-3 pr-3 label-xs">Vendedor</th>
                  <th className="text-left pb-3 label-xs">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(previa as any[]).map((l) => (
                  <tr key={l.id}>
                    <td className="py-2.5 pr-3 max-w-[260px] truncate">{l.razao_social}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-muted-foreground">{l.cnpj ?? "—"}</td>
                    <td className="py-2.5 pr-3">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ background: STATUS_HEAT[l.status as LeadStatus] }}
                          aria-hidden
                        />
                        {STATUS_LABEL[l.status as LeadStatus] ?? l.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono">{l.score ?? "—"}</td>
                    <td className="py-2.5 pr-3">
                      {l.temperatura ? (
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ background: corPorTemperatura(l.temperatura as Temperatura) }}
                            aria-hidden
                          />
                          {TEMPERATURA_LABEL[l.temperatura as Temperatura]}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-xs">{l.vendedor?.nome ?? "—"}</td>
                    <td className="py-2.5 font-mono text-xs text-muted-foreground">
                      {l.criado_em ? format(new Date(l.criado_em), "dd/MM/yyyy HH:mm") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-bg-secondary border border-border rounded-lg p-5">
        <h3 className="label-xs mb-4">Relatórios agendados</h3>
        <EmptyState
          icon={CalendarClock}
          title="Relatórios agendados em breve"
          description="A geração automática de relatórios executivos (PDF com KPIs e insights) ainda está em desenvolvimento."
          className="py-10"
        />
      </div>
    </div>
  );
}
