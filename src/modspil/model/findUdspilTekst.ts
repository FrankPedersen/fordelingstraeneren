import type { Card } from '../../domain/cards';
import type { Tekst } from './forklaring';
import type { FarveRaekke, SituationId } from './findUdspil';
import { eller, kontraktTekst, kortTekst, og, SYMBOLER, valoer, type Sprog } from './tekst';

/**
 * Teksterne til øvelse 8, "Find udspillet" (SPEC-modspil-v2.md, trin 2, Facit og forklaringen): "Ved bordet" og
 * indledningen pr. situation og skabelonerne til forklaringen og dommen. Dansk og engelsk, beskrivende form og husets
 * ord. Kompendiet omskrives med siden og citeres ikke; teksterne står i specen under "Tekster til gennemgang", som
 * Frank godkender før fletning.
 *
 * Engelsk står i felter, der hedder `en`, eller i grenen `sprog === 'en'`, så sprogtjekket (`src/sprog/danskTekst.ts`)
 * kun læser den danske tekst.
 */

/** "Ved bordet": én omskrivning af Kompendiets råd pr. situation. */
export const VED_BORDET: Readonly<Record<SituationId, Tekst>> = {
  'S1-1nt-3nt': {
    da: 'Mod 1NT – 3NT spilles der normalt ud i en major, og den korteste major er ofte bedst. En kort major er et bedre udspil end en firefarve i minor med en eller to honnører.',
    en: 'Against 1NT – 3NT the lead is normally a major, and the shorter major is often best. A short major is a better lead than a four-card minor with one or two honours.',
  },
  'S2-stayman': {
    da: 'Et svar på 2♦ efter Stayman betyder ofte, at spilføreren har minorfarverne. Udspillet er derfor normalt i en major, gerne den korteste og også fra en singleton.',
    en: 'A 2♦ answer to Stayman often means that declarer holds the minors. The lead is therefore normally a major, preferably the shorter one and even from a singleton.',
  },
  'S3-transfer': {
    da: 'Udspil i bordets viste femfarve i ♥ betaler sig sjældent; kun en dyb sekvens som D B 10 9 3 gør det til et godt valg. Blandt de andre farver er ♠ en anelse bedre end minorfarverne, fordi modspillet tit har syv kort i den anden major.',
    en: "A lead in dummy's five-card heart suit rarely pays; only a deep sequence such as Q J 10 9 3 makes it a good choice. Among the other suits spades are slightly better than the minors, because the defence often holds seven cards in the other major.",
  },
  'S4-kun-en-farve': {
    da: 'Når kun trumffarven er meldt, er en singleton i en sidefarve et stærkt udspil, og en doubleton er bedre end sit rygte. Bordet er svagt, så småkort er bedre end en farve med en eller to honnører, og trumf ud kommer først på tale, når ingen sidefarve frister.',
    en: 'When only the trump suit has been bid, a singleton in a side suit is a strong lead, and a doubleton is better than its reputation. Dummy is weak, so small cards are better than a suit with one or two honours, and a trump lead only comes into question when no side suit appeals.',
  },
  'S5-sidefarve': {
    da: 'En singleton i en sidefarve er førstevalget, også i bordets ♥. Ellers er de umeldte farver ♦ og ♣ bedst, helst fra småkort frem for fra honnører, medmindre udspilleren har en trekorts honnørsekvens som K D B. Med esset og fire eller fem kort i bordets ♥ kan esset også være et godt udspil.',
    en: "A singleton in a side suit is the first choice, even in dummy's hearts. Otherwise the unbid suits, diamonds and clubs, are best, preferably from small cards rather than from honours, unless the leader holds a three-card honour sequence such as K Q J. With the ace and four or five cards in dummy's hearts the ace can also be a good lead.",
  },
  'S6-trumf': {
    da: 'Syd har vist ♥ og ♣, og Nord er kort i ♥, så bordet kan trumfe Syds hjerter. Trumf ud fjerner bordets trumfer og kan derfor være et stærkt udspil.',
    en: "South has shown hearts and clubs, and North is short in hearts, so dummy can ruff South's hearts. A trump lead removes dummy's trumps and can therefore be a strong lead.",
  },
  'S7-makker-aabnet': {
    da: 'Når makker har åbnet med 1♥, er makkers farve næsten altid det rigtige udspil med to kort eller flere i ♥. Med singleton ♥ kræver et andet udspil en stærk sekvens som K D B eller K D 10.',
    en: "When partner has opened 1♥, partner's suit is almost always the right lead with two or more hearts. With a singleton heart another lead needs a strong sequence such as K Q J or K Q 10.",
  },
  'S8-delkontrakt': {
    da: 'Mod en delkontrakt, hvor Nord har vist firekortsstøtte, er en singleton næsten altid det rigtige udspil, og en doubleton uden honnører er bedre end sit rygte. E x og D x er værd at overveje, mens trumf ud ofte er det svageste valg.',
    en: 'Against a part score where North has shown four-card support, a singleton is almost always the right lead, and a doubleton without honours is better than its reputation. A x and Q x are worth considering, while a trump lead is often the weakest choice.',
  },
};

