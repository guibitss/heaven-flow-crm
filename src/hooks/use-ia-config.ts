// use-ia-config — estado editável de configuracoes_ia (id=1) com snapshot,
// flag initialized e persistência via upsert. Consumido por src/routes/_app/ia.tsx.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type FollowUp = { dias: number; mensagem: string };
export type PerguntaItem = { id: string; texto: string };

export type IaConfigForm = {
  mensagemAbertura: string;
  varianteB: string;
  perguntas: PerguntaItem[];
  /** Horas decimais 0–24 (8.5 = 08:30) */
  horarioInicio: number;
  horarioFim: number;
  /** ['seg','ter','qua','qui','sex','sab','dom'] */
  diasSemana: string[];
  reativacao: FollowUp[];
};

export const FOLLOWUPS_SUGERIDOS: FollowUp[] = [
  { dias: 3, mensagem: "Olá! Ainda não conseguimos conversar — posso te ajudar com algo sobre estruturas para painéis solares?" },
  { dias: 6, mensagem: "Seguimos à disposição. Quer que eu envie um material rápido sobre nossos diferenciais?" },
  { dias: 9, mensagem: "Última tentativa por aqui. Se preferir, te mando uma proposta direto neste WhatsApp." },
];

function novoId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function horaParaDecimal(h: string | null, fallback: number): number {
  if (!h) return fallback;
  const [hh, mm] = String(h).split(":");
  const v = Number(hh) + Number(mm ?? 0) / 60;
  return Number.isFinite(v) ? v : fallback;
}

export function decimalParaHora(v: number): string {
  const hh = Math.floor(v);
  const mm = Math.round((v - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
}

export function formatarHora(v: number): string {
  return decimalParaHora(v).slice(0, 5);
}

function normalizarPerguntas(raw: unknown): PerguntaItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => {
      if (typeof p === "string") return p;
      if (p && typeof p === "object" && "pergunta" in p) return String((p as { pergunta: unknown }).pergunta ?? "");
      return "";
    })
    .filter((t) => t.trim().length > 0)
    .map((texto) => ({ id: novoId(), texto }));
}

function normalizarReativacao(raw: unknown): FollowUp[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
    .map((t) => ({ dias: Number(t.dias) || 0, mensagem: String(t.mensagem ?? "") }))
    .filter((t) => t.dias > 0)
    .sort((a, b) => a.dias - b.dias);
}

type Row = {
  mensagem_abertura: string | null;
  variante_b: string | null;
  perguntas_qualificacao: unknown;
  horario_inicio: string | null;
  horario_fim: string | null;
  dias_semana: string[] | null;
  reativacao: unknown;
} | null;

function rowParaForm(row: Row): IaConfigForm {
  return {
    mensagemAbertura: row?.mensagem_abertura ?? "",
    varianteB: row?.variante_b ?? "",
    perguntas: normalizarPerguntas(row?.perguntas_qualificacao),
    horarioInicio: horaParaDecimal(row?.horario_inicio ?? null, 8),
    horarioFim: horaParaDecimal(row?.horario_fim ?? null, 18),
    diasSemana: Array.isArray(row?.dias_semana) && row.dias_semana.length
      ? row.dias_semana.map((d) => d.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase())
      : ["seg", "ter", "qua", "qui", "sex"],
    reativacao: normalizarReativacao(row?.reativacao),
  };
}

/** Snapshot comparável (ids locais das perguntas fora da comparação). */
function fingerprint(f: IaConfigForm): string {
  return JSON.stringify({
    ...f,
    perguntas: f.perguntas.map((p) => p.texto),
  });
}

export function useIaConfig() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["configuracoes_ia"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracoes_ia")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState<IaConfigForm | null>(null);
  const [snapshot, setSnapshot] = useState<IaConfigForm | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (query.isSuccess && !initialized.current) {
      initialized.current = true;
      const f = rowParaForm(query.data as Row);
      setForm(f);
      setSnapshot(f);
    }
  }, [query.isSuccess, query.data]);

  const dirty = useMemo(
    () => !!form && !!snapshot && fingerprint(form) !== fingerprint(snapshot),
    [form, snapshot],
  );

  const patch = useCallback((p: Partial<IaConfigForm>) => {
    setForm((f) => (f ? { ...f, ...p } : f));
  }, []);

  const discard = useCallback(() => {
    setForm(snapshot);
  }, [snapshot]);

  const saveMutation = useMutation({
    mutationFn: async (f: IaConfigForm) => {
      const { error } = await supabase.from("configuracoes_ia").upsert({
        id: 1,
        mensagem_abertura: f.mensagemAbertura,
        variante_b: f.varianteB || null,
        perguntas_qualificacao: f.perguntas.map((p) => p.texto).filter((t) => t.trim().length > 0),
        horario_inicio: decimalParaHora(f.horarioInicio),
        horario_fim: decimalParaHora(f.horarioFim),
        dias_semana: f.diasSemana,
        reativacao: f.reativacao,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return f;
    },
    onSuccess: (f) => {
      setSnapshot(f);
      qc.invalidateQueries({ queryKey: ["configuracoes_ia"] });
      toast.success("Configurações da IA salvas");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao salvar configurações"),
  });

  const save = useCallback(() => {
    if (form) saveMutation.mutate(form);
  }, [form, saveMutation]);

  return {
    form,
    patch,
    dirty,
    saving: saveMutation.isPending,
    save,
    discard,
    isLoading: query.isLoading,
    novaPergunta: (texto = ""): PerguntaItem => ({ id: novoId(), texto }),
  };
}

export function useReprocessarScores() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("reprocessar_scores");
      if (error) throw error;
      return data as number;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`${n ?? 0} leads reprocessados`);
    },
    onError: (e: Error) => {
      const msg = e.message?.toLowerCase() ?? "";
      if (msg.includes("permission") || msg.includes("denied") || msg.includes("not allowed")) {
        toast.error("Sem permissão: apenas gestores e administradores podem reprocessar scores.");
      } else {
        toast.error(e.message || "Erro ao reprocessar scores");
      }
    },
  });
}
