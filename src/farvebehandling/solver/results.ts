import { cardsData, type Rank } from '../model/cards';
import { shownLeads } from '../model/shown';
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

/**
 * Stik pr. sidning for de viste linjer i et mål: linjens trin ligger fast, og derefter spiller løseren for flest stik,
 * som parturneringens linje i Hold eller par (`pairsFor`). De andre linjer får ingen stik. `game` genbruger spillet med
 * flest stik mellem målene.
 */
export function shownLeadTricks(
  north: readonly Rank[],
  south: readonly Rank[],
  g: GoalResult,
  game: { current: Game | null } = { current: null },
): GoalResult {
  const shown = new Set(shownLeads(g));
  const leads = g.leads.map((lead, i) => {
    const { tricks: _old, ...rest } = lead;
    if (!shown.has(i)) return rest;
    return { ...rest, tricks: leadTricks(north, south, lead, game) };
  });
  return { ...g, leads };
}

/**
 * Én linjes stik pr. sidning med flest stik efter dens trin. Spillet for et mål slutter, når målet er nået eller umuligt,
 * men spillet med flest stik fortsætter, så et senere trin kan nås, efter at dets kort er spillet (fx esset). Så bruges
 * de første trin, der kan spilles, og derefter spiller løseren for flest stik.
 */
export function leadTricks(north: readonly Rank[], south: readonly Rank[], lead: LeadResult, game: { current: Game | null } = { current: null }): number[] {
  const steps = lead.line.length ? lead.line : [{ leadFrom: lead.hand, card: cardsData([lead.high as Rank]) }];
  game.current ??= buildGame(north, south, { objective: { kind: 'tricks' } });
  for (let n = steps.length; ; n--) {
    try {
      return [...solveLine(game.current, { id: 'stik', text: '', steps: steps.slice(0, n) }).layoutValues];
    } catch (error) {
      if (n <= 1) throw error;
    }
  }
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
  // Stik pr. sidning regnes ikke her: det ville tredoble ventetiden i browseren. Kun bankens linjer har gennemsnittet.
  if (request.kind === 'goal') return { kind: 'goal', base: combinationBase(game), result: goalResult(solveGame(game)) };
  const errors = validateLine(game, request.line);
  if (errors.length) return { kind: 'line', lead: null, errors };
  return { kind: 'line', lead: leadResult(game, solveLine(game, request.line)), errors: [] };
}
