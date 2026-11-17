import type { Card } from '../domain/cards';
import type { Seat } from '../domain/dealer';
import type { ModspilOpgave } from './model/generator';

/**
 * Den uafhængige kontrol af facit i Modspil (SPEC-modspil.md, "Løser, generator og facit" punkt 7 og accepttest 7):
 * en simpel brute force, der ikke deler kode med løseren. Filen henter kun typer fra modellen (`import type`); reglerne
 * står her for sig selv, og fordelingerne af de to skjulte hænder i den aktuelle farve tælles én for én.
 *
 * Filen hører til testene og bruges ikke af appen. Den er også accepttestens fastlæggelse af aftalerne, hvor specen ikke
 * selv afgør dem; byggeriet følger dem, og listen står i rapporten fra fase 1 (til Afklaret):
 *
 * Kort og valører: et kort er 0–51 som i `domain/cards.ts`; valøren er 2–14 (B 11, D 12, K 13, E 14). Honnørpoint
 * 4-3-2-1. Farverne rangerer ♠ ♥ ♦ ♣ (indeks 0–3), så den laveste farve har det højeste indeks.
 *
 * Udspillet (Vests kort ud fra hans kort i farven, sorteret faldende):
 * - Honnørsekvens: to øverste kort i træk med toppen B eller højere (seq2), tre øverste i træk med toppen 10 eller
 *   højere (seq3), og brudt sekvens: seq2, hvor tredje kort er ét under det næste (K D 10, D B 9, E K B, B 10 8).
 * - Mod farve (begge honnørmetoder): seq3 eller seq2 giver toppen.
 * - Mod sans, top af sekvens: seq3 eller brudt sekvens giver toppen. Anden seq2 med mindst tre kort er "table
 *   feeling": både toppen og det lave kort er mulige, så udspillet er ikke entydigt. Fra doubleton toppen.
 * - Mod sans, ALA (Kompendiet; tabellen i PLAN-aabne-opgaver.md, besluttet 15. nov.): E K D → E; E K B 10(x) → K;
 *   E K x x x(+) → K; E K x x → E; K D B → K; K D 10 9(x) → K; K D x x(+) → D; D B 10 og D B 9 → D; B 10 9 → B;
 *   10 9 8 → 10. Anden seq2 med mindst tre kort er table feeling som ovenfor.
 * - Lavt kort: 4.-højeste (fra fire eller flere), 3. og 5. højeste (3.-højeste fra tre og fire kort, 5.-højeste fra
 *   fem eller flere), Kompendiets mod sans (småkort med højst en 9'er: tredje laveste; fra en tier: næsthøjeste, også
 *   fra 10 x x x; fra honnør: 4.-højeste fra fire eller flere og laveste fra Hxx, som specens forslag under Afklaret).
 *   Fra singleton kortet og fra doubleton det højeste.
 *
 * Øvelse 2 og 3 (regel 11 og 12, udspillets længde): udspillet er et lavt kort efter metoden, og løseren gennemgår de
 * fordelinger, hvor Vest har mindst metodens mindste længde (4 for 4.-højeste, ellers 3), hvor metodens lave kort er
 * udspillet, og hvor honnørreglen ikke giver et andet kort (table feeling tæller med). Fra niveau 4 (`brugerHp`)
 * skal Vests og Syds hp kunne ligge i deres intervaller fra meldingerne; de usete honnører uden for farven kan ligge
 * hos hvem som helst (som Pointregnskab). Regel 11 og 12: antallet af Syds kort over udspillet; er det ikke det samme
 * i alle fordelinger, er facit "kan ikke afgøres". Hvilke: Syds kort over udspillet, når de er de samme i alle.
 * Længden: Vests mulige længder; er der flere end to, er facit "kan ikke afgøres".
 *
 * Øvelse 1 (makkers point): Vests mulige hp, når de usete honnører fordeles på Vest og Syd, og begge skal ligge i
 * deres intervaller (fællesmængden af det, pladsens meldinger viser; uden melding 0–40).
 *
 * Tilspil (øvelse 4 og 5): et honnørudspil, bordet lægger sit laveste kort, og Øst lægger til uden at stikke.
 * U er farvens kort, som Vest ikke kan se på egen hånd og bordet (Østs kort er med). Et kort er lavt, når det er et af
 * de to laveste i U.
 * - Kald eller afvisning: højt = kald eller lavt = kald efter metoden; romersk kald er lavt = kald mod sans.
 * - Efter ALA-kongen mod sans markeres længden: lavt-højt = lige gør et lavt kort til et lige antal, højt-lavt = lige
 *   gør et højt kort til et lige antal. Syds mulige længder er de skjulte kort minus Østs mulige antal (mindst 1);
 *   er der flere end to, er facit "kan ikke afgøres".
 * - Romersk kald mod farve (Kompendiet s. 25–26): et lige kort er skift lav, når det er et af de to laveste lige kort
 *   i U, ellers skift høj; har bordet singleton i farven, eller er der intet ulige kort i U, er et lige kort tvetydigt.
 *   Et ulige kort er kald, når det er det laveste ulige kort i U; ellers er det et ønske om skift (uden retning), når
 *   det er 9 eller højere og et af de to højeste ulige kort i U; ellers kald.
 * - Vælg kortet (Øst): kald med højt = kald og afvisning med lavt = kald er det højeste kort under B; ellers det
 *   laveste kort. Opgaven kræver, at Øst har et kort under B, der ikke er hans laveste. Romersk: kald er det laveste
 *   ulige kort (kald uden ulige kort bruges ikke i trin 1); skift lav og skift høj er det laveste og det højeste lige
 *   kort under B; uden et lige kort er nødløsningen det højeste ulige kort fra 9 og op (Kompendiet s. 26). Efter
 *   ALA-kongen mod sans bruges vælg kortet ikke i trin 1.
 * - Udspillet i øvelse 4 og 5 er et entydigt honnørudspil (B eller højere), og Øst lægger under udspillet.
 *
 * Første afkast (øvelse 6; Franks svar 17. nov. 2026: ingen fast grænse mellem 6 og 7, men samme relative regel som
 * romersk kald): A er afkastfarvens kort, som den, der læser afkastet, ikke kan se på egen hånd, på bordet og blandt de
 * kort, der er spillet før afkastet (afkastet er med). O/E: ulige = kald i farven; et lige kort er en lille lige
 * (laveste af de to andre farver), når det er et af de to laveste lige kort i A, ellers en stor lige (højeste), også med
 * færre end fire lige kort i A, og når det ikke er blandt de fire laveste. Lavinthal: lavt, når kortet er et af de to
 * laveste i A (laveste af de to andre farver), ellers højt (højeste). Som kald eller afvisning: kaldmetoden i
 * afkastfarven med samme lavt (romersk kald mod farve læses som O/E). "De to andre farver" er dem, der hverken er
 * spilførerens farve eller afkastfarven; mod farve er spilførerens farve trumf.
 * Vælges afkastet, er makker læseren, og brugeren kan ikke se hans kort (Franks svar 1, 17. nov. 2026): facit er alle
 * brugerens kort under B, som makker læser som et kald til den ønskede farve i alle fordelinger af farvens kort, brugeren
 * ikke kan se, mellem makker og spilfører (hver fordeling tælles for sig). Er intet kort entydigt, er facit det kort, der
 * læses rigtigt i flest fordelinger, og opgaven er tvetydig. "Flest" måles som andelen af afkastfarvens fordelinger, så
 * kort fra farver med forskelligt antal skjulte kort kan sammenlignes; står flere kort lige, er de alle facit.
 *
 * Omvendt forsinket kald (øvelse 7): lav-høj = passiv, høj-lav = aktiv. Vælges rækkefølgen, er facit det første kort:
 * det laveste for passiv og det højeste kort under B for aktiv.
 */

