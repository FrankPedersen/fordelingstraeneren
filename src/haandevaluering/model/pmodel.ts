import { suitLengths, type Card } from '../../domain/cards';
import { PATTERNS } from '../../domain/patterns';
import { hasStopper, hcpOf } from '../../system/interpreter';
import model from '../content/p-model.json';

/**
 * P-modellen (SPEC-haandevaluering.md, Fagligt grundlag; docs/MODEL.md). Konstanterne ligger i `content/p-model.json`
 * med henvisning til afsnittet i MODEL.md; her udføres regnereglerne. Alle point er multipla af ¼ og regnes eksakt.
 */

export const P_MODEL = model;

/** Valørerne i kortgiverens kort: 0 er toeren, 12 er esset. */
const ACE = 12;
const KING = 11;
const QUEEN = 10;
const JACK = 9;
const TEN = 8;

const suitOf = (card: Card) => Math.floor(card / 13);
const rankOf = (card: Card) => card % 13;

const HONOR_VALUE: Record<number, number> = {
  [ACE]: model.honnoerpoint.A,
  [KING]: model.honnoerpoint.K,
  [QUEEN]: model.honnoerpoint.Q,
  [JACK]: model.honnoerpoint.J,
  [TEN]: model.honnoerpoint.T,
};

/** Honnørpoint = 5·E + 3·K + 1½·D + ½·B + ¼·10 (MODEL.md 1). */
export function honorPoints(hand: readonly Card[]): number {
  return hand.reduce((sum, card) => sum + (HONOR_VALUE[rankOf(card)] ?? 0), 0);
}

const count = (hand: readonly Card[], rank: number) => hand.filter((c) => rankOf(c) === rank).length;

/** Genvejens led ud over HCP: forskellen mellem honnørpoint og 4-3-2-1 pr. honnør (+1, 0, −½, −½, +¼). */
export const SHORTCUT = {
  ace: model.honnoerpoint.A - model.sans.hcp.A,
  king: model.honnoerpoint.K - model.sans.hcp.K,
  queen: model.honnoerpoint.Q - model.sans.hcp.Q,
  jack: model.honnoerpoint.J - model.sans.hcp.J,
  ten: model.honnoerpoint.T,
} as const;

export interface Shortcut {
  hcp: number;
  aces: number;
  kings: number;
  queens: number;
  jacks: number;
  tens: number;
  /** HCP + 1 pr. es − ½ pr. dame − ½ pr. knægt + ¼ pr. tier; altid lig honnørpointene. */
  total: number;
}

/** Genvejen: HCP + 1 pr. es − ½ pr. dame − ½ pr. knægt + ¼ pr. tier (MODEL.md 1). */
export function shortcut(hand: readonly Card[]): Shortcut {
  const hcp = hcpOf(hand);
  const [aces, kings, queens, jacks, tens] = [ACE, KING, QUEEN, JACK, TEN].map((r) => count(hand, r));
  const total =
    hcp + aces * SHORTCUT.ace + kings * SHORTCUT.king + queens * SHORTCUT.queen + jacks * SHORTCUT.jack + tens * SHORTCUT.ten;
  return { hcp, aces, kings, queens, jacks, tens, total };
}

/** Kortfarvepoint for én farvelængde: renonce 5, singleton 3, dobbeltton 1. */
export function shortnessOfLength(length: number): number {
  const k = model.kortfarvepoint;
  return length === 0 ? k.renonce : length === 1 ? k.singleton : length === 2 ? k.dobbeltton : 0;
}

/** Kortfarvepoint for fire farvelængder; de afhænger kun af mønstret. */
export function shortnessPoints(lengths: readonly number[]): number {
  return lengths.reduce((sum, l) => sum + shortnessOfLength(l), 0);
}

/** Kortfarvepoint pr. mønster for alle 39 mønstre, regnet af mønstrene i `src/domain/` (SPEC 7). */
export const SHORTNESS_BY_PATTERN: Readonly<Record<string, number>> = Object.fromEntries(
  PATTERNS.map((p) => [p.id, shortnessPoints(p.lengths)]),
);

