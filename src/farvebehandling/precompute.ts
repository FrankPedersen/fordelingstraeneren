import { formatDecimal, formatInt } from '../engine/format';
import { cardsData, cardsText, rankFromSymbol, rankText, type Rank } from './model/cards';
import { percentOf, type Fraction } from './model/fraction';
import { combinationFrequency, eveningText, oncePerDeals } from './model/frequency';
import { solveSubgame } from './solver/cfr';
import { buildGame, type Objective } from './solver/game';
import type { Line, LineStep } from './solver/lines';
import { combinationBase, goalResult } from './solver/results';
import { solveGame, solveLine } from './solver/solve';
import { whatNow, type WhatNowSituation } from './solver/whatnow';
import { caseLabel, concreteHands, frequencyHolding, type ClassifiedCase, type XRule } from './source/bridgehands';
import { NEAR_BEST, tricksChance } from './analysis';
import { proposeTechnique } from './techniques';

/**
 * Forberegning til opgavebanken: hyppighed, løsninger og validering mod bridgehands.com.
 * Rene funktioner; scripts/solve.ts læser og skriver filerne.
 */

export const MODEL_TEXT =
  'Optimalt modspil: modspillet kender alle kort og blander sine valg; spilføreren ser kun de spillede kort. ' +
  'Ubegrænsede forbindelser, chancer a priori.';

// ---------- Hyppighed ----------

export interface FrequencyRow {
  case: ClassifiedCase;
  /** Holdingen i x-notation (hånd / bordet). */
  hand: string;
  dummy: string;
  cards: number;
  frequency: Fraction | null;
  /** Rang blandt de brugbare cases (1 = hyppigst); 0 for cases, der er sorteret fra. */
  rank: number;
}

