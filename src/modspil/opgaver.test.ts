import { beforeAll, describe, expect, it } from 'vitest';
import { SEATS } from '../domain/dealer';
import { bydeform } from '../sprog/bydeform';
import { fund } from '../sprog/fagord';
import { FOERSTE_NIVEAU, harOvelse, lavNiveauOpgave, lavOpgave, OVELSER, type ModspilOpgave, type Niveau, type Ovelse } from './model/generator';
import { metode, profil, type Profil } from './model/metoder';

/*
 * Generatoren og facit i SPEC-modspil.md ("Løser, generator og facit" punkt 1–6), accepttest 8 (genskabelse) og 9
 * (andelen af "kan ikke afgøres"). Rød, indtil byggeriet har leveret:
 *
 * src/modspil/model/generator.ts
 *   export type Ovelse = 'point' | 'regel11' | 'laengde' | 'markering' | 'vaelg-kort' | 'afkast' | 'forsinket';  // øvelse 1–7
 *   export const OVELSER: readonly Ovelse[];                        // i den orden
 *   export type Niveau = 1 | 2 | 3 | 4 | 5;
 *   export const FOERSTE_NIVEAU: Readonly<Record<Ovelse, Niveau>>;  // 1–3: 1; 4–5: 2; 6–7: 3 (specens niveautabel)
 *   export function harOvelse(ovelse: Ovelse, profil: Profil): boolean;   // forsinket kald kræver omvendt forsinket kald
 *   export function lavOpgave(ovelse: Ovelse, niveau: Niveau, seed: number, profil: Profil): ModspilOpgave;
 *     // kaster, når profilen ikke har øvelsen, eller niveauet er under øvelsens første niveau
 *   export function lavNiveauOpgave(niveau: Niveau, seed: number, profil: Profil): ModspilOpgave;  // vælger selv øvelsen
 *   export interface ModspilOpgave {
 *     ovelse: Ovelse; niveau: Niveau; seed: number; profil: Profil;
 *     plads: 'W' | 'E';                       // brugerens plads: Øst i øvelse 1, 2, 3 og 5, Vest i 4, begge i 6 og 7
 *     haender: Hands;                         // alle fire hænder (domain/dealer), 13 kort hver, som givet
 *     meldeforloeb: { giver: Seat; meldinger: { plads: Seat; melding: string; hp?: Allowed }[] };   // se point.test.ts
 *     kontrakt: Kontrakt;                     // '3NT' | '4H' | '4S'; Syd spiller, Nord er bordet
 *     farve: number;                          // den aktuelle farve: udspilsfarven (2–5), spilførers farve, hvor
 *                                             // makker eller brugeren ikke kan bekende (6), spilførers første farve (7)
 *     spillet: readonly { plads: Seat; kort: Card }[];   // de spillede kort, brugeren ser, i rækkefølge
 *                                             // 2–3: [Vests udspil]; 4: [udspil, bordets kort, Østs kort]; 5: [udspil, bordets kort]
 *     brugerHp: boolean;                      // løseren bruger hp-intervallerne: øvelse 1 altid, 2–3 fra niveau 4, ellers ikke
 *     sporgsmaal: { variant?: 'aflaes' | 'vaelg'; onske?: Signal | number | 'passiv' | 'aktiv' };
 *                                             // 5: onske er et Signal; 6 og 7: variant, og ved 'vaelg' onske
 *                                             // (6: farven, brugeren vil have spillet; 7: 'passiv' eller 'aktiv')
 *     metode?: { kategori: KategoriId; id: string };   // metoden, der afgør facit (ikke i øvelse 1); romersk kald mod
 *                                             // sans er 'lavt-kald', og ALA mod farve er 'top-af-sekvens'
 *     facit: Facit;                           // se loeser.test.ts
 *     hvilke?: Facit;                         // regel 11 og 12 fra niveau 4: Syds kort over udspillet eller kan ikke afgøres
 *     forklaring: { da: string; en: string }; // nævner metodens tekst fra filen
 *   }
 */

