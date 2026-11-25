// @vitest-environment jsdom
/*
 * Accepttest 3 (øvelse 8) og 4 for SPEC-modspil-kompas.md: hp med små bogstaver i "Vest · dig · 12 hp" og "table
 * feeling" i facit-tabellen i Find udspillet.
 *
 * Fra niveau 3 får en farve, hvor profilen giver to kort, en række for hvert kort: kortet, der giver farvens værdi,
 * står i farvens række som før, og det andet kort står lige under med egne stik og sætninger, mærket "table feeling" og
 * sin pris (det bedste svars middelstik minus kortets), også efter et rigtigt svar. Grænsefladen: `PrisRaekke` i
 * `udspilPris.ts` har det valgfrie felt `tableFeeling: true` i den række.
 *
 * Eksemplet: S1 opgave 55 med Standard på niveau 3 (`eksempel(data, 3)`): ♥E 3,35 stik og 14 %, ♥3 2,52 og 4 %
 * (prisen 0,83, vist "0,8").
 */
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLang } from '../../i18n';
import { hentDatasaet, type Datasaet } from '../model/findUdspil';
import { udspilPris } from '../model/udspilPris';
import { eksempel, eksempler, facitTabel, navn, svarPaa, tjekTabel, visFindUdspil, visteRaekker } from './hjaelp';

const HJERTER_3 = 14;
const HJERTER_E = 25;

let data: Datasaet;
beforeAll(async () => {
  data = await hentDatasaet();
}, 30_000);
beforeEach(() => {
  window.scrollTo = vi.fn();
  localStorage.clear();
  setLang('da');
});
afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Table feeling i facit-tabellen (accepttest 4)', () => {
  it('udspilPris: ♥E i farvens række og ♥3 lige under med 2,52 stik, 4 sætninger, prisen 83 og tableFeeling', () => {
    const o = eksempel(data, 3);
    for (const svar of [{ kort: HJERTER_E }, { kort: HJERTER_3 }]) {
      const r = udspilPris(o, svar).raekker;
      expect(r.map((x) => [x.farve, x.kort, x.middel, x.saet, x.rigtig, x.tableFeeling === true, x.koster]).slice(0, 2)).toEqual([
        [1, HJERTER_E, 3.35, 14, true, false, null],
        [1, HJERTER_3, 2.52, 4, false, true, 83],
      ]);
      expect(r.length, 'fem rækker: fire farver og ♥3').toBe(5);
      expect(r[1].ditSvar, 'dit svar står ved ♥3, når ♥3 er valgt').toBe(svar.kort === HJERTER_3);
      expect(udspilPris(o, svar).pris, 'et rigtigt svar har ingen pris').toBeNull();
    }
  });

  it('niveau 1–2 har stadig én række pr. farve uden tableFeeling', () => {
    const r = udspilPris(eksempel(data, 1), { farve: 1 }).raekker;
    expect(r.length).toBe(4);
    expect(r.some((x) => x.tableFeeling)).toBe(false);
  });

  it('skærmen: rækken ♥3 med mærket "table feeling", 2,5 stik, 4 % og 0,8 i Koster, også efter det rigtige ♥E', () => {
    const o = eksempel(data, 3);
    visFindUdspil(o, { svar: svarPaa(o, { kort: HJERTER_E }) });
    const r = visteRaekker(facitTabel()!);
    expect(r[1].udspil.replace(/\s+/g, '')).toContain('♥3');
    expect(r[1].udspil).toContain('table feeling');
    expect(r[1].udspil).not.toContain('✓');
    expect([r[1].stik, r[1].saetter, r[1].koster]).toEqual(['2,5', '4 %', '0,8']);
    tjekTabel(o, { kort: HJERTER_E });
  });

  it('alle eksempelopgaver fra niveau 3: hver farve med to kort fra profilen har en række "table feeling"', () => {
    let tf = 0;
    for (const o of eksempler(data).filter((x) => x.svar === 'kort')) {
      const svar = { kort: o.facit.kort[0] };
      const r = udspilPris(o, svar).raekker;
      for (const f of o.facit.tabel.filter((t) => t.kort.length === 2)) {
        expect(r.filter((x) => x.farve === f.farve && x.tableFeeling).length, `${navn(o)}: farve ${f.farve}`).toBe(1);
        tf++;
      }
      expect(r.filter((x) => x.tableFeeling).length, navn(o)).toBe(o.facit.tabel.filter((t) => t.kort.length === 2).length);
    }
    expect(tf, 'eksemplerne har table feeling').toBeGreaterThan(0);
  });
});

describe('hp med små bogstaver i øvelse 8 (accepttest 3)', () => {
  it('"Vest · dig · <n> hp" har tallet og hp i et element med klassen ms-hp', () => {
    const o = eksempel(data, 1);
    visFindUdspil(o);
    const hp = document.querySelector('[data-haand="dig"] .ms-hp');
    expect(hp?.textContent?.trim()).toMatch(/^\d+ hp$/);
  });
});
