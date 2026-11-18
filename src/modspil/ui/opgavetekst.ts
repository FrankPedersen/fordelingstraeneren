import type { Card } from '../../domain/cards';
import type { Seat } from '../../domain/dealer';
import { getLang } from '../../i18n';
import type { Allowed } from '../../pointregnskab/model/points';
import type { ModspilOpgave } from '../model/generator';
import { analyserRegel11, type Facit, type Signal } from '../model/loeser';
import { afkastetsFarve, afkastlaesning, andreFarver, tilspilsart } from '../model/markering';
import { hpKrav, makkersPoint, meldingTekst, tilladt } from '../model/meldinger';
import { metode, profilId, profilNavn, regel } from '../model/metoder';
import { farveAf, kontraktTekst, kortTekst, SYMBOLER, vaerdiAf } from '../model/tekst';
import { kontraktart, trumf, udspilKategori } from '../model/udspil';
import type { Svar } from '../training/scoring';
import { T } from './tekster';

/**
 * Det, opgaveskærmen viser ud over trin 1's opgave (SPEC-modspil.md, trin 2, Layoutet): spørgsmålet, svarmulighederne,
 * dommens tekst, regnestykket, "Ved bordet" og opslaget i ordbogen. Facit kommer altid fra trin 1; her bygges kun
 * teksterne og knapperne, på det aktuelle sprog.
 */

const sprog = () => getLang();
const kt = (kort: Card) => kortTekst(kort, sprog());
const symbol = (farve: number) => SYMBOLER[farve];
const vaerdier = (haand: readonly Card[], farve: number) => haand.filter((c) => farveAf(c) === farve).map(vaerdiAf);

/** Kortene, der er spillet af en plads. */
const spilletAf = (o: ModspilOpgave, plads: Seat) => o.spillet.filter((s) => s.plads === plads).map((s) => s.kort);
/** Brugerens kort, der ikke er spillet. */
export const egneKort = (o: ModspilOpgave): Card[] => {
  const spillet = new Set(o.spillet.map((s) => s.kort));
  return o.haender[o.plads].filter((c) => !spillet.has(c));
};

/** Øvelser, hvor brugeren svarer med et kort: Vælg kortet og vælg-varianten af øvelse 6 og 7. */
export const vaelgerKort = (o: ModspilOpgave): boolean => o.ovelse === 'vaelg-kort' || o.sporgsmaal.variant === 'vaelg';

/** De kort, brugeren kan spille: i Vælg kortet og Forsinket kald farvens kort, i Vælg afkastet alle (han kan ikke bekende). */
export function spilbareKort(o: ModspilOpgave): Card[] {
  if (!vaelgerKort(o)) return [];
  const egne = egneKort(o);
  return o.ovelse === 'afkast' ? egne : egne.filter((c) => farveAf(c) === o.farve);
}

/** Hp i en hånd (E 4, K 3, D 2, B 1). */
export const hpI = (haand: readonly Card[]): number => haand.reduce((s, c) => s + Math.max(0, vaerdiAf(c) - 10), 0);

/** Et interval som "15–17", "0–11" eller "12+". */
export function intervalTekst(a: Allowed): string {
  return a.map(([lo, hi]) => (hi >= 37 && lo > 0 ? `${lo}+` : lo === hi ? `${lo}` : `${lo}–${hi}`)).join(' / ');
}

const spanTekst = (min: number, max: number) => (min === max ? `${min}` : `${min}–${max}`);

// ---------------------------------------------------------------- øvelsens navn og spørgsmålet

const lavtMetode = (o: ModspilOpgave) => (o.metode ? metode(o.metode.kategori, o.metode.id) : undefined);
const metodeTekst = (o: ModspilOpgave): string | undefined => {
  const m = lavtMetode(o);
  return m ? (sprog() === 'en' ? m.tekstEn : m.tekst) : undefined;
};
const erFjerde = (o: ModspilOpgave) => o.metode?.id === 'fjerde-hoejeste';

