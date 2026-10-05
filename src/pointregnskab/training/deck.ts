import { isDue, newItem, review, type Item, type Outcome } from '../../engine/leitner';
import { shuffle, type Rng } from '../../engine/rng';
import { SYSTEM, type Rule } from '../../system/interpreter';
import { OPENING_PASS, PASS_RULES, type PassRule } from '../model/bidding';
import { allowedOf, type Allowed } from '../model/points';

/**
 * Leitner-bunken med blokke og intervalkort (SPEC-pointregnskab.md, Husketeknikker), der trænes i opvarmningen.
 * Intervallerne læses fra systemfilen og pas-reglerne; intet tal tastes ind.
 */

/** Honnørernes rang (12 = es, 11 = konge, 10 = dame, 9 = bonde) og point. */
const HONOR_RANKS = [12, 11, 10, 9] as const;
const LETTER: Record<number, string> = { 12: 'E', 11: 'K', 10: 'D', 9: 'B' };

export interface Block {
  key: string;
  /** Rangerne fra højeste, fx [12, 11] for E K. */
  ranks: number[];
  points: number;
}

/** Alle blokke med to eller flere honnører i én farve: E K = 7, E D = 6, K D = 5, E K D = 9, D B = 3 osv. */
export const BLOCKS: readonly Block[] = (() => {
  const out: Block[] = [];
  for (let mask = 1; mask < 16; mask++) {
    const ranks = HONOR_RANKS.filter((_, i) => (mask >> i) & 1);
    if (ranks.length < 2) continue;
    out.push({ key: `blok:${ranks.map((r) => LETTER[r]).join('')}`, ranks, points: ranks.reduce((s, r) => s + r - 8, 0) });
  }
  return out;
})();

export type RangeId =
  | 'opening-1-suit'
  | 'opening-1NT'
  | 'opening-2NT'
  | 'opening-2C'
  | 'opening-weak-2'
  | 'opening-3'
  | 'overcall-1'
  | 'overcall-2'
  | 'overcall-1NT'
  | 'takeout-double'
  | 'two-suited'
  | 'dont'
  | 'dont-double'
  | 'opening-pass'
  | 'responder-pass-after-1-suit'
  | 'responder-pass-after-1NT';

export interface RangeCard {
  key: string;
  id: RangeId;
  allowed: Allowed;
  /** Systemfilens meldinger bag kortet (tom for pas). */
  rules: Rule[];
  /** Pas-reglen bag kortet, hvis det er en. */
  pass?: PassRule;
}

const overSuit = (r: Rule) => /^over-1[SHDC]$/.test(r.context);
const cue = (r: Rule) => overSuit(r) && r.call === `2${r.context.slice(-1)}`;

/** Hvilke af systemfilens meldinger hvert intervalkort dækker. */
const SELECT: Partial<Record<RangeId, (r: Rule) => boolean>> = {
  'opening-1-suit': (r) => r.context === 'opening' && /^1[SHDC]$/.test(r.call),
  'opening-1NT': (r) => r.context === 'opening' && r.call === '1NT',
  'opening-2NT': (r) => r.context === 'opening' && r.call === '2NT',
  'opening-2C': (r) => r.context === 'opening' && r.call === '2C',
  'opening-weak-2': (r) => r.context === 'opening' && /^2[SHD]$/.test(r.call),
  'opening-3': (r) => r.context === 'opening' && /^3[SHDC]$/.test(r.call),
  'overcall-1': (r) => overSuit(r) && /^1[SHD]$/.test(r.call),
  'overcall-2': (r) => overSuit(r) && /^2[SHDC]$/.test(r.call) && !cue(r),
  'overcall-1NT': (r) => overSuit(r) && r.call === '1NT',
  'takeout-double': (r) => overSuit(r) && r.call === 'X',
  'two-suited': (r) => overSuit(r) && (cue(r) || r.call === '2NT'),
  dont: (r) => r.context === 'over-1NT' && r.call !== 'X',
  'dont-double': (r) => r.context === 'over-1NT' && r.call === 'X',
};

function rangeCard(id: RangeId): RangeCard {
  const pass = PASS_RULES.find((p) => p.context === id);
  if (pass) return { key: `interval:${id}`, id, allowed: allowedOf(pass.hcp), rules: [], pass };
  if (id === 'opening-pass') return { key: `interval:${id}`, id, allowed: OPENING_PASS, rules: [] };
  const rules = SYSTEM.filter(SELECT[id]!);
  return { key: `interval:${id}`, id, allowed: allowedOf(rules[0].hcp), rules };
}

