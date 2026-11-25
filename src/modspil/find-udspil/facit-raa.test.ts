import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Card } from '../../domain/cards';
import { udspilFacit } from '../model/findUdspil';
import type { SituationId, UdspilFacit } from '../model/findUdspil';
import type { Profil } from '../model/metoder';
import type { AppData, Raa, RaaOpgave, Situation, Situationsfil, Udvalg } from '../udspil/hjaelp';

/*
 * Accepttest 3 i SPEC-modspil-v2.md, trin 2: facit mod de rå data. For alle 1200 opgaver og alle tre profiler regner
 * testen facit direkte fra tools/udspil/raa/<id>.json (stikkene pr. kort og fordeling) og sammenligner med modellens
 * `udspilFacit`, der regner fra appens datasæt.
 *
 * Uafhængig: testen importerer kun typer fra projektet og den ene funktion, den sammenligner med (det tjekkes i den
 * første test). Udspilsreglen, ALA-tabellen og Kompendiets råd står her for sig selv, og profilerne, situationerne og
 * de rå data læses som JSON. Reglerne er de samme som i bruteforce.ts (v1) og metoder.json:
 *
 * - Lavt kort (Vests kort i farven faldende, h): fra singleton og doubleton det højeste. 4.-højeste: h[3] fra fire kort
 *   eller flere, fra tre kort det laveste med en honnør (B eller højere) og ellers det højeste. 3. og 5. højeste: h[4]
 *   fra fem kort eller flere, ellers h[2]. Kompendiets mod sans: småkort (højst en 9'er) det tredje laveste, fra en tier
 *   h[1], fra en honnør h[3] fra fire kort eller flere og h[2] fra tre.
 * - Honnørsekvens: to øverste i træk med toppen B eller højere (to), tre øverste i træk med toppen 10 eller højere
 *   (tre), brudt: to, hvor tredje kort er tre under toppen (K D 10). Mod farve giver to eller tre toppen (begge
 *   honnørmetoder). Mod sans, top af sekvens: tre eller brudt giver toppen. Mod sans, ALA: tabellen i metoder.json.
 *   Ellers giver to "table feeling" (toppen eller det lave kort) fra tre kort eller flere og toppen fra doubleton.
 * - Farvens værdi: middelstikket i hundrededele, round(100 × sum / n) halvt op som generatoren, for det bedste af
 *   profilens kort; chancen er antallet af fordelinger, hvor modspillet tager mindst 8 − niveau stik med det kort (står
 *   to kort lige, det højeste antal). Rigtige farver: under 10 hundrededele fra den bedste. Klar: forspring mindst 20
 *   hundrededele. Afviger: klar, og den bedste farve er ikke blandt rådets.
 * - Kompendiets råd: reglerne i situationsfilen prøves i rækkefølge, og den første, der gælder og giver mindst én farve,
 *   Vest har kort i, er rådet (som trin 1's hjaelp.ts).
 */

const ROD = `${resolve(dirname(fileURLToPath(import.meta.url)), '../../..')}/`;
const json = <T>(sti: string): T => JSON.parse(readFileSync(ROD + sti, 'utf8')) as T;

const SITUATIONER = json<Situationsfil>('src/modspil/content/udspil/situationer.json').situationer;
const PROFILER: Profil[] = json<{ profiler: { id: string; valg: Record<string, string> }[] }>('src/modspil/content/metoder.json').profiler.map((p) => ({
  id: p.id,
  valg: { ...p.valg } as unknown as Profil['valg'],
}));

type Art = 'sans' | 'farve';
const faldende = (xs: readonly number[]) => [...xs].sort((a, b) => b - a);
const stigende = (xs: readonly number[]) => [...xs].sort((a, b) => a - b);
const farveAf = (c: Card) => Math.floor(c / 13);
const vaerdiAf = (c: Card) => (c % 13) + 2;

// ---------------------------------------------------------------- udspilsreglen

function lavtKort(h: readonly number[], metode: string): number {
  const n = h.length;
  if (n <= 2) return h[0];
  switch (metode) {
    case 'fjerde-hoejeste':
      return n >= 4 ? h[3] : h[0] >= 11 ? h[n - 1] : h[0];
    case 'tredje-femte':
      return n >= 5 ? h[4] : h[2];
    case 'kompendiets':
      return h[0] <= 9 ? h[n - 3] : h[0] === 10 ? h[1] : n >= 4 ? h[3] : h[2];
  }
  throw new Error(`ukendt udspilsmetode ${metode}`);
}

