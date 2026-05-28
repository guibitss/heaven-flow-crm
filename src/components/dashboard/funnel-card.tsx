import { FunnelChart, Funnel, LabelList, ResponsiveContainer, Tooltip } from "recharts";
import { useFunil } from "@/hooks/use-crm-data";

const STATUS_META: Record<string, { name: string; fill: string }> = {
  bruto: { name: "Lead bruto", fill: "#3B1B05" },
  abordado: { name: "Abordado", fill: "#5C2C09" },
  respondeu: { name: "Respondeu", fill: "#A63005" },
  qualificado: { name: "Qualificado", fill: "#D9560B" },
  negociacao: { name: "Negociação", fill: "#F27F1B" },
  ganho: { name: "Ganho", fill: "#FFA94D" },
};
const ORDER = ["bruto", "abordado", "respondeu", "qualificado", "negociacao", "ganho"];

export function FunnelCard() {
  const { data: raw, isLoading } = useFunil(30);
  const map = new Map<string, number>(((raw as any[]) ?? []).map((r) => [r.status, Number(r.total)]));
  const data = ORDER.map((s) => ({ ...STATUS_META[s], value: map.get(s) ?? 0 }));
  const hasData = data.some((d) => d.value > 0);

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-5 h-full">
      <h3 className="text-base font-semibold mb-1">Funil de conversão</h3>
      <p className="text-xs text-muted-foreground mb-4">Últimos 30 dias</p>
      <div className="h-[320px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Carregando...</div>
        ) : !hasData ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados no período</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip
                contentStyle={{ background: "#161616", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, fontSize: 12 }}
              />
              <Funnel dataKey="value" data={data} isAnimationActive>
                <LabelList position="right" fill="#fff" stroke="none" dataKey="name" fontSize={12} />
                <LabelList position="center" fill="#fff" stroke="none" dataKey="value" fontSize={14} fontWeight={600} />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
