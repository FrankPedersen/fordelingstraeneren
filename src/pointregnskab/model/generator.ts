import { suitLengths, type Card } from '../../domain/cards';
import { SEATS, dealWith, type Hands, type Seat } from '../../domain/dealer';
import { mulberry32, shuffle, type Rng } from '../../engine/rng';
import { makeSudoku } from '../../modes/sudoku/task';
import { hcpOf } from '../../system/interpreter';
import { allowedFor, bid, type Auction } from './bidding';
import { directlyReadable, explain, type Explanation } from './explain';
import { isHonor, limits, opponentsPoints, otherDefender, type Defender } from './points';
import { shownPoints, solve, type Ledger, type Placement } from './solver';

/**
 * Generatoren (SPEC-pointregnskab.md, Generator): opgaver fra tilfældige fordelinger med motorens kortgiver og en
 * seedbar PRNG. Facit beregnes altid af løseren. Samme seed, øvelse og niveau giver samme opgave; teksterne bygges
 * først, når opgaven vises.
 */

/** Øvelserne 1–6. */
export type Exercise = 'sum' | 'running' | 'can' | 'who' | 'finesse' | 'full';

export const EXERCISES: readonly Exercise[] = ['sum', 'running', 'can', 'who', 'finesse', 'full'];

export type Level = 1 | 2 | 3 | 4 | 5;

/** En hændelse i ledetrådsstrømmen: en modspiller lægger en honnør. */
export interface Clue {
  seat: Defender;
  card: Card;
}

interface Base {
  seed: number;
  level: Level;
  /** Alle fire hænder; brugerfladen viser kun Nord (bordet) og Syd. */
  hands: Hands;
  /** Modpartens point: 40 − (Nords hp + Syds hp). */
  m: number;
}

/** Regnestykket: hvor mange point har modparten? */
export interface SumTask extends Base {
  exercise: 'sum';
}

/** Løbende tælling: honnørerne vises én ad gangen; hvor mange point har Vest vist, og Øst? */
export interface RunningTask extends Base {
  exercise: 'running';
  clues: Clue[];
  shown: Record<Defender, number>;
}

/**
 * Kan han have den?, Hvem har den?, Kipningsretning og Fuldt regnskab: et spørgsmål om én uset honnør. Fuldt regnskab
 * (og niveau 5) har Vests og Østs farvelængder fra 13-sudokuens generator i regnskabet.
 */
export interface PlacementTask extends Base {
  exercise: 'can' | 'who' | 'finesse' | 'full';
  auction: Auction;
  /** Ledetrådsstrømmen i den rækkefølge, honnørerne falder. */
  clues: Clue[];
  ledger: Ledger;
  card: Card;
  /** Kan han have den?: modspilleren, der spørges om. */
  asked?: Defender;
  /** Løserens facit for honnøren. */
  placement: Placement;
  explanation: Explanation;
  /** Seedet til 13-sudokuen, som længderne kommer fra (Fuldt regnskab og niveau 5). */
  sudokuSeed?: number;
}

export type PointTask = SumTask | RunningTask | PlacementTask;

/** Hvor ofte facit skal være "kan ikke afgøres" (specen: ca. hver fjerde). */
export const OPEN_SHARE = 0.25;

/** Nord–Syd er spilførersiden og har mindst så mange hp, så kontrakten er rimelig. */
export const MIN_NS_HCP = 20;

const MAX_ATTEMPTS = 50_000;

/** Opgaver, der kan aflæses direkte, forkastes fra dette niveau; på niveau 1–2 bruges de. */
export const DIRECT_READ_REJECTED_FROM: Level = 3;

export function makeTask(exercise: Exercise, level: Level, seed: number): PointTask {
  const rng = mulberry32(seed);
  switch (exercise) {
    case 'sum':
      return sumTask(seed, level, rng);
    case 'running':
      return runningTask(seed, level, rng);
    case 'can':
    case 'who':
    case 'finesse':
    case 'full':
      return placementTask(exercise, seed, level, rng);
  }
}

function sumTask(seed: number, level: Level, rng: Rng): SumTask {
  const hands = dealWith(rng);
  return { exercise: 'sum', seed, level, hands, m: opponentsPoints(hands.N, hands.S) };
}

/** Modspillernes honnører. */
function defenderHonors(hands: Hands): Clue[] {
  return (['W', 'E'] as const).flatMap((seat) => hands[seat].filter(isHonor).map((card) => ({ seat, card })));
}

/** Løbende tælling: 2 + niveau honnører i tilfældig rækkefølge. */
function runningTask(seed: number, level: Level, rng: Rng): RunningTask {
  const hands = dealWith(rng);
  const clues = shuffle(defenderHonors(hands), rng).slice(0, 2 + level);
  const shown = {
    W: shownPoints(clues.filter((c) => c.seat === 'W').map((c) => c.card)),
    E: shownPoints(clues.filter((c) => c.seat === 'E').map((c) => c.card)),
  };
  return { exercise: 'running', seed, level, hands, m: opponentsPoints(hands.N, hands.S), clues, shown };
}

