import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/relatorios")({
  component: RelatoriosPage,
});

// Estrutura prevista para o relatório PDF (consumida pela futura Edge Function
// `gerar-relatorio-pdf`). Mantida aqui como contrato de referência.
export type RelatorioPayload = {
  periodo: { inicio: string; fim: string };
  kpis: Record<string, number | null>;
  resumo_executivo: string;
  ranking_vendedores: Array<{ vendedor_id: string; nome: string; total: number }>;
  leads_captados: number;
  conversoes: number;
  tempo_medio_resposta_segundos: number | null;
  insights_ia: string[];
};

function RelatoriosPage() {
  const qc = useQueryClient();

  const { data: historico, isLoading } = useQuery({
    queryKey: ["relatorios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("relatorios")
        .select("*")
        .order("gerado_em", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const gerar = useMutation({
    mutationFn: async () => {
      // Stub: registra a solicitação no feed; a geração real será feita por
      // uma futura Edge Function `gerar-relatorio-pdf` (Claude + Puppeteer).
      const hoje = new Date();
      const inicio = new Date(hoje);
      inicio.setDate(hoje.getDate() - 30);
      const { error } = await supabase.from("eventos_feed").insert({
        tipo: "captacao",
        texto: `Relatório solicitado para ${format(inicio, "dd/MM")} – ${format(hoje, "dd/MM")} (geração em fila)`,
        metadata: {
          acao: "gerar_relatorio_pdf",
          periodo_inicio: inicio.toISOString(),
          periodo_fim: hoje.toISOString(),
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["relatorios"] });
      toast.success("Geração de relatório enfileirada");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao solicitar relatório"),
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">Exportações e histórico</p>
      </div>

      <div className="bg-bg-secondary border border-border rounded-lg p-6 flex items-center justify-between glow-orange flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-lg bg-heaven-orange/15 flex items-center justify-center">
            <FileText className="h-7 w-7 text-heaven-orange" />
          </div>
          <div>
            <div className="text-xl font-semibold">Relatório executivo — últimos 30 dias</div>
            <div className="text-sm text-muted-foreground">
              KPIs, ranking, conversões, tempo de resposta e insights de IA
            </div>
          </div>
        </div>
        <button
          onClick={() => gerar.mutate()}
          disabled={gerar.isPending}
          className="h-11 px-5 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground font-medium flex items-center gap-2 glow-orange"
        >
          {gerar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Gerar agora
        </button>
      </div>

      <div className="bg-bg-secondary border border-border rounded-lg p-5">
        <h3 className="text-base font-semibold mb-4">Histórico</h3>
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Carregando…</div>
        ) : !historico || historico.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Nenhum relatório gerado ainda. Clique em "Gerar agora" para criar o primeiro.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs label-xs">
              <tr>
                <th className="text-left pb-3">Período</th>
                <th className="text-left pb-3">Gerado em</th>
                <th className="text-left pb-3">Tamanho</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {historico.map((r: any) => (
                <tr key={r.id}>
                  <td className="py-3 font-mono text-xs">
                    {format(new Date(r.periodo_inicio), "dd/MM/yyyy")} – {format(new Date(r.periodo_fim), "dd/MM/yyyy")}
                  </td>
                  <td className="py-3 font-mono text-xs text-muted-foreground">
                    {r.gerado_em ? format(new Date(r.gerado_em), "dd/MM/yyyy HH:mm") : "—"}
                  </td>
                  <td className="py-3 font-mono text-xs">
                    {r.tamanho_bytes ? `${(Number(r.tamanho_bytes) / 1024 / 1024).toFixed(1)} MB` : "—"}
                  </td>
                  <td className="py-3 text-right">
                    {r.url_pdf ? (
                      <a href={r.url_pdf} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground inline-flex">
                        <Download className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">em fila</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-bg-secondary border border-border rounded-lg p-5">
        <h3 className="text-base font-semibold mb-4">Exportar dados</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Select defaultValue="30d"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="30d">Últimos 30 dias</SelectItem><SelectItem value="90d">90 dias</SelectItem></SelectContent></Select>
          <Select defaultValue="all"><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos status</SelectItem><SelectItem value="qualificado">Qualificado</SelectItem></SelectContent></Select>
          <Select defaultValue="all"><SelectTrigger><SelectValue placeholder="Vendedor" /></SelectTrigger><SelectContent><SelectItem value="all">Todos vendedores</SelectItem></SelectContent></Select>
          <Select defaultValue="all"><SelectTrigger><SelectValue placeholder="Fonte" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as fontes</SelectItem></SelectContent></Select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toast.success("Exportando CSV...")} className="h-10 px-4 rounded-md bg-bg-tertiary hover:bg-bg-tertiary/70 text-sm">Export CSV</button>
          <button onClick={() => toast.success("Exportando Excel...")} className="h-10 px-4 rounded-md bg-bg-tertiary hover:bg-bg-tertiary/70 text-sm">Export Excel</button>
        </div>
      </div>
    </div>
  );
}
