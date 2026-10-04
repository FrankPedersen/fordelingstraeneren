import type { SolveRequest, SolveResponse } from './results';

/**
 * Løseren på forespørgsel (Analyse fase 2): kører i en Web Worker, så appen ikke fryser. Uden Workers (fx i testene)
 * regnes i samme tråd; løseren hentes da dovent, så den ikke er en del af skærmens bundt.
 */
export interface SolverClient {
  solve(request: SolveRequest): Promise<SolveResponse>;
  /** Stopper beregningen; en igangværende forespørgsel afvises. */
  cancel(): void;
}

export class SolveCancelled extends Error {
  constructor() {
    super('Beregningen blev stoppet');
  }
}

export function createSolver(): SolverClient {
  if (typeof Worker === 'undefined') {
    let cancelled = 0;
    return {
      async solve(request) {
        const ticket = cancelled;
        const { handleSolve } = await import('./results');
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (ticket !== cancelled) throw new SolveCancelled();
        return handleSolve(request);
      },
      cancel() {
        cancelled++;
      },
    };
  }
  let worker: Worker | null = null;
  let next = 0;
  const pending = new Map<number, { resolve(r: SolveResponse): void; reject(e: Error): void }>();
  const start = () => {
    const w = new Worker(new URL('./solver.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (event: MessageEvent<{ id: number; response?: SolveResponse; error?: string }>) => {
      const job = pending.get(event.data.id);
      if (!job) return;
      pending.delete(event.data.id);
      if (event.data.response) job.resolve(event.data.response);
      else job.reject(new Error(event.data.error ?? 'Ukendt fejl i løseren'));
    };
    return w;
  };
  return {
    solve(request) {
      worker ??= start();
      const id = next++;
      const w = worker;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        w.postMessage({ id, request });
      });
    },
    cancel() {
      worker?.terminate();
      worker = null;
      for (const job of pending.values()) job.reject(new SolveCancelled());
      pending.clear();
    },
  };
}
