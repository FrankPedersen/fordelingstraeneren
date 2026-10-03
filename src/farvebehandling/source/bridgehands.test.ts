import { describe, expect, it } from 'vitest';
import { classifyCases, concreteHands, frequencyHolding, parseBridgehands } from './bridgehands';

const row = (n: number, split: string, holding: string, need: string, pct: string, remark = '') =>
  `<tr><td><b>${n}</b></td><td>${split}</td><td>${holding}</td><td>${need}</td><td>${pct}</td><td>${remark}</td></tr>`;

const html = [
  '<table>',
  row(4, '6-0', 'A K J T x x', '6<br>5', '9<br>94'),
  row(5, '5-1', 'A K J 9 x x<br>x', '6<br>5', '19<br>68', 'Finesse Q'),
  row(30, '5-2', 'A K J 10 x<br>x x', '4', '42<br>92', 'Finesse Q'),
  row(40, '4-3', 'A K x x<br>J x x', '3', '69', 'Play A then finesse Q'),
  row(42, '4-3', 'A K x x<br>J x x', '3', '69', 'Play A then finesse Q'),
  row(44, '4-3', 'A J 3 2<br>K 5 4', '4<br>3', '18<br>77'),
  row(74, '8-1', 'A K J x ... x<br>x', '8<br>7', '53<br>95'),
  '</table>',
].join('');

describe('bridgehands.com', () => {
  const cases = parseBridgehands(html);

  it('læser case, fordeling, hånd, bord, mål og procent', () => {
    expect(cases.map((c) => c.number)).toEqual([4, 5, 30, 40, 42, 44, 74]);
    expect(cases[0]).toMatchObject({ split: '6-0', hand: 'AKJTxx', dummy: '', needs: [6, 5], percents: [9, 94] });
    expect(cases[3]).toMatchObject({ hand: 'AKxx', dummy: 'Jxx', needs: [3], percents: [69], remark: 'Play A then finesse Q' });
  });

  it('sorterer fejl i kilden fra', () => {
    const c = classifyCases(cases);
    const reason = (n: number) => c.find((x) => x.number === n)!.reason;
    expect(reason(4)).toBeNull();
    expect(reason(5)).toMatch(/fordelingen er 5-1/);
    expect(reason(30)).toMatch(/1 mål, men 2 procenter/);
    expect(reason(40)).toBeNull();
    expect(reason(42)).toBe('dublet af case 40');
    expect(reason(44)).toBeNull();
    expect(reason(74)).toMatch(/uklart/);
  });

  it('omsætter x efter begge fortolkninger', () => {
    const c = cases.find((x) => x.number === 40)!;
    // Lav: spilførerens x'er er 2–5, modparten har D 10 9 8 7 6.
    expect(concreteHands(c, 'lav')).toEqual({ south: [14, 13, 5, 4], north: [11, 3, 2] });
    // Høj: spilførerens x'er er de højeste under knægten, modparten har D 6 5 4 3 2.
    expect(concreteHands(c, 'høj')).toEqual({ south: [14, 13, 10, 9], north: [11, 8, 7] });
    // Navngivne små kort bruges som de står.
    const spots = cases.find((x) => x.number === 44)!;
    expect(concreteHands(spots, 'lav')).toEqual({ south: [14, 11, 3, 2], north: [13, 5, 4] });
  });

  it('regner de allerlaveste navngivne kort som x i hyppigheden', () => {
    expect(frequencyHolding(cases.find((x) => x.number === 44)!)).toEqual({ hand: 'AJxx', dummy: 'Kxx' });
    expect(frequencyHolding({ hand: 'AKxx', dummy: 'J98' })).toEqual({ hand: 'AKxx', dummy: 'J98' });
  });
});
