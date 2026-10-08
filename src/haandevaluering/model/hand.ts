import type { Card } from '../../domain/cards';

/**
 * Hænder i PBN-notation til facitfilen, så konventionstræneren kan læse den uden appens kortformat: farverne
 * ♠.♥.♦.♣ adskilt af punktum og valørerne A K Q J T 9 … 2, fx "AK752.4.KQ63.852". En renonce er en tom farve.
 */
const RANKS = '23456789TJQKA';

export function parseHand(pbn: string): Card[] {
  const suits = pbn.split('.');
  if (suits.length !== 4) throw new Error(`Ugyldig hånd: ${pbn}`);
  const hand = suits.flatMap((cards, suit) =>
    [...cards].map((ch) => {
      const rank = RANKS.indexOf(ch);
      if (rank < 0) throw new Error(`Ugyldigt kort "${ch}" i ${pbn}`);
      return suit * 13 + rank;
    }),
  );
  if (hand.length !== 13 || new Set(hand).size !== 13) throw new Error(`En hånd har 13 forskellige kort: ${pbn}`);
  return hand;
}

export function handToPbn(hand: readonly Card[]): string {
  return [0, 1, 2, 3]
    .map((suit) =>
      hand
        .filter((c) => Math.floor(c / 13) === suit)
        .map((c) => c % 13)
        .sort((a, b) => b - a)
        .map((r) => RANKS[r])
        .join(''),
    )
    .join('.');
}