export type Art = 'sans' | 'farve';
export type Signal = 'kald' | 'afvisning' | 'skift-lav' | 'skift-hoej' | 'skift';

/** Facit i den form, opgaverne skal have det (ingen andre felter; lister sorteret stigende). */
export type BruteFacit =
  | { type: 'interval'; min: number; max: number }
  | { type: 'tal'; tal: number }
  | { type: 'laengder'; laengder: number[] }
  | { type: 'signal'; signal: Signal }
  | { type: 'kort'; kort: Card[]; tvetydig?: true }
  | { type: 'forsinket'; vaerdi: 'passiv' | 'aktiv' }
  | { type: 'kan-ikke-afgoeres' }
  | { type: 'tvetydig' };

/** Den metode, der afgør facit. */
export interface BruteMetode {
  kategori: string;
  id: string;
}

export interface BruteSvar {
  facit: BruteFacit;
  metode?: BruteMetode;
  hvilke?: BruteFacit;
}

/** Kun profilens valg bruges: kategori → metode-id. */
export interface ProfilData {
  readonly valg: Readonly<Record<string, string>>;
}

const KAN_IKKE: BruteFacit = { type: 'kan-ikke-afgoeres' };
const TVETYDIG: BruteFacit = { type: 'tvetydig' };
const signal = (s: Signal): BruteFacit => ({ type: 'signal', signal: s });

