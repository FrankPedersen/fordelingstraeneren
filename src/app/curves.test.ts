import { describe, expect, it } from 'vitest';
import { defaultSaved, type SessionRecord } from '../engine/storage';
import { weeklyCurves } from './curves';

const session = (day: string, cpm: number, grades?: SessionRecord['grades']): SessionRecord => ({
  day,
  ms: 300_000,
  correct: 10,
  total: 12,
  cpm,
  ...(grades ? { grades } : {}),
});

describe('Kurver', () => {
  it('samler sessionerne pr. uge med uger uden sessioner som huller', () => {
    const saved = defaultSaved();
    saved.sessions = [session('2026-09-29', 10), session('2026-10-14', 14)];
    const weeks = weeklyCurves(saved);
    expect(weeks.map((w) => w.label)).toEqual(['uge 40', 'uge 41', 'uge 42']);
    expect(weeks.map((w) => w.sessions)).toEqual([1, 0, 1]);
  });

  it('skiller lynrunden ad i højere/lavere-dage og Lynaflæsningsdage', () => {
    const saved = defaultSaved();
    // 2/10 er en højere/lavere-dag, 3/10 en Lynaflæsningsdag.
    saved.sessions = [session('2026-10-02', 12), session('2026-10-02', 14), session('2026-10-03', 8)];
    const [week] = weeklyCurves(saved);
    expect(week).toMatchObject({ higherLower: 13, read: 8 });
  });

  it('beregner træfsikkerheden pr. grad', () => {
    const saved = defaultSaved();
    saved.sessions = [
      session('2026-10-01', 10, { common: [9, 10], uncommon: [1, 4] }),
      session('2026-10-02', 10, { common: [10, 10] }),
    ];
    const [week] = weeklyCurves(saved);
    expect(week.grades).toEqual({ common: 0.95, uncommon: 0.25 });
  });

  it('viser højst de seneste 12 uger', () => {
    const saved = defaultSaved();
    saved.sessions = [session('2026-01-05', 5), session('2026-10-02', 9)];
    const weeks = weeklyCurves(saved);
    expect(weeks).toHaveLength(12);
    expect(weeks.at(-1)?.label).toBe('uge 40');
  });
});
