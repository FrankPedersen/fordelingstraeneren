import { formatDecimal } from '../../engine/format';

/**
 * Tal uden ordlyd, ens på begge sprog. Point er multipla af ¼ og skrives med brøk som i specen: 12½, 16¾, −½.
 */
const FRACTIONS = ['', '¼', '½', '¾'];

export function pointsText(points: number): string {
  const quarters = Math.round(Math.abs(points) * 4);
  const whole = Math.floor(quarters / 4);
  const fraction = FRACTIONS[quarters % 4];
  const sign = points < 0 && quarters > 0 ? '−' : '';
  return `${sign}${whole === 0 && fraction ? '' : whole}${fraction}`;
}

/** Med fortegn, fx +1½ og −1; 0 står uden fortegn. */
export function signedText(points: number): string {
  return points > 0 ? `+${pointsText(points)}` : pointsText(points);
}

/** Stik med én decimal, fx 9,6 (9.6 på engelsk). */
export const tricksText = (tricks: number): string => formatDecimal(tricks, 1);
