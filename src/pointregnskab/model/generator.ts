import type { Card } from '../../domain/cards';
import { SEATS, dealWith, type Hands, type Seat } from '../../domain/dealer';
import { mulberry32, shuffle, type Rng } from '../../engine/rng';
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

/** Kan han have den?, Hvem har den? og Kipningsretning: et spørgsmål om én uset honnør. */
export interface PlacementTask extends Base {
  exercise: 'can' | 'who' | 'finesse';
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
}

export type PointTask = SumTask | RunningTask | PlacementTask;

/** Hvor ofte facit skal være "kan ikke afgøres" (specen: ca. hver fjerde). */
export const OPEN_SHARE = 0.25;

/** Nord–Syd er spilførersiden og har mindst så mange hp, så kontrakten er rimelig. */
export const MIN_NS_HCP = 20;

const MAX_ATTEMPTS = 50_000;

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
      return placementTask(exercise, seed, level, rng);
    case 'full':
      throw new Error('Fuldt regnskab bygges i leverancetrin 5');
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

/**
 * Opgaver om én uset honnør. Niveau 1–2 har én modspiller med en grænse (niveau 1 med én uset honnør, niveau 2 med
 * flere); fra niveau 3 har begge en grænse, så restintervallet skal bruges. Kvalitetskravene: svaret kan ikke
 * aflæses direkte, fra niveau 2 er mindst én honnør sikkert placeret uden at være set, og facit har en skabelon.
 */
function placementTask(exercise: 'can' | 'who' | 'finesse', seed: number, level: Level, rng: Rng): PlacementTask {
  const wantOpen = rng.next() < OPEN_SHARE;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const hands = dealWith(rng);
    const dealer: Seat = SEATS[rng.int(4)];
    if (hcpOf(hands.N) + hcpOf(hands.S) < MIN_NS_HCP) continue;
    const auction = bid(hands, dealer);
    if (!auction) continue;
    const m = opponentsPoints(hands.N, hands.S);
    const allowed = { W: allowedFor(auction, 'W', m), E: allowedFor(auction, 'E', m) };
    const limited = (['W', 'E'] as const).filter((d) => limits(allowed[d], m)).length;
    if (level <= 2 ? limited !== 1 : limited !== 2) continue;

    const honors = shuffle(defenderHonors(hands), rng);
    const unseenCount = level === 1 ? 1 : 2 + rng.int(4);
    if (honors.length <= unseenCount) continue;
    const unseen = honors.slice(0, unseenCount).map((h) => h.card);
    const clues = honors.slice(unseenCount);
    const ledger: Ledger = {
      W: { allowed: allowed.W, shown: clues.filter((c) => c.seat === 'W').map((c) => c.card) },
      E: { allowed: allowed.E, shown: clues.filter((c) => c.seat === 'E').map((c) => c.card) },
      unseen,
    };
    if (directlyReadable(ledger)) continue;
    const solution = solve(ledger);
    if (level >= 2 && ![...solution.answer.values()].some((p) => p !== 'open')) continue;

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
    };
  }
  throw new Error(`Ingen opgave fundet for seed ${seed}`);
}

/** Kan han have den?: ja, medmindre honnøren sikkert sidder hos den anden. */
export function canHave(task: PlacementTask): boolean {
  return task.placement !== otherDefender(task.asked!);
}
