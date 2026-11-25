import type { Card } from '../../domain/cards';
import type { Seat } from '../../domain/dealer';
import { mulberry32 } from '../../engine/rng';
import situationsfil from '../content/udspil/situationer.json';
import type { Tekst } from './forklaring';
import { domTekst, INDLEDNING, kortSaetning, raadSaetning, talSaetning, VED_BORDET, type RaadRegel, type TalRaekke } from './findUdspilTekst';
import type { Niveau } from './generator';
import { gaeldende, KATEGORIER, metode, PROFILER, profilId, profilNavn, type Kontraktart, type Profil } from './metoder';
import { honnoerUdspil, muligeUdspil, udspilKategori } from './udspil';

/**
 * Øvelse 8, "Find udspillet" (SPEC-modspil-v2.md, trin 2): opgaver, facit, forklaring og niveauer uden brugerflade.
 * Vest ser sin hånd og meldeforløbet og vælger udspillet: farven på niveau 1–2 og kortet fra niveau 3. Facit kommer fra
 * datasættet (`src/modspil/content/udspil/<id>.json`, regnet med dobbeltdummy af `tools/udspil/generer.py`), og
 * situationerne, kravene og Kompendiets råd står i `content/udspil/situationer.json`. Teksterne står i
 * `findUdspilTekst.ts`, og accepttestene i `src/modspil/find-udspil/`.
 *
 * - Farvens værdi er middelstikket for det kort, profilens udspilsregel giver (`udspil.ts`); ved "table feeling" det
 *   bedste af de to kort, og begge er rigtige. Farver under 0,1 stik fra den bedste er lige gode og alle rigtige, og en
 *   opgave er klar, når den bedste farve fører med mindst 0,2 stik. Grænserne regnes i hundrededele, fordi
 *   middelstikkene har to decimaler, og forskellen mellem to kommatal ikke altid er præcis.
 * - Niveauerne: 1 de klare i S1, S5 og S7, 2 og 3 de klare i alle otte (niveau 1–2 svarer med farven, 3 og op med
 *   kortet), 4–5 alle opgaver. Niveau 1–3 har ingen, der afviger fra Kompendiet.
 * - Udvalget: `mulberry32(seed)` trækker først situationen med lige stor chance for hver af niveauets situationer og
 *   derefter hånden blandt situationens opgaver på niveauet (Franks valg 25. nov. 2026).
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

// ---------------------------------------------------------------- situationerne

interface SituationData {
  id: SituationId;
  navn: string;
  navnEn: string;
  giver: Seat;
  meldinger: string[];
  kontrakt: UdspilKontrakt;
  sider: number[];
  kompendieraad: { regler: RaadRegel[] };
}

const FIL = situationsfil as unknown as { fordelinger: number; situationer: SituationData[] };

export const SITUATIONER: readonly SituationId[] = FIL.situationer.map((s) => s.id);

/** Niveau 1 har kun de tre situationer (Franks valg 25. nov. 2026: S5 i stedet for S4). */
const NIVEAU1: readonly SituationId[] = ['S1-1nt-3nt', 'S5-sidefarve', 'S7-makker-aabnet'];

/** Grænserne i hundrededele stik: under 10 er lige godt, mindst 20 er klar. */
const LIGE_GODT = 10;
const KLAR = 20;

function situationData(id: SituationId): SituationData {
  const s = FIL.situationer.find((x) => x.id === id);
  if (!s) throw new Error(`Ukendt situation: ${id}`);
  return s;
}

const artAf = (kontrakt: string): Kontraktart => (kontrakt.endsWith('NT') ? 'sans' : 'farve');
/** Trumffarvens indeks, eller null mod sans. */
const trumfAf = (kontrakt: string): number | null => (kontrakt.endsWith('NT') ? null : 'SHDC'.indexOf(kontrakt[kontrakt.length - 1]));
const farveAf = (c: Card) => Math.floor(c / 13);
const vaerdiAf = (c: Card) => (c % 13) + 2;
const kortAf = (farve: number, vaerdi: number): Card => farve * 13 + vaerdi - 2;
const stigende = (xs: readonly number[]) => [...xs].sort((a, b) => a - b);
/** Middelstikket i hundrededele. */
const h = (middel: number) => Math.round(middel * 100);

