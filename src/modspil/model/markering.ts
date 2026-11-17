import type { Card } from '../../domain/cards';
import type { Facit, Signal } from './loeser';
import { kanIkkeAfgoeres, tvetydig } from './loeser';
import { gaeldende, regel, type KategoriId, type Kontraktart, type Profil } from './metoder';
import { kontraktart, trumf, type Kontrakt } from './udspil';

/**
 * Markeringerne i Modspil (SPEC-modspil.md, øvelse 4–7, og accepttest 4–5): tilspillet til makkers udspil (kald eller
 * afvisning, romersk kald og længde efter ALA-kongen), første afkast og omvendt forsinket kald. Aflæsningen bruger de
 * kort, brugeren kan se; et kort er lavt, når det er et af de to laveste, Vest ikke kan se.
 */

export interface Tilspil {
  kontrakt: Kontrakt;
  /** Vests valører i farven før udspillet. */
  udspiller: readonly number[];
  /** Vests udspil (en honnør). */
  udspil: number;
  /** Bordets valører i farven før stikket (bordet lægger sit laveste). */
  bord: readonly number[];
  /** Østs kort. */
  tilspil: number;
}

/** Hvad tilspillet viser: kald eller afvisning, romersk kald (mod farve) eller længde (efter ALA-kongen mod sans). */
export type Tilspilsart = 'kald' | 'romersk' | 'laengde';

export function tilspilsart(kontrakt: Kontrakt, udspil: number, profil: Profil): Tilspilsart {
  const art = kontraktart(kontrakt);
  if (regel(profil, 'kald', art).romersk) return 'romersk';
  if (art === 'sans' && udspil === 13 && regel(profil, 'honnoerudspil', art).kongenBederOmLaengde) return 'laengde';
  return 'kald';
}

/** Metoden, der afgør tilspillet. */
export function tilspilsmetode(kontrakt: Kontrakt, udspil: number, profil: Profil): { kategori: KategoriId; id: string } {
  const art = kontraktart(kontrakt);
  return gaeldende(profil, tilspilsart(kontrakt, udspil, profil) === 'laengde' ? 'laengde' : 'kald', art);
}

const erLige = (v: number): boolean => v % 2 === 0;

/** Romersk kald: hvorfor kortet læses, som det gør (til forklaringen). */
export type RomerskGrund = 'laveste-ulige' | 'ulige' | 'hoej-ulige' | 'lille-lige' | 'hoej-lige' | 'singleton-paa-bordet' | 'intet-ulige';

/** Aflæsningen af Østs tilspil i detaljer. */
export interface TilspilsAflaesning {
  facit: Facit;
  metode: { kategori: KategoriId; id: string };
  art: Tilspilsart;
  /** Farvens kort, Vest ikke kan se (Østs kort er med), stigende. */
  usete: number[];
  /** Kortet er et af de to laveste i `usete`. */
  lavt: boolean;
  /** Romersk kald: grunden. */
  grund?: RomerskGrund;
  /** Længden: Østs mulige antal kort og antallet af kort hos Øst og Syd tilsammen. */
  oestsLaengder?: number[];
  skjulte?: number;
}

function romersk(c: number, usete: readonly number[], bordLaengde: number): { facit: Facit; grund: RomerskGrund } {
  const ulige = usete.filter((v) => !erLige(v));
  if (erLige(c)) {
    if (bordLaengde === 1) return { facit: tvetydig(), grund: 'singleton-paa-bordet' };
    if (ulige.length === 0) return { facit: tvetydig(), grund: 'intet-ulige' };
    const lige = usete.filter(erLige);
    return lige.indexOf(c) < 2 ? { facit: { type: 'signal', signal: 'skift-lav' }, grund: 'lille-lige' } : { facit: { type: 'signal', signal: 'skift-hoej' }, grund: 'hoej-lige' };
  }
  if (c === ulige[0]) return { facit: { type: 'signal', signal: 'kald' }, grund: 'laveste-ulige' };
  const toHoejeste = ulige.slice(Math.max(0, ulige.length - 2));
  if (c >= 9 && toHoejeste.includes(c)) return { facit: { type: 'signal', signal: 'skift' }, grund: 'hoej-ulige' };
  return { facit: { type: 'signal', signal: 'kald' }, grund: 'ulige' };
}