export const farveAf = (kort: Card): number => Math.floor(kort / 13);
export const vaerdiAf = (kort: Card): number => (kort % 13) + 2;
export const kortAf = (farve: number, vaerdi: number): Card => farve * 13 + vaerdi - 2;
export const artAf = (kontrakt: string): Art => (kontrakt === '3NT' ? 'sans' : 'farve');
const hpAf = (vaerdi: number): number => Math.max(0, vaerdi - 10);
const sum = (xs: readonly number[]): number => xs.reduce((s, x) => s + x, 0);
const faldende = (xs: readonly number[]): number[] => [...xs].sort((a, b) => b - a);
const stigende = (xs: readonly number[]): number[] => [...xs].sort((a, b) => a - b);
const fejl = (tekst: string): never => {
  throw new Error(`Opgaven passer ikke med reglerne: ${tekst}`);
};

/** Romersk kald gælder kun mod farve (mod sans lavt = kald), og ALA gælder kun mod sans (mod farve top af sekvens). */
export function effektivMetode(profil: ProfilData, kategori: string, art: Art): string {
  const id = profil.valg[kategori];
  if (kategori === 'kald' && id === 'romersk-kald' && art === 'sans') return 'lavt-kald';
  if (kategori === 'honnoerudspil' && id === 'ala-mod-sans' && art === 'farve') return 'top-af-sekvens';
  return id;
}

const lavMetode = (profil: ProfilData, art: Art): string => effektivMetode(profil, art === 'sans' ? 'udspil-sans' : 'udspil-farve', art);

// ---------------------------------------------------------------- udspillet

/** Det lave kort efter metoden; `h` er sorteret faldende. */
function lavtKort(h: readonly number[], metode: string): number {
  const n = h.length;
  if (n <= 2) return h[0];
  switch (metode) {
    case 'fjerde-hoejeste':
      // Fra tre kort indgår reglen ikke i øvelserne (mindste længde 4): Hxx giver det laveste, xxx det højeste.
      return n >= 4 ? h[3] : h[0] >= 11 ? h[2] : h[0];
    case 'tredje-femte':
      return n >= 5 ? h[4] : h[2];
    case 'kompendiets':
      if (h[0] <= 9) return h[n - 3];
      if (h[0] === 10) return h[1];
      return n >= 4 ? h[3] : h[2];
  }
  return fejl(`ukendt udspilsmetode ${metode}`);
}

/** ALA-tabellen mod sans; null, når tabellen ikke afgør det. */
function alaTabel(h: readonly number[]): number[] | null {
  const [a, b, c, d] = h;
  const n = h.length;
  if (a === 14 && b === 13) {
    if (c === 12) return [14];
    if (n >= 4 && c === 11 && d === 10) return [13];
    if (n >= 5) return [13];
    if (n === 4) return [14];
    return null;
  }
  if (a === 13 && b === 12) {
    if (c === 11) return [13];
    if (n >= 4 && c === 10 && d === 9) return [13];
    if (n >= 4) return [12];
    return null;
  }
  if (a === 12 && b === 11 && (c === 10 || c === 9)) return [12];
  if (a === 11 && b === 10 && c === 9) return [11];
  if (a === 10 && b === 9 && c === 8) return [10];
  return null;
}

/** Udspillet fra en honnørsekvens: ét kort, to ved table feeling, eller null uden sekvens. */
function honnoerUdspil(h: readonly number[], art: Art, metode: string, lav: number): number[] | null {
  const n = h.length;
  const seq2 = n >= 2 && h[0] >= 11 && h[1] === h[0] - 1;
  const seq3 = n >= 3 && h[0] >= 10 && h[1] === h[0] - 1 && h[2] === h[0] - 2;
  const brudt = n >= 3 && seq2 && h[2] === h[0] - 3;
  if (art === 'farve') return seq3 || seq2 ? [h[0]] : null;
  if (metode === 'ala-mod-sans') {
    const ala = alaTabel(h);
    if (ala) return ala;
  } else if (seq3 || brudt) return [h[0]];
  if (seq2) return n === 2 ? [h[0]] : [h[0], lav];
  return null;
}

/** De kort, Vest kan spille ud fra `holding` (valører) efter profilen, sorteret faldende. */
export function muligeUdspilBF(holding: readonly number[], art: Art, profil: ProfilData): number[] {
  const h = faldende(holding);
  const lav = lavtKort(h, lavMetode(profil, art));
  return faldende(honnoerUdspil(h, art, effektivMetode(profil, 'honnoerudspil', art), lav) ?? [lav]);
}

/** Den mindste længde for et lavt udspil efter metoden. */
export const mindsteLaengdeBF = (art: Art, profil: ProfilData): number => (lavMetode(profil, art) === 'fjerde-hoejeste' ? 4 : 3);

/** Passer et lavt udspil med Vests kort (faldende)? */
function lavtUdspilPasser(vest: readonly number[], udspil: number, art: Art, profil: ProfilData): boolean {
  if (vest.length < mindsteLaengdeBF(art, profil)) return false;
  return lavtKort(vest, lavMetode(profil, art)) === udspil && muligeUdspilBF(vest, art, profil).includes(udspil);
}

