import { describe, expect, it } from 'vitest';
import { parseCards } from '../model/cards';
import { describeLine } from './describe';
import { buildGame } from './game';
import { validateLine } from './lines';
import { solveGame, solveLine } from './solve';

const goal = (n: number) => ({ kind: 'goal', goal: n }) as const;

describe('Linjerne på dansk', { timeout: 120_000 }, () => {
  it('B432 / E 10 6 5, 3 stik: lille mod 10\'eren, derefter esset', () => {
    const game = buildGame(parseCards('J432'), parseCards('AT65'), { objective: goal(3) });
    const solution = solveGame(game);
    const best = solution.leads[solution.best];
    const text = describeLine(game, best.strategy, best.slot);
    expect(text.steps).toEqual(["Lille fra bordet mod 10'eren (kip); lægger Øst en honnør, tages den med esset.", 'Slå esset.']);
    // Linjen i linjeformatet er gyldig og giver samme chance, når løseren spiller videre efter sidste trin.
    expect(validateLine(game, { ...text.line, id: 'A' })).toEqual([]);
    expect(solveLine(game, { ...text.line, id: 'A' }).value).toBeCloseTo(best.value, 6);
    // Esset først giver 6,8 %.
    const ace = solution.leads.find((l) => l.lead.hand === 'S' && l.lead.high === 14)!;
    expect(describeLine(game, ace.strategy, ace.slot).steps).toEqual(['Slå esset.']);
  });

  it('E K B 3 2 / 7 6 5 4, 5 stik: slå esset og kongen', () => {
    const game = buildGame(parseCards('AKJ32'), parseCards('7654'), { objective: goal(5) });
    const solution = solveGame(game);
    const best = solution.leads[solution.best];
    expect(describeLine(game, best.strategy, best.slot).steps).toEqual(['Slå esset og kongen.']);
  });

  it('nævner en gren, når 3. hånd skal reagere på en honnør', () => {
    const game = buildGame(parseCards('K2'), parseCards('AJ543'), { objective: goal(4) });
    const solution = solveGame(game);
    const texts = solution.leads.map((l) => describeLine(game, l.strategy, l.slot).steps.join(' '));
    expect(texts.some((t) => /lægger Øst en honnør, tages den med esset/.test(t))).toBe(true);
  });
});
