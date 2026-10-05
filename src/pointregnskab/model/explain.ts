import type { Card } from '../../domain/cards';
import { allows, honorPoints, otherDefender, panelRest, suitOf, type Allowed, type Defender } from './points';
import { shownPoints, solve, type Ledger, type Solution } from './solver';

/**
 * Begrundelsen i facit (SPEC-pointregnskab.md, Layout, Facit): en af de faste skabeloner, bygget af løserens facit.
 * Skabelonerne "den anden kan ikke have den" og "han skal have den" regner med regnskabspanelets rest (tilladte point
 * minus det viste), som brugeren selv kan se; de bruges kun, når de giver samme svar som løseren. Med kendte længder
 * (Fuldt regnskab og niveau 5) kommer to længdeskabeloner til: "farven er brugt op" og "ikke plads". Bruges både point
 * og længder, nævner facit begge: først længderne, så pointene.
 */

/** En kendsgerning om længderne: en modspiller har færre kort tilbage i en farve end de usete honnører i den. */
export type LengthFact =
  /** Farven er brugt op: han har vist alle sine kort i farven, så farvens usete honnører sidder hos den anden. */
  | { kind: 'used-up'; defender: Defender; suit: number; length: number; cards: Card[] }
  /** Ikke plads: han har `room` kort tilbage i farven, men flere usete honnører, så mindst én sidder hos den anden. */
  | { kind: 'no-room'; defender: Defender; suit: number; room: number; cards: Card[] };

export type Explanation =
  /**
   * Den anden kan ikke have den: honnøren er mere værd end hans største rest (`gap` = false), eller den passer ikke ind
   * i nogen af hans intervaller sammen med de andre usete honnører (`gap` = true, fx Michaels' 8–15 eller 17+).
   * `facts` er de længder, der også bruges (tom, når pointene alene afgør det).
   */
  | { kind: 'other-cannot'; card: Card; holder: Defender; other: Defender; rest: Allowed; gap: boolean; facts: LengthFact[] }
  /** Han skal have den: han kan kun nå sit minimum med disse honnører (honnøren selv er med). */
  | { kind: 'must-have'; card: Card; holder: Defender; rest: Allowed; cards: Card[]; facts: LengthFact[] }
  /** Farven er brugt op: længderne alene afgør det. */
  | { kind: 'used-up'; card: Card; holder: Defender; fact: Extract<LengthFact, { kind: 'used-up' }> }
  /** Kan ikke afgøres: en mulig placering for hver side og modspillerens samlede point i den. */
  | { kind: 'open'; card: Card; west: number; east: number };

const restOf = (ledger: Ledger, d: Defender): Allowed => panelRest(ledger[d].allowed, shownPoints(ledger[d].shown));

const maxOf = (allowed: Allowed): number => (allowed.length ? allowed[allowed.length - 1][1] : -1);

const pointsOf = (cards: readonly Card[]) => cards.reduce((s, c) => s + honorPoints(c), 0);

/** Alle delmængder af honnørerne. */
function subsets(cards: readonly Card[]): Card[][] {
  const out: Card[][] = [];
  for (let mask = 0; mask < 1 << cards.length; mask++) out.push(cards.filter((_, i) => (mask >> i) & 1));
  return out;
}

/** Længdernes kendsgerninger: for hver modspiller og farve med færre kort tilbage end usete honnører. */
export function lengthFacts(ledger: Ledger): LengthFact[] {
  const facts: LengthFact[] = [];
  for (const defender of ['W', 'E'] as const) {
    const lengths = ledger[defender].lengths;
    if (!lengths) continue;
    for (let suit = 0; suit < 4; suit++) {
      const cards = ledger.unseen.filter((c) => suitOf(c) === suit);
      const room = lengths[suit] - ledger[defender].shown.filter((c) => suitOf(c) === suit).length;
      if (!cards.length || room >= cards.length) continue;
      facts.push(room <= 0 ? { kind: 'used-up', defender, suit, length: lengths[suit], cards } : { kind: 'no-room', defender, suit, room, cards });
    }
  }
  return facts;
}

/** Passer en fordeling af de usete honnører med kendsgerningerne? `share` er modspilleren `who`s del. */
function fits(ledger: Ledger, facts: readonly LengthFact[], who: Defender, share: readonly Card[]): boolean {
  return facts.every((f) => {
    const own = f.defender === who ? share : ledger.unseen.filter((c) => !share.includes(c));
    const room = f.kind === 'used-up' ? 0 : f.room;
    return f.cards.filter((c) => own.includes(c)).length <= room;
  });
}

