import { mulberry32, shuffle } from '../../engine/rng';
import { suitLengths, type Card } from '../../domain/cards';
import { deal } from '../../domain/dealer';
import { patternOf, type Pattern } from '../../domain/patterns';

export interface ReadTask {
  kind: 'read';
  seed: number;
  patternId: string;
  /** De 13 kort i den rækkefølge, de blev givet (usorteret). */
  cards: Card[];
  /** Visningstiden t i ms. */
  showMs: number;
  /** En tilfældig hånd fra kortgiveren, der registreres i albummet; ellers en hånd med et bestemt mønster. */
  random: boolean;
}

/** t starter på 3.000 ms og holdes inden for 800–5.000 ms. */
export const READ_MS = { start: 3000, min: 800, max: 5000 } as const;

/** t falder 10 % efter et rigtigt svar og stiger 15 % efter en fejl. */
export function nextReadMs(ms: number, ok: boolean): number {
  const next = Math.round(ms * (ok ? 0.9 : 1.15));
  return Math.min(READ_MS.max, Math.max(READ_MS.min, next));
}

/** En tilfældig hånd: Syds 13 kort fra en blanding af alle 52 (aldrig filtreret). */
export function makeRandomReadTask(seed: number, showMs: number): ReadTask {
  const cards = deal(seed).S;
  return { kind: 'read', seed, patternId: patternOf(suitLengths(cards)).id, cards, showMs, random: true };
}

/**
 * En hånd med mønstret, jævnt fordelt over alle sådanne hænder: en tilfældig placering af
 * længderne og tilfældige kort i hver farve. Bruges kun til repetition og registreres ikke i albummet.
 */
export function makeTargetedReadTask(seed: number, pattern: Pattern, showMs: number): ReadTask {
  const rng = mulberry32(seed);
  const lengths = shuffle([...pattern.lengths], rng);
  const ranks = Array.from({ length: 13 }, (_, r) => r);
  const cards = lengths.flatMap((length, suit) =>
    shuffle([...ranks], rng)
      .slice(0, length)
      .map((rank) => suit * 13 + rank),
  );
  return { kind: 'read', seed, patternId: pattern.id, cards: shuffle(cards, rng), showMs, random: false };
}

export function checkRead(task: ReadTask, lengths: readonly number[]): boolean {
  return patternOf(lengths).id === task.patternId;
}

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'B', 'D', 'K', 'E'];

/** Valøren på dansk: es, konge, dame, bonde (E, K, D, B). */
export function rankLabel(rank: number): string {
  return RANKS[rank];
}
