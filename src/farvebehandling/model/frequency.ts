import { binomial } from '../../domain/combinatorics';
import { formatDecimal, formatInt } from '../../engine/format';
import { rankFromSymbol, type Rank } from './cards';
import type { Fraction } from './fraction';
import { getLang } from '../../i18n';

/** Antal spil på en klubaften. */
export const DEALS_PER_EVENING = 25;

interface Holding {
  named: Rank[];
  xs: number;
}

/** "AKxx" eller "A K x x" → navngivne kort og antal x. */
function parseWithX(text: string): Holding {
  const symbols = text.replace(/10/g, 'T').replace(/\s+/g, '').split('');
  const named: Rank[] = [];
  let xs = 0;
  for (const s of symbols) {
    if (s === 'x' || s === 'X') xs++;
    else named.push(rankFromSymbol(s));
  }
  return { named, xs };
}

/**
 * Hyppighed pr. spil for, at du og makker har kombinationen i en af de fire farver,
 * uanset om kortene sidder i hånden eller på bordet.
 *
 * P = C(39, 13 − a) · C(26 + a, 13 − b) / (C(52, 13) · C(39, 13)) · w · 4 · s
 *
 * a og b er antal kort i hånden og på bordet. x er et vilkårligt kort under det laveste navngivne kort,
 * og w er antal måder at vælge x'erne på. Højere kort, der ikke er nævnt, sidder hos modparten.
 * s = 2, når hånd og bord er forskellige, ellers 1.
 */
export function combinationFrequency(hand: string, dummy: string): Fraction {
  const h = parseWithX(hand);
  const d = parseWithX(dummy);
  const named = [...h.named, ...d.named];
  if (new Set(named).size !== named.length) throw new Error('Et kort står to gange');
  const lowest = named.length ? Math.min(...named) : 15;
  const below = lowest - 2; // rang 2 … lowest − 1
  const w = binomial(below, h.xs) * binomial(below - h.xs, d.xs);
  const a = h.named.length + h.xs;
  const b = d.named.length + d.xs;
  const same = normalize(h) === normalize(d);
  const num = binomial(39, 13 - a) * binomial(26 + a, 13 - b) * w * 4n * (same ? 1n : 2n);
  const den = binomial(52, 13) * binomial(39, 13);
  return { num, den };
}

function normalize(h: Holding): string {
  return `${[...h.named].sort((p, q) => q - p).join(',')}|${h.xs}`;
}

/**
 * En situation frem for en kombination: partnerskabet har `ours`, ikke `theirs`, og `length` kort i farven.
 * Forventet antal sådanne farver pr. spil (summen over de fire farver).
 */
export function situationFrequency(ours: readonly Rank[], theirs: readonly Rank[], length: number): Fraction {
  const free = 13 - ours.length - theirs.length;
  const num = binomial(free, length - ours.length) * binomial(39, 26 - length) * 4n;
  return { num, den: binomial(52, 26) };
}

/** Ca. én gang pr. så mange spil (afrundet). */
export function oncePerDeals(f: Fraction): number {
  return Number((2n * f.den + f.num) / (2n * f.num));
}

/** Engelsk ordenstal: 1st, 2nd, 3rd, 4th … 11th, 12th, 13th, 21st. */
function ordinal(n: number): string {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${formatInt(n)}${suffix}`;
}

/** Naturlig frekvens for en klubaften, fx "ca. 3,5 gange pr. klubaften" eller "ca. hver 5. klubaften". */
export function eveningText(f: Fraction): string {
  const perEvening = (Number(f.num) * DEALS_PER_EVENING) / Number(f.den);
  if (perEvening >= 0.95) {
    const rounded = Math.round(perEvening * 10) / 10;
    const text = Number.isInteger(rounded) ? formatInt(rounded) : formatDecimal(rounded, 1);
    if (getLang() === 'en') return rounded === 1 ? 'about once per club evening' : `about ${text} times per club evening`;
    return rounded === 1 ? 'ca. én gang pr. klubaften' : `ca. ${text} gange pr. klubaften`;
  }
  const every = Math.round(1 / perEvening);
  return getLang() === 'en' ? `about every ${ordinal(every)} club evening` : `ca. hver ${formatInt(every)}. klubaften`;
}