export const RANGE_IDS: readonly RangeId[] = [
  'opening-1NT',
  'opening-1-suit',
  'opening-pass',
  'responder-pass-after-1-suit',
  'responder-pass-after-1NT',
  'overcall-1',
  'overcall-2',
  'overcall-1NT',
  'takeout-double',
  'two-suited',
  'opening-weak-2',
  'opening-3',
  'opening-2NT',
  'opening-2C',
  'dont',
  'dont-double',
];

export const RANGE_CARDS: readonly RangeCard[] = RANGE_IDS.map(rangeCard);

/** Rækkefølgen, kortene introduceres i: blokke og intervalkort skiftevis, de mest brugte først. */
export const DECK_ORDER: readonly string[] = (() => {
  const blocks = ['EK', 'ED', 'KD', 'EKD', 'DB', 'EB', 'KB', 'EKB', 'EDB', 'KDB', 'EKDB'].map((b) => `blok:${b}`);
  const ranges = RANGE_CARDS.map((c) => c.key);
  const out: string[] = [];
  for (let i = 0; i < Math.max(blocks.length, ranges.length); i++) {
    if (blocks[i]) out.push(blocks[i]);
    if (ranges[i]) out.push(ranges[i]);
  }
  return out;
})();

/** Højst så mange nye kort pr. session. */
export const NEW_PER_SESSION = 3;

/** Opvarmningens kort har regnestykkets tidsgrænse: rigtigt inden for 5 s er hurtigt i Leitner. */
export const DECK_FAST_MS = 5_000;

export type DeckTask =
  | { kind: 'block'; key: string; block: Block }
  /** Fire forskellige intervaller at vælge imellem; ét er rigtigt. */
  | { kind: 'range'; key: string; card: RangeCard; options: Allowed[] };

export type DeckAnswer = { kind: 'block'; points: number } | { kind: 'range'; allowed: Allowed };

const sameAllowed = (a: Allowed, b: Allowed) => JSON.stringify(a) === JSON.stringify(b);

/** Opvarmningens kø: forfaldne kort (ældste først) og derefter nye kort i bunkens rækkefølge. */
export function warmupQueue(items: Record<string, Item>, today: string): string[] {
  const due = Object.entries(items)
    .filter(([key, item]) => DECK_ORDER.includes(key) && isDue(item, today))
    .sort(([ka, a], [kb, b]) => a.due.localeCompare(b.due) || DECK_ORDER.indexOf(ka) - DECK_ORDER.indexOf(kb))
    .map(([key]) => key);
  const fresh = DECK_ORDER.filter((key) => !(key in items)).slice(0, NEW_PER_SESSION);
  return [...due, ...fresh];
}

export function deckTask(key: string, rng: Rng): DeckTask {
  const block = BLOCKS.find((b) => b.key === key);
  if (block) return { kind: 'block', key, block };
  const card = RANGE_CARDS.find((c) => c.key === key);
  if (!card) throw new Error(`Ukendt kort: ${key}`);
  const others: Allowed[] = [];
  for (const c of shuffle([...RANGE_CARDS], rng)) {
    if (others.length === 3) break;
    if (![card.allowed, ...others].some((a) => sameAllowed(a, c.allowed))) others.push(c.allowed);
  }
  return { kind: 'range', key, card, options: shuffle([card.allowed, ...others], rng) };
}

export function deckCorrect(task: DeckTask, answer: DeckAnswer): boolean {
  if (task.kind === 'block') return answer.kind === 'block' && answer.points === task.block.points;
  return answer.kind === 'range' && sameAllowed(answer.allowed, task.card.allowed);
}

/** Flytter kortet i Leitner-bunken efter et svar; et nyt kort oprettes først. */
export function reviewCard(items: Record<string, Item>, key: string, ok: boolean, ms: number, today: string, t: number): Record<string, Item> {
  const outcome: Outcome = !ok ? 'wrong' : ms <= DECK_FAST_MS ? 'fast' : 'slow';
  const item = items[key] ?? newItem(today);
  return { ...items, [key]: review(item, outcome, today, { t, ok, ms }) };
}
