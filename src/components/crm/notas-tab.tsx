import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { StickyNote } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/empty-state";

// Aba NOTAS: lista real (join autor) + composer com INSERT real.

type Nota = {
  id: string;
  conteudo: string;
  created_at: string | null;
  autor: { id: string; nome: string } | null;
};

export function NotasTab({ leadId }: { leadId: string }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [texto, setTexto] = useState("");

  const { data: notas = [], isLoading } = useQuery({
    queryKey: ["notas", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notas")
        .select("id,conteudo,created_at,autor:profiles(id,nome)")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Nota[];
    },
    enabled: !!leadId,
  });

  const salvar = useMutation({
    mutationFn: async (conteudo: string) => {
      const { error } = await supabase.from("notas").insert({
        lead_id: leadId,
        autor_id: profile?.id ?? null,
        conteudo,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      setTexto("");
      qc.invalidateQueries({ queryKey: ["notas", leadId] });
      qc.invalidateQueries({ queryKey: ["lead", leadId] });
      toast.success("Nota salva");
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao salvar nota"),
  });

  return (
    <div className="space-y-4">
      <div>
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="min-h-24 bg-bg-tertiary resize-none"
          placeholder="Adicionar uma nota sobre este lead…"
          aria-label="Nova nota"
        />
        <button
          type="button"
          onClick={() => texto.trim() && salvar.mutate(texto.trim())}
          disabled={!texto.trim() || salvar.isPending}
          className="mt-2 h-9 rounded-md bg-heaven-orange px-4 text-sm font-medium text-primary-foreground hover:bg-heaven-orange-deep disabled:opacity-50"
        >
          {salvar.isPending ? "Salvando…" : "Salvar nota"}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => <div key={i} className="h-16 rounded-md shimmer-heaven" />)}
        </div>
      ) : notas.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="Nenhuma nota ainda"
          description="Use o campo acima para registrar contexto, combinados e próximos passos."
        />
      ) : (
        <div className="space-y-3">
          {notas.map((n) => (
            <div key={n.id} className="rounded-md border border-border bg-bg-tertiary p-3 hairline-top">
              <div className="mb-1 flex justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{n.autor?.nome ?? "Sistema"}</span>
                {n.created_at && (
                  <time dateTime={n.created_at} className="font-mono tabular-nums">
                    {format(new Date(n.created_at), "dd/MM/yyyy HH:mm")}
                  </time>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{n.conteudo}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
