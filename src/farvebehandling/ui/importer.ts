import { ALL_RANKS, type Rank } from '../model/cards';

/**
 * Import i Analyse (SPEC-analyse-situation.md, leverancetrin 3): en kombination skrevet som bordet-hånden, en LIN-streng
 * eller BBO-handviewerens adresse. Kun den indsatte tekst læses; intet hentes fra nettet.
 *
 * - Bordet-hånden: "AK65-J43" eller "EK65-B43". Står der E, D eller B, er teksten dansk (E K D B), ellers engelsk
 *   (A K Q J T). 10 og T er begge 10'eren, og mellemrum ignoreres. Stregen kan være -, –, — eller /.
 * - LIN: `md|` giver hænderne i rækkefølgen Syd, Vest, Nord, Øst efter cifferet for giveren. Mangler én hånd, er den de
 *   resterende kort.
 * - BBO-handviewerens adresse med `lin=` eller med `n=`, `s=`, `e=` og `w=`; uden dem er det et kort link.
 */

export type ImportSeat = 'N' | 'S' | 'E' | 'W';
export type ImportSuit = 'S' | 'H' | 'D' | 'C';

/** Én af spillets 8 kombinationer: for hver farve Nord–Syd og Øst–Vest. Den første hånd er bordet, den anden hånden. */
export interface DealChoice {
  suit: ImportSuit;
  pair: 'NS' | 'EW';
  north: Rank[];
  south: Rank[];
  /** Kan analyseres: begge hænder har kort i farven, og modparten har mindst ét. */
  usable: boolean;
}

export type ImportError =
  | { kind: 'empty' }
  | { kind: 'shortLink' }
  | { kind: 'unknownSymbol'; symbol: string }
  | { kind: 'duplicate'; rank: Rank; suit?: ImportSuit }
  | { kind: 'separator' }
  | { kind: 'emptyHand' }
  | { kind: 'noOpponents' }
  | { kind: 'handSize'; seat: ImportSeat; count: number }
  | { kind: 'noDeal' };

export type ImportResult =
  | { kind: 'combination'; north: Rank[]; south: Rank[] }
  | { kind: 'deal'; choices: DealChoice[] }
  | { kind: 'error'; error: ImportError };

export const SUITS: readonly ImportSuit[] = ['S', 'H', 'D', 'C'];
export const SUIT_SYMBOL: Record<ImportSuit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };

class ImportFailure extends Error {
  constructor(readonly error: ImportError) {
    super(error.kind);
  }
}
const fail = (error: ImportError): never => {
  throw new ImportFailure(error);
};

const ENGLISH: Record<string, Rank> = { A: 14, K: 13, Q: 12, J: 11, T: 10 };
const DANISH: Record<string, Rank> = { E: 14, K: 13, D: 12, B: 11, T: 10 };

/** Kortene i én tekst (uden mellemrum, store bogstaver), højeste først; et kort to gange er en fejl. */
function ranksOf(text: string, letters: Record<string, Rank>, suit?: ImportSuit): Rank[] {
  const ranks: Rank[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    let rank: Rank | undefined;
    if (ch === '1' && text[i + 1] === '0') {
      rank = 10;
      i++;
    } else if (ch in letters) rank = letters[ch];
    else if (/[2-9]/.test(ch)) rank = Number(ch);
    if (rank === undefined) return fail({ kind: 'unknownSymbol', symbol: ch });
    if (ranks.includes(rank)) return fail(suit ? { kind: 'duplicate', rank, suit } : { kind: 'duplicate', rank });
    ranks.push(rank);
  }
  return ranks.sort((a, b) => b - a);
}

/** Bordet-hånden, fx "AK65-J43" eller "E K 10 5 – B 4 3". */
function parseCombination(text: string): ImportResult {
  const clean = text.replace(/[\s♠♥♦♣]/g, '').toUpperCase();
  const parts = clean.split(/[-–—/]/);
  if (parts.length !== 2) return fail({ kind: 'separator' });
  const letters = /[EDB]/.test(clean) ? DANISH : ENGLISH;
  const north = ranksOf(parts[0], letters), south = ranksOf(parts[1], letters);
  for (const r of north) if (south.includes(r)) return fail({ kind: 'duplicate', rank: r });
  if (!north.length || !south.length) return fail({ kind: 'emptyHand' });
  if (north.length + south.length >= 13) return fail({ kind: 'noOpponents' });
  return { kind: 'combination', north, south };
}

type Hand = Record<ImportSuit, Rank[]>;