export function aflaesTilspilDetaljer(t: Tilspil, profil: Profil): TilspilsAflaesning {
  const synlige = new Set([...t.udspiller, ...t.bord]);
  const usete: number[] = [];
  for (let v = 2; v <= 14; v++) if (!synlige.has(v)) usete.push(v);
  if (!usete.includes(t.tilspil)) throw new Error('Østs kort kan Vest se');
  const lavt = usete.indexOf(t.tilspil) < 2;
  const art = tilspilsart(t.kontrakt, t.udspil, profil);
  const metode = tilspilsmetode(t.kontrakt, t.udspil, profil);
  const kart = kontraktart(t.kontrakt);
  if (art === 'romersk') {
    const { facit, grund } = romersk(t.tilspil, usete, t.bord.length);
    return { facit, metode, art, usete, lavt, grund };
  }
  if (art === 'laengde') {
    const lige = regel(profil, 'laengde', kart).lavtErLige === lavt;
    const skjulte = 13 - t.udspiller.length - t.bord.length;
    const oestsLaengder: number[] = [];
    for (let n = 1; n <= skjulte; n++) if (erLige(n) === lige) oestsLaengder.push(n);
    if (!oestsLaengder.length) throw new Error('Øst kan ikke have det antal kort');
    const syd = oestsLaengder.map((n) => skjulte - n).sort((a, b) => a - b);
    const facit: Facit = syd.length <= 2 ? { type: 'laengder', laengder: syd } : kanIkkeAfgoeres();
    return { facit, metode, art, usete, lavt, oestsLaengder, skjulte };
  }
  const kald = regel(profil, 'kald', kart).hoejtErKald !== lavt;
  return { facit: { type: 'signal', signal: kald ? 'kald' : 'afvisning' }, metode, art, usete, lavt };
}

/** Vests aflæsning af Østs tilspil (øvelse 4): signal, spilførers længder, kan ikke afgøres eller tvetydig. */
export function aflaesTilspil(t: Tilspil, profil: Profil): Facit {
  return aflaesTilspilDetaljer(t, profil).facit;
}

/** Ønskerne, Øst kan vise med sine kort i farven (øvelse 5); tom, når opgaven ikke kan stilles. */
export function muligeOensker(kontrakt: Kontrakt, udspil: number, oest: readonly number[], profil: Profil): Signal[] {
  const art = tilspilsart(kontrakt, udspil, profil);
  if (art === 'laengde') return [];
  if (art === 'romersk') {
    const ud: Signal[] = [];
    if (oest.some((v) => !erLige(v))) ud.push('kald');
    if (oest.some((v) => (erLige(v) && v <= 10) || (!erLige(v) && v >= 9))) ud.push('skift-lav', 'skift-hoej');
    return ud;
  }
  return oest.filter((v) => v <= 10).length >= 2 ? ['kald', 'afvisning'] : [];
}

/** Østs kort, når han vil vise `onske` (øvelse 5). Nødløsningen er Kompendiets høje ulige uden lige kort. */
export function vaelgTilspil(v: { kontrakt: Kontrakt; udspil: number; oest: readonly number[]; onske: Signal }, profil: Profil): number {
  const x = [...v.oest].sort((a, b) => a - b);
  const art = tilspilsart(v.kontrakt, v.udspil, profil);
  if (art === 'laengde') throw new Error('Vælg kortet bruger ikke længdemarkeringen i trin 1');
  if (art === 'romersk') {
    const ulige = x.filter((k) => !erLige(k));
    const lige = x.filter((k) => erLige(k) && k <= 10);
    if (v.onske === 'kald') {
      if (!ulige.length) throw new Error('Øst har intet ulige kort til kald');
      return ulige[0];
    }
    if (v.onske === 'skift-lav' || v.onske === 'skift-hoej') {
      if (lige.length) return v.onske === 'skift-lav' ? lige[0] : lige[lige.length - 1];
      const hoeje = ulige.filter((k) => k >= 9);
      if (!hoeje.length) throw new Error('Øst har intet kort til skift');
      return hoeje[hoeje.length - 1];
    }
    throw new Error(`Romersk kald har ikke ønsket ${v.onske}`);
  }
  if (v.onske !== 'kald' && v.onske !== 'afvisning') throw new Error(`Kald eller afvisning har ikke ønsket ${v.onske}`);
  const smaa = x.filter((k) => k <= 10);
  if (smaa.length < 2) throw new Error('Øst har intet højt kort under B');
  const hoejt = (v.onske === 'kald') === regel(profil, 'kald', kontraktart(v.kontrakt)).hoejtErKald;
  return hoejt ? smaa[smaa.length - 1] : x[0];
}

// ---------------------------------------------------------------- første afkast

/** Et afkast er lavt med 6 eller lavere og højt med 7 eller højere. */
export const LAVT_AFKAST = 6;

