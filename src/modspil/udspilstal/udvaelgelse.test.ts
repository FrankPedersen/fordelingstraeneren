import { describe, expect, it } from 'vitest';
import type { Tekst } from '../model/forklaring';
import { datasaet, fastOpgave, PROFILER } from '../find-udspil/hjaelp';
import { forklarUdspil, type SituationId, type UdspilDataOpgave } from '../model/findUdspil';
import { SVAR } from './hjaelp';

/*
 * Accepttest 2 i SPEC-udspilstal.md: udvælgelsen. For faste hænder giver forklaringen (profilen Standard) præcis den
 * forventede sætning på dansk og engelsk, med tallene skrevet ind fra afsnit 7a i docs/MODEL.md. Sætningen står sidst
 * i forklaringen, efter Kompendiets råd, og ikke i `afvigelse`; ved "table feeling" (P9) står tilføjelsen lige efter
 * sætningen om de to rigtige kort. Situationer og regler uden sætning har ingen "Med dobbeltdummy". P8 i S4 og S8 står
 * kun, når Vest har trumf (Franks rettelse 26. nov. 2026; S4 opgave 53 og S8 opgave 12 er tilføjet til testen).
 *
 * Hænderne er fra datasættet (src/modspil/content/udspil/), undtagen S3 med dyb sekvens i ♥: datasættets 150 hænder i
 * S3 har ingen (Nord har vist fem ♥), så den hånd er konstrueret (middelstikkene er ligegyldige for sætningen).
 */

const data = datasaet();
const STANDARD = PROFILER[0][1];

interface Tilfaelde {
  navn: string;
  situation: SituationId;
  /** Indeks i datasættet og opgavens seed (så et skift i datasættet ses), eller en konstrueret opgave. */
  indeks?: number;
  seed?: number;
  opgave?: UdspilDataOpgave;
  /** Den forventede sætning sidst i forklaringen; null: ingen "Med dobbeltdummy". */
  saetning: Tekst | null;
}

const P2: Tekst = {
  da: 'Med dobbeltdummy giver den korteste major efter dette forløb i gennemsnit 0,10 stik mindre end den længste og sætter kontrakten 1,8 procentpoint sjældnere.',
  en: 'With double dummy, leading the shorter major after this auction gives on average 0.10 fewer tricks than the longer one and defeats the contract 1.8 percentage points less often.',
};
const P6: Tekst = {
  da: 'Med dobbeltdummy er doubletonen uden honnør og en sidefarve med småkort lige gode efter dette forløb (forskel 0,02 stik).',
  en: 'With double dummy, the doubleton without an honour and a side suit with small cards are equally good leads after this auction (difference 0.02 tricks).',
};
const P5 = (x: string, y: string): Tekst => ({
  da: `Med dobbeltdummy giver singletonen efter dette forløb i gennemsnit ${x.replace('.', ',')} stik mere end en sidefarve med småkort og sætter kontrakten ${y.replace('.', ',')} procentpoint oftere.`,
  en: `With double dummy, leading the singleton after this auction gives on average ${x} more tricks than a side suit with small cards and defeats the contract ${y} percentage points more often.`,
});

