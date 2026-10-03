import { describe, expect, it } from 'vitest';
import bankText from './content/suit-combinations.json?raw';
import solutionsText from './content/solutions.json?raw';
import { bandFields, disagreements, findCombination, linesForGoal, loadBank, NEAR_BEST, sortFields, structureKey } from './analysis';
import { parseCards } from './model/cards';
import { oncePerDeals } from './model/frequency';

const bank = loadBank(bankText, solutionsText);
const byId = (id: string) => bank.find((b) => b.combination.id === id)!;

describe('Banken i analysevinduet', () => {
  it('har de 85 kombinationer i hyppighedsorden', () => {
    expect(bank).toHaveLength(85);
    expect(bank[0].combination.id).toBe('J32-AK54');
    expect(oncePerDeals(bank[0].frequency)).toBe(134);
    expect(bank.map((b) => b.rank)).toEqual(bank.map((_, i) => i + 1));
  });

  it('finder en kombination ud fra kortvælgerens kort', () => {
    expect(findCombination(bank, parseCards('J32'), parseCards('AK54'))).toBe(byId('J32-AK54'));
    // B432 / E 10 6 5 er ikke på siden "damen mangler".
    expect(findCombination(bank, parseCards('J432'), parseCards('AT65'))).toBeNull();
  });

  it('skelner strukturer, der er forskellige spil', () => {
    expect(structureKey(parseCards('J32'), parseCards('AK54'))).not.toBe(structureKey(parseCards('J43'), parseCards('AK65')));
    expect(structureKey(parseCards('J32'), parseCards('AK54'))).toBe('SS1N5SSNN');
  });
});

describe('Linjer og sandsynlighedsbånd', () => {
  const item = byId('J32-AK54');
  const lines = linesForGoal(item, 3);

  it('viser den bedste linje først og højst tre alternativer', () => {
    expect(lines[0].best).toBe(true);
    const others = lines.filter((l) => !l.best && !l.nearBest);
    expect(others.length).toBeLessThanOrEqual(3);
    for (const l of others) expect(lines[0].value - l.value).toBeGreaterThan(NEAR_BEST);
    expect(lines.map((l) => l.letter)).toEqual(['A', 'B', 'C', 'D'].slice(0, lines.length));
  });

  it('summerer felterne til 100 % for hver linje', () => {
    for (const b of bank) {
      for (const goal of b.combination.goals) {
        const fields = bandFields(b, linesForGoal(b, goal));
        const total = fields.reduce((s, f) => s + f.probability, 0);
        expect(total, `${b.combination.id} ${goal}`).toBeCloseTo(1, 9);
      }
    }
  });

  it('viser honnørerne og samler de små kort som x', () => {
    const fields = bandFields(item, lines);
    // Modparten har D 10 9 8 7 6: damen står for sig; 10'eren er ligeværdig med 9 8 7 6 og vises som x.
    expect(fields.some((f) => f.west === 'D x x')).toBe(true);
    expect(fields.some((f) => f.east === 'D x x x x x')).toBe(true);
    expect(fields.every((f) => !/[2-9]/.test(f.west + f.east))).toBe(true);
    // Chancen for linjen er summen af felterne, hvor målet nås.
    for (const [k, l] of lines.entries()) {
      const hit = fields.filter((f) => f.outcomes[k] > 0).reduce((s, f) => s + f.probability, 0);
      expect(hit, l.letter).toBeCloseTo(l.value, 4);
    }
  });

  it('finder sidningerne, hvor linjerne er uenige, og grupperer efter honnører', () => {
    const fields = bandFields(item, lines);
    for (const f of disagreements(fields)) expect(new Set(f.outcomes).size).toBeGreaterThan(1);
    const byHonors = sortFields(fields, 'honnører');
    expect(byHonors).toHaveLength(fields.length);
    expect(new Set(byHonors.map((f) => f.id))).toEqual(new Set(fields.map((f) => f.id)));
  });
});