/** Mærket: profilens navn og metoden, fx "Standard · 4.-højeste". */
export function maerke(o: ModspilOpgave): string {
  const navn = profilNavn(profilId(o.profil.valg));
  return T.maerkeLabel(sprog() === 'en' ? navn.tekstEn : navn.tekst, metodeTekst(o));
}

/** Øvelsens navn over spørgsmålet. */
export function ovelsesNavn(o: ModspilOpgave): string {
  if (o.ovelse === 'regel11' && erFjerde(o)) return T.regel11;
  if (o.ovelse === 'afkast' && o.sporgsmaal.variant === 'vaelg') return T.vaelgAfkastet;
  return T.ovelser[o.ovelse];
}

const udspillet = (o: ModspilOpgave): Card => o.spillet[0].kort;

/** Spørgsmålet (h1). */
export function spoergsmaal(o: ModspilOpgave): string {
  switch (o.ovelse) {
    case 'point':
      return T.pointSpm;
    case 'regel11':
    case 'laengde': {
      const intro = erFjerde(o) ? T.udspilFjerde : T.udspilEfter(metodeTekst(o) ?? '');
      return `${intro} ${o.ovelse === 'regel11' ? T.regel11Spm(o.farve, kt(udspillet(o))) : T.laengdeSpm(o.farve)}`;
    }
    case 'markering': {
      const tilspil = spilletAf(o, 'E')[0];
      if (tilspilsart(o.kontrakt, vaerdiAf(udspillet(o)), o.profil) === 'laengde') return T.markeringLaengdeSpm(kt(tilspil), o.farve);
      return T.markeringSpm(kt(tilspil));
    }
    case 'vaelg-kort': {
      const onske = o.sporgsmaal.onske as Signal;
      const andre = andreFarver(trumf(o.kontrakt) ?? -1, o.farve);
      const til = onske === 'skift-lav' ? andre.lav : andre.hoej;
      return T.vaelgKortSpm(onske === 'kald' ? 'kald' : onske === 'afvisning' ? 'afvisning' : 'skift', o.farve, til);
    }
    case 'afkast':
      if (o.sporgsmaal.variant === 'vaelg') return T.afkastVaelgSpm(o.sporgsmaal.onske as number);
      return T.afkastAflaesSpm(kt(o.spillet[o.spillet.length - 1].kort));
    case 'forsinket': {
      if (o.sporgsmaal.variant === 'vaelg') return T.forsinketVaelgSpm(o.sporgsmaal.onske as 'passiv' | 'aktiv', o.farve);
      const makker = o.plads === 'W' ? 'E' : 'W';
      const [a, b] = spilletAf(o, makker);
      return T.forsinketAflaesSpm(kt(a), kt(b));
    }
  }
}

/** Aftalen under spørgsmålet i Vælg kortet. */
export function aftale(o: ModspilOpgave): { titel: string; tekst?: string } | null {
  if (o.ovelse !== 'vaelg-kort') return null;
  const m = lavtMetode(o);
  if (!m) return null;
  const en = sprog() === 'en';
  return { titel: T.aftalen(en ? m.tekstEn : m.tekst), tekst: en ? m.aftaleEn : m.aftale };
}

// ---------------------------------------------------------------- svarmulighederne

export interface Valg {
  svar: Svar;
  tekst: string;
}

const kanIkke: Valg = { svar: { type: 'kan-ikke-afgoeres' }, get tekst() { return T.kanIkke; } };

/** Makkers point: fire intervaller med samme bredde, et af dem rigtigt (placeringen følger seedet). */
function pointValg(o: ModspilOpgave): Valg[] {
  if (o.facit.type !== 'interval') return [];
  const { min, max } = o.facit;
  const start = Math.min(o.seed % 4, min);
  return [0, 1, 2, 3].map((i) => {
    const d = i - start;
    return { svar: { type: 'interval', min: min + d, max: max + d }, tekst: T.hp(spanTekst(min + d, max + d)) };
  });
}

