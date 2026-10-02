import { describe, expect, it } from 'vitest';
import { binomial, ratioPercent } from './combinatorics';
import { completions } from './complete';

describe('Fuldfør – accepttest', () => {
  it('kendt 5♠ og 4♥: minorerne sidder 3-1 (begge veje) 49,74 %, 2-2 40,70 % og 4-0 9,57 %', () => {
    const { total, list } = completions([5, 4, null, null]);
    expect(list.map((c) => c.pattern.id)).toEqual(['5-4-3-1', '5-4-2-2', '5-4-4-0']);
    expect(list.map((c) => ratioPercent(c.weight, total, 2))).toEqual([49.74, 40.7, 9.57]);
  });
});

describe('Fuldfør', () => {
  it('lader de ukendte farver dele de resterende kort hypergeometrisk', () => {
    const { total, list } = completions([5, null, null, null]);
    expect(total).toBe(binomial(39, 8));
    expect(list.reduce((sum, c) => sum + c.weight, 0n)).toBe(total);
    expect(list).toHaveLength(10);
    expect(list.slice(0, 4).map((c) => c.pattern.id)).toEqual([
      '5-3-3-2',
      '5-4-3-1',
      '5-4-2-2',
      '5-5-2-1',
    ]);
  });

  it('giver ét mønster, når alle fire længder er kendt', () => {
    const { total, list } = completions([2, 5, 2, 4]);
    expect(list.map((c) => c.pattern.id)).toEqual(['5-4-2-2']);
    expect(list[0].weight).toBe(total);
  });

  it('afviser umulige længder', () => {
    expect(() => completions([7, 7, null, null])).toThrow();
    expect(() => completions([4, 4, 4, 4])).toThrow();
    expect(() => completions([5, 4, null])).toThrow();
  });
});
