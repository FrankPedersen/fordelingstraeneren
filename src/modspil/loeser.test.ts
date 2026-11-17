import { describe, expect, it } from 'vitest';
import { regel11og12, udspilLaengde, type Udspilssituation } from './model/loeser';
import { profil } from './model/metoder';

/*
 * Accepttest 3 i SPEC-modspil.md (regel 11 og 12) og løseren til øvelse 3 (udspillets længde). Rød, indtil byggeriet
 * har leveret:
 *
 * src/modspil/model/loeser.ts
 *   export type Signal = 'kald' | 'afvisning' | 'skift-lav' | 'skift-hoej' | 'skift';
 *   export type Facit =
 *     | { type: 'interval'; min: number; max: number }       // øvelse 1: makkers hp
 *     | { type: 'tal'; tal: number }                         // øvelse 2: Syds kort over udspillet
 *     | { type: 'laengder'; laengder: number[] }             // øvelse 3 og 4: mulige længder, stigende
 *     | { type: 'signal'; signal: Signal }                   // øvelse 4 og 6: aflæsningen
 *     | { type: 'kort'; kort: Card[]; tvetydig?: true }      // øvelse 2 (hvilke), 5, 6 og 7: kortene, stigende; tvetydig
 *                                                            // kun i Vælg afkastet uden entydigt kort (Franks svar 1, 17. nov.)
 *     | { type: 'forsinket'; vaerdi: 'passiv' | 'aktiv' }    // øvelse 7: aflæsningen
 *     | { type: 'kan-ikke-afgoeres' }
 *     | { type: 'tvetydig' };
 *   // Facit har præcis disse felter (testene sammenligner med toEqual).
 *   export interface Udspilssituation {
 *     kontrakt: Kontrakt;              // '3NT' | '4H' | '4S'
 *     udspil: number;                  // udspillets valør, 2–14
 *     oest: readonly number[];         // Østs valører i farven
 *     bord: readonly number[];         // bordets valører i farven
 *   }
 *   export function regel11og12(s: Udspilssituation, profil: Profil): Facit;   // { type: 'tal' } eller kan ikke afgøres
 *   export function udspilLaengde(s: Udspilssituation, profil: Profil): Facit; // { type: 'laengder' } eller kan ikke afgøres
 *
 * Løseren gennemgår alle fordelinger af de skjulte kort i farven (Vest og Syd) og beholder dem, hvor udspillet er
 * metodens lave kort fra Vests kort, Vest har mindst metodens mindste længde (4 for 4.-højeste, ellers 3), og
 * honnørreglen ikke giver et andet kort (table feeling tæller med). Regel 11 og 12: Syds antal kort over udspillet,
 * hvis det er det samme i alle; ellers "kan ikke afgøres". Længden: Vests mulige længder; flere end to giver "kan ikke
 * afgøres". Eksemplerne herunder er regnet efter de regler og kontrolleret med bruteforce.ts.
 */

const [B, D, K, E] = [11, 12, 13, 14];
const standard = profil('standard');
const omvendt = profil('omvendt');
const kompendiet = profil('kompendiet');

const s = (kontrakt: Udspilssituation['kontrakt'], udspil: number, bord: number[], oest: number[]): Udspilssituation => ({ kontrakt, udspil, bord, oest });
const tal = (n: number) => ({ type: 'tal', tal: n });
const KAN_IKKE = { type: 'kan-ikke-afgoeres' };