const TILFAELDE: Tilfaelde[] = [
  // S1 opgave 0: ♠D 10 9 5 4 ♥9 7 ♦E 10 9 8 ♣9 4. To forskellige majorer: P2.
  { navn: 'S1, to forskellige majorer (P2)', situation: 'S1-1nt-3nt', indeks: 0, seed: 2085890785, saetning: P2 },
  // S2 opgave 1: ♠D 7 6 5 3 ♥9 8 2 ♦B 10 8 7 5 ♣–. P2 gælder også S2.
  { navn: 'S2, to forskellige majorer (P2)', situation: 'S2-stayman', indeks: 1, seed: 3339419771, saetning: P2 },
  // S1 opgave 28: ♠D 10 7 ♥6 5 2 ♦K 7 5 3 ♣9 5 2. Lige lange majorer og ♦K 7 5 3: P1 (ingen forskel, uden praktisk betydning).
  {
    navn: 'S1, lige lange majorer og en minor med 4 kort og honnør (P1)',
    situation: 'S1-1nt-3nt',
    indeks: 28,
    seed: 3840206489,
    saetning: {
      da: 'Med dobbeltdummy er en kort major og en firefarve i minor med en eller to honnører lige gode efter dette forløb (forskel 0,03 stik).',
      en: 'With double dummy, a short major and a four-card minor with one or two honours are equally good leads after this auction (difference 0.03 tricks).',
    },
  },
  // S1 opgave 55 (lige lange majorer uden en minor med 4 kort og honnør, så ingen sætning sidst) står nedenfor.
  // S3 opgave 0: ♠K B 7 5 ♥D 9 ♦E 8 4 3 ♣D 6 4. Kort i ♥ uden dyb sekvens: P4.
  {
    navn: 'S3 uden dyb sekvens i ♥ (P4)',
    situation: 'S3-transfer',
    indeks: 0,
    seed: 590894564,
    saetning: {
      da: 'Med dobbeltdummy giver ♥ uden dyb sekvens efter dette forløb i gennemsnit 0,12 stik mindre end ♠ og sætter kontrakten 1,6 procentpoint sjældnere.',
      en: 'With double dummy, leading ♥ without a deep sequence after this auction gives on average 0.12 fewer tricks than ♠ and defeats the contract 1.6 percentage points less often.',
    },
  },
  // Konstrueret: ♠K 3 2 ♥D B 10 9 3 ♦K 4 2 ♣3 2. Dyb sekvens i ♥: rådet er ♥, og der er ingen sætning.
  { navn: 'S3 med dyb sekvens i ♥ (konstrueret)', situation: 'S3-transfer', opgave: fastOpgave('K32.QJT93.K42.32', { HQ: 3, SK: 2.5 }), saetning: null },
  // S4 opgave 0: ♠D B 7 6 3 ♥6 4 ♦B ♣K 6 5 3 2. Singleton: P5 · S4.
  { navn: 'S4, singleton (P5)', situation: 'S4-kun-en-farve', indeks: 0, seed: 2252331041, saetning: P5('0.13', '4.4') },
  // S4 opgave 2: ♠K B 9 4 ♥D 6 5 ♦E D 10 2 ♣B 2. Doubleton: P6 · S4 (B bedre, uden praktisk betydning).
  { navn: 'S4, doubleton (P6)', situation: 'S4-kun-en-farve', indeks: 2, seed: 1678438889, saetning: P6 },
  // S4 opgave 1: ♠9 8 3 2 ♥D 7 ♦K 7 4 ♣E 8 6 2. Sidefarve uden honnør: P7.
  {
    navn: 'S4, sidefarve uden honnør (P7)',
    situation: 'S4-kun-en-farve',
    indeks: 1,
    seed: 3250766520,
    saetning: {
      da: 'Med dobbeltdummy giver småkort i en sidefarve efter dette forløb i gennemsnit 0,15 stik mere end en sidefarve med en eller to honnører og sætter kontrakten 1,7 procentpoint oftere.',
      en: 'With double dummy, leading small cards in a side suit after this auction gives on average 0.15 more tricks than a side suit with one or two honours and defeats the contract 1.7 percentage points more often.',
    },
  },
  // S4 opgave 6: ♠E 9 7 6 ♥K 5 3 ♦K B 8 ♣D 4 3. Sidefarverne: P8 · S4.
  {
    navn: 'S4, sidefarverne (P8)',
    situation: 'S4-kun-en-farve',
    indeks: 6,
    seed: 3817061378,
    saetning: {
      da: 'Med dobbeltdummy giver trumf efter dette forløb i gennemsnit 0,06 stik mindre end ♠ og ♦ (sætter 1,2 procentpoint sjældnere), mens trumf og ♣ er lige gode.',
      en: 'With double dummy, leading a trump after this auction gives on average 0.06 fewer tricks than ♠ and ♦ (defeating the contract 1.2 percentage points less often), while a trump and ♣ are equally good.',
    },
  },
  // S4 opgave 53: ♠D 10 7 3 2 ♥– ♦K 10 3 ♣D 9 5 4 2. Sidefarverne, men Vest har ingen trumf: ingen sætning (Franks
  // rettelse 26. nov. 2026).
  { navn: 'S4, sidefarverne uden trumf', situation: 'S4-kun-en-farve', indeks: 53, seed: 4221155054, saetning: null },
  // S5 opgave 9: ♠10 8 4 2 ♥2 ♦E 10 8 4 ♣E D 8 6. Singleton: P5 · S5.
  { navn: 'S5, singleton (P5)', situation: 'S5-sidefarve', indeks: 9, seed: 2783398064, saetning: P5('0.11', '3.0') },
  // S5 opgave 0: ♠3 ♥5 4 2 ♦B 9 8 7 6 ♣E D 10 7. Rådet er ♦ og ♣: ingen sætning.
  { navn: 'S5, ♦ og ♣', situation: 'S5-sidefarve', indeks: 0, seed: 3407728602, saetning: null },
  // S6 opgave 0: ♠10 6 5 ♥8 7 5 ♦E D B 10 8 4 ♣6. Trumf: P8 · S6.
  {
    navn: 'S6, trumf (P8)',
    situation: 'S6-trumf',
    indeks: 0,
    seed: 3897176676,
    saetning: {
      da: 'Med dobbeltdummy giver trumf efter dette forløb i gennemsnit 0,07 stik mere end ♠ (sætter 2,7 procentpoint oftere) og 0,32 stik mere end ♥ (5,6 procentpoint oftere), mens trumf og ♦ er lige gode.',
      en: 'With double dummy, leading a trump after this auction gives on average 0.07 more tricks than ♠ (defeating the contract 2.7 percentage points more often) and 0.32 more tricks than ♥ (5.6 percentage points more often), while a trump and ♦ are equally good.',
    },
  },
  // S6 opgave 17: ♠9 7 6 5 3 2 ♥7 2 ♦E 8 6 3 2 ♣–. Ingen ♣, så ingen regel giver rådet: ingen sætning.
  { navn: 'S6 uden ♣', situation: 'S6-trumf', indeks: 17, seed: 291413044, saetning: null },
  // S7 opgave 0: ♠6 5 4 2 ♥7 5 3 ♦10 7 3 ♣5 4 3. Ingen påstand i 7a.
  { navn: 'S7', situation: 'S7-makker-aabnet', indeks: 0, seed: 2909590540, saetning: null },
  // S8 opgave 32: ♠6 5 3 ♥4 ♦E 8 7 5 4 ♣7 6 5 3. Singleton: P5 · S8.
  { navn: 'S8, singleton (P5)', situation: 'S8-delkontrakt', indeks: 32, seed: 1633961929, saetning: P5('0.17', '3.4') },
  // S8 opgave 5: ♠B 9 8 ♥D 6 4 2 ♦E D B 5 ♣8 7. Doubleton: P6 · S8.
  { navn: 'S8, doubleton (P6)', situation: 'S8-delkontrakt', indeks: 5, seed: 81800168, saetning: P6 },
  // S8 opgave 0: ♠3 ♥E 9 5 ♦10 6 2 ♣B 10 6 5 4 2. Trumf er singleton, ingen sidefarve har 1 eller 2 kort: P8 · S8.
  {
    navn: 'S8, sidefarverne (P8)',
    situation: 'S8-delkontrakt',
    indeks: 0,
    seed: 3675280785,
    saetning: {
      da: 'Med dobbeltdummy giver trumf efter dette forløb i gennemsnit 0,06 stik mindre end ♥, ♦ og ♣ (sætter 0,8–0,9 procentpoint sjældnere).',
      en: 'With double dummy, leading a trump after this auction gives on average 0.06 fewer tricks than ♥, ♦ and ♣ (defeating the contract 0.8–0.9 percentage points less often).',
    },
  },
  // S8 opgave 12: ♠– ♥E 7 6 ♦10 8 7 ♣B 10 8 7 4 3 2. Sidefarverne, men Vest har ingen trumf: ingen sætning (Franks
  // rettelse 26. nov. 2026).
  { navn: 'S8, sidefarverne uden trumf', situation: 'S8-delkontrakt', indeks: 12, seed: 550303604, saetning: null },
];

