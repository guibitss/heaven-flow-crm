import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

// EmberField — campo de fagulhas do login. Canvas 2D com pool fixo reusado,
// spawn gradual ("a usina liga de baixo pra cima"), pausa em aba oculta/blur
// e teardown completo. Zero interação com mouse. aria-hidden.

interface EmberFieldProps {
  /** Quando true, faz fade-out de 300ms (login bem-sucedido antes do redirect). */
  fadeOut?: boolean;
}

type Particle = {
  alive: boolean;
  x: number;
  y: number;
  vy: number; // px/s (negativo = sobe)
  driftAmp: number;
  driftFreq: number;
  driftPhase: number;
  radius: number;
  life: number; // s decorridos
  maxLife: number; // s
  color: string; // rgb base "r,g,b"
  toAsh: boolean; // interpola p/ cinza no último terço
  isAsh: boolean; // partícula de cinza
};

const EMBER_COLORS: Array<{ rgb: [number, number, number]; weight: number }> = [
  { rgb: [242, 127, 27], weight: 0.7 }, // #F27F1B
  { rgb: [217, 86, 11], weight: 0.2 }, // #D9560B
  { rgb: [166, 48, 5], weight: 0.1 }, // #A63005
];
const ASH_RGB: [number, number, number] = [89, 89, 84]; // #595954

function pickEmberColor(): [number, number, number] {
  const r = Math.random();
  if (r < 0.7) return EMBER_COLORS[0].rgb;
  if (r < 0.9) return EMBER_COLORS[1].rgb;
  return EMBER_COLORS[2].rgb;
}

function spawn(p: Particle, w: number, h: number, isAsh: boolean) {
  p.alive = true;
  p.isAsh = isAsh;
  p.x = Math.random() * w;
  p.y = h + 10;
  p.vy = isAsh ? -(8 + Math.random() * 10) : -(18 + Math.random() * 27); // 18–45 px/s
  p.driftAmp = 6 + Math.random() * 8; // 6–14px
  p.driftFreq = 0.4 + Math.random() * 0.8;
  p.driftPhase = Math.random() * Math.PI * 2;
  p.radius = isAsh ? 0.8 + Math.random() * 1.0 : 0.8 + Math.random() * 1.4; // 0.8–2.2
  p.life = 0;
  p.maxLife = 4 + Math.random() * 5; // 4–9s
  p.toAsh = !isAsh && Math.random() < 0.1;
  const c = isAsh ? ASH_RGB : pickEmberColor();
  p.color = `${c[0]},${c[1]},${c[2]}`;
}

function StaticFallback() {
  // Fallback estático p/ prefers-reduced-motion: brasa parada, sem animação.
  const dots: Array<{ cx: number; cy: number; r: number; a: number }> = [
    { cx: 12, cy: 88, r: 1.6, a: 0.5 },
    { cx: 28, cy: 74, r: 1.0, a: 0.3 },
    { cx: 41, cy: 92, r: 2.0, a: 0.6 },
    { cx: 55, cy: 80, r: 1.2, a: 0.35 },
    { cx: 66, cy: 90, r: 1.5, a: 0.45 },
    { cx: 78, cy: 76, r: 0.9, a: 0.25 },
    { cx: 88, cy: 86, r: 1.8, a: 0.55 },
    { cx: 95, cy: 70, r: 1.0, a: 0.2 },
  ];
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse at 50% 100%, rgba(242,127,27,0.12), transparent 55%)",
      }}
    >
      <svg
        className="absolute inset-0 h-full w-full text-heaven-orange"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="currentColor" opacity={d.a} />
        ))}
      </svg>
    </div>
  );
}