// ---------------------------------------------------------------- datasættet hentes dovent

const HENT: Readonly<Record<SituationId, () => Promise<{ default: unknown }>>> = {
  'S1-1nt-3nt': () => import('../content/udspil/S1-1nt-3nt.json'),
  'S2-stayman': () => import('../content/udspil/S2-stayman.json'),
  'S3-transfer': () => import('../content/udspil/S3-transfer.json'),
  'S4-kun-en-farve': () => import('../content/udspil/S4-kun-en-farve.json'),
  'S5-sidefarve': () => import('../content/udspil/S5-sidefarve.json'),
  'S6-trumf': () => import('../content/udspil/S6-trumf.json'),
  'S7-makker-aabnet': () => import('../content/udspil/S7-makker-aabnet.json'),
  'S8-delkontrakt': () => import('../content/udspil/S8-delkontrakt.json'),
};

let hentet: Promise<Datasaet> | null = null;

/** Datasættet, hentet dovent første gang (de otte datafiler). */
export function hentDatasaet(): Promise<Datasaet> {
  hentet ??= Promise.all(SITUATIONER.map(async (id) => [id, (await HENT[id]()).default as UdspilData] as const)).then(
    (par) => Object.fromEntries(par) as unknown as Datasaet,
  );
  return hentet;
}

// ---------------------------------------------------------------- farvens værdi, lige gode og klare

/** Vests kort i farven som valører. */
const valoerer = (vest: readonly Card[], farve: number) => vest.filter((c) => farveAf(c) === farve).map(vaerdiAf);

/** Profilens kort i farven, stigende (to ved "table feeling"). */
const profilensKort = (vest: readonly Card[], farve: number, art: Kontraktart, profil: Profil): Card[] =>
  stigende(muligeUdspil(valoerer(vest, farve), art, profil).map((v) => kortAf(farve, v)));

/** Kortet, der giver farvens værdi: det højeste middelstik og, står to kort lige, det højeste antal sætninger. */
function vaerdikort(opgave: Pick<UdspilDataOpgave, 'vest' | 'middel' | 'saet'>, kort: readonly Card[]): number {
  let bedst = -1;
  for (const c of kort) {
    const i = opgave.vest.indexOf(c);
    if (i < 0) throw new Error(`Kortet ${c} er ikke Vests`);
    if (bedst < 0 || h(opgave.middel[i]) > h(opgave.middel[bedst]) || (h(opgave.middel[i]) === h(opgave.middel[bedst]) && opgave.saet[i] > opgave.saet[bedst])) bedst = i;
  }
  return bedst;
}

/** Farvernes værdi og kort med profilens udspilsregel (accepttest 1). */
export function farvevaerdier(opgave: Pick<UdspilDataOpgave, 'vest' | 'middel' | 'saet'>, art: Kontraktart, profil: Profil): FarveRaekke[] {
  const raekker: FarveRaekke[] = [];
  for (let farve = 0; farve < 4; farve++) {
    if (!opgave.vest.some((c) => farveAf(c) === farve)) continue;
    const kort = profilensKort(opgave.vest, farve, art, profil);
    const i = vaerdikort(opgave, kort);
    raekker.push({ farve, kort, middel: opgave.middel[i], saet: opgave.saet[i] });
  }
  return raekker;
}

type Vaerdier = readonly Pick<FarveRaekke, 'farve' | 'middel'>[];

/** De rigtige farver: under 0,1 stik fra den bedste (accepttest 2). */
export function rigtigeFarver(tabel: Vaerdier): number[] {
  const top = Math.max(...tabel.map((r) => h(r.middel)));
  return stigende(tabel.filter((r) => top - h(r.middel) < LIGE_GODT).map((r) => r.farve));
}

/** Forspringet i hundrededele; uendeligt med kun én farve. */
function forspringH(tabel: Vaerdier): number {
  const v = tabel.map((r) => h(r.middel)).sort((a, b) => b - a);
  return v.length > 1 ? v[0] - v[1] : Infinity;
}

/** Den bedste farves forspring for den næstbedste, rundet til to decimaler (accepttest 2). */
export function forspring(tabel: Vaerdier): number {
  return forspringH(tabel) / 100;
}

