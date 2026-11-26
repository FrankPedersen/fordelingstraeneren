import { existsSync, readFileSync } from 'node:fs';
import { suitLengths, type Card } from '../../domain/cards';
import type { Hands, Seat } from '../../domain/dealer';
import { mulberry32, shuffle } from '../../engine/rng';
import { chooseCall, hasStopper, hcpOf, satisfies, theirSuit } from '../../system/interpreter';
import { ROOT } from '../../sprog/danskTekst';
import { profil } from '../model/metoder';
import { muligeUdspil, type Kontraktart } from '../model/udspil';

/*
 * Fælles kode til accepttestene for Modspil v2, trin 1 (SPEC-modspil-v2.md, Kontrollen). Kun til testene: kravene
 * kontrolleres her med egen kode og interpreter.ts, uafhængigt af Pythons generator i tools/udspil/.
 */

export type Farve = 'S' | 'H' | 'D' | 'C';
export const FARVER: readonly Farve[] = ['S', 'H', 'D', 'C'];
const FARVE_NR: Record<Farve, number> = { S: 0, H: 1, D: 2, C: 3 };

/**
 * Varianternes krav (SPEC-udspilsraad.md, Varianterne): mindst én farve blandt `blandt` har en længde og et antal
 * honnører (E, K, D, B) i intervallerne. Hvert element i `farveMed` skal opfyldes, gerne af forskellige farver.
 */
export interface FarveMed {
  blandt: Farve[];
  laengde: [number, number];
  honnoerer: [number, number];
}

/** Et krav til en hånd; alle felter skal være opfyldt (se tools/udspil/krav.py). */
export interface Krav {
  hp?: [number, number];
  min?: Partial<Record<Farve, number>>;
  max?: Partial<Record<Farve, number>>;
  praecis?: Partial<Record<Farve, number>>;
  jaevn?: true;
  system?: string;
  stop?: Farve;
  pas?: string;
  enAf?: Krav[];
  /** Varianternes ekstra krav til Vest (SPEC-udspilsraad.md). */
  farveMed?: FarveMed[];
  /** En farve blandt `blandt` med mindst `min` kort og "table feeling" mod sans i profilen Standard (`tableFeeling`). */
  tableFeeling?: { blandt: Farve[]; min: number };
}

export interface Udvalg {
  udvalg: 'farver' | 'korteste' | 'laengde' | 'udenHonnoer' | 'staerkSekvens';
  blandt: Farve[];
  laengde?: number;
  hvis?: { min?: Partial<Record<Farve, number>>; max?: Partial<Record<Farve, number>>; dybSekvens?: Farve };
}

export interface Situation {
  id: string;
  navn: string;
  navnEn: string;
  seed: number;
  giver: Seat;
  meldinger: string[];
  kontrakt: string;
  spilfoerer: Seat;
  sider: number[];
  krav: Record<Seat, Krav>;
  kompendieraad: { tekst: string; tekstEn: string; regler: Udvalg[] };
  eksempler: { haand: string; seed: number }[];
}

export interface Situationsfil {
  version: number;
  kilde: string;
  opgaver: number;
  fordelinger: number;
  situationer: Situation[];
}

export const SITUATIONSFIL = 'src/modspil/content/udspil/situationer.json';
export const situationsfil = (): Situationsfil => JSON.parse(readFileSync(ROOT + SITUATIONSFIL, 'utf8'));

/** Rådata fra generatoren (tools/udspil/raa/<id>.json). */
export interface RaaOpgave {
  seed: number;
  vest: Card[];
  forsoeg: number;
  fordelinger: number[];
  stik: number[][];
  haand?: string;
}
export interface Raa {
  id: string;
  generator: number;
  endplay: string;
  dato: string;
  fordelinger: number;
  kontrakt: string;
  opgaver: RaaOpgave[];
  eksempler: RaaOpgave[];
}

/** Appens data (src/modspil/content/udspil/<id>.json). */
export interface AppOpgave {
  seed: number;
  vest: Card[];
  middel: number[];
  saet: number[];
  haand?: string;
}
export interface AppData extends Omit<Raa, 'opgaver' | 'eksempler'> {
  opgaver: AppOpgave[];
  eksempler: AppOpgave[];
}

export const raaSti = (id: string) => `tools/udspil/raa/${id}.json`;
export const appSti = (id: string) => `src/modspil/content/udspil/${id}.json`;

/** En variant (SPEC-udspilsraad.md, `tools/udspil/varianter.json`): en situation med et ekstra krav til Vest og sit eget seed. */
export interface Variant {
  id: string;
  situation: string;
  seed: number;
  ekstra: Krav;
}

export interface Variantfil {
  version: number;
  kilde: string;
  /** Hænder pr. variant. */
  opgaver: number;
  varianter: Variant[];
}