describe('Regel 11 (accepttest 3): 11 − udspillet − højere kort på bordet − højere kort hos Øst', () => {
  it('specens eksempel: 11 − 7 = 4 over syveren; bordet har to og Øst ét, så spilfører har ét', () => {
    // Bordet D 9 3 (D og 9 over 7), Øst K 5 2 (K over 7): 11 − 7 − 2 − 1 = 1.
    // Skjult over 7: 8, 10, B, E; Vest har præcis tre af dem, så Syd har ét i alle fordelinger.
    expect(regel11og12(s('3NT', 7, [D, 9, 3], [K, 5, 2]), standard)).toEqual(tal(1));
  });

  it('udspil 5 mod sans: 11 − 5 − 2 − 3 = 1', () => {
    // Bordet E 8 2 (E, 8), Øst D 10 6 3 (D, 10, 6). Skjult over 5: 7, 9, B, K; Vest har tre, Syd ét.
    expect(regel11og12(s('3NT', 5, [E, 8, 2], [D, 10, 6, 3]), standard)).toEqual(tal(1));
  });

  it('udspil 6 mod farve: 11 − 6 − 2 − 2 = 1', () => {
    // Bordet B 7 4 (B, 7), Øst E 9 2 (E, 9). Skjult over 6: 8, 10, D, K. Vest kan ikke have K D øverst (så spilles K
    // ud mod farve), men har altid tre af de fire, så Syd har ét.
    expect(regel11og12(s('4S', 6, [B, 7, 4], [E, 9, 2]), standard)).toEqual(tal(1));
  });

  it('udspil 4 mod farve: 11 − 4 − 2 − 4 = 1', () => {
    // Bordet D 7 3 (D, 7), Øst K B 9 5 (K, B, 9, 5). Skjult over 4: 6, 8, 10, E; Vest har tre, Syd ét.
    expect(regel11og12(s('4H', 4, [D, 7, 3], [K, B, 9, 5]), standard)).toEqual(tal(1));
  });

  it('udspil 3 mod sans: 11 − 3 − 2 − 3 = 3', () => {
    // Bordet 10 6 2 (10, 6), Øst E 8 5 (E, 8, 5). Skjult over 3: 4, 7, 9, B, D, K; Vest har tre, Syd tre.
    expect(regel11og12(s('3NT', 3, [10, 6, 2], [E, 8, 5]), standard)).toEqual(tal(3));
  });

  it('bordet og Øst holder alle de højere kort, Vest ikke har: 11 − 6 − 3 − 2 = 0', () => {
    // Bordet K 10 7 (K, 10, 7), Øst D 9 3 (D, 9). Skjult over 6: 8, B, E – præcis Vests tre, så Syd har ingen.
    expect(regel11og12(s('3NT', 6, [K, 10, 7], [D, 9, 3]), standard)).toEqual(tal(0));
  });

  it('Kompendiet mod sans: fra fire små spilles det næsthøjeste, så regnestykket kan give et forkert tal', () => {
    // Udspil 6, bordet K 10 3, Øst E 9 2. Skjult: 4, 5, 7, 8, B, D. 4.-højeste fra honnør (fx D 8 7 6) giver Syd ét kort
    // over 6, men tredje laveste fra småkort (8 6 5 4) giver Syd tre (7, B, D): kan ikke afgøres.
    expect(regel11og12(s('3NT', 6, [K, 10, 3], [E, 9, 2]), kompendiet)).toEqual(KAN_IKKE);
    // Udspil 6, bordet E K 10, Øst D B 9: kun 7 og 8 er skjult over 6, så det kan ikke være 4.-højeste. Fra småkort
    // kan Vest have 6 x x, 7 6 x x eller 8 7 6 x x, så Syd har 0, 1 eller 2: kan ikke afgøres.
    expect(regel11og12(s('3NT', 6, [E, K, 10], [D, B, 9]), kompendiet)).toEqual(KAN_IKKE);
  });
});