// ---------------------------------------------------------------- regel 11 og 12 og længden

/** Det, Øst ser i udspilsfarven: valørerne. */
export interface FarveSituation {
  kontrakt: string;
  udspil: number;
  oest: readonly number[];
  bord: readonly number[];
}

interface Fordeling {
  vest: number[];
  syd: number[];
}

/** Alle fordelinger af de skjulte kort i farven, der passer med udspillet (og med `passer`, når den er givet). */
function fordelinger(s: FarveSituation, profil: ProfilData, passer?: (f: Fordeling) => boolean): Fordeling[] {
  const art = artAf(s.kontrakt);
  const synlige = new Set([...s.oest, ...s.bord, s.udspil]);
  const skjulte: number[] = [];
  for (let v = 2; v <= 14; v++) if (!synlige.has(v)) skjulte.push(v);
  const ud: Fordeling[] = [];
  for (let maske = 0; maske < 1 << skjulte.length; maske++) {
    const vest = [s.udspil];
    const syd: number[] = [];
    skjulte.forEach((v, i) => ((maske >> i) & 1 ? vest : syd).push(v));
    const f = { vest: faldende(vest), syd: faldende(syd) };
    if (!lavtUdspilPasser(f.vest, s.udspil, art, profil)) continue;
    if (passer && !passer(f)) continue;
    ud.push(f);
  }
  return ud;
}

/** Regel 11 og 12: antallet af Syds kort over udspillet og, når de er de samme i alle fordelinger, hvilke (valører). */
export function regel11BF(s: FarveSituation, profil: ProfilData, passer?: (f: Fordeling) => boolean): { facit: BruteFacit; hvilke: number[] | null } {
  const alle = fordelinger(s, profil, passer);
  if (!alle.length) return fejl('ingen fordeling passer med udspillet');
  const over = alle.map((f) => stigende(f.syd.filter((v) => v > s.udspil)));
  const antal = new Set(over.map((o) => o.length));
  const saet = new Set(over.map((o) => o.join(',')));
  return {
    facit: antal.size === 1 ? { type: 'tal', tal: over[0].length } : KAN_IKKE,
    hvilke: saet.size === 1 ? over[0] : null,
  };
}

/** Udspillets længde: Vests mulige længder, eller "kan ikke afgøres" ved flere end to. */
export function laengdeBF(s: FarveSituation, profil: ProfilData, passer?: (f: Fordeling) => boolean): BruteFacit {
  const alle = fordelinger(s, profil, passer);
  if (!alle.length) return fejl('ingen fordeling passer med udspillet');
  const laengder = stigende([...new Set(alle.map((f) => f.vest.length))]);
  return laengder.length <= 2 ? { type: 'laengder', laengder } : KAN_IKKE;
}

// ---------------------------------------------------------------- tilspil

export interface TilspilData {
  kontrakt: string;
  /** Vests kort i farven før udspillet. */
  udspiller: readonly number[];
  udspil: number;
  /** Bordets kort i farven før stikket. */
  bord: readonly number[];
  /** Østs kort. */
  tilspil: number;
}

type TilspilArt = 'kald' | 'romersk' | 'laengde';

function tilspilArt(kontrakt: string, udspil: number, profil: ProfilData): TilspilArt {
  const art = artAf(kontrakt);
  if (effektivMetode(profil, 'kald', art) === 'romersk-kald') return 'romersk';
  if (art === 'sans' && effektivMetode(profil, 'honnoerudspil', art) === 'ala-mod-sans' && udspil === 13) return 'laengde';
  return 'kald';
}

function romerskAflaesning(c: number, u: readonly number[], bordLaengde: number): BruteFacit {
  const lige = u.filter((v) => v % 2 === 0);
  const ulige = u.filter((v) => v % 2 === 1);
  if (c % 2 === 0) {
    if (bordLaengde === 1 || !ulige.length) return TVETYDIG;
    return signal(lige.indexOf(c) <= 1 ? 'skift-lav' : 'skift-hoej');
  }
  if (c === ulige[0]) return signal('kald');
  if (c >= 9 && ulige.slice(-2).includes(c)) return signal('skift');
  return signal('kald');
}