/** Ekstra point for egne trumf ud over 4: 1½ pr. trumf. */
export function trumpPoints(trumps: number): number {
  return Math.max(0, trumps - model.trumflaengde.over) * model.trumflaengde.point;
}

export interface PContext {
  /** Trumffarven (0 = ♠, 1 = ♥ …), når fitten er bekræftet. Uden fit tælles kun honnørpoint. */
  trump?: number;
  /** Farver, hvor makker har vist korthed. En konge i dem trækker 1 fra. */
  partnerShort?: readonly number[];
}

export interface PBreakdown {
  honors: number;
  trump: number;
  shortness: number;
  /** Spildte værdier: −1 pr. konge over for makkers viste korthed (0 eller negativ). */
  wasted: number;
  p: number;
}

/**
 * Håndens p (MODEL.md 1): honnørpoint, og når fitten er bekræftet også trumflængde, kortfarvepoint og spildte
 * konger. Kortfarvepoint tælles kun i sidefarverne: en kort trumffarve giver ingen stjælestik (SPEC version 2).
 */
export function pOf(hand: readonly Card[], ctx: PContext = {}): PBreakdown {
  const honors = honorPoints(hand);
  if (ctx.trump === undefined) return { honors, trump: 0, shortness: 0, wasted: 0, p: honors };
  const lengths = suitLengths(hand);
  const trump = trumpPoints(lengths[ctx.trump]);
  const shortness = shortnessPoints(lengths.filter((_, suit) => suit !== ctx.trump));
  const kings = hand.filter((c) => rankOf(c) === KING && (ctx.partnerShort ?? []).includes(suitOf(c))).length;
  const wasted = kings === 0 ? 0 : kings * model.spildteVaerdier.konge;
  return { honors, trump, shortness, wasted, p: honors + trump + shortness + wasted };
}

/** Den længste 8+ fit i en major (0 = ♠, 1 = ♥); ved lige lange fits spar. Ellers null. */
export function majorFit(a: readonly Card[], b: readonly Card[]): number | null {
  const la = suitLengths(a), lb = suitLengths(b);
  const spades = la[0] + lb[0], hearts = la[1] + lb[1];
  if (Math.max(spades, hearts) < 8) return null;
  return spades >= hearts ? 0 : 1;
}

/** Antal kort i fitten. */
export function fitLength(a: readonly Card[], b: readonly Card[], trump: number): number {
  return suitLengths(a)[trump] + suitLengths(b)[trump];
}

// --- Tabellen: stik og chancer ---

type Row = (typeof model.tabel.raekker)[number];
export type Column = 'stik' | '4M' | '6M' | '7M';

/** Opgaver laves kun for P i tabellens område (SPEC version 2). */
export const P_RANGE = { min: model.tabel.raekker[0].P, max: model.tabel.raekker[model.tabel.raekker.length - 1].P } as const;

/** Lineær interpolation i tabellen. Uden for den (fx storeslemsgrænsen 41) bruges nærmeste række. */
export function tableValue(P: number, column: Column): number {
  const rows: readonly Row[] = model.tabel.raekker;
  const first = rows[0], last = rows[rows.length - 1];
  if (P <= first.P) return first[column];
  if (P >= last.P) return last[column];
  const i = rows.findIndex((r) => r.P >= P);
  const a = rows[i - 1], b = rows[i];
  return a[column] + ((b[column] - a[column]) * (P - a.P)) / (b.P - a.P);
}

/** Stikformlen 0,31 × P + 0,75 (MODEL.md 1); bruges kun i forklaringer. */
export function trickFormula(P: number): number {
  return model.stik.faktor * P + model.stik.konstant;
}

/** Huskeversionen: stik ≈ P/3 (inden for 0,2 stik af tabellen fra P = 24 til 32). */
export function trickMnemonic(P: number): number {
  return P / model.stik.huskeversionDivisor;
}

/** Stikforventningen: tabellens "Gns. stik" med lineær interpolation, så den aldrig springer (SPEC version 2). */
export function expectedTricks(P: number): number {
  return tableValue(P, 'stik');
}

export interface Chances {
  /** Chancen i procent for, at 4M, 6M og 7M holder. */
  game: number;
  slam: number;
  grand: number;
}

