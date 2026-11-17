import { describe, expect, it } from 'vitest';
import { profil } from './model/metoder';
import { mindsteLaengde, muligeUdspil, udspil } from './model/udspil';

/*
 * Accepttest 2 i SPEC-modspil.md: udspilsreglen med faste eksempler. Rød, indtil byggeriet har leveret:
 *
 * src/modspil/model/udspil.ts
 *   export type Kontrakt = '3NT' | '4H' | '4S';
 *   export type Kontraktart = 'sans' | 'farve';
 *   export function kontraktart(k: Kontrakt): Kontraktart;
 *   // Valører 2–14 (B 11, D 12, K 13, E 14) i én farve, i vilkårlig orden.
 *   export function muligeUdspil(holding: readonly number[], art: Kontraktart, profil: Profil): number[];  // faldende
 *   export function udspil(holding: readonly number[], art: Kontraktart, profil: Profil): number | null;    // null = ikke entydigt
 *   export function mindsteLaengde(art: Kontraktart, profil: Profil): number;  // mindste længde for et lavt udspil
 *
 * Reglerne står i bruteforce.ts (øverst). Kort fortalt: en honnørsekvens giver toppen (mod sans efter honnørmetoden:
 * top af sekvens eller ALA-tabellen), to honnørkort i sekvens mod sans er "table feeling" (toppen eller det lave kort,
 * altså ikke entydigt), ellers metodens lave kort. Fra singleton kortet og fra doubleton det højeste.
 */

const [B, D, K, E] = [11, 12, 13, 14];
const standard = profil('standard');
const omvendt = profil('omvendt');
const kompendiet = profil('kompendiet');

