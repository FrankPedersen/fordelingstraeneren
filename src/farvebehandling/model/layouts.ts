import { binomial } from '../../domain/combinatorics';
import type { Fraction } from './fraction';

/** Ledige pladser hos Vest og Øst. Uden anden viden har begge 13. */
export interface Vacant {
  west: number;
  east: number;
}

export const A_PRIORI: Vacant = { west: 13, east: 13 };

/**
 * Chancen for én konkret sidning: farven mangler n kort, og Vest har k bestemte af dem.
 * P = C(U − n, v_V − k) / C(U, v_V), U = v_V + v_Ø.
 */
export function layoutChance(n: number, k: number, vacant: Vacant = A_PRIORI): Fraction {
  const u = vacant.west + vacant.east;
  if (n > u) throw new Error('Flere manglende kort end ledige pladser');
  return { num: binomial(u - n, vacant.west - k), den: binomial(u, vacant.west) };
}

/** Chancen for, at Vest har netop k af de n manglende kort (alle valg af kort): C(n, k) gange den konkrete. */
export function westHoldsChance(n: number, k: number, vacant: Vacant = A_PRIORI): Fraction {
  const one = layoutChance(n, k, vacant);
  return { num: one.num * binomial(n, k), den: one.den };
}

/**
 * Chancen for en fordeling uanset retning, fx 3-2: Vest 3 og Øst 2 eller omvendt.
 * `longer` er den længste side (mindst halvdelen af n).
 */
export function splitChance(n: number, longer: number, vacant: Vacant = A_PRIORI): Fraction {
  if (longer * 2 < n || longer > n) throw new Error('Den længste side skal være mindst halvdelen');
  const a = westHoldsChance(n, longer, vacant);
  if (longer * 2 === n) return a;
  const b = westHoldsChance(n, n - longer, vacant);
  return { num: a.num + b.num, den: a.den };
}