const antal = (t: string, ord: string) => t.split(ord).length - 1;

function opgaven(t: Tilfaelde): UdspilDataOpgave {
  if (t.opgave) return t.opgave;
  const o = data[t.situation].opgaver[t.indeks!];
  expect(o.seed, `${t.navn}: seed`).toBe(t.seed);
  return o;
}

describe('Udvælgelsen (accepttest 2)', () => {
  it.each(TILFAELDE.map((t) => [t.navn, t] as const))('%s', (_, t) => {
    const o = opgaven(t);
    for (const svar of SVAR) {
      const { forklaring, afvigelse } = forklarUdspil(t.situation, o, STANDARD, svar);
      const hvor = `${t.navn}, svar i ${svar}`;
      if (t.saetning === null) {
        expect(forklaring.da, hvor).not.toContain('Med dobbeltdummy');
        expect(forklaring.en, hvor).not.toContain('With double dummy');
        continue;
      }
      expect(forklaring.da.endsWith(` ${t.saetning.da}`), `${hvor}: "${forklaring.da}"`).toBe(true);
      expect(forklaring.en.endsWith(` ${t.saetning.en}`), `${hvor}: "${forklaring.en}"`).toBe(true);
      expect(antal(forklaring.da, 'Med dobbeltdummy'), hvor).toBe(1);
      expect(antal(forklaring.en, 'With double dummy'), hvor).toBe(1);
      // Sætningen står efter Kompendiets råd og indgår ikke i afvigelsen.
      const raad = forklaring.da.lastIndexOf('Kompendiet');
      expect(raad, hvor).toBeGreaterThan(-1);
      expect(forklaring.da.indexOf('Med dobbeltdummy'), hvor).toBeGreaterThan(raad);
      if (afvigelse) {
        expect(afvigelse.da, hvor).not.toContain('dobbeltdummy');
        expect(afvigelse.en, hvor).not.toContain('double dummy');
      }
    }
  });
});

