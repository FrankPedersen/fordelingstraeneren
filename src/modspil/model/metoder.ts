import fil from '../content/metoder.json';

/**
 * Metoderne og profilerne i Modspil (SPEC-modspil.md, "Metoderne og profilerne"). Alle metoder står i
 * `content/metoder.json` med id, tekst på dansk og engelsk og kilde, og koden læser dem derfra. Reglerne pr. metode står
 * kun her i `REGLER`, og metode-id'erne står kun i denne fil og i metodefilen; resten af modellen spørger herfra
 * (accepttest 1 (a) og (b)).
 */

export type KategoriId = 'udspil-sans' | 'udspil-farve' | 'honnoerudspil' | 'kald' | 'laengde' | 'afkast' | 'forsinket';
export type ProfilId = 'standard' | 'omvendt' | 'kompendiet';

/** Kontraktens art: mod sans eller mod farve. */
export type Kontraktart = 'sans' | 'farve';

export interface Metode {
  id: string;
  /** Metodens korte navn, som facit og forklaring nævner, fx "4.-højeste". */
  tekst: string;
  tekstEn: string;
  kilde?: string;
  /** Metoden i samme kategori, der gælder i stedet mod sans (romersk kald: lavt = kald). */
  sans?: string;
  /** Metoden i samme kategori, der gælder i stedet mod farve (ALA: top af sekvens). */
  farve?: string;
  /** Aftalen i en eller to sætninger, til Indstillinger og "Aftalen" under spørgsmålet. */
  aftale?: string;
  aftaleEn?: string;
}

export interface Kategori {
  id: KategoriId;
  tekst: string;
  tekstEn: string;
  metoder: readonly Metode[];
}

export type Valg = Readonly<Record<KategoriId, string>>;

export interface Profil {
  /** Profilens id, eller "egen", når valget ikke er en af de tre profiler. */
  id: string;
  valg: Valg;
}

interface ProfilData {
  id: ProfilId;
  tekst: string;
  tekstEn: string;
  valg: Record<KategoriId, string>;
}

const FIL = fil as unknown as { kategorier: Kategori[]; profiler: ProfilData[] };

/** Kategorierne i filens orden. */
export const KATEGORIER: readonly KategoriId[] = FIL.kategorier.map((k) => k.id);

/** Kategorierne med metoder, som de står i filen. */
export const KATEGORI_DATA: readonly Kategori[] = FIL.kategorier;

// ---------------------------------------------------------------- reglerne pr. metode

/** Et lavt udspil: kortet fra tre kort eller flere (`h` sorteret faldende); fra singleton og doubleton gælder det højeste. */
export interface LavtUdspilRegel {
  lavtKort(h: readonly number[]): number;
  /** Den mindste længde, øvelse 2 og 3 regner med for et lavt udspil. */
  mindsteLaengde: number;
  /** Vests antal kort over et lavt udspil, når det altid er det samme (4.-højeste: 3); ellers null. */
  kortOver: number | null;
}

/** Svaret fra en honnørsekvens: ét kort, "table feeling" (toppen eller det lave kort) eller ingen sekvens. */
export type Honnoersvar = number | 'table-feeling' | null;

export interface HonnoerRegel {
  /** Honnørudspillet fra `h` (sorteret faldende). */
  udspil(h: readonly number[], art: Kontraktart): Honnoersvar;
  /** Kongen beder om længdemarkering mod sans (ALA); ellers beder honnøren om kald eller afvisning. */
  kongenBederOmLaengde: boolean;
}

export interface KaldRegel {
  /** Romersk kald: ulige = kald, lige = skift lav eller høj. */
  romersk: boolean;
  /** Højt kort er kald (ellers er lavt kort kald). Bruges ikke ved romersk kald. */
  hoejtErKald: boolean;
}

export interface LaengdeRegel {
  /** Et lavt kort viser et lige antal (ellers viser et højt kort et lige antal). */
  lavtErLige: boolean;
}

/** Hvordan første afkast læses: efter aftalen om kald eller afvisning, ulige/lige eller retning (lavt/højt). */
export type Afkastlaesning = 'efter-kaldet' | 'paritet' | 'retning';

export interface AfkastRegel {
  laesning: Afkastlaesning;
}

export interface ForsinketRegel {
  /** Rækkefølgen i spilførers første farve betyder passivt eller aktivt. */
  findes: boolean;
}

interface RegelTyper {
  'udspil-sans': LavtUdspilRegel;
  'udspil-farve': LavtUdspilRegel;
  honnoerudspil: HonnoerRegel;
  kald: KaldRegel;
  laengde: LaengdeRegel;
  afkast: AfkastRegel;
  forsinket: ForsinketRegel;
}