export function chances(P: number): Chances {
  return { game: tableValue(P, '4M'), slam: tableValue(P, '6M'), grand: tableValue(P, '7M') };
}

// --- Niveaubeslutningen ---

/** Svarene i Niveaubeslutningen: delkontrakt, udgang, lilleslem og storeslem (SPEC version 2). */
export type Decision = 'partscore' | 'game' | 'slam' | 'grand';

export const DECISIONS: readonly Decision[] = ['partscore', 'game', 'slam', 'grand'];

export interface Controls {
  /** Parrets antal es. */
  aces: number;
  /** Har parret trumfkongen? */
  trumpKing: boolean;
}

export const ALL_CONTROLS: Controls = { aces: 4, trumpKing: true };

/** Parrets kontroller i trumffarven. */
export function controlsOf(a: readonly Card[], b: readonly Card[], trump: number): Controls {
  const both = [...a, ...b];
  return { aces: count(both, ACE), trumpKing: both.some((c) => suitOf(c) === trump && rankOf(c) === KING) };
}

/** Lilleslem kræver, at parret højst mangler ét es; storeslem alle fire es og trumfkongen (SPEC, afklaret 5). */
export function slamAllowed(c: Controls): boolean {
  return 4 - c.aces <= model.kontroller.slemHoejstManglendeEs;
}

export function grandAllowed(c: Controls): boolean {
  return c.aces === 4 && (c.trumpKing || !model.kontroller.storeslemKraeverTrumfkongen);
}

export interface Limits {
  game: number;
  slam: number;
  grand: number;
}

/** Grænserne fra MODEL.md 1. */
export const LIMITS: Limits = {
  game: model.graenser.udgang,
  slam: model.graenser.slem,
  grand: model.graenser.storeslem,
};

/**
 * Kontrakten efter grænserne: delkontrakt under 28½, udgang fra 28½, lilleslem fra 35 og storeslem fra 41, slem kun
 * med kontrollerne.
 */
export function contractFor(P: number, controls: Controls = ALL_CONTROLS, limits: Limits = LIMITS): Decision {
  if (P >= limits.grand && grandAllowed(controls)) return 'grand';
  if (P >= limits.slam && slamAllowed(controls)) return 'slam';
  if (P >= limits.game) return 'game';
  return 'partscore';
}

/** Halvt point: ligger P inden for så meget af en grænse, er begge nabovalg rigtige (SPEC, scoring). */
export const DECISION_MARGIN = 0.5;

/**
 * De rigtige svar i Niveaubeslutningen: modellens valg og, når P ligger inden for ½ point af en grænse (grænserne
 * medregnet), også valgene lige under og på grænsen. Ved udgang er delkontrakt og udgang altså rigtige fra P = 28 til
 * 29. Slem som nabovalg kræver kontrollerne.
 */
export function rightDecisions(P: number, controls: Controls = ALL_CONTROLS, limits: Limits = LIMITS): Decision[] {
  const at = (x: number) => contractFor(x, controls, limits);
  const set = new Set([at(P)]);
  for (const limit of [limits.game, limits.slam, limits.grand]) {
    if (Math.abs(P - limit) > DECISION_MARGIN) continue;
    set.add(at(limit - DECISION_MARGIN));
    set.add(at(limit));
  }
  return DECISIONS.filter((d) => set.has(d));
}

/** Hvad makker skal have til udgang: 28½ minus dine point, dog ikke under 0 (MODEL.md 1). */
export function partnerNeeds(p: number): number {
  return Math.max(0, model.graenser.udgang - p);
}

// --- Turneringsform ---

export type Form = 'impVulnerable' | 'impNotVulnerable' | 'pairs';

/** Den P, hvor 4M holder med `percent` % (omvendt interpolation i tabellen). */
export function pForGameChance(percent: number): number {
  const rows = model.tabel.raekker;
  const i = rows.findIndex((r) => r['4M'] >= percent);
  if (i <= 0) return rows[Math.max(i, 0)].P;
  const a = rows[i - 1], b = rows[i];
  return a.P + ((b.P - a.P) * (percent - a['4M'])) / (b['4M'] - a['4M']);
}

