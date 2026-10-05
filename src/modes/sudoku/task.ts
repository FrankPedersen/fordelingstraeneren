import { mulberry32, shuffle } from '../../engine/rng';
import { suitLengths, type SuitLengths } from '../../domain/cards';
import { SEATS, SEAT_NAMES, dealWith, type Seat } from '../../domain/dealer';
import { solveSudoku, type Defender, type Layout } from '../../domain/sudoku';
import { simulateAuction, type Bid } from '../../system/auction';
import { callText, ruleText, satisfies, type Requirement } from '../../system/interpreter';
import { tx } from '../../i18n';

/** En ledetråd: en melding tolket efter systemfilen eller en spilhændelse. */
export type Clue =
  | { kind: 'call'; seat: Defender; text: string; shows: Requirement }
  | { kind: 'cannot-follow' | 'follows' | 'fourth-best'; seat: Defender; text: string; suit: number; n: number };

export interface SudokuTask {
  kind: 'sudoku';
  seed: number;
  dealer: Seat;
  /** Farvelængderne (♠♥♦♣) for alle fire; Nord og Syd er kendte. */
  lengths: Record<Seat, SuitLengths>;
  /** Ledetrådene i den rækkefølge, de gives. */
  clues: Clue[];
  /** Ugens boss: en svær opgave. */
  hard: boolean;
}

const SUIT_NAMES = ['spar', 'hjerter', 'ruder', 'klør'];
const SUIT_NAMES_EN = ['spades', 'hearts', 'diamonds', 'clubs'];
const NUMBER_WORDS = ['', 'én', 'to', 'tre', 'fire', 'fem', 'seks', 'syv', 'otte', 'ni', 'ti', 'elleve', 'tolv', 'tretten'];
const TIMES_EN = ['', 'once', 'twice', 'three times', 'four times', 'five times', 'six times', 'seven times', 'eight times', 'nine times', 'ten times', 'eleven times', 'twelve times', 'thirteen times'];
const ORDINAL_EN = ['', '1st', '2nd', '3rd', '4th'];
const POSSESSIVE: Record<Seat, string> = { N: 'Nords', E: 'Østs', S: 'Syds', W: 'Vests' };
const POSSESSIVE_EN: Record<Seat, string> = { N: "North's", E: "East's", S: "South's", W: "West's" };

/** Grundpoint pr. opgave. */
export const SUDOKU_BASE = 10;

/**
 * Point = grundpoint × (ledetråde tilbage + 1); en forkert lås koster grundpointene.
 * Ugens boss giver dobbelt XP.
 */
export function sudokuPoints(cluesLeft: number, wrongLocks: number, hard: boolean): number {
  const base = SUDOKU_BASE * (hard ? 2 : 1);
  return base * (cluesLeft + 1) - base * wrongLocks;
}

/**
 * "X kan ikke bekende i n. runde af farven" = præcis n − 1 kort; "X følger n gange i farven" og
 * "X spiller 4. højeste ud i farven" = mindst n kort.
 */
export function clueHolds(clue: Clue, lengths: SuitLengths): boolean {
  switch (clue.kind) {
    case 'call':
      return satisfies(clue.shows, lengths);
    case 'cannot-follow':
      return lengths[clue.suit] === clue.n - 1;
    case 'follows':
    case 'fourth-best':
      return lengths[clue.suit] >= clue.n;
  }
}

export function solutions(task: Pick<SudokuTask, 'lengths'>, clues: readonly Clue[]): Layout[] {
  const constraints = clues.map((c) => ({ seat: c.seat, holds: (l: SuitLengths) => clueHolds(c, l) }));
  return solveSudoku(task.lengths.N, task.lengths.S, constraints);
}

function callClue(bid: Bid): Clue {
  const seat = bid.seat as Defender;
  const name = SEAT_NAMES[seat];
  const call = callText(bid.rule.call);
  const explanation = ruleText(bid.rule);
  const text = bid.over
    ? tx(
        `${name} ${bid.rule.call === 'X' ? 'dobler' : `melder ${call}`} efter ${POSSESSIVE[bid.over.seat]} ${callText(bid.over.call)}: ${explanation}.`,
        `${name} ${bid.rule.call === 'X' ? 'doubles' : `bids ${call}`} after ${POSSESSIVE_EN[bid.over.seat]} ${callText(bid.over.call)}: ${explanation}.`,
      )
    : tx(`${name} åbner ${call}: ${explanation}.`, `${name} opens ${call}: ${explanation}.`);
  return { kind: 'call', seat, text, shows: bid.rule.shows };
}

/** Spilhændelser, der passer med de faktiske længder. Syd spiller kontrakten, så Vest spiller ud. */
function playEvents(lengths: Record<Seat, SuitLengths>): Clue[] {
  const events: Clue[] = [];
  for (const seat of ['E', 'W'] as const) {
    const name = SEAT_NAMES[seat];
    lengths[seat].forEach((length, suit) => {
      const s = SUIT_NAMES[suit];
      const en = SUIT_NAMES_EN[suit];
      if (length <= 3) {
        const n = length + 1;
        const text = tx(`${name} kan ikke bekende i ${n}. ${s}runde.`, `${name} shows out on the ${ORDINAL_EN[n]} round of ${en}.`);
        events.push({ kind: 'cannot-follow', seat, suit, n, text });
      }
      for (let n = 2; n <= length; n++) {
        events.push({ kind: 'follows', seat, suit, n, text: tx(`${name} følger ${NUMBER_WORDS[n]} gange i ${s}.`, `${name} follows ${TIMES_EN[n]} in ${en}.`) });
      }
      if (seat === 'W' && length >= 4) {
        events.push({ kind: 'fourth-best', seat, suit, n: 4, text: tx(`Vest spiller 4. højeste ud i ${s}.`, `West leads fourth highest in ${en}.`) });
      }
    });
  }
  return events;
}

/**
 * Generatoren giver tilfældigt, lader systemfilen melde for Øst og Vest og tilføjer derefter
 * spilhændelser, indtil løseren finder præcis én løsning. Normalt vælges den mest oplysende
 * hændelse; ugens boss får den mindst oplysende, så der skal tænkes mere.
 */
export function makeSudoku(seed: number, hard = false): SudokuTask {
  const rng = mulberry32(seed);
  const hands = dealWith(rng);
  const dealer = SEATS[rng.int(4)];
  const lengths = {
    N: suitLengths(hands.N),
    E: suitLengths(hands.E),
    S: suitLengths(hands.S),
    W: suitLengths(hands.W),
  };
  const clues: Clue[] = simulateAuction(hands, dealer)
    .filter((bid) => bid.seat === 'E' || bid.seat === 'W')
    .map(callClue);

  let pool = shuffle(playEvents(lengths), rng);
  let count = solutions({ lengths }, clues).length;
  while (count > 1) {
    const scored = pool
      .map((clue) => ({ clue, left: solutions({ lengths }, [...clues, clue]).length }))
      .filter((x) => x.left < count);
    const target = hard ? Math.max(...scored.map((x) => x.left)) : Math.min(...scored.map((x) => x.left));
    const pick = scored.find((x) => x.left === target)!;
    clues.push(pick.clue);
    // Der spilles kun ud én gang.
    pool = pool.filter((c) => c !== pick.clue && !(pick.clue.kind === 'fourth-best' && c.kind === 'fourth-best'));
    count = pick.left;
  }
  return { kind: 'sudoku', seed, dealer, lengths, clues, hard };
}