/** Indledningen til forklaringen: meldeforløbet (situationens navn) og det, det viser. */
export const INDLEDNING: Readonly<Record<SituationId, Tekst>> = {
  'S1-1nt-3nt': {
    da: 'Efter 1NT – 3NT har Syd 15–17 hp og en jævn hånd, og Nord har ikke søgt et fit i major.',
    en: 'After 1NT – 3NT South has 15–17 HCP and a balanced hand, and North has not looked for a major fit.',
  },
  'S2-stayman': {
    da: 'Efter 1NT – 2♣ – 2♦ – 3NT har Syd ingen firefarve i major, mens Nord har en, så spilføreren har ofte minorfarverne.',
    en: 'After 1NT – 2♣ – 2♦ – 3NT South has no four-card major while North has one, so declarer often holds the minors.',
  },
  'S3-transfer': {
    da: 'Efter 1NT – 2♦ – 2♥ – 3NT har Nord vist fem ♥, og Syd har valgt sans.',
    en: 'After 1NT – 2♦ – 2♥ – 3NT North has shown five hearts, and South has chosen notrump.',
  },
  'S4-kun-en-farve': {
    da: 'Efter 1♥ – 2♥ – 4♥ er kun trumffarven meldt, og bordet er svagt: Nord har vist 6–9 hp med støtte.',
    en: 'After 1♥ – 2♥ – 4♥ only the trump suit has been bid, and dummy is weak: North has shown 6–9 HCP with support.',
  },
  'S5-sidefarve': {
    da: 'Efter 1♠ – 2♥ – 2♠ – 4♠ har bordet vist en femfarve i ♥ og støtte i ♠.',
    en: 'After 1♠ – 2♥ – 2♠ – 4♠ dummy has shown five hearts and spade support.',
  },
  'S6-trumf': {
    da: 'Efter 1♥ – 1♠ – 2♣ – pas har Syd vist ♥ og ♣, og Nord foretrækker ♣ og er kort i ♥.',
    en: 'After 1♥ – 1♠ – 2♣ – pass South has shown hearts and clubs, and North prefers clubs and is short in hearts.',
  },
  'S7-makker-aabnet': {
    da: 'Efter 1♥ – 1NT – pas – 3NT har makker åbnet med 1♥, og Syd har vist hold i ♥.',
    en: 'After 1♥ – 1NT – pass – 3NT partner has opened 1♥, and South has shown a heart stopper.',
  },
  'S8-delkontrakt': {
    da: 'Efter 1♠ – 3♠ spiller Syd en delkontrakt, og Nord har vist firekortsstøtte.',
    en: 'After 1♠ – 3♠ South plays a part score, and North has shown four-card support.',
  },
};

// ---------------------------------------------------------------- tal og kort

/** Middelstikket med én decimal, rundet halvt op fra hundrededele: 4,05 → 4,1 (på engelsk 4.1). */
export function tiendedele(middel: number, sprog: Sprog): string {
  const t10 = Math.floor((Math.round(middel * 100) + 5) / 10);
  return `${Math.floor(t10 / 10)}${sprog === 'en' ? '.' : ','}${t10 % 10}`;
}

/** To decimaler: 0,15 (på engelsk 0.15). */
function hundrededele(x: number, sprog: Sprog): string {
  const tal = (Math.round(x * 100) / 100).toFixed(2);
  return sprog === 'en' ? tal : tal.replace('.', ',');
}

/** Chancen for at sætte i hele procent, rundet halvt op. */
export const procent = (saet: number, n: number): number => Math.floor((200 * saet + n) / (2 * n));
const pct = (saet: number, n: number, sprog: Sprog): string => `${procent(saet, n)}${sprog === 'en' ? '' : ' '}%`;

const farveAf = (c: Card) => Math.floor(c / 13);
const vaerdiAf = (c: Card) => (c % 13) + 2;

/** Vests kort i farven, højeste først: ♠K D 10 5 (på engelsk ♠K Q 10 5). */
export function holdingTekst(vest: readonly Card[], farve: number, sprog: Sprog): string {
  const v = vest.filter((c) => farveAf(c) === farve).map(vaerdiAf).sort((a, b) => b - a);
  return `${SYMBOLER[farve]}${v.map((x) => valoer(x, sprog)).join(' ')}`;
}

/** Siden i Kompendiet: "s. 14" eller "s. 11–12"; på engelsk "p. 14" eller "pp. 11–12". */
export const sideTekst = (sider: readonly number[], sprog: Sprog): string =>
  `${sprog === 'en' ? (sider.length > 1 ? 'pp.' : 'p.') : 's.'} ${sider.join('–')}`;

/** Profilens navn i en engelsk sætning: "the Standard profile", "the Compendium profile". */
const profilEn = (navnEn: string) => `the ${navnEn.replace(/^The /, '')} profile`;

// ---------------------------------------------------------------- forklaringens sætninger

export interface TalRaekke extends FarveRaekke {
  /** Kortet, der giver farvens værdi. */
  vaerdikort: Card;
}

const hoejestFoerst = (raekker: readonly TalRaekke[]) =>
  [...raekker].sort((a, b) => Math.round(b.middel * 100) - Math.round(a.middel * 100) || a.farve - b.farve);

/**
 * Tallene: den bedste farve (eller de lige gode) med middelstik og chancen for at sætte og den næstbedste til
 * sammenligning. Med svar i kort står kortet, der giver værdien, i stedet for farven. Er opgaven tæt (forspring under
 * 0,2 stik), siger den sidste sætning det.
 */
