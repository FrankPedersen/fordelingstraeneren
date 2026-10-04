import { binomial } from '../domain/combinatorics';
import { ACE, ALL_RANKS, KING, QUEEN, rankFromSymbol, rankText, TEN, type Rank } from './model/cards';
import type { Fraction } from './model/fraction';
import { combinationFrequency, situationFrequency } from './model/frequency';
import type { Combination, CombinationSolution, LeadResult } from './precompute';
import type { WhatNowSituation } from './model/whatnow';
import { frequencyHolding } from './source/bridgehands';

/** Data til analysevinduet: banken, linjerne, sandsynlighedsbåndet og opslag fra kortvælgeren. */

export interface BankItem {
  combination: Combination;
  solution: CombinationSolution;
  /** Rang efter hyppighed (1 = hyppigst). */
  rank: number;
  north: Rank[];
  south: Rank[];
  /** Hyppighed pr. spil for kombinationen. */
  frequency: Fraction;
  /** Hyppighed for situationen: es og konge uden damen med samme antal kort. */
  situation: Fraction;
  key: string;
  /** Hvad nu?: situationerne efter første runde pr. mål (fra hvad-nu.json). */
  whatNow: Readonly<Record<string, readonly WhatNowSituation[]>>;
}

const ranksOf = (data: string) => [...data].map(rankFromSymbol).sort((a, b) => b - a);

export function loadBank(bankText: string, solutionsText: string, whatNowText?: string): BankItem[] {
  const bank = (JSON.parse(bankText) as { combinations: Combination[] }).combinations;
  const solutions = (JSON.parse(solutionsText) as { combinations: Record<string, CombinationSolution> }).combinations;
  const whatNow = whatNowText ? (JSON.parse(whatNowText) as { combinations: Record<string, Record<string, WhatNowSituation[]>> }).combinations : {};
  return bank.map((combination, i) => {
    const north = ranksOf(combination.north), south = ranksOf(combination.south);
    const x = frequencyHolding({ hand: combination.south, dummy: combination.north });
    return {
      combination,
      solution: solutions[combination.id],
      rank: i + 1,
      north,
      south,
      frequency: combinationFrequency(x.hand, x.dummy),
      situation: situationFrequency([ACE, KING], [QUEEN], north.length + south.length),
      key: structureKey(north, south),
      whatNow: whatNow[combination.id] ?? {},
    };
  });
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
