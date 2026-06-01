import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/lgpd")({
  component: LgpdPage,
});

const tipoLabels: Record<string, string> = {
  acesso: "Acesso aos dados",
  exclusao: "Exclusão",
  retificacao: "Retificação",
  portabilidade: "Portabilidade",
  oposicao: "Oposição",
};

const statusStyles: Record<string, string> = {
  pendente: "bg-yellow-500/15 text-yellow-500 border-yellow-500/40",
  em_andamento: "bg-info/15 text-info border-info/40",
  resolvida: "bg-success/15 text-success border-success/40",
  recusada: "bg-danger/15 text-danger border-danger/40",
};

function LgpdPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["lgpd_solicitacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lgpd_solicitacoes")
        .select("*")
        .order("solicitada_em", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-heaven-orange/15 flex items-center justify-center">
          <Shield className="h-5 w-5 text-heaven-orange" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LGPD</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Solicitações de titulares e gestão de consentimentos
          </p>
        </div>
      </div>

      <div className="bg-bg-secondary border border-border rounded-lg p-5">
        <h3 className="text-base font-semibold mb-4">Solicitações</h3>
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Carregando…</div>
        ) : !data || data.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Nenhuma solicitação registrada.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs label-xs">
              <tr>
                <th className="text-left pb-3">Data</th>
                <th className="text-left pb-3">Tipo</th>
                <th className="text-left pb-3">Titular</th>
                <th className="text-left pb-3">Documento</th>
                <th className="text-left pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((s: any) => (
                <tr key={s.id}>
                  <td className="py-3 font-mono text-xs text-muted-foreground">
                    {format(new Date(s.solicitada_em), "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="py-3">{tipoLabels[s.tipo] ?? s.tipo}</td>
                  <td className="py-3">{s.titular_email}</td>
                  <td className="py-3 font-mono text-xs text-muted-foreground">
                    {s.titular_documento ?? "—"}
                  </td>
                  <td className="py-3">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded border",
                        statusStyles[s.status] ?? "bg-bg-tertiary border-border",
                      )}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
