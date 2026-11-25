import { describe, expect, it } from 'vitest';
import { erKlar, forspring, rigtigeFarver, udspilFacit } from '../model/findUdspil';
import { profil } from '../model/metoder';
import { fastOpgave } from './hjaelp';

/*
 * Accepttest 2 i SPEC-modspil-v2.md, trin 2: lige gode og klare. Farver under 0,1 stik fra den bedste er lige gode, og
 * alle er rigtige (Franks svar 4); en opgave er klar, når den bedste farve fører med mindst 0,2 stik over den næstbedste
 * (Franks valg 25. nov. 2026). Faste eksempler på 0,09, 0,1, 0,19 og 0,2 stik.
 *
 * Middelstikkene har to decimaler, men forskellen mellem to kommatal er ikke altid præcis: 2,3 − 2,2 er
 * 0,0999999999999996 og 1,1 − 1,0 er 0,1000000000000001 i JavaScript, og 2,3 − 2,1 er 0,1999999999999997, mens
 * 3,2 − 3,0 er 0,2000000000000002. Begge sider af hver grænse er med, så modellen skal regne i hundrededele (eller
 * runde), før den sammenligner.
 */

const r = (...middel: number[]) => middel.map((m, farve) => ({ farve, middel: m }));

describe('Lige gode (under 0,1 stik) og klare (mindst 0,2 stik) (accepttest 2)', () => {
  it('0,09 stik: begge farver er rigtige, og opgaven er ikke klar', () => {
    for (const t of [r(2.3, 2.21), r(3.07, 2.98), r(1.0, 0.91)]) {
      expect(rigtigeFarver(t), JSON.stringify(t)).toEqual([0, 1]);
      expect(forspring(t)).toBe(0.09);
      expect(erKlar(t)).toBe(false);
    }
  });

  it('0,1 stik: kun den bedste er rigtig, og opgaven er ikke klar', () => {
    for (const t of [r(2.3, 2.2), r(3.07, 2.97), r(1.1, 1.0)]) {
      expect(rigtigeFarver(t), JSON.stringify(t)).toEqual([0]);
      expect(forspring(t)).toBe(0.1);
      expect(erKlar(t)).toBe(false);
    }
  });

  it('0,19 stik: ikke klar', () => {
    for (const t of [r(2.3, 2.11), r(1.4, 1.21), r(3.2, 3.01)]) {
      expect(rigtigeFarver(t), JSON.stringify(t)).toEqual([0]);
      expect(forspring(t)).toBe(0.19);
      expect(erKlar(t), JSON.stringify(t)).toBe(false);
    }
  });

  it('0,2 stik: klar', () => {
    for (const t of [r(2.3, 2.1), r(1.4, 1.2), r(3.2, 3.0), r(0.3, 0.1)]) {
      expect(rigtigeFarver(t), JSON.stringify(t)).toEqual([0]);
      expect(forspring(t)).toBe(0.2);
      expect(erKlar(t), JSON.stringify(t)).toBe(true);
    }
  });

  it('rækkefølgen er ligegyldig: den bedste kan stå i enhver farve, og alle lige gode er rigtige', () => {
    const t = [
      { farve: 0, middel: 1.0 },
      { farve: 1, middel: 2.3 },
      { farve: 2, middel: 2.21 },
      { farve: 3, middel: 2.1 },
    ];
    expect(rigtigeFarver(t)).toEqual([1, 2]);
    expect(forspring(t)).toBe(0.09);
    expect(erKlar(t)).toBe(false);
    // Tre lige gode, og en renonce i ♣ (ingen række).
    const tre = [
      { farve: 0, middel: 2.0 },
      { farve: 1, middel: 2.09 },
      { farve: 2, middel: 2.05 },
    ];
    expect(rigtigeFarver(tre)).toEqual([0, 1, 2]);
    expect(forspring(tre)).toBe(0.04);
    // To farver står helt lige: forspring 0.
    expect(forspring(r(2.5, 2.5, 1.0))).toBe(0);
    expect(rigtigeFarver(r(2.5, 2.5, 1.0))).toEqual([0, 1]);
  });

  it('facit bruger de samme grænser: ♠ 2,30 mod ♥ 2,10 er klar, og ♠ 2,30 mod ♥ 2,20 har kun ♠ som rigtig', () => {
    // Mod sans med Standard: ♠8 4 2 (♠8), ♥10 9 7 5 3 (♥5), ♦K 6 (♦K) og ♣D B 6 ("table feeling": ♣D eller ♣6).
    const pbn = '842.T9753.K6.QJ6';
    const klar = udspilFacit('S1-1nt-3nt', fastOpgave(pbn, { S8: 2.3, H5: 2.1, DK: 1.5, CQ: 1.4, C6: 1.3 }), profil('standard'));
    expect([klar.farver, klar.forspring, klar.klar]).toEqual([[0], 0.2, true]);
    const tiendedel = udspilFacit('S1-1nt-3nt', fastOpgave(pbn, { S8: 2.3, H5: 2.2, DK: 1.5, CQ: 1.4, C6: 1.3 }), profil('standard'));
    expect([tiendedel.farver, tiendedel.forspring, tiendedel.klar]).toEqual([[0], 0.1, false]);
    const lige = udspilFacit('S1-1nt-3nt', fastOpgave(pbn, { S8: 2.3, H5: 2.21, DK: 1.5, CQ: 1.4, C6: 1.3 }), profil('standard'));
    expect([lige.farver, lige.forspring, lige.klar]).toEqual([[0, 1], 0.09, false]);
  });
});
