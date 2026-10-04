import { rankText, TEN, type Rank } from '../model/cards';
import { plausible, type Seat, type TrickCard, type WhatNowOption, type WhatNowSituation } from '../model/whatnow';
import { solveSubgame } from './cfr';
import { describeFrom, initialState, playTrick, type WalkState } from './describe';
import { LEAD, type Game, type Hand } from './game';
import { itemValues } from './natural';

/**
 * Hvad nu? (opgavetype 5): et kort er faldet i første runde, og spilføreren skal vælge, hvordan der fortsættes.
 *
 * Første runde spilles efter løserens bedste linje, og modspillerne lægger normalt (specen bruger normalt modspil til
 * forklaringer): 2. hånd lægger det laveste kort, men dækker en udspillet honnør (10 eller højere) så billigt som muligt;
 * 4. hånd vinder så billigt som muligt, hvis makkers kort ikke allerede vinder, og lægger ellers det laveste. Ligeværdige
 * kort (samme hul) vælges tilfældigt, så sidningernes chance bagefter følger begrænset valg af sig selv.
 *
 * Hver fortsættelse løses derefter med optimalt modspil og de sidninger, der stadig er mulige, vægtet med deres nye chance.
 */

export { WHAT_NOW_MODEL, plausible, type Seat, type TrickCard, type WhatNowOption, type WhatNowSituation } from '../model/whatnow';

export interface WhatNowOptions {
  /** Situationer, der sker sjældnere, udelades. */
  minProbability?: number;
  /** Valget skal betyde noget: en rimelig fortsættelse ligger så langt under den bedste. */
  decision?: number;
  maxSituations?: number;
}

/** Vægtene til løseren: chancerne skaleret til heltal. */
const SCALE = 2 ** 40;

const HAND_NAME: Record<Hand, string> = { N: 'bordet', S: 'hånden' };

/**
 * Midt i spillet skal det fremgå, hvem der spiller ud: "Lille fra begge hænder" i første trin bliver til
 * "Lille fra bordet og lille fra hånden" (eller omvendt).
 */
function explicitLead(steps: string[], hand: Hand): string[] {
  const partner: Hand = hand === 'N' ? 'S' : 'N';
  return steps.map((step, i) => (i === 0 ? step.replace(/^Lille fra begge hænder/, `Lille fra ${HAND_NAME[hand]} og lille fra ${HAND_NAME[partner]}`) : step));
}

function cloneState(s: WalkState): WalkState {
  return { decl: s.decl.map((d) => ({ ...d })), gaps: [...s.gaps], physical: { N: [...s.physical.N], S: [...s.physical.S] } };
}

/** Modspillerens mulige kort (barn-slots) i item `i` ved en modspillerknude, højeste hul først; renonce til sidst. */
function available(game: Game, node: number, i: number): number[] {
  const out: number[] = [];
  for (let x = 0; x < game.childCount[node]; x++) if (game.itemChildren[game.itemChildStart[i] + x] >= 0) out.push(x);
  return out;
}

/** Det laveste kort: sidste hul med kort; ellers renoncen. */
function lowest(game: Game, node: number, xs: number[]): number {
  const cs = game.childStart[node];
  const withCards = xs.filter((x) => game.slotHigh[cs + x] > 0);
  return withCards.length ? withCards[withCards.length - 1] : xs[0];
}

/** Det billigste kort, der slår `rank`, eller −1. */
function cheapestOver(game: Game, node: number, xs: number[], rank: Rank): number {
  const cs = game.childStart[node];
  const over = xs.filter((x) => game.slotHigh[cs + x] > 0 && game.slotLow[cs + x] > rank);
  return over.length ? over[over.length - 1] : -1;
}

/** 2. hånd: dækker en honnør (10 eller højere) så billigt som muligt, ellers det laveste kort. */
export function normalSecond(game: Game, node: number, i: number, led: Rank): number {
  const xs = available(game, node, i);
  const cover = led >= TEN ? cheapestOver(game, node, xs, led) : -1;
  return cover >= 0 ? cover : lowest(game, node, xs);
}

/** 4. hånd: vinder så billigt som muligt, hvis makkers kort ikke allerede vinder; ellers det laveste kort. */
export function normalFourth(game: Game, node: number, i: number, winning: Rank, partnerWins: boolean): number {
  const xs = available(game, node, i);
  const win = partnerWins ? -1 : cheapestOver(game, node, xs, winning);
  return win >= 0 ? win : lowest(game, node, xs);
}

/**
 * Situationerne efter første runde af linjen, der begynder med udspillet `leadSlot` og følger `strategy` (løserens
 * bedste linje), hvor en honnør falder (et kort fra et hul, hvor alle kort er 10 eller højere), eller en modspiller ikke
 * kan bekende.
 */
