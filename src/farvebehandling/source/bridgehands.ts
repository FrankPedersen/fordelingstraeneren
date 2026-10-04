import { ALL_RANKS, cardsData, rankFromSymbol, type Rank } from '../model/cards';
import { combinationFrequency } from '../model/frequency';

/**
 * bridgehands.com's tabeller over farvebehandlinger (Suit Combinations 0–9). Siden læses af scripts/bridgehands.ts
 * under udviklingen; appen henter intet udefra.
 */
export interface SourceCase {
  number: number;
  /** Fordelingen af spilførerens kort som på siden, fx "4-3". */
  split: string;
  /** Øverste linje: hånden (Syd). Kortene uden mellemrum, tieren som T, små kort som x. */
  hand: string;
  /** Nederste linje: bordet (Nord); tom ved renonce. */
  dummy: string;
  needs: number[];
  percents: number[];
  remark: string;
  /** Afsnittet på siden (1, 2 …); hvert afsnit nummererer sine cases fra 1, fx side 3: kongen og damen + knægten. */
  section?: number;
  /** Siden (0–9: modpartens honnørpoint), sat når siderne lægges sammen. */
  page?: number;
  /** Usikker case: kilden har et valg, der er tolket (fx "T/9"). */
  note?: string;
}

export interface ClassifiedCase extends SourceCase {
  usable: boolean;
  /** Hvorfor casen er sorteret fra. */
  reason: string | null;
}

function cellText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '|')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * En holding fra kilden: tieren som T, små kort som x (også "X"), og "-" som renonce. "T/9" betyder ét kort, der kan
 * være 10'eren eller 9'eren; det første kort, der ikke allerede er brugt, vælges, og valget noteres.
 */
function holdingLine(text: string, used: Set<string>, choices: string[]): string {
  const t = text.replace(/10/g, 'T').replace(/\s+/g, '').replace(/X/g, 'x');
  if (/^[-–—]$/.test(t)) return '';
  return t.replace(/([AKQJT2-9])\/([AKQJT2-9])/g, (_, a: string, b: string) => {
    const pick = used.has(a) ? b : a;
    used.add(pick);
    choices.push(`${a}/${b} som ${pick}`);
    return pick;
  });
}

/** Læser tabelrækkerne: case, fordeling, holding, mål, procent, bemærkning. */
const SECTION = /High Card Points? held by opponents/i;

/** Afsnittenes overskrifter, fx "3 High Card Point held by opponents - The Queen and Jack". */
export function sectionTitles(html: string): string[] {
  const titles: string[] = [];
  for (const row of html.split(/<tr[^>]*>/i).slice(1)) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => cellText(m[1]));
    const title = cells.find((c) => SECTION.test(c));
    if (title && cells.length < 6) titles.push(title);
  }
  return titles;
}

export function parseBridgehands(html: string): SourceCase[] {
  const cases: SourceCase[] = [];
  let section = 0;
  for (const row of html.split(/<tr[^>]*>/i).slice(1)) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => cellText(m[1]));
    if (cells.length < 6 && cells.some((c) => SECTION.test(c))) section++;
    if (cells.length !== 6 || !/^\d+$/.test(cells[0])) continue;
    const lines = cells[2].split('|').map((l) => l.trim());
    const numbers = (text: string) => text.split('|').map((t) => t.trim()).filter(Boolean).map(Number);
    const used = new Set<string>(), choices: string[] = [];
    const hand = holdingLine(lines[0] ?? '', used, choices);
    const dummy = holdingLine(lines[1] ?? '', used, choices);
    cases.push({
      number: Number(cells[0]),
      section: Math.max(1, section),
      // "5_3" er en tastefejl for "5-3".
      split: cells[1].replace(/_/g, '-'),
      hand,
      dummy,
      needs: numbers(cells[3]),
      percents: numbers(cells[4]),
      remark: cells[5].replace(/\s*\|\s*/g, ' | ').replace(/;\s*\|/g, ' |'),
      ...(choices.length ? { note: `Kilden skriver ${choices.join(' og ')}.` } : {}),
    });
  }
  return cases;
}

/**
 * Sorterer fejl i kilden fra: uklare "…", kortantal, der ikke passer med fordelingen, forskelligt antal mål og procenter,
 * mål over antal runder og dubletter (samme holding som en tidligere brugbar case).
 */
export function classifyCases(cases: readonly SourceCase[]): ClassifiedCase[] {
  const seen = new Map<string, string>();
  return cases.map((c) => {
    const reason = problem(c, seen);
    if (!reason) seen.set(`${c.hand}/${c.dummy}`, caseLabel(c));
    return { ...c, usable: reason === null, reason };
  });
}

/** Casens betegnelse på siden: nummeret, i andet afsnit og senere med afsnittet foran, fx "2.12". */
export function caseLabel(c: Pick<SourceCase, 'number' | 'section'>): string {
  return (c.section ?? 1) > 1 ? `${c.section}.${c.number}` : String(c.number);
}

/** En side fra bridgehands.com, som scripts/bridgehands.ts gemmer den. */
export interface SourcePage {
  /** 0–9: modpartens honnørpoint i farven. */
  number: number;
  page: string;
  /** Afsnittenes overskrifter i rækkefølge. */
  sections?: string[];
  url: string;
  fetched: string;
  cases: SourceCase[];
}

const POINTS: Record<number, number> = { 14: 4, 13: 3, 12: 2, 11: 1 };

/** Modpartens honnørpoint i farven: E 4, K 3, D 2 og B 1 for de honnører, spilføreren ikke har. */
export function opponentPoints(c: Pick<SourceCase, 'hand' | 'dummy'>): number {
  const ours = new Set([...c.hand, ...c.dummy].filter((s) => s !== 'x').map(rankFromSymbol));
  return [14, 13, 12, 11].filter((r) => !ours.has(r)).reduce((sum, r) => sum + POINTS[r], 0);
}