/** De øverste kort i træk: to honnørkort fra B, tre kort fra 10 og en brudt sekvens (K D 10, D B 9). */
function sekvens(h: readonly number[]): { to: boolean; tre: boolean; brudt: boolean } {
  const [top, anden = 0, tredje = 0] = h;
  const to = h.length >= 2 && top >= 11 && anden === top - 1;
  return {
    to,
    tre: h.length >= 3 && top >= 10 && anden === top - 1 && tredje === top - 2,
    brudt: to && h.length >= 3 && tredje === top - 3,
  };
}

/** To honnørkort i træk uden mere: fra doubleton toppen, ellers "table feeling". */
const toHonnoerer = (h: readonly number[]): Honnoersvar => (sekvens(h).to ? (h.length === 2 ? h[0] : 'table-feeling') : null);

/**
 * ALA-tabellen mod sans (PLAN-aabne-opgaver.md, besluttet 15. november 2026): de øverste kort, mindste eller præcis
 * længde og kortet. Den første række, der passer, gælder.
 */
const ALA_TABEL: readonly { top: readonly number[]; mindst?: number; praecis?: number; kort: number }[] = [
  { top: [14, 13, 12], kort: 14 }, // E K D x(x) → E
  { top: [14, 13, 11, 10], kort: 13 }, // E K B 10(x) → K
  { top: [14, 13], mindst: 5, kort: 13 }, // E K x x x(+) → K
  { top: [14, 13], praecis: 4, kort: 14 }, // E K x x → E
  { top: [13, 12, 11], kort: 13 }, // K D B → K
  { top: [13, 12, 10, 9], kort: 13 }, // K D 10 9(x) → K
  { top: [13, 12], mindst: 4, kort: 12 }, // K D x x(x) → D
  { top: [12, 11, 10], kort: 12 }, // D B 10 → D
  { top: [12, 11, 9], kort: 12 }, // D B 9 → D
  { top: [11, 10, 9], kort: 11 }, // B 10 9 → toppen
  { top: [10, 9, 8], kort: 10 }, // 10 9 8 → toppen
];

function alaKort(h: readonly number[]): number | null {
  const raekke = ALA_TABEL.find(
    (r) =>
      r.top.every((v, i) => h[i] === v) &&
      (r.mindst === undefined || h.length >= r.mindst) &&
      (r.praecis === undefined || h.length === r.praecis),
  );
  return raekke ? raekke.kort : null;
}

const FJERDE: LavtUdspilRegel = {
  // Fra tre kort indgår reglen ikke i øvelserne (mindste længde 4): med honnør det laveste, ellers det højeste.
  lavtKort: (h) => (h.length >= 4 ? h[3] : h[0] >= 11 ? h[h.length - 1] : h[0]),
  mindsteLaengde: 4,
  kortOver: 3,
};

const TREDJE_FEMTE: LavtUdspilRegel = {
  lavtKort: (h) => (h.length >= 5 ? h[4] : h[2]),
  mindsteLaengde: 3,
  kortOver: null,
};

const KOMPENDIETS: LavtUdspilRegel = {
  // Småkort (højst en 9'er): tredje laveste. En tier: næsthøjeste. Honnør: 4.-højeste, fra Hxx det laveste.
  lavtKort: (h) => (h[0] <= 9 ? h[h.length - 3] : h[0] === 10 ? h[1] : h.length >= 4 ? h[3] : h[2]),
  mindsteLaengde: 3,
  kortOver: null,
};

/** Koden pr. metode: præcis filens kategorier og metoder (kontrolleres, når modulet indlæses). */
export const REGLER: { readonly [K in KategoriId]: Readonly<Record<string, RegelTyper[K]>> } = {
  'udspil-sans': { 'fjerde-hoejeste': FJERDE, 'tredje-femte': TREDJE_FEMTE, kompendiets: KOMPENDIETS },
  'udspil-farve': { 'fjerde-hoejeste': FJERDE, 'tredje-femte': TREDJE_FEMTE },
  honnoerudspil: {
    'top-af-sekvens': {
      udspil(h, art) {
        const s = sekvens(h);
        if (art === 'farve') return s.to || s.tre ? h[0] : null;
        return s.tre || s.brudt ? h[0] : toHonnoerer(h);
      },
      kongenBederOmLaengde: false,
    },
    'ala-mod-sans': {
      udspil: (h) => alaKort(h) ?? toHonnoerer(h),
      kongenBederOmLaengde: true,
    },
  },
  kald: {
    'hoejt-kald': { romersk: false, hoejtErKald: true },
    'lavt-kald': { romersk: false, hoejtErKald: false },
    'romersk-kald': { romersk: true, hoejtErKald: false },
  },
  laengde: {
    'hoejt-lavt-lige': { lavtErLige: false },
    'lavt-hoejt-lige': { lavtErLige: true },
  },
  afkast: {
    'som-kald-afvisning': { laesning: 'efter-kaldet' },
    'ulige-lige': { laesning: 'paritet' },
    lavinthal: { laesning: 'retning' },
  },
  forsinket: {
    'intet-forsinket': { findes: false },
    'omvendt-forsinket': { findes: true },
  },
};

