import { binomial } from '../domain/combinatorics';
import { ACE, ALL_RANKS, JACK, KING, QUEEN, rankFromSymbol, rankText, TEN, type Rank } from './model/cards';
import type { Fraction } from './model/fraction';
import { combinationFrequency, situationFrequency } from './model/frequency';
import type { AppEntry, AppLead, Combination, CombinationSolution, GoalResult, LeadResult } from './precompute';
import type { WhatNowSituation } from './model/whatnow';
import type { CombinationBase } from './solver/results';
import { frequencyHolding } from './source/bridgehands';

/** Data til analysevinduet: banken, linjerne, sandsynlighedsbåndet og opslag fra kortvælgeren. */

export interface BankItem {
  combination: Combination;
  solution: CombinationSolution;
  /** Rang efter hyppighed på tværs af siderne (1 = hyppigst). */
  rank: number;
  /** bridgehands-siden (0–9), som kombinationen står på i kilden. */
  page: number;
  /** Modpartens honnørpoint i farven ud fra kortene (E 4, K 3, D 2, B 1); kilden har enkelte cases på en anden side. */
  points: number;
  north: Rank[];
  south: Rank[];
  /** Hyppighed pr. spil for kombinationen. */
  frequency: Fraction;
  /** Hyppighed for situationen bag, fx es og konge uden damen med samme antal kort. */
  situation: Fraction;
  /** Situationens honnører: vores over den højeste manglende, og den højeste manglende. */
  honors: { ours: Rank[]; theirs: Rank[] };
  key: string;
  /** Hvad nu?: situationerne efter første runde pr. mål. */
  whatNow: Readonly<Record<string, readonly WhatNowSituation[]>>;
}

const ranksOf = (data: string) => [...data].map(rankFromSymbol).sort((a, b) => b - a);

const HONORS: readonly Rank[] = [ACE, KING, QUEEN, JACK];

/**
 * Situationen bag en kombination: den højeste honnør, modparten har, og vores honnører over den. E K B x / D … giver
 * "es og konge uden damen"; har modparten ingen af E K D B, er situationen alle fire honnører.
 */
export function situationHonors(north: readonly Rank[], south: readonly Rank[]): { ours: Rank[]; theirs: Rank[] } {
  const ours = HONORS.filter((r) => north.includes(r) || south.includes(r));
  const top = HONORS.find((r) => !ours.includes(r));
  return top === undefined ? { ours, theirs: [] } : { ours: ours.filter((r) => r > top), theirs: [top] };
}

const lead = (l: AppLead): LeadResult => ({ ...l, exact: '', upper: l.value });
const goalOf = (g: { value: number; best: number; leads: AppLead[] }): GoalResult => ({ ...g, leads: g.leads.map(lead) });

function bankItem(entry: AppEntry, page: number): BankItem {
  const combination: Combination = { ...entry.combination, lines: [] };
  const goals: Record<string, GoalResult> = {};
  for (const [goal, g] of Object.entries(entry.solution.goals)) goals[goal] = goalOf(g);
  const solution: CombinationSolution = { ...entry.solution, goals, tricks: entry.solution.tricks && goalOf(entry.solution.tricks) };
  const north = ranksOf(combination.north), south = ranksOf(combination.south);
  const honors = situationHonors(north, south);
  return {
    combination,
    solution,
    rank: entry.rank,
    page,
    points: pointsOf(north, south),
    north,
    south,
    // Hyppigheden er regnet ud fra kildens holding med x (som rangen); de konkrete kort kan ikke give den tilbage.
    frequency: { num: BigInt(entry.frequency[0]), den: BigInt(entry.frequency[1]) },
    situation: situationFrequency(honors.ours, honors.theirs, north.length + south.length),
    honors,
    key: structureKey(north, south),
    whatNow: entry.whatNow ?? {},
  };
}