export function talSaetning(raekker: readonly TalRaekke[], rigtige: readonly number[], klar: boolean, kontrakt: string, n: number, medKort: boolean): Tekst {
  const sorteret = hoejestFoerst(raekker);
  const navn = (r: TalRaekke, sprog: Sprog) => (medKort ? kortTekst(r.vaerdikort, sprog) : SYMBOLER[r.farve]);
  const k = kontraktTekst(kontrakt);
  const [bedst, ...resten] = sorteret;
  const hoved = {
    da: `${navn(bedst, 'da')} giver i gennemsnit ${tiendedele(bedst.middel, 'da')} stik til modspillet og sætter ${k} i ${pct(bedst.saet, n, 'da')} af fordelingerne`,
    en: `${navn(bedst, 'en')} gives the defence ${tiendedele(bedst.middel, 'en')} tricks on average and defeats ${k} in ${pct(bedst.saet, n, 'en')} of the deals`,
  };

  if (rigtige.length > 1) {
    const lige = sorteret.filter((r) => rigtige.includes(r.farve));
    const andre = lige.slice(1);
    return {
      da: `${og(lige.map((r) => navn(r, 'da')), 'da')} er lige gode (under 0,1 stik fra den bedste): ${hoved.da}, ${andre.map((r) => `${navn(r, 'da')} ${tiendedele(r.middel, 'da')} stik og ${pct(r.saet, n, 'da')}`).join(', ')}.`,
      en: `${og(lige.map((r) => navn(r, 'en')), 'en')} are equally good (within 0.1 tricks of the best): ${hoved.en}, ${andre.map((r) => `${navn(r, 'en')} ${tiendedele(r.middel, 'en')} tricks and ${pct(r.saet, n, 'en')}`).join(', ')}.`,
    };
  }
  const naest = resten[0];
  if (!naest) return { da: `${hoved.da}.`, en: `${hoved.en}.` };
  const tal = {
    da: `${hoved.da}; ${navn(naest, 'da')} giver ${tiendedele(naest.middel, 'da')} stik og ${pct(naest.saet, n, 'da')}.`,
    en: `${hoved.en}; ${navn(naest, 'en')} gives ${tiendedele(naest.middel, 'en')} tricks and ${pct(naest.saet, n, 'en')}.`,
  };
  if (klar) return tal;
  const forspring = (Math.round(bedst.middel * 100) - Math.round(naest.middel * 100)) / 100;
  return {
    da: `${tal.da} Forspringet til ${navn(naest, 'da')} er kun ${hundrededele(forspring, 'da')} stik.`,
    en: `${tal.en} The margin over ${navn(naest, 'en')} is only ${hundrededele(forspring, 'en')} tricks.`,
  };
}

export interface KortGrundlag {
  vest: readonly Card[];
  farve: number;
  /** Profilens kort i farven, stigende (to ved "table feeling"). */
  kort: readonly Card[];
  /** Profilerne spiller ikke alle samme kort fra farven. */
  profilenSkifter: boolean;
  profilNavn: { tekst: string; tekstEn: string };
  metode: { tekst: string; tekstEn: string };
}

/**
 * Kortet i en rigtig farve med svar i kort: "table feeling" giver to rigtige kort, og skifter profilen kortet, nævnes
 * profilen og metoden ("Med profilen Kompendiet spilles ♥D ud fra ♥K D 10 5 (ALA mod sans).").
 */
export function kortSaetning(g: KortGrundlag): Tekst | null {
  const faldende = [...g.kort].sort((a, b) => b - a);
  const kort = { da: faldende.map((c) => kortTekst(c, 'da')), en: faldende.map((c) => kortTekst(c, 'en')) };
  const h = { da: holdingTekst(g.vest, g.farve, 'da'), en: holdingTekst(g.vest, g.farve, 'en') };
  if (faldende.length === 2) {
    return g.profilenSkifter
      ? {
          da: `Med profilen ${g.profilNavn.tekst} afgøres udspillet fra ${h.da} mod sans af "table feeling" (${g.metode.tekst}): ${kort.da[0]} og ${kort.da[1]} er begge rigtige.`,
          en: `With ${profilEn(g.profilNavn.tekstEn)} the lead from ${h.en} against notrump is a matter of table feeling (${g.metode.tekstEn}): ${kort.en[0]} and ${kort.en[1]} are both right.`,
        }
      : {
          da: `Fra ${h.da} mod sans afgøres udspillet af "table feeling": ${kort.da[0]} og ${kort.da[1]} er begge rigtige.`,
          en: `From ${h.en} against notrump the lead is a matter of table feeling: ${kort.en[0]} and ${kort.en[1]} are both right.`,
        };
  }
  if (!g.profilenSkifter) return null;
  return {
    da: `Med profilen ${g.profilNavn.tekst} spilles ${kort.da[0]} ud fra ${h.da} (${g.metode.tekst}).`,
    en: `With ${profilEn(g.profilNavn.tekstEn)} ${kort.en[0]} is led from ${h.en} (${g.metode.tekstEn}).`,
  };
}

/** En regel for Kompendiets råd, som den står i situationsfilen. */
export interface RaadRegel {
  udvalg: 'farver' | 'korteste' | 'laengde' | 'udenHonnoer' | 'staerkSekvens';
  blandt: string[];
  laengde?: number;
  hvis?: { min?: Record<string, number>; max?: Record<string, number>; dybSekvens?: string };
}

const symbol = (f: string) => SYMBOLER['SHDC'.indexOf(f)];

/** Små tal som ord: "to kort" (på engelsk "two cards"); fra 13 tallet. */
const TAL = {
  da: ['nul', 'et', 'to', 'tre', 'fire', 'fem', 'seks', 'syv', 'otte', 'ni', 'ti', 'elleve', 'tolv'],
  en: ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'],
};
const talOrd = (n: number) => ({ da: TAL.da[n] ?? String(n), en: TAL.en[n] ?? String(n) });

