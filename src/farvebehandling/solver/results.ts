import { cardsData, type Rank } from '../model/cards';
import { shownLeads } from '../model/shown';
import { gameOptionsFor, isStandard, situationWeights, type Situation } from '../model/situation';
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

/**
 * Kombinationens huller og sidninger; de afhænger ikke af målet. Hullerne er spillets dele (uden deling ét pr. hul).
 * Med en situations vægte (`weights`) har hver sidning sin vægt i situationen (0 = udelukket), og nævneren er summen,
 * så chancerne er betingede.
 */
export function combinationBase(game: Game, weights?: readonly bigint[]): CombinationBase {
  return {
    north: cardsData(game.north),
    south: cardsData(game.south),
    denominator: (weights ? weights.reduce((a, b) => a + b, 0n) : game.denominator).toString(),
    gaps: game.parts.map(({ high, low, size }) => ({ high, low, size })),
    layouts: game.layouts.map((l, L) => ({ west: [...l.parts], weight: (weights ? weights[L] : l.weight).toString() })),
  };
}

// ---------- Beregning på forespørgsel ----------

/** `situation` er valgfri (SPEC-analyse-situation.md); uden den, eller på standard, er svaret som før. */
export type SolveRequest =
  | { kind: 'goal'; north: Rank[]; south: Rank[]; goal: number; situation?: Situation }
  | { kind: 'tricks'; north: Rank[]; south: Rank[]; situation?: Situation }
  | { kind: 'line'; north: Rank[]; south: Rank[]; goal: number; line: Line; situation?: Situation };

export type SolveResponse =
  | { kind: 'goal' | 'tricks'; base: CombinationBase; result: GoalResult }
  | { kind: 'line'; lead: LeadResult | null; errors: string[] };

/** Løser en forespørgsel: et mål, flest stik i gennemsnit eller en egen linje (efter dens trin spiller løseren videre). */
export function handleSolve(request: SolveRequest): SolveResponse {
  if (request.situation && !isStandard(request.situation)) return handleSituation(request, request.situation);
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

/**
 * En forespørgsel med en situation: spillet bygges med de ledige pladser (og delte huller, når en hp-grænse binder), og
 * løseren regner med situationens vægte, så chancen er betinget af situationen.
 */
function handleSituation(request: SolveRequest, situation: Situation): SolveResponse {
  const objective = request.kind === 'tricks' ? ({ kind: 'tricks' } as const) : ({ kind: 'goal', goal: request.goal } as const);
  const game = buildGame(request.north, request.south, { objective, ...gameOptionsFor(request.north, request.south, situation) });
  const weights = situationWeights(game, situation);
  if (!weights.some((w) => w > 0n)) throw new Error('Situationen kan ikke lade sig gøre');
  const base = combinationBase(game, weights);
  if (request.kind !== 'line') return { kind: request.kind, base, result: goalResult(solveGame(game, { weights })) };
  const errors = validateLine(game, request.line);
  if (errors.length) return { kind: 'line', lead: null, errors };
  return { kind: 'line', lead: leadResult(game, solveLine(game, request.line, { weights })), errors: [] };
}
