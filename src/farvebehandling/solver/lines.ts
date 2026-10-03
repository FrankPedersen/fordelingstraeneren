import { JACK, rankFromSymbol, rankText, type Rank } from '../model/cards';
import { END, LEAD, THIRD, type Game, type Hand } from './game';

/**
 * Linjeformatet fra SPEC-farvebehandling.md. En linje er en plan for de første runder; efter sidste trin spiller
 * løseren resten optimalt ud fra de kort, der er set.
 *
 * Kendt sidning: kan en modspiller ikke bekende, er sidningen kendt, og linjen slutter med det samme; løseren spiller
 * resten optimalt (spec 3.1). Uden reglen giver linje B i B432 / E 10 6 5 kun 89,6 % for 2 stik, fordi linjen lader
 * Vest stikke billigt med 9'eren, når Øst ikke kan bekende.
 */
export interface LineStep {
  leadFrom: Hand;
  /** Konkret kort ("A", "T", "4"), "low" eller "high". */
  card: string;
  third?: { ifSecondPlays: string; play: string; else: string };
  branches?: { if: { fallen?: string[]; showsOut?: 'V' | 'Ø' }; goto: number }[];
}

export interface Line {
  id: string;
  text: string;
  steps: LineStep[];
}

export interface LineMask {
  /** Tilladte barn-slots for spilføreren (1 = tilladt). */
  allowed: Uint8Array;
  errors: string[];
}

interface OpponentPlay {
  seat: 'V' | 'Ø';
  high: Rank;
  low: Rank;
}

interface PathState {
  step: number;
  /** De fysiske kort, der er tilbage i hver hånd (linjens kort). */
  physical: Record<Hand, Rank[]>;
  /** De abstrakte kort i træet (det laveste kort i en gruppe fjernes). */
  abstract: Record<Hand, Rank[]>;
  playedOwn: Set<Rank>;
  opponents: OpponentPlay[];
  /** Kunne modspilleren ikke bekende i denne runde? */
  showedOut: Set<'V' | 'Ø'>;
}

const other = (h: Hand): Hand => (h === 'N' ? 'S' : 'N');

function stepNumberErrors(line: Line): string[] {
  const errors: string[] = [];
  const end = line.steps.length + 1;
  line.steps.forEach((step, i) => {
    const number = i + 1;
    for (const branch of step.branches ?? []) {
      if (branch.goto === number + 1) errors.push(`Trin ${number}: en gren peger på det næste trin (${branch.goto}).`);
      if (branch.goto < 1 || branch.goto > end || !Number.isInteger(branch.goto)) {
        errors.push(`Trin ${number}: grenen peger på trin ${branch.goto}, som ikke findes.`);
      }
    }
  });
  return errors;
}

/** Vælger et fysisk kort efter "low", "high" eller et konkret kort. null, hvis det ikke kan spilles. */
function choose(physical: readonly Rank[], card: string): Rank | null {
  if (!physical.length) return null;
  if (card === 'low') return Math.min(...physical);
  if (card === 'high') return Math.max(...physical);
  const r = rankFromSymbol(card);
  return physical.includes(r) ? r : null;
}

/** Det abstrakte barn-slot, der svarer til det fysiske kort: samme plads i hånden, talt fra toppen. */
function slotFor(game: Game, node: number, hand: Hand, state: PathState, card: Rank, isLead: boolean): number {
  const phys = [...state.physical[hand]].sort((a, b) => b - a);
  const abs = [...state.abstract[hand]].sort((a, b) => b - a);
  const a = abs[phys.indexOf(card)];
  const cs = game.childStart[node];
  for (let x = 0; x < game.childCount[node]; x++) {
    const slot = cs + x;
    if (isLead && game.slotHand[slot] !== (hand === 'N' ? 0 : 1)) continue;
    if (game.slotHigh[slot] >= a && a >= game.slotLow[slot]) return slot;
  }
  return -1;
}

/** Kan intervallerne for modspillets spillede kort dække alle de nævnte modpartskort (hvert kort sit interval)? */
function opponentsFallen(required: Rank[], plays: readonly OpponentPlay[]): boolean {
  const used = plays.map(() => false);
  for (const r of [...required].sort((a, b) => a - b)) {
    let best = -1;
    plays.forEach((p, i) => {
      if (used[i] || p.high === 0 || p.low > r || p.high < r) return;
      if (best < 0 || p.high < plays[best].high) best = i;
    });
    if (best < 0) return false;
    used[best] = true;
  }
  return true;
}

