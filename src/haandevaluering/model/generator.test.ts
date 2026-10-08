import { describe, expect, it } from 'vitest';
import { suitLengths } from '../../domain/cards';
import { patternOf } from '../../domain/patterns';
import { chooseCall, hcpOf } from '../../system/interpreter';
import {
  DECISION_WINDOW,
  exercisesFor,
  GENERATED,
  makeTask,
  NOTRUMP_HCP,
  PARTNER_RANGE,
  pairP,
  type HandTask,
  type Level,
} from './generator';
import { LIMITS, majorFit, pOf, stoppedSuits } from './pmodel';

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1);
const tasks = <E extends HandTask['exercise']>(exercise: E) =>
  SEEDS.map((seed) => makeTask(exercise, seed) as Extract<HandTask, { exercise: E }>);

const BALANCED = ['4-3-3-3', '4-4-3-2', '5-3-3-2'];

describe('Generatoren (SPEC-haandevaluering.md, Generator)', () => {
  it('alle opgave 4-fordelinger har P inden for ±2 af en grænse, og alle tre grænser forekommer', () => {
    const limits = new Set<number>();
    for (const t of tasks('decision')) {
      expect(majorFit(t.hands.S, t.hands.N)).toBe(t.trump);
      expect([LIMITS.invite, LIMITS.game, LIMITS.slam]).toContain(t.limit);
      expect(Math.abs(pairP(t.hands, t.trump) - t.limit), `seed ${t.seed}`).toBeLessThanOrEqual(DECISION_WINDOW);
      limits.add(t.limit);
    }
    expect(limits).toEqual(new Set([LIMITS.invite, LIMITS.game, LIMITS.slam]));
  }, 30_000);

  it('samme seed giver samme opgave', () => {
    for (const exercise of GENERATED) {
      for (const seed of [1, 2, 99, 4_000_000_000]) expect(makeTask(exercise, seed)).toEqual(makeTask(exercise, seed));
    }
    expect(makeTask('decision', 1)).not.toEqual(makeTask('decision', 2));
  });

  it('farveopgaverne har en 8+ fit i en major', () => {
    for (const exercise of ['distribution', 'decision', 'partner', 'wasted'] as const) {
      for (const t of tasks(exercise)) expect(majorFit(t.hands.S, t.hands.N), `${exercise} ${t.seed}`).toBe(t.trump);
    }
  }, 30_000);

  it('opgave 3: meldeforløbet afgør, hvilke led der gælder', () => {
    const seen = new Set<string>();
    for (const t of tasks('add')) {
      seen.add(t.scenario);
      expect(chooseCall('opening', t.hands.N)?.call).toBe(t.opening);
      const lengths = suitLengths(t.hands.S);
      const major = t.opening === '1S' ? 0 : t.opening === '1H' ? 1 : null;
      if (t.scenario === 'fit') expect(lengths[major!]).toBeGreaterThanOrEqual(3);
      if (t.scenario === 'no-fit') {
        expect(t.opening).toMatch(/^1[SHDC]$/);
        if (major !== null) expect(lengths[major]).toBeLessThanOrEqual(2);
      }
      if (t.scenario === 'notrump') {
        expect(t.opening).toBe('1NT');
        expect(BALANCED).toContain(patternOf(lengths).id);
        expect(Math.max(lengths[0], lengths[1])).toBeLessThanOrEqual(3);
      }
    }
    expect(seen).toEqual(new Set(['no-fit', 'fit', 'notrump']));
  }, 30_000);

  it('opgave 5: dine point ligger mellem 10 og 24', () => {
    for (const t of tasks('partner')) {
      const p = pOf(t.hands.S, { trump: t.trump }).p;
      expect(p).toBeGreaterThanOrEqual(PARTNER_RANGE.min);
      expect(p).toBeLessThanOrEqual(PARTNER_RANGE.max);
    }
  });

  it('opgave 6: farveopgaver har major-fit i udgangszonen; sansopgaver to balancerede hænder uden major-fit, 24–26 HCP og alle farver stoppet', () => {
    let major = 0, notrump = 0;
    for (const t of tasks('strain')) {
      if (t.trump !== null) {
        major++;
        expect(majorFit(t.hands.S, t.hands.N)).toBe(t.trump);
        const P = pairP(t.hands, t.trump);
        expect(P).toBeGreaterThanOrEqual(LIMITS.game);
        expect(P).toBeLessThan(LIMITS.slam);
      } else {
        notrump++;
        expect(majorFit(t.hands.S, t.hands.N)).toBeNull();
        for (const hand of [t.hands.S, t.hands.N]) expect(BALANCED).toContain(patternOf(suitLengths(hand)).id);
        const hcp = hcpOf(t.hands.S) + hcpOf(t.hands.N);
        expect(hcp).toBeGreaterThanOrEqual(NOTRUMP_HCP[0]);
        expect(hcp).toBeLessThanOrEqual(NOTRUMP_HCP[1]);
        expect(stoppedSuits(t.hands.S, t.hands.N)).toHaveLength(4);
      }
    }
    expect(major).toBeGreaterThan(100);
    expect(notrump).toBeGreaterThan(100);
  }, 30_000);

  it('opgave 7: makker har 4+ trumf og en singleton eller renonce i en sidefarve; en del har en konge eller kun dame og knægt over for den', () => {
    let king = 0, queenJack = 0;
    for (const t of tasks('wasted')) {
      const north = suitLengths(t.hands.N);
      expect(t.short).not.toBe(t.trump);
      expect(north[t.short]).toBeLessThanOrEqual(1);
      expect(north[t.trump]).toBeGreaterThanOrEqual(4);
      const wasted = pOf(t.hands.S, { trump: t.trump, partnerShort: [t.short] }).wasted;
      if (wasted < 0) king++;
      else if (t.hands.S.some((c) => Math.floor(c / 13) === t.short && [9, 10].includes(c % 13))) queenJack++;
    }
    expect(king).toBeGreaterThan(80);
    expect(queenJack).toBeGreaterThan(80);
  }, 30_000);

  it('niveauerne giver deres øvelser; niveau 5 blander alle, og opgave 8–9 venter på leverancetrin 4', () => {
    expect(exercisesFor(1)).toEqual(['honors', 'partner']);
    expect(exercisesFor(2)).toEqual(['distribution', 'add']);
    expect(exercisesFor(3)).toEqual(['decision', 'wasted']);
    expect(exercisesFor(4)).toEqual(['strain']);
    expect(exercisesFor(5)).toEqual(GENERATED);
    for (const level of [1, 2, 3, 4, 5] as Level[]) expect(exercisesFor(level).length).toBeGreaterThan(0);
    expect(() => makeTask('compare', 1)).toThrow();
    expect(() => makeTask('form', 1)).toThrow();
  });
});