/** De skjulte kort over udspillet (kortene, ingen af de kendte hænder har), stigende. */
export function skjulteOver(o: ModspilOpgave): Card[] {
  const u = udspillet(o);
  const synlige = new Set([...o.haender.E, ...o.haender.N, u]);
  const ud: Card[] = [];
  for (let v = vaerdiAf(u) + 1; v <= 14; v++) {
    const c = o.farve * 13 + v - 2;
    if (!synlige.has(c)) ud.push(c);
  }
  return ud;
}

/** Regel 11 og 12: antallet 0 til antallet af skjulte kort over udspillet. */
function regel11Valg(o: ModspilOpgave): Valg[] {
  const k = skjulteOver(o).length;
  return Array.from({ length: k + 1 }, (_, n) => ({ svar: { type: 'tal', tal: n }, tekst: String(n) }));
}

const LAENGDER: readonly (readonly number[])[] = [[3], [4], [5], [3, 4], [3, 5], [4, 5]];

function laengdeTekst(l: readonly number[]): string {
  return T.eller(l);
}

/** Udspillets længde: én eller to længder. */
function laengdeValg(o: ModspilOpgave): Valg[] {
  const valg = [...LAENGDER];
  if (o.facit.type === 'laengder' && !valg.some((l) => l.join() === (o.facit as { laengder: number[] }).laengder.join())) valg.push(o.facit.laengder);
  return valg.map((l) => ({ svar: { type: 'laengder', laengder: [...l] }, tekst: laengdeTekst(l) }));
}

/** Spilførers mulige længder efter ALA-kongen: én mulighed pr. paritet af makkers antal (højst to længder). */
function spilfoerersLaengder(o: ModspilOpgave): number[][] {
  const skjulte = 13 - vaerdier(o.haender.W, o.farve).length - vaerdier(o.haender.N, o.farve).length;
  const ud: number[][] = [];
  for (const paritet of [0, 1]) {
    const syd: number[] = [];
    for (let n = 1; n <= skjulte; n++) if (n % 2 === paritet) syd.push(skjulte - n);
    if (syd.length && syd.length <= 2) ud.push(syd.sort((a, b) => a - b));
  }
  if (o.facit.type === 'laengder' && !ud.some((l) => l.join() === (o.facit as { laengder: number[] }).laengder.join())) ud.push(o.facit.laengder);
  return ud;
}

function signalValg(signal: Signal, tekst: string): Valg {
  return { svar: { type: 'signal', signal }, tekst };
}

function markeringValg(o: ModspilOpgave): Valg[] {
  const art = tilspilsart(o.kontrakt, vaerdiAf(udspillet(o)), o.profil);
  if (art === 'laengde') return spilfoerersLaengder(o).map((l) => ({ svar: { type: 'laengder', laengder: l }, tekst: laengdeTekst(l) }));
  if (art === 'kald') return [signalValg('kald', T.kald), signalValg('afvisning', T.afvisning)];
  const andre = andreFarver(trumf(o.kontrakt) ?? -1, o.farve);
  return [
    signalValg('kald', T.kald),
    signalValg('skift-lav', T.skifteTil(symbol(andre.lav))),
    signalValg('skift-hoej', T.skifteTil(symbol(andre.hoej))),
    signalValg('skift', T.skifteTil(T.eller([symbol(andre.lav), symbol(andre.hoej)]))),
    { svar: { type: 'tvetydig' }, tekst: T.tvetydig },
  ];
}

/** Første afkast: farven, afkastet er i, og spilførers farve. */
const afkastFarver = (o: ModspilOpgave) => ({ farve: farveAf(o.spillet[o.spillet.length - 1].kort), sf: o.farve });