export function EmberField({ fadeOut = false }: EmberFieldProps) {
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const MAX_EMBERS = isMobile ? 20 : 40;
    const MAX_ASH = 12;
    const TOTAL = MAX_EMBERS + MAX_ASH;
    const SPAWN_INTERVAL = 0.12; // s — 1 partícula a cada 120ms (ramp-up ~4s)

    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      if (!canvas || !ctx) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    // Pool fixo — nada é alocado dentro do loop.
    const pool: Particle[] = Array.from({ length: TOTAL }, () => ({
      alive: false, x: 0, y: 0, vy: 0, driftAmp: 0, driftFreq: 0, driftPhase: 0,
      radius: 0, life: 0, maxLife: 1, color: "0,0,0", toAsh: false, isAsh: false,
    }));

    let activated = 0; // quantas partículas já foram liberadas (spawn gradual)
    let spawnAcc = 0;
    let raf = 0;
    let last = 0;
    let paused = false;
    let resizeTimer = 0;

    function frame(now: number) {
      if (!ctx) return;
      if (!last) last = now;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Spawn gradual: ativa 1 a cada 120ms até o teto.
      if (activated < TOTAL) {
        spawnAcc += dt;
        while (spawnAcc >= SPAWN_INTERVAL && activated < TOTAL) {
          spawnAcc -= SPAWN_INTERVAL;
          // Cinzas entram intercaladas: 1 a cada ~4 ativações, até MAX_ASH.
          const ashSoFar = pool.reduce((n, p) => n + (p.isAsh ? 1 : 0), 0);
          const isAsh = activated % 4 === 3 && ashSoFar < MAX_ASH;
          spawn(pool[activated], width, height, isAsh);
          activated++;
        }
      }

      ctx.clearRect(0, 0, width, height);
      const cutoff = height * 0.55; // acima disso, alpha zera (morre antes do card)

      for (let i = 0; i < activated; i++) {
        const p = pool[i];
        if (!p.alive) {
          spawn(p, width, height, p.isAsh);
          continue;
        }
        p.life += dt;
        if (p.life >= p.maxLife) { p.alive = false; continue; }

        p.y += p.vy * dt;
        const x = p.x + Math.sin(p.life * p.driftFreq * Math.PI * 2 + p.driftPhase) * p.driftAmp;

        if (p.y < -10) { p.alive = false; continue; }

        // Fade nos últimos 30% da vida.
        const t = p.life / p.maxLife;
        let alpha = t > 0.7 ? (1 - t) / 0.3 : 1;

        // Contenção vertical: zera acima de 55% da altura (y menor = mais alto).
        if (p.y < cutoff) {
          alpha = 0;
          p.alive = false;
          continue;
        }
        const fadeZone = cutoff + height * 0.12;
        if (p.y < fadeZone) alpha *= (p.y - cutoff) / (fadeZone - cutoff);

        let r: number, g: number, b: number;
        if (p.isAsh) {
          [r, g, b] = ASH_RGB;
          alpha *= 0.15;
        } else {
          const parts = p.color.split(",");
          r = +parts[0]; g = +parts[1]; b = +parts[2];
          if (p.toAsh && t > 2 / 3) {
            const k = (t - 2 / 3) * 3; // 0→1 no último terço
            r = r + (ASH_RGB[0] - r) * k;
            g = g + (ASH_RGB[1] - g) * k;
            b = b + (ASH_RGB[2] - b) * k;
          }
        }
        alpha *= 0.85; // alpha global

        if (alpha <= 0.005) continue;

        const big = !p.isAsh && p.radius > 1.6;
        if (big) {
          ctx.globalCompositeOperation = "lighter";
          ctx.shadowBlur = 4;
          ctx.shadowColor = `rgba(${r | 0},${g | 0},${b | 0},${alpha})`;
        } else {
          ctx.globalCompositeOperation = "source-over";
          ctx.shadowBlur = 0;
        }
        ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (paused || raf) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    const onVisibility = () => {
      paused = document.hidden;
      paused ? stop() : start();
    };
    const onBlur = () => { paused = true; stop(); };
    const onFocus = () => { paused = false; start(); };
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 200);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("resize", onResize);
    start();

    return () => {
      stop();
      window.clearTimeout(resizeTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced]);

  if (reduced) return <StaticFallback />;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full pointer-events-none transition-opacity duration-300"
      style={{ opacity: fadeOut ? 0 : 1 }}
    />
  );
}
