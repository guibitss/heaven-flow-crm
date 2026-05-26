import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLiveFeed } from "@/hooks/use-crm-data";
import { Radar, MessageSquare, ArrowRightLeft, DollarSign, AlertTriangle, MessageCircle, Timer } from "lucide-react";

const iconMap: Record<string, any> = {
  captacao: Radar,
  mensagem_ia: MessageSquare,
  resposta_lead: MessageCircle,
  handoff: ArrowRightLeft,
  primeira_resposta_vendedor: Timer,
  venda: DollarSign,
  alerta: AlertTriangle,
  status_change: ArrowRightLeft,
};

const colorMap: Record<string, string> = {
  captacao: "text-info",
  mensagem_ia: "text-heaven-orange",
  resposta_lead: "text-success",
  handoff: "text-heaven-orange-deep",
  primeira_resposta_vendedor: "text-success",
  venda: "text-success",
  alerta: "text-danger",
  status_change: "text-muted-foreground",
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
  const eventos = useLiveFeed();

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
        {eventos.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Sem eventos ainda</div>
        ) : eventos.map((e) => {
          const Icon = iconMap[e.tipo] ?? MessageCircle;
          return (
            <div key={e.id} className="flex gap-3 items-start text-sm">
              <span className="font-mono text-xs text-muted-foreground w-12 shrink-0 pt-0.5">
                {formatDistanceToNow(new Date(e.created_at), { addSuffix: false, locale: ptBR }).replace("cerca de ", "")}
              </span>
              <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${colorMap[e.tipo] ?? "text-muted-foreground"}`} />
              <div className="text-muted-foreground leading-snug">{parseMd(e.texto)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
