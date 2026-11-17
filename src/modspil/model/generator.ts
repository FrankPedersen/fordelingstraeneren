import type { Card } from '../../domain/cards';
import { dealWith, type Hands, type Seat } from '../../domain/dealer';
import { mulberry32, type Rng } from '../../engine/rng';
import { hcpOf } from '../../system/interpreter';
import {
  forklarAflaesAfkast,
  forklarAflaesForsinket,
  forklarLaengde,
  forklarPoint,
  forklarRegel11,
  forklarTilspil,
  forklarVaelgAfkast,
  forklarVaelgForsinket,
  forklarVaelgTilspil,
  type AfkastGrundlag,
  type Tekst,
} from './forklaring';
import { analyserRegel11, erUklar, kanIkkeAfgoeres, muligeLaengder, type Facit, type Signal, type Udspilssituation } from './loeser';
import {
  aflaesAfkastDetaljer,
  aflaesForsinket,
  aflaesTilspilDetaljer,
  afkastetsFarve,
  afkastlaesning,
  andreFarver,
  harForsinketKald,
  muligeOensker,
  tilspilsart,
  vaelgAfkastDetaljer,
  vaelgForsinket,
  vaelgTilspil,
} from './markering';
import { hpKrav, makkersPoint, meld, meldingTekst, tilladt, type Meldeforloeb } from './meldinger';
import { gaeldende, gaeldendeId, metode, regel, type KategoriId, type Kontraktart, type Profil } from './metoder';
import { kortAf, farveAf, vaerdiAf } from './tekst';
import { faldende, honnoerUdspil, kontraktart, lavtUdspil, muligeUdspil, trumf, udspilKategori, type Kontrakt } from './udspil';

/**
 * Generatoren til Modspil (SPEC-modspil.md, "Løser, generator og facit" punkt 1–6, og øvelserne og niveauerne):
 * fordelingen kommer fra motorens kortgiver med en seedbar PRNG, så hver opgave kan genskabes fra sit seed (accepttest
 * 8). Meldeforløbet kommer fra systemfilen (`meldinger.ts`), udspillet fra udspilsreglen, og facit fra løseren og
 * aftalerne. Fra niveau 3 har ca. hver femte opgave facit "kan ikke afgøres" eller "tvetydig" (accepttest 9).
 */

export type Ovelse = 'point' | 'regel11' | 'laengde' | 'markering' | 'vaelg-kort' | 'afkast' | 'forsinket';

/** Øvelse 1–7 i specens orden. */
export const OVELSER: readonly Ovelse[] = ['point', 'regel11', 'laengde', 'markering', 'vaelg-kort', 'afkast', 'forsinket'];

export type Niveau = 1 | 2 | 3 | 4 | 5;

/** Øvelsernes første niveau (specens niveautabel): 1–3 fra niveau 1, 4–5 fra niveau 2 og 6–7 fra niveau 3. */
export const FOERSTE_NIVEAU: Readonly<Record<Ovelse, Niveau>> = {
  point: 1,
  regel11: 1,
  laengde: 1,
  markering: 2,
  'vaelg-kort': 2,
  afkast: 3,
  forsinket: 3,
};

/** Andelen af opgaver fra niveau 3 med facit "kan ikke afgøres" eller "tvetydig" (specens punkt 6: ca. hver femte). */
export const ANDEL_UKLAR = 0.2;

/** Hp-intervallerne bruges i øvelse 2 og 3 fra dette niveau, og regel 11 og 12 spørger også om hvilke kort. */
export const HP_FRA_NIVEAU: Niveau = 4;

const MAKS_FORSOEG = 200_000;

export interface SpilletKort {
  plads: Seat;
  kort: Card;
}

export interface Sporgsmaal {
  /** Øvelse 6 og 7: brugeren aflæser makkers kort eller vælger selv. */
  variant?: 'aflaes' | 'vaelg';
  /** Øvelse 5: signalet; øvelse 6: farven, brugeren vil have spillet; øvelse 7: passivt eller aktivt. */
  onske?: Signal | number | 'passiv' | 'aktiv';
}

