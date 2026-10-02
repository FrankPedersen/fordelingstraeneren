import { describe, expect, it } from 'vitest';
import { isMastered, newItem, recentAnswers, review, type Item, type LogEntry } from './leitner';

const today = '2026-10-02';
const entry = (ok: boolean, t = 1, ms = 1000): LogEntry => ({ t, ok, ms });
const item = (over: Partial<Item> = {}): Item => ({ ...newItem(today), ...over });

describe('Leitner – accepttest', () => {
  it('et forkert svar giver kasse 1 og forfald i morgen', () => {
    for (const box of [1, 2, 3, 4, 5] as const) {
      const after = review(item({ box, support: 0 }), 'wrong', today, entry(false));
      expect(after.box).toBe(1);
      expect(after.due).toBe('2026-10-03');
    }
  });
});

describe('Leitner', () => {
  it('starter et nyt emne i kasse 1, forfaldent i dag og med fuld støtte', () => {
    expect(newItem(today)).toEqual({ box: 1, due: today, support: 3, log: [] });
  });

  it('rykker et forfaldent emne én kasse op ved rigtigt og hurtigt svar', () => {
    const expected = [
      [1, 2, '2026-10-04'],
      [2, 3, '2026-10-06'],
      [3, 4, '2026-10-10'],
      [4, 5, '2026-10-18'],
    ] as const;
    for (const [from, to, due] of expected) {
      const after = review(item({ box: from }), 'fast', today, entry(true));
      expect(after.box).toBe(to);
      expect(after.due).toBe(due);
    }
  });

  it('lader kasse 5 blive stående med 16 dage til næste gang', () => {
    const after = review(item({ box: 5, support: 0 }), 'fast', today, entry(true));
    expect(after.box).toBe(5);
    expect(after.due).toBe('2026-10-18');
    expect(after.support).toBe(0);
  });

  it('lader emnet blive stående ved rigtigt men langsomt svar', () => {
    const after = review(item({ box: 3 }), 'slow', today, entry(true));
    expect(after.box).toBe(3);
    expect(after.due).toBe('2026-10-06');
  });

  it('flytter ikke et emne op, der ikke er forfaldent', () => {
    const notDue = item({ box: 2, due: '2026-10-04' });
    const after = review(notDue, 'fast', today, entry(true));
    expect(after.box).toBe(2);
    expect(after.due).toBe('2026-10-04');
    expect(after.log).toHaveLength(1);
  });

  it('sender også et emne, der ikke er forfaldent, i kasse 1 ved fejl', () => {
    const after = review(item({ box: 4, due: '2026-10-09' }), 'wrong', today, entry(false));
    expect(after.box).toBe(1);
    expect(after.due).toBe('2026-10-03');
  });

  it('sænker støtten ét trin ved oprykning og hæver den ét trin ved fejl', () => {
    expect(review(item({ support: 3 }), 'fast', today, entry(true)).support).toBe(2);
    expect(review(item({ support: 0 }), 'fast', today, entry(true)).support).toBe(0);
    expect(review(item({ support: 1 }), 'wrong', today, entry(false)).support).toBe(2);
    expect(review(item({ support: 3 }), 'wrong', today, entry(false)).support).toBe(3);
    expect(review(item({ support: 2 }), 'slow', today, entry(true)).support).toBe(2);
  });

  it('gemmer de seneste 20 svar i loggen og kan springe loggen over', () => {
    let current = item();
    for (let i = 0; i < 25; i++) current = review(current, 'slow', today, entry(true, i));
    expect(current.log).toHaveLength(20);
    expect(current.log[0].t).toBe(5);
    expect(review(current, 'wrong', today).log).toBe(current.log);
  });

  it('kalder et emne mestret i kasse 5 med hurtigt rigtige svar på tre forskellige dage', () => {
    const day = (d: number, h = 12) => new Date(2026, 9, d, h).getTime();
    const log = [entry(true, day(1)), entry(true, day(2)), entry(true, day(2, 20))];
    expect(isMastered(item({ box: 5, log }), 3000)).toBe(false);
    const three = [...log, entry(true, day(4))];
    expect(isMastered(item({ box: 5, log: three }), 3000)).toBe(true);
    expect(isMastered(item({ box: 4, log: three }), 3000)).toBe(false);
    const slow = three.map((e) => ({ ...e, ms: 5000 }));
    expect(isMastered(item({ box: 5, log: slow }), 3000)).toBe(false);
  });
});

describe('recentAnswers', () => {
  it('giver de seneste svar på tværs af logge og tæller fælles svar én gang', () => {
    const a = [entry(true, 1), entry(false, 3), entry(true, 5)];
    const b = [entry(false, 3), entry(true, 4)];
    expect(recentAnswers([a, b])).toEqual([true, false, true, true]);
    expect(recentAnswers([a, b], 2)).toEqual([true, true]);
  });
});
