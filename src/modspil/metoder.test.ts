import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bydeform } from '../sprog/bydeform';
import { danishJson, danishStrings, ROOT } from '../sprog/danskTekst';
import { fund } from '../sprog/fagord';
import fil from './content/metoder.json';
import { KATEGORIER, medMetode, metode, profil, PROFILER, profilId, REGLER } from './model/metoder';

/*
 * Accepttest 1 i SPEC-modspil.md: metodefilen og profilerne. Rød, indtil byggeriet (fase 2) har leveret:
 *
 * src/modspil/content/metoder.json
 *   {
 *     "kategorier": [ { "id", "tekst", "tekstEn", "metoder": [ { "id", "tekst", "tekstEn", "kilde"?, "sans"?, "farve"? } ] } ],
 *     "profiler":   [ { "id", "tekst", "tekstEn", "valg": { "<kategori-id>": "<metode-id>", … } } ]
 *   }
 *   - id'er med små bogstaver og bindestreg (a–z); `tekst` er dansk, `tekstEn` engelsk (danishJson springer `…En` over).
 *   - `tekst` er metodens korte navn, som facit og forklaring nævner, fx "4.-højeste" og "lavt = kald".
 *   - `kilde` står, hvor der er én, fx "Kompendium over modspilsaftaler, s. 24".
 *   - `sans`/`farve`: den metode i samme kategori, der gælder i stedet i den kontrakt. Kun romersk kald har
 *     "sans": "lavt-kald" (Kompendiet: lavt = kald mod sans), og kun ALA har "farve": "top-af-sekvens".
 *
 * src/modspil/model/metoder.ts
 *   export type KategoriId = 'udspil-sans' | 'udspil-farve' | 'honnoerudspil' | 'kald' | 'laengde' | 'afkast' | 'forsinket';
 *   export type ProfilId = 'standard' | 'omvendt' | 'kompendiet';
 *   export interface Profil { id: string; valg: Readonly<Record<KategoriId, string>> }   // valg som type, ikke interface
 *   export interface Metode { id: string; tekst: string; tekstEn: string; kilde?: string; sans?: string; farve?: string }
 *   export const KATEGORIER: readonly KategoriId[];             // filens orden
 *   export const PROFILER: readonly Profil[];                    // filens profiler: standard, omvendt, kompendiet
 *   export function profil(id: ProfilId): Profil;
 *   export function profilId(valg: Profil['valg']): ProfilId | 'egen';   // "Egen", når valget ikke er en af de tre
 *   export function medMetode(p: Profil, kategori: KategoriId, id: string): Profil;   // kaster ved ukendt metode
 *   export function metode(kategori: KategoriId, id: string): Metode;                // filens post
 *   export const REGLER: Readonly<Record<KategoriId, Readonly<Record<string, unknown>>>>;  // koden pr. metode
 *
 * "Der er ingen regel i koden, som ikke findes i filen" er her to konkrete krav:
 *   (a) REGLER, koden pr. metode, har præcis filens kategorier og metode-id'er: ingen metode i koden uden en post i
 *       filen, og ingen post i filen uden kode.
 *   (b) Metode-id'erne står kun som tekst i `model/metoder.ts` (og i filen): ingen anden kildefil i src/modspil/ skriver
 *       et metode-id i hånden, så en regel ikke kan stå flere steder. Resten af koden spørger metoder.ts.
 *       Testene og testens brute force (`bruteforce.ts`) er undtaget, fordi de skal regne uafhængigt.
 */

interface MetodeData {
  id: string;
  tekst: string;
  tekstEn: string;
  kilde?: string;
  sans?: string;
  farve?: string;
}
interface KategoriData {
  id: string;
  tekst: string;
  tekstEn: string;
  metoder: MetodeData[];
}
interface ProfilData {
  id: string;
  tekst: string;
  tekstEn: string;
  valg: Record<string, string>;
}
const FIL = fil as unknown as { kategorier: KategoriData[]; profiler: ProfilData[] };

const KATEGORI_IDER = ['udspil-sans', 'udspil-farve', 'honnoerudspil', 'kald', 'laengde', 'afkast', 'forsinket'];

