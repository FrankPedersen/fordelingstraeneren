import { mulberry32 } from '../../engine/rng';
import type { Difficulty } from '../../engine/session';
import { compareFrequency, type Frequency } from '../../domain/compare';
import { patternById, type Pattern } from '../../domain/patterns';

export interface HigherLowerTask {
  kind: 'higher-lower';
  seed: number;
  /** Mønstret, opgaven er lavet for. */
  patternId: string;
  /** Mønstrene til venstre og højre. */
  a: string;
  b: string;
}

/** Brugeren trykker på det hyppigste mønster (a eller b) eller på ≈. */
export type HigherLowerAnswer = Frequency;

/**
 * Parrer mønstret med et andet fra puljen. Svær: nabo-rang, helst fra samme grad.
 * Let: mindst tre pladser imellem. Uden mønster vælges et tilfældigt fra puljen.
 */
export function makeHigherLowerTask(
  seed: number,
  pattern: Pattern | null,
  pool: readonly Pattern[],
  difficulty: Difficulty,
): HigherLowerTask {
  const rng = mulberry32(seed);
  const main = pattern ?? pool[rng.int(pool.length)];
  const others = pool.filter((p) => p.id !== main.id);
  if (others.length === 0) throw new Error('Puljen skal rumme mindst to mønstre');

  const distance = (p: Pattern) => Math.abs(p.rank - main.rank);
  let candidates = others;
  if (difficulty === 'hard') {
    const hardness = (p: Pattern) => distance(p) * 2 + (p.grade === main.grade ? 0 : 1);
    const best = Math.min(...others.map(hardness));
    candidates = others.filter((p) => hardness(p) === best);
  } else if (difficulty === 'easy') {
    const far = others.filter((p) => distance(p) >= 3);
    const farthest = Math.max(...others.map(distance));
    candidates = far.length > 0 ? far : others.filter((p) => distance(p) === farthest);
  }

  const partner = candidates[rng.int(candidates.length)];
  const [a, b] = rng.int(2) === 0 ? [main, partner] : [partner, main];
  return { kind: 'higher-lower', seed, patternId: main.id, a: a.id, b: b.id };
}

export function checkHigherLower(task: HigherLowerTask, answer: HigherLowerAnswer): boolean {
  return compareFrequency(patternById(task.a), patternById(task.b)) === answer;
}
