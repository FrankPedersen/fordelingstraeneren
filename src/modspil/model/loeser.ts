import type { Card } from '../../domain/cards';
import type { Profil } from './metoder';
import { faldende, kontraktart, lavtUdspilPasser, type Kontrakt } from './udspil';

/**
 * Løseren til Modspil (SPEC-modspil.md, "Løser, generator og facit" punkt 4): den gennemgår de skjulte kort i den
 * aktuelle farve (spilførers og den skjulte modspillers) og beholder kun de fordelinger, der passer med udspilsreglen,
 * de spillede kort og hp-intervallerne, hvor øvelsen bruger dem. Ud fra fordelingerne, der er tilbage, giver den facit:
 * et tal, en liste af længder eller "kan ikke afgøres".
 */

export type Signal = 'kald' | 'afvisning' | 'skift-lav' | 'skift-hoej' | 'skift';

export type Facit =
  | { type: 'interval'; min: number; max: number }
  | { type: 'tal'; tal: number }
  | { type: 'laengder'; laengder: number[] }
  | { type: 'signal'; signal: Signal }
  /** `tvetydig` kun i Vælg afkastet, når intet kort er entydigt (Franks svar 1, 17. nov. 2026). */
  | { type: 'kort'; kort: Card[]; tvetydig?: true }
  | { type: 'forsinket'; vaerdi: 'passiv' | 'aktiv' }
  | { type: 'kan-ikke-afgoeres' }
  | { type: 'tvetydig' };

export const kanIkkeAfgoeres = (): Facit => ({ type: 'kan-ikke-afgoeres' });
export const tvetydig = (): Facit => ({ type: 'tvetydig' });

/** "Kan ikke afgøres" og "tvetydig" er de uklare svar (specens punkt 6), også Vælg afkastet uden et entydigt kort. */
export const erUklar = (f: Facit): boolean => f.type === 'kan-ikke-afgoeres' || f.type === 'tvetydig' || (f.type === 'kort' && f.tvetydig === true);

/** Det, Øst ser i udspilsfarven: valørerne 2–14. */
export interface Udspilssituation {
  kontrakt: Kontrakt;
  udspil: number;
  oest: readonly number[];
  bord: readonly number[];
}

/** Et krav til Vests og Syds hp i farven, fx fra meldingerne (fra niveau 4). */
export type HpKrav = (vestHp: number, sydHp: number) => boolean;

/** En mulig fordeling af farven: Vests kort (med udspillet) og Syds kort, sorteret faldende. */
export interface Fordeling {
  vest: readonly number[];
  syd: readonly number[];
}

const hpIFarven = (vaerdier: readonly number[]): number => vaerdier.reduce((s, v) => s + Math.max(0, v - 10), 0);

/** Valørerne i farven, ingen kan se: dem, der hverken er udspillet, på bordet eller hos Øst, faldende. */
export function skjulteKort(s: Udspilssituation): number[] {
  const synlige = new Set<number>([s.udspil, ...s.oest, ...s.bord]);
  const ud: number[] = [];
  for (let v = 14; v >= 2; v--) if (!synlige.has(v)) ud.push(v);
  return ud;
}

/**
 * Alle fordelinger af de skjulte kort på Vest og Syd, der passer med udspillet: hvert skjult kort går til den ene eller
 * den anden, og fordelingen beholdes, når udspillet er metodens lave kort fra Vests kort (og hp-kravet holder).
 */
export function fordelinger(s: Udspilssituation, profil: Profil, krav?: HpKrav): Fordeling[] {
  const art = kontraktart(s.kontrakt);
  const skjulte = skjulteKort(s);
  const vest: number[] = [];
  const syd: number[] = [];
  const ud: Fordeling[] = [];
  const fordel = (i: number): void => {
    if (i < skjulte.length) {
      vest.push(skjulte[i]);
      fordel(i + 1);
      vest.pop();
      syd.push(skjulte[i]);
      fordel(i + 1);
      syd.pop();
      return;
    }
    const vestsKort = faldende([...vest, s.udspil]);
    if (!lavtUdspilPasser(vestsKort, s.udspil, art, profil)) return;
    if (krav && !krav(hpIFarven(vestsKort), hpIFarven(syd))) return;
    ud.push({ vest: vestsKort, syd: [...syd] });
  };
  fordel(0);
  if (!ud.length) throw new Error('Ingen fordeling passer med udspillet');
  return ud;
}

/** Regel 11 og 12 i detaljer: antallet af kort over udspillet hos hver hånd i de fordelinger, der passer. */
export interface Regel11Analyse {
  facit: Facit;
  /** Syds kort over udspillet (valører, stigende), når de er de samme i alle fordelinger; ellers null. */
  hvilke: number[] | null;
  /** De mulige antal kort over udspillet hos Vest og hos Syd, stigende. */
  vestOver: number[];
  sydOver: number[];
  bordOver: number;
  oestOver: number;
}

const stigendeUnikke = (xs: Iterable<number>): number[] => [...new Set(xs)].sort((a, b) => a - b);

export function analyserRegel11(s: Udspilssituation, profil: Profil, krav?: HpKrav): Regel11Analyse {
  const over = (xs: readonly number[]) => xs.filter((v) => v > s.udspil);
  const alle = fordelinger(s, profil, krav);
  const sydOver = stigendeUnikke(alle.map((f) => over(f.syd).length));
  const saet = new Set(alle.map((f) => [...over(f.syd)].sort((a, b) => a - b).join(' ')));
  return {
    facit: sydOver.length === 1 ? { type: 'tal', tal: sydOver[0] } : kanIkkeAfgoeres(),
    hvilke: saet.size === 1 ? [...over(alle[0].syd)].sort((a, b) => a - b) : null,
    vestOver: stigendeUnikke(alle.map((f) => over(f.vest).length)),
    sydOver,
    bordOver: over(s.bord).length,
    oestOver: over(s.oest).length,
  };
}

/** Regel 11 og 12: Syds antal kort over udspillet, eller "kan ikke afgøres". */
export function regel11og12(s: Udspilssituation, profil: Profil, krav?: HpKrav): Facit {
  return analyserRegel11(s, profil, krav).facit;
}

/** Vests mulige længder i farven, stigende. */
export function muligeLaengder(s: Udspilssituation, profil: Profil, krav?: HpKrav): number[] {
  return stigendeUnikke(fordelinger(s, profil, krav).map((f) => f.vest.length));
}

/** Udspillets længde: Vests mulige længder, eller "kan ikke afgøres" ved flere end to. */
export function udspilLaengde(s: Udspilssituation, profil: Profil, krav?: HpKrav): Facit {
  const laengder = muligeLaengder(s, profil, krav);
  return laengder.length <= 2 ? { type: 'laengder', laengder } : kanIkkeAfgoeres();
}
