// Formatação de CNAE. A fórmula NATIVA de score do banco (calcular_score_lead)
// faz substring(cnae,1,5) e compara com prefixos PONTUADOS ('43.21','35.11'...).
// Logo, leads precisam guardar o CNAE no formato 'DD.DD-D/DD' (não dígitos puros),
// senão o peso de CNAE cai sempre no 'default'.

const onlyDigits = (s: string) => (s ?? "").replace(/\D/g, "");

/** '4321500' -> '43.21-5/00'. Aceita já-formatado (idempotente). '' se inválido. */
export function formatCnae(input: string): string {
  const d = onlyDigits(input);
  if (d.length !== 7) return "";
  return `${d.slice(0, 2)}.${d.slice(2, 4)}-${d.slice(4, 5)}/${d.slice(5, 7)}`;
}

/** Os 5 primeiros chars do CNAE formatado, ex. '43.21' — o que o score compara. */
export function cnaePrefix(cnaeFormatado: string): string {
  return (cnaeFormatado ?? "").slice(0, 5);
}