describe('"Table feeling" (accepttest 2, S1 opgave 55)', () => {
  const o = data['S1-1nt-3nt'].opgaver[55];
  const TILFOEJELSE: Tekst = {
    da: 'Med dobbeltdummy giver toppen fra E K i gennemsnit 0,83 stik mere end det lave kort og sætter kontrakten 12,3 procentpoint oftere; tallet er en øvre grænse, fordi dobbeltdummy overvurderer honnørudspil.',
    en: 'With double dummy, leading the top card from A K gives on average 0.83 more tricks than the low card and defeats the contract 12.3 percentage points more often; the figure is an upper limit, because double dummy overrates honour leads.',
  };

  it('med svar i kort står tilføjelsen lige efter sætningen om ♥E og ♥3 og før Kompendiets råd', () => {
    // ♠K B 7 6 ♥E K 4 3 ♦10 8 6 3 ♣B: lige lange majorer uden en minor med 4 kort og honnør, så ingen sætning sidst.
    expect(o.seed).toBe(2556829236);
    const { forklaring } = forklarUdspil('S1-1nt-3nt', o, STANDARD, 'kort');
    expect(forklaring.da).toContain(`"table feeling" (top af sekvens): ♥E og ♥3 er begge rigtige. ${TILFOEJELSE.da} Kompendiet (s. 11–12)`);
    expect(forklaring.en).toContain(`table feeling (top of sequence): ♥A and ♥3 are both right. ${TILFOEJELSE.en} The Compendium (pp. 11–12)`);
    expect(antal(forklaring.da, 'Med dobbeltdummy')).toBe(1);
    expect(antal(forklaring.en, 'With double dummy')).toBe(1);
    expect(forklaring.da.endsWith('anbefaler udspil i ♠ eller ♥ efter dette forløb.')).toBe(true);
    expect(forklaring.en.endsWith('recommends a lead in ♠ or ♥ after this auction.')).toBe(true);
  });

  it('med svar i farve er der ingen sætning om kortene og derfor ingen tilføjelse', () => {
    const { forklaring } = forklarUdspil('S1-1nt-3nt', o, STANDARD, 'farve');
    expect(forklaring.da).not.toContain('Med dobbeltdummy');
    expect(forklaring.en).not.toContain('With double dummy');
  });
});