/** Modpartens honnørpoint: E 4, K 3, D 2 og B 1 for de honnører, spilføreren ikke har. */
function pointsOf(north: readonly Rank[], south: readonly Rank[]): number {
  return [ACE, KING, QUEEN, JACK].filter((r) => !north.includes(r) && !south.includes(r)).reduce((sum, r) => sum + r - 10, 0);
}

/**
 * Målene, der er værd at regne for en kombination uden for banken: chancen for mindst så mange stik med linjen for
 * flest stik ligger mellem 1 % og 99 %. Først regnes det højeste mål med mindst 25 %.
 */
export function goalCandidates(base: CombinationBase, tricks: GoalResult): { goals: number[]; preferred: number } {
  const rounds = Math.max(base.north.length, base.south.length);
  const best = tricks.leads[tricks.best];
  if (!best) return { goals: [rounds], preferred: rounds };
  const den = BigInt(base.denominator);
  const chance = (g: number) => {
    let hits = 0n;
    base.layouts.forEach((l, L) => {
      if (best.layouts[L] >= g) hits += BigInt(l.weight);
    });
    return Number((hits * 1_000_000n) / den) / 1e6;
  };
  const goals: number[] = [];
  for (let g = rounds; g >= 1; g--) {
    const p = chance(g);
    if (p > 0.01 && p < 0.99) goals.push(g);
  }
  if (!goals.length) goals.push(rounds);
  return { goals, preferred: goals.find((g) => chance(g) >= 0.25) ?? goals[goals.length - 1] };
}

/** En kombination uden for banken, regnet i appen (Analyse fase 2). Mål uden løsning endnu mangler i `solved`. */
export function customItem(base: CombinationBase, goals: number[], solved: Record<string, GoalResult>, tricks?: GoalResult): BankItem {
  const north = ranksOf(base.north), south = ranksOf(base.south);
  const x = frequencyHolding({ hand: base.south, dummy: base.north });
  const honors = situationHonors(north, south);
  return {
    combination: { id: `${base.north}-${base.south}`, technique: '', north: base.north, south: base.south, goals, entries: 'unlimited', lines: [], verified: false },
    solution: { ...base, goals: solved, tricks },
    rank: 0,
    page: -1,
    points: pointsOf(north, south),
    north,
    south,
    frequency: combinationFrequency(x.hand, x.dummy),
    situation: situationFrequency(honors.ours, honors.theirs, north.length + south.length),
    honors,
    key: structureKey(north, south),
    whatNow: {},
  };
}

/** Banken fra appens filer (content/app/side-N.json, én pr. side) i hyppighedsorden. */
export function loadBank(pageTexts: readonly string[]): BankItem[] {
  const items: BankItem[] = [];
  for (const text of pageTexts) {
    const file = JSON.parse(text) as { page: number; combinations: AppEntry[] };
    for (const entry of file.combinations) items.push(bankItem(entry, file.page));
  }
  return items.sort((a, b) => a.rank - b.rank);
}

/**
 * Kombinationens struktur: fra esset og ned, hvilken hånd hvert af spilførerens kort sidder i, og hvor mange af
 * modpartens kort der ligger imellem. To kombinationer med samme struktur er det samme spil, uanset hvad de enkelte
 * kort hedder.
 */
export function structureKey(north: readonly Rank[], south: readonly Rank[]): string {
  const parts: string[] = [];
  let run = 0;
  for (const r of ALL_RANKS) {
    const owner = north.includes(r) ? 'N' : south.includes(r) ? 'S' : null;
    if (!owner) {
      run++;
      continue;
    }
    if (run) parts.push(String(run));
    run = 0;
    parts.push(owner);
  }
  if (run) parts.push(String(run));
  return parts.join('');
}

export function findCombination(bank: readonly BankItem[], north: readonly Rank[], south: readonly Rank[]): BankItem | null {
  const key = structureKey(north, south);
  return bank.find((b) => b.key === key) ?? null;
}

// ---------- Klubaftenen ----------

/** Klubaftenen viser lige så mange kombinationer, som fordelingstrænerens klubaften har hænder. */
export const CLUB_SIZE = 100;