function afkastValg(o: ModspilOpgave): Valg[] {
  const { farve, sf } = afkastFarver(o);
  const { laesning } = afkastlaesning(o.kontrakt, o.profil);
  const andre = andreFarver(sf, farve);
  const skift = [signalValg('skift-lav', T.skifteTil(symbol(andre.lav))), signalValg('skift-hoej', T.skifteTil(symbol(andre.hoej)))];
  if (laesning === 'kald') return [signalValg('kald', T.kaldTil(symbol(farve))), signalValg('afvisning', T.afvisning)];
  if (laesning === 'retning') return skift;
  return [signalValg('kald', T.kaldTil(symbol(farve))), ...skift];
}

/** Svarknapperne i gruppen "Svar" (uden "Kan ikke afgøres", der står for sig); tom, når brugeren vælger et kort. */
export function svarValg(o: ModspilOpgave): Valg[] {
  if (vaelgerKort(o)) return [];
  switch (o.ovelse) {
    case 'point':
      return pointValg(o);
    case 'regel11':
      return regel11Valg(o);
    case 'laengde':
      return laengdeValg(o);
    case 'markering':
      return markeringValg(o);
    case 'afkast':
      return afkastValg(o);
    case 'forsinket':
      return [
        { svar: { type: 'forsinket', vaerdi: 'passiv' }, tekst: T.passivt },
        { svar: { type: 'forsinket', vaerdi: 'aktiv' }, tekst: T.aktivt },
      ];
    default:
      return [];
  }
}

export const kanIkkeValg = (): Valg => kanIkke;

/** Spørger opgaven også "Hvilke?" (Regel 11 og 12 fra niveau 4)? */
export const spoergerHvilke = (o: ModspilOpgave): boolean => o.ovelse === 'regel11' && o.hvilke !== undefined;

// ---------------------------------------------------------------- dommen og facit

const kortListe = (kort: readonly Card[]) => T.og(kort.map(kt));
const kortEller = (kort: readonly Card[]) => T.eller(kort.map(kt));

/** Svaret som tekst, fx "2", "6–9 hp" eller "♠8". */
export function svarTekst(o: ModspilOpgave, svar: Svar): string {
  switch (svar.type) {
    case 'kan-ikke-afgoeres':
      return T.kanIkke;
    case 'tvetydig':
      return T.tvetydig;
    case 'kort':
      return kt(svar.kort);
    case 'tal':
      if (svar.hvilke === 'kan-ikke-afgoeres') return `${svar.tal} · ${T.hvilke} ${T.kanIkke}`;
      if (svar.hvilke && svar.hvilke.length) return `${svar.tal}: ${kortListe(svar.hvilke)}`;
      return String(svar.tal);
    default: {
      const valg = [...svarValg(o)].find((v) => JSON.stringify(v.svar) === JSON.stringify(svar));
      if (valg) return valg.tekst;
      if (svar.type === 'interval') return T.hp(spanTekst(svar.min, svar.max));
      if (svar.type === 'laengder') return laengdeTekst(svar.laengder);
      return '';
    }
  }
}

function signalFacit(o: ModspilOpgave, signal: Signal): string {
  const andre = andreFarver(trumf(o.kontrakt) ?? -1, o.farve);
  if (signal === 'kald') return T.facit.kald;
  if (signal === 'afvisning') return T.facit.afvisning;
  if (signal === 'skift-lav') return T.facit.skifte(symbol(andre.lav));
  if (signal === 'skift-hoej') return T.facit.skifte(symbol(andre.hoej));
  return T.facit.skifte(T.eller([symbol(andre.lav), symbol(andre.hoej)]));
}

function afkastFacit(o: ModspilOpgave, signal: Signal): string {
  const { farve, sf } = afkastFarver(o);
  if (signal === 'kald') return T.facit.afkastKald(symbol(farve));
  if (signal === 'afvisning') return T.facit.afkastAfvisning(symbol(farve));
  const til = afkastetsFarve(signal, farve, sf);
  return T.facit.afkastBeder(til === null ? '' : symbol(til));
}

