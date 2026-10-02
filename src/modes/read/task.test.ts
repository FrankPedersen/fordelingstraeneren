import { describe, expect, it } from 'vitest';
import { suitLengths } from '../../domain/cards';
import { deal } from '../../domain/dealer';
import { PATTERNS, patternById, patternOf } from '../../domain/patterns';
import { READ_MS, checkRead, makeRandomReadTask, makeTargetedReadTask, nextReadMs, rankLabel } from './task';

const seeds = Array.from({ length: 200 }, (_, i) => i + 1);

describe('Lynaflæsning – visningstid', () => {
  it('starter på 3.000 ms, falder 10 % efter rigtigt og stiger 15 % efter fejl', () => {
    expect(READ_MS).toEqual({ start: 3000, min: 800, max: 5000 });
    expect(nextReadMs(3000, true)).toBe(2700);
    expect(nextReadMs(3000, false)).toBe(3450);
  });

  it('holder sig inden for 800–5.000 ms', () => {
    expect(nextReadMs(850, true)).toBe(800);
    expect(nextReadMs(4800, false)).toBe(5000);
  });
});

describe('Lynaflæsning – hænder', () => {
  it('viser en tilfældig hånd fra kortgiveren, usorteret', () => {
    const task = makeRandomReadTask(42, 3000);
    expect(task).toMatchObject({ kind: 'read', random: true, showMs: 3000 });
    expect(task.cards).toEqual(deal(42).S);
    expect(task.patternId).toBe(patternOf(suitLengths(task.cards)).id);
  });

  it('kan lave en hånd med et bestemt mønster til repetitionen', () => {
    for (const p of PATTERNS.slice(0, 13)) {
      const task = makeTargetedReadTask(p.rank, p, 2000);
      expect(task.random).toBe(false);
      expect(new Set(task.cards).size).toBe(13);
      expect(patternOf(suitLengths(task.cards)).id).toBe(p.id);
    }
  });

  it('lægger mønstrets længder i alle farver', () => {
    const p = patternById('5-4-3-1');
    const spades = new Set(seeds.map((s) => suitLengths(makeTargetedReadTask(s, p, 2000).cards)[0]));
    expect(spades).toEqual(new Set([5, 4, 3, 1]));
  });

  it('godkender det rigtige mønster i vilkårlig rækkefølge', () => {
    const task = makeTargetedReadTask(1, patternById('6-4-2-1'), 2000);
    expect(checkRead(task, [6, 4, 2, 1])).toBe(true);
    expect(checkRead(task, [6, 3, 3, 1])).toBe(false);
  });

  it('skriver valørerne på dansk', () => {
    expect([0, 8, 9, 10, 11, 12].map(rankLabel)).toEqual(['2', '10', 'B', 'D', 'K', 'E']);
  });
});
