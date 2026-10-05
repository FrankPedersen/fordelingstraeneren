import type { Card } from '../../domain/cards';
import { allows, honorPoints, otherDefender, panelRest, type Allowed, type Defender } from './points';
import { shownPoints, solve, type Ledger, type Solution } from './solver';

/**
 * Begrundelsen i facit (SPEC-pointregnskab.md, Layout, Facit): en af de faste skabeloner, bygget af løserens facit.
 * Skabelonerne "den anden kan ikke have den" og "han skal have den" regner med regnskabspanelets rest (tilladte point
 * minus det viste), som brugeren selv kan se; de bruges kun, når de giver samme svar som løseren.
 */
export type Explanation =
  /**
   * Den anden kan ikke have den: honnøren er mere værd end hans største rest (`gap` = false), eller den passer ikke ind
   * i nogen af hans intervaller sammen med de andre usete honnører (`gap` = true, fx Michaels' 8–15 eller 17+).
   */
  | { kind: 'other-cannot'; card: Card; holder: Defender; other: Defender; rest: Allowed; gap: boolean }
  /** Han skal have den: han kan kun nå sit minimum med disse honnører (honnøren selv er med). */
  | { kind: 'must-have'; card: Card; holder: Defender; rest: Allowed; cards: Card[] }
  /** Kan ikke afgøres: en mulig placering for hver side og modspillerens samlede point i den. */
  | { kind: 'open'; card: Card; west: number; east: number };

/** Summer af alle delmængder af honnørerne (med kortene), til skabelonerne. */
function subsets(cards: readonly Card[]): { cards: Card[]; points: number }[] {
  const out: { cards: Card[]; points: number }[] = [];
  for (let mask = 0; mask < 1 << cards.length; mask++) {
    const chosen = cards.filter((_, i) => (mask >> i) & 1);
    out.push({ cards: chosen, points: chosen.reduce((s, c) => s + honorPoints(c), 0) });
  }
  return out;
}

const restOf = (ledger: Ledger, d: Defender): Allowed => panelRest(ledger[d].allowed, shownPoints(ledger[d].shown));

const maxOf = (allowed: Allowed): number => (allowed.length ? allowed[allowed.length - 1][1] : -1);

/** Den anden kan ikke have honnøren: ingen af hans muligheder med den passer i hans rest. */
function otherCannot(ledger: Ledger, card: Card, holder: Defender): Explanation | null {
  const other = otherDefender(holder);
  const rest = restOf(ledger, other);
  const value = honorPoints(card);
  if (value > maxOf(rest)) return { kind: 'other-cannot', card, holder, other, rest, gap: false };
  const others = ledger.unseen.filter((c) => c !== card);
  if (subsets(others).every((s) => !allows(rest, value + s.points))) {
    return { kind: 'other-cannot', card, holder, other, rest, gap: true };
  }
  return null;
}

/** Han skal have honnøren: alle måder, han kan nå sin rest på, bruger den. */
function mustHave(ledger: Ledger, card: Card, holder: Defender): Explanation | null {
  const rest = restOf(ledger, holder);
  const ways = subsets(ledger.unseen).filter((s) => allows(rest, s.points));
  if (!ways.length || !ways.every((s) => s.cards.includes(card))) return null;
  const cards = ledger.unseen.filter((c) => ways.every((s) => s.cards.includes(c)));
  return { kind: 'must-have', card, holder, rest, cards };
}

/**
 * Facit-sætningens indhold for en uset honnør, eller null, når ingen skabelon forklarer løserens svar (generatoren
 * forkaster så opgaven).
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
  return otherCannot(ledger, card, placement) ?? mustHave(ledger, card, placement);
}

/** Kan svaret aflæses direkte? Det kan det, når en modspiller har vist alt, han kan have, så resten sidder hos den anden. */
export function directlyReadable(ledger: Ledger): boolean {
  return (['W', 'E'] as const).some((d) => maxOf(restOf(ledger, d)) === 0);
}
