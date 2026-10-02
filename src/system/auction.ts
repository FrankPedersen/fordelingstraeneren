import type { Hands, Seat } from '../domain/dealer';
import { SYSTEM, chooseCall, theirSuit, type Rule } from './interpreter';

export interface Bid {
  seat: Seat;
  rule: Rule;
  /** Åbningen, der meldes ind over. */
  over?: { seat: Seat; call: string };
}

const ORDER: readonly Seat[] = ['N', 'E', 'S', 'W'];
const nextSeat = (seat: Seat) => ORDER[(ORDER.indexOf(seat) + 1) % 4];

/**
 * Forenklet budgivning efter systemfilen: den første, der kan åbne, åbner, og næste spiller kan
 * melde ind over en åbning på 1-trinnet. Svar- og genmeldingssekvenser er ikke med i første version.
 */
export function simulateAuction(hands: Hands, dealer: Seat, rules: readonly Rule[] = SYSTEM): Bid[] {
  let seat = dealer;
  for (let i = 0; i < 4; i++, seat = nextSeat(seat)) {
    const opening = chooseCall('opening', hands[seat], undefined, rules);
    if (!opening) continue;
    const bids: Bid[] = [{ seat, rule: opening }];
    if (/^1(C|D|H|S|NT)$/.test(opening.call)) {
      const context = `over-${opening.call}`;
      const overcaller = nextSeat(seat);
      const overcall = chooseCall(context, hands[overcaller], theirSuit(context), rules);
      if (overcall) bids.push({ seat: overcaller, rule: overcall, over: { seat, call: opening.call } });
    }
    return bids;
  }
  return [];
}
