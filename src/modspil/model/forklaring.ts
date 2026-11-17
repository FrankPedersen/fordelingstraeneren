import type { Allowed } from '../../pointregnskab/model/points';
import type { Facit, Regel11Analyse, Signal } from './loeser';
import type { AfkastAflaesning, TilspilsAflaesning } from './markering';
import type { Metode } from './metoder';
import { eller, kortNavn, og, SYMBOLER, type Sprog } from './tekst';

/**
 * Forklaringerne til facit (SPEC-modspil.md, "Løser, generator og facit" punkt 5): korte, på dansk og engelsk, i
 * beskrivende form og husets ord, og de nævner altid metoden, fx "Med lavt = kald betyder makkers ♥2 kald."
 */

export interface Tekst {
  da: string;
  en: string;
}

const kort = (farve: number, vaerdi: number) => ({ da: kortNavn(farve, vaerdi, 'da'), en: kortNavn(farve, vaerdi, 'en') });
const tal = (xs: readonly number[], sprog: Sprog) => eller(xs, sprog);

// ---------------------------------------------------------------- øvelse 1

export interface PointGrundlag {
  egne: number;
  bordets: number;
  /** Makkers og spilførers hp tilsammen. */
  total: number;
  syd: Allowed;
  /** Syds åbning med farvesymbol, fx 1♥. */
  aabning: string;
  /** Makker passede i åbningsposition (højst 11 hp). */
  vestPas: boolean;
  min: number;
  max: number;
}

export function forklarPoint(p: PointGrundlag): Tekst {
  const lo = p.syd[0][0];
  const hi = p.syd[p.syd.length - 1][1];
  const svar = p.min === p.max ? `${p.min}` : `${p.min}–${p.max}`;
  const enkel = p.min === Math.max(0, p.total - hi) && p.max === p.total - lo;
  return {
    da:
      `Der er 40 hp i alt. Du har ${p.egne} og bordet ${p.bordets}, så makker og spilfører har ${p.total} tilsammen. ` +
      `Spilfører viste ${lo}–${hi} hp med ${p.aabning}${p.vestPas ? ', og makker viste højst 11 hp med pas i åbningsposition' : ''}. ` +
      (enkel
        ? `Makker har derfor ${p.total} − ${hi} = ${p.total - hi} til ${p.total} − ${lo} = ${p.total - lo} hp.`
        : `Når de usete honnører fordeles, så begge passer med meldingerne, har makker ${svar} hp.`),
    en:
      `There are 40 HCP in all. You have ${p.egne} and dummy ${p.bordets}, so partner and declarer have ${p.total} between them. ` +
      `Declarer showed ${lo}–${hi} HCP with ${p.aabning}${p.vestPas ? ', and partner showed at most 11 HCP by passing in opening position' : ''}. ` +
      (enkel
        ? `So partner has ${p.total} − ${hi} = ${p.total - hi} to ${p.total} − ${lo} = ${p.total - lo} HCP.`
        : `When the unseen honours are placed so that both fit the bidding, partner has ${svar} HCP.`),
  };
}

// ---------------------------------------------------------------- øvelse 2 og 3