/** Facit som tekst efter "Rigtigt:" eller "Forkert:", fx "spilfører har 0". */
export function facitTekst(o: ModspilOpgave): string {
  const f: Facit = o.facit;
  switch (f.type) {
    case 'kan-ikke-afgoeres':
      return T.facit.kanIkke;
    case 'tvetydig':
      return T.facit.tvetydig;
    case 'interval':
      return T.facit.point(spanTekst(f.min, f.max));
    case 'tal':
      return o.hvilke?.type === 'kort' && o.hvilke.kort.length ? T.facit.regel11Hvilke(f.tal, kortListe(o.hvilke.kort)) : T.facit.regel11(f.tal);
    case 'laengder':
      return o.ovelse === 'markering' ? T.facit.spilfoerersLaengde(laengdeTekst(f.laengder)) : T.facit.laengde(laengdeTekst(f.laengder));
    case 'signal':
      return o.ovelse === 'afkast' ? afkastFacit(o, f.signal) : signalFacit(o, f.signal);
    case 'forsinket':
      return f.vaerdi === 'passiv' ? T.facit.passiv : T.facit.aktiv;
    case 'kort':
      return T.facit.kort(kortEller(f.kort));
  }
}

/** "Ved bordet": hvad brugeren gør med svaret. */
export function vedBordet(o: ModspilOpgave): string {
  const f = o.facit;
  if (f.type === 'kan-ikke-afgoeres') return T.ved.uklar;
  switch (o.ovelse) {
    case 'point':
      return T.ved.point;
    case 'regel11':
      return f.type === 'tal' ? T.ved.regel11(f.tal, kt(udspillet(o))) : T.ved.uklar;
    case 'laengde':
      return f.type === 'laengder' ? T.ved.laengde(laengdeTekst(f.laengder), o.farve) : T.ved.uklar;
    case 'markering':
      if (f.type === 'tvetydig') return T.ved.tvetydig;
      if (f.type === 'laengder') return T.ved.spilfoerersLaengde;
      if (f.type === 'signal') {
        const andre = andreFarver(trumf(o.kontrakt) ?? -1, o.farve);
        if (f.signal === 'kald') return T.ved.kald;
        if (f.signal === 'afvisning') return T.ved.afvisning;
        if (f.signal === 'skift') return T.ved.skifteUklar;
        return T.ved.skifte(symbol(f.signal === 'skift-lav' ? andre.lav : andre.hoej));
      }
      return T.ved.uklar;
    case 'vaelg-kort':
      return T.ved.vaelgKort;
    case 'afkast': {
      if (o.sporgsmaal.variant === 'vaelg') {
        if (f.type === 'kort' && f.tvetydig) return T.ved.afkastTvetydig;
        return T.ved.afkastVaelg(symbol(o.sporgsmaal.onske as number));
      }
      const { farve, sf } = afkastFarver(o);
      if (f.type !== 'signal') return T.ved.uklar;
      if (f.signal === 'afvisning') return T.ved.afkastAfviser(symbol(farve));
      const til = afkastetsFarve(f.signal, farve, sf);
      return T.ved.afkastBeder(symbol(til ?? farve));
    }
    case 'forsinket':
      if (o.sporgsmaal.variant === 'vaelg') return o.sporgsmaal.onske === 'passiv' ? T.ved.vaelgPassiv : T.ved.vaelgAktiv;
      return f.type === 'forsinket' && f.vaerdi === 'passiv' ? T.ved.passiv : T.ved.aktiv;
  }
}

/** Opslaget i Bridgeordbogen (www.kontraktbridge.dk/ordbog/), som facit linker til. */
export function opslag(o: ModspilOpgave): { id: string; tekst: string } {
  const id = ((): string => {
    switch (o.ovelse) {
      case 'point':
        return 'honnoerpoint';
      case 'regel11':
        return erFjerde(o) ? 'regel-11' : 'udspil';
      case 'laengde':
        return erFjerde(o) ? 'fjerdehoejeste' : 'udspil';
      case 'markering':
      case 'vaelg-kort':
        if (o.metode?.kategori === 'laengde') return 'fordelingssignal';
        return o.metode?.id === 'romersk-kald' ? 'modspilssignal' : 'kald-afvisning';
      case 'afkast':
        return o.metode?.id === 'lavinthal' ? 'lavinthal-signal' : 'afkast';
      case 'forsinket':
        return 'modspilssignal';
    }
  })();
  return { id, tekst: T.ordbog[id] };
}

