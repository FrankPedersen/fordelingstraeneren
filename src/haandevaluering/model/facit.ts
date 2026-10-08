import { hcpOf } from '../../system/interpreter';
import { parseHand } from './hand';
import {
  chances,
  contractFor,
  controlsOf,
  expectedTricks,
  gameThreshold,
  majorFit,
  notrumpPoints,
  partnerNeeds,
  pOf,
  rightDecisions,
  SHORTNESS_BY_PATTERN,
  stoppedSuits,
  strainFor,
  zarPoints,
  type Decision,
  type Form,
  type Strain,
} from './pmodel';

/**
 * Facitfilen `content/p-model.facit.json` (SPEC-haandevaluering.md, Fælles med konventionstræneren): eksempelhænder
 * med modellens resultater. Hænderne står i PBN-notation (`hand.ts`) og farverne som S, H, D og C, så filen kan læses
 * uden appens kode. Facittesten regner hver post igen med appens model; konventionstræneren kører samme test på sin kopi.
 */

export type SuitLetter = 'S' | 'H' | 'D' | 'C';
const LETTERS: readonly SuitLetter[] = ['S', 'H', 'D', 'C'];
const suitIndex = (s: SuitLetter) => LETTERS.indexOf(s);

/** Tal i facitfilen afrundes til fire decimaler. */
export const round4 = (x: number) => Math.round(x * 10_000) / 10_000;

export interface HandInput {
  id: string;
  /** Hvor eksemplet kommer fra, fx specens accepttest. */
  kilde: string;
  haand: string;
  /** Trumffarven, når fitten er bekræftet; ellers null (kun honnørpoint). */
  trumf: SuitLetter | null;
  /** Farver, hvor makker har vist korthed. */
  makkersKorthed: SuitLetter[];
}

export interface HandFacit {
  hcp: number;
  honnoerpoint: number;
  trumflaengde: number;
  kortfarvepoint: number;
  spildte: number;
  p: number;
  sanspoint: number;
  zar: number;
}

export function handFacit(e: HandInput): HandFacit {
  const hand = parseHand(e.haand);
  const p = pOf(hand, { trump: e.trumf === null ? undefined : suitIndex(e.trumf), partnerShort: e.makkersKorthed.map(suitIndex) });
  return {
    hcp: hcpOf(hand),
    honnoerpoint: p.honors,
    trumflaengde: p.trump,
    kortfarvepoint: p.shortness,
    spildte: p.wasted,
    p: p.p,
    sanspoint: notrumpPoints(hand),
    zar: zarPoints(hand).zp,
  };
}

export interface PairInput {
  id: string;
  kilde: string;
  syd: string;
  nord: string;
}

export interface PairFacit {
  /** Den længste 8+ major-fit, ellers null. */
  trumf: SuitLetter | null;
  /** P = Syds p + Nords p med fitten; null uden major-fit. */
  P: number | null;
  stik: number | null;
  /** Chancen i procent for 4M, 6M og 7M. */
  '4M': number | null;
  '6M': number | null;
  '7M': number | null;
  kontrakt: Decision | null;
  /** De rigtige svar i Niveaubeslutningen. */
  svar: Decision[] | null;
  /** Syds krav til makker for udgang, regnet af Syds p med fitten (eller honnørpointene uden fit). */
  makkerSkalHave: number;
  sanspoint: number;
  stoppede: SuitLetter[];
  /** Farve eller sans: major, notrump eller null (ingen af reglerne gælder). */
  retning: Strain | null;
}

export function pairFacit(e: PairInput): PairFacit {
  const south = parseHand(e.syd), north = parseHand(e.nord);
  if (south.some((c) => north.includes(c))) throw new Error(`${e.id}: Syd og Nord har samme kort`);
  const fit = majorFit(south, north);
  const stopped = stoppedSuits(south, north).map((s) => LETTERS[s]);
  const common = {
    sanspoint: notrumpPoints(south) + notrumpPoints(north),
    stoppede: stopped,
    retning: strainFor(south, north),
  };
  if (fit === null) {
    return {
      trumf: null,
      P: null,
      stik: null,
      '4M': null,
      '6M': null,
      '7M': null,
      kontrakt: null,
      svar: null,
      makkerSkalHave: partnerNeeds(pOf(south).p),
      ...common,
    };
  }
  const own = pOf(south, { trump: fit }).p;
  const P = own + pOf(north, { trump: fit }).p;
  const controls = controlsOf(south, north, fit);
  const c = chances(P);
  return {
    trumf: LETTERS[fit],
    P,
    stik: round4(expectedTricks(P)),
    '4M': round4(c.game),
    '6M': round4(c.slam),
    '7M': round4(c.grand),
    kontrakt: contractFor(P, controls),
    svar: rightDecisions(P, controls),
    makkerSkalHave: partnerNeeds(own),
    ...common,
  };
}

export interface PFacit {
  P: number;
  stik: number;
  '4M': number;
  '6M': number;
  '7M': number;
  /** Kontrakten med alle kontroller. */
  kontrakt: Decision;
  svar: Decision[];
}

export function pFacit(P: number): PFacit {
  const c = chances(P);
  return {
    P,
    stik: round4(expectedTricks(P)),
    '4M': round4(c.game),
    '6M': round4(c.slam),
    '7M': round4(c.grand),
    kontrakt: contractFor(P),
    svar: rightDecisions(P),
  };
}

export interface FacitFile {
  om: string;
  haender: (HandInput & { facit: HandFacit })[];
  par: (PairInput & { facit: PairFacit })[];
  P: PFacit[];
  /** MODEL.md 1, "Hvad makker skal have". */
  makkerSkalHave: { du: number; makker: number }[];
  /** Kortfarvepoint for alle 39 mønstre. */
  moenstre: Record<string, number>;
  /** Udgangsgrænsen i P for hver turneringsform. */
  turnering: Record<Form, number>;
}

export const FORMS: readonly Form[] = ['impVulnerable', 'impNotVulnerable', 'pairs'];

export function buildFacitFile(hands: HandInput[], pairs: PairInput[], ps: number[], yours: number[]): FacitFile {
  return {
    om: 'Facit for P-modellen (content/p-model.json), regnet af appens model og skrevet af scripts/p-model-facit.ts. Hænderne står i PBN (♠.♥.♦.♣, A K Q J T); tal er afrundet til fire decimaler. Konventionstræneren kører samme facittest på sin kopi.',
    haender: hands.map((h) => ({ ...h, facit: handFacit(h) })),
    par: pairs.map((p) => ({ ...p, facit: pairFacit(p) })),
    P: ps.map(pFacit),
    makkerSkalHave: yours.map((du) => ({ du, makker: partnerNeeds(du) })),
    moenstre: { ...SHORTNESS_BY_PATTERN },
    turnering: Object.fromEntries(FORMS.map((f) => [f, gameThreshold(f)])) as Record<Form, number>,
  };
}
