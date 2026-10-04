import type { Rank } from './cards';

/**
 * Data til opgavetypen Hvad nu? (beregnes af `solver/whatnow.ts` og ligger i `content/hvad-nu.json`). Modulet er
 * let, så appen ikke henter løseren.
 */

/** Modellen bag Hvad nu?, som den står i hvad-nu.json. */
export const WHAT_NOW_MODEL =
  'Første runde: løserens bedste linje og normalt modspil (lavt, dækker en honnør, ligeværdige kort tilfældigt). Fortsættelserne: optimalt modspil med sidningernes chance efter første runde.';

export type Seat = 'N' | 'Ø' | 'S' | 'V';

export interface TrickCard {
  seat: Seat;
  /** E K D B 10 9 … 2; "x" er et lille kort fra modspillet og "–" en renonce. */
  card: string;
}

export interface WhatNowOption {
  hand: 'N' | 'S';
  high: Rank;
  low: Rank;
  /** Chancen for målet med fortsættelsen, givet det der er set. */
  value: number;
  certified: boolean;
  /** Fortsættelsens garanti pr. sidning (1/0); sidninger, der ikke længere er mulige, har chancen 0. */
  layouts: number[];
  /** Fortsættelsen på dansk. */
  steps: string[];
}

export interface WhatNowSituation {
  /** Første runde i spillerækkefølge. */
  trick: TrickCard[];
  /** Chancen for, at første runde går sådan. */
  probability: number;
  /** Sidningernes chance efter første runde; summerer til 1. */
  posterior: number[];
  /** Fortsættelserne, bedste først. */
  options: WhatNowOption[];
}

/** En rimelig fortsættelse giver mindst en tredjedel af den bedstes chance. */
export const plausible = (option: WhatNowOption, best: number) => option.value > 0 && option.value >= best / 3;
