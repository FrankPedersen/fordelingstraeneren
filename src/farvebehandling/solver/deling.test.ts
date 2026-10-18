import { describe, expect, it } from 'vitest';
import { binomial } from '../../domain/combinatorics';
import { parseCards, type Rank } from '../model/cards';
import { gameOptionsFor, honorPoints, situationWeights, STANDARD, vacantOf, type Situation } from '../model/situation';
import { buildGame, layoutOf, type Game } from './game';
import { solveGame, type LeadSolution } from './solve';

/**
 * Delt og udelt beregning (SPEC-analyse-situation.md, Afklaret 4). Appen deler hullerne, når en hp-grænse binder, så
 * analysen er eksakt. Til kontrol regnes det samme også på det udelte spil med vægte talt over de konkrete sidninger.
 * De to gav samme tal for alle første udspil i disse 8 kombinationer (18. oktober 2026); testen opdager det, hvis de
 * en dag giver forskellige tal. Den udelte beregning bruges kun her, aldrig i appen.
 */

const maxHp = (west: number, east: number): Situation => ({ ...STANDARD, maxHp: { west, east } });
const cases: [string, string, number, Situation][] = [
  ['AJ43', '652', 3, maxHp(2, 10)],
  ['A932', 'JT54', 3, maxHp(3, 10)],
  ['AJ2', 'T43', 2, maxHp(3, 10)],
  ['KJ32', '7654', 3, maxHp(10, 2)],
  ['AT32', 'K954', 3, maxHp(2, 10)],
  ['AQ7642', 'J5', 5, maxHp(0, 10)],
  ['A5432', 'J6', 4, maxHp(3, 10)],
  ['A54', '32', 2, maxHp(4, 10)],
];

/** Vægtene på det udelte spil: hver konkret Vest-hånd inden for grænserne lagt til sin abstrakte sidning. */
function concreteWeights(game: Game, s: Situation): bigint[] {
  const vacant = vacantOf(s);
  const u = vacant.west + vacant.east;
  const n = game.missing.length;
  const total = game.missing.reduce((a, r) => a + honorPoints(r), 0);
  const weights = game.layouts.map(() => 0n);
  for (let mask = 0; mask < 1 << n; mask++) {
    const west: Rank[] = game.missing.filter((_, i) => mask & (1 << i));
    const hp = west.reduce((a, r) => a + honorPoints(r), 0);
    if (hp > s.maxHp.west || total - hp > s.maxHp.east) continue;
    const w = binomial(u - n, vacant.west - west.length);
    if (w > 0n) weights[layoutOf(game, west)] += w;
  }
  return weights;
}

/** Samme tal: certificerede linjer sammenlignes eksakt (brøkerne), ellers inden for 0,0001. */
function same(a: LeadSolution, b: LeadSolution) {
  if (a.certified && b.certified) expect(a.exact * b.weight).toBe(b.exact * a.weight);
  else expect(a.value).toBeCloseTo(b.value, 4);
}

describe('Delt og udelt beregning giver samme tal', () => {
  for (const [n, s, goal, situation] of cases) {
    it(`${n} / ${s}, ${goal} stik, maks. hp Vest ${situation.maxHp.west} og Øst ${situation.maxHp.east}`, { timeout: 300_000 }, () => {
      const north = parseCards(n), south = parseCards(s);
      const objective = { kind: 'goal', goal } as const;
      const options = gameOptionsFor(north, south, situation);
      expect(options.splitHonors).toBe(true);
      const split = buildGame(north, south, { objective, ...options });
      const whole = buildGame(north, south, { objective, vacant: options.vacant });
      const a = solveGame(split, { weights: situationWeights(split, situation) });
      const b = solveGame(whole, { weights: concreteWeights(whole, situation) });
      expect(a.leads.map((l) => l.lead)).toEqual(b.leads.map((l) => l.lead));
      a.leads.forEach((l, i) => same(l, b.leads[i]));
    });
  }
});
