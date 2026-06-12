// LGPD — zona fria do app: compliance em cinzas e tipografia, zero laranja
// ambiente. Dados reais via hooks de src/hooks/use-lgpd.ts.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import {
  Ban,
  ChevronDown,
  Download,
  FileSearch,
  Inbox,
  Plus,
  Search,
  Shield,
  Trash2,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/empty-state";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  baixarJsonPortabilidade,
  useAddBlacklist,
  useAtualizarStatusSolicitacao,
  useBlacklist,
  useExportarPortabilidade,
  useLgpdSolicitacoes,
  useNovaSolicitacao,
  useOptOuts,
  useRemoveBlacklist,
  type SolicitacaoStatus,
  type SolicitacaoTipo,
} from "@/hooks/use-lgpd";

export const Route = createFileRoute("/_app/lgpd")({
  component: LgpdPage,
});

// -------------------------------------------------------------------- helpers

const TIPO_LABEL: Record<string, string> = {
  acesso: "Acesso aos dados",
  exclusao: "Exclusão",
  portabilidade: "Portabilidade",
  oposicao: "Oposição",
};

const STATUS_META: Record<string, { label: string; dot: string }> = {
  pendente: { label: "Pendente", dot: "bg-heaven-gray" },
  em_andamento: { label: "Em andamento", dot: "bg-info" },
  resolvida: { label: "Resolvida", dot: "bg-success" },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, dot: "bg-heaven-gray" };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </span>
  );
}

/** Prazo legal: 15 dias úteis (~21 corridos) a partir da solicitação. */
function PrazoChip({ solicitadaEm, resolvida }: { solicitadaEm: string; resolvida: boolean }) {
  if (resolvida) {
    return <span className="font-mono text-xs text-muted-foreground tabular-nums">—</span>;
  }
  const prazo = addDays(new Date(solicitadaEm), 21);
  const dias = differenceInCalendarDays(prazo, new Date());
  const vencido = dias < 0;
  return (
    <span
      className={cn(
        "font-mono text-xs tabular-nums",
        vencido ? "text-danger" : dias <= 5 ? "text-heat-4" : "text-muted-foreground",
      )}
      title={`Prazo legal: ${format(prazo, "dd/MM/yyyy")} (15 dias úteis)`}
    >
      {vencido ? `D+${Math.abs(dias)} vencido` : `D-${dias}`}
    </span>
  );
}

