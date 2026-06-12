import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Send, MessageSquare, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { formatarTempo, corPorTempo, corTempoClass } from "@/lib/format-tempo";
import { PulseFlash } from "@/components/common/pulse-flash";
import { EmptyState } from "@/components/common/empty-state";

// Aba CONVERSA: mensagens reais + realtime filtrado por lead, composer real.
// Bolhas: IA = hairline laranja 25% sobre fundo transparente; vendedor =
// bg-bg-tertiary à direita; lead = borda padrão à esquerda.

type Mensagem = {
  id: string;
  lead_id: string;
  autor: "ia" | "lead" | "vendedor";
  autor_id: string | null;
  conteudo: string;
  tipo: string | null;
  enviada_em: string | null;
  created_at: string | null;
};

function SparkDivider({ segundos }: { segundos: number }) {
  const cor = corPorTempo(segundos);
  return (
    <div className="flex items-center gap-2 py-1" role="note" aria-label={`Primeira resposta do vendedor em ${formatarTempo(segundos)}`}>
      <div className="h-px flex-1 bg-border" aria-hidden />
      <span className={cn("flex items-center gap-1 font-mono tabular-nums text-[10px]", corTempoClass(cor))}>
        <Zap className="h-3 w-3" aria-hidden />
        primeira resposta em {formatarTempo(segundos)}
      </span>
      <div className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}

interface Props {
  leadId: string;
  handoffEm: string | null;
  tempoPrimeiraRespostaSegundos: number | null;
}

export function ConversaTab({ leadId, handoffEm, tempoPrimeiraRespostaSegundos }: Props) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [texto, setTexto] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: mensagens = [], isLoading } = useQuery({
    queryKey: ["mensagens", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensagens")
        .select("*")
        .eq("lead_id", leadId)
        .order("enviada_em", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Mensagem[];
    },
    enabled: !!leadId,
  });

  // Realtime filtrado por lead — flash único via PulseFlash na lista
  useEffect(() => {
    const ch = supabase.channel(`mensagens-lead-${leadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens", filter: `lead_id=eq.${leadId}` },
        () => { qc.invalidateQueries({ queryKey: ["mensagens", leadId] }); },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [leadId, qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [mensagens.length]);

  const enviar = useMutation({
    mutationFn: async (conteudo: string) => {
      const { error } = await supabase.from("mensagens").insert({
        lead_id: leadId,
        autor: "vendedor",
        autor_id: profile?.id ?? null,
        conteudo,
        tipo: "texto",
        enviada_em: new Date().toISOString(),
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      setTexto("");
      qc.invalidateQueries({ queryKey: ["mensagens", leadId] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao enviar mensagem"),
  });

  function submit() {
    const t = texto.trim();
    if (!t || enviar.isPending) return;
    enviar.mutate(t);
  }

  // SparkDivider entra antes da primeira mensagem do vendedor pós-handoff
  const handoffMs = handoffEm ? new Date(handoffEm).getTime() : null;
  const idxPrimeiraResposta = handoffMs != null && tempoPrimeiraRespostaSegundos != null
    ? mensagens.findIndex((m) => m.autor === "vendedor" && new Date(m.enviada_em ?? m.created_at ?? 0).getTime() >= handoffMs)
    : -1;

  const lastId = mensagens.length > 0 ? mensagens[mensagens.length - 1].id : "vazio";

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="space-y-3 py-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn("h-12 w-2/3 rounded-lg shimmer-heaven", i % 2 === 1 && "ml-auto")} />
            ))}
          </div>
        ) : mensagens.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Nenhuma mensagem ainda"
            description="A conversa com este lead aparecerá aqui assim que a IA ou um vendedor enviar a primeira mensagem."
          />
        ) : (
          <PulseFlash pulseKey={lastId} className="space-y-3 rounded-md">
            {mensagens.map((m, i) => (
              <div key={m.id}>
                {i === idxPrimeiraResposta && tempoPrimeiraRespostaSegundos != null && (
                  <SparkDivider segundos={tempoPrimeiraRespostaSegundos} />
                )}
                <div className={cn("flex", m.autor === "vendedor" && "justify-end")}>
                  <div
                    className={cn(
                      "max-w-[70%] rounded-lg px-4 py-2 text-sm",
                      m.autor === "ia" && "border border-heaven-orange/25 bg-transparent",
                      m.autor === "vendedor" && "bg-bg-tertiary",
                      m.autor === "lead" && "border border-border bg-transparent",
                    )}
                  >
                    <div className="label-xs mb-1">
                      {m.autor === "ia" ? "IA" : m.autor === "vendedor" ? "Vendedor" : "Lead"}
                    </div>
                    <div className="leading-snug whitespace-pre-wrap">{m.conteudo}</div>
                    <div className="mt-1 font-mono tabular-nums text-[10px] text-muted-foreground">
                      {format(new Date(m.enviada_em ?? m.created_at ?? Date.now()), "dd/MM HH:mm")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </PulseFlash>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        className="mt-4 flex gap-2 border-t border-border pt-4"
      >
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          className="h-10 flex-1 rounded-md border border-border bg-bg-tertiary px-3 text-sm outline-none focus:border-heaven-orange"
          placeholder="Escreva como vendedor… (Enter envia)"
          aria-label="Nova mensagem"
        />
        <button
          type="submit"
          disabled={!texto.trim() || enviar.isPending}
          className="flex h-10 items-center gap-1.5 rounded-md bg-heaven-orange px-4 text-sm font-medium text-primary-foreground hover:bg-heaven-orange-deep disabled:opacity-50"
          aria-label="Enviar mensagem"
        >
          <Send className="h-4 w-4" aria-hidden /> Enviar
        </button>
      </form>
    </div>
  );
}
