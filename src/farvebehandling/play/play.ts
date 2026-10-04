import type { Rng } from '../../engine/rng';
import type { BankItem } from '../analysis';
import { JACK, missingCards, rankFromSymbol, type Rank } from '../model/cards';
import { equivalentCards, fourthHandPlay, pickCard, secondHandPlay } from '../model/normalDefense';
import type { LineStep } from '../solver/lines';

/**
 * Spil den selv (opgavetype 7): kortene gives efter sidningernes chance, spilføreren spiller ud fra den hånd, han vil,
 * og lægger 3. håndens kort; modspillerne lægger efter normalt modspil (SPEC-farvebehandling.md, Matematik).
 */

export type Hand = 'N' | 'S';
export type Seat = 'N' | 'Ø' | 'S' | 'V';

export interface Deal {
  west: Rank[];
  east: Rank[];
  /** Den abstrakte sidning (indeks i løsningens sidninger). */
  layout: number;
}

export interface PlayedTrick {
  leader: Hand;
  /** Kortene i spillerækkefølge: udspil, 2., 3. og 4. hånd; 0 = kan ikke bekende. */
  lead: Rank;
  second: Rank;
  third: Rank;
  fourth: Rank;
  winner: Seat;
}

export interface PlayState {
  north: Rank[];
  south: Rank[];
  west: Rank[];
  east: Rank[];
  deal: Deal;
  tricks: PlayedTrick[];
  /** Det igangværende stik: udspil og 2. hånd, mens spilføreren vælger 3. håndens kort. */
  current: { leader: Hand; lead: Rank; second: Rank } | null;
  /** Spilførerens stik. */
  won: number;
}

const desc = (cards: readonly Rank[]) => [...cards].sort((a, b) => b - a);

