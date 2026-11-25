import { describe, expect, it } from 'vitest';
import { forklarUdspil, lavFindUdspil, pulje, udspilFacit, type Svarform, type UdspilFacit } from '../model/findUdspil';
import { alleOpgaver, datasaet, PROFILER, situation, SYMBOL } from './hjaelp';

/*
 * Accepttest 5 i SPEC-modspil-v2.md, trin 2: en opgave afviger fra Kompendiet, når den er klar, og den bedste farve
 * ikke er blandt dem, `kompendieraad` peger på. Den findes kun på niveau 4–5, og forklaringen nævner både rådet og den
 * bedste farve ("Kompendiet anbefaler ♥ efter dette forløb, men med denne hånd giver ♠ flest stik."). Peger rådet ikke
 * på nogen farve, Vest har (4 opgaver i datasættet), nævner forklaringen Kompendiet og den bedste farve.
 *
 * Med samme fil: forklaringen nævner situationen, tallene og Kompendiets råd med siden (specens Facit og forklaringen).
 * Situationen er meldeforløbet fra situationsfilen (`navn`, på engelsk `navnEn`); tallene er mindst én bedste farves
 * middelstik med én decimal (rundet halvt op fra hundrededele; decimalkomma på dansk, punktum på engelsk) og chancen
 * for at sætte kontrakten i hele procent; siden står som "s. 14" og på engelsk "p. 14" (eller "pp. 11–12").
 */

const data = datasaet();
const ALLE = alleOpgaver(data);
const SVAR: readonly Svarform[] = ['farve', 'kort'];
const TUNG = { timeout: 120_000 };

/** Middelstikket med én decimal, rundet halvt op fra hundrededele. */
function tiendedele(middel: number, sprog: 'da' | 'en'): string {
  const t = Math.floor((Math.round(middel * 100) + 5) / 10);
  return `${Math.floor(t / 10)}${sprog === 'da' ? ',' : '.'}${t % 10}`;
}
const procent = (saet: number, n: number) => Math.floor((200 * saet + n) / (2 * n));
const harProcent = (tekst: string, pct: number) => new RegExp(`(^|[^\\d,.])${pct}\\s?%`).test(tekst);

describe.each(PROFILER)('Afviger fra Kompendiet (accepttest 5): %s', (_, p) => {
  it('findes kun på niveau 4–5', TUNG, () => {
    const facit = new Map(ALLE.map((t) => [`${t.situation}#${t.indeks}`, udspilFacit(t.situation, t.opgave, p)]));
    const afviger = (situationId: string, indeks: number) => facit.get(`${situationId}#${indeks}`)!.afviger;
    for (const niveau of [1, 2, 3] as const) {
      expect(pulje(niveau, p, data).filter((r) => afviger(r.situation, r.indeks)), `niveau ${niveau}`).toEqual([]);
      for (let seed = 1; seed <= 200; seed++) expect(lavFindUdspil(niveau, seed, p, data).facit.afviger, `niveau ${niveau}, seed ${seed}`).toBe(false);
    }
    const alle = [...facit.values()].filter((f) => f.afviger).length;
    expect(alle).toBeGreaterThan(0);
    for (const niveau of [4, 5] as const) {
      expect(pulje(niveau, p, data).filter((r) => afviger(r.situation, r.indeks)), `niveau ${niveau}`).toHaveLength(alle);
      const fundet = Array.from({ length: 600 }, (_x, i) => lavFindUdspil(niveau, i + 1, p, data)).filter((o) => o.facit.afviger).length;
      expect(fundet, `niveau ${niveau}: opgaver, der afviger, blandt 600`).toBeGreaterThan(0);
    }
  });

  it('forklaringen nævner både rådet og den bedste farve, og kun opgaver, der afviger, har sætningen', TUNG, () => {
    const fejl: string[] = [];
    let afvigere = 0;
    for (const t of ALLE) {
      const f = udspilFacit(t.situation, t.opgave, p);
      for (const svar of SVAR) {
        const hvor = `${t.situation} #${t.indeks}, ${svar}`;
        const { forklaring, afvigelse } = forklarUdspil(t.situation, t.opgave, p, svar);
        if (!f.afviger) {
          if (afvigelse !== undefined) fejl.push(`${hvor}: afviger ikke, men har "${afvigelse.da}"`);
          continue;
        }
        afvigere++;
        if (!afvigelse) {
          fejl.push(`${hvor}: afviger, men sætningen mangler`);
          continue;
        }
        if (!forklaring.da.includes(afvigelse.da) || !forklaring.en.includes(afvigelse.en)) fejl.push(`${hvor}: sætningen står ikke i forklaringen`);
        if (!afvigelse.da.includes('Kompendiet') || !afvigelse.en.includes('Compendium')) fejl.push(`${hvor}: "${afvigelse.da}" nævner ikke Kompendiet`);
        // Klar betyder én bedste farve.
        expect(f.farver, hvor).toHaveLength(1);
        for (const farve of [...f.raad, f.farver[0]]) {
          if (!afvigelse.da.includes(SYMBOL[farve]) || !afvigelse.en.includes(SYMBOL[farve])) fejl.push(`${hvor}: "${afvigelse.da}" nævner ikke ${SYMBOL[farve]}`);
        }
      }
    }
    expect(fejl.slice(0, 10)).toEqual([]);
    expect(afvigere).toBeGreaterThan(0);
  });
});

