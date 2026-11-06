import { afterEach, describe, expect, it } from 'vitest';
import { completions } from '../../domain/complete';
import { PATTERNS, patternById } from '../../domain/patterns';
import { setLang } from '../../i18n';
import {
  instructionText,
  makeCompleteTask,
  missingCount,
  missingVerdict,
  orderText,
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
    expect(instructionText(task)).toBe('Hvilke mønstre er mulige? Hyppigste først.');
    expect(instructionText({ ...task, all: false })).toBe('Hvilke tre mønstre er hyppigst? Hyppigste først.');
    expect(instructionText({ ...task, count: 1 })).toBe('Hvilket mønster er det?');
  });
});

// Accepttest for SPEC-fuldfoer-dom.md: dommen ved for få mønstre og sætningen om rækkefølgen i facit.
describe('Fuldfør – dommen og facit (SPEC-fuldfoer-dom.md)', () => {
  afterEach(() => setLang('da'));

  /** "Øst har vist 4♦ og 4♣": mulige er 4-4-3-2, 4-4-4-1 og 5-4-4-0. */
  const øst44: CompleteTask = { kind: 'complete', seed: 1, patternId: '4-4-3-2', seat: 'E', lengths: [3, 2, 4, 4], known: [null, null, 4, 4], count: 3, all: true };
  /** "Vest har vist 5♥ og 4♣" med Vests 5-4-2-2: 5-4-3-1 er hyppigst (7436 mod 6084 og 1430). */
  const vest5h4c: CompleteTask = { kind: 'complete', seed: 1, patternId: '5-4-2-2', seat: 'W', lengths: [2, 5, 2, 4], known: [null, 5, null, 4], count: 3, all: true };
  /** "Vest har vist 5♠": 10 mulige, de tre hyppigste skal tastes; 5-5-2-1 er nr. 4. */
  const vest5: CompleteTask = { kind: 'complete', seed: 1, patternId: '5-5-2-1', seat: 'W', lengths: [5, 5, 2, 1], known: [5, null, null, null], count: 3, all: false };

  it('all: true: antallet af mulige mønstre, der ikke er tastet; umulige tæller ikke med', () => {
    expect(missingCount(øst44, ['4-4-3-2'])).toBe(2);
    expect(missingCount(øst44, ['4-4-3-2', '4-4-4-1'])).toBe(1);
    expect(missingCount(øst44, ['4-4-3-2', '4-4-4-1', '5-4-4-0'])).toBe(0);
    expect(missingCount(øst44, ['4-4-3-2', '6-4-3-0'])).toBe(2);
  });

  it('all: false: count minus de tastede, og 0 for tre tastede, også når de er forkerte', () => {
    expect(missingCount(vest5, ['5-3-3-2'])).toBe(2);
    expect(missingCount(vest5, ['5-3-3-2', '5-4-3-1'])).toBe(1);
    expect(missingCount(vest5, ['5-3-3-2', '5-4-3-1', '5-4-2-2'])).toBe(0);
    expect(missingCount(vest5, ['8-5-0-0', '7-5-1-0', '6-5-2-0'])).toBe(0);
    expect(missingVerdict(missingCount(vest5, ['5-3-3-2']))).toBe('✗ Forkert: der mangler 2 mønstre.');
    setLang('en');
    expect(missingVerdict(2)).toBe('✗ Wrong: 2 patterns are missing.');
  });

  it('dommen står i flertal og i ental ved 1, på dansk og engelsk', () => {
    expect(missingVerdict(2)).toBe('✗ Forkert: der mangler 2 mønstre.');
    expect(missingVerdict(1)).toBe('✗ Forkert: der mangler 1 mønster.');
    setLang('en');
    expect(missingVerdict(2)).toBe('✗ Wrong: 2 patterns are missing.');
    expect(missingVerdict(1)).toBe('✗ Wrong: 1 pattern is missing.');
  });

  it('facit (all: true): den faktiske hånd tastet først, men ikke hyppigst, giver sætningen om rækkefølgen', () => {
    expect(orderText(vest5h4c, ['5-4-2-2', '5-4-3-1', '5-4-4-0'])).toBe('Rækkefølgen er efter hyppighed. Vests hånd var den næsthyppigste.');
    expect(orderText({ ...vest5h4c, seat: 'E' }, ['5-4-2-2'])).toBe('Rækkefølgen er efter hyppighed. Østs hånd var den næsthyppigste.');
    setLang('en');
    expect(orderText({ ...vest5h4c, seat: 'E' }, ['5-4-2-2'])).toBe("The order is by frequency. East's hand was the second most frequent.");
    setLang('da');
    // Den faktiske hånd er hyppigst, eller det første tastede mønster er et andet: ingen sætning.
    expect(orderText({ ...vest5h4c, patternId: '5-4-3-1', lengths: [3, 5, 1, 4] }, ['5-4-3-1'])).toBeNull();
    expect(orderText(vest5h4c, ['5-4-3-1', '5-4-2-2'])).toBeNull();
  });

  it('facit (all: false): fra rang 4 står rangen som tal', () => {
    expect(orderText(vest5, ['5-5-2-1'])).toBe('Rækkefølgen er efter hyppighed. Vests hånd var nr. 4 i hyppighed.');
    expect(orderText({ ...vest5, patternId: '5-5-3-0', lengths: [5, 5, 3, 0] }, ['5-5-3-0'])).toBe('Rækkefølgen er efter hyppighed. Vests hånd var nr. 5 i hyppighed.');
    expect(orderText({ ...vest5, patternId: '5-4-2-2', lengths: [5, 4, 2, 2] }, ['5-4-2-2'])).toBe('Rækkefølgen er efter hyppighed. Vests hånd var den tredjehyppigste.');
    setLang('en');
    expect(orderText(vest5, ['5-5-2-1'])).toBe("The order is by frequency. West's hand was no. 4 by frequency.");
  });
});
