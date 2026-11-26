import { describe, expect, it } from 'vitest';
import { dobbeltdummySaetning, toppenSaetning, trumfSaetning, type RaadTal } from '../model/findUdspilTekst';

/*
 * Accepttest 3 i SPEC-udspilstal.md: formerne, med konstruerede rækker. Formen afgøres alene af `dom` og
 * `udenPraktiskBetydning` (formtabellen i specen):
 *
 *   for-faa                               ingen sætning
 *   ingen-forskel (med og uden praktisk)  lige gode
 *   holder eller modsat, uden praktisk    lige gode
 *   holder                                A giver mere
 *   modsat                                A giver mindre
 *
 * Sætterchancen står kun ved "mere" og "mindre", og kun når den har samme fortegn som stikkene og ikke afrundes til 0,0.
 * P8 lægger farver sammen, når de har samme form, samme stiktal med to decimaler og sætterchancen ved alle eller ingen;
 * P9 har fire former.
 */

const tal = (dom: RaadTal['dom'], udenPraktiskBetydning: boolean, forskel: number, saetForskel: number): RaadTal => ({
  raekke: 'P5',
  situation: null,
  gruppe: null,
  n: dom === 'for-faa' ? 12 : 150,
  forskel,
  saetForskel,
  dom,
  udenPraktiskBetydning,
});

describe('Formtabellen (accepttest 3)', () => {
  it('for få hænder: ingen sætning', () => {
    expect(dobbeltdummySaetning('P5', tal('for-faa', false, 0.3, 4))).toBeNull();
  });

  it('ingen forskel påvist, også uden praktisk betydning: lige gode med forskellen uden fortegn', () => {
    expect(dobbeltdummySaetning('P5', tal('ingen-forskel', false, 0.08, 1.0))).toEqual({
      da: 'Med dobbeltdummy er singletonen og en sidefarve med småkort lige gode efter dette forløb (forskel 0,08 stik).',
      en: 'With double dummy, the singleton and a side suit with small cards are equally good leads after this auction (difference 0.08 tricks).',
    });
    expect(dobbeltdummySaetning('P1', tal('ingen-forskel', true, -0.03, 1.0))).toEqual({
      da: 'Med dobbeltdummy er en kort major og en firefarve i minor med en eller to honnører lige gode efter dette forløb (forskel 0,03 stik).',
      en: 'With double dummy, a short major and a four-card minor with one or two honours are equally good leads after this auction (difference 0.03 tricks).',
    });
  });

  it('holder eller modsat uden praktisk betydning: lige gode', () => {
    expect(dobbeltdummySaetning('P2', tal('holder', true, 0.04, 2.0))).toEqual({
      da: 'Med dobbeltdummy er den korteste major og den længste lige gode efter dette forløb (forskel 0,04 stik).',
      en: 'With double dummy, the shorter major and the longer one are equally good leads after this auction (difference 0.04 tricks).',
    });
    expect(dobbeltdummySaetning('P6', tal('modsat', true, -0.019, 0.41))).toEqual({
      da: 'Med dobbeltdummy er doubletonen uden honnør og en sidefarve med småkort lige gode efter dette forløb (forskel 0,02 stik).',
      en: 'With double dummy, the doubleton without an honour and a side suit with small cards are equally good leads after this auction (difference 0.02 tricks).',
    });
  });

  it('holder: A giver mere, med sætterchancen', () => {
    expect(dobbeltdummySaetning('P5', tal('holder', false, 0.13445, 4.4065))).toEqual({
      da: 'Med dobbeltdummy giver singletonen efter dette forløb i gennemsnit 0,13 stik mere end en sidefarve med småkort og sætter kontrakten 4,4 procentpoint oftere.',
      en: 'With double dummy, leading the singleton after this auction gives on average 0.13 more tricks than a side suit with small cards and defeats the contract 4.4 percentage points more often.',
    });
  });

  it('modsat: A giver mindre, med sætterchancen', () => {
    expect(dobbeltdummySaetning('P2', tal('modsat', false, -0.1032, -1.8167))).toEqual({
      da: 'Med dobbeltdummy giver den korteste major efter dette forløb i gennemsnit 0,10 stik mindre end den længste og sætter kontrakten 1,8 procentpoint sjældnere.',
      en: 'With double dummy, leading the shorter major after this auction gives on average 0.10 fewer tricks than the longer one and defeats the contract 1.8 percentage points less often.',
    });
  });
});

