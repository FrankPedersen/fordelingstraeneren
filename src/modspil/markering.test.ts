import { describe, expect, it } from 'vitest';
import type { Card } from '../domain/cards';
import { medMetode, profil } from './model/metoder';
import { aflaesAfkast, aflaesForsinket, aflaesTilspil, vaelgAfkast, vaelgForsinket, vaelgTilspil, type Afkast, type Tilspil } from './model/markering';
import type { Kontrakt } from './model/udspil';

/*
 * Accepttest 4 (romersk kald, Kompendiets egne eksempler) og 5 (O/E og omvendt forsinket kald) i SPEC-modspil.md, og
 * aftalerne bag øvelse 4–7. Første afkast følger Franks svar 17. nov. 2026 (samme relative regel som romersk kald).
 * Rød, indtil byggeriet har leveret:
 *
 * src/modspil/model/markering.ts
 *   export interface Tilspil {
 *     kontrakt: Kontrakt;              // '3NT' | '4H' | '4S'
 *     udspiller: readonly number[];    // Vests valører i farven før udspillet
 *     udspil: number;                  // Vests udspil (en honnør)
 *     bord: readonly number[];         // bordets valører i farven før stikket (bordet lægger sit laveste)
 *     tilspil: number;                 // Østs kort
 *   }
 *   export function aflaesTilspil(t: Tilspil, profil: Profil): Facit;   // signal, laengder (spilførers), kan ikke afgøres eller tvetydig
 *   export function vaelgTilspil(v: { kontrakt: Kontrakt; udspil: number; oest: readonly number[]; onske: Signal }, profil: Profil): number;
 *   export interface Afkast {
 *     kontrakt: Kontrakt;
 *     kort: number;                    // afkastets valør
 *     synlige: readonly number[];      // valørerne i afkastfarven, som den, der læser afkastet, kan se: egne kort,
 *                                      // bordets og kort, der er spillet i farven før afkastet (afkastet er ikke med)
 *   }
 *   export function aflaesAfkast(a: Afkast, profil: Profil): Facit;                                    // { type: 'signal' }
 *   export function vaelgAfkast(v: { kontrakt: Kontrakt; spilfoerersFarve: number; haand: readonly Card[]; synlige: readonly Card[]; onske: number }, profil: Profil): Card[];
 *     // synlige: de kort, brugeren ser ud over sin hånd (bordets kort og de spillede kort)
 *   export function aflaesForsinket(foerste: number, anden: number, profil: Profil): Facit;          // { type: 'forsinket' }
 *   export function vaelgForsinket(holding: readonly number[], onske: 'passiv' | 'aktiv', profil: Profil): number;
 *   // aflaesForsinket og vaelgForsinket kaster, når profilen ikke har omvendt forsinket kald.
 *
 * Signalerne: 'kald', 'afvisning', 'skift-lav' (laveste af de to andre farver), 'skift-hoej' (højeste) og 'skift'
 * (ønske om skift uden retning). Farverne har indeks ♠ 0, ♥ 1, ♦ 2, ♣ 3; kort 0–51 som i domain/cards.ts.
 * Aflæsningsreglerne står øverst i bruteforce.ts; eksemplerne herunder er regnet efter dem.
 */

const [B, D, K, E] = [11, 12, 13, 14];
const standard = profil('standard');
const omvendt = profil('omvendt');
const kompendiet = profil('kompendiet');
const kort = (farve: number, vaerdi: number): Card => farve * 13 + vaerdi - 2;
const signal = (s: string) => ({ type: 'signal', signal: s });

/** Udspil ♠E fra ♠E K 9 3 2 og bordet ♠B 4 (Kompendiet s. 25), mod 4♥, så de to andre farver er ♦ og ♣. */
const eksempel1 = (tilspil: number): Tilspil => ({ kontrakt: '4H', udspiller: [E, K, 9, 3, 2], udspil: E, bord: [B, 4], tilspil });
/** Udspil ♠E fra ♠E K 7 3 2 og bordet ♠5 4 (Kompendiet s. 25). */
const eksempel2 = (tilspil: number, bord = [5, 4]): Tilspil => ({ kontrakt: '4H', udspiller: [E, K, 7, 3, 2], udspil: E, bord, tilspil });