export function forklarRegel11(m: Metode, farve: number, udspil: number, a: Regel11Analyse, hvilke: Facit | undefined, hpAfgjorde: boolean): Tekst {
  const k = kort(farve, udspil);
  const hp = hpAfgjorde ? { da: ' Hp fra meldingerne udelukker de andre muligheder.', en: ' The HCP from the bidding rule out the other possibilities.' } : { da: '', en: '' };
  if (a.facit.type !== 'tal') {
    return {
      da: `Med ${m.tekst} kan makker have ${tal(a.vestOver, 'da')} kort over ${k.da}, så spilfører kan have ${tal(a.sydOver, 'da')}. Antallet kan ikke afgøres.`,
      en: `With ${m.tekstEn} partner can have ${tal(a.vestOver, 'en')} cards above ${k.en}, so declarer can have ${tal(a.sydOver, 'en')}. The number cannot be determined.`,
    };
  }
  const over = a.vestOver[0];
  const r = 14 - over;
  const navn = r === 11 || r === 12 ? { da: ` (regel ${r})`, en: ` (rule of ${r})` } : { da: '', en: '' };
  const n = a.facit.tal;
  const liste = (kortene: readonly number[], sprog: Sprog) => og(kortene.map((c) => kortNavn(Math.floor(c / 13), (c % 13) + 2, sprog)), sprog);
  const hvilkeTekst: Tekst =
    hvilke?.type === 'kort' && hvilke.kort.length
      ? { da: ` Spilfører har ${liste(hvilke.kort, 'da')} over ${k.da}.`, en: ` Declarer has ${liste(hvilke.kort, 'en')} above ${k.en}.` }
      : hvilke?.type === 'kan-ikke-afgoeres'
        ? { da: ' Hvilke kort det er, kan ikke afgøres.', en: ' Which cards they are cannot be determined.' }
        : { da: '', en: '' };
  return {
    da:
      `Med ${m.tekst} har makker ${over} kort over ${k.da}, så der er ${r} − ${udspil} = ${r - udspil} kort over ${k.da} hos de andre tre hænder${navn.da}. ` +
      `Bordet har ${a.bordOver} og du ${a.oestOver}, så spilfører har ${n}.${hp.da}${hvilkeTekst.da}`,
    en:
      `With ${m.tekstEn} partner has ${over} cards above ${k.en}, so there are ${r} − ${udspil} = ${r - udspil} cards above ${k.en} in the other three hands${navn.en}. ` +
      `Dummy has ${a.bordOver} and you ${a.oestOver}, so declarer has ${n}.${hp.en}${hvilkeTekst.en}`,
  };
}

export function forklarLaengde(m: Metode, farve: number, udspil: number, laengder: readonly number[], hpAfgjorde: boolean): Tekst {
  const k = kort(farve, udspil);
  const hp = hpAfgjorde ? { da: ' Hp fra meldingerne udelukker de andre længder.', en: ' The HCP from the bidding rule out the other lengths.' } : { da: '', en: '' };
  if (laengder.length > 2) {
    return {
      da: `Med ${m.tekst} og de kort, du kan se, kan makker have ${tal(laengder, 'da')} kort i farven, når udspillet er ${k.da}. Flere end to længder kan ikke afgøres.${hp.da}`,
      en: `With ${m.tekstEn} and the cards you can see, partner can have ${tal(laengder, 'en')} cards in the suit when the lead is ${k.en}. More than two lengths cannot be determined.${hp.en}`,
    };
  }
  return {
    da: `Med ${m.tekst} og de kort, du kan se, har makker ${tal(laengder, 'da')} kort i farven, når udspillet er ${k.da}.${hp.da}`,
    en: `With ${m.tekstEn} and the cards you can see, partner has ${tal(laengder, 'en')} cards in the suit when the lead is ${k.en}.${hp.en}`,
  };
}

// ---------------------------------------------------------------- øvelse 4 og 5

/** De to andre farver i romersk kald: den højeste og den laveste (trumf tæller ikke med). */
export interface AndreFarver {
  hoej: number;
  lav: number;
}