const PROFILER: [string, Profil][] = [
  ['standard', profil('standard')],
  ['omvendt', profil('omvendt')],
  ['kompendiet', profil('kompendiet')],
];
const NIVEAUER: Niveau[] = [1, 2, 3, 4, 5];
const niveauerFor = (ovelse: Ovelse) => NIVEAUER.filter((n) => n >= FOERSTE_NIVEAU[ovelse]);
const UKLAR = new Set(['kan-ikke-afgoeres', 'tvetydig']);
const vaerdi = (kort: number) => (kort % 13) + 2;
const farveAf = (kort: number) => Math.floor(kort / 13);

/** Facittyperne pr. øvelse (og variant). */
const FACITTYPER: Record<Ovelse, string[]> = {
  point: ['interval'],
  regel11: ['tal', 'kan-ikke-afgoeres'],
  laengde: ['laengder', 'kan-ikke-afgoeres'],
  markering: ['signal', 'laengder', 'kan-ikke-afgoeres', 'tvetydig'],
  'vaelg-kort': ['kort'],
  afkast: ['signal', 'kort'],
  forsinket: ['forsinket', 'kort'],
};

/** Et udsnit af opgaver: hver profil, hver øvelse, profilen har, hvert niveau og seed 1 til `antal`. */
function udsnit(antal: number): ModspilOpgave[] {
  const ud: ModspilOpgave[] = [];
  for (const [, p] of PROFILER) {
    for (const ovelse of OVELSER) {
      if (!harOvelse(ovelse, p)) continue;
      for (const niveau of niveauerFor(ovelse)) for (let seed = 1; seed <= antal; seed++) ud.push(lavOpgave(ovelse, niveau, seed, p));
    }
  }
  return ud;
}

const sp = (o: ModspilOpgave) => o.sporgsmaal as unknown as { variant?: string; onske?: unknown };
const navn = (o: ModspilOpgave) => `${o.ovelse}, niveau ${o.niveau}, seed ${o.seed}, ${JSON.stringify(o.profil.valg)}`;

describe('Øvelserne og niveauerne', () => {
  it('syv øvelser i specens orden med deres første niveau', () => {
    expect([...OVELSER]).toEqual(['point', 'regel11', 'laengde', 'markering', 'vaelg-kort', 'afkast', 'forsinket']);
    expect({ ...FOERSTE_NIVEAU }).toEqual({ point: 1, regel11: 1, laengde: 1, markering: 2, 'vaelg-kort': 2, afkast: 3, forsinket: 3 });
  });

  it('øvelser, der ikke findes i den valgte metode, springes over: forsinket kald med "intet"', () => {
    for (const [id, p] of PROFILER) {
      for (const ovelse of OVELSER) expect(harOvelse(ovelse, p), `${id}: ${ovelse}`).toBe(ovelse !== 'forsinket' || id === 'kompendiet');
    }
    expect(() => lavOpgave('forsinket', 3, 1, profil('standard'))).toThrow();
    expect(() => lavOpgave('markering', 1, 1, profil('standard'))).toThrow();
    expect(() => lavOpgave('afkast', 2, 1, profil('kompendiet'))).toThrow();
  });
});

