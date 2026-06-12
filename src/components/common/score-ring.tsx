import { heatColor } from "@/lib/heat";
import { cn } from "@/lib/utils";

// ScoreRing — anel SVG colorido pela rampa térmica conforme o score (0-100).
// Tamanhos: 20px (card do kanban), 40px (header do detalhe), 64px (perfil).
// Acessibilidade: o número é parte do anel (cor nunca sozinha).

interface ScoreRingProps {
  score: number | null | undefined;
  size?: number;
  strokeWidth?: number;
  /** Mostra o número no centro (oculte só se o valor estiver ao lado). */
  showValue?: boolean;
  className?: string;
}

export function ScoreRing({
  score,
  size = 20,
  strokeWidth,
  showValue = true,
  className,
}: ScoreRingProps) {
  const s = score == null ? 0 : Math.max(0, Math.min(100, score));
  const sw = strokeWidth ?? Math.max(2, size / 10);
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const color = heatColor(score);

  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score ${score ?? "—"}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={sw}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * s) / 100}
        />
      </svg>
      {showValue && size >= 32 && (
        <span
          className="absolute font-mono font-semibold"
          style={{ fontSize: size / 3.2, color }}
        >
          {score ?? "—"}
        </span>
      )}
    </span>
  );
}