export interface ModspilOpgave {
  ovelse: Ovelse;
  niveau: Niveau;
  seed: number;
  profil: Profil;
  /** Brugerens plads: Øst i øvelse 1, 2, 3 og 5, Vest i 4, begge i 6 og 7. */
  plads: 'W' | 'E';
  /** Alle fire hænder, som de blev givet. */
  haender: Hands;
  meldeforloeb: Meldeforloeb;
  kontrakt: Kontrakt;
  /** Den aktuelle farve: udspilsfarven (2–5), spilførers farve (6) eller spilførers første farve (7). */
  farve: number;
  /** De spillede kort, brugeren ser, i rækkefølge. */
  spillet: readonly SpilletKort[];
  /** Løseren bruger hp-intervallerne: øvelse 1 altid, 2–3 fra niveau 4. */
  brugerHp: boolean;
  sporgsmaal: Sporgsmaal;
  /** Metoden, der afgør facit (ikke i øvelse 1). */
  metode?: { kategori: KategoriId; id: string };
  facit: Facit;
  /** Regel 11 og 12 fra niveau 4: Syds kort over udspillet, eller kan ikke afgøres. */
  hvilke?: Facit;
  forklaring: Tekst;
}

type Maal = 'klar' | 'uklar';

interface Grundlag {
  ovelse: Ovelse;
  niveau: Niveau;
  seed: number;
  profil: Profil;
  maal: Maal;
  rng: Rng;
  haender: Hands;
  meldeforloeb: Meldeforloeb;
  kontrakt: Kontrakt;
}

type Del = Omit<ModspilOpgave, 'ovelse' | 'niveau' | 'seed' | 'profil' | 'haender' | 'meldeforloeb' | 'kontrakt'>;

const opgave = (g: Grundlag, del: Del): ModspilOpgave => ({
  ovelse: g.ovelse,
  niveau: g.niveau,
  seed: g.seed,
  profil: g.profil,
  haender: g.haender,
  meldeforloeb: g.meldeforloeb,
  kontrakt: g.kontrakt,
  ...del,
});

const valg = <T>(rng: Rng, xs: readonly T[]): T => xs[rng.int(xs.length)];
const iFarven = (haand: readonly Card[], farve: number): number[] => haand.filter((c) => farveAf(c) === farve).map(vaerdiAf);
const laengde = (haand: readonly Card[], farve: number): number => haand.filter((c) => farveAf(c) === farve).length;
const makker = (plads: 'W' | 'E'): 'W' | 'E' => (plads === 'W' ? 'E' : 'W');
const passerMaal = (facit: Facit, maal: Maal): boolean => erUklar(facit) === (maal === 'uklar');
const FARVER = [0, 1, 2, 3] as const;

// ---------------------------------------------------------------- øvelserne og profilen

/** Findes øvelsen i profilens metoder? Forsinket kald kræver omvendt forsinket kald. */
export function harOvelse(ovelse: Ovelse, profil: Profil): boolean {
  return ovelse !== 'forsinket' || harForsinketKald(profil);
}

/**
 * Kan øvelsen have facit "kan ikke afgøres" eller "tvetydig" med profilens metoder? Første afkast kan altid: i Vælg
 * afkastet er opgaven tvetydig, når intet kort er entydigt (Franks svar 1, 17. nov. 2026).
 */
export function kanVaereUklar(ovelse: Ovelse, profil: Profil): boolean {
  switch (ovelse) {
    case 'laengde':
    case 'afkast':
      return true;
    case 'regel11':
      return (['sans', 'farve'] as const).some((art) => regel(profil, udspilKategori(art), art).kortOver === null);
    case 'markering':
      return regel(profil, 'kald', 'farve').romersk || regel(profil, 'honnoerudspil', 'sans').kongenBederOmLaengde;
    default:
      return false;
  }
}

function kontrollerOvelse(ovelse: Ovelse, niveau: Niveau, profil: Profil): void {
  if (!harOvelse(ovelse, profil)) throw new Error(`Profilen har ikke øvelsen ${ovelse}`);
  if (niveau < FOERSTE_NIVEAU[ovelse]) throw new Error(`Øvelsen ${ovelse} begynder på niveau ${FOERSTE_NIVEAU[ovelse]}`);
}

