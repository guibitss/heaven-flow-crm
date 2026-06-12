import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, History, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useVendedor, useRankingVelocidade } from "@/hooks/use-crm-data";
import { mapVendedorFromDb } from "@/lib/db-mappers";
import { formatarTempo, corPorTempo, corTempoHex, corTempoClass } from "@/lib/format-tempo";
import { HEAT, STATUS_HEAT, STATUS_LABEL, type LeadStatus } from "@/lib/heat";
import { supabase } from "@/integrations/supabase/client";
import { CountUp } from "@/components/common/count-up";
import { ScoreRing } from "@/components/common/score-ring";
import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_app/vendedores/$id")({
  component: VendedorDetail,
});

const ROLE_LABEL: Record<string, string> = {
  vendedor: "Vendedor",
  gestor: "Gestor",
  admin: "Admin",
};

type KpisVendedor = {
  total_leads: number;
  leads_ativos: number;
  ganhos_mes: number;
  valor_pipeline: number;
  tempo_medio_resposta_segundos: number | null;
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

function VendedorDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: raw, isLoading } = useVendedor(id);
  const { data: ranking = [] } = useRankingVelocidade(30);

  const { data: kpis } = useQuery({
    queryKey: ["kpis-vendedor", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_kpis_vendedor", { _vendedor: id });
      if (error) throw error;
      return data as unknown as KpisVendedor;
    },
    enabled: !!id,
  });

  const { data: ultimosLeads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["leads-vendedor", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, razao_social, score, status, valor_estimado, criado_em")
        .eq("vendedor_id", id)
        .order("criado_em", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  const v = raw ? mapVendedorFromDb(raw) : null;
  const role = (raw as any)?.role ?? "vendedor";

  const velocidade = (ranking as any[]).find((r) => r.vendedor_id === id) ?? null;
  const mediaGeral = (ranking as any[]).length
    ? Math.round(
        (ranking as any[]).reduce((s, r) => s + (r.tempo_medio_segundos ?? 0), 0) / (ranking as any[]).length,
      )
    : null;
  const posicao = velocidade
    ? [...(ranking as any[])]
        .sort((a, b) => (a.tempo_medio_segundos ?? Infinity) - (b.tempo_medio_segundos ?? Infinity))
        .findIndex((r) => r.vendedor_id === id) + 1
    : null;

  // Ações reais
  const [limite, setLimite] = useState<string>("");
  useEffect(() => {
    if (v && limite === "") setLimite(String(v.limite_leads_abertos));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const toggleStatus = useMutation({
    mutationFn: async (ativo: boolean) => {
      const { error } = await supabase
        .from("profiles")
        .update({ status: ativo ? "ativo" : "pausado" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, ativo) => {
      toast.success(ativo ? "Vendedor ativado" : "Vendedor pausado");
      qc.invalidateQueries({ queryKey: ["vendedor", id] });
      qc.invalidateQueries({ queryKey: ["vendedores"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao atualizar status"),
  });

  const salvarLimite = useMutation({
    mutationFn: async () => {
      const n = parseInt(limite, 10);
      if (!Number.isFinite(n) || n < 1) throw new Error("Limite deve ser um número maior que zero");
      const { error } = await supabase.from("profiles").update({ limite_leads_abertos: n }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Limite atualizado");
      qc.invalidateQueries({ queryKey: ["vendedor", id] });
      qc.invalidateQueries({ queryKey: ["vendedores"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar limite"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-[1400px] mx-auto">
        <Skeleton className="h-32 w-full shimmer-heaven" />
        <Skeleton className="h-24 w-full shimmer-heaven" />
      </div>
    );
  }
  if (!v) return <div className="text-sm text-muted-foreground py-12 text-center">Vendedor não encontrado</div>;

  const limiteDirty = limite !== "" && parseInt(limite, 10) !== v.limite_leads_abertos;
  const hue = avatarHue(v.nome);
  const tempoMedio = kpis?.tempo_medio_resposta_segundos ?? null;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <Link to="/vendedores" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Vendedores
      </Link>

      <div className="flex items-start gap-6 bg-bg-secondary hairline-top border border-border rounded-lg p-6">
        <span
          className="h-20 w-20 rounded-full flex items-center justify-center text-2xl font-semibold text-white shrink-0 overflow-hidden"
          style={{ background: `hsl(${hue}, 70%, 45%)` }}
          aria-hidden
        >
          {v.avatar_url ? <img src={v.avatar_url} alt="" className="h-full w-full object-cover" /> : iniciais(v.nome)}
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold truncate">{v.nome}</h1>
          <p className="text-muted-foreground">
            {v.cargo || ROLE_LABEL[role] || role}
            {v.regiao ? ` • ${v.regiao}` : ""}
          </p>
          <div className="flex flex-wrap gap-2 mt-3 items-center">
            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-bg-tertiary border border-border">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: role === "vendedor" ? HEAT[4] : HEAT[1] }}
                aria-hidden
              />
              {ROLE_LABEL[role] ?? role}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-bg-tertiary border border-border">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: v.status === "ativo" ? HEAT[5] : HEAT[0] }}
                aria-hidden
              />
              {v.status === "ativo" ? "Ativo" : "Pausado"}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-bg-tertiary border border-border font-mono">{v.email}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatHero label="Total de leads">
          <CountUp value={kpis?.total_leads ?? 0} />
        </StatHero>
        <StatHero label="Leads ativos">
          <CountUp value={kpis?.leads_ativos ?? 0} />
        </StatHero>
        <StatHero label="Ganhos no mês">
          <CountUp value={kpis?.ganhos_mes ?? 0} />
        </StatHero>
        <StatHero label="Valor em pipeline">
          <CountUp
            value={kpis?.valor_pipeline ?? 0}
            format={(n) =>
              new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(n)
            }
          />
        </StatHero>
        <StatHero label="Tempo médio de resposta">
          <span className={tempoMedio != null ? corTempoClass(corPorTempo(tempoMedio)) : "text-muted-foreground"}>
            {formatarTempo(tempoMedio)}
          </span>
        </StatHero>
      </div>

      <div className="bg-bg-secondary energized-top border border-border rounded-lg p-5">
        <div className="flex items-start gap-4">
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: velocidade
                ? `${corTempoHex(corPorTempo(velocidade.tempo_medio_segundos))}20`
                : "rgba(168,168,168,0.12)",
            }}
          >
            <Timer
              className="h-6 w-6"
              aria-hidden
              style={{ color: velocidade ? corTempoHex(corPorTempo(velocidade.tempo_medio_segundos)) : "#A8A8A8" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="label-xs">Velocidade de resposta (30d)</div>
            <div
              className="font-mono text-[34px] font-bold mt-1 leading-none"
              style={{ color: velocidade ? corTempoHex(corPorTempo(velocidade.tempo_medio_segundos)) : undefined }}
            >
              {velocidade ? formatarTempo(velocidade.tempo_medio_segundos) : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {velocidade ? (
                <>
                  <span>
                    <span className="font-mono">{velocidade.total_respostas}</span> respostas
                  </span>
                  <span>
                    <span className="font-mono">{velocidade.taxa_excelencia ?? 0}%</span> em &lt;30min
                  </span>
                  {posicao && (
                    <span className="label-xs text-heaven-orange">#{posicao} DA EQUIPE</span>
                  )}
                  {mediaGeral !== null && (
                    <span>
                      Média geral: <span className="font-mono">{formatarTempo(mediaGeral)}</span>
                    </span>
                  )}
                </>
              ) : (
                <span>Sem respostas no período</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-bg-secondary border border-border rounded-lg p-5">
        <h3 className="label-xs mb-4">Histórico de performance</h3>
        <EmptyState
          icon={History}
          title="Histórico em construção"
          description="A série temporal de fechamentos será exibida aqui assim que houver dados acumulados."
          className="py-10"
        />
      </div>

      <div className="bg-bg-secondary border border-border rounded-lg p-5">
        <h3 className="label-xs mb-4">Últimos leads atribuídos</h3>
        {loadingLeads ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full shimmer-heaven" />
            ))}
          </div>
        ) : ultimosLeads.length === 0 ? (
          <EmptyState title="Nenhum lead atribuído" description="Quando este vendedor receber leads, eles aparecem aqui." className="py-8" />
        ) : (
          <ul className="divide-y divide-border">
            {(ultimosLeads as any[]).map((l) => (
              <li key={l.id}>
                <Link
                  to="/crm/$id"
                  params={{ id: l.id }}
                  className="flex items-center gap-3 py-3 hover:bg-bg-tertiary/50 rounded-md px-2 -mx-2 transition-colors"
                  aria-label={`Abrir lead ${l.razao_social}`}
                >
                  <ScoreRing score={l.score} size={20} />
                  <span className="font-mono text-xs text-muted-foreground w-7 text-right shrink-0">
                    {l.score ?? "—"}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-sm">{l.razao_social}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: STATUS_HEAT[l.status as LeadStatus] ?? HEAT[0] }}
                      aria-hidden
                    />
                    {STATUS_LABEL[l.status as LeadStatus] ?? l.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-bg-secondary border border-border rounded-lg p-5">
        <h3 className="label-xs mb-4">Ações</h3>
        <div className="space-y-5 max-w-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Receber novos leads</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {v.status === "ativo" ? "Ativo — entra na distribuição automática" : "Pausado — fora da distribuição"}
              </div>
            </div>
            <Switch
              checked={v.status === "ativo"}
              disabled={toggleStatus.isPending}
              onCheckedChange={(val) => toggleStatus.mutate(val)}
              aria-label={v.status === "ativo" ? "Pausar vendedor" : "Ativar vendedor"}
            />
          </div>
          <div>
            <label htmlFor="limite" className="label-xs block mb-2">
              Limite de leads em aberto
            </label>
            <div className="flex gap-2">
              <input
                id="limite"
                type="number"
                min={1}
                value={limite}
                onChange={(e) => setLimite(e.target.value)}
                className="flex-1 h-10 px-3 rounded-md bg-bg-tertiary border border-border text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => salvarLimite.mutate()}
                disabled={!limiteDirty || salvarLimite.isPending}
                className="h-10 px-4 rounded-md bg-heaven-orange hover:bg-heaven-orange-deep text-primary-foreground text-sm font-medium disabled:opacity-40"
              >
                {salvarLimite.isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatHero({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-secondary hairline-top border border-border rounded-lg p-4">
      <div className="label-xs">{label}</div>
      <div className="font-mono text-[32px] leading-tight font-bold mt-1 truncate">{children}</div>
    </div>
  );
}
