import type { Card } from '../../domain/cards';
import type { Farve, Raa, RaaOpgave } from './hjaelp';

/**
 * Kompendiets udspilsråd mod dobbeltdummy (SPEC-udspilsraad.md): udvælgelsen af A og B pr. hånd, tallene pr. hånd,
 * statistikken og dommen pr. række og tabellerne til afsnit 7a i docs/MODEL.md. Ren kode: datasættet gives som
 * argument (tools/udspil/raadanalyse.mjs læser filerne), og modulet bruges kun af testene og scriptet, ikke af appen.
 *
 * Session 1: kun signaturerne og rækkernes data. Hver funktion kaster "ikke bygget", indtil session 2 bygger analysen;
 * accepttestene står i raadanalyse.test.ts. Kontrakten herunder er accepttestenes. Session 2 må udvide `Resultat` og
 * tilføje eksporter (fx tabellen for S4 og S6, hyppigheden og trumfs plads), men ikke ændre det, testene bruger.
 *
 * Kortene er 0–51 som i `domain/cards.ts` (farve × 13 + valør − 2, farverne ♠ 0, ♥ 1, ♦ 2, ♣ 3), og valørerne 2–14.
 */

export type SituationId =
  | 'S1-1nt-3nt'
  | 'S2-stayman'
  | 'S3-transfer'
  | 'S4-kun-en-farve'
  | 'S5-sidefarve'
  | 'S6-trumf'
  | 'S7-makker-aabnet'
  | 'S8-delkontrakt';

export type VariantId = 'S4-singleton' | 'S5-singleton' | 'S8-singleton' | 'S4-doubleton' | 'S8-doubleton' | 'S1-tablefeeling' | 'S2-tablefeeling';

export type PaastandId = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7' | 'P8' | 'P9';

/**
 * Rækkerne i hovedtabellen. P3 og P8 har én række pr. B-farve (P3: ♦ og ♣; P8: hver sidefarve), de andre én række.
 * I P8 er A trumf, så rækken med trumf som B findes ikke i den situation (`udvaelg` giver null).
 */
export type RaekkeId = 'P1' | 'P2' | 'P3-D' | 'P3-C' | 'P4' | 'P5' | 'P6' | 'P7' | 'P8-S' | 'P8-H' | 'P8-D' | 'P8-C' | 'P9';

export interface Raekke {
  id: RaekkeId;
  paastand: PaastandId;
  /** Situationerne, rækken bruger (specens kolonne "Situation, data"). */
  situationer: readonly SituationId[];
  /** true: én række over alle situationerne (S1 + S2); false: én række pr. situation (S4, S5, S8). */
  samlet: boolean;
  /** Varianterne, hvis hænder kommer oven i basens ("base + variant"); tom: kun basen. */
  varianter: readonly VariantId[];
}

