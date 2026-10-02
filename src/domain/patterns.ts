import type { SuitLengths } from './cards';
import { SUIT_WAYS, TOTAL_HANDS, ratioPercent } from './combinatorics';

export type Grade = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** Graderne fra hyppigst til sjældnest; nummeret 1–5 er også niveauet. */
export const GRADES: readonly Grade[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export const GRADE_LABEL: Record<Grade, string> = {
  common: 'almindelig',
  uncommon: 'ualmindelig',
  rare: 'sjælden',
  epic: 'episk',
  legendary: 'legendarisk',
};

/** Familien er den længste farve: 4, 5, 6 eller 7 (= 7+). */
export type Family = 4 | 5 | 6 | 7;

export interface Pattern {
  /** Faldende med bindestreg, fx "5-4-2-2". */
  readonly id: string;
  /** Farvelængderne i faldende orden. */
  readonly lengths: readonly [number, number, number, number];
  /** Antal måder at lægge længderne på de fire farver: 4, 12 eller 24. */
  readonly placements: number;
  /** Antal 13-korts hænder med mønstret. Sandsynligheden er eksakt hands / TOTAL_HANDS. */
  readonly hands: bigint;
  /** Sandsynligheden som kommatal, til visning og sammenligning. */
  readonly p: number;
  /** 1 + antallet af strengt hyppigere mønstre, så lige sandsynlige mønstre deler rang. */
  readonly rank: number;
  readonly grade: Grade;
  readonly family: Family;
  /** Antal ud af 100 hænder med største-rest-afrunding; summen over alle 39 er 100. */
  readonly per100: number;
  /** N i "1 ud af N", dvs. round(1/p). */
  readonly oneIn: number;
}

// Gradernes nedre grænser: p ≥ 1/10, 1/40, 1/100 og 1/1000 (10 %, 2,5 %, 1 % og 0,1 %).
const GRADE_FLOORS: [Grade, bigint][] = [
  ['common', 10n],
  ['uncommon', 40n],
  ['rare', 100n],
  ['epic', 1000n],
];

function gradeOf(hands: bigint): Grade {
  for (const [grade, denominator] of GRADE_FLOORS) {
    if (hands * denominator >= TOTAL_HANDS) return grade;
  }
  return 'legendary';
}

/** Alle måder at skrive 13 som fire faldende længder. */
function allLengths(): [number, number, number, number][] {
  const result: [number, number, number, number][] = [];
  for (let a = 13; a >= 4; a--) {
    for (let b = Math.min(a, 13 - a); b >= 0; b--) {
      for (let c = Math.min(b, 13 - a - b); c >= 0; c--) {
        const d = 13 - a - b - c;
        if (d <= c) result.push([a, b, c, d]);
      }
    }
  }
  return result;
}

/** n = 4! / ∏ m_k!, hvor m_k er antallet af farver med samme længde. */
function placementsOf(lengths: readonly number[]): number {
  let n = 24;
  for (const length of new Set(lengths)) {
    const m = lengths.filter((l) => l === length).length;
    for (let i = 2; i <= m; i++) n /= i;
  }
  return n;
}

/** Fordeler `total` efter vægtene med største-rest-metoden, så summen er præcis `total`. */
function largestRemainder(weights: readonly bigint[], total: number): number[] {
  const sum = weights.reduce((a, w) => a + w, 0n);
  const result = weights.map((w) => Number((w * BigInt(total)) / sum));
  const missing = total - result.reduce((a, n) => a + n, 0);
  weights
    .map((w, i) => ({ i, rest: (w * BigInt(total)) % sum }))
    // Største rest først; ved lige rest vinder det tidligste (hyppigste) mønster.
    .sort((x, y) => (x.rest === y.rest ? x.i - y.i : x.rest > y.rest ? -1 : 1))
    .slice(0, missing)
    .forEach(({ i }) => result[i]++);
  return result;
}

function compareLengths(x: readonly number[], y: readonly number[]): number {
  const i = x.findIndex((l, k) => l !== y[k]);
  return i < 0 ? 0 : x[i] - y[i];
}

function buildPatterns(): Pattern[] {
  const rows = allLengths().map((lengths) => {
    const placements = placementsOf(lengths);
    const hands = lengths.reduce((product, l) => product * SUIT_WAYS[l], BigInt(placements));
    return { lengths, placements, hands };
  });
  // Faldende sandsynlighed; lige sandsynlige mønstre ordnes efter længste farve (7-5-1-0 før 8-3-2-0).
  rows.sort((x, y) =>
    x.hands === y.hands ? compareLengths(x.lengths, y.lengths) : x.hands > y.hands ? -1 : 1,
  );
  const per100 = largestRemainder(
    rows.map((r) => r.hands),
    100,
  );
  return rows.map(({ lengths, placements, hands }, i) => ({
    id: lengths.join('-'),
    lengths,
    placements,
    hands,
    p: Number(hands) / Number(TOTAL_HANDS),
    rank: rows.findIndex((r) => r.hands === hands) + 1,
    grade: gradeOf(hands),
    family: Math.min(lengths[0], 7) as Family,
    per100: per100[i],
    oneIn: Number((2n * TOTAL_HANDS + hands) / (2n * hands)),
  }));
}

/** De 39 mønstre sorteret efter rang. */
export const PATTERNS: readonly Pattern[] = buildPatterns();

/** Klubaftenens mønstre: dem, der får mindst én af de 100 hænder (25 spil × 4 hænder). */
export const CLUB_PATTERNS: readonly Pattern[] = PATTERNS.filter((p) => p.per100 > 0);

const BY_ID = new Map(PATTERNS.map((p) => [p.id, p]));

export function patternById(id: string): Pattern {
  const pattern = BY_ID.get(id);
  if (!pattern) throw new Error(`Ukendt mønster: ${id}`);
  return pattern;
}

export function findPattern(id: string): Pattern | undefined {
  return BY_ID.get(id);
}

/** Mønstret for fire farvelængder i vilkårlig orden, fx [2, 5, 2, 4] → 5-4-2-2. */
export function patternOf(lengths: readonly number[]): Pattern {
  return patternById([...lengths].sort((a, b) => b - a).join('-'));
}

/** Andelen af alle hænder i procent, eksakt afrundet (halvt op) til `decimals` decimaler. */
export function percent(hands: bigint, decimals = 2): number {
  return ratioPercent(hands, TOTAL_HANDS, decimals);
}

/** En konkret fordeling i farveordenen ♠♥♦♣ med lighedstegn, fx 2=5=2=4. */
export function distributionText(lengths: SuitLengths): string {
  return lengths.join('=');
}
