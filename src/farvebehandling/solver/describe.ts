import { cardsData, JACK, TEN, type Rank } from '../model/cards';
import { END, LEAD, type Game, type Hand } from './game';
import type { Line, LineStep } from './lines';
import { itemValues } from './natural';

/**
 * Oversætter en ren linje fra løseren til nummererede trin på dansk og til linjeformatet.
 *
 * Beskrivelsen følger hovedvejen, som man selv ville fortælle linjen: 2. hånd lægger lavt, og 4. hånd stikker så
 * billigt som muligt, når den kan. Lægger 2. hånd en honnør, og ændrer det 3. håndens kort, nævnes det som en gren.
 * Beskrivelsen stopper, når resultatet er afgjort i alle sidninger. Linjeformatet får trinene frem til det første
 * sted, hvor næste udspil afhænger af, hvad modspillet lagde; derefter spiller løseren videre ("Efter sidste trin").
 */
export interface LineDescription {
  steps: string[];
  line: Line;
}

interface WalkState {
  decl: { rank: Rank; hand: Hand }[];
  gaps: number[];
  physical: Record<Hand, Rank[]>;
}

interface Choice {
  rank: Rank; // fysisk kort
  winner: boolean;
  lowest: boolean;
}

const HONOR_NAME: Record<number, string> = { 14: 'esset', 13: 'kongen', 12: 'damen', 11: 'knægten', 10: "10'eren" };
const HAND_NAME: Record<Hand, string> = { N: 'bordet', S: 'hånden' };
const MAX_ROUNDS = 4;

const other = (h: Hand): Hand => (h === 'N' ? 'S' : 'N');
const capital = (s: string) => s[0].toUpperCase() + s.slice(1);
export const cardName = (rank: Rank) => HONOR_NAME[rank] ?? `${rank}'eren`;

/** Den abstrakte gruppe, der indeholder kortet med rang `rank` i hånden `hand`. */
function group(state: WalkState, hand: Hand, rank: Rank): number[] {
  const j = state.decl.findIndex((d) => d.rank === rank && d.hand === hand);
  const g = [j];
  for (let k = j - 1; k >= 0 && state.gaps[k + 1] === 0; k--) if (state.decl[k].hand === hand) g.unshift(k);
  for (let k = j + 1; k < state.decl.length && state.gaps[k] === 0; k++) if (state.decl[k].hand === hand) g.push(k);
  return g;
}

function choice(state: WalkState, hand: Hand, abstractLow: Rank): Choice {
  const g = group(state, hand, abstractLow);
  const abstract = state.decl.filter((d) => d.hand === hand).map((d) => d.rank);
  const phys = [...state.physical[hand]].sort((a, b) => b - a);
  const ranks = g.map((j) => phys[abstract.indexOf(state.decl[j].rank)]);
  let winner = true;
  for (let q = 0; q <= g[0]; q++) if (state.gaps[q] > 0) winner = false;
  const last = g[g.length - 1];
  return {
    rank: Math.max(...ranks),
    winner,
    lowest: !state.decl.slice(last + 1).some((d) => d.hand === hand),
  };
}

function gapIndex(state: WalkState, high: Rank): number {
  return high === 0 ? -1 : state.decl.filter((d) => d.rank > high).length;
}

function removeDeclarer(state: WalkState, rank: Rank) {
  const j = state.decl.findIndex((d) => d.rank === rank);
  state.decl.splice(j, 1);
  state.gaps.splice(j, 2, state.gaps[j] + state.gaps[j + 1]);
}

/** Er resultatet afgjort ved knuden: samme værdi i alle sidninger? */
function decided(game: Game, node: number, values: Int32Array): boolean {
  const st = game.nodeItemStart[node], cnt = game.nodeItemCount[node];
  for (let i = st + 1; i < st + cnt; i++) if (values[i] !== values[st]) return false;
  return true;
}

