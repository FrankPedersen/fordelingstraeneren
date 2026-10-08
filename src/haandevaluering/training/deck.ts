import { PATTERNS } from '../../domain/patterns';
import { isDue, newItem, review, type Item, type Outcome } from '../../engine/leitner';
import { shuffle, type Rng } from '../../engine/rng';
import { expectedTricks, LIMITS, P_RANGE, partnerNeeds, SHORTCUT, SHORTNESS_BY_PATTERN, shortnessOfLength } from '../model/pmodel';

/**
 * Leitner-bunken med nøgletal og kortfarvepoint pr. mønster (SPEC-haandevaluering.md, Husketeknikker; Claude Codes
 * forslag til bunken). Facit regnes af modellen; kortene har kun deres nøgle.
 */

/** De 13 mønstre i specens tabel: de 13 hyppigste. */
export const DECK_PATTERNS: readonly string[] = PATTERNS.slice(0, 13).map((p) => p.id);

/** Ankrene: udgang, slem og storeslem = 28½ – 35 – 41. */
export type Anchor = 'game' | 'slam' | 'grand';
export const ANCHORS: readonly Anchor[] = ['game', 'slam', 'grand'];

/** Genvejens led: + 1 pr. es, − ½ pr. dame, − ½ pr. knægt, + ¼ pr. tier. */
export type ShortcutTerm = 'ace' | 'queen' | 'jack' | 'ten';
export const SHORTCUT_TERMS: readonly ShortcutTerm[] = ['ace', 'queen', 'jack', 'ten'];

/** Korthed 5-3-1: renonce, singleton og dobbeltton. */
export const SHORTNESS_LENGTHS: readonly number[] = [0, 1, 2];

/** Makkers krav for udgang: MODEL.md-tabellens rækker. */
export const PARTNER_ROWS: readonly number[] = [12, 14, 16, 18, 21, 24];

/** Stikforventningen øves ved tabellens P-værdier op til 32, hvor huskeversionen P/3 gælder. */
export const TRICK_PS: readonly number[] = [24, 26, 28.5, 30, 32];

/** Stikkortets andre svarmuligheder er tabellens værdi ved P ± 2, ± 4 og så videre, de nærmeste først. */
const TRICK_OFFSETS = [2, -2, 4, -4, 6, -6, 8];

const groups: string[][] = [
  ANCHORS.map((a) => `anker:${a}`),
  SHORTNESS_LENGTHS.map((l) => `korthed:${l}`),
  SHORTCUT_TERMS.map((t) => `genvej:${t}`),
  DECK_PATTERNS.map((id) => `moenster:${id}`),
  PARTNER_ROWS.map((p) => `makker:${p}`),
  ['stik'],
];

/** Rækkefølgen, kortene introduceres i: grupperne på skift, så hver session har lidt af det hele. */
export const DECK_ORDER: readonly string[] = (() => {
  const out: string[] = [];
  for (let i = 0; out.length < groups.flat().length; i++) for (const g of groups) if (g[i]) out.push(g[i]);
  return out;
})();

/** Højst så mange nye kort pr. session. */
export const NEW_PER_SESSION = 3;

/** Rigtigt inden for lynrundens tidsgrænse (8 s) er hurtigt i Leitner (Claude Codes valg). */
export const DECK_FAST_MS = 8_000;

export type DeckTask =
  /** Et tal tastes på sporets talpanel (med ½ og ¼). */
  | { kind: 'number'; key: string; answer: number }
  /** Fire svarmuligheder; ét er rigtigt. Stikkortet har P med. */
  | { kind: 'choice'; key: string; options: number[]; answer: number; P?: number };

/** Genvejens led som svarmuligheder. */
const SHORTCUT_OPTIONS = [1, 0.5, 0.25, 0, -0.25, -0.5, -1];

const roundTenth = (x: number) => Math.round(x * 10) / 10;

export function deckTask(key: string, rng: Rng): DeckTask {
  const [kind, arg] = key.split(':');
  switch (kind) {
    case 'anker': {
      const anchor = arg as Anchor;
      if (!ANCHORS.includes(anchor)) break;
      return { kind: 'number', key, answer: LIMITS[anchor] };
    }
    case 'korthed':
      if (!SHORTNESS_LENGTHS.includes(Number(arg))) break;
      return { kind: 'number', key, answer: shortnessOfLength(Number(arg)) };
    case 'moenster':
      if (!DECK_PATTERNS.includes(arg)) break;
      return { kind: 'number', key, answer: SHORTNESS_BY_PATTERN[arg] };
    case 'makker':
      if (!PARTNER_ROWS.includes(Number(arg))) break;
      return { kind: 'number', key, answer: partnerNeeds(Number(arg)) };
    case 'genvej': {
      const term = arg as ShortcutTerm;
      if (!SHORTCUT_TERMS.includes(term)) break;
      const answer = SHORTCUT[term];
      const others = shuffle(SHORTCUT_OPTIONS.filter((x) => x !== answer), rng).slice(0, 3);
      return { kind: 'choice', key, answer, options: [answer, ...others].sort((a, b) => b - a) };
    }
    case 'stik': {
      // Svarmulighederne er tabellens stikforventning ved P og ved de nærmeste P ± 2, ± 4 … inden for tabellen, så
      // huskeversionen P/3 (inden for 0,2 stik) peger på det rigtige svar. Lige langt væk vælges tilfældigt.
      const P = TRICK_PS[rng.int(TRICK_PS.length)];
      const inRange = TRICK_OFFSETS.filter((d) => P + d >= P_RANGE.min && P + d <= P_RANGE.max);
      const nearest = shuffle(inRange, rng).sort((a, b) => Math.abs(a) - Math.abs(b)).slice(0, 3);
      const options = [0, ...nearest].map((d) => roundTenth(expectedTricks(P + d))).sort((a, b) => a - b);
      return { kind: 'choice', key, P, answer: roundTenth(expectedTricks(P)), options };
    }
  }
  throw new Error(`Ukendt kort: ${key}`);
}

export function deckCorrect(task: DeckTask, answer: number): boolean {
  return answer === task.answer;
}

/** Opvarmningens kø: forfaldne kort (ældste først) og derefter nye kort i bunkens rækkefølge. */
export function warmupQueue(items: Record<string, Item>, today: string): string[] {
  const due = Object.entries(items)
    .filter(([key, item]) => DECK_ORDER.includes(key) && isDue(item, today))
    .sort(([ka, a], [kb, b]) => a.due.localeCompare(b.due) || DECK_ORDER.indexOf(ka) - DECK_ORDER.indexOf(kb))
    .map(([key]) => key);
  const fresh = DECK_ORDER.filter((key) => !(key in items)).slice(0, NEW_PER_SESSION);
  return [...due, ...fresh];
}

/** Flytter kortet i Leitner-bunken efter et svar; et nyt kort oprettes først. */
export function reviewCard(
  items: Record<string, Item>,
  key: string,
  ok: boolean,
  ms: number,
  today: string,
  t: number,
): Record<string, Item> {
  const outcome: Outcome = !ok ? 'wrong' : ms <= DECK_FAST_MS ? 'fast' : 'slow';
  const item = items[key] ?? newItem(today);
  return { ...items, [key]: review(item, outcome, today, { t, ok, ms }) };
}