/** Hvordan afkastet læses i kontrakten: ulige og lige, retning eller kald og afvisning med høj = kald eller ej. */
export function afkastlaesning(kontrakt: Kontrakt, profil: Profil): { laesning: 'paritet' | 'retning' | 'kald'; viaKald: boolean; hoejtErKald: boolean } {
  const art = kontraktart(kontrakt);
  const a = regel(profil, 'afkast', art).laesning;
  const k = regel(profil, 'kald', art);
  if (a === 'paritet') return { laesning: 'paritet', viaKald: false, hoejtErKald: k.hoejtErKald };
  if (a === 'retning') return { laesning: 'retning', viaKald: false, hoejtErKald: k.hoejtErKald };
  return { laesning: k.romersk ? 'paritet' : 'kald', viaKald: true, hoejtErKald: k.hoejtErKald };
}

function laesAfkast(vaerdi: number, kontrakt: Kontrakt, profil: Profil): Signal {
  const { laesning, hoejtErKald } = afkastlaesning(kontrakt, profil);
  const lavt = vaerdi <= LAVT_AFKAST;
  if (laesning === 'paritet') return !erLige(vaerdi) ? 'kald' : lavt ? 'skift-lav' : 'skift-hoej';
  if (laesning === 'retning') return lavt ? 'skift-lav' : 'skift-hoej';
  return hoejtErKald !== lavt ? 'kald' : 'afvisning';
}

/** Makkers aflæsning af et afkast med valøren `kort`. */
export function aflaesAfkast(kort: number, kontrakt: Kontrakt, profil: Profil): Facit {
  return { type: 'signal', signal: laesAfkast(kort, kontrakt, profil) };
}

/** De to farver, der hverken er spilførers farve eller `farve`: den højeste og den laveste (klør er lavest). */
export function andreFarver(spilfoerersFarve: number, farve: number): { hoej: number; lav: number } {
  const andre = [0, 1, 2, 3].filter((f) => f !== spilfoerersFarve && f !== farve);
  return { hoej: Math.min(...andre), lav: Math.max(...andre) };
}

/** Den farve, et afkast i `farve` beder om, eller null, når det ikke beder om en farve (en afvisning). */
export function afkastetsFarve(signal: Signal, farve: number, spilfoerersFarve: number): number | null {
  if (signal === 'kald') return farve;
  if (signal === 'skift-lav') return andreFarver(spilfoerersFarve, farve).lav;
  if (signal === 'skift-hoej') return andreFarver(spilfoerersFarve, farve).hoej;
  return null;
}

/** Alle afkast (kort under B uden for spilførers farve), makker læser som et kald til farven `onske`, stigende. */
export function vaelgAfkast(v: { kontrakt: Kontrakt; spilfoerersFarve: number; haand: readonly Card[]; onske: number }, profil: Profil): Card[] {
  return v.haand
    .filter((kort) => {
      const farve = Math.floor(kort / 13);
      const vaerdi = (kort % 13) + 2;
      if (farve === v.spilfoerersFarve || vaerdi > 10) return false;
      return afkastetsFarve(laesAfkast(vaerdi, v.kontrakt, profil), farve, v.spilfoerersFarve) === v.onske;
    })
    .sort((a, b) => a - b);
}

// ---------------------------------------------------------------- omvendt forsinket kald

/** Har profilen forsinket kald (omvendt forsinket kald)? */
export function harForsinketKald(profil: Profil): boolean {
  return regel(profil, 'forsinket', 'sans').findes;
}

function kraevForsinket(profil: Profil): void {
  if (!harForsinketKald(profil)) throw new Error('Profilen har ikke omvendt forsinket kald');
}

/** Lav-høj er passivt, høj-lav er aktivt. */
export function aflaesForsinket(foerste: number, anden: number, profil: Profil): Facit {
  kraevForsinket(profil);
  return { type: 'forsinket', vaerdi: foerste < anden ? 'passiv' : 'aktiv' };
}

/** Det første kort: det laveste for passivt og det højeste kort under B for aktivt. */
export function vaelgForsinket(holding: readonly number[], onske: 'passiv' | 'aktiv', profil: Profil): number {
  kraevForsinket(profil);
  const x = [...holding].sort((a, b) => a - b);
  if (x.length < 2) throw new Error('Færre end to kort i farven');
  if (onske === 'passiv') return x[0];
  const smaa = x.filter((k) => k <= 10);
  if (smaa.length < 2) throw new Error('Intet højt kort under B');
  return smaa[smaa.length - 1];
}

/** Trumf og kontraktens art til generatoren og forklaringen. */
export const kontraktInfo = (k: Kontrakt): { art: Kontraktart; trumf: number | null } => ({ art: kontraktart(k), trumf: trumf(k) });