/** Vests aflæsning af Østs tilspil (øvelse 4). */
export function aflaesTilspilBF(t: TilspilData, profil: ProfilData): { facit: BruteFacit; metode: BruteMetode } {
  const art = artAf(t.kontrakt);
  const synlige = new Set([...t.udspiller, ...t.bord]);
  const u: number[] = [];
  for (let v = 2; v <= 14; v++) if (!synlige.has(v)) u.push(v);
  if (!u.includes(t.tilspil)) return fejl('Østs kort er synligt for Vest');
  const lavt = u.indexOf(t.tilspil) <= 1;
  const hvilken = tilspilArt(t.kontrakt, t.udspil, profil);
  if (hvilken === 'romersk') {
    return { facit: romerskAflaesning(t.tilspil, u, t.bord.length), metode: { kategori: 'kald', id: 'romersk-kald' } };
  }
  if (hvilken === 'laengde') {
    const id = profil.valg.laengde;
    const lige = id === 'lavt-hoejt-lige' ? lavt : !lavt;
    const skjulte = 13 - t.udspiller.length - t.bord.length;
    const syd: number[] = [];
    for (let e = 1; e <= skjulte; e++) if ((e % 2 === 0) === lige) syd.push(skjulte - e);
    if (!syd.length) return fejl('Øst kan ikke have det antal kort');
    const laengder = stigende(syd);
    return { facit: laengder.length <= 2 ? { type: 'laengder', laengder } : KAN_IKKE, metode: { kategori: 'laengde', id } };
  }
  const id = effektivMetode(profil, 'kald', art);
  const kald = id === 'hoejt-kald' ? !lavt : lavt;
  return { facit: signal(kald ? 'kald' : 'afvisning'), metode: { kategori: 'kald', id } };
}

/** Østs kort, når han vil vise `onske` (øvelse 5); `oest` er hans valører i farven. */
export function vaelgTilspilBF(kontrakt: string, udspil: number, oest: readonly number[], onske: Signal, profil: ProfilData): { vaerdi: number; metode: BruteMetode } {
  const art = artAf(kontrakt);
  const x = stigende(oest);
  const hvilken = tilspilArt(kontrakt, udspil, profil);
  if (hvilken === 'laengde') return fejl('øvelsen Vælg kortet bruger ikke længdemarkeringen i trin 1');
  if (hvilken === 'romersk') {
    const metode = { kategori: 'kald', id: 'romersk-kald' };
    const ulige = x.filter((v) => v % 2 === 1);
    const lige = x.filter((v) => v % 2 === 0 && v <= 10);
    const hoejUlige = ulige.filter((v) => v >= 9).pop();
    if (onske === 'kald') return ulige.length ? { vaerdi: ulige[0], metode } : fejl('intet ulige kort til kald');
    if (onske === 'skift-lav' || onske === 'skift-hoej') {
      const v = lige.length ? (onske === 'skift-lav' ? lige[0] : lige[lige.length - 1]) : hoejUlige;
      return v === undefined ? fejl('intet kort til skift') : { vaerdi: v, metode };
    }
    return fejl(`ønsket ${onske} findes ikke i romersk kald`);
  }
  const id = effektivMetode(profil, 'kald', art);
  const metode = { kategori: 'kald', id };
  const hoejest = x.filter((v) => v <= 10).pop();
  if (hoejest === undefined || hoejest === x[0]) return fejl('intet højt kort');
  if (onske !== 'kald' && onske !== 'afvisning') return fejl(`ønsket ${onske} findes ikke i ${id}`);
  const hoejt = (onske === 'kald') === (id === 'hoejt-kald');
  return { vaerdi: hoejt ? hoejest : x[0], metode };
}

// ---------------------------------------------------------------- første afkast

/**
 * Læserens aflæsning af et afkast med valøren `vaerdi`. `a` er afkastfarvens kort, læseren ikke kan se (afkastet er
 * med), som valører.
 */
export function laesAfkastBF(vaerdi: number, a: readonly number[], kontrakt: string, profil: ProfilData): Signal {
  const art = artAf(kontrakt);
  const afkast = profil.valg.afkast;
  const kald = effektivMetode(profil, 'kald', art);
  const usete = stigende(a);
  if (!usete.includes(vaerdi)) return fejl('afkastet er ikke blandt de kort, læseren ikke kan se');
  if (afkast === 'ulige-lige' || (afkast === 'som-kald-afvisning' && kald === 'romersk-kald')) {
    if (vaerdi % 2 === 1) return 'kald';
    return usete.filter((v) => v % 2 === 0).indexOf(vaerdi) <= 1 ? 'skift-lav' : 'skift-hoej';
  }
  const lavt = usete.indexOf(vaerdi) <= 1;
  if (afkast === 'lavinthal') return lavt ? 'skift-lav' : 'skift-hoej';
  return (kald === 'hoejt-kald') === !lavt ? 'kald' : 'afvisning';
}

/** De to farver, der hverken er spilførerens farve eller afkastfarven: [højeste, laveste]. */
function andreFarver(spilfoerersFarve: number, afkastfarve: number): [number, number] {
  const andre = [0, 1, 2, 3].filter((f) => f !== spilfoerersFarve && f !== afkastfarve);
  return [andre[0], andre[1]];
}

