import { describe, expect, it } from 'vitest';
import { cardsData, cardsText, missingCards, parseCards } from './cards';
import { percentOf } from './fraction';
import { combinationFrequency, eveningText, oncePerDeals, situationFrequency } from './frequency';
import { A_PRIORI, layoutChance, splitChance, westHoldsChance } from './layouts';

describe('Kort', () => {
  it('læser data og viser dansk med tieren som 10', () => {
    expect(parseCards('AT65')).toEqual([14, 10, 6, 5]);
    expect(parseCards('A 10 6 5')).toEqual([14, 10, 6, 5]);
    expect(cardsText(parseCards('AT65'))).toBe('E 10 6 5');
    expect(cardsText(parseCards('KQJ'))).toBe('K D B');
    expect(cardsText([])).toBe('–');
    expect(cardsData([5, 14, 6, 10])).toBe('AT65');
  });

  it('afviser dubletter og finder de manglende kort', () => {
    expect(() => parseCards('AA')).toThrow();
    expect(missingCards(parseCards('J432'), parseCards('AT65'))).toEqual([13, 12, 9, 8, 7]);
    expect(() => missingCards(parseCards('A'), parseCards('A2'))).toThrow();
  });
});

describe('Sidninger', () => {
  it('5 manglende kort, konkret sidning a priori: 5-0 = 1,96 %, 4-1 = 2,83 %, 3-2 = 3,39 %', () => {
    expect(percentOf(layoutChance(5, 5))).toBe(1.96);
    expect(percentOf(layoutChance(5, 4))).toBe(2.83);
    expect(percentOf(layoutChance(5, 3))).toBe(3.39);
  });

  it('5 manglende kort, samlet: 3-2 = 67,8 %, 4-1 = 28,3 %, 5-0 = 3,9 %', () => {
    expect(percentOf(splitChance(5, 3), 1)).toBe(67.8);
    expect(percentOf(splitChance(5, 4), 1)).toBe(28.3);
    expect(percentOf(splitChance(5, 5), 1)).toBe(3.9);
  });

  it('4 manglende kort, konkret sidning: 2-2 = 6,78 %, 3-1 = 6,22 %, 4-0 = 4,78 %', () => {
    expect(percentOf(layoutChance(4, 2))).toBe(6.78);
    expect(percentOf(layoutChance(4, 3))).toBe(6.22);
    expect(percentOf(layoutChance(4, 4))).toBe(4.78);
  });

  it('ledige pladser 13/13 giver præcis de samme tal som a priori', () => {
    for (let n = 1; n <= 8; n++) {
      for (let k = 0; k <= n; k++) {
        expect(layoutChance(n, k, { west: 13, east: 13 })).toEqual(layoutChance(n, k, A_PRIORI));
      }
    }
  });

  it('summerer til 1 over alle fordelinger, også med en optælling', () => {
    for (const vacant of [A_PRIORI, { west: 7, east: 11 }]) {
      const parts = [0, 1, 2, 3, 4, 5].map((k) => westHoldsChance(5, k, vacant));
      expect(parts.reduce((a, b) => a + b.num, 0n)).toBe(parts[0].den);
    }
  });

  it('flytter chancen mod den hånd, der har flest ledige pladser', () => {
    // Vest har vist 6 kort i de andre farver: 7 ledige pladser mod Østs 13.
    const fewer = westHoldsChance(4, 3, { west: 7, east: 13 });
    const apriori = westHoldsChance(4, 3);
    expect(Number(fewer.num) / Number(fewer.den)).toBeLessThan(Number(apriori.num) / Number(apriori.den));
  });
});

describe('Hyppighed', () => {
  it('E K x x / B x x = 0,747 % (1 ud af 134) og E K B x / x x x = 0,498 % (1 ud af 201)', () => {
    const a = combinationFrequency('AKxx', 'Jxx');
    expect(percentOf(a, 3)).toBe(0.747);
    expect(oncePerDeals(a)).toBe(134);
    const b = combinationFrequency('AKJx', 'xxx');
    expect(percentOf(b, 3)).toBe(0.498);
    expect(oncePerDeals(b)).toBe(201);
  });

  it('giver specens tabel over de hyppigste cases på siden "damen mangler"', () => {
    const rows: [string, string, number][] = [
      ['AJxx', 'Kxx', 134], ['AKx', 'Jxx', 201], ['Jxxx', 'AKx', 201], ['AJxxx', 'Kx', 246],
      ['AKTx', 'xxx', 362], ['AKJxxx', 'x', 368], ['Jxxxx', 'AKxx', 413], ['JTxx', 'AKx', 603],
    ];
    for (const [hand, dummy, once] of rows) expect(oncePerDeals(combinationFrequency(hand, dummy)), hand).toBe(once);
  });

  it('er den samme, uanset om kortene sidder i hånden eller på bordet', () => {
    expect(combinationFrequency('AKxx', 'Jxx')).toEqual(combinationFrequency('Jxx', 'AKxx'));
  });

  it('es og konge uden damen: 7 kort 14,0 %, 8 kort 10,56 %, 9 kort 4,9 % pr. spil', () => {
    expect(percentOf(situationFrequency([14, 13], [12], 7), 1)).toBe(14.0);
    expect(percentOf(situationFrequency([14, 13], [12], 8), 2)).toBe(10.56);
    expect(percentOf(situationFrequency([14, 13], [12], 9), 1)).toBe(4.9);
  });

  it('vises som naturlig frekvens pr. klubaften', () => {
    expect(eveningText(situationFrequency([14, 13], [12], 7))).toBe('ca. 3,5 gange pr. klubaften');
    expect(eveningText(situationFrequency([14, 13], [12], 8))).toBe('ca. 2,6 gange pr. klubaften');
    expect(eveningText(combinationFrequency('AKxx', 'Jxx'))).toBe('ca. hver 5. klubaften');
  });
});
