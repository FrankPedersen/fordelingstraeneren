import type { Card } from '../../domain/cards';
import situationsfil from '../content/udspil/situationer.json';
import { profil } from '../model/metoder';
import { honnoerUdspil, muligeUdspil } from '../model/udspil';
import {
  art,
  bedsteFarver,
  farvevaerdier,
  FARVER,
  HONNOER,
  kompendieraad,
  maal,
  middelHundrededele,
  opfyldt,
  tableFeeling,
  valoerer,
  type Farve,
  type Raa,
  type RaaOpgave,
  type Situation,
  type VariantRaa,
} from './hjaelp';

/**
 * Kompendiets udspilsråd mod dobbeltdummy (SPEC-udspilsraad.md): udvælgelsen af A og B pr. hånd, tallene pr. hånd,
 * statistikken og dommen pr. række og tabellerne til afsnit 7a i docs/MODEL.md. Ren kode: datasættet gives som
 * argument (tools/udspil/raadanalyse.mjs læser filerne), og modulet bruges kun af testene og scriptet, ikke af appen.
 * Accepttestene står i raadanalyse.test.ts.
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

/** Situationerne og varianterne i specens rækkefølge (scriptet læser deres rådata). */
export const SITUATIONER: readonly SituationId[] = [
  'S1-1nt-3nt',
  'S2-stayman',
  'S3-transfer',
  'S4-kun-en-farve',
  'S5-sidefarve',
  'S6-trumf',
  'S7-makker-aabnet',
  'S8-delkontrakt',
];
export const VARIANTER: readonly VariantId[] = ['S4-singleton', 'S5-singleton', 'S8-singleton', 'S4-doubleton', 'S8-doubleton', 'S1-tablefeeling', 'S2-tablefeeling'];

/** Variantens situation (tools/udspil/varianter.json). */
export const VARIANT_SITUATION: Readonly<Record<VariantId, SituationId>> = {
  'S4-singleton': 'S4-kun-en-farve',
  'S5-singleton': 'S5-sidefarve',
  'S8-singleton': 'S8-delkontrakt',
  'S4-doubleton': 'S4-kun-en-farve',
  'S8-doubleton': 'S8-delkontrakt',
  'S1-tablefeeling': 'S1-1nt-3nt',
  'S2-tablefeeling': 'S2-stayman',
};

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

/** Underopdelingerne i rækkefølge: P2 på den korteste majors længde, P9 på toppen og på længden (hver for sig). */
export const GRUPPER: Readonly<Partial<Record<RaekkeId, readonly string[]>>> = {
  P2: ['1–2', '3', '4+'],
  P9: ['E K', 'K D', 'D B', '3', '4', '5+'],
};

/**
 * Kompendiets retning (Franks valg 26. nov. 2026): A, når Kompendiet siger, at A er bedre, og B, når det siger, at B er
 * bedre. P4 og P8 i S8 fraråder A, og i S4 er trumf kun attraktivt, når ingen sidefarve er det, så B. "Table feeling"
 * (P9) lader valget være op til spilleren og har ingen retning ("–"). P6 har heller ingen retning (Franks valg 26. nov.
 * 2026 efter session 2): påstanden er, at doubletonen er "bedre end sit rygte", ikke at den slår småkort.
 */
export type Retning = 'A' | 'B' | '–';

export function retning(raekke: RaekkeId, situation: SituationId | null): Retning {
  const p = paastand(raekke);
  if (p === 'P6' || p === 'P9') return '–';
  if (p === 'P4') return 'B';
  if (p === 'P8') return situation === 'S6-trumf' ? 'A' : 'B';
  return 'A';
}

const paastand = (raekke: RaekkeId): PaastandId => RAEKKER.find((r) => r.id === raekke)!.paastand;

// ---------------------------------------------------------------- situationerne

const SITUATIONSDATA = (situationsfil as unknown as { situationer: Situation[] }).situationer;
const situationen = (id: SituationId): Situation => {
  const s = SITUATIONSDATA.find((x) => x.id === id);
  if (!s) throw new Error(`raadanalyse.ts: situationen ${id} findes ikke i situationer.json.`);
  return s;
};

/** Kontrakten i situationen, fx "4H". */
export const kontraktI = (id: SituationId): string => situationen(id).kontrakt;

/** Trumffarven, eller null mod sans. */
export function trumfI(id: SituationId): Farve | null {
  const b = kontraktI(id).slice(1);
  return b === 'NT' ? null : (b as Farve);
}

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

export const erUdeladt = (v: Valg | Udeladt | null): v is Udeladt => v !== null && 'udeladt' in v;

const FARVE_NR: Record<Farve, number> = { S: 0, H: 1, D: 2, C: 3 };
const STANDARD = profil('standard');
const MAJORER: readonly Farve[] = ['S', 'H'];
const MINORER: readonly Farve[] = ['D', 'C'];