function formatarCnpj(cnpj: string): string {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function CardCompliance({
  title,
  desc,
  children,
  action,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-bg-secondary p-5 hairline-top">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {desc && <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{desc}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// -------------------------------------------------------------- solicitações

function NovaSolicitacaoDialog() {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<SolicitacaoTipo>("acesso");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const criar = useNovaSolicitacao();

  const submeter = () => {
    if (!email.trim()) return;
    criar.mutate(
      { tipo, titular_email: email.trim(), titular_documento: documento.trim(), detalhes: detalhes.trim() },
      {
        onSuccess: () => {
          setOpen(false);
          setEmail("");
          setDocumento("");
          setDetalhes("");
          setTipo("acesso");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-1.5 size-4" aria-hidden /> Nova solicitação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova solicitação de titular</DialogTitle>
          <DialogDescription>
            Registre o pedido recebido do titular dos dados. O prazo legal de resposta é de 15
            dias úteis.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="label-xs" htmlFor="sol-tipo">Tipo</label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as SolicitacaoTipo)}>
              <SelectTrigger id="sol-tipo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="acesso">Acesso aos dados</SelectItem>
                <SelectItem value="exclusao">Exclusão</SelectItem>
                <SelectItem value="portabilidade">Portabilidade</SelectItem>
                <SelectItem value="oposicao">Oposição</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="label-xs" htmlFor="sol-email">E-mail do titular *</label>
            <Input
              id="sol-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="titular@empresa.com.br"
            />
          </div>
          <div className="space-y-1.5">
            <label className="label-xs" htmlFor="sol-doc">Documento (CPF/CNPJ)</label>
            <Input
              id="sol-doc"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="Opcional"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="label-xs" htmlFor="sol-det">Detalhes</label>
            <Textarea
              id="sol-det"
              value={detalhes}
              onChange={(e) => setDetalhes(e.target.value)}
              className="h-20 resize-none"
              placeholder="Contexto do pedido (opcional)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submeter} disabled={!email.trim() || criar.isPending}>
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SolicitacoesSection() {
  const { data, isLoading } = useLgpdSolicitacoes();
  const atualizar = useAtualizarStatusSolicitacao();
  const { profile } = useAuth();

  const mudarStatus = (id: string, status: SolicitacaoStatus) =>
    atualizar.mutate({ id, status, resolvidaPor: profile?.id ?? null });

  return (
    <CardCompliance
      title="Solicitações de titulares"
      desc="Pedidos de acesso, exclusão, portabilidade e oposição. Prazo de resposta: 15 dias úteis."
      action={<NovaSolicitacaoDialog />}
    >
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full shimmer-heaven" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nenhuma solicitação registrada"
          description="Quando um titular exercer seus direitos, registre o pedido aqui para controlar o prazo legal."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left">
                <th className="label-xs pb-3 font-normal">Data</th>
                <th className="label-xs pb-3 font-normal">Tipo</th>
                <th className="label-xs pb-3 font-normal">Titular</th>
                <th className="label-xs pb-3 font-normal">Documento</th>
                <th className="label-xs pb-3 font-normal">Status</th>
                <th className="label-xs pb-3 font-normal">Prazo</th>
                <th className="label-xs pb-3 text-right font-normal">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((s) => (
                <tr key={s.id}>
                  <td className="py-3 font-mono text-xs text-muted-foreground tabular-nums">
                    {format(new Date(s.solicitada_em), "dd/MM/yyyy")}
                  </td>
                  <td className="py-3">{TIPO_LABEL[s.tipo] ?? s.tipo}</td>
                  <td className="max-w-48 truncate py-3">{s.titular_email}</td>
                  <td className="py-3 font-mono text-xs text-muted-foreground">
                    {s.titular_documento ?? "—"}
                  </td>
                  <td className="py-3"><StatusBadge status={s.status} /></td>
                  <td className="py-3">
                    <PrazoChip solicitadaEm={s.solicitada_em} resolvida={s.status === "resolvida"} />
                  </td>
                  <td className="py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" aria-label="Alterar status da solicitação">
                          Status <ChevronDown className="ml-1 size-3.5" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {s.status !== "pendente" && (
                          <DropdownMenuItem onClick={() => mudarStatus(s.id, "pendente")}>
                            Reabrir como pendente
                          </DropdownMenuItem>
                        )}
                        {s.status !== "em_andamento" && (
                          <DropdownMenuItem onClick={() => mudarStatus(s.id, "em_andamento")}>
                            Marcar em andamento
                          </DropdownMenuItem>
                        )}
                        {s.status !== "resolvida" && (
                          <DropdownMenuItem onClick={() => mudarStatus(s.id, "resolvida")}>
                            Marcar como resolvida
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardCompliance>
  );
}

// ------------------------------------------------------------------ blacklist

function BlacklistSection() {
  const { data, isLoading } = useBlacklist();
  const add = useAddBlacklist();
  const remove = useRemoveBlacklist();
  const { profile } = useAuth();

  const [cnpj, setCnpj] = useState("");
  const [razao, setRazao] = useState("");
  const [motivo, setMotivo] = useState("");
  const [removendo, setRemovendo] = useState<{ id: string; cnpj: string } | null>(null);

  const digitos = cnpj.replace(/\D/g, "");
  const cnpjValido = digitos.length === 14;

  const adicionar = () => {
    if (!cnpjValido) return;
    add.mutate(
      { cnpj: digitos, razao_social: razao.trim(), motivo: motivo.trim(), adicionadoPor: profile?.id ?? null },
      {
        onSuccess: () => {
          setCnpj("");
          setRazao("");
          setMotivo("");
        },
      },
    );
  };

  return (
    <CardCompliance
      title="Blacklist"
      desc="CNPJs nesta lista nunca serão captados nem contatados pelo agente."
    >
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[200px_1fr_1fr_auto]">
        <div>
          <Input
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            placeholder="CNPJ (14 dígitos)"
            className="font-mono"
            aria-label="CNPJ para bloquear"
            aria-invalid={cnpj.length > 0 && !cnpjValido}
          />
          {cnpj.length > 0 && !cnpjValido && (
            <p className="mt-1 text-xs text-danger">CNPJ deve ter 14 dígitos ({digitos.length}/14)</p>
          )}
        </div>
        <Input
          value={razao}
          onChange={(e) => setRazao(e.target.value)}
          placeholder="Razão social (opcional)"
          aria-label="Razão social"
        />
        <Input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo (opcional)"
          aria-label="Motivo do bloqueio"
        />
        <Button variant="outline" onClick={adicionar} disabled={!cnpjValido || add.isPending}>
          <Ban className="mr-1.5 size-4" aria-hidden /> Bloquear
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-16 w-full shimmer-heaven" />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Ban}
          title="Nenhum CNPJ bloqueado"
          description="Adicione um CNPJ acima para impedir que ele seja captado ou contatado."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left">
                <th className="label-xs pb-3 font-normal">CNPJ</th>
                <th className="label-xs pb-3 font-normal">Razão social</th>
                <th className="label-xs pb-3 font-normal">Motivo</th>
                <th className="label-xs pb-3 font-normal">Adicionado em</th>
                <th className="label-xs pb-3 text-right font-normal">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((b) => (
                <tr key={b.id}>
                  <td className="py-3 font-mono text-xs tabular-nums">{formatarCnpj(b.cnpj)}</td>
                  <td className="max-w-56 truncate py-3">{b.razao_social ?? "—"}</td>
                  <td className="max-w-56 truncate py-3 text-muted-foreground">{b.motivo ?? "—"}</td>
                  <td className="py-3 font-mono text-xs text-muted-foreground tabular-nums">
                    {b.created_at ? format(new Date(b.created_at), "dd/MM/yyyy") : "—"}
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemovendo({ id: b.id, cnpj: b.cnpj })}
                      aria-label={`Remover ${formatarCnpj(b.cnpj)} da blacklist`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!removendo} onOpenChange={(o) => !o && setRemovendo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover da blacklist?</AlertDialogTitle>
            <AlertDialogDescription>
              O CNPJ {removendo ? formatarCnpj(removendo.cnpj) : ""} voltará a ser elegível para
              captação e contato pelo agente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removendo) remove.mutate(removendo.id);
                setRemovendo(null);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CardCompliance>
  );
}

// -------------------------------------------------------------------- opt-out

function OptOutSection() {
  const { data, isLoading } = useOptOuts();

  return (
    <CardCompliance
      title="Opt-out"
      desc="Leads que pediram para não receber mais mensagens. O agente respeita o opt-out automaticamente."
    >
      {isLoading ? (
        <Skeleton className="h-16 w-full shimmer-heaven" />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="Nenhum opt-out registrado"
          description="Nenhum lead pediu interrupção de contato até agora."
        />
      ) : (
        <div className="space-y-3">
          <p className="font-mono text-sm tabular-nums">
            {data.length} {data.length === 1 ? "lead com opt-out ativo" : "leads com opt-out ativo"}
          </p>
          <ul className="divide-y divide-border">
            {data.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <Link
                  to="/crm/$id"
                  params={{ id: c.lead_id }}
                  className="truncate underline-offset-4 hover:underline"
                >
                  {(c.lead as { razao_social?: string } | null)?.razao_social ?? c.lead_id}
                </Link>
                <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                  {c.opt_out_em ? format(new Date(c.opt_out_em), "dd/MM/yyyy HH:mm") : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </CardCompliance>
  );
}

// -------------------------------------------------------------- portabilidade

function PortabilidadeSection() {
  const [termo, setTermo] = useState("");
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const exportar = useExportarPortabilidade();

  const buscar = () => {
    if (!termo.trim()) return;
    setNaoEncontrado(false);
    exportar.mutate(termo, {
      onSuccess: (payload) => {
        if (payload) {
          baixarJsonPortabilidade(payload);
        } else {
          setNaoEncontrado(true);
        }
      },
    });
  };

  return (
    <CardCompliance
      title="Exportação de portabilidade"
      desc="Busque o titular por telefone ou e-mail e baixe um JSON com os dados do lead e o histórico de mensagens."
    >
      <div className="flex flex-col gap-2 sm:max-w-lg sm:flex-row">
        <Input
          value={termo}
          onChange={(e) => {
            setTermo(e.target.value);
            setNaoEncontrado(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
          placeholder="Telefone ou e-mail do titular"
          aria-label="Telefone ou e-mail do titular"
        />
        <Button variant="outline" onClick={buscar} disabled={!termo.trim() || exportar.isPending}>
          {exportar.isPending ? (
            <Search className="mr-1.5 size-4 animate-pulse" aria-hidden />
          ) : (
            <Download className="mr-1.5 size-4" aria-hidden />
          )}
          Buscar e exportar
        </Button>
      </div>
      {naoEncontrado && (
        <div className="mt-4">
          <EmptyState
            icon={FileSearch}
            title="Nenhum lead encontrado"
            description={`Não há lead com telefone ou e-mail correspondente a "${termo}". Confira o dado informado pelo titular.`}
          />
        </div>
      )}
    </CardCompliance>
  );
}

// ----------------------------------------------------------------------- page

function LgpdPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-bg-secondary">
          <Shield className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">LGPD</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Direitos dos titulares, blacklist e consentimentos
          </p>
        </div>
      </div>

      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        O tratamento de dados neste CRM se apoia no legítimo interesse (art. 7º, IX da LGPD) para
        prospecção B2B, utilizando dados cadastrais públicos de empresas obtidos junto à Receita
        Federal e fontes abertas. Titulares podem, a qualquer momento, solicitar acesso, exclusão,
        portabilidade ou se opor ao tratamento — registre e acompanhe cada pedido abaixo dentro do
        prazo legal de 15 dias úteis.
      </p>

      <SolicitacoesSection />
      <BlacklistSection />
      <OptOutSection />
      <PortabilidadeSection />
    </div>
  );
}
