import { describe, expect, it } from 'vitest';
import { completions } from '../../domain/complete';
import { PATTERNS, patternById } from '../../domain/patterns';
import {
  instructionText,
  makeCompleteTask,
  scoreComplete,
  scoreRanking,
  shownText,
  type CompleteTask,
} from './task';

const task: CompleteTask = {
  kind: 'complete',
  seed: 1,
  patternId: '5-4-3-1',
  seat: 'W',
  lengths: [5, 4, 1, 3],
  known: [5, 4, null, null],
  count: 3,
  all: true,
};

const seeds = Array.from({ length: 100 }, (_, i) => i + 1);

describe('Fuldfør – scoring', () => {
  it('giver fuld score for rigtig mængde og rækkefølge og halv score for rigtig mængde', () => {
    expect(scoreComplete(task, ['5-4-3-1', '5-4-2-2', '5-4-4-0'])).toBe(1);
    expect(scoreComplete(task, ['5-4-2-2', '5-4-3-1', '5-4-4-0'])).toBe(0.5);
    expect(scoreComplete(task, ['5-4-3-1', '5-4-2-2'])).toBe(0);
    expect(scoreComplete(task, ['5-4-3-1', '5-4-2-2', '6-4-2-1'])).toBe(0);
    expect(scoreComplete(task, ['5-4-3-1', '5-4-3-1', '5-4-2-2'])).toBe(0);
  });

  it('tillader vilkårlig rækkefølge mellem lige hyppige mønstre', () => {
    const ranked = [
      { id: 'a', weight: 5n },
      { id: 'b', weight: 3n },
      { id: 'c', weight: 3n },
      { id: 'd', weight: 1n },
    ];
    expect(scoreRanking(ranked, ['a', 'c', 'b'], 3)).toBe(1);
    expect(scoreRanking(ranked, ['a', 'b'], 2)).toBe(1);
    expect(scoreRanking(ranked, ['a', 'c'], 2)).toBe(1);
    expect(scoreRanking(ranked, ['c', 'a'], 2)).toBe(0.5);
    expect(scoreRanking(ranked, ['a', 'd'], 2)).toBe(0);
  });
});

describe('Fuldfør – opgaver', () => {
  it('genskabes ud fra sit seed', () => {
    const p = patternById('6-3-2-2');
    expect(makeCompleteTask(9, p, 'normal')).toEqual(makeCompleteTask(9, p, 'normal'));
  });

  it('viser farver fra en hånd med mønstret, og mønstret er blandt de mulige', () => {
    for (const p of PATTERNS.slice(0, 13)) {
      for (const difficulty of ['easy', 'normal', 'hard'] as const) {
        const t = makeCompleteTask(p.rank, p, difficulty);
        expect([...t.lengths].sort((a, b) => b - a)).toEqual([...p.lengths]);
        t.known.forEach((l, i) => l === null || expect(l).toBe(t.lengths[i]));
        const possible = completions(t.known).list.map((c) => c.pattern.id);
        expect(possible).toContain(p.id);
        expect(t.count).toBe(Math.min(3, possible.length));
        expect(t.all).toBe(possible.length <= 3);
      }
    }
  });

  it('viser de to længste farver, når opgaverne skal være lette', () => {
    for (const seed of seeds) {
      const t = makeCompleteTask(seed, patternById('5-4-3-1'), 'easy');
      expect(t.known.filter((l) => l !== null).sort()).toEqual([4, 5]);
    }
  });

  it('viser én farve og beder om de tre hyppigste, når opgaverne skal være svære', () => {
    for (const seed of seeds) {
      const t = makeCompleteTask(seed, patternById('5-4-3-1'), 'hard');
      expect(t.known.filter((l) => l !== null)).toHaveLength(1);
      expect(t).toMatchObject({ count: 3, all: false });
    }
  });

  it('viser to farver ved normal sværhed og vælger både Øst og Vest', () => {
    const tasks = seeds.map((seed) => makeCompleteTask(seed, patternById('4-4-3-2'), 'normal'));
    for (const t of tasks) expect(t.known.filter((l) => l !== null)).toHaveLength(2);
    expect(new Set(tasks.map((t) => t.seat))).toEqual(new Set(['E', 'W']));
  });

  it('formulerer opgaven på dansk', () => {
    expect(shownText(task)).toBe('5♠ og 4♥');
    expect(instructionText(task)).toBe('Tast de mulige mønstre – hyppigste først.');
    expect(instructionText({ ...task, all: false })).toBe('Tast de tre hyppigste mønstre – hyppigste først.');
    expect(instructionText({ ...task, count: 1 })).toBe('Tast mønstret.');
  });
});
