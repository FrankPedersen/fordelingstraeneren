// @vitest-environment jsdom
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLang } from '../../i18n';
import { hentDatasaet, lavFindUdspil, type Datasaet, type FindUdspilOpgave, type UdspilSvar } from '../model/findUdspil';
import { profil } from '../model/metoder';
import { kortTekst } from '../model/tekst';
import { prisTekst, udspilPris, type PrisRaekke } from '../model/udspilPris';
import {
  ditSvarLinje,
  eksempel,
  eksempler,
  EKSEMPEL,
  erRigtigt,
  facitTabel,
  forventedeRaekker,
  forventetPris,
  h,
  haandlinjer,
  muligeSvar,
  navn,
  prisSomTekst,
  ren,
  svarPaa,
  svarTekst,
  tjekTabel,
  visFindUdspil,
  visteRaekker,
} from './hjaelp';

/*
 * Accepttest 10 i SPEC-modspil-v2.md, trin 3: prisen (Franks valg 25. nov. 2026, mock-up'ens variant med prisen), med
 * faste eksempler fra datasættet. Prisen er det bedste svars middelstik minus det valgte svars, regnet i hundrededele og
 * vist med én decimal rundet halvt op (som `tiendedele`). Er svaret forkert, står under mærket "Dit svar: ♦ · koster 0,5
 * stik i snit", og kolonnen "Koster" viser prisen for hver række (de rigtige "–"). Et rigtigt svar har ingen pris, og
 * kolonnen står med "–" i alle rækker (Franks valg 25. nov. 2026, session 3a). Under 0,1 stik: "koster under 0,1 stik i
 * snit". Scoringen er stadig rigtigt eller forkert, og modellen fra trin 2 ændres ikke.
 *
 * Eksemplet: S1-1nt-3nt, opgave 55 (seed 2556829236 i datasættet), Standard, Vest ♠K B 7 6 ♥E K 4 3 ♦10 8 6 3 ♣B: ♥E
 * 3,35 stik og 14 %, ♦3 2,87 og 8 %, ♣B 2,86 og 7 %, ♠6 2,49 og 4 %, ♥4 2,52 og 4 %. Niveau 1 med ♦ koster 0,5 (3,35 −
 * 2,87 = 0,48) og ♠ 0,9 (0,86); niveau 3 med ♥4 koster 0,8 (0,83) og har sin egen række.
 *
 * Grænsefladen: `src/modspil/model/udspilPris.ts` med `udspilPris(opgave, svar)` → `{ pris, raekker }` og
 * `prisTekst(hundrededele, sprog)` (typerne står i filen), og på skærmen linjen "Dit svar: …" (et `<p>`) og tabellens
 * kolonne Koster (hjaelp.tsx).
 */

let data: Datasaet;
beforeAll(async () => {
  data = await hentDatasaet();
}, 30_000);
beforeEach(() => {
  window.scrollTo = vi.fn();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  setLang('da');
});

const HJERTER_4 = 15;
const HJERTER_E = 25;
const HJERTER_K = 24;

/** Hjælperens rækker sammenlignet med de forventede: samme rækker i en rækkefølge, hvor lige store farver må bytte. */
function tjekRaekker(o: FindUdspilOpgave, svar: UdspilSvar, raekker: PrisRaekke[]) {
  const hvor = `${navn(o)}, svar ${svarTekst(svar)}`;
  const ventet = forventedeRaekker(o, svar);
  expect(raekker.length, `${hvor}: antal rækker`).toBe(ventet.length);
  const set = new Set<number>();
  raekker.forEach((r, i) => {
    const egen = set.has(r.farve);
    if (egen) expect(raekker[i - 1].farve, `${hvor}: "dit svar" lige under sin farve`).toBe(r.farve);
    set.add(r.farve);
    const v = ventet.find((x) => x.farve === r.farve && x.egen === egen)!;
    expect(v, `${hvor}, række ${i + 1}`).toBeTruthy();
    const her = `${hvor}, række ${i + 1}`;
    expect([r.middel, r.saet, r.rigtig, r.ditSvar, r.koster], her).toEqual([v.middel, v.saet, v.rigtig, v.ditSvar, v.koster]);
    if (o.svar === 'kort') expect(v.kort, `${her}: kortet`).toContain(r.kort);
    else expect(r.kort, `${her}: niveau 1–2 har intet kort`).toBeUndefined();
  });
  const farverne = raekker.filter((r, i) => raekker.findIndex((x) => x.farve === r.farve) === i);
  for (let i = 1; i < farverne.length; i++) expect(h(farverne[i].middel) <= h(farverne[i - 1].middel), `${hvor}: flest stik først`).toBe(true);
}

