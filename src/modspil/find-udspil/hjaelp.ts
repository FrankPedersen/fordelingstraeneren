import type { Card } from '../../domain/cards';
import type { Datasaet, SituationId, UdspilDataOpgave } from '../model/findUdspil';
import type { Niveau } from '../model/generator';
import { profil, type Profil } from '../model/metoder';
import { appSti, fraPbn, laes, situationsfil, type AppData, type Situation } from '../udspil/hjaelp';

/*
 * Fælles kode til accepttestene for Modspil v2, trin 2 (SPEC-modspil-v2.md, Accepttest for trin 2). Kun til testene.
 * Datasættet læses fra filerne med trin 1's hjælper, så testene ikke afhænger af modellens dovne indlæsning (den
 * tjekkes for sig i genskabelse.test.ts).
 */

export const SITUATIONER: readonly SituationId[] = [
  'S1-1nt-3nt',
  'S2-stayman',
  'S3-transfer',
  'S4-kun-en-farve',
  'S5-sidefarve',
  'S6-trumf',
  'S7-makker-aabnet',
  'S8-delkontrakt',
];

/** Niveau 1 har kun de tre situationer (specens niveautabel). */
export const NIVEAU1: readonly SituationId[] = ['S1-1nt-3nt', 'S4-kun-en-farve', 'S7-makker-aabnet'];

export const NIVEAUER: readonly Niveau[] = [1, 2, 3, 4, 5];

export const PROFILER: readonly (readonly [string, Profil])[] = [
  ['standard', profil('standard')],
  ['omvendt', profil('omvendt')],
  ['kompendiet', profil('kompendiet')],
];

/** Datasættet fra filerne i `src/modspil/content/udspil/`. */
export function datasaet(): Datasaet {
  return Object.fromEntries(SITUATIONER.map((id) => [id, laes<AppData>(appSti(id))])) as unknown as Datasaet;
}

/** Situationen i situationsfilen. */
export function situation(id: SituationId): Situation {
  const s = situationsfil().situationer.find((x) => x.id === id);
  if (!s) throw new Error(`${id} findes ikke i situationsfilen`);
  return s;
}

export const SYMBOL = ['♠', '♥', '♦', '♣'] as const;
const RANKS = '23456789TJQKA';

/** Et kort skrevet som farvebogstav og PBN-valør, fx "SK" (♠K) eller "HT" (♥10). */
export function k(navn: string): Card {
  const farve = 'SHDC'.indexOf(navn[0]);
  const valoer = RANKS.indexOf(navn[1]);
  if (farve < 0 || valoer < 0 || navn.length !== 2) throw new Error(`Ukendt kort: ${navn}`);
  return farve * 13 + valoer;
}

const navnAf = (c: Card) => 'SHDC'[Math.floor(c / 13)] + RANKS[c % 13];

/**
 * En opgave med fast hånd (PBN, ♠.♥.♦.♣) og middelstik og sætninger pr. kort; kort, der ikke nævnes, får 1 stik og 0
 * sætninger.
 */
export function fastOpgave(pbn: string, middel: Record<string, number>, saet: Record<string, number> = {}): UdspilDataOpgave {
  const vest = fraPbn(pbn);
  return { seed: 0, vest, middel: vest.map((c) => middel[navnAf(c)] ?? 1), saet: vest.map((c) => saet[navnAf(c)] ?? 0) };
}

/** Alle opgaver i datasættet som par af reference og data. */
export function alleOpgaver(data: Datasaet): { situation: SituationId; indeks: number; opgave: UdspilDataOpgave }[] {
  return SITUATIONER.flatMap((id) => data[id].opgaver.map((opgave, indeks) => ({ situation: id, indeks, opgave })));
}