/**
 * En opgave i øvelsen på niveauet. Samme seed giver samme opgave. Fra niveau 3 har opgaven facit "kan ikke afgøres"
 * eller "tvetydig" med sandsynligheden `ANDEL_UKLAR`, når øvelsen kan have det med profilens metoder.
 */
export function lavOpgave(ovelse: Ovelse, niveau: Niveau, seed: number, profil: Profil): ModspilOpgave {
  kontrollerOvelse(ovelse, niveau, profil);
  const rng = mulberry32(seed);
  const uklar = niveau >= 3 && rng.next() < ANDEL_UKLAR && kanVaereUklar(ovelse, profil);
  return byg(ovelse, niveau, seed, profil, uklar ? 'uklar' : 'klar', rng);
}

/**
 * En opgave på niveauet, hvor generatoren selv vælger øvelsen blandt dem, profilen og niveauet har. Fra niveau 3 vælges
 * først, om facit skal være uklart (sandsynligheden `ANDEL_UKLAR`), og så øvelsen blandt dem, der kan give det.
 */
export function lavNiveauOpgave(niveau: Niveau, seed: number, profil: Profil): ModspilOpgave {
  const rng = mulberry32(seed);
  const mulige = OVELSER.filter((o) => harOvelse(o, profil) && niveau >= FOERSTE_NIVEAU[o]);
  const uklar = niveau >= 3 && rng.next() < ANDEL_UKLAR;
  const kandidater = uklar ? mulige.filter((o) => kanVaereUklar(o, profil)) : mulige;
  return byg(valg(rng, kandidater), niveau, seed, profil, uklar ? 'uklar' : 'klar', rng);
}

function byg(ovelse: Ovelse, niveau: Niveau, seed: number, profil: Profil, maal: Maal, rng: Rng): ModspilOpgave {
  for (let forsoeg = 0; forsoeg < MAKS_FORSOEG; forsoeg++) {
    const haender = dealWith(rng);
    const meldt = meld(haender, rng);
    if (!meldt) continue;
    const g: Grundlag = { ovelse, niveau, seed, profil, maal, rng, haender, ...meldt };
    const o = BYGGERE[ovelse](g);
    if (o) return o;
  }
  throw new Error(`Ingen opgave fundet: ${ovelse}, niveau ${niveau}, seed ${seed}`);
}

// ---------------------------------------------------------------- øvelse 1: makkers point

function point(g: Grundlag): ModspilOpgave | null {
  const p = makkersPoint(g.haender, g.meldeforloeb);
  if (!p) return null;
  const aabning = g.meldeforloeb.meldinger.find((m) => m.plads === 'S' && m.melding !== 'P');
  if (!aabning) return null;
  const s = g.haender.S;
  const t = trumf(g.kontrakt);
  const farve = t ?? [...FARVER].sort((a, b) => laengde(s, b) - laengde(s, a))[0];
  return opgave(g, {
    plads: 'E',
    farve,
    spillet: [],
    brugerHp: true,
    sporgsmaal: {},
    facit: { type: 'interval', min: p.min, max: p.max },
    forklaring: forklarPoint({
      egne: hcpOf(g.haender.E),
      bordets: hcpOf(g.haender.N),
      total: p.total,
      syd: tilladt(g.meldeforloeb, 'S'),
      aabning: meldingTekst(aabning.melding, 'da'),
      vestPas: g.meldeforloeb.meldinger.some((m) => m.plads === 'W' && m.hp !== undefined),
      min: p.min,
      max: p.max,
    }),
  });
}

// ---------------------------------------------------------------- øvelse 2 og 3: regel 11 og 12 og længden

/** Udspillet i øvelse 2 og 3: et entydigt lavt kort efter metoden fra en farve med mindst metodens mindste længde. */
function lavtUdspilI(g: Grundlag, farve: number, art: Kontraktart, kraevHonnoer: boolean): number | null {
  const h = iFarven(g.haender.W, farve);
  if (h.length < regel(g.profil, udspilKategori(art), art).mindsteLaengde) return null;
  if (kraevHonnoer && !h.some((v) => v >= 11)) return null;
  const mulige = muligeUdspil(h, art, g.profil);
  const lav = lavtUdspil(faldende(h), art, g.profil);
  return mulige.length === 1 && mulige[0] === lav ? lav : null;
}

