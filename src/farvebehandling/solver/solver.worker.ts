import { handleSolve, type SolveRequest } from './results';

/** Løseren i en Web Worker, så appen kan regne kombinationer og egne linjer uden at fryse. */
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<{ id: number; request: SolveRequest }>) => void) | null;
  postMessage(message: unknown): void;
};

scope.onmessage = (event) => {
  const { id, request } = event.data;
  try {
    scope.postMessage({ id, response: handleSolve(request) });
  } catch (error) {
    scope.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
