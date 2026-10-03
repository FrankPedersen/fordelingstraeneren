import type { Rank } from '../model/cards';
import type { Vacant } from '../model/layouts';
import { solveSubgame, type SubgameOptions, type SubgameSolution } from './cfr';
import { buildGame, END, type Game, type Hand, type Objective } from './game';
import { lineMask, type Line } from './lines';

export interface LeadChoice {
  hand: Hand;
  /** Højeste og laveste kort i den spillede gruppe af ligeværdige kort. */
  high: Rank;
  low: Rank;
}

export interface LeadSolution extends SubgameSolution {
  lead: LeadChoice;
  /** Barn-slot ved roden. */
  slot: number;
}

export interface Solution {
  game: Game;
  /** Den bedste linje for hvert første udspil. Tom, hvis målet er nået eller umuligt fra start. */
  leads: LeadSolution[];
  /** Indeks i `leads` for den bedste linje, −1 uden udspil. */
  best: number;
  /** Værdien af den bedste linje (sandsynlighed for et mål, forventet antal stik for parturnering). */
  value: number;
}

export interface SolveOptions extends SubgameOptions {
  vacant?: Vacant;
}

function leadOf(game: Game, slot: number): LeadChoice {
  return { hand: game.slotHand[slot] === 0 ? 'N' : 'S', high: game.slotHigh[slot], low: game.slotLow[slot] };
}

/**
 * Løser spillet med optimalt modspil. Hvert første udspil er et selvstændigt delspil (udspillet er offentligt),
 * så den bedste linje for hvert udspil findes for sig. Den bedste af dem er spillets værdi, og de andre er
 * alternativerne til "Vælg linjen".
 */
export function solveGame(game: Game, options: SubgameOptions = {}): Solution {
  const root = game.root;
  if (game.kind[root] === END) return { game, leads: [], best: -1, value: game.payoff[root] };
  const leads: LeadSolution[] = [];
  const cs = game.childStart[root];
  for (let x = 0; x < game.childCount[root]; x++) {
    const slot = cs + x;
    if (options.allowed && !options.allowed[slot]) continue;
    const sub = solveSubgame(game, game.children[slot], options);
    leads.push({ ...sub, lead: leadOf(game, slot), slot });
  }
  let best = 0;
  leads.forEach((l, i) => {
    if (l.value > leads[best].value + 1e-12) best = i;
  });
  return { game, leads, best, value: leads[best].value };
}

export function solve(north: readonly Rank[], south: readonly Rank[], objective: Objective, options: SolveOptions = {}): Solution {
  return solveGame(buildGame(north, south, { objective, vacant: options.vacant }), options);
}

/** Værdien af en håndskreven linje: linjens trin ligger fast, og løseren spiller resten optimalt. */
export function solveLine(game: Game, line: Line, options: SubgameOptions = {}): LeadSolution {
  const mask = lineMask(game, line);
  if (mask.errors.length) throw new Error(`Linje ${line.id} er ugyldig: ${mask.errors.join(' ')}`);
  const solution = solveGame(game, { ...options, allowed: mask.allowed });
  if (solution.leads.length !== 1) throw new Error(`Linje ${line.id} skal bestemme første udspil`);
  return solution.leads[0];
}