export const VARIANTFIL = 'tools/udspil/varianter.json';
export const variantfil = (): Variantfil => JSON.parse(readFileSync(ROOT + VARIANTFIL, 'utf8'));

/** Variantens rådata: samme format som situationernes plus variantens id og ekstra krav (`generer.py --variant`). */
export interface VariantRaa extends Raa {
  variant: string;
  ekstra: Krav;
}
export const variantSti = (id: string) => `tools/udspil/raa/varianter/${id}.json`;

/** Variantens krav til de fire hænder: situationens krav, og Vests krav udvidet med det ekstra krav. */
export function variantKrav(s: Situation, v: Variant): Record<Seat, Krav> {
  return { ...s.krav, W: { ...s.krav.W, ...v.ekstra } };
}

/** En datafil, eller en fejl, der siger, at generatoren ikke har kørt endnu. */
export function laes<T>(sti: string): T {
  if (!existsSync(ROOT + sti)) throw new Error(`${sti} findes ikke endnu: generatoren har ikke kørt (python tools/udspil/generer.py).`);
  return JSON.parse(readFileSync(ROOT + sti, 'utf8')) as T;
}

/** Kontraktens benævnelse og modspillets stik for at sætte den, fx 3NT → NT og 4. */
export function maal(kontrakt: string): { benaevnelse: string; saet: number } {
  return { benaevnelse: kontrakt.slice(1), saet: 8 - Number(kontrakt[0]) };
}

export const art = (kontrakt: string): Kontraktart => (kontrakt.endsWith('NT') ? 'sans' : 'farve');

/** En fordeling: de 39 kort, Vest ikke har, i stigende orden blandes med appens shuffle og gives til N, Ø og S. */
export function fordeling(vest: readonly Card[], seed: number): Hands {
  const vests = new Set(vest);
  const resten = shuffle(
    Array.from({ length: 52 }, (_, c) => c).filter((c) => !vests.has(c)),
    mulberry32(seed),
  );
  return { N: resten.slice(0, 13), E: resten.slice(13, 26), S: resten.slice(26, 39), W: [...vest].sort((a, b) => a - b) };
}

const laengde = (haand: readonly Card[], f: Farve) => suitLengths(haand)[FARVE_NR[f]];
const tal = (c: Partial<Record<Farve, number>> = {}) => Object.entries(c) as [Farve, number][];

/** Opfylder hånden kravet? Egen kode med interpreter.ts (chooseCall, hasStopper, hcpOf, satisfies). */
export function opfyldt(haand: readonly Card[], krav: Krav): boolean {
  const hp = hcpOf(haand);
  const l = suitLengths(haand);
  if (krav.hp && (hp < krav.hp[0] || hp > krav.hp[1])) return false;
  if (tal(krav.min).some(([f, n]) => laengde(haand, f) < n)) return false;
  if (tal(krav.max).some(([f, n]) => laengde(haand, f) > n)) return false;
  if (tal(krav.praecis).some(([f, n]) => laengde(haand, f) !== n)) return false;
  if (krav.jaevn && !satisfies({ balanced: true }, l)) return false;
  if (krav.system !== undefined && chooseCall('opening', haand)?.call !== krav.system) return false;
  if (krav.stop && !hasStopper(haand, FARVE_NR[krav.stop])) return false;
  if (krav.pas !== undefined) {
    if (hp >= 16 || (hp >= 8 && Math.max(...l) >= 5)) return false;
    if (chooseCall(krav.pas, haand, theirSuit(krav.pas)) !== null) return false;
  }
  if (krav.enAf && !krav.enAf.some((k) => opfyldt(haand, k))) return false;
  if (krav.farveMed && !krav.farveMed.every((e) => e.blandt.some((f) => farvePasser(valoerer(haand, f), e)))) return false;
  const tf = krav.tableFeeling;
  if (tf && !tf.blandt.some((f) => valoerer(haand, f).length >= tf.min && tableFeeling(valoerer(haand, f)))) return false;
  return true;
}

const iInterval = (x: number, [lo, hi]: readonly [number, number]) => x >= lo && x <= hi;

/** Passer farvens valører med længden og antallet af honnører (E, K, D, B) i `farveMed`-elementet? */
function farvePasser(v: readonly number[], e: FarveMed): boolean {
  return iInterval(v.length, e.laengde) && iInterval(v.filter((x) => x >= HONNOER).length, e.honnoerer);
}

/**
 * "Table feeling" mod sans i profilen Standard (SPEC-udspilsraad.md, Varianterne): appens udspilsregel (`muligeUdspil`)
 * giver to kort, toppen og det lave kort, og de to øverste kort er honnører (E K, K D eller D B; ikke B 10, fordi
 * honnørerne her er E, K, D og B). Valørerne er 2–14 i vilkårlig orden.
 */
