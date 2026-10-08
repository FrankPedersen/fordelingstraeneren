import { suitLengths, type Card } from '../../domain/cards';
import { dealWith, type Hands } from '../../domain/dealer';
import { patternOf } from '../../domain/patterns';
import { mulberry32, type Rng } from '../../engine/rng';
import { chooseCall, hcpOf } from '../../system/interpreter';
import { LIMITS, majorFit, P_MODEL, P_RANGE, pOf, stoppedSuits, type Limits } from './pmodel';

export { P_RANGE };

/**
 * Generatoren (SPEC-haandevaluering.md, Generator): fordelinger fra motorens kortgiver med en seedbar PRNG. Du er Syd,
 * makker er Nord, og begge hænder er synlige i første version. Øvelserne viser ingen hyppigheder, så fordelingerne må
 * udvælges. Facit regnes af modellen (`training/scoring.ts`), aldrig her. Samme seed og øvelse giver samme opgave.
 */

/** Opgave 1–9 i specens rækkefølge. */
export type Exercise =
  | 'honors'
  | 'distribution'
  | 'add'
  | 'decision'
  | 'partner'
  | 'strain'
  | 'wasted'
  | 'compare'
  | 'form';

export const EXERCISES: readonly Exercise[] = [
  'honors',
  'distribution',
  'add',
  'decision',
  'partner',
  'strain',
  'wasted',
  'compare',
  'form',
];

/** Opgave 8 (Sammenlign metoder) og 9 (Turneringsform) kommer i leverancetrin 4. */
export const GENERATED: readonly Exercise[] = ['honors', 'distribution', 'add', 'decision', 'partner', 'strain', 'wasted'];

export type Level = 1 | 2 | 3 | 4 | 5;

/** Niveauerne (SPEC, Øvelser og niveauer). Niveau 5 har opgave 9 og blandede opgaver fra alle niveauer. */
export const LEVEL_EXERCISES: Record<Level, readonly Exercise[]> = {
  1: ['honors', 'partner'],
  2: ['distribution', 'add'],
  3: ['decision', 'wasted'],
  4: ['strain', 'compare'],
  5: EXERCISES,
};

/** De øvelser, niveauet giver nu. */
export function exercisesFor(level: Level): Exercise[] {
  return LEVEL_EXERCISES[level].filter((e) => GENERATED.includes(e));
}

interface Base {
  seed: number;
  /** Alle fire hænder fra kortgiveren; Syd er dig, Nord er makker. */
  hands: Hands;
}

/** Opgave 1: hvor mange honnørpoint har du? */
export interface HonorsTask extends Base {
  exercise: 'honors';
}

/** Opgave 2: fitten er bekræftet; hvad er din p nu? */
export interface DistributionTask extends Base {
  exercise: 'distribution';
  /** Fittens farve: 0 = ♠, 1 = ♥. */
  trump: number;
}

/**
 * Opgave 3: makker har åbnet; hvilke led gælder?
 * - `no-fit`: makker åbner i farve, og der er ingen kendt major-fit (kun honnørpoint);
 * - `fit`: makker åbner 1♥ eller 1♠, og du har mindst 3 kort i farven (honnørpoint + fordeling);
 * - `notrump`: makker åbner 1NT, og du er balanceret uden firekortsmajor (sansmodellen).
 */
export type AddScenario = 'no-fit' | 'fit' | 'notrump';

export interface AddTask extends Base {
  exercise: 'add';
  scenario: AddScenario;
  /** Makkers åbning efter systemfilen, fx "1S" eller "1NT". */
  opening: string;
}

/**
 * Opgave 4: delkontrakt, udgang, lilleslem eller storeslem? P ligger inden for ±2 af udgangs- eller lilleslemsgrænsen,
 * altså højst 37; storeslem er et svarvalg, men aldrig det rigtige i første version (Franks afgørelse).
 */
export interface DecisionTask extends Base {
  exercise: 'decision';
  trump: number;
  /** Grænsen, opgaven er valgt omkring: udgang (28½) eller lilleslem (35). */
  limit: number;
}

/** Opgave 5: du har p; hvad skal makker have til udgang? */
export interface PartnerTask extends Base {
  exercise: 'partner';
  trump: number;
}

/** Opgave 6: 4M eller 3NT? Med en major-fit er `trump` fittens farve, ellers null. */
export interface StrainTask extends Base {
  exercise: 'strain';
  trump: number | null;
}

/** Opgave 7: makker har vist korthed i `short`; hvad er din p nu? */
export interface WastedTask extends Base {
  exercise: 'wasted';
  trump: number;
  short: number;
}

export type HandTask = HonorsTask | DistributionTask | AddTask | DecisionTask | PartnerTask | StrainTask | WastedTask;

/** Kvalitetskravet i opgave 4: P højst så langt fra grænsen (SPEC, Generator 3). */
export const DECISION_WINDOW = 2;

/** Opgave 5: dine point ligger i MODEL.md-tabellens område (12–24) med lidt luft, så makker skal have noget. */
export const PARTNER_RANGE = { min: 10, max: 24 } as const;

/** Sansopgaverne i opgave 6 har 24–26 HCP i alt, hvor MODEL.md 2 har tallene for stoppere. */
export const NOTRUMP_HCP = P_MODEL.sans.stoppere.hcp as [number, number];