/** Giver modpartens kort: sidningen trækkes efter dens chance, og kortene i hvert hul fordeles tilfældigt. */
export function dealCards(item: BankItem, rng: Rng, weights?: readonly number[]): Deal {
  const { layouts, gaps, denominator } = item.solution;
  const chances = weights ?? layouts.map((l) => Number(l.weight) / Number(denominator));
  let r = rng.next() * chances.reduce((a, b) => a + b, 0);
  let layout = chances.length - 1;
  for (let L = 0; L < chances.length; L++) {
    r -= chances[L];
    if (r < 0) {
      layout = L;
      break;
    }
  }
  const missing = missingCards(item.north, item.south);
  const west: Rank[] = [], east: Rank[] = [];
  gaps.forEach((gap, g) => {
    const cards = missing.filter((m) => m <= gap.high && m >= gap.low);
    for (let i = cards.length - 1; i > 0; i--) {
      const j = rng.int(i + 1);
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    const w = layouts[layout].west[g];
    west.push(...cards.slice(0, w));
    east.push(...cards.slice(w));
  });
  return { west: desc(west), east: desc(east), layout };
}

export function startPlay(item: BankItem, deal: Deal): PlayState {
  return { north: desc(item.north), south: desc(item.south), west: deal.west, east: deal.east, deal, tricks: [], current: null, won: 0 };
}

/** Alle kort, der endnu ikke er spillet (stikkets kort tæller som spillet). */
function unplayed(s: Pick<PlayState, 'north' | 'south' | 'west' | 'east'>): Set<Rank> {
  return new Set([...s.north, ...s.south, ...s.west, ...s.east]);
}

const handOf = (s: PlayState, hand: Hand) => (hand === 'N' ? s.north : s.south);
const other = (hand: Hand): Hand => (hand === 'N' ? 'S' : 'N');
const without = (cards: readonly Rank[], card: Rank) => cards.filter((c) => c !== card);

/** Spillet er slut, når spilføreren ikke har flere kort. */
export function finished(s: PlayState): boolean {
  return !s.north.length && !s.south.length && !s.current;
}

/** Spilføreren spiller ud; 2. hånd lægger efter normalt modspil. */
export function playLead(s: PlayState, hand: Hand, card: Rank, rng: Rng): PlayState {
  if (s.current || !handOf(s, hand).includes(card)) throw new Error('Udspillet er ikke muligt');
  const after = { ...s, north: hand === 'N' ? without(s.north, card) : s.north, south: hand === 'S' ? without(s.south, card) : s.south };
  const defender = hand === 'N' ? 'east' : 'west';
  const second = pickCard(secondHandPlay(after[defender], card, unplayed(after)), rng.next());
  return { ...after, [defender]: without(after[defender], second), current: { leader: hand, lead: card, second } };
}

/** Kan 3. hånd ikke bekende, lægges der intet kort (0). */
export function thirdHandEmpty(s: PlayState): boolean {
  return !!s.current && !handOf(s, other(s.current.leader)).length;
}

/** Spilføreren lægger 3. håndens kort (0 = kan ikke bekende); 4. hånd lægger efter normalt modspil. */
export function playThird(s: PlayState, card: Rank, rng: Rng): PlayState {
  const current = s.current;
  if (!current) throw new Error('Der er intet udspil');
  const partner = other(current.leader);
  if (card === 0 ? handOf(s, partner).length > 0 : !handOf(s, partner).includes(card)) throw new Error('Kortet kan ikke lægges');
  const after = { ...s, north: partner === 'N' ? without(s.north, card) : s.north, south: partner === 'S' ? without(s.south, card) : s.south };
  const defender = current.leader === 'N' ? 'west' : 'east';
  const fourth = pickCard(fourthHandPlay(after[defender], current.lead, current.second, card, unplayed(after)), rng.next());
  const seats: Seat[] = current.leader === 'N' ? ['N', 'Ø', 'S', 'V'] : ['S', 'V', 'N', 'Ø'];
  const cards = [current.lead, current.second, card, fourth];
  const winner = seats[cards.indexOf(Math.max(...cards))];
  const trick: PlayedTrick = { leader: current.leader, lead: current.lead, second: current.second, third: card, fourth, winner };
  const ours = winner === 'N' || winner === 'S';
  return { ...after, [defender]: without(after[defender], fourth), current: null, tricks: [...s.tricks, trick], won: s.won + (ours ? 1 : 0) };
}

/** Et kort efter linjeformatet: "low", "high" eller et bestemt kort. */
function chosen(hand: readonly Rank[], card: string): Rank | null {
  if (!hand.length) return null;
  if (card === 'low') return Math.min(...hand);
  if (card === 'high') return Math.max(...hand);
  const r = rankFromSymbol(card);
  return hand.includes(r) ? r : null;
}

/**
 * Følger stikkene linjens trin? Et kort må erstattes af et ligeværdigt kort. Efter sidste trin, eller når en modspiller
 * ikke kan bekende (kendt sidning), er alt tilladt, for så spiller løseren videre.
 */
export function followsLine(steps: readonly LineStep[], tricks: readonly PlayedTrick[], start: { north: Rank[]; south: Rank[]; west: Rank[]; east: Rank[] }): boolean {
  const hands = { N: desc(start.north), S: desc(start.south), V: desc(start.west), Ø: desc(start.east) };
  const played = new Set<Rank>();
  let step = 0;
  for (const trick of tricks) {
    if (step >= steps.length) return true;
    const s = steps[step];
    const left = new Set([...hands.N, ...hands.S, ...hands.V, ...hands.Ø]);
    if (s.leadFrom !== trick.leader) return false;
    const lead = chosen(hands[trick.leader], s.card);
    if (lead === null || !equivalentCards(lead, hands[trick.leader], left).includes(trick.lead)) return false;
    hands[trick.leader] = without(hands[trick.leader], trick.lead);
    if (trick.second === 0) return true;
    const partner = other(trick.leader);
    if (hands[partner].length) {
      let want = 'low';
      if (s.third) {
        const cond = s.third.ifSecondPlays;
        const holds = cond === 'low' ? trick.second < JACK : trick.second >= rankFromSymbol(cond);
        want = holds ? s.third.play : s.third.else;
      }
      const third = chosen(hands[partner], want);
      const now = new Set([...hands.N, ...hands.S, ...hands.V, ...hands.Ø].filter((c) => c !== trick.second));
      if (third === null || !equivalentCards(third, hands[partner], now).includes(trick.third)) return false;
      hands[partner] = without(hands[partner], trick.third);
    }
    if (trick.fourth === 0) return true;
    const second = trick.leader === 'N' ? 'Ø' : 'V', fourth = trick.leader === 'N' ? 'V' : 'Ø';
    hands[second] = without(hands[second], trick.second);
    hands[fourth] = without(hands[fourth], trick.fourth);
    for (const c of [trick.lead, trick.second, trick.third, trick.fourth]) if (c) played.add(c);
    const branch = (s.branches ?? []).find((b) => (b.if.fallen ?? []).every((c) => played.has(rankFromSymbol(c))) && !b.if.showsOut);
    step = branch ? branch.goto - 1 : step + 1;
  }
  return true;
}

/** Fulgte spilleren en af de bedste linjer (inden for 0,5 procentpoint)? Uden linjetrin sammenlignes første udspil. */
export function followsBestLine(item: BankItem, goal: number, s: PlayState, nearBest = 0.005): boolean {
  const g = item.solution.goals[String(goal)];
  if (!g || !s.tricks.length) return false;
  const start = { north: item.north, south: item.south, west: s.deal.west, east: s.deal.east };
  const first = s.tricks[0];
  return g.leads
    .filter((l) => g.value - l.value <= nearBest)
    .some((l) =>
      l.line.length
        ? followsLine(l.line, s.tricks, start)
        : l.hand === first.leader && first.lead <= l.high && first.lead >= l.low,
    );
}