export function frequencyRows(cases: readonly ClassifiedCase[]): FrequencyRow[] {
  const rows: FrequencyRow[] = cases.map((c) => {
    let h = { hand: c.hand, dummy: c.dummy };
    let frequency: Fraction | null = null;
    try {
      h = frequencyHolding(c);
      frequency = combinationFrequency(h.hand, h.dummy);
      if (frequency.num === 0n) frequency = null;
    } catch {
      // Uklar holding (fx "…"): ingen hyppighed.
    }
    return { case: c, hand: h.hand, dummy: h.dummy, cards: c.hand.length + c.dummy.length, frequency, rank: 0 };
  });
  const usable = rows.filter((r) => r.case.usable && r.frequency);
  usable.sort(
    (a, b) =>
      compareFrequency(b.frequency!, a.frequency!) ||
      (a.case.page ?? 0) - (b.case.page ?? 0) ||
      (a.case.section ?? 1) - (b.case.section ?? 1) ||
      a.case.number - b.case.number,
  );
  usable.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

function compareFrequency(a: Fraction, b: Fraction): number {
  const l = a.num * b.den, r = b.num * a.den;
  return l < r ? -1 : l > r ? 1 : 0;
}

/** Kildens holding på dansk: "AKxx" → "E K x x". */
const show = (text: string) =>
  [...text.replace(/\.\.\./g, '…')].map((s) => (/^[AKQJT2-9]$/.test(s) ? rankText(rankFromSymbol(s)) : s)).join(' ');

/** CSV med semikolon og decimalkomma (åbner direkte i dansk Excel). */
export function frequencyCsv(rows: readonly FrequencyRow[], { pages = false } = {}): string {
  const head = `${pages ? 'side;' : ''}case;hånd;bordet;kort;hyppighed_pct;én_gang_pr_spil;pr_klubaften;rang;brugbar;bemærkning`;
  const lines = rows.map((r) => {
    const f = r.frequency;
    return [
      ...(pages ? [r.case.page ?? ''] : []),
      caseLabel(r.case),
      show(r.hand),
      show(r.dummy) || '–',
      r.cards,
      f ? formatDecimal(percentOf(f, 4), 4) : '',
      f ? oncePerDeals(f) : '',
      f ? eveningText(f) : '',
      r.rank || '',
      r.case.usable ? 'ja' : 'nej',
      r.case.reason ?? r.case.note ?? '',
    ].join(';');
  });
  return [head, ...lines].join('\n') + '\n';
}

/** Andel af sidens samlede hyppighed, som de `top` hyppigste brugbare cases dækker. */
export function coverage(rows: readonly FrequencyRow[], top: number): number {
  const usable = rows.filter((r) => r.rank > 0).sort((a, b) => a.rank - b.rank);
  const total = usable.reduce((s, r) => s + Number(r.frequency!.num) / Number(r.frequency!.den), 0);
  const part = usable.slice(0, top).reduce((s, r) => s + Number(r.frequency!.num) / Number(r.frequency!.den), 0);
  return part / total;
}

// ---------- Opgavebanken ----------

export interface Combination {
  id: string;
  technique: string;
  north: string;
  south: string;
  goals: number[];
  entries: 'unlimited';
  lines: Line[];
  source?: { name: string; values: Record<string, number> };
  verified: boolean;
}

export function bankEntry(
  c: ClassifiedCase,
  pageName: string,
  solution: CombinationSolution,
  situations?: Readonly<Record<string, readonly WhatNowSituation[]>>,
): Combination {
  const { north, south } = concreteHands(c, 'lav');
  const values: Record<string, number> = {};
  c.needs.forEach((n, i) => (values[String(n)] = c.percents[i]));
  const verified = c.needs.every((n, i) => Math.abs(100 * solution.goals[String(n)].value - c.percents[i]) <= 0.5);
  const firstGoal = solution.goals[String(c.needs[0])];
  return {
    id: `${cardsData(north)}-${cardsData(south)}`,
    technique: proposeTechnique(cardsData(north), cardsData(south), c.needs, solution, situations).technique,
    north: cardsData(north),
    south: cardsData(south),
    goals: [...c.needs],
    entries: 'unlimited',
    lines: firstGoal.leads.map((l, i) => ({ id: String.fromCharCode(65 + i), text: l.steps.join(' '), steps: l.line })),
    source: { name: `${pageName}, case ${caseLabel(c)}`, values },
    verified,
  };
}

// ---------- Løsninger ----------

export interface LeadResult {
  hand: 'N' | 'S';
  high: number;
  low: number;
  value: number;
  /** Den rene linjes garanti som tæller over kombinationens nævner. */
  exact: string;
  upper: number;
  certified: boolean;
  /** Garantien pr. abstrakt sidning (samme rækkefølge som `layouts`). */
  layouts: number[];
  /** Linjen på dansk som nummererede trin. */
  steps: string[];
  /** De første trin i linjeformatet; derefter spiller løseren videre. */
  line: LineStep[];
}

export interface GoalResult {
  value: number;
  best: number;
  leads: LeadResult[];
  /**
   * Hold eller par: stik i gennemsnit med målets bedste linje (dens trin, derefter flest stik). Findes kun, hvor
   * parturneringens linje når målet mere end 0,5 procentpoint sjældnere (se pairsFor).
   */
  pairs?: number;
}

export interface CombinationSolution {
  north: string;
  south: string;
  denominator: string;
  /** Hullerne mellem spilførerens kort i startpositionen: rangintervallet og antal modpartskort. */
  gaps: { high: number; low: number; size: number }[];
  layouts: { west: number[]; weight: string }[];
  goals: Record<string, GoalResult>;
  /** Parturnering: flest stik i gennemsnit. */
  tricks?: GoalResult;
}

export function solveCombination(
  north: readonly Rank[],
  south: readonly Rank[],
  goals: readonly number[],
  options: { tricks?: boolean; whatNow?: boolean } = {},
): CombinationSolution & { whatNow?: Record<string, WhatNowSituation[]> } {
  const situations: Record<string, WhatNowSituation[]> = {};
  const solve = (objective: Objective) => {
    const solution = solveGame(buildGame(north, south, { objective }));
    // Hvad nu?: situationerne efter første runde af den bedste linje (kun for et mål).
    if (options.whatNow && objective.kind === 'goal' && solution.best >= 0) {
      const best = solution.leads[solution.best];
      const found = whatNow(solution.game, best.slot, best.strategy);
      if (found.length) situations[String(objective.goal)] = found;
    }
    return solution;
  };
  const first = buildGame(north, south, { objective: { kind: 'goal', goal: goals[0] } });
  const result: CombinationSolution = { ...combinationBase(first), goals: {} };
  for (const goal of goals) result.goals[String(goal)] = goalResult(solve({ kind: 'goal', goal }));
  if (options.tricks) result.tricks = goalResult(solve({ kind: 'tricks' }));
  return options.whatNow ? { ...result, whatNow: situations } : result;
}

/**
 * Hold eller par: målene, hvor holdkamp og parturnering kræver hver sin linje. Parturneringens linje (flest stik i
 * gennemsnit) skal nå målet mere end 0,5 procentpoint sjældnere end målets bedste linje. Så regnes målets bedste linje
 * som parturnering: dens trin, og derefter spiller løseren for flest stik. Målet kommer med, når linjen stadig når målet
 * lige så tit (inden for 0,5 procentpoint) og giver færre stik i gennemsnit (mindst 0,005). Værdien er stik i gennemsnit.
 */
export function pairsFor(north: readonly Rank[], south: readonly Rank[], solution: CombinationSolution): Record<string, number> {
  const tricks = solution.tricks;
  if (!tricks || tricks.best < 0) return {};
  const par = tricks.leads[tricks.best];
  const out: Record<string, number> = {};
  let game: ReturnType<typeof buildGame> | null = null;
  for (const [goal, g] of Object.entries(solution.goals)) {
    if (g.best < 0) continue;
    const n = Number(goal);
    if (g.value - tricksChance(solution, par.layouts, n) <= NEAR_BEST) continue;
    const hold = g.leads[g.best];
    const steps: LineStep[] = hold.line.length ? hold.line : [{ leadFrom: hold.hand, card: cardsData([hold.high as Rank]) }];
    game ??= buildGame(north, south, { objective: { kind: 'tricks' } });
    const asPairs = solveLine(game, { id: 'hold', text: '', steps });
    if (g.value - tricksChance(solution, asPairs.layoutValues, n) > NEAR_BEST) continue;
    if (tricks.value - asPairs.value < 0.005) continue;
    out[goal] = round6(asPairs.value);
  }
  return out;
}

/**
 * Hvad nu? for en gemt løsning: kun den bedste linjes delspil løses igen for hvert mål (bruges, når reglerne for
 * Hvad nu? ændres, men linjerne ikke gør).
 */
export function whatNowFor(
  north: readonly Rank[],
  south: readonly Rank[],
  goals: readonly number[],
  solution: CombinationSolution,
): Record<string, WhatNowSituation[]> {
  const out: Record<string, WhatNowSituation[]> = {};
  for (const goal of goals) {
    const stored = solution.goals[String(goal)];
    if (stored.best < 0) continue;
    const best = stored.leads[stored.best];
    const game = buildGame(north, south, { objective: { kind: 'goal', goal } });
    let slot = -1;
    for (let x = 0; x < game.childCount[game.root]; x++) {
      const s = game.childStart[game.root] + x;
      if ((game.slotHand[s] === 0 ? 'N' : 'S') === best.hand && game.slotHigh[s] === best.high && game.slotLow[s] === best.low) slot = s;
    }
    if (slot < 0) throw new Error(`${cardsData(north)}-${cardsData(south)} ${goal}: udspillet findes ikke`);
    const sub = solveSubgame(game, game.children[slot]);
    const found = whatNow(game, slot, sub.strategy);
    if (found.length) out[String(goal)] = found;
  }
  return out;
}

/** Sidens navn på dansk, fx "Side 2: modparten har 2 honnørpoint". */
export function pageTitle(page: number): string {
  return page === 0 ? 'Side 0: modparten har ingen honnørpoint' : `Side ${page}: modparten har ${page} honnørpoint`;
}

// ---------- Appens data ----------

/** En linje i appens data: uden den eksakte tæller og den øvre grænse, som appen ikke bruger. */
export type AppLead = Pick<LeadResult, 'hand' | 'high' | 'low' | 'value' | 'certified' | 'layouts' | 'steps' | 'line'>;

export interface AppEntry {
  /** Rang efter hyppighed på tværs af siderne (1 = hyppigst). */
  rank: number;
  /** Hyppigheden pr. spil som brøk (tæller og nævner), regnet ud fra kildens holding med x som rangen. */
  frequency: [string, string];
  combination: Omit<Combination, 'lines'>;
  solution: Omit<CombinationSolution, 'goals' | 'tricks'> & {
    goals: Record<string, { value: number; best: number; leads: AppLead[]; pairs?: number }>;
    /** Parturnering: kun den bedste linje. */
    tricks?: { value: number; best: number; leads: AppLead[] };
  };
  whatNow?: Record<string, WhatNowSituation[]>;
}

const round6 = (v: number) => Math.round(v * 1e6) / 1e6;
const appLead = (l: LeadResult): AppLead => ({
  hand: l.hand,
  high: l.high,
  low: l.low,
  value: round6(l.value),
  certified: l.certified,
  layouts: l.layouts,
  steps: l.steps,
  // Linjeformatet til Spil den selv: dine stik sammenlignes med løserens linjer.
  line: l.line,
});

/** Kombinationen i appens kompakte form (én fil pr. side, så hver fil kan gemmes offline). */
export function appEntry(
  rank: number,
  frequency: Fraction,
  combination: Combination,
  solution: CombinationSolution,
  situations?: Readonly<Record<string, readonly WhatNowSituation[]>>,
): AppEntry {
  const { lines: _lines, ...meta } = combination;
  const goals: AppEntry['solution']['goals'] = {};
  for (const [goal, g] of Object.entries(solution.goals)) {
    goals[goal] = { value: round6(g.value), best: g.best, leads: g.leads.map(appLead), ...(g.pairs !== undefined ? { pairs: g.pairs } : {}) };
  }
  const tricks = solution.tricks && {
    value: round6(solution.tricks.value),
    best: 0,
    leads: [appLead(solution.tricks.leads[solution.tricks.best])],
  };
  const { goals: _goals, tricks: _tricks, ...rest } = solution;
  return {
    rank,
    frequency: [frequency.num.toString(), frequency.den.toString()],
    combination: meta,
    solution: { ...rest, goals, ...(tricks ? { tricks } : {}) },
    ...(situations && Object.keys(situations).length ? { whatNow: situations as Record<string, WhatNowSituation[]> } : {}),
  };
}

// ---------- Validering ----------

export interface ValidationRow {
  case: ClassifiedCase;
  hands: Record<XRule, { north: Rank[]; south: Rank[] }>;
  goals: {
    need: number;
    source: number;
    app: Record<XRule, number>;
    certified: Record<XRule, boolean>;
    /** Med "lav": er der en linje, der er mere end 0,5 procentpoint dårligere end den bedste? Ellers ingen beslutning. */
    decision: boolean;
  }[];
}

const bestLead = (g: GoalResult): LeadResult | undefined => g.leads[g.best];

/** Hænderne efter en fortolkning af x; er "høj" umulig (for få kort under det laveste navngivne), bruges "lav". */
export function handsFor(c: Pick<ClassifiedCase, 'hand' | 'dummy'>, rule: XRule): { north: Rank[]; south: Rank[] } {
  try {
    return concreteHands(c, rule);
  } catch (error) {
    if (rule === 'lav') throw error;
    return concreteHands(c, 'lav');
  }
}

export function validationRow(c: ClassifiedCase, lav: CombinationSolution, høj: CombinationSolution): ValidationRow {
  return {
    case: c,
    hands: { lav: concreteHands(c, 'lav'), høj: handsFor(c, 'høj') },
    goals: c.needs.map((need, i) => ({
      need,
      source: c.percents[i],
      app: { lav: 100 * lav.goals[String(need)].value, høj: 100 * høj.goals[String(need)].value },
      // Den bedste linje er ren (certificeret) eller kræver, at spilføreren blander.
      // Et mål, der er afgjort før første stik (fx lutter sikre stik), har ingen linje og regnes som certificeret.
      certified: {
        lav: bestLead(lav.goals[String(need)])?.certified ?? true,
        høj: bestLead(høj.goals[String(need)])?.certified ?? true,
      },
      decision: hasDecision(lav.goals[String(need)]),
    })),
  };
}

/** Et mål med en beslutning: målet kan nås, og mindst én linje er mere end 0,5 procentpoint dårligere end den bedste. */
function hasDecision(g: GoalResult | undefined): boolean {
  if (!g || g.value <= 0 || !g.leads.length) return false;
  return g.leads.some((l) => g.value - l.value > NEAR_BEST);
}

// ---------- Fejl i kilden ----------

/** Afvigelser på højst så mange procentpoint fra den nærmeste fortolkning af x kaldes små. */
export const SMALL_DEVIATION = 1.5;

/**
 * Hvorfor kildens procent afviger (mere end tolerancen med "lav"): passer med "høj", lille afvigelse, kilden modsiger
 * sig selv (et højere mål har en større procent end et lavere), samme mål og procenter som en anden case, der passer
 * (kopieret), målet er sikkert eller umuligt med begge fortolkninger, eller uforklaret.
 */
export type DeviationCause = 'høj' | 'lille' | 'modsigelse' | 'kopi' | 'sikkert' | 'umuligt' | 'uforklaret';

const nearest = (g: ValidationRow['goals'][number]) => Math.min(Math.abs(g.app.lav - g.source), Math.abs(g.app.høj - g.source));

export function deviationCause(
  row: ValidationRow,
  need: number,
  pageRows: readonly ValidationRow[],
  tolerance = 0.5,
): { cause: DeviationCause; copyOf?: string } | null {
  const g = row.goals.find((x) => x.need === need);
  if (!g || Math.abs(g.app.lav - g.source) <= tolerance) return null;
  if (Math.abs(g.app.høj - g.source) <= tolerance) return { cause: 'høj' };
  if (nearest(g) <= SMALL_DEVIATION) return { cause: 'lille' };
  if (row.goals.some((o) => (o.need > need && o.source > g.source) || (o.need < need && o.source < g.source))) return { cause: 'modsigelse' };
  const key = (r: ValidationRow) => r.goals.map((o) => `${o.need}:${o.source}`).join(',');
  const copy = pageRows.find(
    (r) => r !== row && holding(r.case) !== holding(row.case) && key(r) === key(row) && r.goals.every((o) => nearest(o) <= SMALL_DEVIATION),
  );
  if (copy) return { cause: 'kopi', copyOf: caseLabel(copy.case) };
  if (g.app.lav >= 99.95 && g.app.høj >= 99.95) return { cause: 'sikkert' };
  if (g.app.lav <= 0.05 && g.app.høj <= 0.05) return { cause: 'umuligt' };
  return { cause: 'uforklaret' };
}

/**
 * Målene, der fjernes fra appen: kildens procent er forkert (afviger mere end SMALL_DEVIATION med begge fortolkninger),
 * og målet har ingen beslutning, fordi alle linjer giver det samme. Så er målet næppe det, kilden mente.
 */
export function removedGoals(row: ValidationRow, pageRows: readonly ValidationRow[], tolerance = 0.5): { need: number; cause: DeviationCause }[] {
  return row.goals.flatMap((g) => {
    const found = deviationCause(row, g.need, pageRows, tolerance);
    return found && found.cause !== 'høj' && found.cause !== 'lille' && !g.decision ? [{ need: g.need, cause: found.cause }] : [];
  });
}

/** Et fjernet mål i content/kildefejl.json. */
export interface SourceError {
  page: number;
  case: string;
  need: number;
  cause: DeviationCause;
}

/**
 * Kildefejlene fjernes fra cases: målene fjernes, og en case uden mål tilbage sorteres fra. Rangen regnes derefter
 * igen med frequencyRows. Cases kopieres; de oprindelige ændres ikke.
 */
export function applySourceErrors(cases: readonly ClassifiedCase[], errors: readonly SourceError[]): ClassifiedCase[] {
  return cases.map((c) => {
    const drop = errors.filter((e) => e.page === c.page && e.case === caseLabel(c)).map((e) => e.need);
    if (!c.usable || !drop.length) return c;
    const keep = c.needs.map((n) => !drop.includes(n));
    const needs = c.needs.filter((_, i) => keep[i]);
    const percents = c.percents.filter((_, i) => keep[i]);
    if (!needs.length) return { ...c, needs, percents, usable: false, reason: 'Fejl i kilden: alle mål er forkerte (se valideringsrapporten)' };
    return { ...c, needs, percents };
  });
}

const CAUSE_TEXT: Record<DeviationCause, string> = {
  høj: 'passer med "høj"',
  lille: 'lille afvigelse',
  modsigelse: 'kilden modsiger sig selv: et højere mål har en større procent',
  kopi: 'samme mål og procenter som case',
  sikkert: 'målet er sikkert med begge fortolkninger',
  umuligt: 'målet kan ikke nås med begge fortolkninger',
  uforklaret: 'passer ikke med nogen fortolkning',
};

function causeText(found: { cause: DeviationCause; copyOf?: string }, removed: boolean): string {
  const text = found.cause === 'kopi' ? `${CAUSE_TEXT.kopi} ${found.copyOf}, der passer` : CAUSE_TEXT[found.cause];
  return removed ? `${text}; **fjernet** (alle linjer giver det samme)` : text;
}

const pct = (x: number) => `${formatDecimal(x, 1)} %`;
const holding = (c: ClassifiedCase) => `${show(c.hand)} / ${show(c.dummy) || '–'}`;

export function validationReport(
  rows: readonly ValidationRow[],
  excluded: readonly ClassifiedCase[],
  meta: { page: string; url: string; fetched: string; tolerance: number },
): string {
  const goals = rows.flatMap((r) => r.goals.map((g) => ({ row: r, g })));
  const within = (rule: XRule, tol: number) => goals.filter(({ g }) => Math.abs(g.app[rule] - g.source) <= tol).length;
  const best = (g: ValidationRow['goals'][number]) =>
    Math.abs(g.app.lav - g.source) <= Math.abs(g.app.høj - g.source) ? 'lav' : 'høj';
  const out: string[] = [];
  out.push(`# Validering: ${meta.page}`);
  out.push('');
  out.push(`Kilde: [${meta.url}](${meta.url}), læst ${meta.fetched}. Genereret af \`scripts/solve.ts\`.`);
  out.push('');
  out.push(`Model: ${MODEL_TEXT}`);
  out.push('');
  out.push(
    'Fortolkninger af x: **lav** = spilførerens x\'er er de laveste kort (specens regel); ' +
      '**høj** = spilførerens x\'er er de højeste kort under det laveste navngivne kort, så modpartens små kort er lavere.',
  );
  out.push('');
  out.push(`Kilden har kun hele procenter, så en afvigelse over ${formatDecimal(meta.tolerance, 1)} procentpoint gennemgås.`);
  out.push('');
  out.push('## Resultat');
  out.push('');
  out.push(`- Brugbare cases: ${rows.length} af ${rows.length + excluded.length}, med ${goals.length} mål.`);
  for (const rule of ['lav', 'høj'] as const) {
    out.push(
      `- Fortolkning "${rule}": ${within(rule, meta.tolerance)} af ${goals.length} mål inden for ${formatDecimal(meta.tolerance, 1)} procentpoint, ` +
        `${within(rule, 1)} inden for 1 procentpoint.`,
    );
  }
  const either = goals.filter(({ g }) => Math.min(Math.abs(g.app.lav - g.source), Math.abs(g.app.høj - g.source)) <= meta.tolerance).length;
  out.push(`- Mindst én af fortolkningerne inden for ${formatDecimal(meta.tolerance, 1)} procentpoint: ${either} af ${goals.length} mål.`);
  const uncertified = goals.filter(({ g }) => !g.certified.lav || !g.certified.høj).length;
  out.push(`- Mål, hvor den bedste linje kræver, at spilføreren blander (ingen ren linje inden for 0,002 procentpoint): ${uncertified}.`);
  const removed = rows.flatMap((r) => removedGoals(r, rows, meta.tolerance).map((x) => ({ row: r, need: x.need })));
  const isRemoved = (row: ValidationRow, need: number) => removed.some((x) => x.row === row && x.need === need);
  const empty = rows.filter((r) => r.goals.every((g) => isRemoved(r, g.need))).length;
  if (removed.length) {
    out.push(
      `- Fejl i kilden, fjernet fra appen: ${removed.length} mål, hvor kildens procent afviger mere end ${formatDecimal(SMALL_DEVIATION, 1)} ` +
        `procentpoint med begge fortolkninger, og alle linjer giver det samme${empty ? `; ${empty} ${empty === 1 ? 'case har' : 'cases har'} ikke flere mål og er ikke med` : ''}.`,
    );
  }
  out.push('');
  out.push(`## Afvigelser over ${formatDecimal(meta.tolerance, 1)} procentpoint med fortolkningen "lav"`);
  out.push('');
  out.push('| Case | Hånd / bordet | Mål | Kilde | Lav | Høj | Nærmest | Årsag | Kildens bemærkning |');
  out.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const { row, g } of goals) {
    const found = deviationCause(row, g.need, rows, meta.tolerance);
    if (!found) continue;
    out.push(
      `| ${caseLabel(row.case)} | ${holding(row.case)} | ${g.need} | ${g.source} % | ${pct(g.app.lav)} | ${pct(g.app.høj)} | ${best(g)} | ` +
        `${causeText(found, isRemoved(row, g.need))} | ${row.case.remark || '–'} |`,
    );
  }
  out.push('');
  out.push('## Sorteret fra');
  out.push('');
  out.push('| Case | Holding | Grund |');
  out.push('| --- | --- | --- |');
  for (const c of excluded) out.push(`| ${caseLabel(c)} | ${holding(c)} | ${c.reason} |`);
  out.push('');
  out.push('## Alle brugbare cases');
  out.push('');
  out.push('| Case | Hånd / bordet | Konkret (lav) | Mål | Kilde | Lav | Høj |');
  out.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const { row, g } of goals) {
    const h = row.hands.lav;
    out.push(
      `| ${caseLabel(row.case)} | ${holding(row.case)} | ${cardsText(h.south)} / ${cardsText(h.north)} | ${g.need} | ${g.source} % | ${pct(g.app.lav)} | ${pct(g.app.høj)} |`,
    );
  }
  out.push('');
  return out.join('\n');
}