/** Højst så mange fordelinger pr. opgave; findes ingen, er der en fejl i kravene. */
const MAX_DEALS = 500_000;

const BALANCED = new Set(['4-3-3-3', '4-4-3-2', '5-3-3-2']);
const isBalanced = (hand: readonly Card[]) => BALANCED.has(patternOf(suitLengths(hand)).id);

/** Parrets P med fitten. */
export function pairP(hands: Hands, trump: number, partnerShort: readonly number[] = []): number {
  return pOf(hands.S, { trump, partnerShort }).p + pOf(hands.N, { trump }).p;
}

function find<T>(rng: Rng, accept: (hands: Hands) => T | null): { hands: Hands; value: T } {
  for (let i = 0; i < MAX_DEALS; i++) {
    const hands = dealWith(rng);
    const value = accept(hands);
    if (value !== null) return { hands, value };
  }
  throw new Error('Generatoren fandt ingen fordeling');
}

const hasRank = (hand: readonly Card[], suit: number, ranks: readonly number[]) =>
  hand.some((c) => Math.floor(c / 13) === suit && ranks.includes(c % 13));

export function makeTask(exercise: Exercise, seed: number, limits: Limits = LIMITS): HandTask {
  const rng = mulberry32(seed);
  switch (exercise) {
    case 'honors':
      return { exercise, seed, hands: dealWith(rng) };
    case 'distribution': {
      const { hands, value } = find(rng, (h) => majorFit(h.S, h.N));
      return { exercise, seed, hands, trump: value };
    }
    case 'add': {
      const scenario = (['no-fit', 'fit', 'notrump'] as const)[rng.int(3)];
      const { hands, value } = find(rng, (h) => {
        const opening = chooseCall('opening', h.N)?.call;
        const lengths = suitLengths(h.S);
        const major = opening === '1S' ? 0 : opening === '1H' ? 1 : null;
        if (scenario === 'no-fit') {
          if (!opening || !/^1[SHDC]$/.test(opening)) return null;
          return major === null || lengths[major] <= 2 ? opening : null;
        }
        if (scenario === 'fit') return major !== null && lengths[major] >= 3 ? opening! : null;
        return opening === '1NT' && isBalanced(h.S) && lengths[0] <= 3 && lengths[1] <= 3 ? opening : null;
      });
      return { exercise, seed, hands, scenario, opening: value };
    }
    case 'decision': {
      // Grænserne udgang og lilleslem vælges lige ofte; P bliver dermed højst 35 + 2 = 37.
      const allowed = [limits.game, limits.slam];
      const limit = allowed[rng.int(allowed.length)];
      const { hands, value } = find(rng, (h) => {
        const fit = majorFit(h.S, h.N);
        if (fit === null) return null;
        const P = pairP(h, fit);
        return Math.abs(P - limit) <= DECISION_WINDOW && P >= P_RANGE.min && P <= P_RANGE.max ? fit : null;
      });
      return { exercise, seed, hands, trump: value, limit };
    }
    case 'partner': {
      const { hands, value } = find(rng, (h) => {
        const fit = majorFit(h.S, h.N);
        if (fit === null) return null;
        const p = pOf(h.S, { trump: fit }).p;
        return p >= PARTNER_RANGE.min && p <= PARTNER_RANGE.max ? fit : null;
      });
      return { exercise, seed, hands, trump: value };
    }
    case 'strain': {
      const major = rng.int(2) === 0;
      const { hands, value } = find(rng, (h) => {
        const fit = majorFit(h.S, h.N);
        if (major) {
          if (fit === null) return null;
          const P = pairP(h, fit);
          return P >= limits.game && P < limits.slam ? fit : null;
        }
        if (fit !== null || !isBalanced(h.S) || !isBalanced(h.N)) return null;
        const hcp = hcpOf(h.S) + hcpOf(h.N);
        return hcp >= NOTRUMP_HCP[0] && hcp <= NOTRUMP_HCP[1] && stoppedSuits(h.S, h.N).length === 4 ? -1 : null;
      });
      return { exercise, seed, hands, trump: value < 0 ? null : value };
    }
    case 'wasted': {
      // En tredjedel med en konge i makkers korte farve, en tredjedel med dame eller knægt uden kongen, resten frit.
      const variant = rng.int(3);
      const { hands, value } = find(rng, (h) => {
        const fit = majorFit(h.S, h.N);
        if (fit === null || suitLengths(h.N)[fit] < 4) return null;
        const lengths = suitLengths(h.N);
        const sides = [0, 1, 2, 3].filter((s) => s !== fit && lengths[s] <= 1);
        if (!sides.length) return null;
        const short = sides.reduce((a, b) => (lengths[b] < lengths[a] ? b : a));
        const king = hasRank(h.S, short, [11]);
        if (variant === 0 && !king) return null;
        if (variant === 1 && (king || !hasRank(h.S, short, [10, 9]))) return null;
        return { trump: fit, short };
      });
      return { exercise, seed, hands, ...value };
    }
    case 'compare':
    case 'form':
      throw new Error(`Opgaven "${exercise}" kommer i leverancetrin 4`);
  }
}
