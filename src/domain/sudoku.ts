import type { SuitLengths } from './cards';

export type Defender = 'E' | 'W';

/** En ledetråd om én forsvarers farvelængder. */
export interface Constraint {
  seat: Defender;
  holds(lengths: SuitLengths): boolean;
}

export interface Layout {
  east: SuitLengths;
  west: SuitLengths;
}

/** Alle måder at dele 13 kort i fire farver (♠♥♦♣): 560 fordelinger. */
export const SPLITS: readonly SuitLengths[] = (() => {
  const result: SuitLengths[] = [];
  for (let s = 0; s <= 13; s++) {
    for (let h = 0; h <= 13 - s; h++) {
      for (let d = 0; d <= 13 - s - h; d++) result.push([s, h, d, 13 - s - h - d]);
    }
  }
  return result;
})();

/**
 * Løseren: filtrerer Østs højst 560 mulige fordelinger med ledetrådene. Vest følger af
 * søjlesummerne (13 kort i hver farve) og skal opfylde sine egne ledetråde.
 */
export function solveSudoku(north: SuitLengths, south: SuitLengths, constraints: readonly Constraint[]): Layout[] {
  const rest = north.map((n, s) => 13 - n - south[s]);
  const result: Layout[] = [];
  for (const east of SPLITS) {
    if (east.some((l, s) => l > rest[s])) continue;
    const west = east.map((l, s) => rest[s] - l) as unknown as SuitLengths;
    if (constraints.every((c) => c.holds(c.seat === 'E' ? east : west))) result.push({ east, west });
  }
  return result;
}
