import { PIPELINE_ORDER, STATUS_HEAT, STATUS_LABEL, type LeadStatus } from "@/lib/heat";

// Progresso do pipeline em 6 segmentos térmicos — somente leitura.
// Segmentos preenchidos até o status atual; 'perdido' mostra tudo apagado.

export function PipelineProgress({ status }: { status: LeadStatus }) {
  const idx = PIPELINE_ORDER.indexOf(status);

  return (
    <div aria-label={`Etapa atual: ${STATUS_LABEL[status]}`}>
      <div className="flex gap-1">
        {PIPELINE_ORDER.map((s, i) => {
          const filled = idx >= 0 && i <= idx;
          return (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{ backgroundColor: filled ? STATUS_HEAT[s] : "rgba(255,255,255,0.08)" }}
              aria-hidden
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between">
        {PIPELINE_ORDER.map((s, i) => (
          <span
            key={s}
            className={`label-xs ${idx >= 0 && i === idx ? "text-foreground" : "text-muted-foreground/60"}`}
          >
            {STATUS_LABEL[s]}
          </span>
        ))}
      </div>
      {status === "perdido" && (
        <p className="label-xs mt-1 text-muted-foreground">Lead perdido — fora do funil</p>
      )}
    </div>
  );
}