/** Den anden kan ikke have honnøren: ingen af hans muligheder med den passer i hans rest (og med længderne). */
function otherCannot(ledger: Ledger, card: Card, holder: Defender, facts: LengthFact[]): Explanation | null {
  const other = otherDefender(holder);
  const rest = restOf(ledger, other);
  if (!facts.length && honorPoints(card) > maxOf(rest)) return { kind: 'other-cannot', card, holder, other, rest, gap: false, facts };
  const others = ledger.unseen.filter((c) => c !== card);
  const possible = subsets(others).some((s) => {
    const share = [card, ...s];
    return allows(rest, pointsOf(share)) && fits(ledger, facts, other, share);
  });
  return possible ? null : { kind: 'other-cannot', card, holder, other, rest, gap: true, facts };
}

/** Han skal have honnøren: alle måder, han kan nå sin rest på (med længderne), bruger den. */
function mustHave(ledger: Ledger, card: Card, holder: Defender, facts: LengthFact[]): Explanation | null {
  const rest = restOf(ledger, holder);
  const ways = subsets(ledger.unseen).filter((s) => allows(rest, pointsOf(s)) && fits(ledger, facts, holder, s));
  if (!ways.length || !ways.every((s) => s.includes(card))) return null;
  const cards = ledger.unseen.filter((c) => ways.every((s) => s.includes(c)));
  return { kind: 'must-have', card, holder, rest, cards, facts };
}

/** Delmængder af kendsgerningerne med 1 til 3 elementer, de mindste først. */
function factSets(facts: readonly LengthFact[]): LengthFact[][] {
  const out: LengthFact[][] = [];
  for (let size = 1; size <= Math.min(3, facts.length); size++) {
    for (let mask = 0; mask < 1 << facts.length; mask++) {
      const chosen = facts.filter((_, i) => (mask >> i) & 1);
      if (chosen.length === size) out.push(chosen);
    }
  }
  return out;
}

/**
 * Facit-sætningens indhold for en uset honnør, eller null, når ingen skabelon forklarer løserens svar (generatoren
 * forkaster så opgaven). Pointene alene prøves først, så "farven er brugt op" og til sidst point med så få længder
 * som muligt.
 */
export function explain(ledger: Ledger, card: Card, solution: Solution = solve(ledger)): Explanation | null {
  const placement = solution.answer.get(card);
  if (placement === undefined) throw new Error('Honnøren er ikke uset');
  const i = ledger.unseen.indexOf(card);
  if (placement === 'open') {
    const total = (d: Defender, a: readonly Defender[]) =>
      shownPoints(ledger[d].shown) + ledger.unseen.reduce((s, c, j) => s + (a[j] === d ? honorPoints(c) : 0), 0);
    const withWest = solution.feasible.find((a) => a[i] === 'W');
    const withEast = solution.feasible.find((a) => a[i] === 'E');
    if (!withWest || !withEast) return null;
    return { kind: 'open', card, west: total('W', withWest), east: total('E', withEast) };
  }
  const byPoints = otherCannot(ledger, card, placement, []) ?? mustHave(ledger, card, placement, []);
  if (byPoints) return byPoints;
  const facts = lengthFacts(ledger);
  const usedUp = facts.find((f) => f.kind === 'used-up' && f.defender !== placement && f.cards.includes(card));
  if (usedUp?.kind === 'used-up') return { kind: 'used-up', card, holder: placement, fact: usedUp };
  for (const set of factSets(facts)) {
    const found = otherCannot(ledger, card, placement, set) ?? mustHave(ledger, card, placement, set);
    if (found) return found;
  }
  return null;
}

/** Ændrer længderne facit for honnøren? Uden længder ville svaret være "kan ikke afgøres". */
export function lengthsDecide(ledger: Ledger, card: Card, solution: Solution = solve(ledger)): boolean {
  if (!ledger.W.lengths && !ledger.E.lengths) return false;
  const without = solve({ ...ledger, W: { ...ledger.W, lengths: undefined }, E: { ...ledger.E, lengths: undefined } });
  return without.answer.get(card) !== solution.answer.get(card);
}

/** Kan svaret aflæses direkte? Det kan det, når en modspiller har vist alt, han kan have, så resten sidder hos den anden. */
export function directlyReadable(ledger: Ledger): boolean {
  return (['W', 'E'] as const).some((d) => maxOf(restOf(ledger, d)) === 0);
}
