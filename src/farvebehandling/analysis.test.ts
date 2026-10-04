import { describe, expect, it } from 'vitest';
import bankText from './content/suit-combinations.json?raw';
import { bandFields, disagreements, findCombination, linesForGoal, NEAR_BEST, situationHonors, sortFields, structureKey } from './analysis';
import { ACE, JACK, KING, parseCards, QUEEN } from './model/cards';
import { oncePerDeals } from './model/frequency';
import { bankItem as byId, TEST_BANK as bank } from './testBank';

describe('Banken i analysevinduet', () => {
  it('har alle kombinationer fra siderne 0–9 i hyppighedsorden', () => {
    const combinations = (JSON.parse(bankText) as { combinations: { id: string }[] }).combinations;
    expect(bank.map((b) => b.combination.id)).toEqual(combinations.map((c) => c.id));
    expect(bank.map((b) => b.rank)).toEqual(bank.map((_, i) => i + 1));
    expect(new Set(bank.map((b) => b.page))).toEqual(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
    // E K x x / B x x fra "damen mangler" er ca. én gang pr. 134 spil.
    expect(oncePerDeals(byId('J32-AK54').frequency)).toBe(134);
    // Rangen følger hyppigheden: ingen kombination er hyppigere end den foregående.
    for (let i = 1; i < bank.length; i++) {
      const [a, b] = [bank[i - 1].frequency, bank[i].frequency];
      expect(b.num * a.den <= a.num * b.den, bank[i].combination.id).toBe(true);
    }
  });

  it('beskriver situationen bag kombinationen', () => {
    // E K x x / B x x: es og konge uden damen.
    expect(byId('J32-AK54').honors).toEqual({ ours: [ACE, KING], theirs: [QUEEN] });
    expect(situationHonors(parseCards('432'), parseCards('AQ65'))).toEqual({ ours: [ACE], theirs: [KING] });
    expect(situationHonors(parseCards('432'), parseCards('KQ65'))).toEqual({ ours: [], theirs: [ACE] });
    expect(situationHonors(parseCards('J32'), parseCards('AKQ5'))).toEqual({ ours: [ACE, KING, QUEEN, JACK], theirs: [] });
  });

  it('finder en kombination ud fra kortvælgerens kort', () => {
    expect(findCombination(bank, parseCards('J32'), parseCards('AK54'))).toBe(byId('J32-AK54'));
    // Tre kort over for renonce findes ikke på bridgehands' sider.
    expect(findCombination(bank, parseCards('AK2'), [])).toBeNull();
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