/** Årsagerne til at udelade en hånd. */
export const UDELADT = {
  majorer: 'to lige lange majorer',
  singletoner: 'to singletoner',
  doubletoner: 'to doubletoner uden honnør',
  smaakort: 'to sidefarver med 3+ kort uden honnør',
  tableFeeling: '"table feeling" i to farver',
  /** Ikke fra `udvaelg`: hånden (samme seed) står to gange i rådataene, og analysen tæller den én gang. */
  dublet: 'samme hånd to gange',
} as const;

const honnoerer = (v: readonly number[]) => v.filter((x) => x >= HONNOER).length;

/** Mindst fem kort, og de fire øverste står i træk med toppen mindst B (fx D B 10 9 3), som i Kompendiets råd for S3. */
function dybSekvens(v: readonly number[]): boolean {
  const s = [...v].sort((x, y) => y - x);
  return s.length >= 5 && s[0] >= HONNOER && s[0] - s[3] === 3;
}

/** Profilen Standard spiller en honnør ud fra farven i farvekontrakt (appens sekvensregel, hvor også B 10 er en sekvens). */
function honnoerSekvens(v: readonly number[]): boolean {
  const kort = honnoerUdspil(v, 'farve', STANDARD);
  return typeof kort === 'number' && kort >= HONNOER;
}

/** Den længste af farverne og ved lige længde den højeste (♠ ♥ ♦ ♣); null, når der ingen er. */
function laengsteHoejeste(vest: readonly Card[], farver: readonly Farve[]): Farve | null {
  let bedst: Farve | null = null;
  for (const f of FARVER) {
    if (!farver.includes(f)) continue;
    if (bedst === null || valoerer(vest, f).length > valoerer(vest, bedst).length) bedst = f;
  }
  return bedst;
}

/** Profilen Standards kort i farven (`muligeUdspil`), stigende. */
function standardKort(vest: readonly Card[], f: Farve, kontrakt: string): Card[] {
  return muligeUdspil(valoerer(vest, f), art(kontrakt), STANDARD)
    .map((v) => FARVE_NR[f] * 13 + v - 2)
    .sort((a, b) => a - b);
}

const TOP_NAVN: Record<number, string> = { 14: 'E K', 13: 'K D', 12: 'D B' };

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
  const r = RAEKKER.find((x) => x.id === raekke);
  if (!r || !r.situationer.includes(situation)) return null;
  const kontrakt = kontraktI(situation);
  const t = trumfI(situation);
  const sidefarver = FARVER.filter((f) => f !== t);
  const v = (f: Farve) => valoerer(vest, f);
  const L = (f: Farve) => v(f).length;
  const side = (f: Farve): Side => ({ farve: f, kort: standardKort(vest, f, kontrakt) });
  const valg = (a: Farve, b: Farve, grupper: string[] = []): Valg => ({ a: side(a), b: side(b), grupper });
  const smaakort = sidefarver.filter((f) => L(f) >= 3 && honnoerer(v(f)) === 0);

  switch (r.paastand) {
    case 'P1': {
      const majorer = MAJORER.filter((f) => L(f) > 0);
      const b = laengsteHoejeste(
        vest,
        MINORER.filter((f) => L(f) === 4 && honnoerer(v(f)) >= 1 && honnoerer(v(f)) <= 2),
      );
      if (majorer.length === 0 || b === null) return null;
      const mindst = Math.min(...majorer.map(L));
      if (mindst > 3) return null;
      const a = majorer.filter((f) => L(f) === mindst);
      if (a.length > 1) return { udeladt: UDELADT.majorer };
      return valg(a[0], b);
    }
    case 'P2': {
      if (L('S') === 0 || L('H') === 0) return null;
      if (L('S') === L('H')) return { udeladt: UDELADT.majorer };
      const [a, b]: Farve[] = L('S') < L('H') ? ['S', 'H'] : ['H', 'S'];
      const k = L(a);
      return valg(a, b, [k <= 2 ? '1–2' : k === 3 ? '3' : '4+']);
    }
    case 'P3': {
      const b: Farve = raekke === 'P3-D' ? 'D' : 'C';
      if (L('S') === 0 || L(b) === 0) return null;
      return valg('S', b);
    }
    case 'P4': {
      if (L('H') === 0 || L('S') === 0 || dybSekvens(v('H'))) return null;
      return valg('H', 'S');
    }
    case 'P5': {
      const a = sidefarver.filter((f) => L(f) === 1);
      const b = laengsteHoejeste(vest, smaakort);
      if (a.length === 0 || b === null) return null;
      if (a.length > 1) return { udeladt: UDELADT.singletoner };
      return valg(a[0], b);
    }
    case 'P6': {
      const a = sidefarver.filter((f) => L(f) === 2 && honnoerer(v(f)) === 0);
      const b = laengsteHoejeste(vest, smaakort);
      if (a.length === 0 || b === null) return null;
      if (a.length > 1) return { udeladt: UDELADT.doubletoner };
      return valg(a[0], b);
    }
    case 'P7': {
      const b = laengsteHoejeste(
        vest,
        sidefarver.filter((f) => L(f) >= 3 && honnoerer(v(f)) >= 1 && honnoerer(v(f)) <= 2 && !sekvensIFarve(v(f))),
      );
      if (smaakort.length === 0 || b === null) return null;
      if (smaakort.length > 1) return { udeladt: UDELADT.smaakort };
      return valg(smaakort[0], b);
    }
    case 'P8': {
      const b = raekke.slice(3) as Farve;
      if (t === null || b === t || L(t) === 0 || L(b) === 0) return null;
      return valg(t, b);
    }
    case 'P9': {
      const tf = FARVER.filter((f) => L(f) >= 3 && tableFeeling(v(f)));
      if (tf.length === 0) return null;
      if (tf.length > 1) return { udeladt: UDELADT.tableFeeling };
      const f = tf[0];
      const [lav, top] = standardKort(vest, f, kontrakt);
      const n = L(f);
      return { a: { farve: f, kort: [top] }, b: { farve: f, kort: [lav] }, grupper: [TOP_NAVN[(top % 13) + 2], n >= 5 ? '5+' : String(n)] };
    }
  }
}