/** Rækkerne efter specens tabel (Påstandene). */
export const RAEKKER: readonly Raekke[] = [
  { id: 'P1', paastand: 'P1', situationer: ['S1-1nt-3nt', 'S2-stayman'], samlet: true, varianter: [] },
  { id: 'P2', paastand: 'P2', situationer: ['S1-1nt-3nt', 'S2-stayman'], samlet: true, varianter: [] },
  { id: 'P3-D', paastand: 'P3', situationer: ['S3-transfer'], samlet: true, varianter: [] },
  { id: 'P3-C', paastand: 'P3', situationer: ['S3-transfer'], samlet: true, varianter: [] },
  { id: 'P4', paastand: 'P4', situationer: ['S3-transfer'], samlet: true, varianter: [] },
  { id: 'P5', paastand: 'P5', situationer: ['S4-kun-en-farve', 'S5-sidefarve', 'S8-delkontrakt'], samlet: false, varianter: ['S4-singleton', 'S5-singleton', 'S8-singleton'] },
  { id: 'P6', paastand: 'P6', situationer: ['S4-kun-en-farve', 'S8-delkontrakt'], samlet: false, varianter: ['S4-doubleton', 'S8-doubleton'] },
  { id: 'P7', paastand: 'P7', situationer: ['S4-kun-en-farve'], samlet: true, varianter: [] },
  { id: 'P8-S', paastand: 'P8', situationer: ['S6-trumf', 'S4-kun-en-farve'], samlet: false, varianter: [] },
  { id: 'P8-H', paastand: 'P8', situationer: ['S6-trumf', 'S8-delkontrakt'], samlet: false, varianter: [] },
  { id: 'P8-D', paastand: 'P8', situationer: ['S6-trumf', 'S4-kun-en-farve', 'S8-delkontrakt'], samlet: false, varianter: [] },
  { id: 'P8-C', paastand: 'P8', situationer: ['S4-kun-en-farve', 'S8-delkontrakt'], samlet: false, varianter: [] },
  { id: 'P9', paastand: 'P9', situationer: ['S1-1nt-3nt', 'S2-stayman'], samlet: true, varianter: ['S1-tablefeeling', 'S2-tablefeeling'] },
];

// ---------------------------------------------------------------- udvælgelsen

/** Én side af sammenligningen: farven og profilen Standards kort i den, stigende (to ved "table feeling", ellers ét). */
export interface Side {
  farve: Farve;
  kort: Card[];
}

/**
 * A og B for én hånd i én række, og underopdelingen: P2 `['1–2']`, `['3']` eller `['4+']` (den korteste majors
 * længde), P9 `[top, længde]` med top `'E K'`, `'K D'` eller `'D B'` og længde `'3'`, `'4'` eller `'5+'`; ellers `[]`.
 */
export interface Valg {
  a: Side;
  b: Side;
  grupper: string[];
}

/** Hånden passer i rækken, men A er ikke entydig (fx to lige lange majorer i P2); `udeladt` er årsagen. */
export interface Udeladt {
  udeladt: string;
}

/**
 * A og B for Vests hånd i rækken og situationen efter specens regler (Påstandene), uden at se på stikkene:
 * - kortet i en farve er det, profilen Standard spiller (`muligeUdspil` med `profil('standard')`, sans eller farve
 *   efter kontrakten); ved "table feeling" begge kort (undtagen i P9, hvor A er toppen og B det lave kort);
 * - har hånden flere farver, der passer som B, vælges den længste og ved lige længde den højeste (♠ ♥ ♦ ♣);
 * - passer hånden, men er A ikke entydig, gives `Udeladt`;
 * - null, når hånden ikke passer i rækken (fx ingen B-farve, renonce i A eller B, eller trumf som B i P8).
 * Honnørerne er E, K, D og B; en sidefarve er en farve, der ikke er trumf. "Table feeling" er `tableFeeling` i hjaelp.ts.
 */
export function udvaelg(raekke: RaekkeId, situation: SituationId, vest: readonly Card[]): Valg | Udeladt | null {
  void raekke;
  void situation;
  void vest;
  throw ikkeBygget('udvaelg');
}

// ---------------------------------------------------------------- tallene pr. hånd

/** Én hånds tal: A's og B's middelstik (modspillets stik) og andelen (0–1) af fordelingerne, hvor kontrakten sættes. */
export interface Haandtal {
  a: number;
  b: number;
  aSaet: number;
  bSaet: number;
}

/**
 * Tallene for én hånd ud fra rådataene (stikkene pr. fordeling og kort). For en side med to kort bruges kortet med
 * flest middelstik (står de lige, det med flest sætninger). Kontrakten giver målet for at sætte (3NT: 4 stik).
 */
export function haandtal(valg: Valg, opgave: Pick<RaaOpgave, 'vest' | 'stik'>, kontrakt: string): Haandtal {
  void valg;
  void opgave;
  void kontrakt;
  throw ikkeBygget('haandtal');
}

