import { FunnelChart, Funnel, LabelList, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Lead bruto", value: 342, fill: "#3B1B05" },
  { name: "Abordado", value: 312, fill: "#5C2C09" },
  { name: "Respondeu", value: 73, fill: "#A63005" },
  { name: "Qualificado", value: 30, fill: "#D9560B" },
  { name: "Negociação", value: 18, fill: "#F27F1B" },
  { name: "Ganho", value: 8, fill: "#FFA94D" },
];

export function FunnelCard() {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-5 h-full">
      <h3 className="text-base font-semibold mb-1">Funil de conversão</h3>
      <p className="text-xs text-muted-foreground mb-4">Últimos 30 dias</p>
      <div className="h-[320px]">
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
      </div>
    </div>
  );
}