export function forklarTilspil(m: Metode, honnoer: Metode | undefined, farve: number, tilspil: number, d: TilspilsAflaesning, andre: AndreFarver): Tekst {
  const k = kort(farve, tilspil);
  const f = d.facit;
  if (d.art === 'laengde') {
    const ala = honnoer ?? m;
    const lige = d.oestsLaengder && d.oestsLaengder[0] % 2 === 0;
    const syd = f.type === 'laengder' ? f.laengder : (d.oestsLaengder ?? []).map((n) => (d.skjulte ?? 0) - n).sort((a, b) => a - b);
    const slut =
      f.type === 'laengder'
        ? { da: `så spilfører har ${tal(syd, 'da')}.`, en: `so declarer has ${tal(syd, 'en')}.` }
        : { da: `så spilfører kan have ${tal(syd, 'da')}, og længden kan ikke afgøres.`, en: `so declarer can have ${tal(syd, 'en')}, and the length cannot be determined.` };
    return {
      da:
        `Med ${ala.tekst} beder kongen om længde, og med ${m.tekst} viser makkers ${k.da} et ${lige ? 'lige' : 'ulige'} antal, fordi kortet er ${d.lavt ? 'lavt' : 'højt'}. ` +
        `Makker og spilfører har ${d.skjulte} kort i farven tilsammen. Makker har ${tal(d.oestsLaengder ?? [], 'da')}, ${slut.da}`,
      en:
        `With ${ala.tekstEn} the king asks for count, and with ${m.tekstEn} partner's ${k.en} shows an ${lige ? 'even' : 'odd'} number because it is ${d.lavt ? 'low' : 'high'}. ` +
        `Partner and declarer have ${d.skjulte} cards in the suit between them. Partner has ${tal(d.oestsLaengder ?? [], 'en')}, ${slut.en}`,
    };
  }
  if (d.art === 'romersk') {
    const lav = SYMBOLER[andre.lav];
    const hoej = SYMBOLER[andre.hoej];
    switch (d.grund) {
      case 'laveste-ulige':
        return {
          da: `Med ${m.tekst} er makkers ${k.da} et ulige kort og det laveste ulige kort, du ikke kan se, altså kald til at fortsætte i farven.`,
          en: `With ${m.tekstEn} partner's ${k.en} is odd and the lowest odd card you cannot see, so it encourages the suit led.`,
        };
      case 'ulige':
        return {
          da: `Med ${m.tekst} er makkers ${k.da} et ulige kort, altså kald til at fortsætte i farven.`,
          en: `With ${m.tekstEn} partner's ${k.en} is odd, so it encourages the suit led.`,
        };
      case 'hoej-ulige':
        return {
          da: `Med ${m.tekst} er makkers ${k.da} en høj ulige (9 og op) og et af de to højeste ulige kort, du ikke kan se, altså ønske om skift uden lige kort.`,
          en: `With ${m.tekstEn} partner's ${k.en} is a high odd card (nine or higher) and one of the two highest odd cards you cannot see, so it asks for a switch without an even card.`,
        };
      case 'lille-lige':
        return {
          da: `Med ${m.tekst} er makkers ${k.da} en lille lige, et af de to laveste lige kort, du ikke kan se, altså forslag om skift til den laveste af de to andre farver, ${lav}.`,
          en: `With ${m.tekstEn} partner's ${k.en} is a low even card, one of the two lowest even cards you cannot see, so it suggests a switch to the lower of the two other suits, ${lav}.`,
        };
      case 'hoej-lige':
        return {
          da: `Med ${m.tekst} er makkers ${k.da} en høj lige, ikke et af de to laveste lige kort, du ikke kan se, altså forslag om skift til den højeste af de to andre farver, ${hoej}.`,
          en: `With ${m.tekstEn} partner's ${k.en} is a high even card, not one of the two lowest even cards you cannot see, so it suggests a switch to the higher of the two other suits, ${hoej}.`,
        };
      case 'singleton-paa-bordet':
        return {
          da: `Med ${m.tekst} er makkers ${k.da} et lige kort, men bordet har singleton i farven, så kortet er tvetydigt.`,
          en: `With ${m.tekstEn} partner's ${k.en} is even, but dummy has a singleton in the suit, so the card is ambiguous.`,
        };
      default:
        return {
          da: `Med ${m.tekst} er makkers ${k.da} et lige kort, men der er intet ulige kort blandt dem, du ikke kan se, så kortet er tvetydigt.`,
          en: `With ${m.tekstEn} partner's ${k.en} is even, but there is no odd card among those you cannot see, so the card is ambiguous.`,
        };
    }
  }
  const kald = f.type === 'signal' && f.signal === 'kald';
  return {
    da: `Med ${m.tekst} betyder makkers ${k.da} ${kald ? 'kald' : 'afvisning'}, fordi kortet er ${d.lavt ? 'et af de to laveste kort' : 'højere end de to laveste kort'}, du ikke kan se.`,
    en: `With ${m.tekstEn} partner's ${k.en} ${kald ? 'encourages' : 'discourages'}, because it is ${d.lavt ? 'one of the two lowest cards' : 'higher than the two lowest cards'} you cannot see.`,
  };
}

