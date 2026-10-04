import { cardsData, type Rank } from '../model/cards';
import type { CombinationSolution, GoalResult, LeadResult } from '../precompute';
import { describeLine } from './describe';
import { buildGame, type Game } from './game';
import { validateLine, type Line } from './lines';
import { solveGame, solveLine, type LeadSolution, type Solution } from './solve';

/**
 * Løserens resultater i datafilernes form. Bruges af scripts/solve.ts (via precompute.ts) og af appen, når løseren
 * regner en kombination uden for banken eller en egen linje (Analyse fase 2, i en Web Worker).
 */

/** En løst linje på dansk og i linjeformatet. */
export function leadResult(game: Game, l: LeadSolution): LeadResult {
  const described = describeLine(game, l.strategy, l.slot);
  return {
    hand: l.lead.hand,
    high: l.lead.high,
    low: l.lead.low,
    value: l.value,
    exact: l.exact.toString(),
    upper: l.upper,
    certified: l.certified,
    layouts: [...l.layoutValues],
    steps: described.steps,
    line: described.line.steps,
  };
}

export function goalResult(solution: Solution): GoalResult {
  return { value: solution.value, best: solution.best, leads: solution.leads.map((l) => leadResult(solution.game, l)) };
}

export type CombinationBase = Omit<CombinationSolution, 'goals' | 'tricks'>;

/** Kombinationens huller og sidninger; de afhænger ikke af målet. */
export function combinationBase(game: Game): CombinationBase {
  const declarer = game.declarer;
  return {
    north: cardsData(game.north),
    south: cardsData(game.south),
    denominator: game.denominator.toString(),
    gaps: game.gaps.map((size, q) => ({
      high: q === 0 ? 14 : declarer[q - 1].rank - 1,
      low: q === declarer.length ? 2 : declarer[q].rank + 1,
      size,
    })),
    layouts: game.layouts.map((l) => ({ west: [...l.west], weight: l.weight.toString() })),
  };
}

// ---------- Beregning på forespørgsel ----------

export type SolveRequest =
  | { kind: 'goal'; north: Rank[]; south: Rank[]; goal: number }
  | { kind: 'tricks'; north: Rank[]; south: Rank[] }
  | { kind: 'line'; north: Rank[]; south: Rank[]; goal: number; line: Line };

export type SolveResponse =
  | { kind: 'goal' | 'tricks'; base: CombinationBase; result: GoalResult }
  | { kind: 'line'; lead: LeadResult | null; errors: string[] };

/** Løser en forespørgsel: et mål, flest stik i gennemsnit eller en egen linje (efter dens trin spiller løseren videre). */
export function handleSolve(request: SolveRequest): SolveResponse {
  if (request.kind === 'tricks') {
    const game = buildGame(request.north, request.south, { objective: { kind: 'tricks' } });
    return { kind: 'tricks', base: combinationBase(game), result: goalResult(solveGame(game)) };
  }
  const game = buildGame(request.north, request.south, { objective: { kind: 'goal', goal: request.goal } });
  if (request.kind === 'goal') return { kind: 'goal', base: combinationBase(game), result: goalResult(solveGame(game)) };
  const errors = validateLine(game, request.line);
  if (errors.length) return { kind: 'line', lead: null, errors };
  return { kind: 'line', lead: leadResult(game, solveLine(game, request.line)), errors: [] };
}