/** "Uden sekvens" i P7: profilen Standard spiller et kort ud fra en sekvens i farvekontrakt (også B 10 og 10 9 8). */
const sekvensIFarve = (v: readonly number[]) => honnoerUdspil(v, 'farve', STANDARD) !== null;

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
 * flest middelstik (står de lige, det med flest sætninger). Kontrakten giver målet for at sætte (`maal` i hjaelp.ts,
 * 8 − niveau som i generatoren og appens facit: 3NT 5 stik, 4♥ 4 stik).
 */
export function haandtal(valg: Valg, opgave: Pick<RaaOpgave, 'vest' | 'stik'>, kontrakt: string): Haandtal {
  const sorteret = [...opgave.vest].sort((a, b) => a - b);
  const { saet } = maal(kontrakt);
  const n = opgave.stik.length;
  const side = (s: Side) => {
    let bedst: { sum: number; saet: number } | null = null;
    for (const kort of s.kort) {
      const i = sorteret.indexOf(kort);
      if (i < 0) throw new Error(`raadanalyse.ts: kortet ${kort} er ikke på Vests hånd.`);
      const kolonne = opgave.stik.map((r) => r[i]);
      const t = { sum: kolonne.reduce((x, y) => x + y, 0), saet: kolonne.filter((x) => x >= saet).length };
      if (!bedst || t.sum > bedst.sum || (t.sum === bedst.sum && t.saet > bedst.saet)) bedst = t;
    }
    if (!bedst) throw new Error('raadanalyse.ts: en side uden kort.');
    return { middel: bedst.sum / n, saet: bedst.saet / n };
  };
  const a = side(valg.a);
  const b = side(valg.b);
  return { a: a.middel, b: b.middel, aSaet: a.saet, bSaet: b.saet };
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
const TOLERANCE = 1e-9;

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

const middel = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

/** Statistikken for hænderne i en række. Grænsen 0,1 regnes med en tolerance på 1e-9, så 0,3 − 0,2 tæller som 0,1. */
export function statistik(haender: readonly Haandtal[]): Statistik {
  const n = haender.length;
  const d = haender.map((h) => h.a - h.b);
  const forskel = n > 0 ? middel(d) : NaN;
  const standardfejl = n > 1 ? Math.sqrt(d.reduce((s, x) => s + (x - forskel) ** 2, 0) / (n - 1)) / Math.sqrt(n) : NaN;
  const interval: [number, number] = [forskel - Z * standardfejl, forskel + Z * standardfejl];
  const andel = (f: (x: number) => boolean) => (n > 0 ? d.filter(f).length / n : NaN);
  const holder = andel((x) => x >= LIGE - TOLERANCE);
  const modsat = andel((x) => x <= -LIGE + TOLERANCE);
  const lige = andel((x) => x < LIGE - TOLERANCE && x > -LIGE + TOLERANCE);
  const saetForskel = n > 0 ? 100 * middel(haender.map((h) => h.aSaet - h.bSaet)) : NaN;
  const dom: Dom = n < MINDSTE_N ? 'for-faa' : interval[0] > 0 ? 'holder' : interval[1] < 0 ? 'modsat' : 'ingen-forskel';
  const udenPraktiskBetydning = dom !== 'for-faa' && Math.abs(forskel) < PRAKTISK;
  return { n, forskel, standardfejl, interval, holder, lige, modsat, saetForskel, dom, udenPraktiskBetydning };
}

const DOM_TEKST: Record<Dom, string> = { 'for-faa': 'For få hænder', holder: 'Holder', modsat: 'Modsat', 'ingen-forskel': 'Ingen forskel påvist' };
const UDEN_PRAKTISK = ', uden praktisk betydning';

/**
 * Dommen som tekst: "For få hænder", "Holder", "Modsat" eller "Ingen forskel påvist", og ved praktisk talt ingen forskel
 * desuden ", uden praktisk betydning" (fx "Ingen forskel påvist, uden praktisk betydning").
 */
export function domTekst(s: Statistik): string {
  return DOM_TEKST[s.dom] + (s.udenPraktiskBetydning ? UDEN_PRAKTISK : '');
}

/**
 * Dommen om Kompendiets påstand (Franks valg 26. nov. 2026): "Kompendiet holder", når forskellen går i Kompendiets
 * retning, "Kompendiet tager fejl", når den går imod, ellers "Ingen forskel påvist" eller "For få hænder", og desuden
 * ", uden praktisk betydning". Uden retning ("table feeling") siger dommen "A bedre" eller "B bedre".
 */
export function kompendieDom(s: Statistik, r: Retning): string {
  let tekst: string;
  if (s.dom === 'holder' || s.dom === 'modsat') {
    const aBedre = s.dom === 'holder';
    tekst = r === '–' ? (aBedre ? 'A bedre' : 'B bedre') : aBedre === (r === 'A') ? 'Kompendiet holder' : 'Kompendiet tager fejl';
  } else tekst = DOM_TEKST[s.dom];
  return tekst + (s.udenPraktiskBetydning ? UDEN_PRAKTISK : '');
}

// ---------------------------------------------------------------- analysen

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
  /** Kompendiets retning og dommen om påstanden. */
  retning: Retning;
  dom: string;
}

