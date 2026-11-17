import type { Card } from '../../domain/cards';

/**
 * Kort og lister i forklaringerne (SPEC-modspil.md, "Løser, generator og facit" punkt 5). Kortene skrives med
 * farvesymbol og valør (♠7, ♥B på dansk og ♥J på engelsk); farverne har indeks ♠ 0, ♥ 1, ♦ 2, ♣ 3.
 */

export type Sprog = 'da' | 'en';

export const SYMBOLER = ['♠', '♥', '♦', '♣'] as const;

const BOGSTAVER: Readonly<Record<number, string>> = { 11: 'B', 12: 'D', 13: 'K', 14: 'E' };
const BOGSTAVER_EN: Readonly<Record<number, string>> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };

export const farveAf = (kort: Card): number => Math.floor(kort / 13);
export const vaerdiAf = (kort: Card): number => (kort % 13) + 2;
export const kortAf = (farve: number, vaerdi: number): Card => farve * 13 + vaerdi - 2;

/** Valøren som tal eller honnørbogstav. */
export function valoer(vaerdi: number, sprog: Sprog): string {
  if (vaerdi <= 10) return String(vaerdi);
  return sprog === 'en' ? BOGSTAVER_EN[vaerdi] : BOGSTAVER[vaerdi];
}

/** Kortet med farvesymbol, fx ♠7. */
export const kortNavn = (farve: number, vaerdi: number, sprog: Sprog): string => `${SYMBOLER[farve]}${valoer(vaerdi, sprog)}`;

/** Et kort (0–51) med farvesymbol. */
export const kortTekst = (kort: Card, sprog: Sprog): string => kortNavn(farveAf(kort), vaerdiAf(kort), sprog);

/** "4 eller 5", "1, 3 eller 5"; på engelsk "4 or 5". */
export function eller(xs: readonly (string | number)[], sprog: Sprog): string {
  const t = xs.map(String);
  if (t.length <= 1) return t.join('');
  const sidste = t[t.length - 1];
  return `${t.slice(0, -1).join(', ')} ${sprog === 'en' ? 'or' : 'eller'} ${sidste}`;
}

/** "♣2, ♣6 og ♦3"; på engelsk "and". */
export function og(xs: readonly string[], sprog: Sprog): string {
  if (xs.length <= 1) return xs.join('');
  return `${xs.slice(0, -1).join(', ')} ${sprog === 'en' ? 'and' : 'og'} ${xs[xs.length - 1]}`;
}

/** Kontrakten med farvesymbol, fx 4♥. */
export const kontraktTekst = (kontrakt: string): string => kontrakt.replace(/[SHDC]$/, (s) => SYMBOLER['SHDC'.indexOf(s)]);
