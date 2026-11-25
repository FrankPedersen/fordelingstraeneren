import type { Card } from '../../domain/cards';
import type { Seat } from '../../domain/dealer';
import type { Tekst } from './forklaring';
import type { Niveau } from './generator';
import type { Kontraktart, Profil } from './metoder';

/**
 * Øvelse 8, "Find udspillet" (SPEC-modspil-v2.md, trin 2): opgaver, facit, forklaring og niveauer uden brugerflade.
 * Vest ser sin hånd og meldeforløbet og vælger udspillet: farven på niveau 1–2 og kortet fra niveau 3. Facit kommer fra
 * datasættet (`src/modspil/content/udspil/<id>.json`, regnet med dobbeltdummy af `tools/udspil/generer.py`), og
 * situationerne, kravene og Kompendiets råd står i `content/udspil/situationer.json`.
 *
 * Session 2a: kun signaturerne. Hver funktion kaster "ikke bygget", indtil session 2b bygger modellen; accepttestene
 * står i `src/modspil/find-udspil/`. Kontrakten herunder er accepttestenes.
 *
 * Farverne har indeks ♠ 0, ♥ 1, ♦ 2, ♣ 3 og kortene 0–51 som i `domain/cards.ts` (farve × 13 + valør − 2).
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

/** Kontrakterne i de otte situationer; Syd spiller, og Vest spiller ud. */
export type UdspilKontrakt = '3NT' | '4H' | '4S' | '2C' | '3S';

/** Svaret: farven (niveau 1–2) eller kortet (niveau 3–5). */
export type Svarform = 'farve' | 'kort';

// ---------------------------------------------------------------- datasættet

/**
 * En opgave i appens datasæt: Vests 13 kort i stigende orden og pr. kort (samme indeks) middelstikket med to decimaler
 * og antallet af fordelinger, hvor kontrakten sættes.
 */
export interface UdspilDataOpgave {
  seed: number;
  vest: readonly Card[];
  middel: readonly number[];
  saet: readonly number[];
  /** Kun i eksemplerne: hånden i PBN. */
  haand?: string;
}

/** Én situations datafil (`src/modspil/content/udspil/<id>.json`). */
export interface UdspilData {
  id: string;
  generator: number;
  endplay: string;
  dato: string;
  fordelinger: number;
  kontrakt: string;
  opgaver: readonly UdspilDataOpgave[];
  eksempler: readonly UdspilDataOpgave[];
}

export type Datasaet = Readonly<Record<SituationId, UdspilData>>;

// ---------------------------------------------------------------- facit

/** Én farve, Vest har kort i. */
export interface FarveRaekke {
  farve: number;
  /** Profilens kort i farven efter udspilsreglen (`udspil.ts`), stigende: to ved "table feeling", ellers ét. */
  kort: Card[];
  /** Farvens værdi: middelstikket for det bedste af profilens kort (to decimaler, som i datasættet). */
  middel: number;
  /** Antal fordelinger, hvor kontrakten sættes med det kort, der giver værdien (står to kort lige, det højeste antal). */
  saet: number;
}

/** Ét af Vests kort med middelstik og antal fordelinger, hvor kontrakten sættes (trin 3 viser prisen ud fra dem). */
export interface KortRaekke {
  kort: Card;
  middel: number;
  saet: number;
}

export interface UdspilFacit {
  /** Én række pr. farve, Vest har kort i, i orden ♠ ♥ ♦ ♣. */
  tabel: FarveRaekke[];
  /** Alle Vests 13 kort, stigende, med middelstik og sætninger (Franks valg 25. nov. 2026). */
  kortTabel: KortRaekke[];
  /** De rigtige farver: under 0,1 stik fra den bedste (lige gode), stigende. */
  farver: number[];
  /** De rigtige kort: profilens kort i de rigtige farver, stigende (ved "table feeling" begge). */
  kort: Card[];
  /** Den bedste farves forspring for den næstbedste i stik, rundet til to decimaler (2,30 − 2,10 giver 0,2). */
  forspring: number;
  /** Forspringet er mindst 0,2 stik. */
  klar: boolean;
  /** Farverne, Kompendiets råd (`kompendieraad`) peger på for Vests hånd, stigende; tom, når reglen ingen farve giver. */
  raad: number[];
  /** Klar, og den bedste farve er ikke blandt `raad`. */
  afviger: boolean;
  /** Antal fordelinger bag tallene (100). */
  fordelinger: number;
}

/** En opgave i datasættet: situationen og opgavens indeks i situationens `opgaver`. */
export interface OpgaveRef {
  situation: SituationId;
  indeks: number;
}