function udspilsopgave(g: Grundlag): ModspilOpgave | null {
  const regel11 = g.ovelse === 'regel11';
  const art = kontraktart(g.kontrakt);
  const kategoriId = udspilKategori(art);
  // Med 4.-højeste har Vest altid tre kort over udspillet, så regel 11 kan altid afgøres.
  if (regel11 && g.maal === 'uklar' && regel(g.profil, kategoriId, art).kortOver !== null) return null;
  const t = trumf(g.kontrakt);
  // Regel 11 og 12 på niveau 1–3: udspillet er fra en farve med honnør (specens "Regel 11 og småkort").
  const kraevHonnoer = regel11 && g.niveau < HP_FRA_NIVEAU;
  const farver = FARVER.filter((f) => f !== t && lavtUdspilI(g, f, art, kraevHonnoer) !== null);
  if (!farver.length) return null;
  const farve = valg(g.rng, farver);
  const udspil = lavtUdspilI(g, farve, art, kraevHonnoer)!;
  const s: Udspilssituation = { kontrakt: g.kontrakt, udspil, oest: iFarven(g.haender.E, farve), bord: iFarven(g.haender.N, farve) };
  const brugerHp = g.niveau >= HP_FRA_NIVEAU;
  const krav = brugerHp ? hpKrav(g.haender, g.meldeforloeb, farve) : undefined;
  const m = metode(kategoriId, gaeldendeId(g.profil, kategoriId, art));
  const faelles = {
    plads: 'E' as const,
    farve,
    spillet: [{ plads: 'W' as const, kort: kortAf(farve, udspil) }],
    brugerHp,
    sporgsmaal: {},
    metode: gaeldende(g.profil, kategoriId, art),
  };
  if (regel11) {
    const a = analyserRegel11(s, g.profil, krav);
    if (!passerMaal(a.facit, g.maal)) return null;
    const hpAfgjorde = krav !== undefined && a.facit.type === 'tal' && analyserRegel11(s, g.profil).facit.type !== 'tal';
    if (!brugerHp) return opgave(g, { ...faelles, facit: a.facit, forklaring: forklarRegel11(m, farve, udspil, a, undefined, false) });
    const hvilke: Facit = a.facit.type === 'tal' && a.hvilke ? { type: 'kort', kort: a.hvilke.map((v) => kortAf(farve, v)) } : kanIkkeAfgoeres();
    return opgave(g, { ...faelles, facit: a.facit, hvilke, forklaring: forklarRegel11(m, farve, udspil, a, hvilke, hpAfgjorde) });
  }
  const laengder = muligeLaengder(s, g.profil, krav);
  const facit: Facit = laengder.length <= 2 ? { type: 'laengder', laengder } : kanIkkeAfgoeres();
  if (!passerMaal(facit, g.maal)) return null;
  const hpAfgjorde = krav !== undefined && muligeLaengder(s, g.profil).join() !== laengder.join();
  return opgave(g, { ...faelles, facit, forklaring: forklarLaengde(m, farve, udspil, laengder, hpAfgjorde) });
}

// ---------------------------------------------------------------- øvelse 4 og 5: tilspillet

/**
 * Et entydigt honnørudspil (B eller højere) fra Vests honnørsekvens i farven, og bordet har et lavere kort at lægge.
 * Kun honnørmetoden bruges, så metoden for kald eller afvisning ikke påvirker fordelingen (accepttest 7a).
 */
function honnoerUdspilI(g: Grundlag, farve: number, art: Kontraktart): number | null {
  const h = honnoerUdspil(iFarven(g.haender.W, farve), art, g.profil);
  if (typeof h !== 'number' || h < 11) return null;
  const bord = iFarven(g.haender.N, farve);
  return bord.length && Math.min(...bord) < h ? h : null;
}

/** De to andre farver til romersk kald: hverken udspilsfarven eller trumf. */
const andreTil = (kontrakt: Kontrakt, farve: number) => andreFarver(trumf(kontrakt) ?? -1, farve);