export function describeLine(game: Game, strategy: Int8Array, leadSlot: number): LineDescription {
  const values = itemValues(game, game.root, strategy);
  const state: WalkState = {
    decl: game.declarer.map((d) => ({ ...d })),
    gaps: [...game.gaps],
    physical: { N: [...game.north], S: [...game.south] },
  };
  const parts: { text: string; cash: Rank | null }[] = [];
  const lineSteps: LineStep[] = [];
  let lineOpen = true;
  let slot = leadSlot;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const hand: Hand = game.slotHand[slot] === 0 ? 'N' : 'S';
    const partner = other(hand);
    const seat2 = hand === 'N' ? 'Øst' : 'Vest';
    const led = choice(state, hand, game.slotLow[slot]);
    const second = game.children[slot];
    const cs2 = game.childStart[second], cc2 = game.childCount[second];

    // 3. håndens kort, når 2. hånd lægger lavt og når den lægger en honnør (knægten eller højere).
    const thirdFor = (s2: number): Choice | null => {
      const third = game.children[s2];
      const s3 = game.childStart[third] + strategy[third];
      return game.slotHigh[s3] === 0 ? null : choice(state, partner, game.slotLow[s3]);
    };
    let lowSlot = -1, highSlot = -1;
    for (let x = 0; x < cc2; x++) {
      const s = cs2 + x;
      if (game.slotHigh[s] === 0) continue;
      if (game.slotHigh[s] < JACK) lowSlot = s; // det laveste lave kort (sidste)
      else if (highSlot < 0 && game.slotLow[s] > led.rank) highSlot = s; // en honnør over udspillet
      else if (highSlot < 0 && !led.winner) highSlot = s;
    }
    const mainSlot = lowSlot >= 0 ? lowSlot : (() => {
      for (let x = cc2 - 1; x >= 0; x--) if (game.slotHigh[cs2 + x] !== 0) return cs2 + x;
      return -1;
    })();
    if (mainSlot < 0) break;
    const low = lowSlot >= 0 ? thirdFor(lowSlot) : null;
    const high = highSlot >= 0 ? thirdFor(highSlot) : null;
    const covers = highSlot >= 0 && game.slotLow[highSlot] > led.rank;

    let text: string;
    let cash: Rank | null = null;
    const ledLow = led.lowest && led.rank < TEN;
    if (led.winner && (!low || low.lowest) && (!high || high.lowest)) {
      text = ledLow ? `lille fra ${HAND_NAME[hand]}` : `slå ${cardName(led.rank)}`;
      if (!ledLow) cash = led.rank;
    } else if (ledLow) {
      const toward = low ?? high;
      if (!toward) text = `lille fra ${HAND_NAME[hand]}`;
      else if (toward.winner) text = `lille fra ${HAND_NAME[hand]} til ${cardName(toward.rank)}`;
      else if (toward.lowest) text = 'lille fra begge hænder';
      else text = `lille fra ${HAND_NAME[hand]} mod ${cardName(toward.rank)} (kip)`;
      if (low && high && high.rank !== low.rank) {
        text += `; lægger ${seat2} en honnør, ${high.lowest ? 'lægges der lille' : `tages den med ${cardName(high.rank)}`}`;
      }
    } else {
      text = `${cardName(led.rank)} fra ${HAND_NAME[hand]}`;
      if (covers && high) text += `; dækker ${seat2}, ${high.lowest ? 'lægges der lille' : `tages stikket med ${cardName(high.rank)}`}`;
      if (low) text += `${covers && high ? ', ellers' : ';'} ${low.lowest ? 'lad den løbe' : `læg ${cardName(low.rank)}`}`;
    }
    parts.push({ text, cash });

    // Linjeformatet: trinet skrives, så længe 3. hånd følger én regel for lave kort og én for honnører.
    if (lineOpen) {
      if (consistentThird(game, second, thirdFor)) {
        const step: LineStep = { leadFrom: hand, card: ledLow ? 'low' : cardsData([led.rank]) };
        const lowCard = low ? (low.lowest ? 'low' : cardsData([low.rank])) : 'low';
        const highCard = high ? (high.lowest ? 'low' : cardsData([high.rank])) : lowCard;
        if (lowCard !== 'low' || highCard !== 'low') step.third = { ifSecondPlays: 'low', play: lowCard, else: highCard };
        lineSteps.push(step);
      } else lineOpen = false;
    }

    // Hovedvejen: 3. hånd efter strategien, 4. hånd stikker billigst, ellers lavt.
    const third = game.children[mainSlot];
    const s3 = game.childStart[third] + strategy[third];
    const thirdChoice = game.slotHigh[s3] === 0 ? null : choice(state, partner, game.slotLow[s3]);
    const fourth = game.children[s3];
    const ours = Math.max(led.rank, thirdChoice ? thirdChoice.rank : 0);
    const partnerWins = game.slotLow[mainSlot] > ours;
    const cs4 = game.childStart[fourth], cc4 = game.childCount[fourth];
    let s4 = -1;
    if (!partnerWins) for (let x = cc4 - 1; x >= 0; x--) if (game.slotHigh[cs4 + x] !== 0 && game.slotLow[cs4 + x] > ours) { s4 = cs4 + x; break; }
    if (s4 < 0) for (let x = cc4 - 1; x >= 0; x--) if (game.slotHigh[cs4 + x] !== 0) { s4 = cs4 + x; break; }
    if (s4 < 0) break; // 4. hånd kan ikke bekende: kendt sidning
    const next = game.children[s4];

    // Linjen slutter, hvis næste udspil afhænger af, hvad modspillet lagde.
    if (lineOpen && !sameNextLead(game, strategy, second)) lineOpen = false;

    // Opdater tilstanden efter stikket.
    const q2 = gapIndex(state, game.slotHigh[mainSlot]);
    const q4 = gapIndex(state, game.slotHigh[s4]);
    if (q2 >= 0) state.gaps[q2]--;
    if (q4 >= 0) state.gaps[q4]--;
    state.physical[hand] = state.physical[hand].filter((r) => r !== led.rank);
    if (thirdChoice) state.physical[partner] = state.physical[partner].filter((r) => r !== thirdChoice.rank);
    for (const r of [game.slotLow[slot], thirdChoice ? game.slotLow[s3] : 0].filter((r) => r > 0).sort((a, b) => a - b)) {
      removeDeclarer(state, r);
    }

    if (game.kind[next] !== LEAD || decided(game, next, values)) break;
    slot = game.childStart[next] + strategy[next];
  }
  return { steps: joinCash(parts), line: { id: '', text: '', steps: lineSteps } };
}

