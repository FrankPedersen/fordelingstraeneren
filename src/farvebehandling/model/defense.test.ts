import { describe, expect, it } from 'vitest';
import { guessInterval } from './guess';
import { equivalentCards, fourthHandPlay, pickCard, secondHandPlay } from './normalDefense';

/** Alle kort undtagen dem, der er spillet. */
const unplayedExcept = (...played: number[]) => new Set([14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2].filter((r) => !played.includes(r)));

describe('Normalt modspil (Spil den selv)', () => {
  it('2. hånd lægger lavt', () => {
    // Vest har D 7 3, der spilles 2 ud: laveste kort er 3.
    expect(secondHandPlay([12, 7, 3], 2, unplayedExcept(2))).toEqual(new Map([[3, 1]]));
  });

  it('2. hånd dækker 10 eller højere med det billigste kort, der slår', () => {
    expect(secondHandPlay([13, 7], 11, unplayedExcept(11))).toEqual(new Map([[13, 1]]));
    expect(secondHandPlay([12, 9], 10, unplayedExcept(10))).toEqual(new Map([[12, 1]]));
    // 9 er under 10: ingen dækning.
    expect(secondHandPlay([12, 7], 9, unplayedExcept(9))).toEqual(new Map([[7, 1]]));
    // Kan ikke slå: laveste kort.
    expect(secondHandPlay([9, 7], 11, unplayedExcept(11))).toEqual(new Map([[7, 1]]));
  });

  it('vælger tilfældigt mellem ligeværdige kort', () => {
    // K D dækker knægten: begge er billigste ligeværdige kort over B.
    expect(secondHandPlay([13, 12, 7], 11, unplayedExcept(11))).toEqual(new Map([[13, 0.5], [12, 0.5]]));
    // 9 8: ingen ikke-spillede kort imellem, så de er ligeværdige.
    expect(secondHandPlay([9, 8], 2, unplayedExcept(2))).toEqual(new Map([[9, 0.5], [8, 0.5]]));
    // 9 7 med 8 hos en anden: ikke ligeværdige.
    expect(equivalentCards(7, [9, 7], unplayedExcept())).toEqual([7]);
    // 9 7, når 8 er spillet: ligeværdige.
    expect(equivalentCards(7, [9, 7], unplayedExcept(8))).toEqual([9, 7]);
  });

  it('4. hånd vinder billigst, hvis makkers kort ikke allerede vinder', () => {
    // 2 ud, makker lægger 4, 3. hånd lægger 10: 4. hånd med D B 3 vinder billigst med B eller D (ligeværdige).
    expect(fourthHandPlay([12, 11, 3], 2, 4, 10, unplayedExcept(2, 4, 10))).toEqual(new Map([[12, 0.5], [11, 0.5]]));
    // Makker vinder med K: 4. hånd lægger lavt.
    expect(fourthHandPlay([12, 3], 2, 13, 5, unplayedExcept(2, 13, 5))).toEqual(new Map([[3, 1]]));
    // Kan ikke vinde: laveste kort.
    expect(fourthHandPlay([9, 3], 2, 4, 14, unplayedExcept(2, 4, 14))).toEqual(new Map([[3, 1]]));
  });

  it('kan ikke bekende med en tom hånd', () => {
    expect(secondHandPlay([], 5, unplayedExcept(5))).toEqual(new Map([[0, 1]]));
    expect(fourthHandPlay([], 5, 3, 7, unplayedExcept(5, 3, 7))).toEqual(new Map([[0, 1]]));
  });

  it('trækker et kort efter fordelingen', () => {
    const choice = new Map([[13, 0.5], [12, 0.5]]);
    expect(pickCard(choice, 0.2)).toBe(13);
    expect(pickCard(choice, 0.7)).toBe(12);
  });
});

describe('Gætteintervaller', () => {
  it('25,0 → 25–50, 50,0 → 50–75, 75,0 → 75–100', () => {
    expect(guessInterval(25)).toBe(1);
    expect(guessInterval(50)).toBe(2);
    expect(guessInterval(75)).toBe(3);
    expect(guessInterval(24.9)).toBe(0);
    expect(guessInterval(37.3)).toBe(1);
    expect(guessInterval(100)).toBe(3);
  });

  it('bruger den viste afrunding', () => {
    expect(guessInterval(24.96)).toBe(1);
    expect(guessInterval(49.94)).toBe(1);
  });
});
