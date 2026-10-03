import { TEN, type Rank } from './cards';

/**
 * Normalt modspil. Det bruges kun i Spil den selv og til forklaringer; løseren regner med optimalt modspil.
 *
 * - 2. hånd lægger det laveste kort. Spilles 10 eller højere, dækker 2. hånd med det billigste kort, der slår det, hvis den kan.
 * - 4. hånd vinder stikket så billigt som muligt, hvis makkers kort ikke allerede vinder, og lægger ellers det laveste.
 *   Den holder aldrig tilbage.
 * - Mellem ligeværdige kort vælges tilfældigt. Kort er ligeværdige, når intet ikke-spillet kort ligger imellem dem.
 *
 * Resultatet er en fordeling over kortene (rang → sandsynlighed). En renonce giver rang 0.
 */
export type CardChoice = Map<Rank, number>;

/** De kort i hånden, der er ligeværdige med `card`. `unplayed` er alle kort, der endnu ikke er spillet (stikkets kort tæller som spillet). */
export function equivalentCards(card: Rank, hand: readonly Rank[], unplayed: ReadonlySet<Rank>): Rank[] {
  const result = [card];
  for (const dir of [1, -1]) {
    for (let r = card + dir; r >= 2 && r <= 14; r += dir) {
      if (hand.includes(r)) result.push(r);
      else if (unplayed.has(r)) break;
    }
  }
  return result.sort((a, b) => b - a);
}

function uniform(cards: readonly Rank[]): CardChoice {
  return new Map(cards.map((c) => [c, 1 / cards.length]));
}

function lowest(hand: readonly Rank[], unplayed: ReadonlySet<Rank>): CardChoice {
  return uniform(equivalentCards(Math.min(...hand), hand, unplayed));
}

/** Det billigste kort over `above` og dets ligeværdige kort, der også er over `above`. */
function cheapestAbove(hand: readonly Rank[], above: Rank, unplayed: ReadonlySet<Rank>): CardChoice | null {
  const beating = hand.filter((c) => c > above);
  if (!beating.length) return null;
  return uniform(equivalentCards(Math.min(...beating), hand, unplayed).filter((c) => c > above));
}

export function secondHandPlay(hand: readonly Rank[], led: Rank, unplayed: ReadonlySet<Rank>): CardChoice {
  if (!hand.length) return new Map([[0, 1]]);
  if (led >= TEN) {
    const cover = cheapestAbove(hand, led, unplayed);
    if (cover) return cover;
  }
  return lowest(hand, unplayed);
}

export function fourthHandPlay(
  hand: readonly Rank[],
  led: Rank,
  second: Rank,
  third: Rank,
  unplayed: ReadonlySet<Rank>,
): CardChoice {
  if (!hand.length) return new Map([[0, 1]]);
  const ours = Math.max(led, third);
  if (second > ours) return lowest(hand, unplayed);
  return cheapestAbove(hand, ours, unplayed) ?? lowest(hand, unplayed);
}

/** Træk et kort fra en fordeling med et tal i [0, 1). */
export function pickCard(choice: CardChoice, random: number): Rank {
  let acc = 0;
  let last = 0;
  for (const [card, p] of choice) {
    acc += p;
    last = card;
    if (random < acc) return card;
  }
  return last;
}