describe('Eksemplet fra mock-up\'en (accepttest 10, trin 3)', () => {
  it('seed 35 på niveau 1 og seed 48 på niveau 3 giver S1 opgave 55 med mock-up\'ens tal', () => {
    for (const niveau of [1, 3] as const) {
      const o = eksempel(data, niveau);
      expect([o.situation, o.indeks, o.dataSeed, o.profil.id], `niveau ${niveau}`).toEqual([EKSEMPEL.situation, EKSEMPEL.indeks, EKSEMPEL.dataSeed, 'standard']);
      expect(haandlinjer(o.vest)).toEqual(['♠KB76', '♥EK43', '♦10863', '♣B']);
      expect(o.facit.tabel.map((r) => [r.farve, r.middel, r.saet])).toEqual([[0, 2.49, 4], [1, 3.35, 14], [2, 2.87, 8], [3, 2.86, 7]]);
      expect(o.facit.farver).toEqual([1]);
      const k = o.facit.kortTabel.find((x) => x.kort === HJERTER_4)!;
      expect([k.middel, k.saet]).toEqual([2.52, 4]);
    }
  });
});

describe('Prisen regnes i hundrededele (accepttest 10, trin 3)', () => {
  it('niveau 1: ♦ koster 0,5 og ♠ 0,9; ♥ er rigtigt og har ingen pris', () => {
    const o = eksempel(data, 1);
    expect(udspilPris(o, { farve: 2 }).pris).toBe(48);
    expect(prisTekst(48, 'da')).toBe('0,5');
    expect(udspilPris(o, { farve: 0 }).pris).toBe(86);
    expect(prisTekst(86, 'da')).toBe('0,9');
    expect(udspilPris(o, { farve: 3 }).pris).toBe(49);
    const rigtigt = udspilPris(o, { farve: 1 });
    expect(rigtigt.pris).toBeNull();
    expect(rigtigt.raekker.map((r) => r.koster)).toEqual([null, null, null, null]);
  });

  it('niveau 1 med ♦: rækkerne ♥ ✓, ♦ dit svar, ♣ og ♠ med flest stik først og Koster –, 0,48, 0,49 og 0,86', () => {
    const r = udspilPris(eksempel(data, 1), { farve: 2 }).raekker;
    expect(r.map((x) => [x.farve, x.rigtig, x.ditSvar, x.koster])).toEqual([
      [1, true, false, null],
      [2, false, true, 48],
      [3, false, false, 49],
      [0, false, false, 86],
    ]);
  });

  it('niveau 3: ♥4 koster 0,8 og har sin egen række lige under ♥E; ♥E og ♥3 er rigtige ("table feeling")', () => {
    const o = eksempel(data, 3);
    const p = udspilPris(o, { kort: HJERTER_4 });
    expect(p.pris).toBe(83);
    expect(prisTekst(83, 'da')).toBe('0,8');
    expect(p.raekker.map((x) => [x.farve, x.kort, x.rigtig, x.ditSvar, x.koster])).toEqual([
      [1, HJERTER_E, true, false, null],
      [1, HJERTER_4, false, true, 83],
      [2, 27, false, false, 48],
      [3, 48, false, false, 49],
      [0, 4, false, false, 86],
    ]);
    expect(udspilPris(o, { kort: HJERTER_E }).pris).toBeNull();
    expect(udspilPris(o, { kort: 14 }).pris).toBeNull();
  });

  it('et forkert kort under 0,1 stik fra det bedste: ♥K har samme middelstik som ♥E og koster 0', () => {
    const p = udspilPris(eksempel(data, 3), { kort: HJERTER_K });
    expect(p.pris).toBe(0);
    expect(p.raekker.find((r) => r.kort === HJERTER_K)?.ditSvar).toBe(true);
  });

  it('rundingen: én decimal rundet halvt op fra hundrededele, på begge sider af 0,05', () => {
    expect([45, 44, 5, 4, 15, 14, 95, 105, 100].map((x) => prisTekst(x, 'da'))).toEqual(['0,5', '0,4', '0,1', '0,0', '0,2', '0,1', '1,0', '1,1', '1,0']);
    expect([45, 44, 86].map((x) => prisTekst(x, 'en'))).toEqual(['0.5', '0.4', '0.9']);
  });

  it('alle svar i alle eksempelopgaver: hjælperen giver prisen og rækkerne, som testen regner dem ud fra facit', () => {
    let set = 0;
    for (const o of eksempler(data)) {
      for (const svar of muligeSvar(o)) {
        const p = udspilPris(o, svar);
        expect(p.pris, `${navn(o)}, svar ${svarTekst(svar)}`).toBe(forventetPris(o, svar));
        tjekRaekker(o, svar, p.raekker);
        set++;
      }
    }
    expect(set).toBeGreaterThan(500);
  }, 60_000);
});