// ---------------------------------------------------------------- regnestykket

export interface Raekke {
  tekst: string;
  tal: string;
  sum?: boolean;
}

/** Regnestykket i Makkers point og i Regel 11 og 12 med et klart facit; ellers null. */
export function regnestykke(o: ModspilOpgave): Raekke[] | null {
  if (o.ovelse === 'point' && o.facit.type === 'interval') {
    const p = makkersPoint(o.haender, o.meldeforloeb);
    if (!p) return null;
    const syd = tilladt(o.meldeforloeb, 'S');
    const aabning = o.meldeforloeb.meldinger.find((m) => m.plads === 'S' && m.melding !== 'P');
    return [
      { tekst: T.regning.iAlt, tal: '40' },
      { tekst: T.regning.dig, tal: `− ${hpI(o.haender.E)}` },
      { tekst: T.regning.bordet, tal: `− ${hpI(o.haender.N)}` },
      { tekst: T.regning.tilsammen, tal: `${p.total}`, sum: true },
      { tekst: T.regning.spilfoererViste(aabning ? meldingTekst(aabning.melding, sprog()) : ''), tal: `− (${intervalTekst(syd)})` },
      { tekst: T.regning.makker, tal: spanTekst(o.facit.min, o.facit.max), sum: true },
    ];
  }
  if (o.ovelse === 'regel11' && o.facit.type === 'tal') {
    const u = udspillet(o);
    const s = { kontrakt: o.kontrakt, udspil: vaerdiAf(u), oest: vaerdier(o.haender.E, o.farve), bord: vaerdier(o.haender.N, o.farve) };
    const krav = o.brugerHp ? hpKrav(o.haender, o.meldeforloeb, o.farve) : undefined;
    const a = analyserRegel11(s, o.profil, krav);
    if (a.vestOver.length !== 1) return null;
    const r = 14 - a.vestOver[0];
    const over = (haand: readonly Card[]) => haand.filter((c) => farveAf(c) === o.farve && vaerdiAf(c) > vaerdiAf(u)).sort((x, y) => y - x);
    return [
      { tekst: T.regning.overIAlt(kt(u)), tal: `${r} − ${vaerdiAf(u)} = ${r - vaerdiAf(u)}` },
      { tekst: T.regning.bordetKort(kortListe(over(o.haender.N))), tal: `− ${a.bordOver}` },
      { tekst: T.regning.digKort(kortListe(over(o.haender.E))), tal: `− ${a.oestOver}` },
      { tekst: T.regning.spilfoerer, tal: `${o.facit.tal}`, sum: true },
    ];
  }
  return null;
}

// ---------------------------------------------------------------- meldeforløbet

/** Linjen under meldeforløbet: intervallerne og kontrakten. */
export function meldeLinje(o: ModspilOpgave): string {
  const dele: string[] = [];
  for (const m of o.meldeforloeb.meldinger) {
    if (!m.hp) continue;
    if (m.melding === 'P') dele.push(T.aabningsPas(T.plads[m.plads], intervalTekst(m.hp)));
    else dele.push(T.aabning(meldingTekst(m.melding, sprog()), intervalTekst(m.hp)));
  }
  dele.push(T.kontrakt(kontraktTekst(o.kontrakt)));
  return dele.join(' ');
}

/** Regel 11 med 4.-højeste: tippet under svarene som i mock-up'en; ellers intet. */
export function tip(o: ModspilOpgave): boolean {
  return o.ovelse === 'regel11' && erFjerde(o) && regel(o.profil, udspilKategori(kontraktart(o.kontrakt)), kontraktart(o.kontrakt)).kortOver === 3;
}
