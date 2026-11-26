import { describe, expect, it } from 'vitest';
import { bydeform } from '../../sprog/bydeform';
import { fund } from '../../sprog/fagord';
import type { Tekst } from '../model/forklaring';
import { alleOpgaver, datasaet, PROFILER, SITUATIONER } from '../find-udspil/hjaelp';
import { forklarUdspil, vedBordet } from '../model/findUdspil';
import { TEKSTER } from '../ui/tekster';
import foer from './foer.json';
import { nye, NYE_DA, NYE_EN, SVAR } from './hjaelp';

/*
 * Accepttest 7 i SPEC-udspilstal.md: sproget. De eksisterende sprogtests (fagordstesten, bydeformstesten og
 * src/modspil/find-udspil/sprog.test.ts og udspil-skaerme/sprog.test.tsx) læser alle forklaringer og "Ved bordet" og
 * er grønne uændret. Her tjekkes de nye sætninger for sig: husets ord og beskrivende form på dansk, ingen dansk i den
 * engelske facit, og ⓘ i Find udspillet (`udspil.hjaelp`) har én ny sætning sidst på begge sprog.
 */

/** Dansk på engelsk: som find-udspil/sprog.test.ts og udspil-skaerme/sprog.test.tsx, med de nye sætningers ord. */
const DANSK =
  /[æøåÆØÅ]|\b(og|af|til|med|ikke|eller|kort|bordet|hånden|ingen|hvor|hvad|næste|svar|hp|vest|syd|nord|pas|spiller|makker|makkers|spilfører|spilføreren|udspil|udspillet|kald|afvisning|skift|lige|ulige|regel|aftalen|stik|niveau|opgave|rigtigt|forkert|metoderne|indstillinger|spar|hjerter|ruder|klør|konge|dame|knægt|omvendt|kompendiet|egen|farve|farven|farver|sans|mod|efter|gennemsnit|fordelinger|fordelingerne|sætter|anbefaler|profilen|meldeforløbet|forløb|koster|snit|spilles|dit|dobbeltdummy|procentpoint|mindre|oftere|gode|trumf|toppen|tallet|grænse|singletonen|doubletonen|sidefarve|dog|mens)\b|[♠♥♦♣]\s*[EDB](?![a-z])/i;

const TUNG = { timeout: 180_000 };
const NY_HJAELP: Tekst = {
  da: 'Sætningerne "Med dobbeltdummy …" er gennemsnit over hænderne i meldeforløbet. Dobbeltdummy kender alle kort, så passive udspil undervurderes, og honnørudspil overvurderes.',
  en: 'The sentences "With double dummy …" are averages over the hands in the auction. Double dummy knows all the cards, so passive leads are underrated and honour leads overrated.',
};

/** Fejlene i en tekst: husets ord og bydeform på dansk, dansk på engelsk. */
function tjek(hvor: string, da: string, en: string): string[] {
  const fejl: string[] = [];
  fejl.push(...fund(da).map((f) => `${hvor}: "${f.word}" (husets ord: ${f.house}) i "${da}"`));
  fejl.push(...bydeform(da).map((b) => `${hvor}: bydeform "${b}" i "${da}"`));
  const m = en.match(DANSK);
  if (m) fejl.push(`${hvor}: dansk "${m[0]}" i "${en}"`);
  return fejl;
}

describe('Sproget i de nye sætninger (accepttest 7)', () => {
  it.each(PROFILER.map(([navn, p]) => [navn, p] as const))('forklaringerne for alle opgaver: %s', (_, p) => {
    const data = datasaet();
    const fejl: string[] = [];
    let saetninger = 0;
    for (const t of alleOpgaver(data)) {
      for (const svar of SVAR) {
        const { da, en } = forklarUdspil(t.situation, t.opgave, p, svar).forklaring;
        const hvor = `${t.situation} #${t.indeks}, ${svar}`;
        const nyeDa = nye(da, NYE_DA);
        const nyeEn = nye(en, NYE_EN);
        if (nyeDa.length !== nyeEn.length) fejl.push(`${hvor}: ${nyeDa.length} danske og ${nyeEn.length} engelske nye sætninger`);
        nyeDa.forEach((s, i) => fejl.push(...tjek(hvor, s, nyeEn[i] ?? '')));
        // Den engelske facit har ingen dansk, heller ikke uden for de nye sætninger.
        const m = en.match(DANSK);
        if (m) fejl.push(`${hvor}: dansk "${m[0]}" i "${en}"`);
        saetninger += nyeDa.length;
      }
    }
    expect(fejl.slice(0, 20)).toEqual([]);
    // Ca. 870 opgaver pr. svarform har en sætning sidst (S1–S6 og S8), og "table feeling" giver nogle flere.
    expect(saetninger).toBeGreaterThan(1500);
  }, TUNG.timeout);

  it('"Ved bordet": den nye sætning består sprogtjekket i alle situationer', () => {
    const fejl: string[] = [];
    let saetninger = 0;
    for (const id of SITUATIONER) {
      const t = vedBordet(id);
      const nyeDa = nye(t.da, NYE_DA);
      const nyeEn = nye(t.en, NYE_EN);
      expect(nyeEn, id).toHaveLength(nyeDa.length);
      nyeDa.forEach((s, i) => fejl.push(...tjek(id, s, nyeEn[i])));
      saetninger += nyeDa.length;
    }
    expect(fejl).toEqual([]);
    expect(saetninger).toBe(7);
  });
});

describe('ⓘ i Find udspillet (accepttest 7)', () => {
  it('udspil.hjaelp er teksten ved tagget med én ny sætning sidst på dansk og engelsk', () => {
    expect(TEKSTER.da.udspil.hjaelp).toBe(`${foer.hjaelp.da} ${NY_HJAELP.da}`);
    expect(TEKSTER.en.udspil.hjaelp).toBe(`${foer.hjaelp.en} ${NY_HJAELP.en}`);
  });

  it('den nye sætning består sprogtjekket', () => {
    expect(tjek('ⓘ', NY_HJAELP.da, NY_HJAELP.en)).toEqual([]);
  });
});

describe('Testen kan se forskel (accepttest 7)', () => {
  it('fanger dansk på engelsk, husets "Ikke"-ord og bydeform', () => {
    expect(tjek('ok', 'Med dobbeltdummy giver trumf 0,07 stik mere end ♠.', 'With double dummy, leading a trump gives 0.07 more tricks than ♠.')).toEqual([]);
    expect(tjek('engelsk', 'Med dobbeltdummy er de lige gode.', 'With double dummy they are lige gode.')).toHaveLength(1);
    expect(tjek('husets ord', 'Med dobbeltdummy giver snittet 0,1 stik mere.', 'With double dummy the finesse gives 0.1 more tricks.').length).toBeGreaterThan(0);
    expect(tjek('bydeform', 'Spil toppen ud fra E K.', 'Lead the top card from A K.').length).toBeGreaterThan(0);
  });
});
