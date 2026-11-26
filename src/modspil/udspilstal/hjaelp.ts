import { createHash } from 'node:crypto';
import { PROFILER, SITUATIONER } from '../find-udspil/hjaelp';
import { udspilFacit, type Datasaet, type FindUdspilOpgave, type SituationId, type Svarform } from '../model/findUdspil';
import { udspilPris } from '../model/udspilPris';

/*
 * Fælles kode til accepttestene for SPEC-udspilstal.md (tallene fra afsnit 7a i forklaringerne i Find udspillet). Kun til
 * testene. `foer.json` er skrevet i den røde fase med koden ved tagget (main før ændringen) og rettes ikke bagefter.
 */

export const TAG = 'v51-foer-udspilstal';

/** Svarformerne i den rækkefølge, testene gennemgår dem. */
export const SVAR: readonly Svarform[] = ['farve', 'kort'];

/**
 * Accepttest 5: tre faste opgaver pr. situation (indeks i datasættet), valgt, så de dækker reglerne bag Kompendiets råd,
 * "table feeling" (E K, K D, D B og B 10) og opgaver, der afviger fra Kompendiet.
 */
export const FASTE: Readonly<Record<SituationId, readonly number[]>> = {
  'S1-1nt-3nt': [28, 42, 55],
  'S2-stayman': [1, 18, 130],
  'S3-transfer': [0, 8, 43],
  'S4-kun-en-farve': [0, 6, 32],
  'S5-sidefarve': [0, 9, 130],
  'S6-trumf': [0, 17, 26],
  'S7-makker-aabnet': [0, 1, 18],
  'S8-delkontrakt': [0, 5, 55],
};

/**
 * Accepttest 6: facit (farver, kort, klar, afviger og tabel) og prisen for hvert muligt svar (hver farve og hvert kort)
 * for alle opgaver og de tre profiler, som én sha256.
 */
export function facitHash(data: Datasaet): string {
  const hash = createHash('sha256');
  for (const id of SITUATIONER) {
    data[id].opgaver.forEach((o, indeks) => {
      for (const [navn, p] of PROFILER) {
        const f = udspilFacit(id, o, p);
        const priser = SVAR.map((svar) => {
          const opgave = { svar, vest: [...o.vest], facit: f, profil: p } as unknown as FindUdspilOpgave;
          return svar === 'farve' ? f.tabel.map((r) => udspilPris(opgave, { farve: r.farve })) : o.vest.map((kort) => udspilPris(opgave, { kort }));
        });
        hash.update(JSON.stringify([id, indeks, navn, f.farver, f.kort, f.klar, f.afviger, f.tabel, priser]));
      }
    });
  }
  return hash.digest('hex');
}

/** De nye sætninger i en dansk tekst: hver begynder med "Med dobbeltdummy" og slutter med punktum før mellemrum eller slut. */
export const NYE_DA = / Med dobbeltdummy .*?\.(?= |$)/g;
/** De nye sætninger i en engelsk tekst ("With double dummy, …"). */
export const NYE_EN = / With double dummy, .*?\.(?= |$)/g;

/** Teksten uden de nye sætninger. */
export const uden = (t: string, re: RegExp): string => t.replace(re, '');

/** De nye sætninger i teksten, uden det foranstillede mellemrum. */
export const nye = (t: string, re: RegExp): string[] => [...t.matchAll(re)].map((m) => m[0].slice(1));