/** Forklaringen til Vælg kortet (øvelse 5). */
export function forklarVaelgTilspil(m: Metode, romersk: boolean, onske: Signal, farve: number, vaerdi: number, noedloesning: boolean, andre: AndreFarver, hoejt: boolean): Tekst {
  const k = kort(farve, vaerdi);
  if (romersk) {
    if (onske === 'kald') {
      return {
        da: `Med ${m.tekst} kaldes der med det mindste ulige kort: ${k.da}.`,
        en: `With ${m.tekstEn} you encourage with the lowest odd card: ${k.en}.`,
      };
    }
    const lav = onske === 'skift-lav';
    const til = SYMBOLER[lav ? andre.lav : andre.hoej];
    if (noedloesning) {
      return {
        da: `Med ${m.tekst} foreslår en ${lav ? 'lille' : 'høj'} lige skift til ${til}, men uden lige kort under B er nødløsningen fra Kompendiet en høj ulige fra 9 og op: ${k.da}.`,
        en: `With ${m.tekstEn} a ${lav ? 'low' : 'high'} even card suggests a switch to ${til}, but without an even card below the jack the Compendium's way out is a high odd card, nine or higher: ${k.en}.`,
      };
    }
    return {
      da: `Med ${m.tekst} foreslår ${lav ? 'det laveste lige kort' : 'det højeste lige kort under B'} skift til den ${lav ? 'laveste' : 'højeste'} af de to andre farver, ${til}: ${k.da}.`,
      en: `With ${m.tekstEn} ${lav ? 'the lowest even card' : 'the highest even card below the jack'} suggests a switch to the ${lav ? 'lower' : 'higher'} of the two other suits, ${til}: ${k.en}.`,
    };
  }
  const kald = onske === 'kald';
  return {
    da: `Med ${m.tekst} ${kald ? 'kaldes' : 'afvises'} der med ${hoejt ? 'et højt kort, det højeste under B' : 'det laveste kort'}: ${k.da}.`,
    en: `With ${m.tekstEn} you ${kald ? 'encourage' : 'discourage'} with ${hoejt ? 'a high card, the highest below the jack' : 'the lowest card'}: ${k.en}.`,
  };
}

// ---------------------------------------------------------------- øvelse 6

export interface AfkastGrundlag {
  m: Metode;
  /** Kaldmetoden, når afkastet læses som kald eller afvisning. */
  kald?: Metode;
  laesning: 'paritet' | 'retning' | 'kald';
  viaKald: boolean;
  hoejtErKald: boolean;
}

/** Indledningen, der nævner metoden for første afkast (og kaldmetoden, når afkastet følger den). */
function afkastIndledning(g: AfkastGrundlag): Tekst {
  if (!g.viaKald) return { da: `Med ${g.m.tekst}`, en: `With ${g.m.tekstEn}` };
  const k = g.kald ?? g.m;
  return g.laesning === 'paritet'
    ? { da: `Første afkast læses ${g.m.tekst}, og med ${k.tekst} mod farve læses det efter ulige og lige, så`, en: `The first discard is read ${g.m.tekstEn}, and with ${k.tekstEn} against a suit contract it is read as odd/even, so` }
    : { da: `Første afkast læses ${g.m.tekst}, og med ${k.tekst}`, en: `The first discard is read ${g.m.tekstEn}, and with ${k.tekstEn}` };
}

/** Afkastets plads blandt de to laveste usete kort, fx "et af de to laveste lige kort, du ikke kan se (♦8 og ♦10)". */
function afkastetsPlads(farve: number, d: AfkastAflaesning): Tekst {
  const to = (sprog: Sprog) => og(d.usete.slice(0, 2).map((v) => kortNavn(farve, v, sprog)), sprog);
  const lige = d.laesning === 'paritet' ? { da: 'lige kort', en: 'even cards' } : { da: 'kort', en: 'cards' };
  return d.lavt
    ? { da: `et af de to laveste ${lige.da}, du ikke kan se (${to('da')})`, en: `one of the two lowest ${lige.en} you cannot see (${to('en')})` }
    : { da: `ikke et af de to laveste ${lige.da}, du ikke kan se (${to('da')})`, en: `not one of the two lowest ${lige.en} you cannot see (${to('en')})` };
}