/** Farven, signalet i afkastfarven `d` beder om, eller -1 (en afvisning beder ikke om en farve). */
function bederOm(s: Signal, d: number, spilfoerersFarve: number): number {
  const [hoej, lav] = andreFarver(spilfoerersFarve, d);
  return s === 'kald' ? d : s === 'skift-lav' ? lav : s === 'skift-hoej' ? hoej : -1;
}

/**
 * Facit i Vælg afkastet (Franks svar 1, 17. nov. 2026). For hvert af brugerens kort under B uden for spilførerens farve
 * tælles de fordelinger af afkastfarvens skjulte kort mellem makker og spilfører, hvor makker læser kortet som et kald til
 * farven `onske`. `synlige` er det, brugeren ser ud over sin hånd: bordets kort og de spillede kort. Makker kan se sine
 * egne kort, bordets og de spillede, men ikke brugerens og spilførerens.
 * - Kort, der læses rigtigt i alle fordelinger, er facit.
 * - Findes intet sådant kort, er facit de kort, der læses rigtigt i den største andel af fordelingerne (alle, der står
 *   lige), og opgaven er tvetydig.
 * - Kan intet kort læses rigtigt, er listen tom.
 */
export function vaelgAfkastBF(kontrakt: string, spilfoerersFarve: number, haand: readonly Card[], synlige: readonly Card[], onske: number, profil: ProfilData): { kort: Card[]; tvetydig: boolean } {
  const set = new Set([...haand, ...synlige]);
  const andele: [Card, number][] = [];
  for (const kort of haand) {
    const d = farveAf(kort);
    const v = vaerdiAf(kort);
    if (d === spilfoerersFarve || v > 10) continue;
    const egne = iFarven(haand, d);
    const skjulte: number[] = [];
    for (let w = 2; w <= 14; w++) if (!set.has(kortAf(d, w))) skjulte.push(w);
    const alle = 1 << skjulte.length;
    let rigtige = 0;
    for (let maske = 0; maske < alle; maske++) {
      // Makker har de skjulte kort, hvis bit er 1; spilfører har resten.
      const spilfoerers = skjulte.filter((_, i) => ((maske >> i) & 1) === 0);
      if (bederOm(laesAfkastBF(v, [...egne, ...spilfoerers], kontrakt, profil), d, spilfoerersFarve) === onske) rigtige++;
    }
    andele.push([kort, rigtige / alle]);
  }
  const sikre = andele.filter(([, a]) => a === 1).map(([k]) => k);
  if (sikre.length) return { kort: stigende(sikre), tvetydig: false };
  const bedst = Math.max(0, ...andele.map(([, a]) => a));
  if (bedst === 0) return { kort: [], tvetydig: false };
  return { kort: stigende(andele.filter(([, a]) => a === bedst).map(([k]) => k)), tvetydig: true };
}

// ---------------------------------------------------------------- omvendt forsinket kald

export const aflaesForsinketBF = (foerste: number, anden: number): 'passiv' | 'aktiv' => (foerste < anden ? 'passiv' : 'aktiv');

export function vaelgForsinketBF(holding: readonly number[], onske: 'passiv' | 'aktiv'): number {
  const x = stigende(holding);
  if (x.length < 2) return fejl('færre end to kort i farven');
  if (onske === 'passiv') return x[0];
  const hoejest = x.filter((v) => v <= 10).pop();
  return hoejest === undefined || hoejest === x[0] ? fejl('intet højt kort') : hoejest;
}

// ---------------------------------------------------------------- opgaverne

type Intervaller = [number, number][];

function snit(a: Intervaller, b: readonly (readonly [number, number])[]): Intervaller {
  const ud: Intervaller = [];
  for (const [alo, ahi] of a) for (const [blo, bhi] of b) if (Math.max(alo, blo) <= Math.min(ahi, bhi)) ud.push([Math.max(alo, blo), Math.min(ahi, bhi)]);
  return ud;
}

const indenfor = (iv: Intervaller, p: number): boolean => iv.some(([lo, hi]) => p >= lo && p <= hi);

/** Det, pladsens meldinger tillader: fællesmængden af deres hp; uden melding 0–40. */
function tilladt(o: ModspilOpgave, plads: Seat): Intervaller {
  let iv: Intervaller = [[0, 40]];
  for (const m of o.meldeforloeb.meldinger) if (m.plads === plads && m.hp) iv = snit(iv, m.hp);
  return iv;
}

function delsummer(point: readonly number[]): number[] {
  let s = new Set([0]);
  for (const p of point) s = new Set([...s, ...[...s].map((x) => x + p)]);
  return [...s];
}

const ALLE: readonly Card[] = Array.from({ length: 52 }, (_, i) => i);