describe('Romersk kald (accepttest 4): Kompendiets egne eksempler', () => {
  it('udspil ♠E fra ♠E K 9 3 2, bordet ♠B 4: ♠6 aflæses som kald til laveste farve', () => {
    // Vest kan ikke se ♠5 6 7 8 10 D. De lige er 6, 8, 10 og D; 6'eren er et af de to laveste, altså lille lige.
    expect(aflaesTilspil(eksempel1(6), kompendiet)).toEqual(signal('skift-lav'));
  });

  it('udspil ♠E fra ♠E K 7 3 2, bordet ♠5 4: ♠9 aflæses som kald til at fortsætte, og ♠B som ønske om skift', () => {
    // Vest kan ikke se ♠6 8 9 10 B D. De ulige er 9 og B: 9'eren er det laveste ulige kort (tilspiller lægger det
    // mindste ulige kort til kald), B er det højeste ulige og fra 9 og op, altså ønske om skift uden lige kort.
    expect(aflaesTilspil(eksempel2(9), kompendiet)).toEqual(signal('kald'));
    expect(aflaesTilspil(eksempel2(B), kompendiet)).toEqual(signal('skift'));
  });

  it('en høj lige er den 3. eller 4. laveste lige kort, Vest ikke kan se; et lavt ulige kort er kald', () => {
    expect(aflaesTilspil(eksempel1(8), kompendiet)).toEqual(signal('skift-lav'));
    expect(aflaesTilspil(eksempel1(10), kompendiet)).toEqual(signal('skift-hoej'));
    expect(aflaesTilspil(eksempel1(5), kompendiet)).toEqual(signal('kald'));
    expect(aflaesTilspil(eksempel1(7), kompendiet)).toEqual(signal('kald'));
  });

  it('med singleton på bordet er et lige kort tvetydigt, mens det laveste ulige stadig er kald', () => {
    expect(aflaesTilspil(eksempel2(6, [5]), kompendiet)).toEqual({ type: 'tvetydig' });
    expect(aflaesTilspil(eksempel2(9, [5]), kompendiet)).toEqual(signal('kald'));
  });

  it('mod sans er Kompendiets kald lavt = kald, og efter ALA-kongen viser tilspillet længden', () => {
    // E fra E K 7 4 (ALA: E K x x → E) beder om kald eller afvisning. Vest kan ikke se 6 9 10 B D: 6'eren er lav.
    const es = (tilspil: number): Tilspil => ({ kontrakt: '3NT', udspiller: [E, K, 7, 4], udspil: E, bord: [8, 5, 3], tilspil });
    expect(aflaesTilspil(es(6), kompendiet)).toEqual(signal('kald'));
    expect(aflaesTilspil(es(10), kompendiet)).toEqual(signal('afvisning'));
    // K fra E K 7 4 2 (ALA: E K x x x → K) beder om længden; lavt-højt = lige. 13 − 5 − 3 = 5 skjulte kort.
    // Lav 6'er: Øst har 2 eller 4, så spilfører har 3 eller 1. Høj 10'er: Øst har 1, 3 eller 5, så spilfører har 4, 2
    // eller 0 – tre muligheder kan ikke afgøres.
    const konge = (tilspil: number): Tilspil => ({ kontrakt: '3NT', udspiller: [E, K, 7, 4, 2], udspil: K, bord: [8, 5, 3], tilspil });
    expect(aflaesTilspil(konge(6), kompendiet)).toEqual({ type: 'laengder', laengder: [1, 3] });
    expect(aflaesTilspil(konge(10), kompendiet)).toEqual({ type: 'kan-ikke-afgoeres' });
  });

  it('vælg kortet med romersk kald: mindste ulige til kald, lille og høj lige til skift, og høj ulige som nødløsning', () => {
    // Mod 4♥ med ♠ udspillet er de to andre farver ♦ (højest) og ♣ (lavest): "skift til ♦" er skift høj.
    const v = (oest: number[], onske: 'kald' | 'skift-lav' | 'skift-hoej') => vaelgTilspil({ kontrakt: '4H', udspil: E, oest, onske }, kompendiet);
    expect(v([10, 8, 5, 2], 'skift-hoej')).toBe(10);
    expect(v([10, 8, 5, 2], 'skift-lav')).toBe(2);
    expect(v([10, 8, 5, 2], 'kald')).toBe(5);
    // Uden lige kort: "Har tilspiller kun ulige kort kan et højt ulige kort (en nier og op) signalere et ønske om et
    // farveskifte" (Kompendiet s. 25).
    expect(v([9, 7, 3], 'skift-lav')).toBe(9);
    expect(v([9, 7, 3], 'kald')).toBe(3);
  });
});

