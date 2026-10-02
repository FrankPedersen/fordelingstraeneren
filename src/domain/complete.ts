import { SUIT_WAYS } from './combinatorics';
import { patternById, patternOf, type Pattern } from './patterns';

/** Kendte farvelængder i farveordenen ♠♥♦♣; null er en ukendt farve. */
export type Known = readonly (number | null)[];

export interface Completion {
  pattern: Pattern;
  /** Antal måder at vælge kortene i de ukendte farver, så hånden får mønstret. */
  weight: bigint;
}

export interface Completions {
  total: bigint;
  /** Hyppigste først. */
  list: Completion[];
}

/**
 * De mønstre, hånden kan have, når nogle farvelængder er kendt. De ukendte farver deler de
 * resterende kort hypergeometrisk: vægten er produktet af C(13, l) over de ukendte farver.
 */
export function completions(known: Known): Completions {
  const knownSum = known.reduce<number>((sum, l) => sum + (l ?? 0), 0);
  const invalid = known.some((l) => l !== null && !(Number.isInteger(l) && l >= 0 && l <= 13));
  if (known.length !== 4 || invalid || knownSum > 13) {
    throw new Error(`Umulige farvelængder: ${known.join(', ')}`);
  }
  const unknown = known.flatMap((l, i) => (l === null ? [i] : []));
  const lengths = known.map((l) => l ?? 0);
  const weights = new Map<string, bigint>();

  const visit = (k: number, left: number, weight: bigint) => {
    if (k === unknown.length) {
      if (left !== 0) return;
      const id = patternOf(lengths).id;
      weights.set(id, (weights.get(id) ?? 0n) + weight);
      return;
    }
    for (let l = 0; l <= Math.min(13, left); l++) {
      lengths[unknown[k]] = l;
      visit(k + 1, left - l, weight * SUIT_WAYS[l]);
    }
  };
  visit(0, 13 - knownSum, 1n);
  if (weights.size === 0) throw new Error(`Umulige farvelængder: ${known.join(', ')}`);

  const list = [...weights].map(([id, weight]) => ({ pattern: patternById(id), weight }));
  list.sort((x, y) =>
    x.weight === y.weight ? x.pattern.rank - y.pattern.rank : x.weight > y.weight ? -1 : 1,
  );
  return { total: list.reduce((sum, c) => sum + c.weight, 0n), list };
}