/** Klar: forspringet er mindst 0,2 stik (accepttest 2). */
export function erKlar(tabel: Vaerdier): boolean {
  return forspringH(tabel) >= KLAR;
}

/** Den bedste farve; står flere lige, den første i orden ♠ ♥ ♦ ♣. */
function bedsteFarve(tabel: Vaerdier): number {
  const top = Math.max(...tabel.map((r) => h(r.middel)));
  return tabel.find((r) => h(r.middel) === top)!.farve;
}

// ---------------------------------------------------------------- Kompendiets råd

const HONNOER = 11;
const nr = (f: string) => 'SHDC'.indexOf(f);
const faldende = (xs: readonly number[]) => [...xs].sort((a, b) => b - a);

/** Mindst fem kort, og de fire øverste står i træk med toppen mindst B (fx D B 10 9 3). */
function dybSekvens(v: readonly number[]): boolean {
  const s = faldende(v);
  return s.length >= 5 && s[0] >= HONNOER && s[0] - s[3] === 3;
}

/** Tre øverste kort i sekvens eller brudt sekvens (E K B, K D 10 …) med toppen mindst B. */
function staerkSekvens(v: readonly number[]): boolean {
  const [a, b, c] = faldende(v);
  return v.length >= 3 && a >= HONNOER && a - b === 1 && (b - c === 1 || b - c === 2);
}

/** Rådet for Vests hånd: den første regel, der gælder og giver mindst én farve, Vest har kort i. */
function raadFor(vest: readonly Card[], regler: readonly RaadRegel[]): { farver: number[]; regel: RaadRegel | null } {
  const laengde = (f: number) => valoerer(vest, f).length;
  for (const r of regler) {
    const hvis = r.hvis;
    if (hvis) {
      if (Object.entries(hvis.min ?? {}).some(([f, n]) => laengde(nr(f)) < n)) continue;
      if (Object.entries(hvis.max ?? {}).some(([f, n]) => laengde(nr(f)) > n)) continue;
      if (hvis.dybSekvens && !dybSekvens(valoerer(vest, nr(hvis.dybSekvens)))) continue;
    }
    const har = r.blandt.map(nr).filter((f) => laengde(f) > 0);
    let ud: number[];
    switch (r.udvalg) {
      case 'farver':
        ud = har;
        break;
      case 'korteste': {
        const mindst = Math.min(...har.map(laengde));
        ud = har.filter((f) => laengde(f) === mindst);
        break;
      }
      case 'laengde':
        ud = har.filter((f) => laengde(f) === r.laengde);
        break;
      case 'udenHonnoer':
        ud = har.filter((f) => valoerer(vest, f).every((v) => v < HONNOER));
        break;
      case 'staerkSekvens':
        ud = har.filter((f) => staerkSekvens(valoerer(vest, f)));
        break;
    }
    if (ud.length > 0) return { farver: stigende(ud), regel: r };
  }
  return { farver: [], regel: null };
}

// ---------------------------------------------------------------- facit

/** Facit for en opgave i datasættet med profilen (accepttest 3). */
export function udspilFacit(situation: SituationId, opgave: UdspilDataOpgave, profil: Profil): UdspilFacit {
  const s = situationData(situation);
  const tabel = farvevaerdier(opgave, artAf(s.kontrakt), profil);
  const farver = rigtigeFarver(tabel);
  const klar = erKlar(tabel);
  const raad = raadFor(opgave.vest, s.kompendieraad.regler).farver;
  return {
    tabel,
    kortTabel: opgave.vest.map((kort, i) => ({ kort, middel: opgave.middel[i], saet: opgave.saet[i] })),
    farver,
    kort: stigende(tabel.filter((r) => farver.includes(r.farve)).flatMap((r) => r.kort)),
    forspring: forspring(tabel),
    klar,
    raad,
    afviger: klar && !raad.includes(bedsteFarve(tabel)),
    fordelinger: FIL.fordelinger,
  };
}

// ---------------------------------------------------------------- niveauerne og udvalget

/** Profilens metoder som nøgle. */
const profilNoegle = (p: Profil) => KATEGORIER.map((k) => p.valg[k]).join('|');