/** Hyppigheden af variantens form i basen: hænderne i situationens 150 opgaver, der opfylder variantens ekstra krav. */
export interface Hyppighed {
  variant: VariantId;
  situation: SituationId;
  haender: number;
  medFormen: number;
}

/** Trumfs plads blandt Vests farver (P8): 1 + antal farver med flere middelstik end trumf, talt pr. plads 1–4. */
export interface TrumfPlads {
  situation: SituationId;
  trumf: Farve;
  n: number;
  plads: [number, number, number, number];
}

/** Optællingen for en gruppe hænder i S4 og S6. */
export interface Traek {
  n: number;
  /** Den bedste farve (flest middelstik; ved lige den højeste). */
  bedste: Record<Farve, number>;
  /** Vests trumflængde: 0, 1, 2, 3 og 4+. */
  trumflaengde: [number, number, number, number, number];
  honnoerITrumf: number;
  kortSidefarve: number;
  sekvensSidefarve: number;
}

/** S4 og S6 for sig: hvor ofte rådet er blandt dobbeltdummys bedste farver, og trækkene for hænderne, hvor det ikke er. */
export interface RaadBlandt {
  situation: SituationId;
  haender: number;
  raadBlandt: number;
  ikkeBlandt: Traek;
  alle: Traek;
}

/** Specens faste eksempel i P9 (S1 opgave 55). */
export interface Eksempel {
  situation: SituationId;
  indeks: number;
  seed: number;
  vest: Card[];
  valg: Valg;
  tal: Haandtal;
}

export interface Resultat {
  raekker: RaekkeResultat[];
  hyppighed: Hyppighed[];
  trumfPlads: TrumfPlads[];
  raadBlandt: RaadBlandt[];
  eksempel: Eksempel | null;
}

interface Hand {
  tal: Haandtal;
  grupper: string[];
  variant: boolean;
}

/** Middelstikkene pr. kort (Vests kort stigende) i hundrededele som i appens data. */
const middelstik = (o: RaaOpgave) => o.stik[0].map((_, k) => middelHundrededele(o.stik.map((r) => r[k])) / 100);

/** Hele analysen af datasættet. */
export function analyser(data: Datasaet): Resultat {
  const raekker: RaekkeResultat[] = [];
  for (const r of RAEKKER) {
    const grupper = r.samlet ? [r.situationer] : r.situationer.map((s) => [s]);
    for (const sits of grupper) {
      const haender: Hand[] = [];
      const udeladt: Record<string, number> = {};
      const set = new Set<number>();
      const udelad = (aarsag: string) => (udeladt[aarsag] = (udeladt[aarsag] ?? 0) + 1);
      const tag = (s: SituationId, opgaver: readonly RaaOpgave[], variant: boolean) => {
        for (const o of opgaver) {
          const v = udvaelg(r.id, s, o.vest);
          if (v === null) continue;
          // Samme seed er samme hånd med de samme fordelinger og stik, så hånden tæller kun én gang.
          if (set.has(o.seed)) {
            udelad(UDELADT.dublet);
            continue;
          }
          set.add(o.seed);
          if (erUdeladt(v)) {
            udelad(v.udeladt);
            continue;
          }
          haender.push({ tal: haandtal(v, o, kontraktI(s)), grupper: v.grupper, variant });
        }
      };
      for (const s of sits) {
        const raa = data.base[s];
        if (raa) tag(s, kontrolleret(raa, s), false);
        for (const id of r.varianter.filter((x) => VARIANT_SITUATION[x] === s)) {
          const vraa = data.varianter[id];
          if (vraa) tag(s, kontrolleret(vraa, s), true);
        }
      }
      const situation = r.samlet ? null : sits[0];
      const ret = retning(r.id, situation);
      const resultat = (gruppe: string | null, hs: Hand[], u: Record<string, number>): RaekkeResultat => {
        const st = statistik(hs.map((h) => h.tal));
        return {
          raekke: r.id,
          situation,
          gruppe,
          nBase: hs.filter((h) => !h.variant).length,
          nVariant: hs.filter((h) => h.variant).length,
          udeladt: u,
          statistik: st,
          retning: ret,
          dom: kompendieDom(st, ret),
        };
      };
      raekker.push(resultat(null, haender, udeladt));
      for (const g of GRUPPER[r.id] ?? []) raekker.push(resultat(g, haender.filter((h) => h.grupper.includes(g)), {}));
    }
  }
  return { raekker, hyppighed: hyppighed(data), trumfPlads: trumfPladser(data), raadBlandt: raadBlandt(data), eksempel: eksempel(data) };
}