/** "Slå esset" og "slå kongen" i træk bliver til "Slå esset og kongen". */
function joinCash(parts: { text: string; cash: Rank | null }[]): string[] {
  const steps: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].cash !== null) {
      const names = [cardName(parts[i].cash!)];
      while (i + 1 < parts.length && parts[i + 1].cash !== null) names.push(cardName(parts[++i].cash!));
      const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} og ${names[names.length - 1]}` : names[0];
      steps.push(`Slå ${list}.`);
    } else steps.push(`${capital(parts[i].text)}.`);
  }
  return steps;
}

/** Følger 3. hånd én regel for lave kort og én for honnører fra 2. hånd? */
function consistentThird(game: Game, second: number, thirdFor: (slot: number) => Choice | null): boolean {
  const lows = new Set<number>(), highs = new Set<number>();
  for (let x = 0; x < game.childCount[second]; x++) {
    const s = game.childStart[second] + x;
    if (game.slotHigh[s] === 0) continue; // kendt sidning: linjen slutter
    const c = thirdFor(s);
    (game.slotHigh[s] < JACK ? lows : highs).add(c ? c.rank : 0);
  }
  return lows.size <= 1 && highs.size <= 1;
}

/** Er næste udspil det samme, uanset hvad modspillet lagde i stikket (bortset fra renoncer)? */
function sameNextLead(game: Game, strategy: Int8Array, second: number): boolean {
  let signature: string | null = null;
  for (let x = 0; x < game.childCount[second]; x++) {
    const s2 = game.childStart[second] + x;
    if (game.slotHigh[s2] === 0) continue;
    const third = game.children[s2];
    const fourth = game.children[game.childStart[third] + strategy[third]];
    for (let y = 0; y < game.childCount[fourth]; y++) {
      const s4 = game.childStart[fourth] + y;
      if (game.slotHigh[s4] === 0) continue;
      const next = game.children[s4];
      if (game.kind[next] === END) continue;
      const s = game.childStart[next] + strategy[next];
      const sig = `${game.slotHand[s]}:${game.slotHigh[s]}`;
      if (signature === null) signature = sig;
      else if (sig !== signature) return false;
    }
  }
  return true;
}