// ---------------------------------------------------------------- statistikken og dommen

/** Mindste antal hænder for en dom. */
export const MINDSTE_N = 30;
/** Grænsen for "lige godt" (Franks svar 4 i Modspil v2): under 0,1 stik fra hinanden. */
export const LIGE = 0.1;
/** Under 0,05 stik fra 0 er "uden praktisk betydning". */
export const PRAKTISK = 0.05;
/** 95 %-intervallet er ± 1,96 standardfejl. */
export const Z = 1.96;

export type Dom = 'for-faa' | 'holder' | 'modsat' | 'ingen-forskel';

export interface Statistik {
  n: number;
  /** Gennemsnittet over hænderne af A's middelstik minus B's. */
  forskel: number;
  /** Spredningen af forskellene pr. hånd (stikprøvespredning, n − 1) divideret med √n. */
  standardfejl: number;
  /** forskel ± 1,96 standardfejl. */
  interval: [number, number];
  /** Andelene (0–1) af hænderne, hvor A er mindst 0,1 stik bedre, under 0,1 stik fra B, og hvor B er mindst 0,1 stik bedre. */
  holder: number;
  lige: number;
  modsat: number;
  /** Forskellen i procentpoint mellem A's og B's andel af fordelinger, hvor kontrakten sættes (gennemsnit over hænderne). */
  saetForskel: number;
  /** n < 30: for få; ellers holder (intervallet helt over 0), modsat (helt under 0) eller ingen forskel påvist. */
  dom: Dom;
  /** Gennemsnittet ligger under 0,05 stik fra 0 (kun med en dom, altså ikke ved for få hænder). */
  udenPraktiskBetydning: boolean;
}

/** Statistikken for hænderne i en række. Grænsen 0,1 regnes med en tolerance på 1e-9, så 0,3 − 0,2 tæller som 0,1. */
export function statistik(haender: readonly Haandtal[]): Statistik {
  void haender;
  throw ikkeBygget('statistik');
}

/**
 * Dommen som tekst: "For få hænder", "Holder", "Modsat" eller "Ingen forskel påvist", og ved praktisk talt ingen forskel
 * desuden ", uden praktisk betydning" (fx "Ingen forskel påvist, uden praktisk betydning").
 */
export function domTekst(s: Statistik): string {
  void s;
  throw ikkeBygget('domTekst');
}

// ---------------------------------------------------------------- analysen og tabellerne

/** Datasættet: basens rådata pr. situation (tools/udspil/raa/<id>.json) og varianternes (raa/varianter/<id>.json). */
export interface Datasaet {
  base: Readonly<Partial<Record<SituationId, Raa>>>;
  varianter: Readonly<Partial<Record<VariantId, Raa>>>;
}

/** Én række (eller underopdeling) i hovedtabellen. */
export interface RaekkeResultat {
  raekke: RaekkeId;
  /** Situationen for en række pr. situation; null for en samlet række. */
  situation: SituationId | null;
  /** Underopdelingen (fx `'1–2'` i P2 eller `'E K'` i P9); null for hele rækken. */
  gruppe: string | null;
  nBase: number;
  nVariant: number;
  /** Udeladte hænder pr. årsag. */
  udeladt: Readonly<Record<string, number>>;
  statistik: Statistik;
}

export interface Resultat {
  raekker: RaekkeResultat[];
}

/** Hele analysen af datasættet. */
export function analyser(data: Datasaet): Resultat {
  void data;
  throw ikkeBygget('analyser');
}

/** Tabellerne til afsnit 7a i docs/MODEL.md (det, `node tools/udspil/raadanalyse.mjs --markdown` skriver). */
export function markdown(r: Resultat): string {
  void r;
  throw ikkeBygget('markdown');
}

function ikkeBygget(navn: string): Error {
  return new Error(`raadanalyse.ts: ${navn} er ikke bygget endnu (SPEC-udspilsraad.md, session 2).`);
}