describe('Opgaverne (Løser, generator og facit punkt 1–5)', () => {
  let alle: ModspilOpgave[] = [];
  beforeAll(() => {
    alle = udsnit(12);
  }, 120_000);

  it('opgaven har øvelsen, niveauet, seedet, profilen, pladsen, fire hænder og de spillede kort fra de rigtige hænder', { timeout: 120_000 }, () => {
    expect(alle.length).toBeGreaterThan(600);
    for (const o of alle) {
      const n = navn(o);
      expect(['W', 'E'], n).toContain(o.plads);
      if (['point', 'regel11', 'laengde', 'vaelg-kort'].includes(o.ovelse)) expect(o.plads, n).toBe('E');
      if (o.ovelse === 'markering') expect(o.plads, n).toBe('W');
      const kort = SEATS.flatMap((s) => o.haender[s]);
      expect(SEATS.map((s) => o.haender[s].length), n).toEqual([13, 13, 13, 13]);
      expect(new Set(kort).size, n).toBe(52);
      expect(['3NT', '4H', '4S'], n).toContain(o.kontrakt);
      expect([0, 1, 2, 3], n).toContain(o.farve);
      expect(new Set(o.spillet.map((k) => k.kort)).size, n).toBe(o.spillet.length);
      for (const k of o.spillet) expect(o.haender[k.plads], `${n}: ${k.plads} ${k.kort}`).toContain(k.kort);
      const pladser = o.spillet.map((k) => k.plads).join();
      if (o.ovelse === 'regel11' || o.ovelse === 'laengde') expect(pladser, n).toBe('W');
      if (o.ovelse === 'markering') expect(pladser, n).toBe('W,N,E');
      if (o.ovelse === 'vaelg-kort') expect(pladser, n).toBe('W,N');
      if (['regel11', 'laengde', 'markering', 'vaelg-kort'].includes(o.ovelse)) expect(farveAf(o.spillet[0].kort), n).toBe(o.farve);
    }
  });

  it('facit har øvelsens form, og niveau 1–2 har kun klare tilfælde', { timeout: 120_000 }, () => {
    for (const o of alle) {
      const n = navn(o);
      expect(FACITTYPER[o.ovelse], n).toContain(o.facit.type);
      if (o.niveau <= 2) expect(UKLAR.has(o.facit.type), n).toBe(false);
      if (o.ovelse === 'afkast') expect(o.facit.type, n).toBe(sp(o).variant === 'aflaes' ? 'signal' : 'kort');
      if (o.ovelse === 'forsinket') expect(o.facit.type, n).toBe(sp(o).variant === 'aflaes' ? 'forsinket' : 'kort');
      if (o.ovelse === 'vaelg-kort') expect(['kald', 'afvisning', 'skift-lav', 'skift-hoej'], n).toContain(sp(o).onske);
      if ((o.ovelse === 'afkast' || o.ovelse === 'forsinket') && sp(o).variant === 'vaelg') {
        expect(o.ovelse === 'afkast' ? [0, 1, 2, 3].filter((f) => f !== o.farve) : ['passiv', 'aktiv'], n).toContain(sp(o).onske);
      }
      if (o.facit.type === 'kort') {
        expect(o.facit.kort.length, n).toBeGreaterThan(0);
        expect([...o.facit.kort], n).toEqual([...o.facit.kort].sort((a, b) => a - b));
      }
    }
  });

  it('begge varianter af første afkast og forsinket kald findes, og Kompendiets markering har romersk kald, lavt = kald og længde', { timeout: 60_000 }, () => {
    const varianter = new Set(alle.filter((o) => o.ovelse === 'afkast' || o.ovelse === 'forsinket').map((o) => `${o.ovelse} ${sp(o).variant}`));
    expect([...varianter].sort()).toEqual(['afkast aflaes', 'afkast vaelg', 'forsinket aflaes', 'forsinket vaelg']);
    const kompendiet = profil('kompendiet');
    const metoder = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) metoder.add(lavOpgave('markering', (2 + (seed % 4)) as Niveau, seed, kompendiet).metode!.id);
    expect([...metoder].sort()).toEqual(['lavt-hoejt-lige', 'lavt-kald', 'romersk-kald']);
  });

  it('regel 11 og 12: på niveau 1–3 er udspillet fra en farve med honnør, og fra niveau 4 spørges også om hvilke kort', { timeout: 60_000 }, () => {
    const kontrakter = new Set<string>();
    for (const o of alle) {
      if (o.ovelse !== 'regel11') {
        expect(o.hvilke, navn(o)).toBeUndefined();
        continue;
      }
      kontrakter.add(o.kontrakt);
      const vest = o.haender.W.filter((k) => farveAf(k) === o.farve).map(vaerdi);
      if (o.niveau <= 3) expect(vest.some((v) => v >= 11), navn(o)).toBe(true);
      expect(o.hvilke !== undefined, navn(o)).toBe(o.niveau >= 4);
      if (o.hvilke) expect(['kort', 'kan-ikke-afgoeres'], navn(o)).toContain(o.hvilke.type);
    }
    expect(kontrakter.has('3NT')).toBe(true);
    expect(kontrakter.has('4H') || kontrakter.has('4S')).toBe(true);
  });

  it('hp-intervallerne bruges i øvelse 1 og fra niveau 4 i øvelse 2 og 3', { timeout: 60_000 }, () => {
    for (const o of alle) {
      const forventet = o.ovelse === 'point' || ((o.ovelse === 'regel11' || o.ovelse === 'laengde') && o.niveau >= 4);
      expect(o.brugerHp, navn(o)).toBe(forventet);
    }
  });

  it('forklaringen findes på dansk og engelsk, nævner metoden og består sprog-tjekket (punkt 5)', { timeout: 60_000 }, () => {
    const fejl: string[] = [];
    for (const o of alle) {
      const { da, en } = o.forklaring;
      if (!da?.trim() || !en?.trim()) fejl.push(`${navn(o)}: tom forklaring`);
      fejl.push(...fund(da).map((f) => `${navn(o)}: "${f.word}" (husets ord: ${f.house})`));
      fejl.push(...bydeform(da).map((b) => `${navn(o)}: bydeform "${b}"`));
      if (o.ovelse === 'point') {
        if (o.metode !== undefined) fejl.push(`${navn(o)}: øvelse 1 har ingen metode`);
        continue;
      }
      if (!o.metode) {
        fejl.push(`${navn(o)}: metoden mangler`);
        continue;
      }
      const m = metode(o.metode.kategori, o.metode.id);
      if (!da.toLowerCase().includes(m.tekst.toLowerCase())) fejl.push(`${navn(o)}: "${da}" nævner ikke "${m.tekst}"`);
      if (!en.toLowerCase().includes(m.tekstEn.toLowerCase())) fejl.push(`${navn(o)}: "${en}" nævner ikke "${m.tekstEn}"`);
    }
    expect(fejl.slice(0, 20)).toEqual([]);
  });
});