/** Rådataenes opgaver, når kontrakten er situationens. */
function kontrolleret(raa: Raa, s: SituationId): RaaOpgave[] {
  if (raa.kontrakt !== kontraktI(s)) throw new Error(`raadanalyse.ts: rådataene for ${s} har kontrakten ${raa.kontrakt}, ikke ${kontraktI(s)}.`);
  return raa.opgaver;
}

function hyppighed(data: Datasaet): Hyppighed[] {
  const ud: Hyppighed[] = [];
  for (const id of VARIANTER) {
    const s = VARIANT_SITUATION[id];
    const vraa = data.varianter[id] as VariantRaa | undefined;
    const raa = data.base[s];
    if (!vraa || !raa) continue;
    ud.push({ variant: id, situation: s, haender: raa.opgaver.length, medFormen: raa.opgaver.filter((o) => opfyldt(o.vest, vraa.ekstra)).length });
  }
  return ud;
}

const P8_SITUATIONER: readonly SituationId[] = ['S6-trumf', 'S4-kun-en-farve', 'S8-delkontrakt'];

function trumfPladser(data: Datasaet): TrumfPlads[] {
  const ud: TrumfPlads[] = [];
  for (const s of P8_SITUATIONER) {
    const raa = data.base[s];
    const t = trumfI(s);
    if (!raa || t === null) continue;
    const plads: [number, number, number, number] = [0, 0, 0, 0];
    let n = 0;
    for (const o of kontrolleret(raa, s)) {
      if (valoerer(o.vest, t).length === 0) continue;
      const v = farvevaerdier(o.vest, middelstik(o), raa.kontrakt);
      const vt = v[t] as number;
      plads[FARVER.filter((f) => v[f] !== undefined && (v[f] as number) > vt + TOLERANCE).length]++;
      n++;
    }
    ud.push({ situation: s, trumf: t, n, plads });
  }
  return ud;
}

const RAAD_SITUATIONER: readonly SituationId[] = ['S4-kun-en-farve', 'S6-trumf'];

function raadBlandt(data: Datasaet): RaadBlandt[] {
  const ud: RaadBlandt[] = [];
  for (const s of RAAD_SITUATIONER) {
    const raa = data.base[s];
    const t = trumfI(s);
    if (!raa || t === null) continue;
    const regler = situationen(s).kompendieraad.regler;
    const alle: { vest: Card[]; bedst: Farve; blandt: boolean }[] = [];
    for (const o of kontrolleret(raa, s)) {
      const v = farvevaerdier(o.vest, middelstik(o), raa.kontrakt);
      const raad = kompendieraad(o.vest, regler);
      const blandt = bedsteFarver(v).some((f) => raad.includes(f));
      const bedst = FARVER.filter((f) => v[f] !== undefined).reduce((a, f) => ((v[f] as number) > (v[a] as number) ? f : a));
      alle.push({ vest: o.vest, bedst, blandt });
    }
    const traek = (hs: typeof alle): Traek => {
      const tr: Traek = { n: hs.length, bedste: { S: 0, H: 0, D: 0, C: 0 }, trumflaengde: [0, 0, 0, 0, 0], honnoerITrumf: 0, kortSidefarve: 0, sekvensSidefarve: 0 };
      for (const h of hs) {
        const sider = FARVER.filter((f) => f !== t);
        tr.bedste[h.bedst]++;
        tr.trumflaengde[Math.min(valoerer(h.vest, t).length, 4)]++;
        if (honnoerer(valoerer(h.vest, t)) > 0) tr.honnoerITrumf++;
        if (sider.some((f) => [1, 2].includes(valoerer(h.vest, f).length))) tr.kortSidefarve++;
        if (sider.some((f) => honnoerSekvens(valoerer(h.vest, f)))) tr.sekvensSidefarve++;
      }
      return tr;
    };
    ud.push({ situation: s, haender: alle.length, raadBlandt: alle.filter((h) => h.blandt).length, ikkeBlandt: traek(alle.filter((h) => !h.blandt)), alle: traek(alle) });
  }
  return ud;
}

