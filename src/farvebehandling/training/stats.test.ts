import { describe, expect, it } from 'vitest';
import { defaultFbSaved, type PracticeEntry } from '../storage';
import { TEST_BANK as bank } from '../testBank';
import { accuracy, byWeakness, taskStats, techniqueStats, weakest, type StatRow } from './stats';

const entry = (item: string, task: PracticeEntry['task'], score: PracticeEntry['score'], day = '2026-10-04'): PracticeEntry => ({
  day,
  item,
  task,
  score,
  ms: 1000,
});

describe('Statistikken', () => {
  it('tæller Træning og Selvvalgt pr. teknik og opgavetype, halve som 0,5 og de seneste 30 dage for sig', () => {
    const saved = {
      ...defaultFbSaved(),
      training: [entry('J32-AK54:3', 'vælg-linjen', 1), entry('J32-AK54:3', 'chancen', 0.5, '2026-08-01')],
      practice: [entry('432-K765:2', 'vælg-linjen', 0)],
    };
    // E K 5 4 / B 3 2 er spil mod honnør; K 7 6 5 / 4 3 2 er sikkerhedsspil.
    expect(techniqueStats(saved, bank, ['spil-mod-honnoer', 'sikkerhedsspil', 'fald-eller-kip'], '2026-10-04')).toEqual([
      { key: 'spil-mod-honnoer', all: { answers: 2, score: 1.5 }, recent: { answers: 1, score: 1 } },
      { key: 'sikkerhedsspil', all: { answers: 1, score: 0 }, recent: { answers: 1, score: 0 } },
      { key: 'fald-eller-kip', all: { answers: 0, score: 0 }, recent: { answers: 0, score: 0 } },
    ]);
    const tasks = taskStats(saved, '2026-10-04');
    expect(tasks).toHaveLength(9);
    expect(tasks.find((r) => r.key === 'vælg-linjen')!.all).toEqual({ answers: 2, score: 1 });
    expect(tasks.find((r) => r.key === 'chancen')!.recent).toEqual({ answers: 0, score: 0 });
  });

  it('sorterer svageste først og kræver mindst 5 svar og under 100 % for et svagt punkt', () => {
    const row = (key: string, answers: number, score: number): StatRow => ({ key, all: { answers, score }, recent: { answers: 0, score: 0 } });
    const rows = [row('a', 10, 9), row('b', 4, 0), row('c', 5, 2.5), row('d', 6, 3)];
    // c og d har begge 50 %; flest svar først.
    expect(byWeakness(rows).map((r) => r.key)).toEqual(['d', 'c', 'a', 'b']);
    expect(weakest(rows)!.key).toBe('d');
    expect(weakest([row('a', 10, 10)])).toBeNull();
    expect(weakest([row('b', 4, 0)])).toBeNull();
    expect(accuracy({ answers: 0, score: 0 })).toBeNull();
  });
});