/** ALA-tabellen mod sans (metoder.json); null, når tabellen ikke afgør det. */
function ala(h: readonly number[]): number | null {
  const [a, b, c, d] = h;
  const n = h.length;
  if (a === 14 && b === 13) {
    if (c === 12) return 14;
    if (c === 11 && d === 10) return 13;
    if (n >= 5) return 13;
    if (n === 4) return 14;
    return null;
  }
  if (a === 13 && b === 12) {
    if (c === 11) return 13;
    if (c === 10 && d === 9) return 13;
    if (n >= 4) return 12;
    return null;
  }
  if (a === 12 && b === 11 && (c === 10 || c === 9)) return 12;
  if (a === 11 && b === 10 && c === 9) return 11;
  if (a === 10 && b === 9 && c === 8) return 10;
  return null;
}

/** Profilens kort (valører) fra Vests kort i farven. */
function profilensKort(holding: readonly number[], art: Art, valg: Readonly<Record<string, string>>): number[] {
  const h = faldende(holding);
  const n = h.length;
  const lav = lavtKort(h, valg[art === 'sans' ? 'udspil-sans' : 'udspil-farve']);
  const to = n >= 2 && h[0] >= 11 && h[1] === h[0] - 1;
  const tre = n >= 3 && h[0] >= 10 && h[1] === h[0] - 1 && h[2] === h[0] - 2;
  const brudt = to && n >= 3 && h[2] === h[0] - 3;
  if (art === 'farve') return to || tre ? [h[0]] : [lav];
  if (valg.honnoerudspil === 'ala-mod-sans') {
    const kort = ala(h);
    if (kort !== null) return [kort];
  } else if (tre || brudt) return [h[0]];
  if (to) return n === 2 || lav === h[0] ? [h[0]] : [h[0], lav];
  return [lav];
}

// ---------------------------------------------------------------- Kompendiets råd

const nr = (f: string) => 'SHDC'.indexOf(f);

function raad(vest: readonly Card[], regler: readonly Udvalg[]): number[] {
  const valoerer = (f: number) => faldende(vest.filter((c) => farveAf(c) === f).map(vaerdiAf));
  const laengde = (f: number) => valoerer(f).length;
  const tal = (x: Partial<Record<string, number>> = {}) => Object.entries(x).map(([f, n]) => [nr(f), n as number] as const);
  for (const r of regler) {
    if (r.hvis) {
      if (tal(r.hvis.min).some(([f, n]) => laengde(f) < n)) continue;
      if (tal(r.hvis.max).some(([f, n]) => laengde(f) > n)) continue;
      if (r.hvis.dybSekvens) {
        const v = valoerer(nr(r.hvis.dybSekvens));
        if (!(v.length >= 5 && v[0] >= 11 && v[0] - v[3] === 3)) continue;
      }
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
        ud = har.filter((f) => valoerer(f).every((v) => v < 11));
        break;
      case 'staerkSekvens':
        ud = har.filter((f) => {
          const v = valoerer(f);
          return v.length >= 3 && v[0] >= 11 && v[0] - v[1] === 1 && (v[1] - v[2] === 1 || v[1] - v[2] === 2);
        });
        break;
    }
    if (ud.length > 0) return stigende(ud);
  }
  return [];
}

// ---------------------------------------------------------------- facit fra de rå data

/** Facit med middelstik og forspring i hundrededele. */
interface Forventet {
  tabel: { farve: number; kort: Card[]; middel: number; saet: number }[];
  farver: number[];
  kort: Card[];
  forspring: number;
  klar: boolean;
  raad: number[];
  afviger: boolean;
  fordelinger: number;
}

function forventet(s: Situation, o: RaaOpgave, p: Profil): Forventet {
  const art: Art = s.kontrakt.endsWith('NT') ? 'sans' : 'farve';
  const maal = 8 - Number(s.kontrakt[0]);
  const n = o.stik.length;
  const vest = stigende(o.vest);
  const middel = vest.map((_, j) => Math.floor((200 * o.stik.reduce((t, r) => t + r[j], 0) + n) / (2 * n)));
  const saet = vest.map((_, j) => o.stik.filter((r) => r[j] >= maal).length);
  const tabel: Forventet['tabel'] = [];
  for (let f = 0; f < 4; f++) {
    const holding = vest.filter((c) => farveAf(c) === f).map(vaerdiAf);
    if (holding.length === 0) continue;
    const kort = stigende(profilensKort(holding, art, p.valg).map((v) => f * 13 + v - 2));
    const j = kort.map((c) => vest.indexOf(c));
    const bedst = Math.max(...j.map((i) => middel[i]));
    tabel.push({ farve: f, kort, middel: bedst, saet: Math.max(...j.filter((i) => middel[i] === bedst).map((i) => saet[i])) });
  }
  const top = Math.max(...tabel.map((r) => r.middel));
  const farver = tabel.filter((r) => top - r.middel < 10).map((r) => r.farve);
  const vaerdier = faldende(tabel.map((r) => r.middel));
  const forspring = vaerdier.length > 1 ? vaerdier[0] - vaerdier[1] : Infinity;
  const klar = forspring >= 20;
  const r = raad(vest, s.kompendieraad.regler);
  const bedste = tabel.find((x) => x.middel === top)!.farve;
  return {
    tabel,
    farver,
    kort: stigende(tabel.filter((x) => farver.includes(x.farve)).flatMap((x) => x.kort)),
    forspring,
    klar,
    raad: r,
    afviger: klar && !r.includes(bedste),
    fordelinger: n,
  };
}