describe('Sætterchancen (accepttest 3)', () => {
  it('peger den modsat stikkene, slutter sætningen efter B', () => {
    expect(dobbeltdummySaetning('P7', tal('holder', false, 0.15, -0.5))).toEqual({
      da: 'Med dobbeltdummy giver småkort i en sidefarve efter dette forløb i gennemsnit 0,15 stik mere end en sidefarve med en eller to honnører.',
      en: 'With double dummy, leading small cards in a side suit after this auction gives on average 0.15 more tricks than a side suit with one or two honours.',
    });
    expect(dobbeltdummySaetning('P4', tal('modsat', false, -0.12, 0.3))).toEqual({
      da: 'Med dobbeltdummy giver ♥ uden dyb sekvens efter dette forløb i gennemsnit 0,12 stik mindre end ♠.',
      en: 'With double dummy, leading ♥ without a deep sequence after this auction gives on average 0.12 fewer tricks than ♠.',
    });
  });

  it('afrundes den til 0,0, udelades den også', () => {
    expect(dobbeltdummySaetning('P1', tal('holder', false, 0.2, 0.04))).toEqual({
      da: 'Med dobbeltdummy giver en kort major efter dette forløb i gennemsnit 0,20 stik mere end en firefarve i minor med en eller to honnører.',
      en: 'With double dummy, leading a short major after this auction gives on average 0.20 more tricks than a four-card minor with one or two honours.',
    });
    expect(dobbeltdummySaetning('P6', tal('modsat', false, -0.07, -0.04))).toEqual({
      da: 'Med dobbeltdummy giver doubletonen uden honnør efter dette forløb i gennemsnit 0,07 stik mindre end en sidefarve med småkort.',
      en: 'With double dummy, leading the doubleton without an honour after this auction gives on average 0.07 fewer tricks than a side suit with small cards.',
    });
  });
});

// ---------------------------------------------------------------- P8

const S = 0;
const H = 1;
const D = 2;
const C = 3;
const p8 = (...xs: [number, RaadTal][]) => trumfSaetning(xs.map(([farve, t]) => ({ farve, tal: t })));