describe.each(PROFILER)('Forklaringen nævner situationen, tallene og Kompendiets råd med siden (Facit og forklaringen): %s', (_, p) => {
  it('alle opgaver, med farve og med kort', TUNG, () => {
    const fejl: string[] = [];
    for (const t of ALLE) {
      const s = situation(t.situation);
      const f: UdspilFacit = udspilFacit(t.situation, t.opgave, p);
      const top = Math.max(...f.tabel.map((r) => r.middel));
      const bedste = f.tabel.filter((r) => r.middel === top);
      for (const svar of SVAR) {
        const hvor = `${t.situation} #${t.indeks}, ${svar}`;
        const { da, en } = forklarUdspil(t.situation, t.opgave, p, svar).forklaring;
        if (!da.includes(s.navn) || !en.includes(s.navnEn)) fejl.push(`${hvor}: nævner ikke ${s.navn}`);
        if (!da.includes('Kompendiet') || !da.includes(`s. ${s.sider[0]}`)) fejl.push(`${hvor}: "${da}" nævner ikke Kompendiet med siden`);
        if (!en.includes('Compendium') || !en.includes(`p. ${s.sider[0]}`)) fejl.push(`${hvor}: "${en}" nævner ikke the Compendium med siden`);
        const tal = (tekst: string, sprog: 'da' | 'en') =>
          bedste.some((r) => tekst.includes(tiendedele(r.middel, sprog)) && harProcent(tekst, procent(r.saet, f.fordelinger)));
        if (!tal(da, 'da') || !tal(en, 'en')) fejl.push(`${hvor}: "${da}" nævner ikke den bedste farves middelstik og chance`);
      }
    }
    expect(fejl.slice(0, 10)).toEqual([]);
  });
});

describe('Forklaringens tal (Facit og forklaringen)', () => {
  it('testen kan se forskel: tallene skrives med én decimal og hele procent', () => {
    expect(tiendedele(4.05, 'da')).toBe('4,1');
    expect(tiendedele(4.04, 'en')).toBe('4.0');
    expect(tiendedele(2.95, 'da')).toBe('3,0');
    expect(procent(38, 100)).toBe(38);
    expect(harProcent('og sætter 3NT i 38 % af fordelingerne', 38)).toBe(true);
    expect(harProcent('and defeats 3NT in 38% of the deals', 38)).toBe(true);
    expect(harProcent('i 138 % af', 38)).toBe(false);
    expect(harProcent('4,38 %', 38)).toBe(false);
  });
});