describe('Kald eller afvisning: metoden afgør facit', () => {
  it('samme tilspil er afvisning med højt = kald og kald med lavt = kald', () => {
    // Eksempel 1 med ♠6 (et af de to laveste kort, Vest ikke kan se) og ♠8 (det fjerde laveste).
    expect(aflaesTilspil(eksempel1(6), standard)).toEqual(signal('afvisning'));
    expect(aflaesTilspil(eksempel1(6), omvendt)).toEqual(signal('kald'));
    expect(aflaesTilspil(eksempel1(8), standard)).toEqual(signal('kald'));
    expect(aflaesTilspil(eksempel1(8), omvendt)).toEqual(signal('afvisning'));
  });

  it('vælg kortet: højt kort er det højeste under B, lavt kort det laveste', () => {
    const v = (p: typeof standard, onske: 'kald' | 'afvisning') => vaelgTilspil({ kontrakt: '4H', udspil: E, oest: [9, 6, 2], onske }, p);
    expect(v(standard, 'kald')).toBe(9);
    expect(v(standard, 'afvisning')).toBe(2);
    expect(v(omvendt, 'kald')).toBe(2);
    expect(v(omvendt, 'afvisning')).toBe(9);
  });
});

describe('O/E (accepttest 5): første gang der ikke kan bekendes', () => {
  // Kompendiet s. 24: et ulige kort kalder til farven; et lille lige kort viser styrke i den laveste af de to andre
  // farver; et stort lige kalder til den højeste. Lille og stor følger samme relative regel som romersk kald (Franks
  // svar 17. nov. 2026; ingen fast grænse mellem 6 og 7): en lille lige er et af de to laveste lige kort i afkastfarven,
  // som den, der læser afkastet, ikke kan se (afkastet er med); ellers er den stor, også når den er 5. laveste. Med færre
  // end tre usete lige kort er et lige kort altid lille. `synlige` er læserens og bordets kort i afkastfarven.
  const afkast = (vaerdi: number, synlige: number[], kontrakt: Kontrakt = '4H'): Afkast => ({ kontrakt, kort: vaerdi, synlige });
  /** Læseren har ♦K 9 5 3 og bordet ♦D 7 4: de usete lige kort er 2, 6, 8 og 10. */
  const fire = [K, 9, 5, 3, D, 7, 4];
  /** Læseren har ♦6 5 2 og bordet ♦4 3: de usete lige kort er 8, 10 og D, og de usete kort begynder 7, 8, 9. */
  const hoeje = [6, 5, 2, 4, 3];
  /** Læseren har ♦E K 9 og bordet ♦B 7 5: alle seks lige kort er usete, og de usete kort begynder 2, 3, 4, 6. */
  const lave = [E, K, 9, B, 7, 5];
  /** Læseren har ♦6 4 og bordet ♦D 3: de usete lige kort er 2, 8 og 10. */
  const tre = [6, 4, D, 3];

  it('et ulige kort kalder til farven', () => {
    expect(aflaesAfkast(afkast(7, hoeje), kompendiet)).toEqual(signal('kald'));
    expect(aflaesAfkast(afkast(9, hoeje), kompendiet)).toEqual(signal('kald'));
    expect(aflaesAfkast(afkast(3, lave, '3NT'), kompendiet)).toEqual(signal('kald'));
  });

  it('med fire usete lige kort er de to laveste små (laveste af de to andre farver) og det 3. og 4. store (højeste)', () => {
    expect(aflaesAfkast(afkast(2, fire), kompendiet)).toEqual(signal('skift-lav'));
    expect(aflaesAfkast(afkast(6, fire), kompendiet)).toEqual(signal('skift-lav'));
    expect(aflaesAfkast(afkast(8, fire), kompendiet)).toEqual(signal('skift-hoej'));
    expect(aflaesAfkast(afkast(10, fire, '3NT'), kompendiet)).toEqual(signal('skift-hoej'));
  });

  it('grænsen følger de usete kort: ♦8 og ♦10 kan være små, og ♦6 kan være stor', () => {
    // De usete lige kort er 8, 10 og D: 8 og 10 er de to laveste.
    expect(aflaesAfkast(afkast(8, hoeje), kompendiet)).toEqual(signal('skift-lav'));
    expect(aflaesAfkast(afkast(10, hoeje, '3NT'), kompendiet)).toEqual(signal('skift-lav'));
    // De usete lige kort er 2, 4, 6, 8, 10 og D: 6 er det 3. laveste, og 10 er det 5. laveste (stor som i romersk kald).
    expect(aflaesAfkast(afkast(4, lave), kompendiet)).toEqual(signal('skift-lav'));
    expect(aflaesAfkast(afkast(6, lave), kompendiet)).toEqual(signal('skift-hoej'));
    expect(aflaesAfkast(afkast(10, lave), kompendiet)).toEqual(signal('skift-hoej'));
  });

  it('med tre usete lige kort er det højeste stort; med to er begge små', () => {
    expect(aflaesAfkast(afkast(8, tre), kompendiet)).toEqual(signal('skift-lav'));
    expect(aflaesAfkast(afkast(10, tre), kompendiet)).toEqual(signal('skift-hoej'));
    // Læseren har ♦8 6 4 og bordet ♦D 3: de usete lige kort er kun 2 og 10.
    expect(aflaesAfkast(afkast(10, [8, 6, 4, D, 3]), kompendiet)).toEqual(signal('skift-lav'));
  });

  it('samme aflæsning af et lige kort som romersk kald med de samme usete kort', () => {
    // Eksempel 1 og 2 fra romersk kald: Vests kort og bordets kort er det, læseren af afkastet kan se.
    for (const [t, lige] of [
      [eksempel1, [6, 8, 10]],
      [eksempel2, [6, 8, 10]],
    ] as const) {
      for (const v of lige) {
        const s = t(v);
        expect(aflaesAfkast(afkast(v, [...s.udspiller, ...s.bord]), kompendiet), `${v}`).toEqual(aflaesTilspil(s, kompendiet));
      }
    }
  });

  it('vælg afkastet: kortene under B, makker læser som et kald til den ønskede farve, uanset hvor de usete kort sidder', () => {
    // Mod 4♥ trækker spilfører trumf. Hånden har ♠D 7 4, ♦10 8 6 3 og ♣6 5 2 (ingen ♥), og bordet har ♠E 6 2, ♦K 9 5 4
    // og ♣8 3 (og ♥E K 7 3). Makker kan se sine egne kort og bordets; brugerens kort og spilførers kan han ikke se.
    const haand = [kort(0, D), kort(0, 7), kort(0, 4), kort(2, 10), kort(2, 8), kort(2, 6), kort(2, 3), kort(3, 6), kort(3, 5), kort(3, 2)];
    const bord = [kort(0, E), kort(0, 6), kort(0, 2), kort(1, E), kort(1, K), kort(1, 7), kort(1, 3), kort(2, K), kort(2, 9), kort(2, 5), kort(2, 4), kort(3, 8), kort(3, 3)];
    const v = (onske: number, p = kompendiet) => vaelgAfkast({ kontrakt: '4H', spilfoerersFarve: 1, haand, synlige: bord, onske }, p);
    const sorteret = (xs: number[]) => [...xs].sort((a, b) => a - b);
    // ♦6 er altid lille: kun ♦2 kan ligge under den hos spilfører. ♦10 er altid stor: brugeren har selv ♦8 og ♦6 under
    // den. ♦8 og ♣6 kommer ikke med: de er små, når makker har ♦2 eller ♣4, og ellers store.
    // ♠: ♠7 (ulige i ♠), og fra ♦ en stor lige (de andre farver er ♠ og ♣, og ♠ er den højeste): ♦10.
    expect(v(0)).toEqual(sorteret([kort(0, 7), kort(2, 10)]));
    // ♦: ♦3, og fra ♣ en lille lige (de andre farver er ♠ og ♦, og ♦ er den laveste): ♣2.
    expect(v(2)).toEqual(sorteret([kort(2, 3), kort(3, 2)]));
    // ♣: ♣5, fra ♠ en lille lige (de andre er ♦ og ♣, og ♣ er den laveste): ♠4, og fra ♦ en lille lige: ♦6.
    expect(v(3)).toEqual(sorteret([kort(0, 4), kort(2, 6), kort(3, 5)]));
    // Som kald eller afvisning: med højt = kald er et kort altid højt, når brugeren selv har to lavere kort i farven, og
    // med lavt = kald altid lavt, når højst ét lavere kort kan være uset for makker.
    expect(v(0, standard)).toEqual([]);
    expect(v(2, standard)).toEqual(sorteret([kort(2, 8), kort(2, 10)]));
    expect(v(3, standard)).toEqual([kort(3, 6)]);
    expect(v(0, omvendt)).toEqual([kort(0, 4)]);
    expect(v(2, omvendt)).toEqual([kort(2, 3)]);
    expect(v(3, omvendt)).toEqual([kort(3, 2)]);
  });

  it('de andre metoder til første afkast: Lavinthal og som kald eller afvisning, med lavt = et af de to laveste usete kort', () => {
    const lavinthal = medMetode(kompendiet, 'afkast', 'lavinthal');
    // Usete kort 7, 8, 9 …: 8 er lavt og 9 højt. Usete kort 2, 3, 4, 6 …: 3 er lavt og 4 højt.
    expect(aflaesAfkast(afkast(8, hoeje), lavinthal)).toEqual(signal('skift-lav'));
    expect(aflaesAfkast(afkast(9, hoeje), lavinthal)).toEqual(signal('skift-hoej'));
    expect(aflaesAfkast(afkast(3, lave), lavinthal)).toEqual(signal('skift-lav'));
    expect(aflaesAfkast(afkast(4, lave), lavinthal)).toEqual(signal('skift-hoej'));
    expect(aflaesAfkast(afkast(4, lave, '3NT'), standard)).toEqual(signal('kald'));
    expect(aflaesAfkast(afkast(3, lave, '3NT'), standard)).toEqual(signal('afvisning'));
    expect(aflaesAfkast(afkast(7, hoeje, '3NT'), standard)).toEqual(signal('afvisning'));
    expect(aflaesAfkast(afkast(9, hoeje, '3NT'), standard)).toEqual(signal('kald'));
    expect(aflaesAfkast(afkast(3, lave, '3NT'), omvendt)).toEqual(signal('kald'));
    expect(aflaesAfkast(afkast(4, lave, '3NT'), omvendt)).toEqual(signal('afvisning'));
    // Romersk kald med første afkast som kald eller afvisning: mod farve O/E, mod sans lavt = kald.
    const egen = medMetode(kompendiet, 'afkast', 'som-kald-afvisning');
    expect(aflaesAfkast(afkast(8, hoeje), egen)).toEqual(signal('skift-lav'));
    expect(aflaesAfkast(afkast(8, hoeje, '3NT'), egen)).toEqual(signal('kald'));
    expect(aflaesAfkast(afkast(9, hoeje, '3NT'), egen)).toEqual(signal('afvisning'));
  });
});