/** S1 opgave 55 (indeks 55, seed 2556829236), specens faste eksempel i P9. */
const EKSEMPEL = { situation: 'S1-1nt-3nt' as SituationId, indeks: 55, seed: 2556829236 };

function eksempel(data: Datasaet): Eksempel | null {
  const o = data.base[EKSEMPEL.situation]?.opgaver[EKSEMPEL.indeks];
  if (!o || o.seed !== EKSEMPEL.seed) return null;
  const v = udvaelg('P9', EKSEMPEL.situation, o.vest);
  if (v === null || erUdeladt(v)) return null;
  return { ...EKSEMPEL, vest: o.vest, valg: v, tal: haandtal(v, o, kontraktI(EKSEMPEL.situation)) };
}

// ---------------------------------------------------------------- appens tal (SPEC-udspilstal.md)

/** Én række, situation og gruppe, som appen bruger, med tallene uafrundede (`src/modspil/content/udspil/raadtal.json`). */
export interface AppRaekke {
  raekke: RaekkeId;
  situation: SituationId | null;
  gruppe: string | null;
  n: number;
  forskel: number;
  saetForskel: number;
  dom: Dom;
  udenPraktiskBetydning: boolean;
}

/** Appens tal: rækkerne og i S6 andelen (0–1) af hænderne med trumf, hvor trumf er den bedste farve. */
export interface AppTal {
  kilde: string;
  raekker: AppRaekke[];
  trumfBedst: { situation: SituationId; n: number; andel: number };
}

/**
 * Grupperne, appen bruger pr. række: hele rækken (null), og i P9 kun grupperne efter toppen. P2's underopdeling på den
 * korteste majors længde og P9's længdegrupper bruges ikke (SPEC-udspilstal.md, Rådgiverens valg).
 */
const APP_GRUPPER: Partial<Record<RaekkeId, readonly (string | null)[]>> = { P9: ['E K', 'K D', 'D B'] };

/** Situationen med tallet "trumf er den bedste farve" i "Ved bordet". */
const TRUMF_BEDST: SituationId = 'S6-trumf';

/**
 * Appens tal ud fra analysen (`node tools/udspil/raadanalyse.mjs --app` skriver dem til
 * src/modspil/content/udspil/raadtal.json): pr. række, situation og gruppe, som appen bruger, n, forskellen i stik og i
 * chancen for at sætte, dommen og "uden praktisk betydning", uafrundet; og i S6 andelen af hænderne med trumf, hvor
 * trumf er den bedste farve (kolonnen "1." i tabellen "Trumfs plads"). Accepttest 1 i src/modspil/udspilstal/tal.test.ts.
 */
export function appTal(r: Resultat): AppTal {
  const raekker = r.raekker
    .filter((x) => (APP_GRUPPER[x.raekke] ?? [null]).includes(x.gruppe))
    .map(
      (x): AppRaekke => ({
        raekke: x.raekke,
        situation: x.situation,
        gruppe: x.gruppe,
        n: x.statistik.n,
        forskel: x.statistik.forskel,
        saetForskel: x.statistik.saetForskel,
        dom: x.statistik.dom,
        udenPraktiskBetydning: x.statistik.udenPraktiskBetydning,
      }),
    );
  const t = r.trumfPlads.find((x) => x.situation === TRUMF_BEDST);
  if (!t || t.n === 0) throw new Error(`raadanalyse.ts: tabellen "Trumfs plads" mangler ${TRUMF_BEDST}.`);
  return {
    kilde: 'node tools/udspil/raadanalyse.mjs --app (afsnit 7a i docs/MODEL.md, SPEC-udspilstal.md); rettes aldrig i hånden',
    raekker,
    trumfBedst: { situation: t.situation, n: t.n, andel: t.plads[0] / t.n },
  };
}

// ---------------------------------------------------------------- tabellerne

const SYMBOL: Record<Farve, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const KORTNAVN: Record<number, string> = { 14: 'E', 13: 'K', 12: 'D', 11: 'B', 10: '10' };
const kortTekst = (c: Card) => SYMBOL[FARVER[Math.floor(c / 13)]] + (KORTNAVN[(c % 13) + 2] ?? String((c % 13) + 2));
const SIT_KORT: Record<SituationId, string> = {
  'S1-1nt-3nt': 'S1',
  'S2-stayman': 'S2',
  'S3-transfer': 'S3',
  'S4-kun-en-farve': 'S4',
  'S5-sidefarve': 'S5',
  'S6-trumf': 'S6',
  'S7-makker-aabnet': 'S7',
  'S8-delkontrakt': 'S8',
};

