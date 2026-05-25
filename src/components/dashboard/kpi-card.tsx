import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  icon: LucideIcon;
}

export function KpiCard({ label, value, delta, positive, icon: Icon }: Props) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-5 hover:border-border-strong transition-all hover:-translate-y-0.5 hover:glow-orange">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(242,127,27,0.12)" }}>
          <Icon className="h-5 w-5 text-heaven-orange" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="label-xs">{label}</div>
          <div className="font-mono text-4xl font-bold mt-1 leading-none truncate">{value}</div>
          <div className={cn("text-xs mt-2 flex items-center gap-1 font-medium", positive ? "text-success" : "text-danger")}>
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta}
          </div>
        </div>
      </div>
    </div>
  );
}