interface Klasse {
  klar: boolean;
  afviger: boolean;
}

/** Pr. datasæt og profil: hver opgaves klasse; pr. niveau: puljen ordnet efter situation. */
const KLASSER = new WeakMap<Datasaet, Map<string, Readonly<Record<SituationId, readonly Klasse[]>>>>();
const PULJER = new WeakMap<Datasaet, Map<string, ReadonlyMap<SituationId, readonly number[]>>>();

function klasser(data: Datasaet, profil: Profil): Readonly<Record<SituationId, readonly Klasse[]>> {
  let pr = KLASSER.get(data);
  if (!pr) KLASSER.set(data, (pr = new Map()));
  const noegle = profilNoegle(profil);
  let k = pr.get(noegle);
  if (!k) {
    k = Object.fromEntries(
      SITUATIONER.map((id) => [
        id,
        data[id].opgaver.map((o) => {
          const f = udspilFacit(id, o, profil);
          return { klar: f.klar, afviger: f.afviger };
        }),
      ]),
    ) as Record<SituationId, Klasse[]>;
    pr.set(noegle, k);
  }
  return k;
}

/** Puljen som indeks pr. situation, kun situationer med opgaver, i situationernes orden. */
function puljeEfterSituation(niveau: Niveau, profil: Profil, data: Datasaet): ReadonlyMap<SituationId, readonly number[]> {
  let pr = PULJER.get(data);
  if (!pr) PULJER.set(data, (pr = new Map()));
  const noegle = `${profilNoegle(profil)}#${niveau}`;
  let p = pr.get(noegle);
  if (!p) {
    const k = klasser(data, profil);
    const situationer = niveau === 1 ? NIVEAU1 : SITUATIONER;
    const m = new Map<SituationId, number[]>();
    for (const id of situationer) {
      const indeks = k[id].flatMap((c, i) => (niveau >= 4 || (c.klar && !c.afviger) ? [i] : []));
      if (indeks.length > 0) m.set(id, indeks);
    }
    pr.set(noegle, (p = m));
  }
  return p;
}

/**
 * Opgaverne, niveauet giver med profilen, i situationernes og datafilernes orden (accepttest 4 og 5): niveau 1 de
 * klare i S1, S5 og S7, niveau 2 og 3 de klare i alle otte, niveau 4–5 alle. Niveau 1–3 har ingen, der afviger.
 */
export function pulje(niveau: Niveau, profil: Profil, data: Datasaet): OpgaveRef[] {
  return [...puljeEfterSituation(niveau, profil, data)].flatMap(([situation, indeks]) => indeks.map((i) => ({ situation, indeks: i })));
}

/**
 * En opgave på niveauet (accepttest 4 og 6). Samme seed, niveau og profil giver samme opgave: `mulberry32(seed)`
 * trækker først situationen med lige stor chance blandt niveauets situationer og så hånden blandt situationens opgaver.
 */
export function lavFindUdspil(niveau: Niveau, seed: number, profil: Profil, data: Datasaet): FindUdspilOpgave {
  const rng = mulberry32(seed);
  const p = puljeEfterSituation(niveau, profil, data);
  const situationer = [...p.keys()];
  if (situationer.length === 0) throw new Error(`Niveau ${niveau} har ingen opgaver med profilen`);
  const situation = situationer[rng.int(situationer.length)];
  const indekser = p.get(situation)!;
  const indeks = indekser[rng.int(indekser.length)];
  const s = situationData(situation);
  const o = data[situation].opgaver[indeks];
  const svar: Svarform = niveau <= 2 ? 'farve' : 'kort';
  const tekst = forklarUdspil(situation, o, profil, svar);
  return {
    niveau,
    seed,
    profil: { id: profil.id, valg: { ...profil.valg } },
    situation,
    indeks,
    dataSeed: o.seed,
    vest: [...o.vest],
    giver: s.giver,
    meldinger: [...s.meldinger],
    kontrakt: s.kontrakt,
    art: artAf(s.kontrakt),
    svar,
    facit: udspilFacit(situation, o, profil),
    forklaring: tekst.forklaring,
    ...(tekst.afvigelse ? { afvigelse: tekst.afvigelse } : {}),
    vedBordet: vedBordet(situation),
  };
}