describe('P8: trumf mod hver sidefarve (accepttest 3)', () => {
  it('S6 med tallene fra 7a: to farver hver for sig og en lige god til sidst', () => {
    expect(p8([S, tal('holder', false, 0.06537, 2.7181)], [H, tal('holder', false, 0.3159, 5.5705)], [D, tal('ingen-forskel', true, 0.035, 2.436)])).toEqual({
      da: 'Med dobbeltdummy giver trumf efter dette forløb i gennemsnit 0,07 stik mere end ♠ (sætter 2,7 procentpoint oftere) og 0,32 stik mere end ♥ (5,6 procentpoint oftere), mens trumf og ♦ er lige gode.',
      en: 'With double dummy, leading a trump after this auction gives on average 0.07 more tricks than ♠ (defeating the contract 2.7 percentage points more often) and 0.32 more tricks than ♥ (5.6 percentage points more often), while a trump and ♦ are equally good.',
    });
  });

  it('S4 med tallene fra 7a: samme form og stiktal lægges sammen, og sætterchancen står som ét tal, når den er ens efter afrunding', () => {
    expect(p8([S, tal('modsat', false, -0.05524, -1.1818)], [D, tal('modsat', false, -0.06285, -1.2361)], [C, tal('modsat', true, -0.04326, -0.9236)])).toEqual({
      da: 'Med dobbeltdummy giver trumf efter dette forløb i gennemsnit 0,06 stik mindre end ♠ og ♦ (sætter 1,2 procentpoint sjældnere), mens trumf og ♣ er lige gode.',
      en: 'With double dummy, leading a trump after this auction gives on average 0.06 fewer tricks than ♠ and ♦ (defeating the contract 1.2 percentage points less often), while a trump and ♣ are equally good.',
    });
  });

  it('S8 med tallene fra 7a: sætterchancen som interval fra den mindste til den største', () => {
    expect(p8([H, tal('modsat', false, -0.0576, -0.8732)], [D, tal('modsat', false, -0.06241, -0.7518)], [C, tal('modsat', false, -0.05803, -0.8803)])).toEqual({
      da: 'Med dobbeltdummy giver trumf efter dette forløb i gennemsnit 0,06 stik mindre end ♥, ♦ og ♣ (sætter 0,8–0,9 procentpoint sjældnere).',
      en: 'With double dummy, leading a trump after this auction gives on average 0.06 fewer tricks than ♥, ♦ and ♣ (defeating the contract 0.8–0.9 percentage points less often).',
    });
  });

  it('står sætterchancen ved den ene, men ikke ved den anden, lægges de ikke sammen', () => {
    expect(p8([S, tal('modsat', false, -0.06, -1.2)], [D, tal('modsat', false, -0.06, 0.5)])).toEqual({
      da: 'Med dobbeltdummy giver trumf efter dette forløb i gennemsnit 0,06 stik mindre end ♠ (sætter 1,2 procentpoint sjældnere) og 0,06 stik mindre end ♦.',
      en: 'With double dummy, leading a trump after this auction gives on average 0.06 fewer tricks than ♠ (defeating the contract 1.2 percentage points less often) and 0.06 fewer tricks than ♦.',
    });
  });

  it('står sætterchancen ved ingen af dem, lægges de sammen', () => {
    expect(p8([S, tal('modsat', false, -0.06, 0.5)], [D, tal('modsat', false, -0.058, 0.02)])).toEqual({
      da: 'Med dobbeltdummy giver trumf efter dette forløb i gennemsnit 0,06 stik mindre end ♠ og ♦.',
      en: 'With double dummy, leading a trump after this auction gives on average 0.06 fewer tricks than ♠ and ♦.',
    });
  });

  it('forskellig form eller forskelligt stiktal: hver for sig i rækkefølgen ♠ ♥ ♦ ♣, og "sætter" kun ved den første sætterchance', () => {
    expect(p8([S, tal('holder', false, 0.1, 1.0)], [H, tal('modsat', false, -0.06, -1.0)], [D, tal('holder', false, 0.1, 2.0)])).toEqual({
      da: 'Med dobbeltdummy giver trumf efter dette forløb i gennemsnit 0,10 stik mere end ♠ og ♦ (sætter 1,0–2,0 procentpoint oftere) og 0,06 stik mindre end ♥ (1,0 procentpoint sjældnere).',
      en: 'With double dummy, leading a trump after this auction gives on average 0.10 more tricks than ♠ and ♦ (defeating the contract 1.0–2.0 percentage points more often) and 0.06 fewer tricks than ♥ (1.0 percentage points less often).',
    });
    expect(p8([S, tal('holder', false, 0.1, 1.0)], [H, tal('modsat', false, -0.06, -1.0)], [D, tal('holder', false, 0.2, 2.0)])).toEqual({
      da: 'Med dobbeltdummy giver trumf efter dette forløb i gennemsnit 0,10 stik mere end ♠ (sætter 1,0 procentpoint oftere), 0,06 stik mindre end ♥ (1,0 procentpoint sjældnere) og 0,20 stik mere end ♦ (2,0 procentpoint oftere).',
      en: 'With double dummy, leading a trump after this auction gives on average 0.10 more tricks than ♠ (defeating the contract 1.0 percentage points more often), 0.06 fewer tricks than ♥ (1.0 percentage points less often) and 0.20 more tricks than ♦ (2.0 percentage points more often).',
    });
    expect(p8([S, tal('modsat', false, -0.06, 0.3)], [H, tal('holder', false, 0.12, 1.5)])).toEqual({
      da: 'Med dobbeltdummy giver trumf efter dette forløb i gennemsnit 0,06 stik mindre end ♠ og 0,12 stik mere end ♥ (sætter 1,5 procentpoint oftere).',
      en: 'With double dummy, leading a trump after this auction gives on average 0.06 fewer tricks than ♠ and 0.12 more tricks than ♥ (defeating the contract 1.5 percentage points more often).',
    });
  });

  it('flere lige gode står samlet til sidst', () => {
    expect(p8([S, tal('holder', false, 0.2, 3.0)], [D, tal('ingen-forskel', false, 0.06, 0.4)], [C, tal('modsat', true, -0.01, -0.2)])).toEqual({
      da: 'Med dobbeltdummy giver trumf efter dette forløb i gennemsnit 0,20 stik mere end ♠ (sætter 3,0 procentpoint oftere), mens trumf, ♦ og ♣ er lige gode.',
      en: 'With double dummy, leading a trump after this auction gives on average 0.20 more tricks than ♠ (defeating the contract 3.0 percentage points more often), while a trump, ♦ and ♣ are equally good.',
    });
  });

  it('er alle lige gode, siger sætningen kun det', () => {
    expect(p8([S, tal('ingen-forskel', false, 0.06, 0.4)], [H, tal('ingen-forskel', true, 0.0, 0.0)], [D, tal('holder', true, 0.04, 1.0)])).toEqual({
      da: 'Med dobbeltdummy er trumf, ♠, ♥ og ♦ lige gode efter dette forløb.',
      en: 'With double dummy, a trump, ♠, ♥ and ♦ are equally good leads after this auction.',
    });
  });

  it('farver med for få hænder udelades, og har alle for få, er der ingen sætning', () => {
    expect(p8([S, tal('for-faa', false, 0.5, 9)], [H, tal('holder', false, 0.3159, 5.5705)])).toEqual({
      da: 'Med dobbeltdummy giver trumf efter dette forløb i gennemsnit 0,32 stik mere end ♥ (sætter 5,6 procentpoint oftere).',
      en: 'With double dummy, leading a trump after this auction gives on average 0.32 more tricks than ♥ (defeating the contract 5.6 percentage points more often).',
    });
    expect(p8([S, tal('for-faa', false, 0.5, 9)], [D, tal('for-faa', false, -0.5, -9)])).toBeNull();
  });
});

