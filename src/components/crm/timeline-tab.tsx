import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HEAT } from "@/lib/heat";
import { EmptyState } from "@/components/common/empty-state";

// Aba TIMELINE: eventos_feed do lead em trilho vertical. Nó mais recente
// quente (heat-5), esfriando até heat-1 conforme envelhece na lista.

type Evento = {
  id: string;
  tipo: string;
  texto: string;
  created_at: string;
};

export function TimelineTab({ leadId }: { leadId: string }) {
  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ["eventos-feed-lead", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventos_feed")
        .select("id,tipo,texto,created_at")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Evento[];
    },
    enabled: !!leadId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-8 rounded-md shimmer-heaven" />
        ))}
      </div>
    );
  }

  if (eventos.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Sem eventos registrados"
        description="A linha do tempo deste lead aparecerá aqui conforme captação, mensagens e mudanças de etapa acontecerem."
      />
    );
  }

  return (
    <ol className="relative ml-1 space-y-0" aria-label="Linha do tempo do lead">
      {eventos.map((ev, idx) => {
        // recência → calor: idx 0 = HEAT[4] (--heat-5), esfriando até HEAT[0]
        const cor = HEAT[Math.max(0, 4 - idx)];
        const ultimo = idx === eventos.length - 1;
        return (
          <li key={ev.id} className="relative flex gap-4 pb-5">
            {!ultimo && <span className="absolute left-[3.5px] top-3 h-full w-px bg-border" aria-hidden />}
            <span
              className="relative mt-1.5 size-2 shrink-0 rounded-full"
              style={{ backgroundColor: cor }}
              aria-hidden
            />
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <time
                dateTime={ev.created_at}
                className="font-mono tabular-nums text-[11px] text-muted-foreground shrink-0"
              >
                {format(new Date(ev.created_at), "dd/MM/yyyy HH:mm")}
              </time>
              <span className="text-sm text-foreground">{ev.texto}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
