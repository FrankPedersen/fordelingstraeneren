import { describe, expect, it } from 'vitest';
import { farvevaerdier, forklarUdspil, udspilFacit, type FarveRaekke } from '../model/findUdspil';
import { profil } from '../model/metoder';
import { fastOpgave, k } from './hjaelp';

/*
 * Accepttest 1 i SPEC-modspil-v2.md, trin 2: farvens værdi og kortet. For hver farve, Vest har kort i, er farvens værdi
 * middelstikket for det kort, profilens udspilsregel giver (`udspil.ts`). Giver reglen "table feeling", tæller det
 * bedste af de to kort, og begge er rigtige. Faste eksempler for hver profil, også "table feeling" og farver, hvor
 * Standard og Kompendiet spiller forskellige kort.
 *
 * Eksemplet med Standard K og Kompendiet D er ♥K D 10 5 (brudt sekvens mod ALA's K D x x), og K D 5 3 giver "table
 * feeling" med Standard (K eller 3) og D med Kompendiet (Franks valg efter session 2a).
 *
 * Kortet, der giver værdien, giver også chancen for at sætte (`saet`); står to kort lige, gælder det højeste antal
 * (Claude Codes valg, Afklaret). Facit har desuden middelstik og sætninger for hvert af Vests 13 kort (`kortTabel`,
 * Franks valg efter session 2a), så trin 3 kan vise prisen for et hvilket som helst svar.
 */

const STANDARD = profil('standard');
const OMVENDT = profil('omvendt');
const KOMPENDIET = profil('kompendiet');

const raekke = (farve: number, kort: string[], middel: number, saet: number): FarveRaekke => ({
  farve,
  kort: kort.map(k).sort((a, b) => a - b),
  middel,
  saet,
});

/** Mod sans: ♠K D 5 3 ("table feeling" med Standard), ♥K D 10 5 (Standard K, Kompendiet D), ♦9 7 4 2 og ♣E. */
const HAAND_A = fastOpgave(
  'KQ53.KQT5.9742.A',
  { SK: 2.4, SQ: 2.45, S5: 2.0, S3: 2.7, HK: 2.2, HQ: 2.6, HT: 2.0, H5: 2.0, D9: 1.5, D7: 2.3, D4: 1.5, D2: 1.9, CA: 1.2 },
  { SK: 30, SQ: 28, S3: 25, HK: 20, HQ: 33, D7: 18, D2: 10, CA: 5 },
);

/** Mod farve, renonce i ♥: ♠K D 5 3, ♦9 7 4 2 og ♣K 10 8 6 3. */
const HAAND_B = fastOpgave('KQ53..9742.KT863', { SK: 1.45, D2: 1.3, D4: 1.8, C6: 1.6, C3: 1.2 }, { SK: 12, D2: 9, D4: 21, C6: 14, C3: 8 });

/** Mod sans: ♠10 7 3, ♥8 6, ♦E K B 10 og ♣D 9 5 4. */
const HAAND_C = fastOpgave('T73.86.AKJT.Q954', {});

/** Mod sans: ♠E K 4 ("table feeling" også med Kompendiet), ♥D B 6 2, ♦10 9 8 og ♣7 5 3. */
const HAAND_E = fastOpgave('AK4.QJ62.T98.753', { SA: 2.1, S4: 2.5, HQ: 2.0, H2: 2.0, DT: 1.7, C7: 1.4 }, { SA: 12, S4: 11, HQ: 15, H2: 17, DT: 6, C7: 3 });