/** Linjeteksterne for hele banken til godkendelse: bedste linje og alternativer pr. mål. */
export function linesReport(
  bank: readonly Combination[],
  solutions: Readonly<Record<string, CombinationSolution>>,
  title = 'damen mangler',
): string {
  const out: string[] = [`# Linjetekster: ${title}`, ''];
  out.push(
    'Genereret af `scripts/solve.ts` til godkendelse. For hver kombination og hvert mål står den bedste linje og ' +
      'alternativerne (løserens bedste linje for hvert andet første udspil) med chancen. "Blandet" betyder, at ' +
      'spilføreren skal blande mellem to linjer for at nå chancen.',
  );
  out.push('');
  bank.forEach((b, i) => {
    const s = solutions[b.id];
    const south = cardsText([...b.south].map(rankFromSymbol));
    const north = cardsText([...b.north].map(rankFromSymbol));
    out.push(`## ${i + 1}. ${south} / ${north}`);
    out.push('');
    for (const goal of b.goals) {
      const g = s.goals[String(goal)];
      out.push(`**${goal} stik**`);
      out.push('');
      const order = g.leads.map((l, j) => ({ l, j })).sort((p, q) => q.l.value - p.l.value);
      for (const { l, j } of order) {
        const tag = j === g.best ? ' (bedst)' : '';
        const mixed = l.certified ? '' : ', blandet';
        out.push(`- ${formatDecimal(100 * l.value, 1)} %${tag}${mixed}: ${l.steps.join(' ')}`);
      }
      out.push('');
    }
  });
  return out.join('\n');
}

/** Kort oversigt over hyppigheden til rapporten. */
export function frequencySummary(rows: readonly FrequencyRow[]): string {
  const usable = rows.filter((r) => r.rank > 0).length;
  return (
    `${formatInt(usable)} brugbare cases. De 10 hyppigste dækker ${formatDecimal(100 * coverage(rows, 10), 0)} % ` +
    `af sidens samlede hyppighed, de 30 hyppigste ${formatDecimal(100 * coverage(rows, 30), 0)} %.`
  );
}
