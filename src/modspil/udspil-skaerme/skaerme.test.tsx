// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { hentDatasaet, type Datasaet, type FindUdspilOpgave } from '../model/findUdspil';
import { meldingTekst } from '../model/meldinger';
import { gaeldende, metode, profilId, profilNavn } from '../model/metoder';
import { kontraktTekst } from '../model/tekst';
import { udspilKategori } from '../model/udspil';
import {
  domOverskrift,
  eksempel,
  eksempler,
  facitTabel,
  foer,
  haandlinjer,
  navn,
  ren,
  rigtigtOgForkert,
  svarGruppe,
  svarPaa,
  tæt,
  visFindUdspil,
} from './hjaelp';

/*
 * Accepttest 4 i SPEC-modspil-v2.md, trin 3 (jsdom-delen): skærmene svarer til mock-up'en (`docs/specs/design/
 * modspil-v2/`) i opbygning, rækkefølge og ordlyd. Bredderne 390, 1000 og 1280 px, målene, farverne og at spalten
 * ikke dækker noget tjekkes i Chrome af `node scripts/tjek-bred-layout.mjs --modspil` med testsiden `scripts/modspil.html`
 * (`?ovelse=find-udspil&niveau=…&seed=…&profil=…`).
 *
 * Grænsefladen står i hjaelp.tsx (punkt 1–6 og Facit). Mock-up 3 viser ikke hånden ved 390 px på niveau 3–5 (kortknapperne
 * er hånden), men mock-up 5 viser den til venstre ved 1280 px; HTML'en er den samme ved alle bredder, så hånden står i
 * HTML'en på alle niveauer.
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
});

const PLADSER = ['Nord', 'Øst', 'Syd'];

/** Mærkets navn: profilen og metoden for udspillet mod kontraktens art, fx "Standard · 4.-højeste". */
function maerkeNavn(o: FindUdspilOpgave): string {
  const g = gaeldende(o.profil, udspilKategori(o.art), o.art);
  return `${profilNavn(profilId(o.profil.valg)).tekst} · ${metode(g.kategori, g.id).tekst}`;
}

function tjekOpgave(o: FindUdspilOpgave) {
  const hvor = navn(o);
  let indstillinger = 0;
  visFindUdspil(o, { onIndstillinger: () => indstillinger++ });

  // 1. Roden med øvelse, niveau og seed, og de to spalter.
  const rod = document.querySelector<HTMLElement>('[data-ovelse]');
  expect([rod?.dataset.ovelse, rod?.dataset.niveau, rod?.dataset.seed], hvor).toEqual(['find-udspil', String(o.niveau), String(o.seed)]);
  const venstre = rod!.querySelector(':scope > .wide-left');
  const hoejre = rod!.querySelector(':scope > .wide-right');
  expect(venstre && hoejre, `${hvor}: .wide-left og .wide-right`).toBeTruthy();

  // 2. Niveau og opgavenummer, og mærket med profilen og metoden.
  const hoved = screen.getByText(`Niveau ${o.niveau} · opgave 2 af 4`);
  const maerke = screen.getByRole('button', { name: maerkeNavn(o) });
  fireEvent.click(maerke);
  expect(indstillinger, `${hvor}: mærket fører til Indstillinger`).toBe(1);

  // 3. Meldeforløbet som skema med fire kolonner og linjen om kontrakten.
  const skema = screen.getByRole('table', { name: 'Meldeforløbet' });
  const kolonner = within(skema).getAllByRole('columnheader').map((c) => ren(c.textContent));
  expect(kolonner[0], `${hvor}: første kolonne er Vest`).toMatch(/^Vest\b/);
  expect(kolonner.slice(1), hvor).toEqual(PLADSER);
  const celler = [...skema.querySelectorAll('td')].map((c) => ren(c.textContent)).filter(Boolean);
  expect(celler, hvor).toEqual(o.meldinger.map((m) => meldingTekst(m.split(':')[1], 'da')));
  expect(skema.parentElement?.textContent, hvor).toContain(`Syd spiller ${kontraktTekst(o.kontrakt)}`);
  expect(venstre!.contains(skema), `${hvor}: meldeforløbet i venstre spalte`).toBe(true);

  // 4. Vests hånd; bordet og stikket vises ikke.
  const dig = document.querySelector('[data-haand="dig"]');
  expect(dig, `${hvor}: Vests hånd`).toBeTruthy();
  for (const l of haandlinjer(o.vest)) expect(tæt(dig!.textContent), `${hvor}: din hånd ${l}`).toContain(l);
  expect(venstre!.contains(dig), `${hvor}: hånden i venstre spalte`).toBe(true);
  expect(document.querySelector('[data-haand="nord"]'), `${hvor}: bordet vises ikke`).toBeNull();
  expect(screen.queryByRole('img', { name: /^Stik \d+: / }), `${hvor}: intet stik`).toBeNull();

  // 5. Øvelsens navn med ⓘ og spørgsmålet.
  const spoergsmaal = screen.getByRole('heading', { level: 1 });
  expect(ren(spoergsmaal.textContent), hvor).toBe(o.svar === 'farve' ? 'Hvilken farve spilles ud?' : 'Hvilket kort spilles ud?');
  expect(screen.getByText('Find udspillet'), hvor).toBeTruthy();
  const info = screen.getByRole('button', { name: 'Hjælp: Find udspillet' });
  expect(hoejre!.contains(spoergsmaal) && hoejre!.contains(info), `${hvor}: spørgsmålet i højre spalte`).toBe(true);

  // 6. Svarknapperne under spørgsmålet; ingen "Kan ikke afgøres".
  const gruppe = svarGruppe();
  expect(hoejre!.contains(gruppe), `${hvor}: svarknapperne i højre spalte`).toBe(true);
  expect(screen.queryByRole('button', { name: 'Kan ikke afgøres' }), hvor).toBeNull();

  // Rækkefølgen i HTML'en.
  for (const [a, b, hvad] of [
    [hoved, maerke, 'niveau, mærke'],
    [maerke, skema, 'mærke, meldeforløb'],
    [skema, dig!, 'meldeforløb, hånd'],
    [dig!, spoergsmaal, 'hånd, spørgsmål'],
    [spoergsmaal, gruppe, 'spørgsmål, svarknapper'],
  ] as const)
    expect(foer(a, b), `${hvor}: ${hvad}`).toBe(true);
  cleanup();
}