function makkersPoint(o: ModspilOpgave): BruteFacit {
  const kendt = new Set([...o.haender.E, ...o.haender.N]);
  const point = ALLE.filter((c) => !kendt.has(c)).map((c) => hpAf(vaerdiAf(c))).filter((p) => p > 0);
  const total = sum(point);
  const w = tilladt(o, 'W');
  const s = tilladt(o, 'S');
  const mulige = delsummer(point).filter((x) => indenfor(w, x) && indenfor(s, total - x));
  if (!mulige.length) return fejl('meldingerne passer ikke med de usete honnører');
  return { type: 'interval', min: Math.min(...mulige), max: Math.max(...mulige) };
}

const iFarven = (haand: readonly Card[], farve: number): number[] => haand.filter((c) => farveAf(c) === farve).map(vaerdiAf);
const makker = (plads: 'W' | 'E'): 'W' | 'E' => (plads === 'W' ? 'E' : 'W');

/** Løs adgang til spørgsmålet, så kontrollen ikke afhænger af, hvordan typen er skrevet. */
interface Spoergsmaal {
  hvilke?: boolean;
  variant?: 'aflaes' | 'vaelg';
  onske?: Signal | number | 'passiv' | 'aktiv';
}

/** Øvelse 2 og 3: situationen og hp-kravet fra niveau 4. */
function udspilsopgave(o: ModspilOpgave): { s: FarveSituation; passer?: (f: Fordeling) => boolean; farve: number } {
  if (o.spillet.length !== 1 || o.spillet[0].plads !== 'W') fejl('øvelse 2 og 3 viser kun udspillet');
  const udspil = o.spillet[0].kort;
  const farve = farveAf(udspil);
  const art = artAf(o.kontrakt);
  const vest = faldende(iFarven(o.haender.W, farve));
  const s: FarveSituation = { kontrakt: o.kontrakt, udspil: vaerdiAf(udspil), oest: iFarven(o.haender.E, farve), bord: iFarven(o.haender.N, farve) };
  if (vest.length < mindsteLaengdeBF(art, o.profil) || lavtKort(vest, lavMetode(o.profil, art)) !== s.udspil || muligeUdspilBF(vest, art, o.profil).join() !== String(s.udspil)) {
    fejl('udspillet er ikke et entydigt lavt kort efter metoden');
  }
  if (!o.brugerHp) return { s, farve };
  const kendt = new Set([...o.haender.E, ...o.haender.N]);
  const udenfor = ALLE.filter((c) => farveAf(c) !== farve && !kendt.has(c)).map((c) => hpAf(vaerdiAf(c))).filter((p) => p > 0);
  const summer = delsummer(udenfor);
  const total = sum(udenfor);
  const w = tilladt(o, 'W');
  const syd = tilladt(o, 'S');
  const passer = (f: Fordeling) => {
    const a = sum(f.vest.map(hpAf));
    const b = sum(f.syd.map(hpAf));
    return summer.some((x) => indenfor(w, a + x) && indenfor(syd, b + total - x));
  };
  return { s, passer, farve };
}

/** Øvelse 4 og 5: udspillet, bordets kort og (øvelse 4) Østs kort. */
function tilspilsopgave(o: ModspilOpgave, antal: number): { farve: number; vest: number[]; bord: number[]; udspil: number } {
  if (o.spillet.length !== antal || o.spillet.map((k) => k.plads).join() !== ['W', 'N', 'E'].slice(0, antal).join()) fejl('stikket er ikke udspil, bord og tilspil');
  const udspil = o.spillet[0].kort;
  const farve = farveAf(udspil);
  const art = artAf(o.kontrakt);
  const vest = iFarven(o.haender.W, farve);
  const bord = iFarven(o.haender.N, farve);
  if (vaerdiAf(udspil) < 11 || muligeUdspilBF(vest, art, o.profil).join() !== String(vaerdiAf(udspil))) fejl('udspillet er ikke et entydigt honnørudspil');
  if (!bord.length || o.spillet[1].kort !== kortAf(farve, Math.min(...bord))) fejl('bordet lægger ikke sit laveste kort');
  return { farve, vest, bord, udspil: vaerdiAf(udspil) };
}