interface Anbefaling {
  hvad: string;
  her: string;
}

/** Hvad Kompendiet anbefaler efter reglen, der gav rådet (uden "efter dette forløb"), og en tilføjelse til sidst. */
function anbefaling(regel: RaadRegel, farver: readonly number[], trumf: number | null): { da: Anbefaling; en: Anbefaling } {
  const liste = { da: eller(farver.map((f) => SYMBOLER[f]), 'da'), en: eller(farver.map((f) => SYMBOLER[f]), 'en') };
  const her = { da: `, her ${liste.da}`, en: `, here ${liste.en}` };
  switch (regel.udvalg) {
    case 'laengde':
      return regel.laengde === 1
        ? { da: { hvad: 'udspil fra en singleton i en sidefarve', her: her.da }, en: { hvad: 'a lead from a singleton in a side suit', her: her.en } }
        : { da: { hvad: 'udspil fra en doubleton i en sidefarve', her: her.da }, en: { hvad: 'a lead from a doubleton in a side suit', her: her.en } };
    case 'udenHonnoer':
      return { da: { hvad: 'udspil i en sidefarve uden honnør', her: her.da }, en: { hvad: 'a lead in a side suit without an honour', her: her.en } };
    case 'staerkSekvens':
      return { da: { hvad: 'udspil i en farve med en stærk sekvens', her: her.da }, en: { hvad: 'a lead in a suit with a strong sequence', her: her.en } };
    case 'korteste': {
      const blandt = regel.blandt.map(symbol);
      return {
        da: { hvad: `udspil i den korteste af ${eller(blandt, 'da')}`, her: her.da },
        en: { hvad: `a lead in the shorter of ${eller(blandt, 'en')}`, her: her.en },
      };
    }
    case 'farver': {
      if (trumf !== null && regel.blandt.length === 1 && farver.length === 1 && farver[0] === trumf) {
        return { da: { hvad: `trumfudspil (${liste.da})`, her: '' }, en: { hvad: `a trump lead (${liste.en})`, her: '' } };
      }
      const grunde: { da: string; en: string }[] = [];
      const dyb = regel.hvis?.dybSekvens;
      if (dyb) grunde.push({ da: `en dyb sekvens i ${symbol(dyb)}`, en: `a deep sequence in ${symbol(dyb)}` });
      for (const [f, n] of Object.entries(regel.hvis?.min ?? {})) grunde.push({ da: `mindst ${talOrd(n).da} kort i ${symbol(f)}`, en: `at least ${talOrd(n).en} cards in ${symbol(f)}` });
      for (const [f, n] of Object.entries(regel.hvis?.max ?? {})) grunde.push({ da: `højst ${talOrd(n).da} kort i ${symbol(f)}`, en: `at most ${talOrd(n).en} cards in ${symbol(f)}` });
      return {
        da: { hvad: `udspil i ${liste.da}`, her: grunde.length ? `, fordi hånden har ${og(grunde.map((g) => g.da), 'da')}` : '' },
        en: { hvad: `a lead in ${liste.en}`, her: grunde.length ? `, because the hand has ${og(grunde.map((g) => g.en), 'en')}` : '' },
      };
    }
  }
}

/**
 * Kompendiets råd med siden, og når opgaven afviger, at den bedste farve er en anden ("Kompendiet (s. 14) anbefaler
 * udspil i ♥ efter dette forløb, men med denne hånd giver ♠ flest stik."). Peger rådet ikke på nogen farve, Vest har,
 * siges det.
 */
export function raadSaetning(
  sider: readonly number[],
  regel: RaadRegel | null,
  farver: readonly number[],
  trumf: number | null,
  afviger: boolean,
  bedste: number,
): Tekst {
  const b = SYMBOLER[bedste];
  const side = { da: sideTekst(sider, 'da'), en: sideTekst(sider, 'en') };
  if (!regel || farver.length === 0) {
    return {
      da: `Kompendiets råd efter dette forløb (${side.da}) peger ikke på en farve, Vest har${afviger ? `, og med denne hånd giver ${b} flest stik` : ''}.`,
      en: `The Compendium's advice after this auction (${side.en}) points to no suit West holds${afviger ? `, and with this hand ${b} gives the most tricks` : ''}.`,
    };
  }
  const a = anbefaling(regel, farver, trumf);
  return {
    da: `Kompendiet (${side.da}) anbefaler ${a.da.hvad} efter dette forløb${a.da.her}${afviger ? `, men med denne hånd giver ${b} flest stik` : ''}.`,
    en: `The Compendium (${side.en}) recommends ${a.en.hvad} after this auction${a.en.her}${afviger ? `, but with this hand ${b} gives the most tricks` : ''}.`,
  };
}

// ---------------------------------------------------------------- tallene fra afsnit 7a (SPEC-udspilstal.md)

/** Én række fra `src/modspil/content/udspil/raadtal.json` (afsnit 7a i docs/MODEL.md). */
export interface RaadTal {
  raekke: string;
  situation: string | null;
  gruppe: string | null;
  n: number;
  forskel: number;
  saetForskel: number;
  dom: 'for-faa' | 'holder' | 'modsat' | 'ingen-forskel';
  udenPraktiskBetydning: boolean;
}

/** Hele `raadtal.json`: rækkerne og i S6 andelen af hænderne, hvor trumf er den bedste farve. */
export interface RaadTalFil {
  raekker: readonly RaadTal[];
  trumfBedst: { situation: string; n: number; andel: number };
}