describe('Opgaven som mock-up\'en (accepttest 4, trin 3)', () => {
  it('alle situationer på niveau 1–4 med alle tre profiler: delene i specens rækkefølge og i de to spalter', () => {
    for (const o of eksempler(data)) tjekOpgave(o);
  }, 120_000);

  it('mock-up 1 og 3: S1 opgave 55 med Standard', () => {
    for (const niveau of [1, 3] as const) {
      const o = eksempel(data, niveau);
      visFindUdspil(o);
      expect(screen.getByText(`Niveau ${niveau} · opgave 2 af 4`)).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Standard · 4.-højeste' })).toBeTruthy();
      expect(document.querySelector('[data-haand="dig"]')?.textContent?.replace(/\s+/g, '')).toContain('♠KB76♥EK43♦10863♣B');
      expect(ren(screen.getByRole('heading', { level: 1 }).textContent)).toBe(niveau === 1 ? 'Hvilken farve spilles ud?' : 'Hvilket kort spilles ud?');
      expect(screen.getByRole('table', { name: 'Meldeforløbet' }).parentElement?.textContent).toContain('Syd spiller 3NT');
      cleanup();
    }
  });
});

describe('Facit som mock-up\'en (accepttest 4, trin 3)', () => {
  it('mock-up 2: niveau 1 med svaret ♦ giver "Forkert: ♥ giver flest stik", og facit står i højre spalte under spørgsmålet', () => {
    const o = eksempel(data, 1);
    visFindUdspil(o, { svar: svarPaa(o, { farve: 2 }) });
    expect(ren(domOverskrift()?.textContent)).toBe('Forkert: ♥ giver flest stik');
    const hoejre = document.querySelector('[data-ovelse] > .wide-right')!;
    const maerke = document.querySelector('[data-dom]')!;
    expect(hoejre.contains(maerke) && hoejre.contains(facitTabel()!)).toBe(true);
    expect(foer(screen.getByRole('heading', { name: 'Hvilken farve spilles ud?' }), maerke)).toBe(true);
  });

  it('mock-up 4: niveau 3 med svaret ♥4 giver "Forkert: ♥E giver flest stik"', () => {
    const o = eksempel(data, 3);
    visFindUdspil(o, { svar: svarPaa(o, { kort: 15 }) });
    expect(ren(domOverskrift()?.textContent)).toBe('Forkert: ♥E giver flest stik');
  });

  it('et rigtigt svar giver en overskrift, der begynder med "Rigtigt"', () => {
    for (const niveau of [1, 3] as const) {
      const o = eksempel(data, niveau);
      visFindUdspil(o, { svar: svarPaa(o, rigtigtOgForkert(o).rigtigt) });
      expect(ren(domOverskrift()?.textContent), `niveau ${niveau}`).toMatch(/^Rigtigt\b/);
      cleanup();
    }
  });
});