describe('Regel 12 (accepttest 3): 12 − udspillet − højere kort på bordet − højere kort hos Øst, når udspillet er 3.-højeste', () => {
  // 3. og 5. højeste (Omvendt mod farve): Vest har to kort over udspillet (tre eller fire kort) eller fire (fem eller
  // flere). Svaret er entydigt, når Vest ikke kan have fire højere kort, fordi der ikke er fire skjulte over
  // udspillet, eller fordi de fire ville begynde med en honnørsekvens (så spilles honnøren ud mod farve).

  it('udspil 7: 12 − 7 − 2 − 2 = 1', () => {
    // Bordet K 8 2 (K, 8), Øst E 10 4 (E, 10). Skjult over 7: 9, B, D (kun tre). Vest har to: D 9 eller B 9 (D B øverst
    // giver D ud), så Syd har ét.
    expect(regel11og12(s('4S', 7, [K, 8, 2], [E, 10, 4]), omvendt)).toEqual(tal(1));
  });

  it('bordet og Øst holder alle de højere kort, Vest ikke har: 12 − 8 − 2 − 2 = 0', () => {
    // Bordet E B 5 (E, B), Øst D 9 3 (D, 9). Skjult over 8: K og 10 – Vests to (K 10 8), Syd har ingen.
    expect(regel11og12(s('4S', 8, [E, B, 5], [D, 9, 3]), omvendt)).toEqual(tal(0));
  });

  it('udspil 5: 12 − 5 − 3 − 2 = 2', () => {
    // Bordet E 9 6 (E, 9, 6), Øst B 7 2 (B, 7). Skjult over 5: 8, 10, D, K. Fire højere hos Vest ville være K D 10 8
    // (K D øverst, så K ud), så Vest har to og Syd to.
    expect(regel11og12(s('4S', 5, [E, 9, 6], [B, 7, 2]), omvendt)).toEqual(tal(2));
  });

  it('udspil 6: 12 − 6 − 2 − 3 = 1', () => {
    // Bordet D 8 2 (D, 8), Øst K 9 7 4 (K, 9, 7). Skjult over 6: 10, B, E (kun tre). B 10 øverst giver B ud, så Vest har
    // E B eller E 10, og Syd har ét.
    expect(regel11og12(s('4S', 6, [D, 8, 2], [K, 9, 7, 4]), omvendt)).toEqual(tal(1));
  });

  it('udspil 4: 12 − 4 − 4 − 3 = 1', () => {
    // Bordet B 9 6 5 (B, 9, 6, 5), Øst E K 8 2 (E, K, 8). Skjult over 4: 7, 10, D (kun tre). Vest har to, Syd ét.
    expect(regel11og12(s('4S', 4, [B, 9, 6, 5], [E, K, 8, 2]), omvendt)).toEqual(tal(1));
  });

  it('ellers kan det ikke afgøres: 3.-højeste og 5.-højeste giver forskellige tal', () => {
    // Bordet D 9 6, Øst E 7 2, udspil 5. Skjult over 5: 8, 10, B, K. Som 3.-højeste (fx K B 5) har Syd to; som
    // 5.-højeste fra K B 10 8 5 har Syd ingen.
    expect(regel11og12(s('4S', 5, [D, 9, 6], [E, 7, 2]), omvendt)).toEqual(KAN_IKKE);
  });
});

describe('Udspillets længde (øvelse 3)', () => {
  it('mod sans med 4.-højeste: 4 eller 5, når ét lavere kort er skjult', () => {
    // Udspil 3, bordet K 9 4, Øst D 8 5. Vest har tre over 3 og måske 2'eren: 4 eller 5 kort.
    expect(udspilLaengde(s('3NT', 3, [K, 9, 4], [D, 8, 5]), standard)).toEqual({ type: 'laengder', laengder: [4, 5] });
  });

  it('mod farve med 3. og 5. højeste: 3 eller 5, når intet lavere kort er skjult', () => {
    // Udspil 2, bordet K 7 5, Øst E 10 6 3. Skjult: 4, 8, 9, B, D. 2'eren er 3.-højeste fra tre kort eller 5.-højeste
    // fra fem; fra fire kort ville 2'eren være 4.-højeste.
    expect(udspilLaengde(s('4S', 2, [K, 7, 5], [E, 10, 6, 3]), omvendt)).toEqual({ type: 'laengder', laengder: [3, 5] });
  });

  it('flere end to mulige længder kan ikke afgøres', () => {
    // Udspil 4, bordet K 9 5, Øst D 8 6: 2 og 3 er skjult under 4, så Vest kan have 4, 5 eller 6 kort.
    expect(udspilLaengde(s('3NT', 4, [K, 9, 5], [D, 8, 6]), standard)).toEqual(KAN_IKKE);
  });
});