// ---------------------------------------------------------------- forklaringen

/** Profilens navn; en ændret profil hedder "Egen". */
const navnPaa = (p: Profil) => profilNavn(profilId(p.valg));

/** Metoden, der giver kortet: honnørreglen, når den afgør udspillet ("table feeling" med), ellers det lave kort. */
function metodeFor(holding: readonly number[], art: Kontraktart, profil: Profil): { tekst: string; tekstEn: string } {
  const kategori = honnoerUdspil(holding, art, profil) !== null ? 'honnoerudspil' : udspilKategori(art);
  const g = gaeldende(profil, kategori, art);
  const m = metode(g.kategori, g.id);
  return { tekst: m.tekst, tekstEn: m.tekstEn };
}

/** Forklaringen til facit, og ved en opgave, der afviger fra Kompendiet, sætningen, der siger det (accepttest 5 og 7). */
export function forklarUdspil(situation: SituationId, opgave: UdspilDataOpgave, profil: Profil, svar: Svarform): { forklaring: Tekst; afvigelse?: Tekst } {
  const s = situationData(situation);
  const art = artAf(s.kontrakt);
  const f = udspilFacit(situation, opgave, profil);
  const raekker: TalRaekke[] = f.tabel.map((r) => ({ ...r, vaerdikort: opgave.vest[vaerdikort(opgave, r.kort)] }));
  const dele: Tekst[] = [INDLEDNING[situation], talSaetning(raekker, f.farver, f.klar, s.kontrakt, f.fordelinger, svar === 'kort')];

  if (svar === 'kort') {
    for (const farve of f.farver) {
      const kort = f.tabel.find((r) => r.farve === farve)!.kort;
      const holding = valoerer(opgave.vest, farve);
      const andre = PROFILER.map((p) => profilensKort(opgave.vest, farve, art, p).join());
      const saetning = kortSaetning({
        vest: opgave.vest,
        farve,
        kort,
        profilenSkifter: new Set([...andre, kort.join()]).size > 1,
        profilNavn: navnPaa(profil),
        metode: metodeFor(holding, art, profil),
      });
      if (saetning) dele.push(saetning);
    }
  }

  const raad = raadFor(opgave.vest, s.kompendieraad.regler);
  const raadTekst = raadSaetning(s.sider, raad.regel, raad.farver, trumfAf(s.kontrakt), f.afviger, bedsteFarve(f.tabel));
  dele.push(raadTekst);
  const forklaring = { da: dele.map((d) => d.da).join(' '), en: dele.map((d) => d.en).join(' ') };
  return f.afviger ? { forklaring, afvigelse: raadTekst } : { forklaring };
}

/** "Ved bordet": én tekst pr. situation, en omskrivning af Kompendiets råd (accepttest 7). */
export function vedBordet(situation: SituationId): Tekst {
  const t = VED_BORDET[situation];
  if (!t) throw new Error(`Ukendt situation: ${situation}`);
  return { da: t.da, en: t.en };
}

// ---------------------------------------------------------------- dommen

/** Dommen over brugerens svar: en farve på niveau 1–2 og et kort fra niveau 3 (accepttest 4). */
export function bedoemUdspil(opgave: FindUdspilOpgave, svar: UdspilSvar): UdspilDom {
  if ('farve' in svar) {
    if (opgave.svar !== 'farve') throw new Error('Opgaven svarer med et kort, ikke en farve');
    const rigtig = opgave.facit.farver.includes(svar.farve);
    return { rigtig, farveRigtig: rigtig };
  }
  if (opgave.svar !== 'kort') throw new Error('Opgaven svarer med en farve, ikke et kort');
  if (!opgave.vest.includes(svar.kort)) throw new Error(`Kortet ${svar.kort} er ikke Vests`);
  const farve = farveAf(svar.kort);
  const rigtig = opgave.facit.kort.includes(svar.kort);
  const farveRigtig = opgave.facit.farver.includes(farve);
  if (rigtig || !farveRigtig) return { rigtig, farveRigtig };
  const profilens = opgave.facit.kort.filter((c) => farveAf(c) === farve);
  return { rigtig, farveRigtig, tekst: domTekst(opgave.vest, profilens, navnPaa(opgave.profil)) };
}