/** Specens tabel "Metoderne og profilerne" med id'er. */
const METODER: Record<string, string[]> = {
  'udspil-sans': ['fjerde-hoejeste', 'tredje-femte', 'kompendiets'],
  'udspil-farve': ['fjerde-hoejeste', 'tredje-femte'],
  honnoerudspil: ['top-af-sekvens', 'ala-mod-sans'],
  kald: ['hoejt-kald', 'lavt-kald', 'romersk-kald'],
  laengde: ['hoejt-lavt-lige', 'lavt-hoejt-lige'],
  afkast: ['som-kald-afvisning', 'ulige-lige', 'lavinthal'],
  forsinket: ['intet-forsinket', 'omvendt-forsinket'],
};

const PROFILTABEL: Record<string, Record<string, string>> = {
  standard: {
    'udspil-sans': 'fjerde-hoejeste',
    'udspil-farve': 'fjerde-hoejeste',
    honnoerudspil: 'top-af-sekvens',
    kald: 'hoejt-kald',
    laengde: 'hoejt-lavt-lige',
    afkast: 'som-kald-afvisning',
    forsinket: 'intet-forsinket',
  },
  omvendt: {
    'udspil-sans': 'fjerde-hoejeste',
    'udspil-farve': 'tredje-femte',
    honnoerudspil: 'top-af-sekvens',
    kald: 'lavt-kald',
    laengde: 'lavt-hoejt-lige',
    afkast: 'som-kald-afvisning',
    forsinket: 'intet-forsinket',
  },
  kompendiet: {
    'udspil-sans': 'kompendiets',
    'udspil-farve': 'tredje-femte',
    honnoerudspil: 'ala-mod-sans',
    kald: 'romersk-kald',
    laengde: 'lavt-hoejt-lige',
    afkast: 'ulige-lige',
    forsinket: 'omvendt-forsinket',
  },
};

/** Metoderne, Kompendiet er kilden til. */
const FRA_KOMPENDIET: [string, string][] = [
  ['udspil-sans', 'kompendiets'],
  ['honnoerudspil', 'ala-mod-sans'],
  ['kald', 'romersk-kald'],
  ['afkast', 'ulige-lige'],
  ['forsinket', 'omvendt-forsinket'],
];

const ID = /^[a-z]+(?:-[a-z]+)*$/;
const kategori = (id: string) => FIL.kategorier.find((k) => k.id === id)!;

describe('Metodefilen (accepttest 1)', () => {
  it('har specens syv kategorier i specens orden og specens metoder', () => {
    expect(FIL.kategorier.map((k) => k.id)).toEqual(KATEGORI_IDER);
    expect(Object.fromEntries(FIL.kategorier.map((k) => [k.id, k.metoder.map((m) => m.id)]))).toEqual(METODER);
  });

  it('hver kategori, metode og profil har id og tekst på dansk og engelsk, og kilden er tekst, hvor den står', () => {
    const poster = [...FIL.kategorier, ...FIL.kategorier.flatMap((k) => k.metoder), ...FIL.profiler];
    for (const p of poster as (MetodeData | KategoriData | ProfilData)[]) {
      expect(p.id, JSON.stringify(p)).toMatch(ID);
      expect(typeof p.tekst === 'string' && p.tekst.trim().length > 0, `${p.id}: dansk tekst`).toBe(true);
      expect(typeof p.tekstEn === 'string' && p.tekstEn.trim().length > 0, `${p.id}: engelsk tekst`).toBe(true);
    }
    for (const m of FIL.kategorier.flatMap((k) => k.metoder)) {
      if ('kilde' in m) expect(typeof m.kilde === 'string' && m.kilde.trim().length > 0, `${m.id}: kilde`).toBe(true);
    }
    for (const k of FIL.kategorier) expect(new Set(k.metoder.map((m) => m.id)).size, k.id).toBe(k.metoder.length);
  });

  it('Kompendiets metoder har Kompendiet som kilde', () => {
    for (const [k, id] of FRA_KOMPENDIET) {
      expect(kategori(k).metoder.find((m) => m.id === id)?.kilde, `${k}/${id}`).toMatch(/Kompendi/);
    }
  });

  it('romersk kald er lavt = kald mod sans, og ALA er top af sekvens mod farve; ingen andre metoder skifter', () => {
    const skift = FIL.kategorier.flatMap((k) =>
      k.metoder.filter((m) => m.sans !== undefined || m.farve !== undefined).map((m) => ({ kategori: k.id, id: m.id, sans: m.sans, farve: m.farve })),
    );
    expect(skift).toEqual([
      { kategori: 'honnoerudspil', id: 'ala-mod-sans', sans: undefined, farve: 'top-af-sekvens' },
      { kategori: 'kald', id: 'romersk-kald', sans: 'lavt-kald', farve: undefined },
    ]);
  });

  it('de tre profiler vælger én gyldig metode pr. kategori som i specens tabel', () => {
    expect(FIL.profiler.map((p) => p.id)).toEqual(['standard', 'omvendt', 'kompendiet']);
    for (const p of FIL.profiler) {
      expect(Object.keys(p.valg).sort(), p.id).toEqual([...KATEGORI_IDER].sort());
      for (const [k, id] of Object.entries(p.valg)) {
        expect(kategori(k).metoder.map((m) => m.id), `${p.id}: ${k}`).toContain(id);
      }
      expect(p.valg, p.id).toEqual(PROFILTABEL[p.id]);
    }
  });

  it('teksterne består sprog-tjekket: husets ord og beskrivende form', () => {
    const tekster = danishJson(FIL);
    expect(tekster.length).toBeGreaterThan(40);
    const fejl = tekster.flatMap((t) => [
      ...fund(t).map((f) => `"${f.word}" (husets ord: ${f.house}) i "${t}"`),
      ...bydeform(t).map((b) => `bydeform: "${b}"`),
    ]);
    expect(fejl).toEqual([]);
  });
});

