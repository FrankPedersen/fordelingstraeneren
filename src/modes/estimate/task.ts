import { CLUB_PATTERNS, patternById, type Pattern } from '../../domain/patterns';

export { CLUB_PATTERNS };

export interface EstimateTask {
  kind: 'estimate';
  seed: number;
  patternId: string;
}

export function makeEstimateTask(seed: number, pattern: Pattern): EstimateTask {
  return { kind: 'estimate', seed, patternId: pattern.id };
}

/** Rigtigt inden for ±1 for antal op til 10 og ±2 derover. */
export function estimateTolerance(count: number): number {
  return count <= 10 ? 1 : 2;
}

export function checkEstimate(task: EstimateTask, answer: number): boolean {
  const count = patternById(task.patternId).per100;
  return Math.abs(answer - count) <= estimateTolerance(count);
}
