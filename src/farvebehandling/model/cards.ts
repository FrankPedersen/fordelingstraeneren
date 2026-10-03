/**
 * Kortene i én farve. En rang er 2–14, hvor 14 er esset.
 * Data skrives A K Q J T 9 … 2; visningen er dansk: E K D B 10 9 … 2.
 */
export type Rank = number;

export const ACE: Rank = 14;
export const KING: Rank = 13;
export const QUEEN: Rank = 12;
export const JACK: Rank = 11;
export const TEN: Rank = 10;

const DATA_SYMBOL: Record<string, Rank> = { A: 14, K: 13, Q: 12, J: 11, T: 10 };
const DISPLAY: Record<number, string> = { 14: 'E', 13: 'K', 12: 'D', 11: 'B', 10: '10' };
const DATA: Record<number, string> = { 14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: 'T' };

/** Alle 13 rang, højeste først. */
export const ALL_RANKS: readonly Rank[] = Array.from({ length: 13 }, (_, i) => 14 - i);

export function rankFromSymbol(symbol: string): Rank {
  if (symbol in DATA_SYMBOL) return DATA_SYMBOL[symbol];
  if (symbol === '10') return TEN;
  const n = Number(symbol);
  if (Number.isInteger(n) && n >= 2 && n <= 9) return n;
  throw new Error(`Ukendt kort: ${symbol}`);
}

/** "AT65" eller "A 10 6 5" → [14, 10, 6, 5]. Kortene sorteres faldende; et kort må kun stå én gang. */
export function parseCards(text: string): Rank[] {
  const symbols = text.replace(/10/g, 'T').replace(/\s+/g, '').split('');
  const ranks = symbols.map(rankFromSymbol).sort((a, b) => b - a);
  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] === ranks[i - 1]) throw new Error(`Kortet ${rankText(ranks[i])} står to gange i ${text}`);
  }
  return ranks;
}

/** Datanotation: [14, 10, 6, 5] → "AT65". */
export function cardsData(ranks: readonly Rank[]): string {
  return [...ranks].sort((a, b) => b - a).map((r) => DATA[r] ?? String(r)).join('');
}

/** Dansk visning af én rang: E, K, D, B, 10, 9 … 2. */
export function rankText(rank: Rank): string {
  return DISPLAY[rank] ?? String(rank);
}

/** Dansk visning af en hånd: [14, 10, 6, 5] → "E 10 6 5"; en renonce vises som "–". */
export function cardsText(ranks: readonly Rank[]): string {
  return ranks.length ? [...ranks].sort((a, b) => b - a).map(rankText).join(' ') : '–';
}

/** De kort i farven, som hverken bordet eller hånden har, højeste først. */
export function missingCards(north: readonly Rank[], south: readonly Rank[]): Rank[] {
  const ours = new Set([...north, ...south]);
  if (ours.size !== north.length + south.length) throw new Error('Bordet og hånden har et kort til fælles');
  return ALL_RANKS.filter((r) => !ours.has(r));
}