/**
 * Alle siders cases, sorteret fra hver side for sig og mærket med siden. Derefter på tværs af siderne: to cases med de
 * samme konkrete kort er samme kombination (fx Q 10 9 / x x på både side 7 og 8, eller K D 8 x x x og K D x x x x, når
 * x'erne er de laveste). Den, hvis side passer med modpartens honnørpoint, bliver; ellers den hyppigste. Kilden har
 * nogle cases på en side, der ikke passer med honnørpointene (fx E K 10 x / x x x på "damen mangler"); de bruges som de er.
 */
export function classifyPages(pages: readonly SourcePage[]): ClassifiedCase[] {
  const all: ClassifiedCase[] = pages.flatMap((p) => classifyCases(p.cases).map((c) => ({ ...c, page: p.number })));
  const groups = new Map<string, ClassifiedCase[]>();
  for (const c of all.filter((x) => x.usable)) {
    const h = concreteHands(c, 'lav');
    const id = `${cardsData(h.north)}-${cardsData(h.south)}`;
    groups.set(id, [...(groups.get(id) ?? []), c]);
  }
  const frequency = (c: ClassifiedCase) => {
    const f = frequencyHolding(c);
    return combinationFrequency(f.hand, f.dummy);
  };
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const fits = (c: ClassifiedCase) => opponentPoints(c) === c.page;
    let keep = group[0];
    for (const c of group.slice(1)) {
      const a = frequency(c), b = frequency(keep);
      if (fits(c) !== fits(keep) ? fits(c) : a.num * b.den > b.num * a.den) keep = c;
    }
    for (const c of group) {
      if (c !== keep) Object.assign(c, { usable: false, reason: `samme kort som side ${keep.page} case ${caseLabel(keep)}` });
    }
  }
  return all;
}

function problem(c: SourceCase, seen: ReadonlyMap<string, string>): string | null {
  if (/\.\.\.|…/.test(c.hand + c.dummy)) return 'uklart antal kort (…)';
  const [a, b] = c.split.split('-').map(Number);
  if (c.hand.length !== a || c.dummy.length !== b) return `holdingen har ${c.hand.length}+${c.dummy.length} kort, men fordelingen er ${c.split}`;
  if (!c.needs.length || c.needs.length !== c.percents.length) return `${c.needs.length} mål, men ${c.percents.length} procenter`;
  const rounds = Math.max(a, b);
  if (c.needs.some((n) => n > rounds || n < 1)) return 'et mål er større end antal runder';
  try {
    concreteHands(c, 'lav');
  } catch (e) {
    return (e as Error).message;
  }
  // Hyppigheden kræver, at x'erne er kort under det laveste navngivne kort.
  const f = frequencyHolding(c);
  const symbols = [...f.hand, ...f.dummy];
  const named = symbols.filter((s) => s !== 'x').map(rankFromSymbol);
  const lowest = named.length ? Math.min(...named) : 15;
  if (symbols.filter((s) => s === 'x').length > lowest - 2) return 'for få små kort under det laveste navngivne kort til x';
  const dup = seen.get(`${c.hand}/${c.dummy}`);
  if (dup !== undefined) return `dublet af case ${dup}`;
  return null;
}

/**
 * To fortolkninger af x:
 * - "lav": spilførerens x'er er de laveste kort (2, 3, 4 …), så modparten har de højere små kort.
 * - "høj": spilførerens x'er er de højeste kort under det laveste navngivne kort, så modpartens små kort er lavere.
 */
export type XRule = 'lav' | 'høj';

export function concreteHands(c: Pick<SourceCase, 'hand' | 'dummy'>, rule: XRule): { north: Rank[]; south: Rank[] } {
  const named = [...c.hand, ...c.dummy].filter((s) => s !== 'x').map(rankFromSymbol);
  if (new Set(named).size !== named.length) throw new Error('et kort står to gange');
  const xs = (c.hand.match(/x/g) ?? []).length + (c.dummy.match(/x/g) ?? []).length;
  const lowestNamed = named.length ? Math.min(...named) : 15;
  const free = ALL_RANKS.filter((r) => !named.includes(r)); // faldende
  const pool = xs === 0 ? [] : rule === 'lav' ? free.slice(-xs) : free.filter((r) => r < lowestNamed).slice(0, xs);
  if (pool.length < xs) throw new Error('for få kort til x');
  // Hånden får de højeste x'er; for reglen "lav" er rækkefølgen uden betydning.
  const handX = (c.hand.match(/x/g) ?? []).length;
  const toRanks = (text: string, extra: Rank[]) => [...text].filter((s) => s !== 'x').map(rankFromSymbol).concat(extra).sort((p, q) => q - p);
  return {
    south: toRanks(c.hand, pool.slice(0, handX)),
    north: toRanks(c.dummy, pool.slice(handX)),
  };
}

/**
 * Holdingen i x-notation til hyppighedsformlen. Navngivne små kort, der er de allerlaveste (2, 3, 4 …), regnes som x,
 * fx E B 3 2 / K 5 4 → E B x x / K x x. Andre navngivne kort bevares.
 */
export function frequencyHolding(c: Pick<SourceCase, 'hand' | 'dummy'>): { hand: string; dummy: string } {
  const named = [...c.hand, ...c.dummy].filter((s) => s !== 'x').map(rankFromSymbol);
  let bottom = 2;
  while (named.includes(bottom)) bottom++;
  const asX = (text: string) => [...text].map((s) => (s !== 'x' && rankFromSymbol(s) < bottom ? 'x' : s)).join('');
  return { hand: asX(c.hand), dummy: asX(c.dummy) };
}
