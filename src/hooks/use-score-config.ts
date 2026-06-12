import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// Score Studio — leitura/escrita de configuracoes_captacao.score_config (jsonb)
// e espelho client-side da fórmula SQL de score (trigger no banco).

export interface ScoreConfig {
  /** Peso por prefixo de CNAE ("dd.dd") + chave "default" para os demais. */
  cnae: Record<string, number>;
  capital: { divisor: number; max: number };
  porte: Record<string, number>; // GRANDE | MEDIA | EPP | ME
  uf: Record<string, number>; // 27 UFs + "default"
  completude: { telefone: number; site: number; decisor: number };
  temperatura: { quente: number; morno: number };
}

export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  cnae: {
    "35.11": 30,
    "35.14": 30,
    "43.21": 25,
    "43.22": 25,
    "71.12": 20,
    "47.42": 15,
    "46.73": 15,
    default: 5,
  },
  capital: { divisor: 20000, max: 25 },
  porte: { GRANDE: 20, MEDIA: 15, EPP: 10, ME: 5 },
  uf: {
    MG: 15,
    SP: 15,
    PR: 13,
    RS: 12,
    SC: 12,
    BA: 11,
    GO: 10,
    MT: 10,
    CE: 9,
    PE: 9,
    default: 5,
  },
  completude: { telefone: 4, site: 3, decisor: 3 },
  temperatura: { quente: 81, morno: 50 },
};

export const PORTES = ["GRANDE", "MEDIA", "EPP", "ME"] as const;

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO",
  "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR",
  "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function recordOf(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

/** Normaliza o jsonb do banco (vazio {} = padrão) para um ScoreConfig completo. */
export function normalizeScoreConfig(raw: Json | null | undefined): ScoreConfig {
  const r = recordOf(raw);
  const d = DEFAULT_SCORE_CONFIG;

  const cnaeRaw = recordOf(r.cnae);
  const cnae: Record<string, number> =
    Object.keys(cnaeRaw).length > 0
      ? Object.fromEntries(
          Object.entries(cnaeRaw).map(([k, v]) => [k, num(v, 0)]),
        )
      : { ...d.cnae };
  if (cnae.default == null) cnae.default = d.cnae.default;

  const capitalRaw = recordOf(r.capital);
  const porteRaw = recordOf(r.porte);
  const ufRaw = recordOf(r.uf);
  const compRaw = recordOf(r.completude);
  const tempRaw = recordOf(r.temperatura);

  const uf: Record<string, number> =
    Object.keys(ufRaw).length > 0
      ? Object.fromEntries(Object.entries(ufRaw).map(([k, v]) => [k, num(v, 0)]))
      : { ...d.uf };
  if (uf.default == null) uf.default = d.uf.default;

  return {
    cnae,
    capital: {
      divisor: num(capitalRaw.divisor, d.capital.divisor),
      max: num(capitalRaw.max, d.capital.max),
    },
    porte: {
      GRANDE: num(porteRaw.GRANDE, d.porte.GRANDE),
      MEDIA: num(porteRaw.MEDIA, d.porte.MEDIA),
      EPP: num(porteRaw.EPP, d.porte.EPP),
      ME: num(porteRaw.ME, d.porte.ME),
    },
    uf,
    completude: {
      telefone: num(compRaw.telefone, d.completude.telefone),
      site: num(compRaw.site, d.completude.site),
      decisor: num(compRaw.decisor, d.completude.decisor),
    },
    temperatura: {
      quente: num(tempRaw.quente, d.temperatura.quente),
      morno: num(tempRaw.morno, d.temperatura.morno),
    },
  };
}

export interface LeadSimulado {
  cnaePrefix: string;
  capitalSocial: number;
  porte: string;
  uf: string;
  temTelefone: boolean;
  temSite: boolean;
  temDecisor: boolean;
}

/** Espelha a fórmula SQL do trigger: cnae + min(capital/divisor, max) + porte + uf + completudes, clamp 0-100. */
export function calcularScore(cfg: ScoreConfig, lead: LeadSimulado): number {
  const pCnae = cfg.cnae[lead.cnaePrefix] ?? cfg.cnae.default ?? 0;
  const pCapital =
    cfg.capital.divisor > 0
      ? Math.min(Math.floor(lead.capitalSocial / cfg.capital.divisor), cfg.capital.max)
      : 0;
  const pPorte = cfg.porte[lead.porte] ?? 0;
  const pUf = cfg.uf[lead.uf] ?? cfg.uf.default ?? 0;
  const pComp =
    (lead.temTelefone ? cfg.completude.telefone : 0) +
    (lead.temSite ? cfg.completude.site : 0) +
    (lead.temDecisor ? cfg.completude.decisor : 0);
  return Math.max(0, Math.min(100, Math.round(pCnae + pCapital + pPorte + pUf + pComp)));
}

export function temperaturaDoScore(
  cfg: ScoreConfig,
  score: number,
): "quente" | "morno" | "frio" {
  if (score >= cfg.temperatura.quente) return "quente";
  if (score >= cfg.temperatura.morno) return "morno";
  return "frio";
}

/** Soma máxima teórica (sem o clamp de 100) — sanidade da calibragem. */
export function somaMaximaTeorica(cfg: ScoreConfig): number {
  const cnaeVals = Object.entries(cfg.cnae)
    .filter(([k]) => k !== "default")
    .map(([, v]) => v);
  const maxCnae = Math.max(cfg.cnae.default ?? 0, ...(cnaeVals.length ? cnaeVals : [0]));
  const ufVals = Object.entries(cfg.uf)
    .filter(([k]) => k !== "default")
    .map(([, v]) => v);
  const maxUf = Math.max(cfg.uf.default ?? 0, ...(ufVals.length ? ufVals : [0]));
  const maxPorte = Math.max(0, ...Object.values(cfg.porte));
  return (
    maxCnae +
    cfg.capital.max +
    maxPorte +
    maxUf +
    cfg.completude.telefone +
    cfg.completude.site +
    cfg.completude.decisor
  );
}

// ====== Query / Mutations ======

export function useScoreConfig() {
  return useQuery({
    queryKey: ["score-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracoes_captacao")
        .select("score_config")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return normalizeScoreConfig(data?.score_config ?? null);
    },
  });
}

export function useSaveScoreConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: ScoreConfig | Record<string, never>) => {
      const { error } = await supabase
        .from("configuracoes_captacao")
        .update({ score_config: config as unknown as Json })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["score-config"] });
      toast.success("Configuração de score salva.");
    },
    onError: (e: Error) => toast.error(`Erro ao salvar score: ${e.message}`),
  });
}

export function useReprocessarScores() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("reprocessar_scores");
      if (error) throw error;
      return data ?? 0;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dashboard-kpis"] });
      qc.invalidateQueries({ queryKey: ["funil"] });
      toast.success(
        n === 1 ? "1 lead reprocessado." : `${n} leads reprocessados.`,
      );
    },
    onError: (e: Error) => toast.error(`Erro ao reprocessar: ${e.message}`),
  });
}