/** Rækken i filen for hele rækken (ikke en gruppe): med situationen, eller samlet over situationerne (situation null). */
export const raadTalI = (fil: RaadTalFil, raekke: string, situation: SituationId, gruppe: string | null = null): RaadTal | undefined =>
  fil.raekker.find((r) => r.raekke === raekke && r.gruppe === gruppe && (r.situation === null || r.situation === situation));

/** Rækkerne med én B-farve i forklaringen. */
export type ParRaekke = 'P1' | 'P2' | 'P4' | 'P5' | 'P6' | 'P7';

/** P9's grupper: de to øverste honnører i Vests farve. */
export type ToppenGruppe = 'E K' | 'K D' | 'D B';

type Form = 'mere' | 'mindre' | 'lige';

/**
 * Formen afgøres alene af `dom` og `udenPraktiskBetydning`, som analysen har sat (specens formtabel); null ved for få
 * hænder. Teksten regner ingen grænse selv.
 */
function formAf(t: RaadTal): Form | null {
  if (t.dom === 'for-faa') return null;
  if (t.dom === 'ingen-forskel' || t.udenPraktiskBetydning) return 'lige';
  return t.dom === 'holder' ? 'mere' : 'mindre';
}

/** Et tal uden fortegn, afrundet som i afsnit 7a (`toFixed`); komma på dansk og punktum på engelsk. */
function decimal(x: number, decimaler: number, sprog: Sprog): string {
  const t = Math.abs(x).toFixed(decimaler);
  return sprog === 'en' ? t : t.replace('.', ',');
}

/**
 * Sætterchancen i procentpoint afrundet til én decimal, når den peger samme vej som stikkene og ikke afrundes til 0,0;
 * ellers null.
 */
function saetter(t: RaadTal): number | null {
  if (Math.sign(t.saetForskel) !== Math.sign(t.forskel)) return null;
  const y = Number(Math.abs(t.saetForskel).toFixed(1));
  return y === 0 ? null : y;
}

/** Sætterchancerne fra den mindste til den største ("0,8–0,9"), eller ét tal, når de er ens efter afrunding. */
function interval(xs: readonly number[], sprog: Sprog): string {
  const lav = Math.min(...xs);
  const hoej = Math.max(...xs);
  return lav === hoej ? decimal(lav, 1, sprog) : `${decimal(lav, 1, sprog)}–${decimal(hoej, 1, sprog)}`;
}

const MERE = { da: { mere: 'mere', mindre: 'mindre' }, en: { mere: 'more', mindre: 'fewer' } };
const OFTERE = { da: { mere: 'oftere', mindre: 'sjældnere' }, en: { mere: 'more', mindre: 'less' } };

/** A og B i forklaringen (specens navnetabel). */
const PAR_NAVNE: Readonly<Record<ParRaekke, { da: readonly [string, string]; en: readonly [string, string] }>> = {
  P1: { da: ['en kort major', 'en firefarve i minor med en eller to honnører'], en: ['a short major', 'a four-card minor with one or two honours'] },
  P2: { da: ['den korteste major', 'den længste'], en: ['the shorter major', 'the longer one'] },
  P4: { da: ['♥ uden dyb sekvens', '♠'], en: ['♥ without a deep sequence', '♠'] },
  P5: { da: ['singletonen', 'en sidefarve med småkort'], en: ['the singleton', 'a side suit with small cards'] },
  P6: { da: ['doubletonen uden honnør', 'en sidefarve med småkort'], en: ['the doubleton without an honour', 'a side suit with small cards'] },
  P7: { da: ['småkort i en sidefarve', 'en sidefarve med en eller to honnører'], en: ['small cards in a side suit', 'a side suit with one or two honours'] },
};

/**
 * Sætningen "Med dobbeltdummy …" sidst i forklaringen for en række med én B-farve: A giver mere eller mindre end B (med
 * sætterchancen, når den peger samme vej og ikke er 0,0), eller A og B er lige gode med forskellen uden fortegn; null
 * ved for få hænder.
 */
export function dobbeltdummySaetning(raekke: ParRaekke, tal: RaadTal): Tekst | null {
  const form = formAf(tal);
  if (form === null) return null;
  const { da: [a, b], en: [aEn, bEn] } = PAR_NAVNE[raekke];
  if (form === 'lige') {
    return {
      da: `Med dobbeltdummy er ${a} og ${b} lige gode efter dette forløb (forskel ${decimal(tal.forskel, 2, 'da')} stik).`,
      en: `With double dummy, ${aEn} and ${bEn} are equally good leads after this auction (difference ${decimal(tal.forskel, 2, 'en')} tricks).`,
    };
  }
  const y = saetter(tal);
  return {
    da: `Med dobbeltdummy giver ${a} efter dette forløb i gennemsnit ${decimal(tal.forskel, 2, 'da')} stik ${MERE.da[form]} end ${b}${y === null ? '' : ` og sætter kontrakten ${decimal(y, 1, 'da')} procentpoint ${OFTERE.da[form]}`}.`,
    en: `With double dummy, leading ${aEn} after this auction gives on average ${decimal(tal.forskel, 2, 'en')} ${MERE.en[form]} tricks than ${bEn}${y === null ? '' : ` and defeats the contract ${decimal(y, 1, 'en')} percentage points ${OFTERE.en[form]} often`}.`,
  };
}

/** Farver, der lægges sammen: samme form, samme stiktal med to decimaler og sætterchancen ved alle eller ingen. */
interface Gruppe {
  form: 'mere' | 'mindre';
  stik: number;
  saetter: number[] | null;
  farver: number[];
}

