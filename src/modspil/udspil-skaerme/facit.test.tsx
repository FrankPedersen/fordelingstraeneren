// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { bedoemUdspil, hentDatasaet, type Datasaet, type FindUdspilOpgave, type UdspilSvar } from '../model/findUdspil';
import { ordbogensOpslag } from '../ui/testhjaelp';
import {
  ditSvarLinje,
  dom,
  domOverskrift,
  eksempler,
  facitTabel,
  foer,
  navn,
  PROFIL_IDER,
  rigtigtOgForkert,
  svarGruppe,
  svarLabel,
  svarPaa,
  svarTekst,
  tjekTabel,
  visFindUdspil,
} from './hjaelp';

/*
 * Accepttest 3 i SPEC-modspil-v2.md, trin 3: facit viser tabellen, forklaringen, "Ved bordet" og "Næste opgave".
 * Facit er modellens fra trin 2 (`lavFindUdspil`, `bedoemUdspil`), og tabellen har kolonnerne Udspil, Stik, Sætter og
 * Koster med flest stik først (specen, "Skærmen"). Grænsefladen står i hjaelp.tsx under "Facit".
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

/** Facit for svaret: dommen, linjen "Dit svar", domsteksten, tabellen, forklaringen, Ved bordet, ordbogen og Næste opgave. */
function tjekFacit(o: FindUdspilOpgave, svar: UdspilSvar, opslag: Set<string> | null) {
  const hvor = `${navn(o)}, svar ${svarTekst(svar)}`;
  const givet = svarPaa(o, svar);
  let naeste = 0;
  visFindUdspil(o, { svar: givet, onNaeste: () => naeste++ });
  const d = bedoemUdspil(o, svar);

  // Mærket og overskriften med dommen.
  const maerke = document.querySelector<HTMLElement>('[data-dom]');
  expect(maerke?.dataset.dom, `${hvor}: mærket`).toBe(d.rigtig ? 'rigtigt' : 'forkert');
  expect(dom(), `${hvor}: overskriften`).toBe(d.rigtig ? 'rigtigt' : 'forkert');
  const overskrift = domOverskrift()!;

  // Linjen "Dit svar: …" under mærket.
  const linje = ditSvarLinje();
  expect(linje, `${hvor}: linjen "Dit svar"`).toBeTruthy();
  expect(foer(overskrift, linje!), `${hvor}: "Dit svar" under mærket`).toBe(true);

  // Svarknapperne kan ikke trykkes længere, og det valgte svar står trykket ind (mock-up 5: aria-pressed).
  const knapper = within(svarGruppe()).getAllByRole('button');
  expect(knapper.every((b) => (b as HTMLButtonElement).disabled), `${hvor}: svarknapperne er deaktiveret i facit`).toBe(true);
  expect(within(svarGruppe()).getByRole('button', { name: svarLabel(o, svar) }).getAttribute('aria-pressed'), `${hvor}: det valgte svar`).toBe('true');

  // Tabellen.
  tjekTabel(o, svar);
  const tabel = facitTabel()!;
  expect(foer(overskrift, tabel), `${hvor}: tabellen under mærket`).toBe(true);

  // Domsteksten, når farven er rigtig, men kortet ikke er profilens: over tabellen.
  if (d.tekst) {
    const p = [...document.querySelectorAll('p')].find((x) => (x.textContent ?? '').includes(d.tekst!.da));
    expect(p, `${hvor}: domsteksten "${d.tekst.da}"`).toBeTruthy();
    expect(foer(overskrift, p!) && foer(p!, tabel), `${hvor}: domsteksten mellem mærket og tabellen`).toBe(true);
  }

  // Forklaringen fra modellen efter tabellen.
  const forklaring = [...document.querySelectorAll('p')].find((p) => (p.textContent ?? '').includes(o.forklaring.da));
  expect(forklaring, `${hvor}: forklaringen fra trin 2`).toBeTruthy();
  expect(foer(tabel, forklaring!), `${hvor}: forklaringen efter tabellen`).toBe(true);

  // Ved bordet med situationens tekst.
  const vedBordet = screen.getByText('Ved bordet');
  expect(vedBordet.parentElement?.textContent, `${hvor}: Ved bordet`).toContain(o.vedBordet.da);
  expect(foer(forklaring!, vedBordet), `${hvor}: Ved bordet efter forklaringen`).toBe(true);

  // Næste opgave til sidst; links kun til opslag i ordbogen, der findes, mellem Ved bordet og Næste opgave.
  const naesteKnap = screen.getByRole('button', { name: 'Næste opgave' });
  expect(foer(vedBordet, naesteKnap), hvor).toBe(true);
  for (const a of document.querySelectorAll('a')) {
    const href = a.getAttribute('href') ?? '';
    expect(href, `${hvor}: et link fører kun til ordbogen`).toMatch(/^https:\/\/www\.kontraktbridge\.dk\/ordbog\/#[a-z0-9-]+$/);
    if (opslag) expect(opslag.has(href.split('#')[1]), `${hvor}: opslaget ${href} findes i ordbogen`).toBe(true);
    expect(foer(vedBordet, a) && foer(a, naesteKnap), `${hvor}: linket mellem Ved bordet og Næste opgave`).toBe(true);
  }
  fireEvent.click(naesteKnap);
  expect(naeste, `${hvor}: Næste opgave kalder onNaeste`).toBe(1);
  cleanup();
}

describe('Facit (accepttest 3, trin 3)', () => {
  const opslag = ordbogensOpslag();
  for (const id of PROFIL_IDER) {
    it(`alle situationer på niveau 1–4 med ${id}: et rigtigt og et forkert svar`, () => {
      let set = 0;
      for (const o of eksempler(data).filter((x) => x.profil.id === id)) {
        const { rigtigt, forkert } = rigtigtOgForkert(o);
        tjekFacit(o, rigtigt, opslag);
        if (forkert) tjekFacit(o, forkert, opslag);
        set++;
      }
      expect(set).toBe(3 + 8 + 8 + 8);
    }, 120_000);
  }

  it('et kort i den rigtige farve, der ikke er profilens, er forkert og har domsteksten over tabellen', () => {
    let set = 0;
    for (const o of eksempler(data).filter((x) => x.svar === 'kort')) {
      const andet = o.vest.find((c) => o.facit.farver.includes(Math.floor(c / 13)) && !o.facit.kort.includes(c));
      if (andet === undefined) continue;
      expect(bedoemUdspil(o, { kort: andet }).tekst, navn(o)).toBeDefined();
      tjekFacit(o, { kort: andet }, null);
      set++;
    }
    expect(set).toBeGreaterThan(5);
  }, 120_000);
});