describe('Omvendt forsinket kald (accepttest 5): rækkefølgen i spilførers første farve', () => {
  // Kompendiet s. 26: lav-høj betyder "fortsæt i farven, intet vigtigere at fortælle" (passivt), høj-lav betyder
  // "skift farve, spil aktivt"; det gælder både udspiller og tilspiller.
  const forsinket = (v: 'passiv' | 'aktiv') => ({ type: 'forsinket', vaerdi: v });

  it('lav-høj er passivt', () => {
    expect(aflaesForsinket(3, 8, kompendiet)).toEqual(forsinket('passiv'));
    expect(aflaesForsinket(2, 9, kompendiet)).toEqual(forsinket('passiv'));
  });

  it('høj-lav er aktivt', () => {
    expect(aflaesForsinket(8, 3, kompendiet)).toEqual(forsinket('aktiv'));
    expect(aflaesForsinket(10, 4, kompendiet)).toEqual(forsinket('aktiv'));
  });

  it('vælg rækkefølgen: først det laveste kort for passivt og det højeste under B for aktivt', () => {
    expect(vaelgForsinket([2, 4, 9], 'passiv', kompendiet)).toBe(2);
    expect(vaelgForsinket([2, 4, 9], 'aktiv', kompendiet)).toBe(9);
    expect(vaelgForsinket([K, 6, 3], 'aktiv', kompendiet)).toBe(6);
    expect(vaelgForsinket([K, 6, 3], 'passiv', kompendiet)).toBe(3);
  });

  it('uden omvendt forsinket kald findes aflæsningen ikke', () => {
    expect(() => aflaesForsinket(3, 8, standard)).toThrow();
    expect(() => vaelgForsinket([2, 9], 'aktiv', omvendt)).toThrow();
  });
});
