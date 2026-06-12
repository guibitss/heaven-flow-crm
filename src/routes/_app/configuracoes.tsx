import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ScoreStudio } from "@/components/score/score-studio";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { HEAT } from "@/lib/heat";

export const Route = createFileRoute("/_app/configuracoes")({
  component: ConfigPage,
});

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserRole = Database["public"]["Enums"]["user_role"];

// Role: dot + texto (cor nunca sozinha). Admin = brasa, gestor = rust, vendedor = cinza.
const ROLE_DOT: Record<UserRole, string> = {
  admin: HEAT[4],
  gestor: HEAT[2],
  vendedor: HEAT[0],
};

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  gestor: "Gestor",
  vendedor: "Vendedor",
};

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// ====== Dados ======

function useProfiles() {
  return useQuery({
    queryKey: ["profiles-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<Profile, "status" | "limite_leads_abertos">>;
    }) => {
      const { error } = await supabase.from("profiles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["profiles-config"] });
      const prev = qc.getQueryData<Profile[]>(["profiles-config"]);
      qc.setQueryData<Profile[]>(["profiles-config"], (old) =>
        (old ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)),
      );
      return { prev };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["profiles-config"], ctx.prev);
      toast.error(`Erro ao atualizar usuário: ${e.message}`);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["profiles-config"] });
      qc.invalidateQueries({ queryKey: ["vendedores"] });
    },
  });
}

// ====== Linha de usuário ======

function LimiteInline({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (valor: number) => void;
}) {
  const [valor, setValor] = useState(String(profile.limite_leads_abertos ?? 0));

  const commit = () => {
    const n = Math.max(0, Number(valor) || 0);
    setValor(String(n));
    if (n !== (profile.limite_leads_abertos ?? 0)) onSave(n);
  };

  return (
    <input
      type="number"
      min={0}
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      aria-label={`Limite de leads abertos de ${profile.nome}`}
      className="h-7 w-16 rounded-md border border-border bg-bg-tertiary px-2 text-right font-mono text-xs tabular-nums outline-none focus-visible:ring-1 focus-visible:ring-ring"
    />
  );
}

function RoleCell({ role }: { role: UserRole }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className="inline-block size-2 rounded-full"
        style={{ backgroundColor: ROLE_DOT[role] }}
        aria-hidden
      />
      {ROLE_LABEL[role]}
    </span>
  );
}

