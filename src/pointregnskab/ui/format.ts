import type { SuitLengths } from '../../domain/cards';
import type { Allowed } from '../model/points';

/**
 * Tal og intervaller uden ordlyd, ens på begge sprog: "15–17", "8–15 / 17+", "6". Et interval, der når `top`
 * (40 minus det viste), er åbent opad ("17+", som systemfilen skriver).
 */
export function rangeText(allowed: Allowed, top = 40): string {
  if (!allowed.length) return '–';
  return allowed.map(([lo, hi]) => (hi >= top && lo > 0 ? `${lo}+` : lo === hi ? `${lo}` : `${lo}–${hi}`)).join(' / ');
}

/** Mindste og største værdi som "6" eller "4–6". */
export const spanText = (min: number, max: number): string => (min === max ? `${min}` : `${min}–${max}`);

/** En konkret fordeling i ♠♥♦♣-orden med lighedstegn, fx 3=4=2=4. */
export const lengthsText = (lengths: SuitLengths): string => lengths.join('=');