describe('Farvens værdi og kortet (accepttest 1)', () => {
  it('mod sans med Standard: "table feeling" i ♠K D 5 3 tæller det bedste af ♠K og ♠3, og ♥K D 10 5 giver ♥K', () => {
    expect(farvevaerdier(HAAND_A, 'sans', STANDARD)).toEqual([
      raekke(0, ['S3', 'SK'], 2.7, 25),
      raekke(1, ['HK'], 2.2, 20),
      raekke(2, ['D2'], 1.9, 10),
      raekke(3, ['CA'], 1.2, 5),
    ]);
  });

  it('mod sans med Omvendt: som Standard (4.-højeste og top af sekvens mod sans)', () => {
    expect(farvevaerdier(HAAND_A, 'sans', OMVENDT)).toEqual(farvevaerdier(HAAND_A, 'sans', STANDARD));
  });

  it('mod sans med Kompendiet: ALA giver ♠D og ♥D, og Kompendiets udspil giver ♦7 fra fire små', () => {
    expect(farvevaerdier(HAAND_A, 'sans', KOMPENDIET)).toEqual([
      raekke(0, ['SQ'], 2.45, 28),
      raekke(1, ['HQ'], 2.6, 33),
      raekke(2, ['D7'], 2.3, 18),
      raekke(3, ['CA'], 1.2, 5),
    ]);
  });

  it('mod farve: Standard 4.-højeste, Omvendt og Kompendiet 3. og 5. højeste, toppen af K D med alle; ingen række for renoncen', () => {
    expect(farvevaerdier(HAAND_B, 'farve', STANDARD)).toEqual([raekke(0, ['SK'], 1.45, 12), raekke(2, ['D2'], 1.3, 9), raekke(3, ['C6'], 1.6, 14)]);
    const tredjeFemte = [raekke(0, ['SK'], 1.45, 12), raekke(2, ['D4'], 1.8, 21), raekke(3, ['C3'], 1.2, 8)];
    expect(farvevaerdier(HAAND_B, 'farve', OMVENDT)).toEqual(tredjeFemte);
    expect(farvevaerdier(HAAND_B, 'farve', KOMPENDIET)).toEqual(tredjeFemte);
  });

  it('flere farver, hvor Standard og Kompendiet spiller forskellige kort: ♠10 mod ♠7, ♦E mod ♦K; doubleton og D 9 5 4 er ens', () => {
    const kort = (p: typeof STANDARD) => farvevaerdier(HAAND_C, 'sans', p).map((r) => [r.farve, r.kort]);
    expect(kort(STANDARD)).toEqual([
      [0, [k('ST')]],
      [1, [k('H8')]],
      [2, [k('DA')]],
      [3, [k('C4')]],
    ]);
    expect(kort(OMVENDT)).toEqual(kort(STANDARD));
    expect(kort(KOMPENDIET)).toEqual([
      [0, [k('S7')]],
      [1, [k('H8')]],
      [2, [k('DK')]],
      [3, [k('C4')]],
    ]);
  });

  it('"table feeling" med alle profiler i ♠E K 4 og ♥D B 6 2; står de to kort lige, giver det højeste antal sætninger chancen', () => {
    for (const p of [STANDARD, OMVENDT, KOMPENDIET]) {
      expect(farvevaerdier(HAAND_E, 'sans', p), p.id).toEqual([
        raekke(0, ['S4', 'SA'], 2.5, 11),
        raekke(1, ['H2', 'HQ'], 2.0, 17),
        raekke(2, ['DT'], 1.7, 6),
        raekke(3, ['C7'], 1.4, 3),
      ]);
    }
  });

  it('facit: ved "table feeling" er begge kort rigtige, og de rigtige kort er profilens kort i de rigtige farver', () => {
    const standard = udspilFacit('S1-1nt-3nt', HAAND_A, STANDARD);
    expect(standard.farver).toEqual([0]);
    expect(standard.kort).toEqual([k('S3'), k('SK')]);
    expect(standard.forspring).toBe(0.5);
    expect(standard.klar).toBe(true);
    expect(standard.raad).toEqual([0, 1]);
    expect(standard.afviger).toBe(false);
    expect(standard.fordelinger).toBe(100);
    // Middelstik og sætninger for alle 13 kort, også dem, profilen ikke spiller ud.
    expect(standard.kortTabel).toEqual(HAAND_A.vest.map((kort, i) => ({ kort, middel: HAAND_A.middel[i], saet: HAAND_A.saet[i] })));
    expect(standard.kortTabel.map((r) => r.kort)).toEqual([...HAAND_A.vest].sort((a, b) => a - b));
    expect(standard.kortTabel.find((r) => r.kort === k('H5'))).toEqual({ kort: k('H5'), middel: 2.0, saet: 0 });
    expect(udspilFacit('S1-1nt-3nt', HAAND_A, KOMPENDIET).kortTabel).toEqual(standard.kortTabel);

    const kompendiet = udspilFacit('S1-1nt-3nt', HAAND_A, KOMPENDIET);
    expect(kompendiet.farver).toEqual([1]);
    expect(kompendiet.kort).toEqual([k('HQ')]);
    expect(kompendiet.forspring).toBe(0.15);
    expect(kompendiet.klar).toBe(false);

    const omvendt = udspilFacit('S4-kun-en-farve', HAAND_B, OMVENDT);
    expect(omvendt.tabel.map((r) => r.farve)).toEqual([0, 2, 3]);
    expect(omvendt.farver).toEqual([2]);
    expect(omvendt.kort).toEqual([k('D4')]);
    expect(omvendt.forspring).toBe(0.35);
    expect(omvendt.klar).toBe(true);
    // S4: ingen singleton eller doubleton i en sidefarve, så rådet er sidefarverne uden honnør: ♦9 7 4 2.
    expect(omvendt.raad).toEqual([2]);
    expect(omvendt.afviger).toBe(false);
  });

  it('forklaringen nævner metoden, når profilen skifter kortet: "Med profilen Kompendiet spilles ♥D … (ALA)"', () => {
    // Kompendiet: ♥ er bedst (2,6), og ALA giver ♥D, hvor Standard spiller ♥K.
    const kompendiet = forklarUdspil('S1-1nt-3nt', HAAND_A, KOMPENDIET, 'kort').forklaring;
    expect(kompendiet.da).toContain('Kompendiet');
    expect(kompendiet.da).toContain('♥D');
    expect(kompendiet.da).toContain('ALA');
    expect(kompendiet.en).toContain('♥Q');
    expect(kompendiet.en).toContain('ALA');
    // Standard: ♠ er bedst, og "table feeling" giver ♠K eller ♠3, hvor Kompendiet spiller ♠D.
    const standard = forklarUdspil('S1-1nt-3nt', HAAND_A, STANDARD, 'kort').forklaring;
    expect(standard.da).toContain('Standard');
    for (const kort of ['♠K', '♠3']) {
      expect(standard.da).toContain(kort);
      expect(standard.en).toContain(kort);
    }
  });
});
