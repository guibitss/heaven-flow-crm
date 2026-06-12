// Helpers compartilhados do CRM (kanban + dossiê). PT-BR, sem dependências novas.

export const FONTE_LABEL: Record<string, string> = {
  google_maps: "Google Maps",
  receita_federal: "Receita Federal",
  indicacao: "Indicação",
  manual: "Manual",
};

/** Lista canônica das 27 UFs brasileiras. */
export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO",
  "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR",
  "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const brlFull = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

/** R$ compacto (R$ 1,2 mi) para headers de coluna. */
export function formatBRLCompact(v: number): string {
  return brlCompact.format(v);
}

/** R$ inteiro (R$ 12.500) para valores de card/campo. */
export function formatBRL(v: number): string {
  return brlFull.format(v);
}

/** Máscara progressiva de CNPJ: 00.000.000/0000-00. */
export function maskCnpj(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 14);
  let out = d;
  if (d.length > 2) out = `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length > 5) out = `${out.slice(0, 6)}.${out.slice(6)}`;
  if (d.length > 8) out = `${out.slice(0, 10)}/${out.slice(10)}`;
  if (d.length > 12) out = `${out.slice(0, 15)}-${out.slice(15)}`;
  return out;
}

/** Iniciais para fallback de avatar ("Maria Souza" → "MS"). */
export function iniciais(nome: string | null | undefined): string {
  if (!nome) return "?";
  const parts = nome.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