export interface FindUdspilOpgave {
  niveau: Niveau;
  seed: number;
  profil: Profil;
  situation: SituationId;
  indeks: number;
  /** Opgavens seed i datasættet (fordelingernes seeds står i `tools/udspil/raa/<id>.json`). */
  dataSeed: number;
  /** Vests 13 kort, stigende. */
  vest: Card[];
  giver: Seat;
  /** Meldingerne som i situationsfilen, fx "S:1NT". */
  meldinger: string[];
  kontrakt: UdspilKontrakt;
  art: Kontraktart;
  svar: Svarform;
  facit: UdspilFacit;
  /** Forklaringen til facit; nævner situationen, tallene og Kompendiets råd med siden. */
  forklaring: Tekst;
  /** Kun når opgaven afviger fra Kompendiet: sætningen, der siger det (står også i `forklaring`). */
  afvigelse?: Tekst;
  /** "Ved bordet": situationens tekst. */
  vedBordet: Tekst;
}

export type UdspilSvar = { farve: number } | { kort: Card };

export interface UdspilDom {
  rigtig: boolean;
  /** Farven er rigtig (på niveau 1–2 det samme som `rigtig`). */
  farveRigtig: boolean;
  /** Kun når farven er rigtig, men kortet ikke er profilens: at farven var rigtig, og hvilket kort profilen spiller ud. */
  tekst?: Tekst;
}

// ---------------------------------------------------------------- funktionerne

const ikkeBygget = (..._args: unknown[]): never => {
  throw new Error('ikke bygget');
};

/** Datasættet, hentet dovent første gang (de otte datafiler). */
export async function hentDatasaet(): Promise<Datasaet> {
  return ikkeBygget();
}

/** Farvernes værdi og kort med profilens udspilsregel (accepttest 1). */
export function farvevaerdier(opgave: Pick<UdspilDataOpgave, 'vest' | 'middel' | 'saet'>, art: Kontraktart, profil: Profil): FarveRaekke[] {
  return ikkeBygget(opgave, art, profil);
}

/** De rigtige farver: under 0,1 stik fra den bedste (accepttest 2). */
export function rigtigeFarver(tabel: readonly Pick<FarveRaekke, 'farve' | 'middel'>[]): number[] {
  return ikkeBygget(tabel);
}

/** Den bedste farves forspring for den næstbedste, rundet til to decimaler (accepttest 2). */
export function forspring(tabel: readonly Pick<FarveRaekke, 'farve' | 'middel'>[]): number {
  return ikkeBygget(tabel);
}

/** Klar: forspringet er mindst 0,2 stik (accepttest 2). */
export function erKlar(tabel: readonly Pick<FarveRaekke, 'farve' | 'middel'>[]): boolean {
  return ikkeBygget(tabel);
}

/** Facit for en opgave i datasættet med profilen (accepttest 3). */
export function udspilFacit(situation: SituationId, opgave: UdspilDataOpgave, profil: Profil): UdspilFacit {
  return ikkeBygget(situation, opgave, profil);
}

/**
 * Opgaverne, niveauet giver med profilen, i situationernes og datafilernes orden (accepttest 4 og 5): niveau 1 de
 * klare i S1, S4 og S7, niveau 2 og 3 de klare i alle otte, niveau 4–5 alle. Niveau 1–3 har ingen, der afviger.
 */
export function pulje(niveau: Niveau, profil: Profil, data: Datasaet): OpgaveRef[] {
  return ikkeBygget(niveau, profil, data);
}

/**
 * En opgave på niveauet (accepttest 4 og 6). Samme seed, niveau og profil giver samme opgave. Claude Codes valg til
 * 2b: `mulberry32(seed)` vælger først situationen jævnt blandt dem med opgaver i puljen og så opgaven jævnt i den.
 */
export function lavFindUdspil(niveau: Niveau, seed: number, profil: Profil, data: Datasaet): FindUdspilOpgave {
  return ikkeBygget(niveau, seed, profil, data);
}

/** Forklaringen til facit, og ved en opgave, der afviger fra Kompendiet, sætningen, der siger det (accepttest 5 og 7). */
export function forklarUdspil(situation: SituationId, opgave: UdspilDataOpgave, profil: Profil, svar: Svarform): { forklaring: Tekst; afvigelse?: Tekst } {
  return ikkeBygget(situation, opgave, profil, svar);
}

/** "Ved bordet": én tekst pr. situation, en omskrivning af Kompendiets råd (accepttest 7). */
export function vedBordet(situation: SituationId): Tekst {
  return ikkeBygget(situation);
}

/** Dommen over brugerens svar: en farve på niveau 1–2 og et kort fra niveau 3 (accepttest 4). */
export function bedoemUdspil(opgave: FindUdspilOpgave, svar: UdspilSvar): UdspilDom {
  return ikkeBygget(opgave, svar);
}