function markering(g: Grundlag): ModspilOpgave | null {
  const art = kontraktart(g.kontrakt);
  const t = trumf(g.kontrakt);
  const farver = FARVER.filter((f) => {
    if (f === t) return false;
    const h = honnoerUdspilI(g, f, art);
    return h !== null && iFarven(g.haender.E, f).some((v) => v < h);
  });
  if (!farver.length) return null;
  const farve = valg(g.rng, farver);
  const udspil = honnoerUdspilI(g, farve, art)!;
  const vest = iFarven(g.haender.W, farve);
  const bord = iFarven(g.haender.N, farve);
  const under = iFarven(g.haender.E, farve)
    .filter((v) => v < udspil)
    .sort((a, b) => a - b);
  // Niveau 2 har klare kort: Østs laveste eller højeste kort under udspillet.
  const kandidater = g.niveau <= 2 ? [...new Set([under[0], under[under.length - 1]])] : under;
  const vurderet = kandidater
    .map((v) => ({ v, d: aflaesTilspilDetaljer({ kontrakt: g.kontrakt, udspiller: vest, udspil, bord, tilspil: v }, g.profil) }))
    .filter((x) => passerMaal(x.d.facit, g.maal));
  if (!vurderet.length) return null;
  const { v, d } = valg(g.rng, vurderet);
  const honnoerMetode = metode('honnoerudspil', gaeldendeId(g.profil, 'honnoerudspil', art));
  return opgave(g, {
    plads: 'W',
    farve,
    spillet: [
      { plads: 'W', kort: kortAf(farve, udspil) },
      { plads: 'N', kort: kortAf(farve, Math.min(...bord)) },
      { plads: 'E', kort: kortAf(farve, v) },
    ],
    brugerHp: false,
    sporgsmaal: {},
    metode: d.metode,
    facit: d.facit,
    forklaring: forklarTilspil(metode(d.metode.kategori, d.metode.id), honnoerMetode, farve, v, d, andreTil(g.kontrakt, farve)),
  });
}

function vaelgKort(g: Grundlag): ModspilOpgave | null {
  const art = kontraktart(g.kontrakt);
  const t = trumf(g.kontrakt);
  const oenskerI = (f: number): Signal[] => {
    if (f === t) return [];
    const h = honnoerUdspilI(g, f, art);
    const oest = iFarven(g.haender.E, f);
    if (h === null || oest.length < 2) return [];
    return muligeOensker(g.kontrakt, h, oest, g.profil);
  };
  const farver = FARVER.filter((f) => oenskerI(f).length > 0);
  if (!farver.length) return null;
  const farve = valg(g.rng, farver);
  const onske = valg(g.rng, oenskerI(farve));
  const udspil = honnoerUdspilI(g, farve, art)!;
  const oest = iFarven(g.haender.E, farve);
  const bord = iFarven(g.haender.N, farve);
  const vaerdi = vaelgTilspil({ kontrakt: g.kontrakt, udspil, oest, onske }, g.profil);
  const romersk = tilspilsart(g.kontrakt, udspil, g.profil) === 'romersk';
  const noedloesning = romersk && onske !== 'kald' && !oest.some((v) => v % 2 === 0 && v <= 10);
  const hoejt = vaerdi !== Math.min(...oest);
  return opgave(g, {
    plads: 'E',
    farve,
    spillet: [
      { plads: 'W', kort: kortAf(farve, udspil) },
      { plads: 'N', kort: kortAf(farve, Math.min(...bord)) },
    ],
    brugerHp: false,
    sporgsmaal: { onske },
    metode: gaeldende(g.profil, 'kald', art),
    facit: { type: 'kort', kort: [kortAf(farve, vaerdi)] },
    forklaring: forklarVaelgTilspil(metode('kald', gaeldendeId(g.profil, 'kald', art)), romersk, onske, farve, vaerdi, noedloesning, andreTil(g.kontrakt, farve), hoejt),
  });
}

// ---------------------------------------------------------------- øvelse 6 og 7: spilførers farve

/**
 * Spilførers farve: mod farve trumf, mod sans en farve, hvor Nord–Syd har mindst syv kort. `passer` afgør, om
 * længderne giver opgaven.
 */
