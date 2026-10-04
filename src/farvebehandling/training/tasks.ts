import { binomial } from '../../domain/combinatorics';
import type { Outcome } from '../../engine/leitner';
import { shuffle, type Rng } from '../../engine/rng';
import { makeSudoku } from '../../modes/sudoku/task';
import { bandFields, linesForGoal, NEAR_BEST, type BandField, type BankItem, type LineView } from '../analysis';
import { guessInterval } from '../model/guess';
import type { Vacant } from '../model/layouts';
import type { TaskType } from '../storage';

/**
 * Opgavetyperne i Træning og Selvvalgt (SPEC-farvebehandling.md). Et emne er en kombination × et mål.
 * Type 5 (Hvad nu?) og 7 (Spil den selv) kommer senere.
 */

export interface TaskBase {
  /** Emnet: `${kombination}:${mål}`. */
  item: string;
  bank: BankItem;
  goal: number;
}

/** En linje som svarmulighed. `correct` = den bedste eller inden for 0,5 procentpoint af den. */
export interface LineOption {
  line: LineView;
  value: number;
  correct: boolean;
}

export type FbTask =
  | (TaskBase & { type: 'vælg-linjen'; options: LineOption[] })
  | (TaskBase & { type: 'chancen'; line: LineOption })
  | (TaskBase & { type: 'linje-mod-linje'; options: [LineOption, LineOption] })
  | (TaskBase & { type: 'nyt-mål'; previousGoal: number; options: LineOption[] })
  | (TaskBase & { type: 'find-hullet'; line: LineOption; fields: BandField[] })
  | (TaskBase & { type: 'optælling'; vacant: Vacant; shown: Counting; options: LineOption[] });

/** Optællingen fra 13-sudokuen: Vests og Østs længder i de tre andre farver (♠ ♥ ♦ ♣ = 0–3). */
export interface Counting {
  suits: number[];
  west: number[];
  east: number[];
}

export interface FbAnswer {
  /** Indeks i opgavens linjer. */
  line?: number;
  /** Gætteinterval (0–3). */
  guess?: number;
  /** Den valgte sidning (feltets id). */
  field?: string;
  ms: number;
}

export interface Graded {
  /** 1 = rigtigt, 0,5 = halvt (rigtig linje, forkert interval), 0 = forkert. */
  score: 0 | 0.5 | 1;
  lineCorrect: boolean | null;
  guessCorrect: boolean | null;
  fast: boolean;
}

/** "Vælg linjen" viser 2–4 linjer: den bedste og op til tre, der er dårligere. */
export const MAX_OPTIONS = 4;

export const itemKey = (id: string, goal: number) => `${id}:${goal}`;

function options(lines: readonly LineView[], value: (l: LineView) => number = (l) => l.value): LineOption[] {
  const best = Math.max(...lines.map(value));
  return lines
    .map((line) => ({ line, value: value(line), correct: best - value(line) <= NEAR_BEST }))
    .sort((a, b) => b.value - a.value);
}

/** Den bedste linje og op til tre forkerte; ligeværdige linjer udelades, så der kun er ét rigtigt svar. */
function choice(opts: readonly LineOption[]): LineOption[] {
  return [opts[0], ...opts.filter((o) => !o.correct).slice(0, MAX_OPTIONS - 1)];
}

/** Kan opgavetypen stilles for emnet? */
export function possibleTypes(bank: BankItem, goal: number): TaskType[] {
  const lines = linesForGoal(bank, goal);
  if (!lines.length) return [];
  const opts = options(lines);
  const types: TaskType[] = ['chancen'];
  const wrong = opts.some((o) => !o.correct);
  if (wrong) types.push('vælg-linjen', 'linje-mod-linje', 'optælling');
  if (wrong && bank.combination.goals.length > 1) types.push('nyt-mål');
  // Find hullet: én sidning, hvor linjen taber, mod mindst to, hvor den vinder.
  const fields = bandFields(bank, lines);
  if (fields.some((f) => f.outcomes[0] === 0) && fields.filter((f) => f.outcomes[0] > 0).length >= 2) types.push('find-hullet');
  return types;
}

const sameLine = (a: LineView | undefined, b: LineView | undefined) =>
  !!a && !!b && a.lead.hand === b.lead.hand && a.lead.high === b.lead.high && a.lead.steps.join(' ') === b.lead.steps.join(' ');

export function makeTask(type: TaskType, bank: BankItem, goal: number, rng: Rng): FbTask {
  const base = { item: itemKey(bank.combination.id, goal), bank, goal };
  const lines = linesForGoal(bank, goal);
  const opts = options(lines);
  switch (type) {
    case 'vælg-linjen':
      return { ...base, type, options: shuffle(choice(opts), rng) };
    case 'chancen':
      return { ...base, type, line: opts[0] };
    case 'linje-mod-linje': {
      const wrong = opts.filter((o) => !o.correct);
      const pair: [LineOption, LineOption] = [opts[0], wrong[rng.int(wrong.length)]];
      return { ...base, type, options: rng.next() < 0.5 ? pair : [pair[1], pair[0]] };
    }
    case 'nyt-mål': {
      // Helst et mål, hvor den bedste linje er en anden: så skifter linjen med målet.
      const others = bank.combination.goals.filter((g) => g !== goal);
      const differs = others.filter((g) => !sameLine(linesForGoal(bank, g)[0], lines[0]));
      const pool = differs.length ? differs : others;
      return { ...base, type, previousGoal: pool[rng.int(pool.length)], options: shuffle(choice(opts), rng) };
    }
    case 'find-hullet': {
      const fields = bandFields(bank, lines);
      const failing = fields.filter((f) => f.outcomes[0] === 0).sort((a, b) => b.probability - a.probability);
      const passing = fields.filter((f) => f.outcomes[0] > 0).sort((a, b) => b.probability - a.probability);
      return { ...base, type, line: opts[0], fields: shuffle([failing[0], ...passing.slice(0, 3)], rng) };
    }
    case 'optælling':
      return countingTask(base, bank, lines, rng) ?? makeTask('vælg-linjen', bank, goal, rng);
    default:
      throw new Error(`Opgavetypen ${type} er ikke bygget endnu`);
  }
}

