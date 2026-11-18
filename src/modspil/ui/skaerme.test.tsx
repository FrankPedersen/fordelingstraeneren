// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Card } from '../../domain/cards';
import type { ModspilOpgave } from '../model/generator';
import { erUklar } from '../model/loeser';
import { meldingTekst } from '../model/meldinger';
import { metode, profilId, profilNavn } from '../model/metoder';
import { farveAf, kontraktTekst, kortTekst, SYMBOLER, valoer, vaerdiAf } from '../model/tekst';
import {
  aktueltStik,
  dom,
  eksempler,
  foer,
  kortKnapper,
  kortLabel,
  navn,
  ordbogensOpslag,
  PROFIL_IDER,
  svarGruppe,
  svarPaa,
  tæt,
  vaelgerKort,
  visOpgave,
} from './testhjaelp';

/*
 * Accepttest 4 i SPEC-modspil.md, trin 2 (jsdom-delen): skærmene svarer til mock-up'en (`docs/specs/design/modspil/`)
 * i opbygning, rækkefølge og ordlyd. Bredderne 390, 1000 og 1280 px, farverne og målene tjekkes i Chrome af
 * `node scripts/tjek-bred-layout.mjs --modspil` med testsiden `scripts/modspil.html`.
 *
 * Grænsefladen, byggeriet skal give (samlet for alle Modspils tests):
 *
 * `src/modspil/ui/Opgave.tsx` eksporterer `Opgave` med props
 *   `{ opgave: ModspilOpgave; nummer: number; antal: number; svar?: Svar; onSvar(svar: Svar): void; onNaeste(): void;
 *      onIndstillinger(): void }`.
 * `Svar` er byggeriets egen type. Uden `svar` viser `Opgave` opgaven; med `svar` viser den også facit. HTML'en er den
 * samme ved alle bredder; kun CSS skifter fra 1000 px (specen, Layoutet). `Opgave` henter selv sporets stylesheet.
 *
 * Opgaveskærmen (specens punkt 1–7, i denne rækkefølge i HTML'en):
 * 1. Roden har `data-ovelse`, `data-niveau` og `data-seed` fra opgaven. Teksten "Niveau 2 · opgave 2 af 4" (niveau,
 *    `nummer` og `antal`) og mærket som en knap med navnet "<profil> · <metode>", fx "Standard · 4.-højeste" (profilens
 *    navn fra `profilNavn(profilId(…))` og `metode(opgave.metode).tekst`; uden metode kun profilens navn). Mærket
 *    kalder `onIndstillinger`.
 * 2. Statuslinjen: `role="progressbar"` med `aria-valuenow`, `aria-valuemin` og `aria-valuemax`.
 * 3. Meldeforløbet: en `<table>` med navnet "Meldeforløbet" (aria-label eller caption), kolonneoverskrifterne Vest,
 *    Nord, Øst og Syd og meldingerne i rækkefølge (`meldingTekst`) i cellerne (`<td>`); tomme celler før giveren og
 *    efter sidste melding. Linjen under tabellen nævner "Syd spiller <kontrakt>" (`kontraktTekst`).
 * 4. Bordet (`data-haand="nord"`), stikket og brugerens hånd (`data-haand="dig"`), i den rækkefølge. Hænderne står som
 *    tekstlinjer pr. farve, symbolet og så valørerne faldende (`valoer`), fx "♠ K103"; kort, der er spillet, må stå
 *    med eller være fjernet.
 * 5. Stikket har `role="img"` og aria-label "Stik <n>: <plads> <kort>, …", fx "Stik 1: Vest ♠7, Nord ♠3, Øst skal
 *    lægge til" (mock-up'en). Makkers udspil har `data-udspil` (orange ring), og brugerens plads er tom med
 *    `data-tom` (stiplet kant), så længe brugeren ikke har lagt til stikket. Uden spillede kort er der intet stik.
 * 6. Kun de kort, brugeren kan spille, er knapper, med aria-label som "Spar 8" og "Hjerter konge" (`kortLabel` i
 *    testhjaelp.tsx). I Vælg kortet er det brugerens kort i farven; resten af hånden står som tekst.
 * 7. Spørgsmålet er `<h1>`, og svarknapperne står i en gruppe med navnet "Svar" (`role="group"`); "Kan ikke afgøres" er
 *    sin egen knap i gruppen, undtagen hvor brugeren svarer med et kort. I Regel 11 og 12 hedder tallene "0", "1" osv.
 *    Et klik svarer med det samme (`onSvar`). Vælg kortet har en `<details>` efter spørgsmålet med `<summary>`
 *    "Aftalen: <metode>" og metodens `aftale` fra metoder.json.
 *
 * Facit (med `svar`), i denne rækkefølge:
 * - mærket med `data-dom="rigtigt"` eller `data-dom="forkert"` og en overskrift, der begynder med "Rigtigt" eller
 *   "Forkert";
 * - i Makkers point og Regel 11 og 12 (et tal eller interval): regnestykket som en `<table>` med navnet "Regnestykket";
 * - forklaringen fra trin 1 (`opgave.forklaring.da`);
 * - boksen med overskriften "Ved bordet" og en tekst;
 * - links til ordbogen kun til opslag, der findes (`https://www.kontraktbridge.dk/ordbog/#<id>`); i Regel 11 med
 *   4.-højeste linket "Regel 11 i ordbogen" til `#regel-11`;
 * - knappen "Næste opgave", der kalder `onNaeste`.
 */

