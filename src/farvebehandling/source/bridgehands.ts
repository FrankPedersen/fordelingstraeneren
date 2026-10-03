import { ALL_RANKS, rankFromSymbol, type Rank } from '../model/cards';

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

function holdingLine(text: string): string {
  return text.replace(/10/g, 'T').replace(/\s+/g, '');
}

/** Læser tabelrækkerne: case, fordeling, holding, mål, procent, bemærkning. */
export function parseBridgehands(html: string): SourceCase[] {
  const cases: SourceCase[] = [];
  for (const row of html.split(/<tr[^>]*>/i).slice(1)) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => cellText(m[1]));
    if (cells.length !== 6 || !/^\d+$/.test(cells[0])) continue;
    const lines = cells[2].split('|').map((l) => l.trim());
    const numbers = (text: string) => text.split('|').map((t) => t.trim()).filter(Boolean).map(Number);
    cases.push({
      number: Number(cells[0]),
      split: cells[1],
      hand: holdingLine(lines[0] ?? ''),
      dummy: holdingLine(lines[1] ?? ''),
      needs: numbers(cells[3]),
      percents: numbers(cells[4]),
      remark: cells[5].replace(/\s*\|\s*/g, ' | ').replace(/;\s*\|/g, ' |'),
    });
  }
  return cases;
}

/**
 * Sorterer fejl i kilden fra: uklare "…", kortantal, der ikke passer med fordelingen, forskelligt antal mål og procenter,
 * mål over antal runder og dubletter (samme holding som en tidligere brugbar case).
 */
export function classifyCases(cases: readonly SourceCase[]): ClassifiedCase[] {
  const seen = new Map<string, number>();
  return cases.map((c) => {
    const reason = problem(c, seen);
    if (!reason) seen.set(`${c.hand}/${c.dummy}`, c.number);
    return { ...c, usable: reason === null, reason };
  });
}

function problem(c: SourceCase, seen: ReadonlyMap<string, number>): string | null {
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
