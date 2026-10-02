import { describe, expect, it } from 'vitest';
import type { SuitLengths } from './cards';
import { SPLITS, solveSudoku } from './sudoku';

const north: SuitLengths = [3, 4, 2, 4];
const south: SuitLengths = [4, 3, 3, 3];
// Øst og Vest har tilsammen 6 spar, 6 hjerter, 8 ruder og 6 klør.

describe('13-sudoku – løser', () => {
  it('har 560 mulige fordelinger af 13 kort i fire farver', () => {
    expect(SPLITS).toHaveLength(560);
    expect(SPLITS.every((s) => s.reduce((a, b) => a + b, 0) === 13)).toBe(true);
  });

  it('lader Vest følge af søjlesummerne', () => {
    const all = solveSudoku(north, south, []);
    expect(all.length).toBeGreaterThan(1);
    for (const { east, west } of all) {
      expect(east.map((l, s) => l + west[s] + north[s] + south[s])).toEqual([13, 13, 13, 13]);
    }
  });

  it('filtrerer med ledetrådene for både Øst og Vest', () => {
    const solutions = solveSudoku(north, south, [
      { seat: 'E', holds: (l) => l[0] === 1 },
      { seat: 'E', holds: (l) => l[1] === 5 },
      { seat: 'W', holds: (l) => l[2] === 4 },
    ]);
    expect(solutions).toEqual([{ east: [1, 5, 4, 3], west: [5, 1, 4, 3] }]);
  });
});