export function whatNow(game: Game, leadSlot: number, strategy: Int8Array, options: WhatNowOptions = {}): WhatNowSituation[] {
  const { minProbability = 0.01, decision = 0.005, maxSituations = 2 } = options;
  const { kind, childStart, childCount, children, slotHigh, slotLow, itemChildStart, itemChildren, nodeItemStart, nodeItemCount, itemLayout } = game;
  const root = children[leadSlot];
  const leader: Hand = game.slotHand[leadSlot] === 0 ? 'N' : 'S';
  const seats: Seat[] = leader === 'N' ? ['N', 'Ø', 'S', 'V'] : ['S', 'V', 'N', 'Ø'];
  const led = slotHigh[leadSlot];

  // Første runde for hver sidning med normalt modspil: hvilken situation (2. og 4. hånds kort) den ender i.
  const groups = new Map<string, { x2: number; x4: number; weights: Float64Array; total: number }>();
  for (let i = nodeItemStart[root]; i < nodeItemStart[root] + nodeItemCount[root]; i++) {
    const x2 = normalSecond(game, root, i, led);
    const s2 = childStart[root] + x2;
    const third = children[s2];
    const x3 = strategy[third];
    const s3 = childStart[third] + x3;
    const fourth = children[s3];
    const i3 = itemChildren[itemChildStart[i] + x2];
    const i4 = itemChildren[itemChildStart[i3] + x3];
    const ours = Math.max(led, slotHigh[s3]);
    const partnerWins = slotHigh[s2] > 0 && slotLow[s2] > ours;
    const x4 = normalFourth(game, fourth, i4, ours, partnerWins);
    const key = `${x2}:${x4}`;
    let group = groups.get(key);
    if (!group) groups.set(key, (group = { x2, x4, weights: new Float64Array(game.layouts.length), total: 0 }));
    group.weights[itemLayout[i]] += game.layoutWeight[itemLayout[i]];
    group.total += game.layoutWeight[itemLayout[i]];
  }

  const situations: WhatNowSituation[] = [];
  for (const { x2, x4, weights, total } of groups.values()) {
    const s2 = childStart[root] + x2;
    const third = children[s2];
    const s3 = childStart[third] + strategy[third];
    const fourth = children[s3];
    const s4 = childStart[fourth] + x4;
    const node = children[s4];
    if (kind[node] !== LEAD || total < minProbability) continue;
    const fell = (s: number) => slotHigh[s] === 0 || slotLow[s] >= TEN;
    if (!fell(s2) && !fell(s4)) continue;
    const posterior = Array.from(weights, (w) => w / total);
    const scaled = posterior.map((p) => BigInt(Math.round(p * SCALE)));

    // Stillingen efter første runde og de kort, der blev lagt.
    const state = initialState(game);
    const shown = new Set<Rank>();
    const defenderCard = (s: number) => {
      if (slotHigh[s] === 0) return '–';
      if (slotLow[s] < TEN) return 'x';
      const card = Math.max(...game.missing.filter((r) => r <= slotHigh[s] && r >= slotLow[s] && !shown.has(r)));
      shown.add(card);
      return rankText(card);
    };
    const second = defenderCard(s2);
    const fourthCard = defenderCard(s4);
    const played = playTrick(game, state, leadSlot, s2, s3, s4);
    const trick: TrickCard[] = [
      { seat: seats[0], card: rankText(played.led.rank) },
      { seat: seats[1], card: second },
      { seat: seats[2], card: played.third ? rankText(played.third.rank) : '–' },
      { seat: seats[3], card: fourthCard },
    ];

    // Hver fortsættelse løses for sig med optimalt modspil og de nye chancer.
    const continuations: WhatNowOption[] = [];
    for (let x = 0; x < childCount[node]; x++) {
      const slot = childStart[node] + x;
      const child = children[slot];
      const sub = solveSubgame(game, child, { weights: scaled });
      const described = describeFrom(game, sub.strategy, slot, cloneState(state), itemValues(game, child, sub.strategy));
      const hand: Hand = game.slotHand[slot] === 0 ? 'N' : 'S';
      continuations.push({
        hand,
        high: slotHigh[slot],
        low: slotLow[slot],
        value: sub.value,
        certified: sub.certified,
        layouts: Array.from(sub.layoutValues),
        steps: explicitLead(described.steps, hand),
      });
    }
    continuations.sort((a, b) => b.value - a.value);
    const best = continuations[0].value;
    if (!continuations.some((c) => plausible(c, best) && best - c.value > decision)) continue;
    situations.push({ trick, probability: total, posterior, options: continuations });
  }
  return situations.sort((a, b) => b.probability - a.probability).slice(0, maxSituations);
}