/** Linjen "Dit svar: …" på skærmen for svaret. */
function linje(o: FindUdspilOpgave, svar: UdspilSvar, sprog: 'da' | 'en' = 'da'): string {
  const givet = svarPaa(o, svar);
  setLang(sprog);
  visFindUdspil(o, { svar: givet });
  const p = ditSvarLinje(sprog);
  expect(p, `${navn(o)}: linjen "Dit svar"`).toBeTruthy();
  return ren(p!.textContent);
}

describe('Prisen på skærmen (accepttest 10, trin 3)', () => {
  it('niveau 1 med ♦: "Dit svar: ♦ · koster 0,5 stik i snit", og tabellens Koster', () => {
    const o = eksempel(data, 1);
    expect(linje(o, { farve: 2 })).toBe('Dit svar: ♦ · koster 0,5 stik i snit');
    tjekTabel(o, { farve: 2 });
    expect(visteRaekker(facitTabel()!).map((r) => [r.stik, r.saetter, r.koster])).toEqual([
      ['3,4', '14 %', '–'],
      ['2,9', '8 %', '0,5'],
      ['2,9', '7 %', '0,5'],
      ['2,5', '4 %', '0,9'],
    ]);
  });

  it('niveau 1 med ♠: "koster 0,9 stik i snit"', () => {
    expect(linje(eksempel(data, 1), { farve: 0 })).toBe('Dit svar: ♠ · koster 0,9 stik i snit');
  });

  it('niveau 3 med ♥4: "Dit svar: ♥4 · koster 0,8 stik i snit", og ♥4 har sin egen række lige under ♥E', () => {
    const o = eksempel(data, 3);
    expect(linje(o, { kort: HJERTER_4 })).toBe('Dit svar: ♥4 · koster 0,8 stik i snit');
    tjekTabel(o, { kort: HJERTER_4 });
    const r = visteRaekker(facitTabel()!);
    expect(r[0].udspil).toContain('♥E');
    expect(r[0].udspil).toContain('✓');
    expect(r[1].udspil.replace(/\s+/g, '')).toContain('♥4');
    expect(r[1].udspil).toContain('dit svar');
    expect(r.map((x) => [x.stik, x.saetter, x.koster])).toEqual([
      ['3,4', '14 %', '–'],
      ['2,5', '4 %', '0,8'],
      ['2,9', '8 %', '0,5'],
      ['2,9', '7 %', '0,5'],
      ['2,5', '4 %', '0,9'],
    ]);
  });

  it('et forkert kort under 0,1 stik fra det bedste giver "koster under 0,1 stik i snit" (fundet i datasættet)', () => {
    let fundet: [FindUdspilOpgave, UdspilSvar] | undefined;
    // Søgningen: eksempelopgaverne på niveau 3–4 med alle tre profiler, og deres forkerte kort.
    for (const o of eksempler(data).filter((x) => x.svar === 'kort')) {
      const kort = o.vest.find((c) => !erRigtigt(o, { kort: c }) && forventetPris(o, { kort: c })! < 10);
      if (kort !== undefined) {
        fundet = [o, { kort }];
        break;
      }
    }
    expect(fundet, 'et forkert kort under 0,1 stik fra det bedste i datasættet').toBeDefined();
    const [o, svar] = fundet!;
    expect(linje(o, svar), navn(o)).toBe(`Dit svar: ${svarTekst(svar)} · koster under 0,1 stik i snit`);
    cleanup();
    // Og i mock-up'ens eksempel: ♥K har samme middelstik som ♥E.
    expect(linje(eksempel(data, 3), { kort: HJERTER_K })).toBe('Dit svar: ♥K · koster under 0,1 stik i snit');
  });

  it('et rigtigt svar har ingen pris, og kolonnen Koster står med "–" i alle rækker', () => {
    for (const [niveau, svar] of [[1, { farve: 1 }], [3, { kort: HJERTER_E }], [3, { kort: 14 }]] as const) {
      const o = eksempel(data, niveau);
      const l = linje(o, svar);
      expect(l, `niveau ${niveau}`).toMatch(/^Dit svar: /);
      expect(l, `niveau ${niveau}`).not.toMatch(/koster/);
      expect(visteRaekker(facitTabel()!).map((r) => r.koster), `niveau ${niveau}`).toEqual(o.facit.tabel.map(() => '–'));
      cleanup();
    }
  });

  it('rundingen på skærmen: en pris med 5 hundrededele rundes op og en med 4 ned (fundet i datasættet)', () => {
    const standard = profil('standard');
    for (const ciffer of [5, 4]) {
      let fundet: [FindUdspilOpgave, UdspilSvar, number] | undefined;
      for (let seed = 1; seed < 2000 && !fundet; seed++) {
        const opgave = lavFindUdspil(1, seed, standard, data);
        for (const svar of muligeSvar(opgave)) {
          const p = forventetPris(opgave, svar);
          if (p !== null && p % 10 === ciffer) {
            fundet = [opgave, svar, p];
            break;
          }
        }
      }
      expect(fundet, `en pris med ${ciffer} hundrededele`).toBeDefined();
      const [o, svar, p] = fundet!;
      const ventet = prisSomTekst(p, 'da');
      expect(ventet, `${p} hundrededele`).toBe(`${Math.floor((p + 5) / 100)},${Math.floor((p + 5) / 10) % 10}`);
      expect(linje(o, svar), `${navn(o)}: ${p} hundrededele`).toBe(`Dit svar: ${svarTekst(svar)} · koster ${ventet} stik i snit`);
      cleanup();
    }
  });

  it('engelsk: "Your answer: ♦ · costs 0.5 tricks on average", og under 0,1 stik "… 0.1 tricks on average"', () => {
    const o = eksempel(data, 1);
    expect(linje(o, { farve: 2 }, 'en')).toBe('Your answer: ♦ · costs 0.5 tricks on average');
    tjekTabel(o, { farve: 2 }, 'en');
    cleanup();
    const l = linje(eksempel(data, 3), { kort: HJERTER_K }, 'en');
    expect(l).toMatch(/^Your answer: ♥K · /);
    expect(l).toContain('0.1 tricks on average');
    expect(kortTekst(HJERTER_K, 'en')).toBe('♥K');
  });
});
