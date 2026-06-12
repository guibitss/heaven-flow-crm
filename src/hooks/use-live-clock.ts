import { useSyncExternalStore } from "react";

// Relógio ÚNICO compartilhado (tick de 30s) para todos os contadores vivos
// (tempo aguardando resposta, indicadores do kanban...). Evita um setInterval
// por card — com board grande isso vira cascata de re-render.
// O interval só roda enquanto houver assinantes.

const TICK_MS = 30_000;

let now = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function start() {
  if (timer) return;
  timer = setInterval(() => {
    now = Date.now();
    listeners.forEach((l) => l());
  }, TICK_MS);
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  start();
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) stop();
  };
}

/** Timestamp (ms) atualizado a cada 30s — compartilhado por todo o app. */
export function useLiveClock(): number {
  return useSyncExternalStore(subscribe, () => now, () => now);
}