export function tableFeeling(v: readonly number[]): boolean {
  const kort = muligeUdspil(v, 'sans', profil('standard'));
  const anden = [...v].sort((a, b) => b - a)[1];
  return kort.length === 2 && anden >= HONNOER;
}

export const alleOpfyldt = (h: Hands, krav: Record<Seat, Krav>, pladser: readonly Seat[] = ['N', 'E', 'S', 'W']) =>
  pladser.every((p) => opfyldt(h[p], krav[p]));

const RANKS = '23456789TJQKA';

/** Kortene fra en PBN-hånd som "KQT9.QT98.973.75" (♠.♥.♦.♣), stigende. */
export function fraPbn(tekst: string): Card[] {
  const farver = tekst.split('.');
  if (farver.length !== 4) throw new Error(`Ikke en PBN-hånd: ${tekst}`);
  return farver.flatMap((f, s) => [...f].map((r) => s * 13 + RANKS.indexOf(r))).sort((a, b) => a - b);
}

/** Valørerne 2–14 i farven. */
export const valoerer = (haand: readonly Card[], f: Farve) => haand.filter((c) => Math.floor(c / 13) === FARVE_NR[f]).map((c) => (c % 13) + 2);
/** Den laveste honnør (B = 11); honnørerne er E, K, D og B. */
export const HONNOER = 11;

/** Tre øverste kort i sekvens eller brudt sekvens (E K B, K D 10 …) med toppen mindst B. */
function staerkSekvens(v: number[]): boolean {
  const [a, b, c] = [...v].sort((x, y) => y - x);
  return v.length >= 3 && a >= HONNOER && a - b === 1 && (b - c === 1 || b - c === 2);
}

/** Mindst fem kort, og de fire øverste står i træk med toppen mindst B (fx D B 10 9 3). */
function dybSekvens(v: number[]): boolean {
  const s = [...v].sort((x, y) => y - x);
  return s.length >= 5 && s[0] >= HONNOER && s[0] - s[3] === 3;
}

/** Farverne, Kompendiets råd peger på for Vests hånd: den første regel, der gælder og giver mindst én farve. */
export function kompendieraad(haand: readonly Card[], regler: readonly Udvalg[]): Farve[] {
  for (const r of regler) {
    const h = r.hvis;
    if (h) {
      if (tal(h.min).some(([f, n]) => laengde(haand, f) < n)) continue;
      if (tal(h.max).some(([f, n]) => laengde(haand, f) > n)) continue;
      if (h.dybSekvens && !dybSekvens(valoerer(haand, h.dybSekvens))) continue;
    }
    const har = r.blandt.filter((f) => laengde(haand, f) > 0);
    let ud: Farve[];
    switch (r.udvalg) {
      case 'farver':
        ud = har;
        break;
      case 'korteste': {
        const mindst = Math.min(...har.map((f) => laengde(haand, f)));
        ud = har.filter((f) => laengde(haand, f) === mindst);
        break;
      }
      case 'laengde':
        ud = har.filter((f) => laengde(haand, f) === r.laengde);
        break;
      case 'udenHonnoer':
        ud = har.filter((f) => valoerer(haand, f).every((v) => v < HONNOER));
        break;
      case 'staerkSekvens':
        ud = har.filter((f) => staerkSekvens(valoerer(haand, f)));
        break;
    }
    if (ud.length > 0) return ud;
  }
  return [];
}

/**
 * Farvernes værdi i profilen Standard: middelstikket for det kort, udspilsreglen giver; ved "table feeling" det bedste
 * af de to kort (SPEC-modspil-v2.md, trin 2, Farvens værdi).
 */
export function farvevaerdier(vest: readonly Card[], middel: readonly number[], kontrakt: string): Partial<Record<Farve, number>> {
  const sorteret = [...vest].sort((a, b) => a - b);
  const ud: Partial<Record<Farve, number>> = {};
  for (const f of FARVER) {
    const v = valoerer(sorteret, f);
    if (v.length === 0) continue;
    const kort = muligeUdspil(v, art(kontrakt), profil('standard'));
    ud[f] = Math.max(...kort.map((valoer) => middel[sorteret.indexOf(FARVE_NR[f] * 13 + valoer - 2)]));
  }
  return ud;
}

/** De bedste farver: under 0,1 stik fra den bedste (Franks svar 4). */
export function bedsteFarver(vaerdier: Partial<Record<Farve, number>>): Farve[] {
  const max = Math.max(...Object.values(vaerdier));
  return FARVER.filter((f) => vaerdier[f] !== undefined && (vaerdier[f] as number) > max - 0.1 + 1e-9);
}

/** Middelstikket i hundrededele, rundet halvt op med heltal som i generatoren: round(100 × sum / n). */
export const middelHundrededele = (kolonne: readonly number[]) => Math.floor((200 * kolonne.reduce((s, x) => s + x, 0) + kolonne.length) / (2 * kolonne.length));
