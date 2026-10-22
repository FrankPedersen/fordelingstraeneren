import { describe, expect, it } from 'vitest';
import type { Hands } from '../../domain/dealer';
import { hcpOf } from '../../system/interpreter';
import { facitOf } from '../training/scoring';
import { compareMethods, EXERCISES, exercisesFor, makeTask, pairP, type HandTask } from './generator';
import { parseHand } from './hand';
import { contractFor, formLimits, gameThreshold, LIMITS, majorFit, pOf, rightDecisions, zarPoints } from './pmodel';

// SPEC-haandevaluering.md, leverancetrin 4: opgave 8 (Sammenlign metoder) og 9 (Turneringsform). Opgave 8 efter Franks
// svar (21. oktober 2026): HCP og Zar vises med tal og beslutning, P er skjult til facit, og kun hænder, hvor HCP og Zar
// er uenige, og hvor kun ét svar er rigtigt efter rightDecisions.

/** En fordeling med Syd (dig) og Nord (makker); Øst og Vest er resten af kortene. */
function deal(south: string, north: string): Hands {
  const S = parseHand(south), N = parseHand(north);
  const rest = Array.from({ length: 52 }, (_, c) => c).filter((c) => !S.includes(c) && !N.includes(c));
  return { N, E: rest.slice(0, 13), S, W: rest.slice(13) };
}

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1);
const tasks = <E extends HandTask['exercise']>(exercise: E) =>
  SEEDS.map((seed) => makeTask(exercise, seed) as Extract<HandTask, { exercise: E }>);

describe('Opgave 8: Sammenlign metoder', () => {
  it('eksempel 1: ♠ E K 7 5 2 ♥ 4 ♦ K D 6 3 ♣ 8 5 2 over for ♠ D 9 6 3 ♥ K 8 7 2 ♦ 9 4 ♣ E 7 3 – alle tre siger delkontrakt, så det er ingen opgave', () => {
    const hands = deal('AK752.4.KQ63.852', 'Q963.K872.94.A73');
    expect([hcpOf(hands.S), hcpOf(hands.N)]).toEqual([12, 9]);
    expect([zarPoints(hands.S).zp, zarPoints(hands.N).zp]).toEqual([29, 22]);
    expect([pOf(hands.S, { trump: 0 }).p, pOf(hands.N, { trump: 0 }).p]).toEqual([17, 10.5]);
    const m = compareMethods(hands, 0);
    expect(m.hcp).toMatchObject({ total: 21, decision: 'partscore' });
    expect(m.zar).toMatchObject({ total: 51, decision: 'partscore' });
    expect(m.P).toBe(27.5);
    expect(m.decision).toBe('partscore');
    // HCP og Zar er enige, så fordelingen bliver ikke en opgave 8.
    expect(m.right).toBeNull();
  });

  it('eksempel 2: ♠ B 6 5 ♥ K B 9 2 ♦ 9 8 7 ♣ E K 3 over for ♠ E D 10 ♥ E D 8 7 ♦ 10 6 4 ♣ D 6 4 – HCP 26 siger udgang, Zar 50 ZP delkontrakt, og Zar har ret (P = 27)', () => {
    const hands = deal('J65.KJ92.987.AK3', 'AQT.AQ87.T64.Q64');
    expect(majorFit(hands.S, hands.N)).toBe(1);
    const m = compareMethods(hands, 1);
    expect(m.hcp).toMatchObject({ you: 12, partner: 14, total: 26, decision: 'game' });
    expect(m.zar).toMatchObject({ you: 24, partner: 26, total: 50, decision: 'partscore' });
    expect(m.P).toBe(27);
    expect(m.decision).toBe('partscore');
    expect(m.right).toBe('zar');
  });

  it('generatoren: HCP og Zar er altid uenige, kun ét svar er rigtigt, og HCP og Zar har ret lige ofte', () => {
    const right = { hcp: 0, zar: 0 };
    for (const t of tasks('compare')) {
      expect(majorFit(t.hands.S, t.hands.N), `seed ${t.seed}`).toBe(t.trump);
      const m = compareMethods(t.hands, t.trump);
      expect(m.hcp.decision, `seed ${t.seed}`).not.toBe(m.zar.decision);
      expect(rightDecisions(m.P), `seed ${t.seed}`).toHaveLength(1);
      expect(m[m.right!].decision).toBe(contractFor(m.P));
      const facit = facitOf(t);
      if (facit.exercise !== 'compare') throw new Error('forkert facit');
      expect(facit.right).toBe(m.right);
      right[m.right!]++;
    }
    // Lige mange i forventning: hver opgave vælger med lige stor chance, hvilken metode der skal have ret.
    expect(right.hcp + right.zar).toBe(SEEDS.length);
    expect(right.hcp / SEEDS.length).toBeGreaterThan(0.4);
    expect(right.zar / SEEDS.length).toBeGreaterThan(0.4);
  }, 60_000);

  it('HCP-metodens udgangsgrænse er 23 (SPEC-haandevaluering-kalibrering.md) og Zars 52 ZP', () => {
    const hands = deal('AK752.4.KQ63.852', 'Q963.K872.94.A73');
    expect(compareMethods(hands, 0).hcp.limit).toBe(23);
    expect(compareMethods(hands, 0).zar.limit).toBe(52);
  });
});