export function lineMask(game: Game, line: Line): LineMask {
  const allowed = new Uint8Array(game.children.length);
  const errors = new Set<string>(stepNumberErrors(line));
  const own = new Set<Rank>([...game.north, ...game.south]);

  const allowSubtree = (node: number) => {
    for (let n = node; n < game.subtreeEnd[node]; n++) {
      const k = game.kind[n];
      if (k === LEAD || k === THIRD) for (let x = 0; x < game.childCount[n]; x++) allowed[game.childStart[n] + x] = 1;
    }
  };

  function nextStep(state: PathState): number {
    const step = line.steps[state.step];
    for (const branch of step.branches ?? []) {
      const cond = branch.if;
      if (cond.showsOut && !state.showedOut.has(cond.showsOut)) continue;
      if (cond.fallen) {
        const cards = cond.fallen.map(rankFromSymbol);
        const ownCards = cards.filter((r) => own.has(r));
        if (!ownCards.every((r) => state.playedOwn.has(r))) continue;
        if (!opponentsFallen(cards.filter((r) => !own.has(r)), state.opponents)) continue;
      }
      return branch.goto - 1;
    }
    return state.step + 1;
  }

  function visitLead(node: number, state: PathState) {
    if (game.kind[node] === END) return;
    if (state.step >= line.steps.length) {
      allowSubtree(node);
      return;
    }
    const step = line.steps[state.step];
    const number = state.step + 1;
    const card = choose(state.physical[step.leadFrom], step.card);
    const slot = card === null ? -1 : slotFor(game, node, step.leadFrom, state, card, true);
    if (card === null || slot < 0) {
      errors.add(`Trin ${number}: ${cardName(step.card)} kan ikke spilles fra ${handName(step.leadFrom)}.`);
      allowSubtree(node);
      return;
    }
    allowed[slot] = 1;
    const leader = step.leadFrom;
    const after: PathState = {
      ...state,
      physical: { ...state.physical, [leader]: state.physical[leader].filter((r) => r !== card) },
      abstract: { ...state.abstract, [leader]: removeOne(state.abstract[leader], game.slotLow[slot]) },
      playedOwn: new Set([...state.playedOwn, card]),
      showedOut: new Set(),
    };
    visitSecond(game.children[slot], after, leader, step, number);
  }

  function visitSecond(node: number, state: PathState, leader: Hand, step: LineStep, number: number) {
    const seat = leader === 'N' ? 'Ø' : 'V';
    for (let x = 0; x < game.childCount[node]; x++) {
      const slot = game.childStart[node] + x;
      const play = { seat, high: game.slotHigh[slot], low: game.slotLow[slot] } as OpponentPlay;
      if (play.high === 0) {
        // Kendt sidning: modspilleren kan ikke bekende, så linjen slutter, og løseren spiller resten optimalt.
        allowSubtree(game.children[slot]);
        continue;
      }
      const next: PathState = { ...state, opponents: [...state.opponents, play] };
      visitThird(game.children[slot], next, leader, step, number, play);
    }
  }

  function visitThird(node: number, state: PathState, leader: Hand, step: LineStep, number: number, second: OpponentPlay) {
    const hand = other(leader);
    const cs = game.childStart[node];
    if (game.slotHigh[cs] === 0 && game.childCount[node] === 1) {
      // Hånden har ingen kort i farven.
      allowed[cs] = 1;
      visitFourth(game.children[cs], state, leader);
      return;
    }
    let want = 'low';
    if (step.third) {
      const cond = step.third.ifSecondPlays;
      const holds =
        second.high === 0 ? false : cond === 'low' ? second.high < JACK : second.high >= rankFromSymbol(cond) && rankFromSymbol(cond) >= second.low;
      want = holds ? step.third.play : step.third.else;
    }
    const card = choose(state.physical[hand], want);
    const slot = card === null ? -1 : slotFor(game, node, hand, state, card, false);
    if (card === null || slot < 0) {
      errors.add(`Trin ${number}: ${cardName(want)} kan ikke spilles fra ${handName(hand)} som 3. hånd.`);
      allowSubtree(node);
      return;
    }
    allowed[slot] = 1;
    const next: PathState = {
      ...state,
      physical: { ...state.physical, [hand]: state.physical[hand].filter((r) => r !== card) },
      abstract: { ...state.abstract, [hand]: removeOne(state.abstract[hand], game.slotLow[slot]) },
      playedOwn: new Set([...state.playedOwn, card]),
    };
    visitFourth(game.children[slot], next, leader);
  }

  function visitFourth(node: number, state: PathState, leader: Hand) {
    const seat = leader === 'N' ? 'V' : 'Ø';
    for (let x = 0; x < game.childCount[node]; x++) {
      const slot = game.childStart[node] + x;
      const play = { seat, high: game.slotHigh[slot], low: game.slotLow[slot] } as OpponentPlay;
      const lead = game.children[slot];
      if (game.kind[lead] === END) continue;
      if (play.high === 0) {
        // Kendt sidning (se ovenfor).
        allowSubtree(lead);
        continue;
      }
      const next: PathState = { ...state, opponents: [...state.opponents, play] };
      visitLead(lead, { ...next, step: nextStep(next) });
    }
  }

  const root = game.root;
  if (game.kind[root] !== END) {
    if (!line.steps.length) allowSubtree(root);
    else
      visitLead(root, {
        step: 0,
        physical: { N: [...game.north], S: [...game.south] },
        abstract: { N: [...game.north], S: [...game.south] },
        playedOwn: new Set(),
        opponents: [],
        showedOut: new Set(),
      });
  }
  return { allowed, errors: [...errors] };
}

function removeOne(cards: readonly Rank[], card: Rank): Rank[] {
  const i = cards.indexOf(card);
  return i < 0 ? [...cards] : [...cards.slice(0, i), ...cards.slice(i + 1)];
}

function cardName(card: string): string {
  if (card === 'low') return 'et lille kort';
  if (card === 'high') return 'det højeste kort';
  return rankText(rankFromSymbol(card));
}

function handName(hand: Hand): string {
  return hand === 'N' ? 'bordet' : 'hånden';
}

/** Fejl i en linje: umulige trin og grene, der peger på det næste trin. Tom liste = linjen er gyldig. */
export function validateLine(game: Game, line: Line): string[] {
  return lineMask(game, line).errors;
}

