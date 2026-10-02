import { mulberry32, shuffle } from '../../engine/rng';
import type { Difficulty } from '../../engine/session';
import { SUIT_SYMBOLS, type SuitLengths } from '../../domain/cards';
import { completions, type Completion } from '../../domain/complete';
import type { Pattern } from '../../domain/patterns';

export interface CompleteTask {
  kind: 'complete';
  seed: number;
  /** Mønstret for den hånd, opgaven er lavet af. */
  patternId: string;
  seat: 'E' | 'W';
  /** Hele hånden i farveordenen ♠♥♦♣; vises i facit. */
  lengths: SuitLengths;
  /** De viste farvelængder; null er en ukendt farve. */
  known: (number | null)[];
  /** Antal mønstre, der skal tastes. */
  count: number;
  /** true: alle mulige mønstre skal tastes; false: de `count` hyppigste. */
  all: boolean;
}

/**
 * Højst tre mønstre pr. opgave. SPEC.md beder om "de mulige mønstre", men med én kendt farve er
 * der 8–12 mulige. Er der flere end tre, bedes der derfor om de tre hyppigste, så opgaven kan
 * løses inden for tærsklen for hurtigt svar (10 s).
 */
export const MAX_PATTERNS = 3;

export function makeCompleteTask(seed: number, pattern: Pattern, difficulty: Difficulty): CompleteTask {
  const rng = mulberry32(seed);
  const lengths = shuffle([...pattern.lengths], rng) as [number, number, number, number];
  const seat = rng.int(2) === 0 ? 'E' : 'W';
  const suits = shuffle([0, 1, 2, 3], rng);
  // Let: de to længste farver, som meldingerne typisk viser. Normal: to tilfældige. Svær: én farve.
  const shown =
    difficulty === 'easy'
      ? [...suits].sort((x, y) => lengths[y] - lengths[x]).slice(0, 2)
      : suits.slice(0, difficulty === 'hard' ? 1 : 2);
  const known = lengths.map((l, i) => (shown.includes(i) ? l : null));
  const possible = completions(known).list.length;
  return {
    kind: 'complete',
    seed,
    patternId: pattern.id,
    seat,
    lengths,
    known,
    count: Math.min(MAX_PATTERNS, possible),
    all: possible <= MAX_PATTERNS,
  };
}

export interface Ranked {
  id: string;
  weight: bigint;
}

/**
 * Fuld score for rigtig mængde og rækkefølge, halv score for rigtig mængde. Lige hyppige
 * mønstre må stå i vilkårlig rækkefølge, også på grænsen til de `count` hyppigste.
 */
export function scoreRanking(
  candidates: readonly Ranked[],
  answer: readonly string[],
  count: number,
): 0 | 0.5 | 1 {
  const weight = new Map(candidates.map((c) => [c.id, c.weight]));
  if (answer.length !== count || new Set(answer).size !== count) return 0;
  if (!answer.every((id) => weight.has(id))) return 0;
  const chosen = answer.map((id) => weight.get(id)!);
  const lowest = chosen.reduce((min, w) => (w < min ? w : min));
  if (candidates.some((c) => !answer.includes(c.id) && c.weight > lowest)) return 0;
  return chosen.every((w, i) => i === 0 || w <= chosen[i - 1]) ? 1 : 0.5;
}

export function scoreComplete(task: CompleteTask, answer: readonly string[]): 0 | 0.5 | 1 {
  const ranked = completions(task.known).list.map((c) => ({ id: c.pattern.id, weight: c.weight }));
  return scoreRanking(ranked, answer, task.count);
}

/** Facit: alle mulige mønstre (hyppigste først) og de, der skulle tastes. */
export function completeFacit(task: CompleteTask): {
  total: bigint;
  list: Completion[];
  required: Completion[];
} {
  const { total, list } = completions(task.known);
  return { total, list, required: list.slice(0, task.count) };
}

/** De viste farver, fx "5♠ og 4♥". */
export function shownText(task: CompleteTask): string {
  return task.known.flatMap((l, i) => (l === null ? [] : [`${l}${SUIT_SYMBOLS[i]}`])).join(' og ');
}

export function instructionText(task: CompleteTask): string {
  if (task.count === 1) return 'Tast mønstret.';
  if (task.all) return 'Tast de mulige mønstre – hyppigste først.';
  return 'Tast de tre hyppigste mønstre – hyppigste først.';
}
