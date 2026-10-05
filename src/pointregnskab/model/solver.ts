import type { Card, SuitLengths } from '../../domain/cards';
import { allows, honorPoints, suitOf, type Allowed, type Defender } from './points';

/**
 * Løseren (SPEC-pointregnskab.md, Model punkt 5–8): alle 2ʰ placeringer af de usete honnører på Vest og Øst
 * gennemgås, og de placeringer, der passer med begge modspilleres tilladte point (og farvelængder i Fuldt regnskab),
 * beholdes.
 */

export interface DefenderState {
  /** Tilladte samlede point fra meldingerne. */
  allowed: Allowed;
  /** Honnører, han har lagt; de tæller som vist. */
  shown: readonly Card[];
  /** Kendte farvelængder (♠♥♦♣) fra en 13-sudoku i Fuldt regnskab. */
  lengths?: SuitLengths;
}

export interface Ledger {
  W: DefenderState;
  E: DefenderState;
  /** Honnører, som hverken Nord, Syd eller de spillede kort viser. */
  unseen: readonly Card[];
}

/** Svar pr. honnør: sikkert hos Vest, sikkert hos Øst eller kan ikke afgøres. */
export type Placement = Defender | 'open';

/** En mulig placering: hvem hver uset honnør sidder hos, i samme orden som `unseen`. */
export type Assignment = readonly Defender[];

export interface Solution {
  /** De mulige placeringer. Tom, hvis meldingerne og de viste kort ikke kan passe sammen. */
  feasible: Assignment[];
  /** Svar pr. uset honnør. */
  answer: Map<Card, Placement>;
  /** Mindste og største antal point, hver modspiller kan have tilbage (vises i facit, ikke i panelet). */
  rest: Record<Defender, { min: number; max: number }>;
}

export const MAX_UNSEEN = 16;

export const shownPoints = (cards: readonly Card[]): number => cards.reduce((s, c) => s + honorPoints(c), 0);

/** Antal honnører pr. farve. */
function honorsBySuit(cards: readonly Card[]): number[] {
  const n = [0, 0, 0, 0];
  for (const c of cards) n[suitOf(c)]++;
  return n;
}

/** Point, Vest og Øst ender med i en placering, og om placeringen passer. */
function evaluate(ledger: Ledger, assignment: Assignment): { fits: boolean; extra: Record<Defender, number> } {
  const extra: Record<Defender, number> = { W: 0, E: 0 };
  const honors = { W: honorsBySuit(ledger.W.shown), E: honorsBySuit(ledger.E.shown) };
  ledger.unseen.forEach((card, i) => {
    extra[assignment[i]] += honorPoints(card);
    honors[assignment[i]][suitOf(card)]++;
  });
  const fits = (['W', 'E'] as const).every((d) => {
    const state = ledger[d];
    if (!allows(state.allowed, shownPoints(state.shown) + extra[d])) return false;
    // Fuldt regnskab: ingen modspiller får flere honnører i en farve, end han har kort i den.
    return !state.lengths || honors[d].every((n, s) => n <= state.lengths![s]);
  });
  return { fits, extra };
}

export function solve(ledger: Ledger): Solution {
  const h = ledger.unseen.length;
  if (h > MAX_UNSEEN) throw new Error(`For mange usete honnører: ${h}`);
  const feasible: Assignment[] = [];
  const rest: Record<Defender, { min: number; max: number }> = {
    W: { min: Infinity, max: -Infinity },
    E: { min: Infinity, max: -Infinity },
  };
  for (let mask = 0; mask < 1 << h; mask++) {
    // Bit i sat = honnør i sidder hos Vest.
    const assignment = ledger.unseen.map((_, i) => ((mask >> i) & 1 ? 'W' : 'E') as Defender);
    const { fits, extra } = evaluate(ledger, assignment);
    if (!fits) continue;
    feasible.push(assignment);
    for (const d of ['W', 'E'] as const) {
      rest[d].min = Math.min(rest[d].min, extra[d]);
      rest[d].max = Math.max(rest[d].max, extra[d]);
    }
  }
  const answer = new Map<Card, Placement>();
  ledger.unseen.forEach((card, i) => {
    const seats = new Set(feasible.map((a) => a[i]));
    answer.set(card, seats.size === 1 ? [...seats][0] : 'open');
  });
  return { feasible, answer, rest };
}

/** Facit for én honnør. */
export function placementOf(ledger: Ledger, card: Card): Placement {
  const p = solve(ledger).answer.get(card);
  if (p === undefined) throw new Error('Honnøren er ikke uset');
  return p;
}
