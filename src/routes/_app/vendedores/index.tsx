import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useVendedores } from "@/hooks/use-crm-data";
import { mapVendedorFromDb } from "@/lib/db-mappers";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_app/vendedores/")({
  component: VendedoresPage,
});

function VendedoresPage() {
  const { data: raw = [], isLoading, error } = useVendedores();
  const vendedores = (raw as any[]).map(mapVendedorFromDb);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", ativo: true });
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.nome.trim() || !form.email.trim()) {
        throw new Error("Nome e e-mail são obrigatórios");
      }
      const payload: any = {
        id: crypto.randomUUID(),
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim() || null,
        role: "vendedor",
        status: form.ativo ? "ativo" : "inativo",
      };
      const { error } = await supabase.from("profiles").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vendedor adicionado");
      qc.invalidateQueries({ queryKey: ["vendedores"] });
      setOpen(false);
      setForm({ nome: "", email: "", telefone: "", ativo: true });
    },
    onError: (e: any) => {
      const msg = e?.message ?? "Erro ao adicionar vendedor";
      if (/row-level security|permission|denied/i.test(msg)) {
        toast.error(
          "Sem permissão para criar vendedor. Apenas admin pode cadastrar — ou o vendedor deve criar conta via login."
        );
      } else {
        toast.error(msg);
      }
    },
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendedores</h1>
          <p className="text-sm text-muted-foreground mt-1">{vendedores.length} ativos na equipe</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-10 px-4 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground font-medium text-sm flex items-center gap-2 glow-orange"
        >
          <Plus className="h-4 w-4" /> Adicionar vendedor
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-12 text-center">Carregando vendedores...</div>
      ) : error ? (
        <div className="text-sm text-danger py-12 text-center">Erro ao carregar vendedores</div>
      ) : vendedores.length === 0 ? (
        <div className="text-sm text-muted-foreground py-12 text-center">Nenhum vendedor cadastrado</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendedores.map((v) => {
            const pct = v.meta_mensal ? Math.min(100, (v.fechamentos_mes / v.meta_mensal) * 100) : 0;
            return (
              <div key={v.id} className="bg-bg-secondary border border-border rounded-lg p-5 hover:border-border-strong hover:-translate-y-0.5 hover:glow-orange transition-all">
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 rounded-full bg-bg-tertiary border border-border-strong overflow-hidden shrink-0">
                    {v.avatar_url && <img src={v.avatar_url} alt={v.nome} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">{v.nome}</h3>
                    <p className="text-xs text-muted-foreground">{v.cargo}</p>
                    {v.regiao && <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-bg-tertiary border border-border">{v.regiao}</span>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Stat label="Em aberto" value="—" />
                  <Stat label="Fech. mês" value={`R$ ${(v.fechamentos_mes / 1000).toFixed(1)}k`} />
                  <Stat label="Ticket médio" value={`R$ ${v.ticket_medio}`} />
                  <Stat label="Conversão" value={`${v.taxa_conversao}%`} />
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="label-xs">Meta</span>
                    <span className="font-mono text-muted-foreground">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                    <div className="h-full bg-heaven-orange rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link to="/vendedores/$id" params={{ id: v.id }} className="flex-1 h-9 rounded-md bg-bg-tertiary hover:bg-bg-tertiary/70 text-sm flex items-center justify-center">Ver perfil</Link>
                  <button className="h-9 px-3 rounded-md border border-border hover:bg-bg-tertiary text-sm">
                    {v.status === "ativo" ? "Pausar" : "Ativar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar vendedor</DialogTitle>
            <DialogDescription>
              Cadastre um novo vendedor na equipe. O acesso definitivo é criado quando ele faz login pela primeira vez.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Status ativo</Label>
              <Switch id="ativo" checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 px-4 rounded-md border border-border hover:bg-bg-tertiary text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="h-10 px-4 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground font-medium text-sm disabled:opacity-50"
              >
                {createMutation.isPending ? "Salvando..." : "Salvar"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-tertiary rounded-md p-2.5">
      <div className="label-xs text-[10px]">{label}</div>
      <div className="font-mono text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}