/** Kompendiets påstande, omskrevet med siden (Kompendiet citeres ikke). */
const PAASTANDE: Record<PaastandId, string> = {
  P1: 'En kort major er bedre end en minor med 4 kort og en eller to honnører (s. 11–12, 14)',
  P2: 'Mod 1NT – 3NT helst den korteste major (s. 11–12)',
  P3: 'Efter transfer har ♠ en lille fordel blandt de andre farver (s. 14)',
  P4: 'Bordets viste ♥ er sjældent rigtigt uden en dyb sekvens (s. 14)',
  P5: 'En singleton i en sidefarve er et glimrende udspil (s. 19–20)',
  P6: 'En doubleton uden honnør er bedre end sit rygte (s. 19)',
  P7: 'Med et svagt bord er småkort bedre end en farve med en eller to honnører (s. 19)',
  P8: 'Trumf ud er stærkt efter 1♥ – 1♠ – 2♣ (s. 4), kun attraktivt, når ingen sidefarve er det (s. 19), og ofte det dårligste i delkontrakten (s. 19)',
  P9: '"Table feeling" mod sans: toppen eller det lave kort fra to honnører i træk',
};

/** A og B pr. række. */
const SIDER: Record<RaekkeId, [string, string]> = {
  P1: ['den korteste major (højst 3 kort)', 'en minor med præcis 4 kort og 1–2 honnører'],
  P2: ['den korteste major', 'den længste major'],
  'P3-D': ['♠', '♦'],
  'P3-C': ['♠', '♣'],
  P4: ['♥ uden dyb sekvens', '♠'],
  P5: ['singletonen i en sidefarve', 'sidefarven med 3+ kort uden honnør'],
  P6: ['doubletonen uden honnør i en sidefarve', 'sidefarven med 3+ kort uden honnør'],
  P7: ['sidefarven med 3+ kort uden honnør', 'sidefarven med 3+ kort og 1–2 honnører uden sekvens'],
  'P8-S': ['trumf', '♠'],
  'P8-H': ['trumf', '♥'],
  'P8-D': ['trumf', '♦'],
  'P8-C': ['trumf', '♣'],
  P9: ['toppen', 'det lave kort (Standard) i samme farve'],
};

const FORMEN: Record<VariantId, string> = {
  'S4-singleton': 'singleton i en sidefarve og en anden sidefarve med 3+ kort uden honnør',
  'S5-singleton': 'singleton i en sidefarve og en anden sidefarve med 3+ kort uden honnør',
  'S8-singleton': 'singleton i en sidefarve og en anden sidefarve med 3+ kort uden honnør',
  'S4-doubleton': 'doubleton uden honnør i en sidefarve og en anden sidefarve med 3+ kort uden honnør',
  'S8-doubleton': 'doubleton uden honnør i en sidefarve og en anden sidefarve med 3+ kort uden honnør',
  'S1-tablefeeling': '"table feeling" i en farve med 3+ kort (E K, K D eller D B)',
  'S2-tablefeeling': '"table feeling" i en farve med 3+ kort (E K, K D eller D B)',
};

const komma = (x: string) => x.replace('.', ',');
/** Et tal med fortegn og to decimaler (+0,12 og −0,10); "–", når det ikke findes. */
function medFortegn(x: number, decimaler = 2): string {
  if (!Number.isFinite(x)) return '–';
  const t = Math.abs(x).toFixed(decimaler);
  if (Number(t) === 0) return komma(t);
  return (x > 0 ? '+' : '−') + komma(t);
}
const decimal = (x: number, decimaler = 2) => (Number.isFinite(x) ? komma(x.toFixed(decimaler)) : '–');
const procent = (x: number) => (Number.isFinite(x) ? `${Math.round(100 * x)} %` : '–');
const andel = (x: number, n: number) => (n > 0 ? `${x} (${Math.round((100 * x) / n)} %)` : String(x));

function raekkeNavn(r: RaekkeResultat): string {
  const p = paastand(r.raekke);
  const b = r.raekke.startsWith('P3-') || r.raekke.startsWith('P8-') ? ` · ${SIDER[r.raekke][1]}` : '';
  if (r.gruppe === null) return p + b;
  if (r.raekke === 'P2') return `${p} · korteste major ${r.gruppe} kort`;
  return /^\d/.test(r.gruppe) ? `${p} · ${r.gruppe} kort` : `${p} · ${r.gruppe}`;
}

function situationNavn(r: RaekkeResultat): string {
  if (r.situation) return SIT_KORT[r.situation];
  return RAEKKER.find((x) => x.id === r.raekke)!.situationer.map((s) => SIT_KORT[s]).join(' + ');
}

function antal(r: RaekkeResultat): string {
  const harVariant = RAEKKER.find((x) => x.id === r.raekke)!.varianter.length > 0;
  return harVariant ? `${r.nBase} + ${r.nVariant} = ${r.nBase + r.nVariant}` : String(r.nBase);
}

function udeladtTekst(u: Readonly<Record<string, number>>): string {
  const dele = Object.entries(u).map(([aarsag, n]) => `${n} (${aarsag})`);
  return dele.length ? dele.join(', ') : '–';
}

