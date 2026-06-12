import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useVendedores, useRankingVelocidade, useLeads } from "@/hooks/use-crm-data";
import { mapVendedorFromDb } from "@/lib/db-mappers";
import { formatarTempo, corPorTempo, corTempoClass } from "@/lib/format-tempo";
import { HEAT } from "@/lib/heat";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
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

const ROLE_LABEL: Record<string, string> = {
  vendedor: "Vendedor",
  gestor: "Gestor",
  admin: "Admin",
};

/** Hue determinístico na família do laranja (20–40) a partir do nome. */
function avatarHue(nome: string): number {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  return 20 + (h % 21);
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

function VendedoresPage() {
  const navigate = useNavigate();
  const { data: raw = [], isLoading, error } = useVendedores();
  const { data: ranking = [] } = useRankingVelocidade(30);
  const { data: leadsRaw = [] } = useLeads();
  const vendedores = (raw as any[]).map(mapVendedorFromDb);
  const roles = useMemo(() => {
    const m = new Map<string, string>();
    (raw as any[]).forEach((r) => m.set(r.id, r.role ?? "vendedor"));
    return m;
  }, [raw]);

  // Contagens client-side por vendedor_id (leads ativos = nem ganho nem perdido)
  const porVendedor = useMemo(() => {
    const m = new Map<string, { ativos: number; pipeline: number }>();
    (leadsRaw as any[]).forEach((l) => {
      if (!l.vendedor_id) return;
      const cur = m.get(l.vendedor_id) ?? { ativos: 0, pipeline: 0 };
      if (l.status !== "ganho" && l.status !== "perdido") {
        cur.ativos += 1;
        cur.pipeline += Number(l.valor_estimado ?? 0);
      }
      m.set(l.vendedor_id, cur);
    });
    return m;
  }, [leadsRaw]);

  // Posição no ranking de velocidade (menor tempo = #1)
  const posicaoRanking = useMemo(() => {
    const ordenado = [...(ranking as any[])].sort(
      (a, b) => (a.tempo_medio_segundos ?? Infinity) - (b.tempo_medio_segundos ?? Infinity),
    );
    const m = new Map<string, number>();
    ordenado.forEach((r, i) => m.set(r.vendedor_id, i + 1));
    return m;
  }, [ranking]);

  const tempoDe = (id: string): number | null => {
    const r = (ranking as any[]).find((x) => x.vendedor_id === id);
    return r?.tempo_medio_segundos ?? null;
  };

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
        status: form.ativo ? "ativo" : "pausado",
      };
      const { error: err } = await supabase.from("profiles").insert(payload);
      if (err) throw err;
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
          "Sem permissão para criar vendedor. Apenas admin pode cadastrar — ou o vendedor deve criar conta via login.",
        );
      } else {
        toast.error(msg);
      }
    },
  });

  const fmtCompact = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        notation: "compact",
        maximumFractionDigits: 1,
      }),
    [],
  );

  const soGestoresSemLeads =
    vendedores.length > 0 &&
    vendedores.every((v) => roles.get(v.id) !== "vendedor") &&
    (leadsRaw as any[]).length === 0;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendedores</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-mono">{vendedores.length}</span> na equipe
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-10 px-4 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground font-medium text-sm flex items-center gap-2 glow-orange"
        >
          <Plus className="h-4 w-4" aria-hidden /> Adicionar vendedor
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full shimmer-heaven" />
          ))}
        </div>
      ) : error ? (
        <div className="text-sm text-danger py-12 text-center">Erro ao carregar vendedores</div>
      ) : vendedores.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum perfil cadastrado"
          description="Adicione o primeiro vendedor para começar a distribuir leads."
        />
      ) : soGestoresSemLeads ? (
        <EmptyState
          icon={Users}
          title="Equipe ainda sem vendedores"
          description="Por enquanto só há gestores cadastrados e nenhum lead atribuído. Adicione vendedores para o roster ganhar vida."
          action={
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="h-9 px-4 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground text-sm font-medium flex items-center gap-2"
            >
              <Plus className="h-4 w-4" aria-hidden /> Adicionar vendedor
            </button>
          }
        />
      ) : (
        <div className="bg-bg-secondary hairline-top border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 label-xs">Vendedor</th>
                <th className="text-left px-4 py-3 label-xs">Função</th>
                <th className="text-left px-4 py-3 label-xs">Status</th>
                <th className="text-right px-4 py-3 label-xs">Leads ativos</th>
                <th className="text-right px-4 py-3 label-xs">Pipeline</th>
                <th className="text-right px-4 py-3 label-xs">Tempo médio de resposta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vendedores.map((v) => {
                const stats = porVendedor.get(v.id) ?? { ativos: 0, pipeline: 0 };
                const tempo = tempoDe(v.id);
                const pos = posicaoRanking.get(v.id);
                const role = roles.get(v.id) ?? "vendedor";
                const hue = avatarHue(v.nome);
                return (
                  <tr
                    key={v.id}
                    onClick={() => navigate({ to: "/vendedores/$id", params: { id: v.id } })}
                    className="cursor-pointer hover:bg-bg-tertiary/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 overflow-hidden"
                          style={{ background: `hsl(${hue}, 70%, 45%)` }}
                          aria-hidden
                        >
                          {v.avatar_url ? (
                            <img src={v.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            iniciais(v.nome)
                          )}
                        </span>
                        <div className="min-w-0">
                          <Link
                            to="/vendedores/$id"
                            params={{ id: v.id }}
                            className="font-medium truncate block hover:text-heaven-orange"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {v.nome}
                          </Link>
                          {v.cargo && (
                            <div className="text-xs text-muted-foreground truncate">{v.cargo}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ background: role === "vendedor" ? HEAT[4] : HEAT[1] }}
                          aria-hidden
                        />
                        {ROLE_LABEL[role] ?? role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ background: v.status === "ativo" ? HEAT[5] : HEAT[0] }}
                          aria-hidden
                        />
                        {v.status === "ativo" ? "Ativo" : "Pausado"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{stats.ativos}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {stats.pipeline > 0 ? fmtCompact.format(stats.pipeline) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {tempo != null ? (
                        <div>
                          <span className={`font-mono font-semibold ${corTempoClass(corPorTempo(tempo))}`}>
                            {formatarTempo(tempo)}
                          </span>
                          {pos != null && pos <= 3 && (
                            <div className="label-xs mt-0.5">#{pos} DA EQUIPE</div>
                          )}
                        </div>
                      ) : (
                        <span className="font-mono text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
              <Switch id="ativo" checked={form.ativo} onCheckedChange={(val) => setForm({ ...form, ativo: val })} />
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