export interface ClubEvening {
  /** De hyppigste kombinationer i rangorden. */
  items: BankItem[];
  /** Hyppigheden i forhold til den hyppigste (1 = den hyppigste). */
  share: number[];
  /** Antal kombinationer pr. teknik-id. */
  techniques: Record<string, number>;
  /** Antal kombinationer pr. antal kort i farven, stigende efter antal kort. */
  cards: [cards: number, count: number][];
}

export function clubEvening(bank: readonly BankItem[], size = CLUB_SIZE): ClubEvening {
  const items = [...bank].sort((a, b) => a.rank - b.rank).slice(0, size);
  const perDeal = (b: BankItem) => Number(b.frequency.num) / Number(b.frequency.den);
  const top = items.length ? perDeal(items[0]) : 1;
  const techniques: Record<string, number> = {};
  const cards = new Map<number, number>();
  for (const b of items) {
    techniques[b.combination.technique] = (techniques[b.combination.technique] ?? 0) + 1;
    const n = b.north.length + b.south.length;
    cards.set(n, (cards.get(n) ?? 0) + 1);
  }
  return { items, share: items.map((b) => perDeal(b) / top), techniques, cards: [...cards].sort((a, b) => a[0] - b[0]) };
}

// ---------- Linjerne ----------

export interface LineView {
  letter: string;
  lead: LeadResult;
  /** Chancen (eller stik i gennemsnit for parturnering). */
  value: number;
  best: boolean;
  /** Inden for 0,5 procentpoint af den bedste. */
  nearBest: boolean;
  /** Spilføreren skal blande for at nå chancen. */
  mixed: boolean;
}

/** Linjer inden for så mange procentpoint af den bedste er lige gode. */
export const NEAR_BEST = 0.005;
export const MAX_ALTERNATIVES = 3;

/**
 * Den bedste linje først; derefter alternativerne: løserens bedste linje for hvert andet første udspil, højst tre,
 * der hver ligger mere end 0,5 procentpoint under den bedste. Linjer inden for 0,5 procentpoint vises alle som lige gode.
 */
export function linesForGoal(item: BankItem, goal: number): LineView[] {
  const g = item.solution.goals[String(goal)];
  if (!g) return [];
  const best = g.leads[g.best];
  const ordered = g.leads.map((lead, i) => ({ lead, i })).sort((a, b) => b.lead.value - a.lead.value || a.i - b.i);
  const near = ordered.filter((o) => o.i !== g.best && best.value - o.lead.value <= NEAR_BEST);
  const others = ordered.filter((o) => best.value - o.lead.value > NEAR_BEST).slice(0, MAX_ALTERNATIVES);
  const chosen = [{ lead: best, i: g.best }, ...near, ...others];
  return chosen.map((o, k) => ({
    letter: String.fromCharCode(65 + k),
    lead: o.lead,
    value: o.lead.value,
    best: o.i === g.best,
    nearBest: o.i !== g.best && best.value - o.lead.value <= NEAR_BEST,
    mixed: !o.lead.certified,
  }));
}

// ---------- Sandsynlighedsbåndet ----------

export interface BandField {
  id: string;
  /** Vests og Østs kort, fx "K x x" og "D x" (små kort som x). */
  west: string;
  east: string;
  westCount: number;
  /** Vests honnører, til gruppering efter honnørplacering. */
  westHonors: Rank[];
  /** Sidningens chance. */
  probability: number;
  /** Linjernes resultat i sidningen (1 = målet nås), i samme rækkefølge som linjerne. */
  outcomes: number[];
  /** Den abstrakte sidning (indeks i løsningens sidninger). */
  layout: number;
}

function subsets<T>(items: readonly T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [first, ...rest] = items;
  return [...subsets(rest, size - 1).map((s) => [first, ...s]), ...subsets(rest, size)];
}