// Filen og koden skal have præcis de samme metoder, og "sans"/"farve" skal pege på en metode i samme kategori.
for (const k of FIL.kategorier) {
  const kode = Object.keys(REGLER[k.id] ?? {}).sort().join();
  const ider = k.metoder.map((m) => m.id);
  if (kode !== [...ider].sort().join()) throw new Error(`Metoderne i ${k.id} i metoder.json passer ikke med koden`);
  for (const m of k.metoder) {
    for (const andet of [m.sans, m.farve]) {
      if (andet !== undefined && !ider.includes(andet)) throw new Error(`${k.id}/${m.id} peger på en ukendt metode: ${andet}`);
    }
  }
}
if (Object.keys(REGLER).sort().join() !== [...KATEGORIER].sort().join()) throw new Error('Kategorierne i metoder.json passer ikke med koden');

// ---------------------------------------------------------------- opslag

/** Kategoriens post i filen. */
export function kategori(id: KategoriId): Kategori {
  const k = FIL.kategorier.find((x) => x.id === id);
  if (!k) throw new Error(`Ukendt kategori: ${id}`);
  return k;
}

/** Metodens post i filen; kaster ved en ukendt metode. */
export function metode(kategoriId: KategoriId, id: string): Metode {
  const m = kategori(kategoriId).metoder.find((x) => x.id === id);
  if (!m) throw new Error(`Ukendt metode i ${kategoriId}: ${id}`);
  return m;
}

/** Filens profiler: standard, omvendt og kompendiet. */
export const PROFILER: readonly Profil[] = FIL.profiler.map((p) => ({ id: p.id, valg: { ...p.valg } }));

export function profil(id: ProfilId): Profil {
  const p = PROFILER.find((x) => x.id === id);
  if (!p) throw new Error(`Ukendt profil: ${id}`);
  return p;
}

/** Profilen, valget svarer til, eller "egen". */
export function profilId(valg: Profil['valg']): ProfilId | 'egen' {
  const p = PROFILER.find((x) => KATEGORIER.every((k) => x.valg[k] === valg[k]));
  return p ? (p.id as ProfilId) : 'egen';
}

/** Profilens navn på dansk og engelsk; en ændret profil hedder "Egen". */
export function profilNavn(id: ProfilId | 'egen'): { tekst: string; tekstEn: string } {
  const p = FIL.profiler.find((x) => x.id === id);
  return p ? { tekst: p.tekst, tekstEn: p.tekstEn } : { tekst: 'Egen', tekstEn: 'Custom' };
}

/** En ny profil med én metode skiftet; kaster ved en metode, der ikke findes i kategorien. */
export function medMetode(p: Profil, kategoriId: KategoriId, id: string): Profil {
  metode(kategoriId, id);
  const valg: Valg = { ...p.valg, [kategoriId]: id };
  return { id: profilId(valg), valg };
}

/** Den metode, der gælder i kontrakten: romersk kald er lavt = kald mod sans, og ALA er top af sekvens mod farve. */
export function gaeldendeId(p: Profil, kategoriId: KategoriId, art: Kontraktart): string {
  const m = metode(kategoriId, p.valg[kategoriId]);
  return (art === 'sans' ? m.sans : m.farve) ?? m.id;
}

/** Den gældende metode som { kategori, id }, som opgaven har den. */
export function gaeldende(p: Profil, kategoriId: KategoriId, art: Kontraktart): { kategori: KategoriId; id: string } {
  return { kategori: kategoriId, id: gaeldendeId(p, kategoriId, art) };
}

/** Reglen for den gældende metode. */
export function regel<K extends KategoriId>(p: Profil, kategoriId: K, art: Kontraktart): RegelTyper[K] {
  return REGLER[kategoriId][gaeldendeId(p, kategoriId, art)];
}