const PLADSER: Record<string, string> = { W: 'Vest', N: 'Nord', E: 'Øst', S: 'Syd' };
const MAKKER: Record<string, string> = { W: 'E', E: 'W' };

/** Hånden pr. farve som "♠K103": alle kort og kun dem, der ikke er spillet. */
function haandlinjer(o: ModspilOpgave, plads: 'N' | 'W' | 'E', kunFarver?: (f: number) => boolean): { alle: string; tilbage: string }[] {
  const spillet = new Set(o.spillet.filter((s) => s.plads === plads).map((s) => s.kort));
  const linje = (kort: readonly Card[], f: number) =>
    `${SYMBOLER[f]}${kort.filter((k) => farveAf(k) === f).map(vaerdiAf).sort((a, b) => b - a).map((v) => valoer(v, 'da')).join('')}`;
  const ud: { alle: string; tilbage: string }[] = [];
  for (let f = 0; f < 4; f++) {
    if (kunFarver && !kunFarver(f)) continue;
    const alle = o.haender[plads].filter((k) => farveAf(k) === f);
    const tilbage = alle.filter((k) => !spillet.has(k));
    if (!tilbage.length) continue;
    ud.push({ alle: linje(alle, f), tilbage: linje(tilbage, f) });
  }
  return ud;
}