export function forklarAflaesAfkast(g: AfkastGrundlag, farve: number, vaerdi: number, d: AfkastAflaesning, oenskeFarve: number | null): Tekst {
  const k = kort(farve, vaerdi);
  const i = afkastIndledning(g);
  const til = oenskeFarve === null ? '' : SYMBOLER[oenskeFarve];
  const lavt = d.lavt;
  if (g.laesning === 'paritet') {
    const p = afkastetsPlads(farve, d);
    const hvad =
      vaerdi % 2 === 1
        ? { da: `et ulige kort: kald til ${til}`, en: `an odd card: it encourages ${til}` }
        : lavt
          ? { da: `en lille lige, ${p.da}: styrke i den laveste af de to andre farver, ${til}`, en: `a low even card, ${p.en}: strength in the lower of the two other suits, ${til}` }
          : { da: `en stor lige, ${p.da}: kald til den højeste af de to andre farver, ${til}`, en: `a high even card, ${p.en}: it asks for the higher of the two other suits, ${til}` };
    return { da: `${i.da} er makkers ${k.da} ${hvad.da}.`, en: `${i.en} partner's ${k.en} is ${hvad.en}.` };
  }
  const p = afkastetsPlads(farve, d);
  if (g.laesning === 'retning') {
    return {
      da: `${i.da} er makkers ${k.da} ${lavt ? 'lavt' : 'højt'}, ${p.da}: kald til den ${lavt ? 'laveste' : 'højeste'} af de to andre farver, ${til}.`,
      en: `${i.en} partner's ${k.en} is ${lavt ? 'low' : 'high'}, ${p.en}: it asks for the ${lavt ? 'lower' : 'higher'} of the two other suits, ${til}.`,
    };
  }
  const kald = d.signal === 'kald';
  return {
    da: `${i.da} er makkers ${k.da} ${lavt ? 'lavt' : 'højt'}, ${p.da}, altså ${kald ? 'kald' : 'afvisning'} i ${SYMBOLER[farve]}.`,
    en: `${i.en} partner's ${k.en} is ${lavt ? 'low' : 'high'}, ${p.en}, so it ${kald ? 'encourages' : 'discourages'} ${SYMBOLER[farve]}.`,
  };
}

export function forklarVaelgAfkast(g: AfkastGrundlag, onske: number, kortene: readonly number[]): Tekst {
  const i = afkastIndledning(g);
  const regel =
    g.laesning === 'paritet'
      ? {
          da: 'kalder et ulige kort til farven selv, en lille lige (et af de to laveste lige kort, makker ikke kan se) til den laveste og en stor lige til den højeste af de to andre farver',
          en: 'an odd card encourages its own suit, a low even card (one of the two lowest even cards partner cannot see) asks for the lower and a high even card for the higher of the two other suits',
        }
      : g.laesning === 'retning'
        ? {
            da: 'beder et lavt kort (et af de to laveste kort, makker ikke kan se) om den laveste og et højt kort om den højeste af de to andre farver',
            en: 'a low card (one of the two lowest cards partner cannot see) asks for the lower and a high card for the higher of the two other suits',
          }
        : g.hoejtErKald
          ? { da: 'kalder et højt kort (ikke et af de to laveste kort, makker ikke kan se) til farven selv', en: 'a high card (not one of the two lowest cards partner cannot see) encourages its own suit' }
          : { da: 'kalder et lavt kort (et af de to laveste kort, makker ikke kan se) til farven selv', en: 'a low card (one of the two lowest cards partner cannot see) encourages its own suit' };
  const liste = (sprog: Sprog) => og(kortene.map((c) => kortNavn(Math.floor(c / 13), (c % 13) + 2, sprog)), sprog);
  const flere = kortene.length > 1;
  return {
    da: `${i.da} ${regel.da}. Uanset hvor de kort, du ikke kan se, sidder, beder ${liste('da')} om ${SYMBOLER[onske]}.`,
    en: `${i.en} ${regel.en}. Wherever the cards you cannot see lie, ${liste('en')} ${flere ? 'ask' : 'asks'} for ${SYMBOLER[onske]}.`,
  };
}

// ---------------------------------------------------------------- øvelse 7

export function forklarAflaesForsinket(m: Metode, farve: number, foerste: number, anden: number): Tekst {
  const a = kort(farve, foerste);
  const b = kort(farve, anden);
  const passiv = foerste < anden;
  return {
    da: `Med ${m.tekst} betyder lav-høj passivt og høj-lav aktivt. Makker lagde ${a.da} og derefter ${b.da}, altså ${passiv ? 'lav-høj: passivt' : 'høj-lav: aktivt'}.`,
    en: `With ${m.tekstEn} low-high means passive and high-low active. Partner played ${a.en} and then ${b.en}, so ${passiv ? 'low-high: passive' : 'high-low: active'}.`,
  };
}

export function forklarVaelgForsinket(m: Metode, farve: number, vaerdi: number, onske: 'passiv' | 'aktiv'): Tekst {
  const k = kort(farve, vaerdi);
  const passiv = onske === 'passiv';
  return {
    da: `Med ${m.tekst} begynder ${passiv ? 'passivt (lav-høj) med det laveste kort' : 'aktivt (høj-lav) med det højeste kort under B'}: ${k.da}.`,
    en: `With ${m.tekstEn} ${passiv ? 'passive (low-high) starts with the lowest card' : 'active (high-low) starts with the highest card below the jack'}: ${k.en}.`,
  };
}