/** Facit, metoden og (regel 11 og 12) hvilke for en opgave, regnet uden løseren. */
export function bruteFacit(o: ModspilOpgave): BruteSvar {
  const q = o.sporgsmaal as unknown as Spoergsmaal;
  const art = artAf(o.kontrakt);
  switch (o.ovelse) {
    case 'point':
      return { facit: makkersPoint(o) };
    case 'regel11': {
      const { s, passer, farve } = udspilsopgave(o);
      const { facit, hvilke } = regel11BF(s, o.profil, passer);
      const metode = { kategori: art === 'sans' ? 'udspil-sans' : 'udspil-farve', id: lavMetode(o.profil, art) };
      const hvilkeFacit: BruteFacit = facit.type === 'tal' && hvilke ? { type: 'kort', kort: hvilke.map((v) => kortAf(farve, v)) } : KAN_IKKE;
      return { facit, metode, hvilke: hvilkeFacit };
    }
    case 'laengde': {
      const { s, passer } = udspilsopgave(o);
      return { facit: laengdeBF(s, o.profil, passer), metode: { kategori: art === 'sans' ? 'udspil-sans' : 'udspil-farve', id: lavMetode(o.profil, art) } };
    }
    case 'markering': {
      const { farve, vest, bord, udspil } = tilspilsopgave(o, 3);
      const tilspil = o.spillet[2].kort;
      if (farveAf(tilspil) !== farve || vaerdiAf(tilspil) > udspil) fejl('Øst bekender ikke under udspillet');
      return aflaesTilspilBF({ kontrakt: o.kontrakt, udspiller: vest, udspil, bord, tilspil: vaerdiAf(tilspil) }, o.profil);
    }
    case 'vaelg-kort': {
      const { farve, udspil } = tilspilsopgave(o, 2);
      const { vaerdi, metode } = vaelgTilspilBF(o.kontrakt, udspil, iFarven(o.haender.E, farve), q.onske as Signal, o.profil);
      return { facit: { type: 'kort', kort: [kortAf(farve, vaerdi)] }, metode };
    }
    case 'afkast': {
      const metode = { kategori: 'afkast', id: o.profil.valg.afkast };
      const spilfoerersFarve = o.farve;
      if (art === 'farve' && spilfoerersFarve !== (o.kontrakt === '4S' ? 0 : 1)) fejl('mod farve er afkastet på trumf');
      if (q.variant === 'aflaes') {
        const sidste = o.spillet[o.spillet.length - 1];
        if (sidste.plads !== makker(o.plads) || farveAf(sidste.kort) === spilfoerersFarve) fejl('det sidste kort er ikke makkers afkast');
        const foer = new Set(o.spillet.slice(0, -1).map((k) => k.kort));
        if (o.haender[sidste.plads].some((c) => farveAf(c) === spilfoerersFarve && !foer.has(c))) fejl('makker kan stadig bekende');
        // Brugeren læser afkastet og kan se sin egen hånd, bordet og de kort, der er spillet før afkastet.
        const d = farveAf(sidste.kort);
        const ser = new Set([...o.haender[o.plads], ...o.haender.N, ...foer]);
        const a: number[] = [];
        for (let v = 2; v <= 14; v++) if (!ser.has(kortAf(d, v))) a.push(v);
        return { facit: signal(laesAfkastBF(vaerdiAf(sidste.kort), a, o.kontrakt, o.profil)), metode };
      }
      const spillede = new Set(o.spillet.filter((k) => k.plads === o.plads).map((k) => k.kort));
      const haand = o.haender[o.plads].filter((c) => !spillede.has(c));
      if (haand.some((c) => farveAf(c) === spilfoerersFarve)) fejl('brugeren kan stadig bekende');
      const synlige = [...o.haender.N, ...o.spillet.map((k) => k.kort)];
      const { kort, tvetydig } = vaelgAfkastBF(o.kontrakt, spilfoerersFarve, haand, synlige, q.onske as number, o.profil);
      if (!kort.length) fejl('intet afkast kan vise den ønskede farve');
      return { facit: tvetydig ? { type: 'kort', kort, tvetydig: true } : { type: 'kort', kort }, metode };
    }
    case 'forsinket': {
      if (o.profil.valg.forsinket !== 'omvendt-forsinket') fejl('profilen har ikke omvendt forsinket kald');
      const metode = { kategori: 'forsinket', id: 'omvendt-forsinket' };
      const farve = o.farve;
      if (q.variant === 'aflaes') {
        const makkers = o.spillet.filter((k) => k.plads === makker(o.plads) && farveAf(k.kort) === farve).map((k) => vaerdiAf(k.kort));
        if (makkers.length < 2) fejl('makker har ikke lagt to kort i farven');
        return { facit: { type: 'forsinket', vaerdi: aflaesForsinketBF(makkers[0], makkers[1]) }, metode };
      }
      if (o.spillet.some((k) => k.plads === o.plads && farveAf(k.kort) === farve)) fejl('brugeren har allerede lagt et kort i farven');
      const v = vaelgForsinketBF(iFarven(o.haender[o.plads], farve), q.onske as 'passiv' | 'aktiv');
      return { facit: { type: 'kort', kort: [kortAf(farve, v)] }, metode };
    }
  }
  return fejl('ukendt øvelse');
}
