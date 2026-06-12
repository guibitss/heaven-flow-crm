import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UFS, maskCnpj } from "@/components/crm/crm-shared";

// Cadastro manual de lead. Score/temperatura/porte saem do TRIGGER do banco —
// nada é calculado no client. fonte é sempre 'manual'.

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovoLeadDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [uf, setUf] = useState("");
  const [valorEstimado, setValorEstimado] = useState("");

  function reset() {
    setRazaoSocial("");
    setCnpj("");
    setTelefone("");
    setUf("");
    setValorEstimado("");
  }

  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("leads").insert({
        razao_social: razaoSocial.trim(),
        cnpj: cnpj.trim() || null,
        telefone: telefone.trim() || null,
        endereco_uf: uf || null,
        valor_estimado: valorEstimado ? Number(valorEstimado) : null,
        fonte: "manual",
        status: "bruto",
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard-kpis"] });
      qc.invalidateQueries({ queryKey: ["funil"] });
      toast.success("Lead criado");
      reset();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao criar lead"),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!razaoSocial.trim()) {
      toast.error("Razão social é obrigatória");
      return;
    }
    criar.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-bg-secondary sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo lead manual</DialogTitle>
          <DialogDescription>
            Score, temperatura e porte são calculados automaticamente após salvar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nl-razao">Razão social *</Label>
            <Input
              id="nl-razao"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              placeholder="Ex.: Solar Estruturas LTDA"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nl-cnpj">CNPJ</Label>
              <Input
                id="nl-cnpj"
                className="font-mono"
                value={cnpj}
                onChange={(e) => setCnpj(maskCnpj(e.target.value))}
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nl-tel">Telefone</Label>
              <Input
                id="nl-tel"
                className="font-mono"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                inputMode="tel"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nl-uf">UF</Label>
              <Select value={uf} onValueChange={setUf}>
                <SelectTrigger id="nl-uf" className="w-full">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {UFS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nl-valor">Valor estimado (R$)</Label>
              <Input
                id="nl-valor"
                className="font-mono"
                type="number"
                min="0"
                step="100"
                value={valorEstimado}
                onChange={(e) => setValorEstimado(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <p className="label-xs">Fonte: manual</p>
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-md bg-bg-tertiary hover:bg-bg-tertiary/70 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={criar.isPending}
              className="h-9 px-4 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground text-sm font-medium disabled:opacity-60"
            >
              {criar.isPending ? "Salvando…" : "Criar lead"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