/**
 * Rækkerne med A mod hver farve (P8: trumf; P3: ♠) delt i grupper og lige gode. Farver med for få hænder udelades.
 * Grupperne står efter deres første farve i orden ♠ ♥ ♦ ♣.
 */
function grupper(raekker: readonly { farve: number; tal: RaadTal }[]): { grupper: Gruppe[]; lige: number[]; antal: number } {
  const ud: Gruppe[] = [];
  const lige: number[] = [];
  let antal = 0;
  for (const { farve, tal } of [...raekker].sort((x, y) => x.farve - y.farve)) {
    const form = formAf(tal);
    if (form === null) continue;
    antal++;
    if (form === 'lige') {
      lige.push(farve);
      continue;
    }
    const stik = Number(Math.abs(tal.forskel).toFixed(2));
    const y = saetter(tal);
    const g = ud.find((x) => x.form === form && x.stik === stik && (x.saetter === null) === (y === null));
    if (g) {
      g.farver.push(farve);
      if (y !== null) g.saetter!.push(y);
    } else ud.push({ form, stik, saetter: y === null ? null : [y], farver: [farve] });
  }
  return { grupper: ud, lige, antal };
}

const symboler = (farver: readonly number[], sprog: Sprog) => og(farver.map((f) => SYMBOLER[f]), sprog);

/**
 * P8 i forklaringen: én sætning med trumf som A mod hver sidefarve, fx "Med dobbeltdummy giver trumf efter dette forløb i
 * gennemsnit 0,07 stik mere end ♠ (sætter 2,7 procentpoint oftere) og 0,32 stik mere end ♥ (5,6 procentpoint oftere),
 * mens trumf og ♦ er lige gode." Kun den første sætterchance har "sætter". Er alle lige gode, siges kun det; null, når
 * alle farver har for få hænder.
 */
export function trumfSaetning(raekker: readonly { farve: number; tal: RaadTal }[]): Tekst | null {
  const g = grupper(raekker);
  if (g.antal === 0) return null;
  const lige = { da: og(['trumf', ...g.lige.map((f) => SYMBOLER[f])], 'da'), en: og(['a trump', ...g.lige.map((f) => SYMBOLER[f])], 'en') };
  if (g.grupper.length === 0) {
    return { da: `Med dobbeltdummy er ${lige.da} lige gode efter dette forløb.`, en: `With double dummy, ${lige.en} are equally good leads after this auction.` };
  }
  let foerste = true;
  const dele = g.grupper.map((x) => {
    let p = { da: '', en: '' };
    if (x.saetter) {
      p = {
        da: ` (${foerste ? 'sætter ' : ''}${interval(x.saetter, 'da')} procentpoint ${OFTERE.da[x.form]})`,
        en: ` (${foerste ? 'defeating the contract ' : ''}${interval(x.saetter, 'en')} percentage points ${OFTERE.en[x.form]} often)`,
      };
      foerste = false;
    }
    return {
      da: `${decimal(x.stik, 2, 'da')} stik ${MERE.da[x.form]} end ${symboler(x.farver, 'da')}${p.da}`,
      en: `${decimal(x.stik, 2, 'en')} ${MERE.en[x.form]} tricks than ${symboler(x.farver, 'en')}${p.en}`,
    };
  });
  const mens = g.lige.length ? { da: `, mens ${lige.da} er lige gode`, en: `, while ${lige.en} are equally good` } : { da: '', en: '' };
  return {
    da: `Med dobbeltdummy giver trumf efter dette forløb i gennemsnit ${og(dele.map((d) => d.da), 'da')}${mens.da}.`,
    en: `With double dummy, leading a trump after this auction gives on average ${og(dele.map((d) => d.en), 'en')}${mens.en}.`,
  };
}

const GRUPPE_EN: Readonly<Record<ToppenGruppe, string>> = { 'E K': 'A K', 'K D': 'K Q', 'D B': 'Q J' };

/**
 * Tilføjelsen til "table feeling" (P9): toppen mod det lave kort fra E K, K D eller D B. Giver toppen mere, står der, at
 * tallet er en øvre grænse; null ved for få hænder.
 */
export function toppenSaetning(gruppe: ToppenGruppe, tal: RaadTal): Tekst | null {
  const form = formAf(tal);
  if (form === null) return null;
  const g = { da: gruppe, en: GRUPPE_EN[gruppe] };
  if (form === 'lige') {
    return {
      da: `Med dobbeltdummy er toppen og det lave kort fra ${g.da} lige gode (forskel ${decimal(tal.forskel, 2, 'da')} stik).`,
      en: `With double dummy, the top card and the low card from ${g.en} are equally good (difference ${decimal(tal.forskel, 2, 'en')} tricks).`,
    };
  }
  const y = saetter(tal);
  const graense = form === 'mere';
  return {
    da: `Med dobbeltdummy giver toppen fra ${g.da} i gennemsnit ${decimal(tal.forskel, 2, 'da')} stik ${MERE.da[form]} end det lave kort${y === null ? '' : ` og sætter kontrakten ${decimal(y, 1, 'da')} procentpoint ${OFTERE.da[form]}`}${graense ? '; tallet er en øvre grænse, fordi dobbeltdummy overvurderer honnørudspil' : ''}.`,
    en: `With double dummy, leading the top card from ${g.en} gives on average ${decimal(tal.forskel, 2, 'en')} ${MERE.en[form]} tricks than the low card${y === null ? '' : ` and defeats the contract ${decimal(y, 1, 'en')} percentage points ${OFTERE.en[form]} often`}${graense ? '; the figure is an upper limit, because double dummy overrates honour leads' : ''}.`,
  };
}

