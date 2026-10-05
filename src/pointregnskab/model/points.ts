import type { Card } from '../../domain/cards';
import { hcpOf, type Rule } from '../../system/interpreter';

/**
 * Pointregnskabets model (SPEC-pointregnskab.md, Model): honnørpoint 4-3-2-1 og modspillernes tilladte point som
 * mængder af intervaller.
 */

/** Modspillerne: Vest og Øst. */
export type Defender = 'W' | 'E';
export const DEFENDERS: readonly Defender[] = ['W', 'E'];
export const otherDefender = (d: Defender): Defender => (d === 'W' ? 'E' : 'W');

/**
 * Tilladte samlede honnørpoint som en forening af lukkede intervaller, sorteret og uden overlap, fx [[8, 15], [17, 40]]
 * for "8–15 eller 17+". Systemfilen skriver "+" som 40.
 */
export type Allowed = readonly (readonly [number, number])[];

/** Ingen grænse: modparten har aldrig over 40 point. */
export const ANY: Allowed = [[0, 40]];

/** Honnørpoint for ét kort: es 4, konge 3, dame 2, bonde 1, ellers 0 (som `hcpOf`). */
export const honorPoints = (card: Card): number => Math.max(0, (card % 13) - 8);
export const isHonor = (card: Card): boolean => honorPoints(card) > 0;
export const suitOf = (card: Card): number => Math.floor(card / 13);

/** Modpartens point: M = 40 − (Nords hp + Syds hp). */
export function opponentsPoints(north: readonly Card[], south: readonly Card[]): number {
  return 40 - hcpOf(north) - hcpOf(south);
}

/** Sorterer og slår overlappende og tilstødende intervaller sammen. */
function normalize(list: readonly (readonly [number, number])[]): Allowed {
  const sorted = list.filter(([lo, hi]) => lo <= hi).sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (const [lo, hi] of sorted) {
    const last = out[out.length - 1];
    if (last && lo <= last[1] + 1) last[1] = Math.max(last[1], hi);
    else out.push([lo, hi]);
  }
  return out;
}

/** Systemfilens hp-felt (ét interval eller flere) som tilladte point. */
export function allowedOf(hcp: Rule['hcp'] | readonly [number, number]): Allowed {
  const list = Array.isArray(hcp[0]) ? (hcp as [number, number][]) : [hcp as [number, number]];
  return normalize(list);
}

export function allows(allowed: Allowed, points: number): boolean {
  return allowed.some(([lo, hi]) => points >= lo && points <= hi);
}

/** Fællesmængden: en modspiller med flere oplysninger, fx pas i åbningsposition og senere pas som svarer. */
export function intersect(a: Allowed, b: Allowed): Allowed {
  const out: [number, number][] = [];
  for (const [alo, ahi] of a) for (const [blo, bhi] of b) out.push([Math.max(alo, blo), Math.min(ahi, bhi)]);
  return normalize(out);
}

/** Begrænser mængden, når modparten har m point? Ellers er den reelt "ingen grænse" (\[0, M\]). */
export function limits(allowed: Allowed, m: number): boolean {
  return !allowed.some(([lo, hi]) => lo <= 0 && hi >= m);
}

/**
 * Regnskabspanelets rest: de tilladte point minus det viste, så panelet aldrig afslører løserens slutning
 * (SPEC-pointregnskab.md, Layout). Dele under 0 udelades.
 */
export function panelRest(allowed: Allowed, shown: number): Allowed {
  return normalize(allowed.filter(([, hi]) => hi >= shown).map(([lo, hi]) => [Math.max(0, lo - shown), hi - shown] as const));
}