describe('Metoderne i koden (accepttest 1)', () => {
  it('kategorierne, profilerne og teksterne kommer fra filen', () => {
    expect([...KATEGORIER]).toEqual(KATEGORI_IDER);
    expect(PROFILER.map((p) => ({ id: p.id, valg: { ...p.valg } }))).toEqual(FIL.profiler.map((p) => ({ id: p.id, valg: p.valg })));
    for (const id of ['standard', 'omvendt', 'kompendiet'] as const) expect({ ...profil(id).valg }).toEqual(PROFILTABEL[id]);
    for (const k of FIL.kategorier) {
      for (const m of k.metoder) {
        const kode = metode(k.id as (typeof KATEGORIER)[number], m.id);
        expect({ id: kode.id, tekst: kode.tekst, tekstEn: kode.tekstEn, kilde: kode.kilde }).toEqual({ id: m.id, tekst: m.tekst, tekstEn: m.tekstEn, kilde: m.kilde });
      }
    }
  });

  it('profilId genkender de tre profiler, og en ændret metode giver "Egen"', () => {
    for (const id of ['standard', 'omvendt', 'kompendiet'] as const) expect(profilId(profil(id).valg)).toBe(id);
    const egen = medMetode(profil('standard'), 'kald', 'lavt-kald');
    expect(egen.valg.kald).toBe('lavt-kald');
    expect({ ...egen.valg, kald: 'hoejt-kald' }).toEqual(PROFILTABEL.standard);
    expect(profilId(egen.valg)).toBe('egen');
    // Profilen selv er uændret.
    expect(profil('standard').valg.kald).toBe('hoejt-kald');
    expect(() => medMetode(profil('standard'), 'kald', 'findes-ikke')).toThrow();
    expect(() => medMetode(profil('standard'), 'udspil-farve', 'kompendiets')).toThrow();
  });

  it('(a) ingen regel i koden, som ikke findes i filen: koden pr. metode har præcis filens metoder', () => {
    expect(Object.keys(REGLER).sort()).toEqual([...KATEGORI_IDER].sort());
    for (const k of KATEGORI_IDER) {
      expect(Object.keys(REGLER[k as keyof typeof REGLER]).sort(), k).toEqual([...METODER[k]].sort());
    }
  });

  it('(b) ingen regel står i hånden i flere filer: metode-id\'erne står kun i model/metoder.ts', () => {
    const mappe = `${ROOT}src/modspil/`;
    expect(existsSync(`${mappe}model/metoder.ts`)).toBe(true);
    const ider = new Set(Object.values(METODER).flat());
    const filer = (readdirSync(mappe, { recursive: true }) as string[])
      .map((f) => f.replace(/\\/g, '/'))
      .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && f !== 'model/metoder.ts' && f !== 'bruteforce.ts');
    expect(filer.length).toBeGreaterThan(3);
    const fejl = filer.flatMap((f) =>
      danishStrings(readFileSync(mappe + f, 'utf8'), f.endsWith('.tsx'))
        .filter((s) => ider.has(s.trim()))
        .map((s) => `${f}: '${s}'`),
    );
    expect(fejl).toEqual([]);
  });
});
