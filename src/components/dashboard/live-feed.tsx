import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { feed } from "@/lib/mock-data";
import { Radar, MessageSquare, ArrowRightLeft, DollarSign, AlertTriangle, MessageCircle } from "lucide-react";

const iconMap = {
  captacao: Radar,
  mensagem_ia: MessageSquare,
  resposta: MessageCircle,
  handoff: ArrowRightLeft,
  venda: DollarSign,
  alerta: AlertTriangle,
} as const;

const colorMap: Record<string, string> = {
  captacao: "text-info",
  mensagem_ia: "text-heaven-orange",
  resposta: "text-success",
  handoff: "text-heaven-orange-deep",
  venda: "text-success",
  alerta: "text-danger",
};

function parseMd(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**")
      ? <strong key={i} className="text-foreground font-semibold">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>,
  );
}

export function LiveFeed() {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg flex flex-col h-[420px]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-base font-semibold">Atividade ao vivo</h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
            <span className="relative rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="text-xs text-muted-foreground font-medium">Ao vivo</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
        {feed.map((e) => {
          const Icon = iconMap[e.tipo];
          return (
            <div key={e.id} className="flex gap-3 items-start text-sm">
              <span className="font-mono text-xs text-muted-foreground w-12 shrink-0 pt-0.5">
                {formatDistanceToNow(e.timestamp, { addSuffix: false, locale: ptBR }).replace("cerca de ", "")}
              </span>
              <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${colorMap[e.tipo]}`} />
              <div className="text-muted-foreground leading-snug">{parseMd(e.texto)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
