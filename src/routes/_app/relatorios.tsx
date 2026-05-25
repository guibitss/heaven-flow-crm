import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { relatorios } from "@/lib/mock-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/relatorios")({
  component: RelatoriosPage,
});

function RelatoriosPage() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">Exportações e histórico</p>
      </div>

      <div className="bg-bg-secondary border border-border rounded-lg p-6 flex items-center justify-between glow-orange">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-lg bg-heaven-orange/15 flex items-center justify-center">
            <FileText className="h-7 w-7 text-heaven-orange" />
          </div>
          <div>
            <div className="text-xl font-semibold">Relatório de Novembro 2025</div>
            <div className="text-sm text-muted-foreground">Funil completo, performance por vendedor, ROI por fonte</div>
          </div>
        </div>
        <button onClick={() => toast.success("PDF sendo gerado...")} className="h-11 px-5 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground font-medium flex items-center gap-2 glow-orange">
          <Download className="h-4 w-4" /> Gerar PDF
        </button>
      </div>

      <div className="bg-bg-secondary border border-border rounded-lg p-5">
        <h3 className="text-base font-semibold mb-4">Histórico</h3>
        <table className="w-full text-sm">
          <thead className="text-xs label-xs">
            <tr><th className="text-left pb-3">Período</th><th className="text-left pb-3">Gerado em</th><th className="text-left pb-3">Tamanho</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {relatorios.map((r) => (
              <tr key={r.id}>
                <td className="py-3">{r.periodo}</td>
                <td className="py-3 font-mono text-xs text-muted-foreground">{format(r.gerado_em, "dd/MM/yyyy")}</td>
                <td className="py-3 font-mono text-xs">{r.tamanho}</td>
                <td className="py-3 text-right">
                  <button className="text-muted-foreground hover:text-foreground"><Download className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