/** En hånd i LIN- eller BBO-notation: farvebogstaverne S, H, D og C efterfulgt af kortene, fx "SQ6HKQ84D632CQ832". */
function parseHand(text: string): Hand {
  const hand: Hand = { S: [], H: [], D: [], C: [] };
  const clean = text.replace(/\s/g, '').toUpperCase();
  let suit: ImportSuit | null = null;
  let run = '';
  const flush = () => {
    if (suit) hand[suit] = ranksOf(run, ENGLISH, suit);
    else if (run) fail({ kind: 'unknownSymbol', symbol: run[0] });
    run = '';
  };
  for (const ch of clean) {
    if ((SUITS as readonly string[]).includes(ch)) {
      flush();
      suit = ch as ImportSuit;
    } else run += ch;
  }
  flush();
  return hand;
}

const count = (hand: Hand) => SUITS.reduce((a, s) => a + hand[s].length, 0);

/** Spillets 8 kombinationer ud fra de kendte hænder; mangler én hånd, er den de resterende kort. */
function dealChoices(hands: Partial<Record<ImportSeat, Hand>>): ImportResult {
  const seats = (['S', 'W', 'N', 'E'] as const).filter((s) => hands[s]);
  if (seats.length < 2) return fail({ kind: 'noDeal' });
  for (const seat of seats) {
    const n = count(hands[seat]!);
    if (n !== 13) return fail({ kind: 'handSize', seat, count: n });
  }
  for (const suit of SUITS) {
    const seen = new Set<Rank>();
    for (const seat of seats) {
      for (const r of hands[seat]![suit]) {
        if (seen.has(r)) return fail({ kind: 'duplicate', rank: r, suit });
        seen.add(r);
      }
    }
  }
  const missing = (['N', 'S', 'E', 'W'] as const).filter((s) => !hands[s]);
  if (missing.length === 1) {
    const rest: Hand = { S: [], H: [], D: [], C: [] };
    for (const suit of SUITS) rest[suit] = ALL_RANKS.filter((r) => !seats.some((s) => hands[s]![suit].includes(r)));
    hands = { ...hands, [missing[0]]: rest };
  }
  const choices: DealChoice[] = [];
  for (const suit of SUITS) {
    for (const [pair, first, second] of [['NS', 'N', 'S'], ['EW', 'E', 'W']] as const) {
      const north = hands[first]?.[suit] ?? [], south = hands[second]?.[suit] ?? [];
      choices.push({ suit, pair, north, south, usable: north.length > 0 && south.length > 0 && north.length + south.length < 13 });
    }
  }
  return { kind: 'deal', choices };
}

/** LIN: `md|<giver><Syd>,<Vest>,<Nord>,<Øst>|`; tomme hænder mangler. */
function parseLin(text: string): ImportResult {
  const md = /md\|\s*\d?([^|]*)\|?/i.exec(text);
  if (!md) return fail({ kind: 'noDeal' });
  const parts = md[1].split(',');
  const hands: Partial<Record<ImportSeat, Hand>> = {};
  (['S', 'W', 'N', 'E'] as const).forEach((seat, i) => {
    if (parts[i]?.trim()) hands[seat] = parseHand(parts[i]);
  });
  return dealChoices(hands);
}

/** BBO-handviewerens adresse: `lin=` eller `n=`, `s=`, `e=`, `w=`; ellers er det et kort link. */
function parseAddress(text: string): ImportResult {
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return fail({ kind: 'shortLink' });
  }
  const lin = url.searchParams.get('lin');
  if (lin) return parseLin(lin);
  const hands: Partial<Record<ImportSeat, Hand>> = {};
  for (const seat of ['n', 's', 'e', 'w'] as const) {
    const value = url.searchParams.get(seat);
    if (value) hands[seat.toUpperCase() as ImportSeat] = parseHand(value);
  }
  if (!Object.keys(hands).length) return fail({ kind: 'shortLink' });
  return dealChoices(hands);
}

export function parseImport(text: string): ImportResult {
  const trimmed = text.trim();
  try {
    if (!trimmed) return fail({ kind: 'empty' });
    if (/^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed)) return parseAddress(/^www\./i.test(trimmed) ? `https://${trimmed}` : trimmed);
    if (trimmed.includes('|')) return parseLin(trimmed);
    return parseCombination(trimmed);
  } catch (error) {
    if (error instanceof ImportFailure) return { kind: 'error', error: error.error };
    throw error;
  }
}