describe('Opgave 9: Turneringsform', () => {
  it('udgangsgrænsen er 27½ ved holdturnering i zonen, 28 uden for zonen og 28½ ved parturnering', () => {
    expect(gameThreshold('impVulnerable')).toBe(27.5);
    expect(gameThreshold('impNotVulnerable')).toBe(28);
    expect(gameThreshold('pairs')).toBe(28.5);
    expect(formLimits('pairs')).toEqual(LIMITS);
    expect(formLimits('impVulnerable')).toEqual({ ...LIMITS, game: 27.5 });
  });

  it('niveaubeslutningen følger turneringsformens grænse med nabovalg inden for ½ point', () => {
    expect(rightDecisions(27.5, undefined, formLimits('impVulnerable'))).toEqual(['partscore', 'game']);
    expect(rightDecisions(28.5, undefined, formLimits('impVulnerable'))).toEqual(['game']);
    expect(rightDecisions(28, undefined, formLimits('impNotVulnerable'))).toEqual(['partscore', 'game']);
    expect(rightDecisions(27, undefined, formLimits('pairs'))).toEqual(['partscore']);
    expect(rightDecisions(29.5, undefined, formLimits('pairs'))).toEqual(['game']);
  });

  it('generatoren: alle tre former forekommer, og P ligger inden for ±2 af formens udgangsgrænse', () => {
    const forms = new Set<string>();
    for (const t of tasks('form')) {
      forms.add(t.form);
      expect(majorFit(t.hands.S, t.hands.N), `seed ${t.seed}`).toBe(t.trump);
      const P = pairP(t.hands, t.trump);
      expect(Math.abs(P - gameThreshold(t.form)), `seed ${t.seed}`).toBeLessThanOrEqual(2);
      const facit = facitOf(t);
      if (facit.exercise !== 'form') throw new Error('forkert facit');
      expect(facit.right).toEqual(rightDecisions(P, facit.controls, formLimits(t.form)));
    }
    expect(forms).toEqual(new Set(['impVulnerable', 'impNotVulnerable', 'pairs']));
  }, 60_000);
});

describe('Niveauerne med opgave 8 og 9', () => {
  it('niveau 4 har opgave 6 og 8, niveau 5 opgave 9 og blandede opgaver fra alle niveauer', () => {
    expect(exercisesFor(4)).toEqual(['strain', 'compare']);
    expect(exercisesFor(5)).toEqual(EXERCISES);
    expect(exercisesFor(5)).toContain('form');
  });

  it('samme seed giver samme opgave 8 og 9', () => {
    for (const exercise of ['compare', 'form'] as const) {
      for (const seed of [1, 2, 99, 4_000_000_000]) expect(makeTask(exercise, seed)).toEqual(makeTask(exercise, seed));
    }
  });
});