function spilfoerersFarver(g: Grundlag, passer: (f: number) => boolean): number[] {
  const t = trumf(g.kontrakt);
  return FARVER.filter((f) => (t !== null ? f === t : laengde(g.haender.N, f) + laengde(g.haender.S, f) >= 7) && passer(f));
}

/** Kortene i farven pr. plads, stigende, til at spille runder: Syd spiller sit højeste, de andre deres laveste. */
function stikIFarven(g: Grundlag, farve: number): Record<Seat, Card[]> {
  const kort = (p: Seat) => g.haender[p].filter((c) => farveAf(c) === farve).sort((a, b) => a - b);
  return { N: kort('N'), E: kort('E'), S: kort('S'), W: kort('W') };
}

const RUNDE: readonly Seat[] = ['S', 'W', 'N', 'E'];

function afkast(g: Grundlag): ModspilOpgave | null {
  const plads: 'W' | 'E' = g.rng.int(2) ? 'E' : 'W';
  // Kun Vælg afkastet kan være tvetydig; aflæsningen af makkers afkast er altid klar.
  const variant: 'aflaes' | 'vaelg' = g.maal === 'uklar' || g.rng.int(2) ? 'vaelg' : 'aflaes';
  // Den, der ikke kan bekende: makker, når brugeren aflæser, og brugeren selv, når han vælger.
  const viser = variant === 'aflaes' ? makker(plads) : plads;
  const anden = makker(viser);
  const l = (p: Seat, f: number) => laengde(g.haender[p], f);
  const farver = spilfoerersFarver(g, (f) => l(anden, f) > l(viser, f) && l('S', f) > l(viser, f) && l('N', f) > l(viser, f));
  if (!farver.length) return null;
  const sf = valg(g.rng, farver);
  const runder = l(viser, sf) + 1;
  const tilbage = stikIFarven(g, sf);
  const spillet: SpilletKort[] = [];
  spil: for (let r = 0; r < runder; r++) {
    for (const p of RUNDE) {
      if (p === viser && r === runder - 1) break spil;
      spillet.push({ plads: p, kort: p === 'S' ? tilbage.S.pop()! : tilbage[p].shift()! });
    }
  }
  const art = kontraktart(g.kontrakt);
  const l2 = afkastlaesning(g.kontrakt, g.profil);
  const grundlag: AfkastGrundlag = {
    m: metode('afkast', gaeldendeId(g.profil, 'afkast', art)),
    kald: l2.viaKald ? metode('kald', gaeldendeId(g.profil, 'kald', art)) : undefined,
    laesning: l2.laesning,
    viaKald: l2.viaKald,
    hoejtErKald: l2.hoejtErKald,
  };
  const faelles = { plads, farve: sf, brugerHp: false, metode: gaeldende(g.profil, 'afkast', art) };
  if (variant === 'aflaes') {
    const muligt = g.haender[viser].filter((c) => farveAf(c) !== sf && vaerdiAf(c) <= 10);
    if (!muligt.length) return null;
    const afkastet = valg(g.rng, muligt);
    const f = farveAf(afkastet);
    // Brugeren læser afkastet og kan se sin egen hånd, bordet og de kort, der er spillet før afkastet.
    const synlige = [...iFarven(g.haender[plads], f), ...iFarven(g.haender.N, f), ...iFarven(spillet.map((k) => k.kort), f)];
    const d = aflaesAfkastDetaljer({ kontrakt: g.kontrakt, kort: vaerdiAf(afkastet), synlige }, g.profil);
    return opgave(g, {
      ...faelles,
      spillet: [...spillet, { plads: viser, kort: afkastet }],
      sporgsmaal: { variant },
      facit: d.facit,
      forklaring: forklarAflaesAfkast(grundlag, f, vaerdiAf(afkastet), d, afkastetsFarve(d.signal, f, sf)),
    });
  }
  const haand = g.haender[plads].filter((c) => farveAf(c) !== sf);
  // Brugeren ser bordet og de spillede kort ud over sin hånd; makker læser afkastet.
  const synlige = [...g.haender.N, ...spillet.map((k) => k.kort)];
  // Klare opgaver har et entydigt kort; tvetydige har intet, men mindst ét kort, der kan læses rigtigt.
  const detaljerTil = (f: number) => vaelgAfkastDetaljer({ kontrakt: g.kontrakt, spilfoerersFarve: sf, haand, synlige, onske: f }, g.profil);
  const oensker = FARVER.filter((f) => {
    if (f === sf) return false;
    const { facit } = detaljerTil(f);
    return facit.kort.length > 0 && passerMaal(facit, g.maal);
  });
  if (!oensker.length) return null;
  const onske = valg(g.rng, oensker);
  const { facit, andel } = detaljerTil(onske);
  return opgave(g, {
    ...faelles,
    spillet,
    sporgsmaal: { variant, onske },
    facit,
    forklaring: forklarVaelgAfkast(grundlag, onske, facit.kort, facit.tvetydig ? andel : undefined),
  });
}

