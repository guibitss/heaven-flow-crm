import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Zona PERDIDO: faixa colapsada cinza no rodapé do board. Expande durante o
// dragover; soltar abre o diálogo de motivo (status + nota com o motivo).

export function PerdidoZone({ count, dragging }: { count: number; dragging: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "perdido" });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-md border border-dashed transition-all flex items-center justify-center gap-2",
        isOver
          ? "h-20 border-heaven-orange bg-heaven-orange/[0.04]"
          : dragging
            ? "h-14 border-border-strong bg-bg-secondary"
            : "h-9 border-border bg-bg-secondary/60",
      )}
      aria-label={`Zona de leads perdidos, ${count} no total`}
    >
      <span className="size-1.5 rounded-full bg-heat-1 shrink-0" aria-hidden />
      <span className="label-xs">Perdido</span>
      <span className="font-mono tabular-nums text-xs text-muted-foreground">{count}</span>
      {(dragging || isOver) && (
        <span className="text-xs text-muted-foreground">— solte aqui para marcar como perdido</span>
      )}
    </div>
  );
}

interface MotivoDialogProps {
  lead: { id: string; razao_social: string } | null;
  onClose: () => void;
}

export function MotivoPerdaDialog({ lead, onClose }: MotivoDialogProps) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [motivo, setMotivo] = useState("");

  const perder = useMutation({
    mutationFn: async () => {
      if (!lead) return;
      const { error } = await supabase.from("leads").update({ status: "perdido" } as never).eq("id", lead.id);
      if (error) throw error;
      const { error: notaErr } = await supabase.from("notas").insert({
        lead_id: lead.id,
        autor_id: profile?.id ?? null,
        conteudo: `Lead marcado como perdido. Motivo: ${motivo.trim()}`,
      } as never);
      if (notaErr) throw notaErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["funil"] });
      qc.invalidateQueries({ queryKey: ["dashboard-kpis"] });
      toast.success("Lead marcado como perdido");
      setMotivo("");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao marcar como perdido"),
  });

  return (
    <Dialog open={!!lead} onOpenChange={(o) => { if (!o) { setMotivo(""); onClose(); } }}>
      <DialogContent className="bg-bg-secondary sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar como perdido</DialogTitle>
          <DialogDescription>
            {lead ? `Informe o motivo da perda de ${lead.razao_social}. O motivo vira uma nota no dossiê.` : ""}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ex.: optou pelo concorrente, sem orçamento este ano…"
          className="min-h-24 bg-bg-tertiary"
          autoFocus
        />
        <DialogFooter>
          <button
            type="button"
            onClick={() => { setMotivo(""); onClose(); }}
            className="h-9 px-4 rounded-md bg-bg-tertiary hover:bg-bg-tertiary/70 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!motivo.trim() || perder.isPending}
            onClick={() => perder.mutate()}
            className="h-9 px-4 rounded-md bg-danger text-white text-sm font-medium disabled:opacity-50"
          >
            {perder.isPending ? "Salvando…" : "Confirmar perda"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
