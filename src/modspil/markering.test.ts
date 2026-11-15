import { describe, expect, it } from 'vitest';
import type { Card } from '../domain/cards';
import { medMetode, profil } from './model/metoder';
import { aflaesAfkast, aflaesForsinket, aflaesTilspil, vaelgAfkast, vaelgForsinket, vaelgTilspil, type Tilspil } from './model/markering';

/*
 * Accepttest 4 (romersk kald, Kompendiets egne eksempler) og 5 (O/E og omvendt forsinket kald) i SPEC-modspil.md, og
 * aftalerne bag øvelse 4–7. Rød, indtil byggeriet har leveret:
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
 *   export function aflaesAfkast(kort: number, kontrakt: Kontrakt, profil: Profil): Facit;            // { type: 'signal' }
 *   export function vaelgAfkast(v: { kontrakt: Kontrakt; spilfoerersFarve: number; haand: readonly Card[]; onske: number }, profil: Profil): Card[];
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
  // farver; et stort lige kalder til den højeste. Lille er 6 og lavere, stort 8 og højere.
  it('et ulige kort kalder til farven', () => {
    expect(aflaesAfkast(7, '4H', kompendiet)).toEqual(signal('kald'));
    expect(aflaesAfkast(9, '4H', kompendiet)).toEqual(signal('kald'));
  });

  it('en lille lige viser den laveste af de to andre farver', () => {
    expect(aflaesAfkast(4, '4H', kompendiet)).toEqual(signal('skift-lav'));
    expect(aflaesAfkast(2, '3NT', kompendiet)).toEqual(signal('skift-lav'));
  });

  it('en stor lige kalder til den højeste af de to andre farver', () => {
    expect(aflaesAfkast(10, '4H', kompendiet)).toEqual(signal('skift-hoej'));
    expect(aflaesAfkast(8, '3NT', kompendiet)).toEqual(signal('skift-hoej'));
  });

  it('vælg afkastet: alle kort under B, makker læser som et kald til den ønskede farve', () => {
    // Mod 4♥ trækker spilfører trumf, og hånden har ♠D 7 4, ♦10 8 3, ♣6 5 2 (ingen ♥).
    const haand = [kort(0, D), kort(0, 7), kort(0, 4), kort(2, 10), kort(2, 8), kort(2, 3), kort(3, 6), kort(3, 5), kort(3, 2)];
    const v = (onske: number) => vaelgAfkast({ kontrakt: '4H', spilfoerersFarve: 1, haand, onske }, kompendiet);
    // ♦: ♦3 (ulige i ♦), og fra ♣ en lille lige (de andre farver er ♠ og ♦, og ♦ er den laveste): ♣2 og ♣6.
    expect(v(2)).toEqual([kort(2, 3), kort(3, 2), kort(3, 6)].sort((a, b) => a - b));
    // ♠: ♠7 (ulige i ♠), og fra ♦ en stor lige (de andre farver er ♠ og ♣, og ♠ er den højeste): ♦8 og ♦10.
    expect(v(0)).toEqual([kort(0, 7), kort(2, 8), kort(2, 10)].sort((a, b) => a - b));
    // ♣: ♣5, og fra ♠ en lille lige (de andre er ♦ og ♣, og ♣ er den laveste): ♠4.
    expect(v(3)).toEqual([kort(0, 4), kort(3, 5)].sort((a, b) => a - b));
  });

  it('de andre metoder til første afkast: Lavinthal og som kald eller afvisning', () => {
    const lavinthal = medMetode(kompendiet, 'afkast', 'lavinthal');
    expect(aflaesAfkast(3, '4H', lavinthal)).toEqual(signal('skift-lav'));
    expect(aflaesAfkast(9, '4H', lavinthal)).toEqual(signal('skift-hoej'));
    expect(aflaesAfkast(8, '3NT', standard)).toEqual(signal('kald'));
    expect(aflaesAfkast(3, '3NT', standard)).toEqual(signal('afvisning'));
    expect(aflaesAfkast(3, '3NT', omvendt)).toEqual(signal('kald'));
    expect(aflaesAfkast(8, '3NT', omvendt)).toEqual(signal('afvisning'));
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