function forsinket(g: Grundlag): ModspilOpgave | null {
  const plads: 'W' | 'E' = g.rng.int(2) ? 'E' : 'W';
  const variant: 'aflaes' | 'vaelg' = g.rng.int(2) ? 'vaelg' : 'aflaes';
  const mak = makker(plads);
  const l = (p: Seat, f: number) => laengde(g.haender[p], f);
  const farver = spilfoerersFarver(g, (f) =>
    variant === 'aflaes'
      ? l(mak, f) >= 2 && l(plads, f) >= 2 && l('S', f) >= 2 && l('N', f) >= 2
      : l(plads, f) >= 2 && l('S', f) >= 1 && l('N', f) >= 1 && (plads === 'W' || l('W', f) >= 1),
  );
  if (!farver.length) return null;
  const sf = valg(g.rng, farver);
  const art = kontraktart(g.kontrakt);
  const m = metode('forsinket', gaeldendeId(g.profil, 'forsinket', art));
  const faelles = { plads, farve: sf, brugerHp: false, metode: gaeldende(g.profil, 'forsinket', art) };
  const tilbage = stikIFarven(g, sf);
  if (variant === 'aflaes') {
    // Makker vælger passivt (lav-høj) eller aktivt (høj-lav med det højeste kort under B først).
    const hans = tilbage[mak];
    const smaa = hans.filter((c) => vaerdiAf(c) <= 10);
    const aktiv = smaa.length >= 2 && g.rng.int(2) === 1;
    const plan = aktiv ? [smaa[smaa.length - 1], hans[0]] : [hans[0], hans[1]];
    tilbage[mak] = hans.filter((c) => !plan.includes(c));
    const spillet: SpilletKort[] = [];
    for (let r = 0; r < 2; r++) {
      for (const p of RUNDE) spillet.push({ plads: p, kort: p === mak ? plan[r] : p === 'S' ? tilbage.S.pop()! : tilbage[p].shift()! });
    }
    const [a, b] = plan.map(vaerdiAf);
    return opgave(g, {
      ...faelles,
      spillet,
      sporgsmaal: { variant },
      facit: aflaesForsinket(a, b, g.profil),
      forklaring: forklarAflaesForsinket(m, sf, a, b),
    });
  }
  const holding = iFarven(g.haender[plads], sf);
  const oensker: ('passiv' | 'aktiv')[] = holding.filter((v) => v <= 10).length >= 2 ? ['passiv', 'aktiv'] : ['passiv'];
  const onske = valg(g.rng, oensker);
  const vaerdi = vaelgForsinket(holding, onske, g.profil);
  const spillet: SpilletKort[] = [];
  for (const p of RUNDE) {
    if (p === plads) break;
    spillet.push({ plads: p, kort: p === 'S' ? tilbage.S.pop()! : tilbage[p].shift()! });
  }
  return opgave(g, {
    ...faelles,
    spillet,
    sporgsmaal: { variant, onske },
    facit: { type: 'kort', kort: [kortAf(sf, vaerdi)] },
    forklaring: forklarVaelgForsinket(m, sf, vaerdi, onske),
  });
}

const BYGGERE: Readonly<Record<Ovelse, (g: Grundlag) => ModspilOpgave | null>> = {
  point,
  regel11: udspilsopgave,
  laengde: udspilsopgave,
  markering,
  'vaelg-kort': vaelgKort,
  afkast,
  forsinket,
};
