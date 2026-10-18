import { describe, expect, it } from 'vitest';
import { binomial } from '../../domain/combinatorics';
import { buildGame, layoutOf } from '../solver/game';
import { missingCards, parseCards, type Rank } from './cards';
import { canStep, gameOptionsFor, honorPoints, isPossible, isStandard, missingHp, situationWeights, STANDARD, vacantOf, type Situation } from './situation';

// SPEC-analyse-situation.md, leverancetrin 1: ledige pladser og eksakte vægte.

const situation = (known: [number, number], maxHp: [number, number]): Situation => ({
  known: { west: known[0], east: known[1] },
  maxHp: { west: maxHp[0], east: maxHp[1] },
});

/** Vægten talt direkte: hver konkret Vest-hånd med chancen C(U − n, v_V − k), hvis begge modspilleres hp er inden for grænserne. */
function concrete(north: Rank[], south: Rank[], s: Situation) {
  const missing = missingCards(north, south);
  const n = missing.length;
  const vacant = vacantOf(s);
  const u = vacant.west + vacant.east;
  const total = missing.reduce((a, r) => a + honorPoints(r), 0);
  const holdings: { west: Rank[]; weight: bigint }[] = [];
  for (let mask = 0; mask < 1 << n; mask++) {
    const west = missing.filter((_, i) => mask & (1 << i));
    const hp = west.reduce((a, r) => a + honorPoints(r), 0);
    if (hp > s.maxHp.west || total - hp > s.maxHp.east) continue;
    const weight = binomial(u - n, vacant.west - west.length);
    if (weight > 0n) holdings.push({ west, weight });
  }
  return holdings;
}

describe('Situationen (model)', () => {
  it('standard er 0 kendte kort og maks. 10 hp hos begge', () => {
    expect(STANDARD).toEqual(situation([0, 0], [10, 10]));
    expect(isStandard(STANDARD)).toBe(true);
    expect(isStandard(situation([1, 0], [10, 10]))).toBe(false);
    expect(isStandard(situation([0, 0], [10, 9]))).toBe(false);
  });

  it('ledige pladser er 13 minus de kendte kort', () => {
    expect(vacantOf(STANDARD)).toEqual({ west: 13, east: 13 });
    expect(vacantOf(situation([5, 2], [10, 10]))).toEqual({ west: 8, east: 11 });
  });

  it('honnørpoint: E 4, K 3, D 2, B 1, ellers 0', () => {
    expect([14, 13, 12, 11, 10, 2].map(honorPoints)).toEqual([4, 3, 2, 1, 0, 0]);
    expect(missingHp(parseCards('AJ43'), parseCards('652'))).toBe(5);
  });

  it('uden hp-grænse, der binder, deles intet hul', () => {
    const north = parseCards('AJ43'), south = parseCards('652');
    expect(gameOptionsFor(north, south, STANDARD)).toEqual({ vacant: { west: 13, east: 13 }, splitHonors: false });
    expect(gameOptionsFor(north, south, situation([5, 2], [5, 5])).splitHonors).toBe(false);
    expect(gameOptionsFor(north, south, situation([0, 0], [4, 10])).splitHonors).toBe(true);
  });

  it('vægte ved delt hul: E B 4 3 / 6 5 2 for alle hp-grænser 0–10 er lig de konkrete sidninger talt direkte', { timeout: 60_000 }, () => {
    // K og D ligger i samme hul (mellem E og B), så hullet deles, når en grænse binder.
    const north = parseCards('AJ43'), south = parseCards('652');
    // Spillet afhænger kun af de ledige pladser og delingen; det bygges én gang for hver.
    const games = new Map<string, ReturnType<typeof buildGame>>();
    for (const known of [[0, 0], [5, 2]] as [number, number][]) {
      for (let w = 0; w <= 10; w++) {
        for (let e = 0; e <= 10; e++) {
          const s = situation(known, [w, e]);
          const options = gameOptionsFor(north, south, s);
          const key = JSON.stringify(options);
          if (!games.has(key)) games.set(key, buildGame(north, south, { objective: { kind: 'goal', goal: 3 }, ...options }));
          const game = games.get(key)!;
          const weights = situationWeights(game, s);
          expect(weights).toHaveLength(game.layouts.length);
          // Sidning for sidning: summen over de konkrete sidninger i den abstrakte, der overholder grænserne.
          const expected = game.layouts.map(() => 0n);
          for (const h of concrete(north, south, s)) expected[layoutOf(game, h.west)] += h.weight;
          expect({ w, e, known, weights }).toEqual({ w, e, known, weights: expected });
        }
      }
    }
  });

  it('en situation, der ikke kan lade sig gøre, kan ikke vælges', () => {
    const north = parseCards('AJ43'), south = parseCards('652');
    expect(isPossible(north, south, STANDARD)).toBe(true);
    expect(isPossible(north, south, situation([13, 13], [10, 10]))).toBe(false);
    // 6 manglende kort kræver 6 ledige pladser: 13 − 10 + 13 − 10 = 6 går, 13 − 11 + 13 − 10 = 5 går ikke.
    expect(isPossible(north, south, situation([10, 10], [10, 10]))).toBe(true);
    expect(isPossible(north, south, situation([11, 10], [10, 10]))).toBe(false);
    // K og D (5 hp) kan ikke fordeles med højst 1 hp hos Vest og 4 hos Øst.
    expect(isPossible(north, south, situation([0, 0], [1, 4]))).toBe(false);
    expect(isPossible(north, south, situation([0, 0], [2, 3]))).toBe(true);
    // Uden for intervallerne.
    expect(isPossible(north, south, situation([-1, 0], [10, 10]))).toBe(false);
    expect(isPossible(north, south, situation([0, 14], [10, 10]))).toBe(false);
    expect(isPossible(north, south, situation([0, 0], [11, 10]))).toBe(false);
  });

  it('trinvælgerne kan ikke gøre situationen umulig', () => {
    const north = parseCards('AJ43'), south = parseCards('652');
    expect(canStep(north, south, STANDARD, 'known', 'west', 1)).toBe(true);
    expect(canStep(north, south, STANDARD, 'known', 'west', -1)).toBe(false);
    expect(canStep(north, south, STANDARD, 'maxHp', 'east', 1)).toBe(false);
    expect(canStep(north, south, situation([10, 10], [10, 10]), 'known', 'east', 1)).toBe(false);
    expect(canStep(north, south, situation([0, 0], [2, 3]), 'maxHp', 'east', -1)).toBe(false);
    // Vest maks. 1 hp kan ikke have K eller D, og Øst kan ikke have begge (5 hp) med maks. 3.
    expect(canStep(north, south, situation([0, 0], [2, 3]), 'maxHp', 'west', -1)).toBe(false);
    expect(canStep(north, south, situation([0, 0], [2, 3]), 'maxHp', 'west', 1)).toBe(true);
    expect(canStep(north, south, situation([12, 12], [10, 10]), 'known', 'west', 1)).toBe(false);
  });
});
