import { describe, expect, it } from 'vitest';
import { PATTERNS, patternById } from '../../domain/patterns';
import { checkHigherLower, makeHigherLowerTask } from './task';

const pool = PATTERNS.slice(0, 13);
const seeds = Array.from({ length: 200 }, (_, i) => i + 1);

describe('Højere/lavere – opgaver', () => {
  it('genskabes ud fra sit seed', () => {
    const p = patternById('5-4-3-1');
    expect(makeHigherLowerTask(7, p, pool, 'normal')).toEqual(makeHigherLowerTask(7, p, pool, 'normal'));
  });

  it('parrer mønstret med et andet fra puljen og placerer det både til venstre og højre', () => {
    const p = patternById('5-4-3-1');
    const tasks = seeds.map((seed) => makeHigherLowerTask(seed, p, pool, 'normal'));
    for (const t of tasks) {
      expect([t.a, t.b]).toContain('5-4-3-1');
      expect(t.a).not.toBe(t.b);
      expect(t.patternId).toBe('5-4-3-1');
    }
    expect(tasks.some((t) => t.a === '5-4-3-1')).toBe(true);
    expect(tasks.some((t) => t.b === '5-4-3-1')).toBe(true);
  });

  it('vælger nabo-rang fra samme grad, når opgaverne skal være svære', () => {
    for (const seed of seeds) {
      const t = makeHigherLowerTask(seed, patternById('4-3-3-3'), pool, 'hard');
      expect([t.a, t.b].sort()).toEqual(['4-3-3-3', '5-4-2-2']);
    }
  });

  it('holder mindst tre pladser imellem, når opgaverne skal være lette', () => {
    const p = patternById('5-4-3-1');
    for (const seed of seeds) {
      const t = makeHigherLowerTask(seed, p, pool, 'easy');
      const other = patternById(t.a === p.id ? t.b : t.a);
      expect(Math.abs(other.rank - p.rank)).toBeGreaterThanOrEqual(3);
    }
  });

  it('kan selv vælge mønstret fra puljen', () => {
    const ids = new Set(seeds.map((seed) => makeHigherLowerTask(seed, null, pool, 'normal').patternId));
    expect(ids.size).toBe(13);
  });

  it('godkender det hyppigste mønster og ≈ ved lige hyppige', () => {
    const t = { kind: 'higher-lower', seed: 1, patternId: '5-3-3-2', a: '5-3-3-2', b: '4-4-3-2' } as const;
    expect(checkHigherLower(t, 'b')).toBe(true);
    expect(checkHigherLower(t, 'a')).toBe(false);
    expect(checkHigherLower(t, 'equal')).toBe(false);
    const eq = { ...t, a: '5-4-2-2', b: '4-3-3-3' };
    expect(checkHigherLower(eq, 'equal')).toBe(true);
    expect(checkHigherLower(eq, 'a')).toBe(false);
  });
});