// ---------------------------------------------------------------- P9

describe('P9: toppen mod det lave kort ved "table feeling" (accepttest 3)', () => {
  it('toppen giver mere: med "tallet er en øvre grænse"', () => {
    expect(toppenSaetning('E K', tal('holder', false, 0.82774, 12.3019))).toEqual({
      da: 'Med dobbeltdummy giver toppen fra E K i gennemsnit 0,83 stik mere end det lave kort og sætter kontrakten 12,3 procentpoint oftere; tallet er en øvre grænse, fordi dobbeltdummy overvurderer honnørudspil.',
      en: 'With double dummy, leading the top card from A K gives on average 0.83 more tricks than the low card and defeats the contract 12.3 percentage points more often; the figure is an upper limit, because double dummy overrates honour leads.',
    });
    expect(toppenSaetning('K D', tal('holder', false, 0.32, -0.4))).toEqual({
      da: 'Med dobbeltdummy giver toppen fra K D i gennemsnit 0,32 stik mere end det lave kort; tallet er en øvre grænse, fordi dobbeltdummy overvurderer honnørudspil.',
      en: 'With double dummy, leading the top card from K Q gives on average 0.32 more tricks than the low card; the figure is an upper limit, because double dummy overrates honour leads.',
    });
  });

  it('toppen giver mindre: uden "tallet er en øvre grænse"', () => {
    expect(toppenSaetning('D B', tal('modsat', false, -0.14, -1.0))).toEqual({
      da: 'Med dobbeltdummy giver toppen fra D B i gennemsnit 0,14 stik mindre end det lave kort og sætter kontrakten 1,0 procentpoint sjældnere.',
      en: 'With double dummy, leading the top card from Q J gives on average 0.14 fewer tricks than the low card and defeats the contract 1.0 percentage points less often.',
    });
  });

  it('lige gode', () => {
    expect(toppenSaetning('E K', tal('ingen-forskel', true, 0.04, 1.0))).toEqual({
      da: 'Med dobbeltdummy er toppen og det lave kort fra E K lige gode (forskel 0,04 stik).',
      en: 'With double dummy, the top card and the low card from A K are equally good (difference 0.04 tricks).',
    });
    expect(toppenSaetning('K D', tal('modsat', true, -0.03, -1.0))).toEqual({
      da: 'Med dobbeltdummy er toppen og det lave kort fra K D lige gode (forskel 0,03 stik).',
      en: 'With double dummy, the top card and the low card from K Q are equally good (difference 0.03 tricks).',
    });
  });

  it('for få hænder: ingen tilføjelse', () => {
    expect(toppenSaetning('D B', tal('for-faa', false, 0.5, 5))).toBeNull();
  });
});
