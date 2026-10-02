import { describe, expect, it } from 'vitest';
import { patternById } from '../../domain/patterns';
import { CLUB_PATTERNS, checkEstimate, estimateTolerance, makeEstimateTask } from './task';

describe('Klubaften-estimat', () => {
  it('spørger til de 16 mønstre, der er med blandt aftenens 100 hænder', () => {
    expect(CLUB_PATTERNS).toHaveLength(16);
    expect(CLUB_PATTERNS.reduce((sum, p) => sum + p.per100, 0)).toBe(100);
  });

  it('godkender ±1 for antal op til 10 og ±2 derover', () => {
    expect(estimateTolerance(6)).toBe(1);
    expect(estimateTolerance(10)).toBe(1);
    expect(estimateTolerance(11)).toBe(2);
    const fabrik = makeEstimateTask(1, patternById('6-3-2-2'));
    expect([4, 5, 6, 7, 8].map((n) => checkEstimate(fabrik, n))).toEqual([false, true, true, true, false]);
    const trappe = makeEstimateTask(1, patternById('4-4-3-2'));
    expect([19, 20, 22, 24, 25].map((n) => checkEstimate(trappe, n))).toEqual([false, true, true, true, false]);
  });
});
