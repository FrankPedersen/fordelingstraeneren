import { describe, expect, it } from 'vitest';
import { bandFields, compactLayout, customItem, linesForGoal, type BandField, type BankItem } from './analysis';
import { parseCards } from './model/cards';
import { layoutChance, type Vacant } from './model/layouts';
import type { Situation } from './model/situation';
import { handleSolve } from './solver/results';
import { TEST_BANK } from './testBank';

// SPEC-notation-sidninger.md, accepttest. Facit er a priori-chancer, regnet med layoutChance.
// E D B 10 / 6 5 4 3 2, mål 5 (Bordet / hånden = Nord / Syd som i solver/situation.test.ts): Vest og Øst har K 9 8 7.
// Kombinationen er ikke i banken, så den regnes med løseren som i kortvælgeren (Analyse fase 2).
const NORTH = parseCards('AQJT'), SOUTH = parseCards('65432');

function edb(situation?: Situation): BankItem {
  const response = handleSolve({ kind: 'goal', north: NORTH, south: SOUTH, goal: 5, situation });
  if (response.kind !== 'goal') throw new Error('forkert svar');
  return customItem(response.base, [5], { '5': response.result });
}

const percent2 = (x: number) => Math.round(x * 10_000) / 100;
const chance = (n: number, k: number, vacant?: Vacant) => {
  const f = layoutChance(n, k, vacant);
  return Number(f.num) / Number(f.den);
};
const row = (fields: readonly BandField[], west: string, east: string) => {
  const found = fields.find((f) => f.west === west && f.east === east);
  if (!found) throw new Error(`ingen række ${west} – ${east}`);
  return found;
};

describe('Notationen for sidninger (SPEC-notation-sidninger.md)', { timeout: 60_000 }, () => {
  const item = edb();
  const fields = bandFields(item, linesForGoal(item, 5));

  it('E D B 10 / 6 5 4 3 2, mål 5: Kx–xx har count 3, chancen 20,35 % og each 6,78 %', () => {
    const f = row(fields, 'K x', 'x x');
    expect(f.count).toBe(3);
    expect(percent2(f.probability)).toBe(20.35);
    expect(percent2(f.each)).toBe(6.78);
    expect(f.each).toBeCloseTo(chance(4, 2), 12);
  });

  it('x–Kxx har count 3, 18,65 % og 6,22 % pr. sidning; K–xxx har count 1 og 6,22 %', () => {
    const a = row(fields, 'x', 'K x x');
    expect(a.count).toBe(3);
    expect(percent2(a.probability)).toBe(18.65);
    expect(percent2(a.each)).toBe(6.22);
    const b = row(fields, 'K', 'x x x');
    expect(b.count).toBe(1);
    expect(percent2(b.probability)).toBe(6.22);
    expect(b.each).toBe(b.probability);
  });

  it('Kxxx–renonce har count 1 og 4,78 %: de tre små kort sidder alle hos Vest, så der er kun én måde', () => {
    const f = row(fields, 'K x x x', '–');
    expect(f.count).toBe(1);
    expect(percent2(f.probability)).toBe(4.78);
    expect(f.each).toBeCloseTo(chance(4, 4), 12);
  });

  it('compactLayout giver Kx–xx(3), K–xxx og Kxxx–renonce', () => {
    expect(compactLayout(row(fields, 'K x', 'x x'))).toBe('Kx–xx(3)');
    expect(compactLayout(row(fields, 'K', 'x x x'))).toBe('K–xxx');
    expect(compactLayout(row(fields, 'K x x x', '–'))).toBe('Kxxx–renonce');
  });

  it('felternes rækkefølge, id\'er og chancer er de samme som før: count × each er rækkens chance', () => {
    for (const f of fields) expect(f.count * f.each).toBeCloseTo(f.probability, 12);
    expect(fields.map((f) => f.west + '|' + f.east)).toEqual([
      'K x x x|–',
      'K x x|x',
      'x x x|K',
      'K x|x x',
      'x x|K x',
      'K|x x x',
      'x|K x x',
      '–|K x x x',
    ]);
  });

  it('for hver kombination i banken og hvert mål: summen af count er 2^n, og summen af count × each er 100 %', () => {
    let checked = 0;
    for (const b of TEST_BANK) {
      const n = 13 - b.north.length - b.south.length;
      for (const goal of b.combination.goals) {
        const fs = bandFields(b, linesForGoal(b, goal));
        expect(fs.reduce((s, f) => s + f.count, 0), b.combination.id).toBe(2 ** n);
        const total = fs.reduce((s, f) => s + f.probability, 0);
        expect(fs.reduce((s, f) => s + f.count * f.each, 0), b.combination.id).toBeCloseTo(total, 9);
        expect(total, b.combination.id).toBeCloseTo(1, 6);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(1000);
  });

  it('med situationen Vest 5 og Øst 2 kendte kort: Kx–xx har count 3 og chancen 3 × each, hvor each er layoutChance med de ledige pladser', () => {
    const situated = edb({ known: { west: 5, east: 2 }, maxHp: { west: 10, east: 10 } });
    const f = row(bandFields(situated, linesForGoal(situated, 5)), 'K x', 'x x');
    expect(f.count).toBe(3);
    expect(f.each).toBeCloseTo(chance(4, 2, { west: 8, east: 11 }), 12);
    expect(f.probability).toBeCloseTo(3 * f.each, 12);
  });
});
