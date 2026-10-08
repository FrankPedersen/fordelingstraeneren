import { describe, expect, it } from 'vitest';
import { averageTricks } from '../analysis';
import { parseCards } from '../model/cards';
import { solveCombination } from '../precompute';
import { leadTricks } from './results';

// Specens eksempel: bordet B 4 3 2, hånden E 10 6 5. Ikke i banken.
const north = parseCards('J432'), south = parseCards('AT65');

describe('Stik pr. sidning (SPEC-analysevindue-layout.md, punkt 2)', { timeout: 180_000 }, () => {
  it('gennemsnittet for B432 / ET65: linje A (lille mod 10\'eren) 2,32 stik og "Slå esset" 2,07 stik', () => {
    const solution = solveCombination(north, south, [3]);
    const g = solution.goals['3'];
    const lineA = g.leads[g.best];
    expect(lineA.steps[0]).toMatch(/^Lille fra bordet mod 10'eren/);
    const ace = g.leads.find((l) => l.hand === 'S' && l.high === 14)!;
    expect(ace.steps.join(' ')).toBe('Slå esset.');
    const a = leadTricks(north, south, lineA);
    const b = leadTricks(north, south, ace);
    expect(averageTricks(solution, a)).toBeCloseTo(2.3165, 3);
    expect(averageTricks(solution, b)).toBeCloseTo(2.0678, 3);
    // "Slå esset" giver 2 stik undtagen i KD–xxx og xxx–KD, hvor den giver 3.
    expect(b.filter((t) => t === 3)).toHaveLength(2);
    expect(b.every((t) => t === 2 || t === 3)).toBe(true);
  });
});
