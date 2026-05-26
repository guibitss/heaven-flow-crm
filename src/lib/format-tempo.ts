export function formatarTempo(segundos: number | null | undefined): string {
  if (segundos === null || segundos === undefined) return "—";
  const s = Math.max(0, Math.floor(segundos));
  if (s < 60) return `${s}s`;
  if (s < 3600) {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return rs ? `${m}m ${rs}s` : `${m}m`;
  }
  if (s < 86400) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  return h ? `${d}d ${h}h` : `${d}d`;
}

export type TempoColor = "success" | "warning" | "danger";

export function corPorTempo(segundos: number): TempoColor {
  if (segundos <= 1800) return "success";
  if (segundos <= 7200) return "warning";
  return "danger";
}

export function corTempoHex(c: TempoColor): string {
  return c === "success" ? "#22c55e" : c === "warning" ? "#F27F1B" : "#ef4444";
}

export function corTempoClass(c: TempoColor): string {
  return c === "success" ? "text-success" : c === "warning" ? "text-heaven-orange" : "text-danger";
}