describe('Udspilsreglen (accepttest 2)', () => {
  it('Standard: K 10 7 4 2 → 4 mod sans og farve; 8 6 4 2 → 2; D B 10 → D', () => {
    for (const art of ['sans', 'farve'] as const) {
      expect(udspil([K, 10, 7, 4, 2], art, standard), art).toBe(4);
      expect(udspil([8, 6, 4, 2], art, standard), art).toBe(2);
      expect(udspil([D, B, 10], art, standard), art).toBe(D);
    }
  });

  it('Kompendiet mod sans: K 10 7 4 2 → 4; 8 6 2 → 8; 8 6 4 2 → 6; 9 5 → 9; 10 8 6 → 8; D B 10 → D', () => {
    // 4.-højeste fra honnør; tredje laveste fra småkort (fra tre små det højeste, fra fire små det næsthøjeste);
    // højeste fra doubleton; næsthøjeste fra en tier; højeste fra tre kort i sekvens (ALA).
    expect(udspil([K, 10, 7, 4, 2], 'sans', kompendiet)).toBe(4);
    expect(udspil([8, 6, 2], 'sans', kompendiet)).toBe(8);
    expect(udspil([8, 6, 4, 2], 'sans', kompendiet)).toBe(6);
    expect(udspil([9, 5], 'sans', kompendiet)).toBe(9);
    expect(udspil([10, 8, 6], 'sans', kompendiet)).toBe(8);
    expect(udspil([D, B, 10], 'sans', kompendiet)).toBe(D);
  });

  it('Kompendiet mod farve: K 9 6 4 2 → 2 (5.-højeste); 8 6 2 → 2 (3.-højeste); E K x → E', () => {
    // K 9 6 4 2 → 2 er rådgiverens forslag under Afklaret (5.-højeste fra fem kort); Frank bekræfter.
    expect(udspil([K, 9, 6, 4, 2], 'farve', kompendiet)).toBe(2);
    expect(udspil([8, 6, 2], 'farve', kompendiet)).toBe(2);
    for (const x of [2, 5, 9]) expect(udspil([E, K, x], 'farve', kompendiet), `E K ${x}`).toBe(E);
  });

  it('Kompendiet mod sans følger ALA-tabellen (PLAN-aabne-opgaver.md, besluttet 15. nov.)', () => {
    const tabel: [number[], number][] = [
      [[E, K, 7, 4, 2], K], // E K x x x(+) → K
      [[E, K, 7, 4], E], // E K x x → E
      [[E, K, D, 4], E], // E K D x(x) → E
      [[E, K, B, 10, 4], K], // E K B 10(x) → K
      [[K, D, B], K], // K D B → K
      [[K, D, 10, 9, 3], K], // K D 10 9(x) → K
      [[K, D, 7, 4], D], // K D x x(x) → D
      [[D, B, 10], D], // D B 10 → D
      [[D, B, 9], D], // D B 9 → D
      [[B, 10, 9], B], // B 10 9 → top af sekvens
      [[10, 9, 8], 10], // 10 9 8 → top af sekvens
    ];
    for (const [holding, kort] of tabel) expect(udspil(holding, 'sans', kompendiet), holding.join(' ')).toBe(kort);
  });

  it('to honnørkort i sekvens mod sans er table feeling: honnøren eller det lave kort, så udspillet er ikke entydigt', () => {
    // Kompendiet K D 7: K eller laveste fra Hxx (forslaget under Afklaret). Standard K D 7 4 og E K 7 4: toppen eller 4.-højeste.
    expect(udspil([K, D, 7], 'sans', kompendiet)).toBeNull();
    expect(muligeUdspil([K, D, 7], 'sans', kompendiet)).toEqual([K, 7]);
    expect(udspil([K, D, 7, 4], 'sans', standard)).toBeNull();
    expect(muligeUdspil([K, D, 7, 4], 'sans', standard)).toEqual([K, 4]);
    expect(muligeUdspil([E, K, 7, 4], 'sans', standard)).toEqual([E, 4]);
  });

  it('sekvenserne: mod farve giver to honnørkort i træk toppen, mod sans kræver top af sekvens tre i træk eller en brudt sekvens', () => {
    expect(udspil([D, B, 7, 4], 'farve', standard)).toBe(D);
    expect(udspil([B, 10, 7, 3], 'farve', standard)).toBe(B);
    expect(udspil([10, 9, 8, 4], 'farve', standard)).toBe(10);
    expect(udspil([10, 9, 7, 4], 'farve', standard)).toBe(4);
    expect(udspil([K, D, B, 4], 'sans', standard)).toBe(K);
    expect(udspil([K, D, 10, 4], 'sans', standard)).toBe(K);
    expect(udspil([D, B, 9, 3], 'sans', standard)).toBe(D);
    expect(udspil([B, 10, 8, 2], 'sans', standard)).toBe(B);
  });

  it('3. og 5. højeste (Omvendt mod farve): 3.-højeste fra tre og fire kort, 5.-højeste fra fem', () => {
    expect(udspil([K, 10, 7, 4, 2], 'farve', omvendt)).toBe(2);
    expect(udspil([K, 10, 7], 'farve', omvendt)).toBe(7);
    expect(udspil([K, 10, 7, 4], 'farve', omvendt)).toBe(7);
  });

  it('et entydigt udspil er det eneste mulige, og rækkefølgen af kortene er ligegyldig', () => {
    expect(muligeUdspil([K, 10, 7, 4, 2], 'sans', standard)).toEqual([4]);
    expect(udspil([2, 4, 7, 10, K], 'sans', standard)).toBe(4);
    expect(udspil([2, 6, 8], 'farve', kompendiet)).toBe(2);
  });

  it('mindste længde for et lavt udspil: 4 med 4.-højeste, ellers 3', () => {
    expect(mindsteLaengde('sans', standard)).toBe(4);
    expect(mindsteLaengde('farve', standard)).toBe(4);
    expect(mindsteLaengde('farve', omvendt)).toBe(3);
    expect(mindsteLaengde('sans', kompendiet)).toBe(3);
    expect(mindsteLaengde('farve', kompendiet)).toBe(3);
  });
});