/** Kan Nord–Syd kippe mod honnøren? De har kortet lige under og et højere kort i farven. */
export function canFinesse(hands: Hands, card: Card): boolean {
  const ns = [...hands.N, ...hands.S];
  const top = (Math.floor(card / 13) + 1) * 13;
  return ns.includes(card - 1) && ns.some((c) => c > card && c < top);
}

/** Har opgaven farvelængder fra en 13-sudoku? Fuldt regnskab og niveau 5. */
export const hasLengths = (exercise: Exercise, level: Level): boolean => exercise === 'full' || level === 5;

/**
 * Opgaver om én uset honnør. Niveau 1–2 har én modspiller med en grænse (niveau 1 med én uset honnør, niveau 2 med
 * flere); fra niveau 3 har begge en grænse, så restintervallet skal bruges. Fuldt regnskab følger reglerne fra niveau 3
 * og får længderne fra 13-sudokuens generator med et nyt seed: fordelingen er sudokuens egen, så længderne passer.
 * Kvalitetskravene: fra niveau 3 kan svaret ikke aflæses direkte (på niveau 1–2 må en modspiller have vist alt, han
 * kan have; Franks afgørelse), fra niveau 2 er mindst én honnør sikkert placeret uden at være set, og facit har en
 * skabelon.
 */
function placementTask(exercise: PlacementTask['exercise'], seed: number, level: Level, rng: Rng): PlacementTask {
  const wantOpen = rng.next() < OPEN_SHARE;
  const lengths = hasLengths(exercise, level);
  // Fuldt regnskab følger reglerne fra niveau 3.
  const rules: Level = exercise === 'full' ? (Math.max(level, 3) as Level) : level;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Med længder gives kortene som i 13-sudokuens generator (mulberry32(seed), dealWith og så giveren).
    const sudokuSeed = lengths ? rng.uint32() : undefined;
    const dealRng = sudokuSeed === undefined ? rng : mulberry32(sudokuSeed);
    const hands = dealWith(dealRng);
    const dealer: Seat = SEATS[dealRng.int(4)];
    if (hcpOf(hands.N) + hcpOf(hands.S) < MIN_NS_HCP) continue;
    const auction = bid(hands, dealer);
    if (!auction) continue;
    const m = opponentsPoints(hands.N, hands.S);
    const allowed = { W: allowedFor(auction, 'W', m), E: allowedFor(auction, 'E', m) };
    const limited = (['W', 'E'] as const).filter((d) => limits(allowed[d], m)).length;
    if (rules <= 2 ? limited !== 1 : limited !== 2) continue;

    const honors = shuffle(defenderHonors(hands), rng);
    const unseenCount = rules === 1 ? 1 : 2 + rng.int(4);
    if (honors.length <= unseenCount) continue;
    const unseen = honors.slice(0, unseenCount).map((h) => h.card);
    const clues = honors.slice(unseenCount);
    const ledger: Ledger = {
      W: { allowed: allowed.W, shown: clues.filter((c) => c.seat === 'W').map((c) => c.card), ...(lengths ? { lengths: suitLengths(hands.W) } : {}) },
      E: { allowed: allowed.E, shown: clues.filter((c) => c.seat === 'E').map((c) => c.card), ...(lengths ? { lengths: suitLengths(hands.E) } : {}) },
      unseen,
    };
    if (rules >= DIRECT_READ_REJECTED_FROM && directlyReadable(ledger)) continue;
    const solution = solve(ledger);
    if (rules >= 2 && ![...solution.answer.values()].some((p) => p !== 'open')) continue;

    const candidates = unseen.filter(
      (card) =>
        (solution.answer.get(card) === 'open') === wantOpen &&
        (exercise !== 'finesse' || canFinesse(hands, card)) &&
        explain(ledger, card, solution) !== null,
    );
    if (!candidates.length) continue;
    const card = candidates[rng.int(candidates.length)];
    const placement = solution.answer.get(card)!;
    const asked: Defender | undefined = exercise === 'can' ? (rng.int(2) ? 'W' : 'E') : undefined;
    if (sudokuSeed !== undefined) {
      // Længderne kommer fra 13-sudokuens generator, kaldt som bibliotek; dagens sudoku påvirkes ikke.
      const sudoku = makeSudoku(sudokuSeed);
      for (const d of ['W', 'E'] as const) {
        if (sudoku.lengths[d].join() !== ledger[d].lengths!.join()) throw new Error(`13-sudokuens længder passer ikke (seed ${sudokuSeed})`);
      }
    }
    return {
      exercise,
      seed,
      level,
      hands,
      m,
      auction,
      clues,
      ledger,
      card,
      ...(asked ? { asked } : {}),
      placement,
      explanation: explain(ledger, card, solution)!,
      ...(sudokuSeed !== undefined ? { sudokuSeed } : {}),
    };
  }
  throw new Error(`Ingen opgave fundet for seed ${seed}`);
}

/** Kan han have den?: ja, medmindre honnøren sikkert sidder hos den anden. */
export function canHave(task: PlacementTask): boolean {
  return task.placement !== otherDefender(task.asked!);
}
