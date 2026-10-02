import { describe, expect, it } from 'vitest';
import { formatInt } from '../engine/format';
import { TOTAL_HANDS } from './combinatorics';
import {
  GRADES,
  GRADE_LABEL,
  PATTERNS,
  distributionText,
  patternById,
  patternOf,
  percent,
  type Family,
} from './patterns';

// Facittabellen fra SPEC.md (Mønstermodel):
// rang, mønster, placeringer, sandsynlighed i %, pr. 100 hænder, grad.
const FACIT: [number, string, number, number, number, string][] = [
  [1, '4-4-3-2', 12, 21.55, 22, 'almindelig'],
  [2, '5-3-3-2', 12, 15.52, 16, 'almindelig'],
  [3, '5-4-3-1', 24, 12.93, 13, 'almindelig'],
  [4, '5-4-2-2', 12, 10.58, 11, 'almindelig'],
  [5, '4-3-3-3', 4, 10.54, 11, 'almindelig'],
  [6, '6-3-2-2', 12, 5.64, 6, 'ualmindelig'],
  [7, '6-4-2-1', 24, 4.7, 5, 'ualmindelig'],
  [8, '6-3-3-1', 12, 3.45, 3, 'ualmindelig'],
  [9, '5-5-2-1', 12, 3.17, 3, 'ualmindelig'],
  [10, '4-4-4-1', 4, 2.99, 3, 'ualmindelig'],
  [11, '7-3-2-1', 24, 1.88, 2, 'sjælden'],
  [12, '6-4-3-0', 24, 1.33, 1, 'sjælden'],
  [13, '5-4-4-0', 12, 1.24, 1, 'sjælden'],
];

const sumHands = (patterns: readonly { hands: bigint }[]) =>
  patterns.reduce((sum, p) => sum + p.hands, 0n);

describe('Mønstermodel – accepttest', () => {
  it('har præcis 39 mønstre, og sandsynlighederne summer præcis til 1', () => {
    expect(PATTERNS).toHaveLength(39);
    expect(TOTAL_HANDS).toBe(635_013_559_600n);
    expect(sumHands(PATTERNS)).toBe(TOTAL_HANDS);
  });

  it('P(4-4-3-2) = 21,5512 % og P(4-3-3-3) = 10,5361 %', () => {
    expect(percent(patternById('4-4-3-2').hands, 4)).toBe(21.5512);
    expect(percent(patternById('4-3-3-3').hands, 4)).toBe(10.5361);
  });

  it('top 5 = 71,11 % og top 10 = 91,07 %', () => {
    expect(percent(sumHands(PATTERNS.slice(0, 5)), 2)).toBe(71.11);
    expect(percent(sumHands(PATTERNS.slice(0, 10)), 2)).toBe(91.07);
  });

  it('7-5-1-0 og 8-3-2-0 har samme antal hænder (689.049.504)', () => {
    expect(patternById('7-5-1-0').hands).toBe(689_049_504n);
    expect(patternById('8-3-2-0').hands).toBe(689_049_504n);
  });

  it('"1 ud af N": 7-6-0-0 = 17.971 og 13-0-0-0 = 158.753.389.900', () => {
    expect(patternById('7-6-0-0').oneIn).toBe(17_971);
    expect(patternById('13-0-0-0').oneIn).toBe(158_753_389_900);
    expect(formatInt(patternById('7-6-0-0').oneIn)).toBe('17.971');
    expect(formatInt(patternById('13-0-0-0').oneIn)).toBe('158.753.389.900');
  });

  it('graderne giver 5, 5, 3, 11 og 15 mønstre', () => {
    const counts = GRADES.map((g) => PATTERNS.filter((p) => p.grade === g).length);
    expect(counts).toEqual([5, 5, 3, 11, 15]);
  });

  it('"Pr. 100 hænder" summer til 100 og matcher tabellen i Mønstermodel', () => {
    expect(PATTERNS.reduce((sum, p) => sum + p.per100, 0)).toBe(100);
    for (const [, id, , , per100] of FACIT) {
      expect(patternById(id).per100, id).toBe(per100);
    }
  });
});

describe('Mønstermodel', () => {
  it('matcher facittabellen for de 13 hyppigste mønstre', () => {
    expect(PATTERNS.slice(0, 13).map((p) => p.id)).toEqual(FACIT.map((row) => row[1]));
    for (const [rank, id, placements, pct, per100, grade] of FACIT) {
      const p = patternById(id);
      expect(p.rank, id).toBe(rank);
      expect(p.placements, id).toBe(placements);
      expect(percent(p.hands, 2), id).toBe(pct);
      expect(p.per100, id).toBe(per100);
      expect(GRADE_LABEL[p.grade], id).toBe(grade);
    }
  });

  it('har altid 4, 12 eller 24 placeringer', () => {
    for (const p of PATTERNS) expect([4, 12, 24], p.id).toContain(p.placements);
  });

  it('rangerer efter faldende sandsynlighed, og lige sandsynlige mønstre deler rang', () => {
    // Rang = 1 + antallet af strengt hyppigere mønstre, så delt 23.-plads efterfølges af 25.
    PATTERNS.forEach((p, i) => {
      if (i > 0) expect(p.hands <= PATTERNS[i - 1].hands, p.id).toBe(true);
      expect(p.rank, p.id).toBe(PATTERNS.filter((q) => q.hands > p.hands).length + 1);
    });
    expect(patternById('7-5-1-0').rank).toBe(23);
    expect(patternById('8-3-2-0').rank).toBe(23);
    expect(patternById('6-6-1-0').rank).toBe(25);
    expect(PATTERNS[38].id).toBe('13-0-0-0');
    expect(PATTERNS[38].rank).toBe(39);
  });

  it('har familieandelene 35,08 / 44,34 / 16,55 / 4,03 %', () => {
    const share = (family: Family) =>
      percent(sumHands(PATTERNS.filter((p) => p.family === family)), 2);
    expect([4, 5, 6, 7].map((f) => share(f as Family))).toEqual([35.08, 44.34, 16.55, 4.03]);
  });

  it('har sandsynligheden p = hænder / C(52, 13) som kommatal', () => {
    for (const p of PATTERNS) expect(p.p).toBe(Number(p.hands) / Number(TOTAL_HANDS));
  });

  it('finder mønstret for en konkret fordeling i vilkårlig farveorden', () => {
    expect(patternOf([2, 5, 2, 4]).id).toBe('5-4-2-2');
    expect(patternOf([0, 13, 0, 0]).id).toBe('13-0-0-0');
    expect(patternOf([3, 3, 4, 3])).toBe(patternById('4-3-3-3'));
    expect(() => patternOf([4, 4, 4, 4])).toThrow();
    expect(() => patternById('4-4-4-2')).toThrow();
  });

  it('skriver en konkret fordeling som ♠=♥=♦=♣ med lighedstegn', () => {
    expect(distributionText([2, 5, 2, 4])).toBe('2=5=2=4');
    expect(distributionText([10, 1, 1, 1])).toBe('10=1=1=1');
  });
});