/** Modellens facit i samme form (middelstik og forspring i hundrededele; andre felter tæller ikke). */
const somForventet = (f: UdspilFacit): Forventet => ({
  tabel: f.tabel.map((r) => ({ farve: r.farve, kort: [...r.kort], middel: Math.round(r.middel * 100), saet: r.saet })),
  farver: [...f.farver],
  kort: [...f.kort],
  forspring: Math.round(f.forspring * 100),
  klar: f.klar,
  raad: [...f.raad],
  afviger: f.afviger,
  fordelinger: f.fordelinger,
});

const RAA = new Map(SITUATIONER.map((s) => [s.id, json<Raa>(`tools/udspil/raa/${s.id}.json`)]));
const APP = new Map(SITUATIONER.map((s) => [s.id, json<AppData>(`src/modspil/content/udspil/${s.id}.json`)]));
const TUNG = { timeout: 120_000 };

describe('Facit mod de rå data (accepttest 3)', () => {
  it('testen importerer kun typer fra projektet og den funktion, den sammenligner med', () => {
    const kilde = readFileSync(fileURLToPath(import.meta.url), 'utf8');
    const vaerdier = [...kilde.matchAll(/^import\s+(?!type\s)([\s\S]*?)\s+from\s+'([^']+)';/gm)].map((m) => `${m[1].replace(/\s+/g, ' ')} from ${m[2]}`);
    expect(vaerdier).toEqual([
      '{ readFileSync } from node:fs',
      '{ dirname, resolve } from node:path',
      '{ fileURLToPath } from node:url',
      '{ describe, expect, it } from vitest',
      '{ udspilFacit } from ../model/findUdspil',
    ]);
  });

  it('den uafhængige gennemregning giver trin 1\'s rapporttal for profilen Standard (Afklaret, session 1b, tredje forsøg)', TUNG, () => {
    const standard = PROFILER.find((p) => p.id === 'standard')!;
    const klare: number[] = [];
    const udenRaad: number[] = [];
    for (const s of SITUATIONER) {
      const opgaver = RAA.get(s.id)!.opgaver;
      expect(opgaver, s.id).toHaveLength(150);
      const facit = opgaver.map((o) => forventet(s, o, standard));
      klare.push(facit.filter((f) => f.klar).length);
      udenRaad.push(facit.filter((f) => f.raad.length === 0).length);
    }
    expect(klare).toEqual([31, 20, 17, 15, 20, 38, 102, 21]);
    expect(udenRaad).toEqual([0, 0, 0, 0, 0, 1, 3, 0]);
  });

});

describe.each(SITUATIONER.map((s) => [s.id, s] as const))('Facit mod de rå data (accepttest 3): %s', (id, s) => {
  it('modellens facit er lig gennemregningen for alle 150 opgaver og alle tre profiler', TUNG, () => {
    const raa = RAA.get(id)!;
    const app = APP.get(id)!;
    expect(app.opgaver.map((o) => o.seed)).toEqual(raa.opgaver.map((o) => o.seed));
    const fejl: string[] = [];
    for (const p of PROFILER) {
      raa.opgaver.forEach((o, i) => {
        const a = forventet(s, o, p);
        const b = somForventet(udspilFacit(id as SituationId, app.opgaver[i], p));
        if (JSON.stringify(a) !== JSON.stringify(b)) fejl.push(`${p.id}, opgave ${i} (seed ${o.seed}): forventet ${JSON.stringify(a)}, fik ${JSON.stringify(b)}`);
      });
    }
    expect(fejl.slice(0, 5)).toEqual([]);
    expect(fejl).toHaveLength(0);
  });
});