/** Tabellerne til afsnit 7a i docs/MODEL.md (det, `node tools/udspil/raadanalyse.mjs --markdown` skriver). */
export function markdown(r: Resultat): string {
  const linjer: string[] = [];
  const tabel = (hoved: string[], raekker: string[][]) => {
    linjer.push(`| ${hoved.join(' | ')} |`, `| ${hoved.map(() => '---').join(' | ')} |`);
    for (const x of raekker) linjer.push(`| ${x.join(' | ')} |`);
  };

  linjer.push('### Påstandene', '');
  tabel(
    ['Række', 'Kompendiets påstand (s.)', 'A', 'B'],
    RAEKKER.map((x) => [x.id.startsWith('P3-') || x.id.startsWith('P8-') ? `${x.paastand} · ${SIDER[x.id][1]}` : x.paastand, PAASTANDE[x.paastand], SIDER[x.id][0], SIDER[x.id][1]]),
  );

  linjer.push('', '### Resultaterne', '');
  tabel(
    ['Række', 'Situation', 'Kompendiets retning', 'Hænder (base + variant)', 'Udeladt', 'A − B (stik)', 'Standardfejl', '95 %-interval', 'A bedre / lige / B bedre', 'Sætter, A − B (procentpoint)', 'Dom'],
    r.raekker.map((x) => {
      const s = x.statistik;
      return [
        raekkeNavn(x),
        situationNavn(x),
        x.retning,
        antal(x),
        x.gruppe === null ? udeladtTekst(x.udeladt) : '',
        medFortegn(s.forskel),
        decimal(s.standardfejl),
        Number.isFinite(s.standardfejl) ? `[${medFortegn(s.interval[0])}; ${medFortegn(s.interval[1])}]` : '–',
        `${procent(s.holder)} / ${procent(s.lige)} / ${procent(s.modsat)}`,
        medFortegn(s.saetForskel, 1),
        x.dom,
      ];
    }),
  );
  if (r.eksempel) {
    const e = r.eksempel;
    const hand = FARVER.map((f) => SYMBOL[f] + valoerer(e.vest, f).sort((a, b) => b - a).map((v) => KORTNAVN[v] ?? String(v)).join(' ')).join(' ');
    linjer.push(
      '',
      `Fast eksempel i P9: ${SIT_KORT[e.situation]} opgave ${e.indeks} (seed ${e.seed}, ${hand}): ${kortTekst(e.valg.a.kort[0])} giver ${decimal(e.tal.a)} stik og sætter i ${procent(e.tal.aSaet)}, ${kortTekst(e.valg.b.kort[0])} giver ${decimal(e.tal.b)} stik og sætter i ${procent(e.tal.bSaet)}.`,
    );
  }

  linjer.push('', '### Hyppigheden af varianternes former i basen', '');
  tabel(
    ['Variant', 'Formen', 'Hænder i basen med formen'],
    r.hyppighed.map((h) => [h.variant, FORMEN[h.variant], `${h.medFormen} af ${h.haender} (${Math.round((100 * h.medFormen) / h.haender)} %)`]),
  );

  linjer.push('', '### Trumfs plads blandt Vests farver (P8)', '');
  tabel(
    ['Situation', 'Trumf', 'Hænder med trumf', '1.', '2.', '3.', '4.'],
    r.trumfPlads.map((t) => [SIT_KORT[t.situation], SYMBOL[t.trumf], String(t.n), ...t.plads.map((p) => andel(p, t.n))]),
  );

  linjer.push('', '### S4 og S6: hænderne, hvor rådet ikke er blandt dobbeltdummys bedste farver', '');
  const kol = r.raadBlandt.flatMap((x) => [x.ikkeBlandt, x.alle]);
  const trumf = r.raadBlandt.map((x) => SYMBOL[trumfI(x.situation) as Farve]);
  const raek = (navn: string, f: (t: Traek) => number) => [navn, ...kol.map((t) => andel(f(t), t.n))];
  tabel(
    ['', ...r.raadBlandt.flatMap((x, i) => [`${SIT_KORT[x.situation]} (${trumf[i]}): rådet ikke blandt de bedste`, `${SIT_KORT[x.situation]}: alle hænder`])],
    [
      ['Hænder', ...kol.map((t) => String(t.n))],
      ...FARVER.map((f) => raek(`Bedste farve ${SYMBOL[f]}`, (t) => t.bedste[f])),
      ...['0', '1', '2', '3', '4+'].map((l, i) => raek(`Trumflængde ${l}`, (t) => t.trumflaengde[i])),
      raek('Honnør i trumf', (t) => t.honnoerITrumf),
      raek('Singleton eller doubleton i en sidefarve', (t) => t.kortSidefarve),
      raek('Honnørsekvens i en sidefarve', (t) => t.sekvensSidefarve),
    ],
  );
  linjer.push(
    '',
    `Rådet er blandt dobbeltdummys bedste farver (under 0,1 stik fra den bedste) i ${r.raadBlandt.map((x) => `${SIT_KORT[x.situation]} ${x.raadBlandt} af ${x.haender} (${Math.round((100 * x.raadBlandt) / x.haender)} %)`).join(' og ')}.`,
  );
  return linjer.join('\n');
}
