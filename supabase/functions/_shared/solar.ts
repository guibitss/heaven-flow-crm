// Heurística de "nome solar" — o sinal mais barato e forte para separar
// integradoras/instaladoras fotovoltaicas de eletricistas genéricos que caem
// no mesmo CNAE. Usado tanto no ETL da Receita quanto na qualificação.

// Termos que indicam atuação no setor solar (sem acento, lowercase).
const SOLAR_TERMS = [
  "solar",
  "fotovoltaic", // pega fotovoltaica/fotovoltaico
  "energia solar",
  "energia renovavel",
  "energias renovaveis",
  "geracao distribuida",
  " fv ", // sigla isolada
  "sun",
  "sol ", // "sol energia" etc. (com espaço para evitar "solenoide")
];

// Remove acentos e normaliza para minúsculas.
export function normalize(text: string): string {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Retorna true se o texto (nome fantasia / razão social) sugere setor solar.
export function looksSolar(text: string): boolean {
  if (!text) return false;
  const t = ` ${normalize(text)} `;
  return SOLAR_TERMS.some((term) => t.includes(term));
}
