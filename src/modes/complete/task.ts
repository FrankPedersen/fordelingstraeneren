import { mulberry32, shuffle } from '../../engine/rng';
import type { Difficulty } from '../../engine/session';
import { SUIT_SYMBOLS, type SuitLengths } from '../../domain/cards';
import { completions, type Completion } from '../../domain/complete';
import type { Pattern } from '../../domain/patterns';
import { tx } from '../../i18n';

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

/**
 * Antal mønstre, der mangler i svaret (SPEC-fuldfoer-dom.md). Skal alle mulige tastes (`all`), er det de mulige, der
 * ikke er tastet; et umuligt mønster tæller ikke med. Ellers er det `count` minus de tastede. 0: dommen er som før.
 */
export function missingCount(task: CompleteTask, answer: readonly string[]): number {
  if (task.all) return completions(task.known).list.filter((c) => !answer.includes(c.pattern.id)).length;
  return Math.max(0, task.count - answer.length);
}

/** Dommen, når der mangler mønstre: "✗ Forkert: der mangler 2 mønstre.", ental ved 1. */
export function missingVerdict(n: number): string {
  return n === 1
    ? tx('✗ Forkert: der mangler 1 mønster.', '✗ Wrong: 1 pattern is missing.')
    : tx(`✗ Forkert: der mangler ${n} mønstre.`, `✗ Wrong: ${n} patterns are missing.`);
}

/**
 * Facit, når det første tastede mønster er den faktiske hånds, men et andet er hyppigere (SPEC-fuldfoer-dom.md):
 * "Rækkefølgen er efter hyppighed. Vests hånd var den næsthyppigste." Rangen er delt: 1 + antal strengt hyppigere
 * mulige mønstre; fra 4 står den som tal ("nr. 4 i hyppighed"). null, når sætningen ikke skal stå.
 */
export function orderText(task: CompleteTask, answer: readonly string[]): string | null {
  if (answer[0] !== task.patternId) return null;
  const list = completions(task.known).list;
  const own = list.find((c) => c.pattern.id === task.patternId);
  if (!own) return null;
  const rank = 1 + list.filter((c) => c.weight > own.weight).length;
  if (rank === 1) return null;
  const whose = task.seat === 'W' ? tx('Vests', "West's") : tx('Østs', "East's");
  const place =
    rank === 2
      ? tx('den næsthyppigste', 'the second most frequent')
      : rank === 3
        ? tx('den tredjehyppigste', 'the third most frequent')
        : tx(`nr. ${rank} i hyppighed`, `no. ${rank} by frequency`);
  return tx(`Rækkefølgen er efter hyppighed. ${whose} hånd var ${place}.`, `The order is by frequency. ${whose} hand was ${place}.`);
}

/** De viste farver, fx "5♠ og 4♥". */
export function shownText(task: CompleteTask): string {
  return task.known.flatMap((l, i) => (l === null ? [] : [`${l}${SUIT_SYMBOLS[i]}`])).join(tx(' og ', ' and '));
}

export function instructionText(task: CompleteTask): string {
  if (task.count === 1) return tx('Hvilket mønster er det?', 'Which pattern is it?');
  if (task.all) return tx('Hvilke mønstre er mulige? Hyppigste først.', 'Which patterns are possible? Most frequent first.');
  return tx('Hvilke tre mønstre er hyppigst? Hyppigste først.', 'Which three patterns are most frequent? Most frequent first.');
}
