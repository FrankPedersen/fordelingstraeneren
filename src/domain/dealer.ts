import { mulberry32, shuffle, type Rng } from '../engine/rng';
import type { Card } from './cards';

/** Pladserne Nord, Øst, Syd og Vest. */
export const SEATS = ['N', 'E', 'S', 'W'] as const;
export type Seat = (typeof SEATS)[number];

export const SEAT_NAMES: Record<Seat, string> = { N: 'Nord', E: 'Øst', S: 'Syd', W: 'Vest' };

/** Fire hænder á 13 kort i den rækkefølge, de blev givet (usorteret). */
export type Hands = Record<Seat, Card[]>;

/** Giver kort ud fra et seed, så en opgave kan genskabes ud fra sit seed. */
export function deal(seed: number): Hands {
  return dealWith(mulberry32(seed));
}

/** Blander alle 52 kort med Fisher–Yates og giver 13 til hver i rækkefølgen N, Ø, S, V. */
export function dealWith(rng: Rng): Hands {
  const deck = shuffle(
    Array.from({ length: 52 }, (_, card) => card),
    rng,
  );
  return {
    N: deck.slice(0, 13),
    E: deck.slice(13, 26),
    S: deck.slice(26, 39),
    W: deck.slice(39, 52),
  };
}
