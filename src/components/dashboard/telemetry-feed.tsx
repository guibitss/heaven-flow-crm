import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "@tanstack/react-router";
import { useLiveFeed } from "@/hooks/use-crm-data";
import { PulseFlash } from "@/components/common/pulse-flash";
import { EmptyState } from "@/components/common/empty-state";
import { Activity } from "lucide-react";

// TelemetryFeed — feed realtime da sala de controle (eventos_feed via
// postgres_changes). Evento novo = um único PulseFlash de 600ms.

const DOT_COLOR: Record<string, string> = {
  captacao: "var(--heat-2)",
  mensagem_ia: "var(--heat-4)",
  resposta_lead: "var(--heat-5)",
  handoff: "var(--heat-3)",
  primeira_resposta_vendedor: "var(--success)",
  venda: "var(--success)",
  alerta: "var(--danger)",
  status_change: "var(--heat-1)",
};

const TIPO_LABEL: Record<string, string> = {
  captacao: "Captação",
  mensagem_ia: "IA",
  resposta_lead: "Resposta",
  handoff: "Handoff",
  primeira_resposta_vendedor: "Vendedor",
  venda: "Venda",
  alerta: "Alerta",
  status_change: "Status",
};

function parseMd(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

export function TelemetryFeed() {
  const eventos = useLiveFeed();
  const latestId = eventos[0]?.id ?? "none";

  return (
    <div className="flex h-[420px] flex-col rounded-lg border border-border bg-bg-secondary">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-base font-semibold">Telemetria</h3>
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-success" aria-hidden />
          <span className="label-xs">Tempo real</span>
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {eventos.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Nenhum evento ainda"
            description="A telemetria acende quando a captação e o agente entrarem em ação."
            className="m-3 border-0"
          />
        ) : (
          <ol className="space-y-0.5">
            {eventos.map((e, i) => {
              const row = (
                <div className="flex items-start gap-3 rounded-md px-3 py-2 text-sm">
                  <span className="w-12 shrink-0 pt-0.5 text-right font-mono text-xs text-muted-foreground">
                    {formatDistanceToNowStrict(new Date(e.created_at), { locale: ptBR })
                      .replace(" segundos", "s")
                      .replace(" segundo", "s")
                      .replace(" minutos", "min")
                      .replace(" minuto", "min")
                      .replace(" horas", "h")
                      .replace(" hora", "h")
                      .replace(" dias", "d")
                      .replace(" dia", "d")}
                  </span>
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={{ background: DOT_COLOR[e.tipo] ?? "var(--heat-1)" }}
                    aria-hidden
                  />
                  <div className="min-w-0 leading-snug text-muted-foreground">
                    <span className="label-xs mr-1.5">{TIPO_LABEL[e.tipo] ?? e.tipo}</span>
                    {e.lead_id ? (
                      <Link
                        to="/crm/$id"
                        params={{ id: e.lead_id }}
                        className="transition-colors hover:text-foreground"
                      >
                        {parseMd(e.texto)}
                      </Link>
                    ) : (
                      parseMd(e.texto)
                    )}
                  </div>
                </div>
              );
              return (
                <li key={e.id}>
                  {i === 0 ? (
                    <PulseFlash pulseKey={latestId} className="rounded-md">
                      {row}
                    </PulseFlash>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