function tjekOpgave(o: ModspilOpgave) {
  const hvor = navn(o);
  let indstillinger = 0;
  visOpgave(o, { onIndstillinger: () => indstillinger++ });
  const rod = document.querySelector<HTMLElement>('[data-ovelse]');
  expect(rod, hvor).toBeTruthy();
  expect([rod!.dataset.ovelse, rod!.dataset.niveau, rod!.dataset.seed], hvor).toEqual([o.ovelse, String(o.niveau), String(o.seed)]);

  // 1. Niveau og opgavenummer, og mærket med profilen og metoden.
  const hoved = screen.getByText(`Niveau ${o.niveau} · opgave 2 af 4`);
  const profilensNavn = profilNavn(profilId(o.profil.valg)).tekst;
  const maerkeNavn = o.metode ? `${profilensNavn} · ${metode(o.metode.kategori, o.metode.id).tekst}` : profilensNavn;
  const maerke = screen.getByRole('button', { name: maerkeNavn });
  fireEvent.click(maerke);
  expect(indstillinger, `${hvor}: mærket fører til Indstillinger`).toBe(1);

  // 2. Statuslinjen.
  const status = screen.getByRole('progressbar');
  const [nu, min, max] = ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'].map((a) => Number(status.getAttribute(a)));
  expect(min <= nu && nu <= max && min < max, `${hvor}: statuslinjen ${min}–${nu}–${max}`).toBe(true);

  // 3. Meldeforløbet som skema med fire kolonner og linjen om kontrakten.
  const skema = screen.getByRole('table', { name: 'Meldeforløbet' });
  expect(within(skema).getAllByRole('columnheader').map((c) => c.textContent?.trim()), hvor).toEqual(['Vest', 'Nord', 'Øst', 'Syd']);
  const celler = [...skema.querySelectorAll('td')].map((c) => c.textContent?.trim()).filter(Boolean);
  expect(celler, hvor).toEqual(o.meldeforloeb.meldinger.map((m) => meldingTekst(m.melding, 'da')));
  expect(skema.parentElement?.textContent, hvor).toContain(`Syd spiller ${kontraktTekst(o.kontrakt)}`);

  // 4. Bordet, stikket og brugerens hånd.
  const nord = document.querySelector('[data-haand="nord"]')!;
  const dig = document.querySelector('[data-haand="dig"]')!;
  expect(nord && dig, hvor).toBeTruthy();
  for (const l of haandlinjer(o, 'N')) expect(tæt(nord.textContent).includes(l.alle) || tæt(nord.textContent).includes(l.tilbage), `${hvor}: bordet ${l.tilbage}`).toBe(true);
  const kanVaelge = vaelgerKort(o);
  const kunTekst = o.ovelse === 'vaelg-kort' ? (f: number) => f !== o.farve : kanVaelge ? () => false : undefined;
  for (const l of haandlinjer(o, o.plads, kunTekst)) expect(tæt(dig.textContent).includes(l.alle) || tæt(dig.textContent).includes(l.tilbage), `${hvor}: din hånd ${l.tilbage}`).toBe(true);

  // 5. Stikket med tekst til skærmlæser, makkers udspil og brugerens tomme plads.
  const stik = aktueltStik(o);
  const stikket = screen.queryByRole('img', { name: /^Stik \d+: / });
  if (!stik.kort.length) expect(stikket, `${hvor}: intet stik uden spillede kort`).toBeNull();
  else {
    expect(stikket, `${hvor}: stikket`).toBeTruthy();
    const label = stikket!.getAttribute('aria-label')!;
    expect(label.startsWith(`Stik ${stik.nummer}: `), `${hvor}: ${label}`).toBe(true);
    for (const s of stik.kort) expect(label, hvor).toContain(`${PLADSER[s.plads]} ${kortTekst(s.kort, 'da')}`);
    expect(foer(nord, stikket!) && foer(stikket!, dig), `${hvor}: bordet, stikket og din hånd i den rækkefølge`).toBe(true);
    const harLagt = stik.kort.some((s) => s.plads === o.plads);
    expect(!!stikket!.querySelector('[data-tom]'), `${hvor}: din tomme plads`).toBe(!harLagt);
    if (stik.kort[0].plads === MAKKER[o.plads]) expect(tæt(stikket!.querySelector('[data-udspil]')?.textContent), `${hvor}: makkers udspil`).toBe(kortTekst(stik.kort[0].kort, 'da'));
  }

  // 6. Kun de kort, brugeren kan spille, er knapper.
  const knapper = kortKnapper().map((b) => b.getAttribute('aria-label'));
  const spillet = new Set(o.spillet.map((s) => s.kort));
  const egne = o.haender[o.plads].filter((k) => !spillet.has(k));
  if (!kanVaelge) expect(knapper, `${hvor}: ingen kortknapper`).toEqual([]);
  else if (o.ovelse === 'vaelg-kort') expect(new Set(knapper), hvor).toEqual(new Set(egne.filter((k) => farveAf(k) === o.farve).map(kortLabel)));
  else {
    for (const k of knapper) expect(egne.map(kortLabel), hvor).toContain(k);
    if (o.facit.type === 'kort') for (const k of o.facit.kort) expect(knapper, hvor).toContain(kortLabel(k));
  }
  for (const b of kortKnapper()) expect(foer(nord, b), `${hvor}: kortknapperne står i din hånd`).toBe(true);

  // 7. Spørgsmålet og svarknapperne.
  const spoergsmaal = screen.getByRole('heading', { level: 1 });
  expect(foer(dig, spoergsmaal), `${hvor}: spørgsmålet under hænderne`).toBe(true);
  for (const [a, b, hvad] of [
    [hoved, maerke, 'niveau, mærke'],
    [maerke, status, 'mærke, statuslinje'],
    [status, skema, 'statuslinje, meldeforløb'],
    [skema, nord, 'meldeforløb, bordet'],
  ] as const)
    expect(foer(a, b), `${hvor}: ${hvad}`).toBe(true);
  if (!kanVaelge) {
    const gruppe = svarGruppe();
    expect(foer(spoergsmaal, gruppe), `${hvor}: svarknapperne under spørgsmålet`).toBe(true);
    expect(within(gruppe).getByRole('button', { name: 'Kan ikke afgøres' }), hvor).toBeTruthy();
  }
  if (o.ovelse === 'vaelg-kort') {
    const aftale = document.querySelector('details');
    const m = metode(o.metode!.kategori, o.metode!.id);
    expect(aftale?.querySelector('summary')?.textContent?.trim(), hvor).toBe(`Aftalen: ${m.tekst}`);
    if (m.aftale) expect(aftale!.textContent, hvor).toContain(m.aftale);
    expect(foer(spoergsmaal, aftale!), `${hvor}: aftalen under spørgsmålet`).toBe(true);
  }
  cleanup();
}