// ---------------------------------------------------------------- sætningen sidst i "Ved bordet"

/** Leddets plads: først efter "Med dobbeltdummy" (omvendt ordstilling), i en liste eller efter "mens". */
type Plads = 'foerst' | 'liste' | 'mens';
type Led = { aktiv: boolean; tekst: (plads: Plads) => Tekst };
type Retning = 'A' | 'B' | null;

/** "dog" ("actually"), når A giver mere, men Kompendiet siger B, eller mindre, men Kompendiet siger A. */
const imod = (form: 'mere' | 'mindre', retning: Retning) => (form === 'mere' && retning === 'B') || (form === 'mindre' && retning === 'A');

const INGEN: Led = { aktiv: false, tekst: () => ({ da: '', en: '' }) };

/** Et led med én B-farve, kun stik: "giver singletonen 0,13 stik mere end småkort" eller "doubletonen og småkort er lige gode". */
function parLed(tal: RaadTal | undefined, navne: { da: readonly [string, string]; en: readonly [string, string] }, retning: Retning): Led {
  const form = tal ? formAf(tal) : null;
  if (!tal || form === null) return INGEN;
  const { da: [a, b], en: [aEn, bEn] } = navne;
  if (form === 'lige') {
    return { aktiv: true, tekst: (plads) => ({ da: plads === 'foerst' ? `er ${a} og ${b} lige gode` : `${a} og ${b} er lige gode`, en: `${aEn} and ${bEn} are equally good` }) };
  }
  const dog = imod(form, retning);
  const rest = { da: `${decimal(tal.forskel, 2, 'da')} stik ${MERE.da[form]} end ${b}`, en: `${decimal(tal.forskel, 2, 'en')} ${MERE.en[form]} tricks than ${bEn}` };
  return {
    aktiv: true,
    tekst: (plads) => ({
      da: plads === 'foerst' ? `giver ${a}${dog ? ' dog' : ''} ${rest.da}` : plads === 'liste' ? `${a} giver${dog ? ' dog' : ''} ${rest.da}` : `${a}${dog ? ' dog' : ''} giver ${rest.da}`,
      en: `leading ${aEn}${dog ? ' actually' : ''} gives ${rest.en}`,
    }),
  };
}

/**
 * Et led med A mod flere farver (P3: ♠ mod ♦ og ♣; P8: trumf mod sidefarverne), kun stik, med samme sammenlægning som
 * i forklaringen. Står alle farverne i én gruppe, bruges navnet `alle` ("minorfarverne", "hver sidefarve"). De lige gode
 * står sidst: først i sætningen ", mens trumf og ♦ er lige gode", ellers " og er lige så godt som ♣".
 */
function flereLed(
  a: { da: string; en: string },
  raekker: readonly { farve: number; tal: RaadTal }[],
  alle: { da: string; en: string },
  retning: Retning,
): Led {
  const g = grupper(raekker);
  if (g.antal === 0) return INGEN;
  const navn = (farver: readonly number[], sprog: Sprog) => (farver.length === raekker.length ? alle[sprog] : symboler(farver, sprog));
  const lige = { da: navn(g.lige, 'da'), en: navn(g.lige, 'en') };
  if (g.grupper.length === 0) {
    return { aktiv: true, tekst: (plads) => ({ da: plads === 'foerst' ? `er ${a.da} og ${lige.da} lige gode` : `${a.da} og ${lige.da} er lige gode`, en: `${a.en} and ${lige.en} are equally good` }) };
  }
  const dog = g.grupper.every((x) => imod(x.form, retning));
  const dele = {
    da: og(g.grupper.map((x) => `${decimal(x.stik, 2, 'da')} stik ${MERE.da[x.form]} end ${navn(x.farver, 'da')}`), 'da'),
    en: og(g.grupper.map((x) => `${decimal(x.stik, 2, 'en')} ${MERE.en[x.form]} tricks than ${navn(x.farver, 'en')}`), 'en'),
  };
  return {
    aktiv: true,
    tekst: (plads) => {
      const hale = !g.lige.length
        ? { da: '', en: '' }
        : plads === 'foerst'
          ? { da: `, mens ${a.da} og ${lige.da} er lige gode`, en: `, while ${a.en} and ${lige.en} are equally good` }
          : { da: ` og er lige så godt som ${lige.da}`, en: ` and is as good as ${lige.en}` };
      const d = dog ? ' dog' : '';
      return {
        da: `${plads === 'foerst' ? `giver ${a.da}${d}` : plads === 'liste' ? `${a.da} giver${d}` : `${a.da}${d} giver`} ${dele.da}${hale.da}`,
        en: `leading ${a.en}${dog ? ' actually' : ''} gives ${dele.en}${hale.en}`,
      };
    },
  };
}

const TRUMF = { da: 'trumf', en: 'a trump' };
const SIDEFARVER = { da: 'hver sidefarve', en: 'each side suit' };
const SPAR = { da: '♠', en: '♠' };
const MINORFARVERNE = { da: 'minorfarverne', en: 'the minors' };