/** Udgangsgrænsen for turneringsformen: chancen fra specen omregnet til P og rundet til nærmeste halve point. */
export function gameThreshold(form: Form): number {
  const t = model.turnering;
  const percent = form === 'impVulnerable' ? t.impIZonen : form === 'impNotVulnerable' ? t.impUdenForZonen : t.par;
  return Math.round(pForGameChance(percent) * 2) / 2;
}

// --- Sansmodellen ---

/** Point i sans = HCP + ¼ pr. tier, ingen længde- og fladhedspoint (MODEL.md 2). */
export function notrumpPoints(hand: readonly Card[]): number {
  return hcpOf(hand) + count(hand, TEN) * model.sans.T;
}

/** Farverne (0–3), hvor mindst én af hænderne har en stopper efter meldegiverens definition (`hasStopper`). */
export function stoppedSuits(a: readonly Card[], b: readonly Card[]): number[] {
  return [0, 1, 2, 3].filter((s) => hasStopper(a, s) || hasStopper(b, s));
}

/** 3NT-chancen ved 24–26 HCP med 3 eller 4 stoppede farver (MODEL.md 2); ellers null. */
export function notrumpChance(stopped: number): number | null {
  return model.sans.stoppere.raekker.find((r) => r.farver === stopped)?.['3NT'] ?? null;
}

/** Farve eller sans (Claude Codes valg): 4M med en 8+ major-fit ("Fit først"), 3NT uden major-fit med alle fire farver stoppet. */
export type Strain = 'major' | 'notrump';

export function strainFor(a: readonly Card[], b: readonly Card[]): Strain | null {
  if (majorFit(a, b) !== null) return 'major';
  return stoppedSuits(a, b).length === 4 ? 'notrump' : null;
}

/** Hvor mange stik mere farvekontrakten giver end sans med 8, 9 eller 10 trumf (MODEL.md 6). */
export function trumpGain(trumps: number): number {
  const rows = model.trumfensVaerdi.raekker;
  return rows.find((r) => r.trumf === Math.min(Math.max(trumps, rows[0].trumf), rows[rows.length - 1].trumf))!.stik;
}

// --- Zar Points ---

export interface ZarBreakdown {
  hcp: number;
  controls: number;
  /** a + b: de to længste farver. */
  long: number;
  /** a − d: længste minus korteste farve. */
  spread: number;
  zp: number;
}

/** ZP = HCP + kontroller (es 2, konge 1) + (a + b) + (a − d) (MODEL.md 5). */
export function zarPoints(hand: readonly Card[]): ZarBreakdown {
  const hcp = hcpOf(hand);
  const controls = count(hand, ACE) * model.zar.kontroller.A + count(hand, KING) * model.zar.kontroller.K;
  const [a, b, , d] = [...suitLengths(hand)].sort((x, y) => y - x);
  return { hcp, controls, long: a + b, spread: a - d, zp: hcp + controls + a + b + (a - d) };
}

export const zarOpens = (hand: readonly Card[]) => zarPoints(hand).zp >= model.zar.aabning;

// --- Naturlige frekvenser ---

/** Nævnerne, en chance helst vises med: "3 ud af 5 gange". */
const DENOMINATORS = [2, 3, 4, 5, 10];
const FREQUENCY_TOLERANCE = 2.5;

/**
 * Chancen som naturlig frekvens, fx 58 % → 3 ud af 5. Først den mindste af nævnerne 2, 3, 4, 5 og 10, der rammer
 * inden for 2,5 procentpoint; ellers 1 ud af N (under 50 %) eller N − 1 ud af N. 0 og 100 % giver 0 ud af 1 og 1 ud af 1.
 */
export function naturalFrequency(percent: number): { k: number; n: number } {
  if (percent <= 0) return { k: 0, n: 1 };
  if (percent >= 100) return { k: 1, n: 1 };
  for (const n of DENOMINATORS) {
    const k = Math.round((percent * n) / 100);
    if (k > 0 && k < n && Math.abs((100 * k) / n - percent) <= FREQUENCY_TOLERANCE) return { k, n };
  }
  if (percent < 50) return { k: 1, n: Math.round(100 / percent) };
  const n = Math.round(100 / (100 - percent));
  return { k: n - 1, n };
}
