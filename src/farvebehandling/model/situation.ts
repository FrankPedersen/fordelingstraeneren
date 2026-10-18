import { binomial } from '../../domain/combinatorics';
import type { Game } from '../solver/game';
import { missingCards, type Rank } from './cards';
import type { Vacant } from './layouts';

/**
 * Situationen ved bordet (SPEC-analyse-situation.md): hvor mange kort Vest og Øst har vist i andre farver, og hvor
 * mange honnørpoint de højst kan have i farven. Betingelserne bliver til ledige pladser (`vacant`) og til vægte på
 * sidningerne, som løseren tager imod (`SubgameOptions.weights`). Filen henter kun typer fra løseren, så appen kan
 * bruge den uden at hente løseren.
 */
export interface Situation {
  known: { west: number; east: number };
  maxHp: { west: number; east: number };
}
export type SituationField = 'known' | 'maxHp';
export type Seat = 'west' | 'east';

export const KNOWN_MAX = 13;
export const HP_MAX = 10;
export const STANDARD: Situation = { known: { west: 0, east: 0 }, maxHp: { west: HP_MAX, east: HP_MAX } };

export const isStandard = (s: Situation) =>
  s.known.west === 0 && s.known.east === 0 && s.maxHp.west === HP_MAX && s.maxHp.east === HP_MAX;

/** Honnørpoint for et kort i farven: E 4, K 3, D 2, B 1, ellers 0. */
export const honorPoints = (rank: Rank) => (rank >= 11 ? rank - 10 : 0);

/** Ledige pladser: 13 minus de kendte kort, som i "Med optælling". */
export const vacantOf = (s: Situation): Vacant => ({ west: KNOWN_MAX - s.known.west, east: KNOWN_MAX - s.known.east });

/** Modpartens honnørpoint i farven. */
export const missingHp = (north: readonly Rank[], south: readonly Rank[]) =>
  missingCards(north, south).reduce((a, r) => a + honorPoints(r), 0);

/** En hp-grænse binder, når den ligger under modpartens honnørpoint i farven. Ellers ændrer den intet. */
export const hpBinds = (north: readonly Rank[], south: readonly Rank[], s: Situation) => {
  const hp = missingHp(north, south);
  return s.maxHp.west < hp || s.maxHp.east < hp;
};

/** Spillets indstillinger: ledige pladser, og hullerne deles efter honnørpoint, når en grænse binder. */
export const gameOptionsFor = (north: readonly Rank[], south: readonly Rank[], s: Situation) => ({
  vacant: vacantOf(s),
  splitHonors: hpBinds(north, south, s),
});

/**
 * Sidningernes vægt i situationen: den a priori-vægt, spillet har med de ledige pladser, når Vests og Østs
 * honnørpoint ligger inden for grænserne, ellers 0. Vægten er eksakt, fordi hver del af et hul har kort med samme
 * honnørpoint, når grænsen binder; så giver antallet pr. del modspillernes honnørpoint.
 */
export function situationWeights(game: Pick<Game, 'missing' | 'parts' | 'layouts'>, s: Situation): bigint[] {
  const total = game.missing.reduce((a, r) => a + honorPoints(r), 0);
  if (s.maxHp.west >= total && s.maxHp.east >= total) return game.layouts.map((l) => l.weight);
  return game.layouts.map((l) => {
    let west = 0;
    l.parts.forEach((w, p) => {
      const hp = game.parts[p].hp;
      if (hp === null) throw new Error('Hullerne skal deles, når en hp-grænse binder');
      west += w * hp;
    });
    return west <= s.maxHp.west && total - west <= s.maxHp.east ? l.weight : 0n;
  });
}

const inRange = (x: number, max: number) => Number.isInteger(x) && x >= 0 && x <= max;

/**
 * Kan situationen lade sig gøre? Felterne skal ligge i deres intervaller, og mindst én konkret sidning af de manglende
 * kort skal have plads hos Vest og Øst og overholde begge hp-grænser.
 */
export function isPossible(north: readonly Rank[], south: readonly Rank[], s: Situation): boolean {
  if (![s.known.west, s.known.east].every((x) => inRange(x, KNOWN_MAX))) return false;
  if (![s.maxHp.west, s.maxHp.east].every((x) => inRange(x, HP_MAX))) return false;
  const missing = missingCards(north, south);
  const n = missing.length;
  const vacant = vacantOf(s);
  const u = vacant.west + vacant.east;
  if (n > u) return false;
  const hp = missing.map(honorPoints);
  const total = hp.reduce((a, b) => a + b, 0);
  for (let mask = 0; mask < 1 << n; mask++) {
    let k = 0, west = 0;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) { k++; west += hp[i]; }
    if (west <= s.maxHp.west && total - west <= s.maxHp.east && binomial(u - n, vacant.west - k) > 0n) return true;
  }
  return false;
}

/** Situationen efter et tryk på − eller + i et felt. */
export function step(s: Situation, field: SituationField, seat: Seat, delta: 1 | -1): Situation {
  return { ...s, [field]: { ...s[field], [seat]: s[field][seat] + delta } };
}

/** Kan trinvælgeren trykkes? Et tryk, der ville gøre situationen umulig, er ikke muligt. */
export const canStep = (north: readonly Rank[], south: readonly Rank[], s: Situation, field: SituationField, seat: Seat, delta: 1 | -1) =>
  isPossible(north, south, step(s, field, seat, delta));
