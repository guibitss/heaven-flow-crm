// Rampa térmica — fonte única de cor de estado do app (frio → quente).
// Espelha os tokens CSS --heat-1..--heat-6 de src/styles.css.
// Regra: cor NUNCA carrega informação sozinha — sempre acompanhe de texto/valor.

import type { Database } from "@/integrations/supabase/types";

export const HEAT = [
  "#595954", // 1 — cinza (frio/apagado)
  "#8C4A1F", // 2
  "#A63005", // 3 — rust
  "#D9560B", // 4 — orange deep
  "#F27F1B", // 5 — heaven orange
  "#FFA94D", // 6 — brasa clara (máximo)
] as const;

export type Temperatura = Database["public"]["Enums"]["lead_temperatura"];
export type LeadStatus = Database["public"]["Enums"]["lead_status"];

/** Cor da rampa para um score 0-100. */
export function heatColor(score: number | null | undefined): string {
  if (score == null) return HEAT[0];
  const s = Math.max(0, Math.min(100, score));
  return HEAT[Math.min(5, Math.floor((s / 100) * 6))];
}

export function corPorTemperatura(t: Temperatura | null | undefined): string {
  if (t === "quente") return HEAT[5];
  if (t === "morno") return HEAT[3];
  return HEAT[0];
}

export const TEMPERATURA_LABEL: Record<Temperatura, string> = {
  quente: "QUENTE",
  morno: "MORNO",
  frio: "FRIO",
};

/** Funil esquenta rumo ao fechamento (ganho = brasa máxima; perdido = cinza). */
export const STATUS_HEAT: Record<LeadStatus, string> = {
  bruto: HEAT[0],
  abordado: HEAT[1],
  respondeu: HEAT[2],
  qualificado: HEAT[3],
  negociacao: HEAT[4],
  ganho: HEAT[5],
  perdido: HEAT[0],
};

export const STATUS_LABEL: Record<LeadStatus, string> = {
  bruto: "Bruto",
  abordado: "Abordado",
  respondeu: "Respondeu",
  qualificado: "Qualificado",
  negociacao: "Negociação",
  ganho: "Ganho",
  perdido: "Perdido",
};

/** Ordem canônica do pipeline (sem 'perdido', que é zona à parte). */
export const PIPELINE_ORDER: LeadStatus[] = [
  "bruto",
  "abordado",
  "respondeu",
  "qualificado",
  "negociacao",
  "ganho",
];