function tjekFacit(o: ModspilOpgave, opslag: Set<string> | null) {
  const hvor = navn(o);
  const svar = svarPaa(o);
  let naeste = 0;
  visOpgave(o, { svar, onNaeste: () => naeste++ });
  const d = dom();
  expect(d, `${hvor}: dommen`).not.toBeNull();
  const maerke = document.querySelector<HTMLElement>('[data-dom]');
  expect(maerke?.dataset.dom, `${hvor}: mærket`).toBe(d);
  const overskrift = screen.getAllByRole('heading').find((h) => /^(Rigtigt|Forkert)\b/.test(h.textContent ?? ''))!;
  const forklaring = [...document.querySelectorAll('p')].find((p) => (p.textContent ?? '').includes(o.forklaring.da));
  expect(forklaring, `${hvor}: forklaringen fra trin 1`).toBeTruthy();
  expect(foer(overskrift, forklaring!), hvor).toBe(true);
  if ((o.ovelse === 'point' || o.ovelse === 'regel11') && !erUklar(o.facit)) {
    const regnestykke = screen.getByRole('table', { name: 'Regnestykket' });
    expect(foer(overskrift, regnestykke) && foer(regnestykke, forklaring!), `${hvor}: regnestykket mellem mærket og forklaringen`).toBe(true);
  }
  const vedBordet = screen.getByText('Ved bordet');
  expect(foer(forklaring!, vedBordet), `${hvor}: Ved bordet efter forklaringen`).toBe(true);
  expect((vedBordet.parentElement?.textContent ?? '').replace('Ved bordet', '').trim().length, `${hvor}: Ved bordet har en tekst`).toBeGreaterThan(10);
  const naesteKnap = screen.getByRole('button', { name: 'Næste opgave' });
  expect(foer(vedBordet, naesteKnap), hvor).toBe(true);
  for (const a of document.querySelectorAll('a')) {
    const href = a.getAttribute('href') ?? '';
    expect(href, `${hvor}: et link fører kun til ordbogen`).toMatch(/^https:\/\/www\.kontraktbridge\.dk\/ordbog\/#[a-z0-9-]+$/);
    if (opslag) expect(opslag.has(href.split('#')[1]), `${hvor}: opslaget ${href} findes i ordbogen`).toBe(true);
    expect(foer(vedBordet, a) && foer(a, naesteKnap), `${hvor}: linket mellem Ved bordet og Næste opgave`).toBe(true);
  }
  if (o.ovelse === 'regel11' && o.metode?.id === 'fjerde-hoejeste') {
    expect(screen.getByRole('link', { name: 'Regel 11 i ordbogen' }).getAttribute('href'), hvor).toBe('https://www.kontraktbridge.dk/ordbog/#regel-11');
  }
  fireEvent.click(naesteKnap);
  expect(naeste, hvor).toBe(1);
  cleanup();
}

beforeEach(() => {
  window.scrollTo = vi.fn();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
});

describe('Opgaveskærmen som mock-up\'en (accepttest 4, trin 2)', () => {
  for (const id of PROFIL_IDER) {
    it(`alle øvelser med ${id}: delene i specens rækkefølge, mærket, meldeforløbet, hænderne, stikket og svarknapperne`, () => {
      for (const o of eksempler().filter((x) => x.profil.id === id)) tjekOpgave(o);
    }, 60_000);
  }
});

describe('Facit som mock-up\'en (accepttest 4, trin 2)', () => {
  const opslag = ordbogensOpslag();
  for (const id of PROFIL_IDER) {
    it(`alle øvelser med ${id}: mærket, regnestykket, forklaringen, Ved bordet, ordbogen og Næste opgave`, () => {
      for (const o of eksempler().filter((x) => x.profil.id === id)) tjekFacit(o, opslag);
    }, 60_000);
  }

  it('det rigtige svar giver "Rigtigt", og et andet giver "Forkert"', () => {
    let tal = 0;
    for (const o of eksempler()) {
      // Fra niveau 4 spørger Regel 11 og 12 også "Hvilke?", så et tal er ikke hele svaret; det afgør byggeriet.
      if (o.ovelse === 'regel11' && o.facit.type === 'tal' && o.niveau < 4) {
        const rigtig = String(o.facit.tal);
        visOpgave(o, { svar: svarPaa(o, () => within(svarGruppe()).getByRole('button', { name: rigtig })) });
        expect(dom(), navn(o)).toBe('rigtigt');
        cleanup();
        visOpgave(o, { svar: svarPaa(o) });
        expect(dom(), `${navn(o)}: "Kan ikke afgøres" er forkert`).toBe('forkert');
        cleanup();
        tal++;
      }
      if (o.facit.type === 'kan-ikke-afgoeres' && !vaelgerKort(o)) {
        visOpgave(o, { svar: svarPaa(o) });
        expect(dom(), `${navn(o)}: "Kan ikke afgøres" er rigtigt`).toBe('rigtigt');
        cleanup();
      }
      if (o.ovelse === 'vaelg-kort' && o.facit.type === 'kort') {
        const rigtig = kortLabel(o.facit.kort[0]);
        visOpgave(o, { svar: svarPaa(o, () => screen.getByRole('button', { name: rigtig })) });
        expect(dom(), navn(o)).toBe('rigtigt');
        cleanup();
      }
    }
    expect(tal).toBeGreaterThan(0);
  }, 60_000);
});