describe('Genskabelse (accepttest 8)', () => {
  it('samme seed giver samme opgave og facit, også når andre opgaver er lavet imellem', { timeout: 60_000 }, () => {
    for (const [, p] of PROFILER) {
      for (const ovelse of OVELSER) {
        if (!harOvelse(ovelse, p)) continue;
        for (const niveau of niveauerFor(ovelse)) {
          for (let seed = 1; seed <= 8; seed++) {
            const a = lavOpgave(ovelse, niveau, seed, p);
            lavOpgave(ovelse, niveau, seed + 1000, p);
            lavNiveauOpgave(niveau, seed + 2000, p);
            expect(lavOpgave(ovelse, niveau, seed, p), `${ovelse}, niveau ${niveau}, seed ${seed}`).toEqual(a);
          }
        }
      }
      for (const niveau of NIVEAUER) for (let seed = 1; seed <= 20; seed++) expect(lavNiveauOpgave(niveau, seed, p)).toEqual(lavNiveauOpgave(niveau, seed, p));
    }
  });
});

describe('Andelen af "kan ikke afgøres" (accepttest 9)', () => {
  it('fra niveau 3 ligger andelen mellem 15 og 25 % over 2.000 opgaver for hver profil', { timeout: 180_000 }, () => {
    for (const [id, p] of PROFILER) {
      let uklare = 0;
      for (let seed = 1; seed <= 2000; seed++) {
        const niveau = (3 + (seed % 3)) as Niveau;
        const o = lavNiveauOpgave(niveau, seed, p);
        expect(o.niveau).toBe(niveau);
        expect(harOvelse(o.ovelse, p), `${id}: ${o.ovelse}`).toBe(true);
        expect(o.niveau).toBeGreaterThanOrEqual(FOERSTE_NIVEAU[o.ovelse]);
        if (UKLAR.has(o.facit.type)) uklare++;
      }
      const andel = uklare / 2000;
      expect(andel, `${id}: ${(andel * 100).toFixed(1)} %`).toBeGreaterThanOrEqual(0.15);
      expect(andel, `${id}: ${(andel * 100).toFixed(1)} %`).toBeLessThanOrEqual(0.25);
    }
  });
});
