import { describe, expect, it } from 'vitest';
import { clueHolds, makeSudoku, solutions, sudokuPoints, type Clue } from './task';

const seeds = Array.from({ length: 60 }, (_, i) => i + 1);

describe('13-sudoku – accepttest', () => {
  it('hver genereret opgave har præcis én løsning, når alle ledetråde er givet', () => {
    for (const hard of [false, true]) {
      for (const seed of seeds) {
        const task = makeSudoku(seed, hard);
        const found = solutions(task, task.clues);
        expect(found, `seed ${seed}`).toHaveLength(1);
        expect(found[0]).toEqual({ east: task.lengths.E, west: task.lengths.W });
      }
    }
    // 120 opgaver med løser; under fuld belastning kan det tage over 5 s.
  }, 20_000);
});

describe('13-sudoku – generator', () => {
  it('genskabes ud fra sit seed', () => {
    expect(makeSudoku(5)).toEqual(makeSudoku(5));
  });

  it('har ledetråde, der passer med de faktiske længder, og meldinger først', () => {
    for (const seed of seeds) {
      const task = makeSudoku(seed);
      for (const clue of task.clues) expect(clueHolds(clue, task.lengths[clue.seat]), clue.text).toBe(true);
      const firstEvent = task.clues.findIndex((c) => c.kind !== 'call');
      if (firstEvent >= 0) expect(task.clues.slice(firstEvent).every((c) => c.kind !== 'call')).toBe(true);
      expect(task.clues.filter((c) => c.kind === 'fourth-best').length).toBeLessThanOrEqual(1);
    }
  });

  it('bruger meldinger fra systemfilen for Øst og Vest', () => {
    const calls = seeds.flatMap((seed) => makeSudoku(seed).clues.filter((c) => c.kind === 'call'));
    expect(calls.length).toBeGreaterThan(10);
    expect(calls.some((c) => /^(Øst|Vest) åbner/.test(c.text))).toBe(true);
    expect(calls.some((c) => / efter (Nords|Syds) /.test(c.text))).toBe(true);
  });

  it('formulerer spilhændelserne som i SPEC.md', () => {
    const texts = seeds.flatMap((seed) => makeSudoku(seed).clues.map((c) => c.text));
    expect(texts.some((t) => /^(Øst|Vest) kan ikke bekende i \d\. (spar|hjerter|ruder|klør)runde\.$/.test(t))).toBe(true);
    expect(texts.some((t) => /^(Øst|Vest) følger (to|tre|fire|fem|seks|syv) gange i (spar|hjerter|ruder|klør)\.$/.test(t))).toBe(true);
  });

  it('forstår spilhændelserne', () => {
    const at = (kind: Clue['kind'], n: number): Clue => ({ kind, seat: 'E', suit: 2, n, text: '' }) as Clue;
    expect(clueHolds(at('cannot-follow', 2), [4, 4, 1, 4])).toBe(true);
    expect(clueHolds(at('cannot-follow', 2), [4, 3, 2, 4])).toBe(false);
    expect(clueHolds(at('follows', 3), [3, 3, 3, 4])).toBe(true);
    expect(clueHolds(at('follows', 3), [5, 4, 2, 2])).toBe(false);
  });
});

describe('13-sudoku – point', () => {
  it('giver grundpoint × (ledetråde tilbage + 1) og trækker grundpointene for en forkert lås', () => {
    expect(sudokuPoints(3, 0, false)).toBe(40);
    expect(sudokuPoints(0, 0, false)).toBe(10);
    expect(sudokuPoints(2, 1, false)).toBe(20);
  });

  it('giver dobbelt XP til ugens boss', () => {
    expect(sudokuPoints(3, 0, true)).toBe(80);
    expect(sudokuPoints(2, 1, true)).toBe(40);
  });
});
