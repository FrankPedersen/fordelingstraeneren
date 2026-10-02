import { suitLengths, type Card, type SuitLengths } from '../domain/cards';
import { patternOf } from '../domain/patterns';
import file from './dk-2over1.json';

export type Suit = 'S' | 'H' | 'D' | 'C';

const SUIT_INDEX: Record<Suit, number> = { S: 0, H: 1, D: 2, C: 3 };
const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };

type SuitCounts = Partial<Record<Suit, number>>;

/** Hårde fordelingskrav (SPEC.md, Meldetolkning). */
export type Requirement =
  | { min: SuitCounts }
  | { max: SuitCounts }
  | { exact: SuitCounts }
  | { geq: [Suit, Suit] }
  | { longest: Suit }
  | { balanced: true }
  | { allOf: Requirement[] }
  | { anyOf: Requirement[] };

export interface Rule {
  call: string;
  context: string;
  priority: number;
  /** Ét hp-interval eller flere, fx 8–15 eller 17+. */
  hcp: [number, number] | [number, number][];
  /** Det eneste, løseren i 13-sudoku bruger. */
  shows: Requirement;
  text: string;
  /** Kræver hold i åbnerens farve. Bruges kun af meldegiveren, ikke af løseren. */
  stopper?: boolean;
  /** Bemærkning, fx et åbent punkt fra SPEC.md. */
  note?: string;
}

const BALANCED = new Set(['4-3-3-3', '4-4-3-2', '5-3-3-2']);

const counts = (c: SuitCounts) => Object.entries(c) as [Suit, number][];

/** Opfylder farvelængderne (♠♥♦♣) kravet? "longest" tæller lige lange farver med. */
export function satisfies(req: Requirement, lengths: SuitLengths): boolean {
  const len = (s: Suit) => lengths[SUIT_INDEX[s]];
  if ('allOf' in req) return req.allOf.every((r) => satisfies(r, lengths));
  if ('anyOf' in req) return req.anyOf.some((r) => satisfies(r, lengths));
  if ('min' in req) return counts(req.min).every(([s, n]) => len(s) >= n);
  if ('max' in req) return counts(req.max).every(([s, n]) => len(s) <= n);
  if ('exact' in req) return counts(req.exact).every(([s, n]) => len(s) === n);
  if ('geq' in req) return len(req.geq[0]) >= len(req.geq[1]);
  if ('longest' in req) return len(req.longest) === Math.max(...lengths);
  if ('balanced' in req) return BALANCED.has(patternOf(lengths).id);
  throw new Error(`Ukendt krav: ${JSON.stringify(req)}`);
}

function isRequirement(v: unknown): v is Requirement {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  const keys = Object.keys(r);
  if (keys.length !== 1) return false;
  const isCounts = (c: unknown) =>
    typeof c === 'object' && c !== null && Object.entries(c).every(([s, n]) => s in SUIT_INDEX && Number.isInteger(n));
  switch (keys[0]) {
    case 'allOf':
    case 'anyOf':
      return Array.isArray(r[keys[0]]) && (r[keys[0]] as unknown[]).every(isRequirement);
    case 'min':
    case 'max':
    case 'exact':
      return isCounts(r[keys[0]]);
    case 'geq':
      return Array.isArray(r.geq) && r.geq.length === 2 && r.geq.every((s) => s in SUIT_INDEX);
    case 'longest':
      return typeof r.longest === 'string' && r.longest in SUIT_INDEX;
    case 'balanced':
      return r.balanced === true;
    default:
      return false;
  }
}

/** Læser systemfilen og kontrollerer hver regel, så en fejl i filen opdages med det samme. */
function parseRules(rules: unknown[]): Rule[] {
  return rules.map((raw, i) => {
    const r = raw as Rule;
    const intervals = Array.isArray(r.hcp?.[0]) ? (r.hcp as [number, number][]) : [r.hcp as [number, number]];
    const ok =
      typeof r.call === 'string' &&
      typeof r.context === 'string' &&
      Number.isInteger(r.priority) &&
      intervals.every((h) => Array.isArray(h) && h.length === 2 && h[0] <= h[1]) &&
      isRequirement(r.shows) &&
      typeof r.text === 'string';
    if (!ok) throw new Error(`Ugyldig regel nr. ${i + 1} i systemfilen: ${JSON.stringify(raw)}`);
    return r;
  });
}

/** Reglerne fra system/dk-2over1.json. */
export const SYSTEM: readonly Rule[] = parseRules(file.rules);

export function contextsOf(rules: readonly Rule[]): string[] {
  return [...new Set(rules.map((r) => r.context))];
}

/** Åbnerens farve i en indmeldingssituation, fx "over-1H" → H. */
export function theirSuit(context: string): Suit | undefined {
  const m = /^over-1([SHDC])$/.exec(context);
  return m ? (m[1] as Suit) : undefined;
}

/** Honnørpoint: es 4, konge 3, dame 2, bonde 1. */
export function hcpOf(cards: readonly Card[]): number {
  return cards.reduce((sum, c) => sum + Math.max(0, (c % 13) - 8), 0);
}

/** Hold i farven: es, konge med mindst ét kort ved siden, dame tredje eller bonde fjerde. */
export function hasStopper(cards: readonly Card[], suit: number): boolean {
  const ranks = cards.filter((c) => Math.floor(c / 13) === suit).map((c) => c % 13);
  const n = ranks.length;
  return ranks.includes(12) || (ranks.includes(11) && n >= 2) || (ranks.includes(10) && n >= 3) || (ranks.includes(9) && n >= 4);
}

function inRange(hcp: Rule['hcp'], points: number): boolean {
  const intervals = Array.isArray(hcp[0]) ? (hcp as [number, number][]) : [hcp as [number, number]];
  return intervals.some(([lo, hi]) => points >= lo && points <= hi);
}

/** Den første regel i prioritetsrækkefølge, som hånden opfylder; ellers pas (null). */
export function chooseCall(
  context: string,
  cards: readonly Card[],
  their?: Suit,
  rules: readonly Rule[] = SYSTEM,
): Rule | null {
  const lengths = suitLengths(cards);
  const points = hcpOf(cards);
  const candidates = rules.filter((r) => r.context === context).sort((a, b) => a.priority - b.priority);
  return (
    candidates.find(
      (r) =>
        inRange(r.hcp, points) &&
        satisfies(r.shows, lengths) &&
        (!r.stopper || (their !== undefined && hasStopper(cards, SUIT_INDEX[their]))),
    ) ?? null
  );
}

/** Meldingen med farvesymbol, fx 1♥ og 2NT; X er en dobling. */
export function callText(call: string): string {
  if (call === 'X') return 'dobling';
  return call.replace(/[SHDC]$/, (s) => SUIT_SYMBOL[s as Suit]);
}
