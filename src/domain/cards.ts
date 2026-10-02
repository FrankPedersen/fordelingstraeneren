/**
 * Et kort er et tal 0–51. Farven er kort / 13 (rundet ned) i farveordenen ♠♥♦♣,
 * og valøren er kort % 13, hvor 0 er toeren og 12 er esset.
 */
export type Card = number;

/** Farvesymbolerne i farveordenen. */
export const SUIT_SYMBOLS = ['♠', '♥', '♦', '♣'] as const;

/** Farvelængder i farveordenen ♠♥♦♣. */
export type SuitLengths = readonly [number, number, number, number];

export function suitLengths(hand: readonly Card[]): SuitLengths {
  const lengths: [number, number, number, number] = [0, 0, 0, 0];
  for (const card of hand) lengths[Math.floor(card / 13)]++;
  return lengths;
}