const holdingText = (honors: Rank[], small: number) => {
  const parts = [...honors.sort((a, b) => b - a).map(rankText), ...Array(small).fill('x')];
  return parts.length ? parts.join(' ') : '–';
};

/**
 * Felterne i båndet: hver abstrakt sidning foldes ud i konkrete honnørplaceringer. Et hul, hvor alle kort er 10 eller
 * højere, vises med de konkrete kort; et hul med små kort samles som x (kortene i et hul er ligeværdige). Rækkefølgen er efter fordeling (Vests antal kort,
 * flest først) og derefter Vests honnører. `weights` er de abstrakte sidningers chance med ledige pladser (ellers a priori).
 */
export function bandFields(item: BankItem, lines: readonly LineView[], weights?: readonly number[]): BandField[] {
  const { gaps, layouts, denominator } = item.solution;
  const den = Number(denominator);
  const fields: BandField[] = [];
  layouts.forEach((layout, L) => {
    // Kartesisk produkt over hullerne med honnører.
    let variants: { west: Rank[]; east: Rank[]; ways: number }[] = [{ west: [], east: [], ways: 1 }];
    let westSmall = 0, eastSmall = 0;
    gaps.forEach((gap, g) => {
      const w = layout.west[g];
      if (gap.size === 0) return;
      if (gap.low >= TEN) {
        const cards: Rank[] = [];
        for (let r = gap.high; r >= gap.low; r--) cards.push(r);
        const next: typeof variants = [];
        for (const v of variants) {
          for (const pick of subsets(cards, w)) {
            next.push({ west: [...v.west, ...pick], east: [...v.east, ...cards.filter((c) => !pick.includes(c))], ways: v.ways });
          }
        }
        variants = next.map((v) => ({ ...v, ways: v.ways * Number(binomial(gap.size, w)) }));
      } else {
        westSmall += w;
        eastSmall += gap.size - w;
      }
    });
    const probability = weights ? weights[L] : Number(layout.weight) / den;
    for (const v of variants) {
      fields.push({
        id: `${L}:${v.west.join(',')}`,
        west: holdingText([...v.west], westSmall),
        east: holdingText([...v.east], eastSmall),
        westCount: v.west.length + westSmall,
        westHonors: [...v.west].sort((a, b) => b - a),
        probability: probability / v.ways,
        outcomes: lines.map((l) => l.lead.layouts[L]),
        layout: L,
      });
    }
  });
  return sortFields(fields, 'fordeling');
}

/** Feltets id i båndet for en konkret sidning: den abstrakte sidning og Vests kort i huller, hvor alle kort er 10 eller højere. */
export function fieldIdOf(item: BankItem, layout: number, west: readonly Rank[]): string {
  const honors = item.solution.gaps.flatMap((gap) =>
    gap.size && gap.low >= TEN ? west.filter((r) => r <= gap.high && r >= gap.low).sort((x, y) => y - x) : [],
  );
  return `${layout}:${honors.join(',')}`;
}

export type Grouping = 'fordeling' | 'honnører';

export function sortFields(fields: readonly BandField[], by: Grouping): BandField[] {
  const honorKey = (f: BandField) => f.westHonors.map((r) => String.fromCharCode(64 + r)).join('');
  return [...fields].sort((a, b) =>
    by === 'fordeling'
      ? b.westCount - a.westCount || honorKey(b).localeCompare(honorKey(a))
      : honorKey(b).localeCompare(honorKey(a)) || b.westCount - a.westCount,
  );
}

/** Kort notation som i specen, fx "Kxx–Dx"; en renonce skrives "renonce". */
export function compactLayout(f: BandField): string {
  const compact = (text: string) => (text === '–' ? 'renonce' : text.replace(/ /g, ''));
  return `${compact(f.west)}–${compact(f.east)}`;
}

/** Sidningerne, hvor linjerne ikke giver samme resultat. */
export function disagreements(fields: readonly BandField[]): BandField[] {
  return fields.filter((f) => f.outcomes.some((o) => o !== f.outcomes[0]));
}