function UsuariosTab() {
  const { data: profiles, isLoading } = useProfiles();
  const update = useUpdateProfile();

  const toggleStatus = (p: Profile, ativo: boolean) => {
    update.mutate(
      { id: p.id, patch: { status: ativo ? "ativo" : "pausado" } },
      {
        onSuccess: () =>
          toast.success(
            ativo ? `${p.nome} reativado.` : `${p.nome} pausado — não recebe novos leads.`,
          ),
      },
    );
  };

  const salvarLimite = (p: Profile, valor: number) => {
    update.mutate(
      { id: p.id, patch: { limite_leads_abertos: valor } },
      { onSuccess: () => toast.success(`Limite de ${p.nome} atualizado para ${valor}.`) },
    );
  };

  return (
    <div className="rounded-lg border border-border bg-bg-secondary hairline-top p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Equipe com acesso ao CRM — status e limite de leads editáveis aqui.
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>
              <Button size="sm" disabled aria-disabled="true" className="pointer-events-none">
                <UserPlus className="mr-1.5 size-3.5" />
                Convidar usuário
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Convites exigem backend administrativo — em breve
          </TooltipContent>
        </Tooltip>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full shimmer-heaven" />
          <Skeleton className="h-12 w-full shimmer-heaven" />
          <Skeleton className="h-12 w-full shimmer-heaven" />
        </div>
      ) : !profiles || profiles.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum usuário cadastrado"
          description="Os perfis aparecem aqui quando contas forem criadas no Supabase Auth."
        />
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="space-y-2 rounded-lg border border-border bg-bg-tertiary/40 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-tertiary font-mono text-xs">
                      {iniciais(p.nome)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.nome}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {p.email}
                      </p>
                    </div>
                  </div>
                  <RoleCell role={p.role} />
                </div>
                {p.cargo && <p className="text-xs text-muted-foreground">{p.cargo}</p>}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={p.status === "ativo"}
                      onCheckedChange={(c) => toggleStatus(p, c)}
                      aria-label={`Status de ${p.nome}`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {p.status === "ativo" ? "Ativo" : "Pausado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="label-xs">Limite</span>
                    <LimiteInline profile={p} onSave={(v) => salvarLimite(p, v)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: tabela editorial densa */}
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="label-xs">
                <th className="pb-3 text-left font-medium">Usuário</th>
                <th className="pb-3 text-left font-medium">Email</th>
                <th className="pb-3 text-left font-medium">Cargo</th>
                <th className="pb-3 text-left font-medium">Papel</th>
                <th className="pb-3 text-left font-medium">Status</th>
                <th className="pb-3 text-right font-medium">Limite de leads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-bg-tertiary font-mono text-[10px]">
                        {iniciais(p.nome)}
                      </span>
                      <span className="font-medium">{p.nome}</span>
                    </div>
                  </td>
                  <td className="py-2.5 font-mono text-xs text-muted-foreground">
                    {p.email}
                  </td>
                  <td className="py-2.5 text-xs text-muted-foreground">
                    {p.cargo ?? "—"}
                  </td>
                  <td className="py-2.5">
                    <RoleCell role={p.role} />
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.status === "ativo"}
                        onCheckedChange={(c) => toggleStatus(p, c)}
                        aria-label={`Status de ${p.nome}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {p.status === "ativo" ? "Ativo" : "Pausado"}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right">
                    <LimiteInline profile={p} onSave={(v) => salvarLimite(p, v)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// ====== Integrações ======

function StatusOrb({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 text-xs">
      <span
        className="inline-block size-2 rounded-full"
        style={{ backgroundColor: ok ? "var(--success)" : HEAT[0] }}
        aria-hidden
      />
      <span className={ok ? "text-success" : "text-muted-foreground"}>{texto}</span>
    </span>
  );
}

const INTEGRACOES: { nome: string; desc: string; ok: boolean; status: string }[] = [
  {
    nome: "Supabase",
    desc: "Banco de dados, autenticação e realtime do CRM.",
    ok: true,
    status: "Conectado",
  },
  {
    nome: "Google Maps Places",
    desc: "Captação de leads por busca geográfica de empresas.",
    ok: false,
    status: "Chave não configurada",
  },
  {
    nome: "WAHA WhatsApp",
    desc: "Sessão de WhatsApp para abordagem automática da IA.",
    ok: false,
    status: "Não configurado",
  },
  {
    nome: "Receita Federal",
    desc: "Enriquecimento cadastral via ETL local de dados públicos do CNPJ.",
    ok: false,
    status: "ETL local",
  },
];

function IntegracoesTab() {
  return (
    <div className="max-w-2xl rounded-lg border border-border bg-bg-secondary hairline-top">
      {INTEGRACOES.map((i, idx) => (
        <div
          key={i.nome}
          className={`flex items-center justify-between gap-4 px-5 py-4 ${idx > 0 ? "hairline-top" : ""}`}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">{i.nome}</p>
            <p className="truncate text-xs text-muted-foreground">{i.desc}</p>
          </div>
          <StatusOrb ok={i.ok} texto={i.status} />
        </div>
      ))}
    </div>
  );
}

// ====== Página ======

function ConfigPage() {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="mx-auto w-full max-w-[1400px] space-y-6 overflow-x-hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        </div>

        <Tabs defaultValue="usuarios">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 sm:inline-flex sm:h-9 sm:w-auto sm:gap-0">
            <TabsTrigger value="usuarios" className="w-full whitespace-normal sm:whitespace-nowrap">
              Usuários
            </TabsTrigger>
            <TabsTrigger value="score" className="w-full whitespace-normal sm:whitespace-nowrap">
              Score
            </TabsTrigger>
            <TabsTrigger value="integracoes" className="w-full whitespace-normal sm:whitespace-nowrap">
              Integrações
            </TabsTrigger>
            <TabsTrigger value="empresa" className="w-full whitespace-normal sm:whitespace-nowrap">
              Empresa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="mt-4">
            <UsuariosTab />
          </TabsContent>

          <TabsContent value="score" className="mt-4">
            <ScoreStudio />
          </TabsContent>

          <TabsContent value="integracoes" className="mt-4">
            <IntegracoesTab />
          </TabsContent>

          <TabsContent value="empresa" className="mt-4">
            <div className="max-w-xl">
              <EmptyState
                icon={Building2}
                title="Dados da empresa (em breve)"
                description="Razão social, CNPJ, fuso horário e logo ainda não têm persistência no banco — este painel será habilitado quando a tabela existir."
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