/** A og B i "Ved bordet" (kortere end i forklaringen). */
const VB = {
  P1: { da: ['en kort major', 'en firefarve i minor med honnør'], en: ['a short major', 'a four-card minor with an honour'] },
  P2: { da: ['den korteste major', 'den længste'], en: ['the shorter major', 'the longer one'] },
  P4: { da: ['♥ uden dyb sekvens', '♠'], en: ['♥ without a deep sequence', '♠'] },
  P5: { da: ['singletonen', 'småkort'], en: ['the singleton', 'small cards'] },
  P5S5: { da: ['singletonen', 'småkort i en sidefarve'], en: ['the singleton', 'small cards in a side suit'] },
  P6: { da: ['doubletonen', 'småkort'], en: ['the doubleton', 'small cards'] },
  P7: { da: ['småkort', 'en farve med en eller to honnører'], en: ['small cards', 'a suit with one or two honours'] },
} as const satisfies Record<string, { da: readonly [string, string]; en: readonly [string, string] }>;

/** A mod hver farve i rækkerne `<præfiks>-<farve>` (fx P8-S … P8-C) i situationen. */
const modHver = (fil: RaadTalFil, praefiks: string, situation: SituationId) =>
  ['S', 'H', 'D', 'C'].flatMap((b, farve) => {
    const tal = raadTalI(fil, `${praefiks}-${b}`, situation);
    return tal ? [{ farve, tal }] : [];
  });

/**
 * Leddene pr. situation og hvordan de bindes: "mens" (to led) eller en liste ("…, … og …"). Kompendiets retning giver
 * "dog", når stikkene peger den anden vej: P1, P2, P3, P5, P7 og P8 i S6 siger A; P4 og P8 i S4 og S8 siger B; P6 ingen.
 */
function vedBordetLed(situation: SituationId, fil: RaadTalFil): { led: Led[]; binding: 'mens' | 'liste' } {
  const par = (raekke: string, navne: { da: readonly [string, string]; en: readonly [string, string] }, retning: Retning) => parLed(raadTalI(fil, raekke, situation), navne, retning);
  switch (situation) {
    case 'S1-1nt-3nt':
    case 'S2-stayman':
      return { led: [par('P2', VB.P2, 'A'), par('P1', VB.P1, 'A')], binding: 'mens' };
    case 'S3-transfer':
      return { led: [par('P4', VB.P4, 'B'), flereLed(SPAR, modHver(fil, 'P3', situation), MINORFARVERNE, 'A')], binding: 'mens' };
    case 'S4-kun-en-farve':
      return { led: [par('P5', VB.P5, 'A'), par('P7', VB.P7, 'A'), par('P6', VB.P6, null), flereLed(TRUMF, modHver(fil, 'P8', situation), SIDEFARVER, 'B')], binding: 'liste' };
    case 'S5-sidefarve':
      return { led: [par('P5', VB.P5S5, 'A')], binding: 'liste' };
    case 'S6-trumf':
      return { led: [flereLed(TRUMF, modHver(fil, 'P8', situation), SIDEFARVER, 'A')], binding: 'liste' };
    case 'S7-makker-aabnet':
      return { led: [], binding: 'liste' };
    case 'S8-delkontrakt':
      return { led: [par('P5', VB.P5, 'A'), par('P6', VB.P6, null), flereLed(TRUMF, modHver(fil, 'P8', situation), SIDEFARVER, 'B')], binding: 'liste' };
  }
}

/** Liste med komma og ", og" før det sidste led (", and" på engelsk). */
const liste = (xs: readonly string[], sprog: Sprog) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')}, ${sprog === 'en' ? 'and' : 'og'} ${xs[xs.length - 1]}`);

/**
 * Sætningen sidst i "Ved bordet" med stikkene fra afsnit 7a (kun stik; sætterchancen står i forklaringen), fx "Med
 * dobbeltdummy giver singletonen 0,11 stik mere end småkort i en sidefarve." I S6 desuden, hvor ofte trumf er den
 * bedste farve. Null i S7 og, når alle led har for få hænder.
 */
export function vedBordetSaetning(situation: SituationId, fil: RaadTalFil): Tekst | null {
  const { led, binding } = vedBordetLed(situation, fil);
  const aktive = led.filter((l) => l.aktiv);
  if (aktive.length === 0) return null;
  const dele = aktive.map((l, i) => l.tekst(i === 0 ? 'foerst' : binding));
  const samlet =
    binding === 'mens'
      ? { da: dele.map((d) => d.da).join(', mens '), en: dele.map((d) => d.en).join(', while ') }
      : { da: liste(dele.map((d) => d.da), 'da'), en: liste(dele.map((d) => d.en), 'en') };
  const hale = { da: '', en: '' };
  if (situation === fil.trumfBedst.situation) {
    const p = Math.round(100 * fil.trumfBedst.andel);
    hale.da = `; trumf er den bedste farve i ${p} % af hænderne`;
    hale.en = `; the trump suit is the best suit in ${p}% of the hands`;
  }
  return { da: `Med dobbeltdummy ${samlet.da}${hale.da}.`, en: `With double dummy, ${samlet.en}${hale.en}.` };
}

/** Dommen, når farven er rigtig, men kortet ikke er profilens: farven var rigtig, og profilens kort. */
export function domTekst(vest: readonly Card[], kort: readonly Card[], profilNavn: { tekst: string; tekstEn: string }): Tekst {
  const farve = farveAf(kort[0]);
  const faldende = [...kort].sort((a, b) => b - a);
  return {
    da: `Farven er rigtig, men med profilen ${profilNavn.tekst} spilles ${eller(faldende.map((c) => kortTekst(c, 'da')), 'da')} ud fra ${holdingTekst(vest, farve, 'da')}.`,
    en: `The suit is right, but with ${profilEn(profilNavn.tekstEn)} ${eller(faldende.map((c) => kortTekst(c, 'en')), 'en')} is led from ${holdingTekst(vest, farve, 'en')}.`,
  };
}