/**
 * Med optælling: en ny 13-sudoku fra generatoren, hvor Nord og Syd har lige så mange kort i én farve som
 * kombinationen. Vests og Østs længder i de tre andre farver giver de ledige pladser, og chancerne regnes om.
 * Dagens sudoku og fordelingssporets data røres ikke.
 */
function countingTask(base: TaskBase, bank: BankItem, lines: readonly LineView[], rng: Rng): FbTask | null {
  const total = bank.north.length + bank.south.length;
  for (let attempt = 0; attempt < 200; attempt++) {
    const sudoku = makeSudoku(rng.uint32());
    const suit = [0, 1, 2, 3].find((s) => sudoku.lengths.N[s] + sudoku.lengths.S[s] === total);
    if (suit === undefined) continue;
    const suits = [0, 1, 2, 3].filter((s) => s !== suit);
    const west = suits.map((s) => sudoku.lengths.W[s]);
    const east = suits.map((s) => sudoku.lengths.E[s]);
    const vacant = { west: 13 - west.reduce((a, b) => a + b, 0), east: 13 - east.reduce((a, b) => a + b, 0) };
    const weights = vacantWeights(bank, vacant);
    const opts = options(lines, (l) => l.lead.layouts.reduce((s, o, L) => s + o * weights[L], 0));
    if (!opts.some((o) => !o.correct)) continue;
    return { ...base, type: 'optælling', vacant, shown: { suits, west, east }, options: shuffle(choice(opts), rng) };
  }
  return null;
}

/** Sidningernes chance med ledige pladser: C(U − n, v_V − k) · ∏ C(hul, w) / C(U, v_V). */
export function vacantWeights(bank: BankItem, vacant: Vacant): number[] {
  const { gaps, layouts } = bank.solution;
  const n = gaps.reduce((a, g) => a + g.size, 0);
  const u = vacant.west + vacant.east;
  const den = binomial(u, vacant.west);
  return layouts.map((l) => {
    const k = l.west.reduce((a, b) => a + b, 0);
    let num = binomial(u - n, vacant.west - k);
    l.west.forEach((w, g) => (num *= binomial(gaps[g].size, w)));
    return Number(num) / Number(den);
  });
}

/**
 * Pointtabellen: rigtig linje og rigtigt interval = rigtigt; rigtig linje og forkert interval = halvt;
 * forkert linje = forkert. Opgaver uden gæt eller uden linje bedømmes på det ene. I Selvvalgt kan gættet
 * udelades (`optionalGuess`); så bedømmes linjen alene.
 */
export function grade(task: FbTask, answer: FbAnswer, fastMs: number, { optionalGuess = false } = {}): Graded {
  const fast = answer.ms < fastMs;
  const intervalOf = (o: LineOption) => guessInterval(100 * o.value);
  switch (task.type) {
    case 'vælg-linjen':
    case 'nyt-mål':
    case 'optælling': {
      const chosen = task.options[answer.line ?? -1];
      const lineCorrect = !!chosen?.correct;
      if (optionalGuess && answer.guess === undefined) {
        return { score: lineCorrect ? 1 : 0, lineCorrect, guessCorrect: null, fast };
      }
      const guessCorrect = chosen ? answer.guess === intervalOf(chosen) : false;
      return { score: lineCorrect ? (guessCorrect ? 1 : 0.5) : 0, lineCorrect, guessCorrect: lineCorrect ? guessCorrect : null, fast };
    }
    case 'chancen': {
      const guessCorrect = answer.guess === intervalOf(task.line);
      return { score: guessCorrect ? 1 : 0, lineCorrect: null, guessCorrect, fast };
    }
    case 'linje-mod-linje': {
      const lineCorrect = !!task.options[answer.line ?? -1]?.correct;
      return { score: lineCorrect ? 1 : 0, lineCorrect, guessCorrect: null, fast };
    }
    case 'find-hullet': {
      const field = task.fields.find((f) => f.id === answer.field);
      const lineCorrect = field ? field.outcomes[0] === 0 : false;
      return { score: lineCorrect ? 1 : 0, lineCorrect, guessCorrect: null, fast };
    }
  }
}

/** Leitner: rigtigt og hurtigt = én kasse op; rigtigt men langsomt eller halvt = bliver stående; forkert = kasse 1. */
export function outcomeOf(g: Graded): Outcome {
  if (g.score === 0) return 'wrong';
  return g.score === 1 && g.fast ? 'fast' : 'slow';
}

/** Den linje i opgaven, der er bedst (til facit). */
export function bestOption(task: FbTask): LineOption {
  switch (task.type) {
    case 'chancen':
    case 'find-hullet':
      return task.line;
    default:
      return [...task.options].sort((a, b) => b.value - a.value)[0];
  }
}
