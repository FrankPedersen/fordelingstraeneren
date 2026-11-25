// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { dayOf } from '../../engine/dates';
import { newItem } from '../../engine/leitner';
import { bedoemUdspil, hentDatasaet, lavFindUdspil, type Datasaet, type UdspilSvar } from '../model/findUdspil';
import { FOERSTE_NIVEAU, harOvelse, OVELSER, type Niveau } from '../model/generator';
import { profil } from '../model/metoder';
import { defaultMsSaved, MS_STORAGE_KEY, readMsSaved } from '../storage';
import { FIND_UDSPIL, medUdspilPost, udspilIOpgave, udspilPost } from '../training/findUdspil';
import { nextMsStep, startMsSession } from '../training/session';
import ModspilScreen from '../ui/ModspilScreen';
import { haandlinjer, KORTLABEL, navn, rigtigtOgForkert, svarGruppe, svarLabel, tæt, tjekTabel } from './hjaelp';

/*
 * Accepttest 1 i SPEC-modspil-v2.md, trin 3: en session med øvelse 8 kører fra start til status, og facit på skærmen er
 * modellens facit for opgavens seed. Desuden Franks valg 25. nov. 2026 (session 3a): øvelse 8 trækkes i niveaufasen
 * som v1's øvelser fra niveau 1 og har sin egen Leitner-post med samme regler (specen, "Sessionen").
 *
 * Grænsefladen, byggeriet skal give (ud over hjaelp.tsx):
 * - `src/modspil/training/findUdspil.ts`: `FIND_UDSPIL = 'find-udspil'`; `udspilIOpgave(session)` giver `{ niveau, seed }`,
 *   når sessionens aktuelle opgave er øvelse 8, ellers null; `udspilPost(saved)` og `medUdspilPost(saved, item)` læser og
 *   skriver øvelse 8's Leitner-post i det valgfrie felt i `modspil:v1`.
 * - `nextMsStep` (v1's `session.ts`) trækker i niveaufasen øvelse 8 med samme chance som hver af v1's øvelser på
 *   niveauet (1/(k + 1), hvor k er antallet af v1's øvelser, profilen har på niveauet), på brugerens niveau. Er øvelse 8's
 *   post forfalden, kommer den først som repetition (højst to forfaldne øvelser, som v1), på brugerens niveau.
 * - `ModspilScreen` viser øvelse 8 med `FindUdspil` (rodens `data-ovelse="find-udspil"`, `data-niveau` og `data-seed`), når
 *   datasættet er hentet (dovent, `hentDatasaet`), og registrerer svaret i postens log. Øvelse 8's svar må ikke gøre
 *   `modspil:v1` ugyldig (fx i `answers`, der kun godtager v1's øvelser).
 */

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const knap = (name: string | RegExp) => screen.queryByRole('button', { name });
const status = () => screen.queryByRole('heading', { name: 'Sessionen er gennemført' });
const kortKnapper = () => screen.queryAllByRole('button').filter((b) => KORTLABEL.test(b.getAttribute('aria-label') ?? ''));

let data: Datasaet;
beforeAll(async () => {
  data = await hentDatasaet();
}, 30_000);
beforeEach(() => {
  window.history.replaceState(null, '', '/');
  window.scrollTo = vi.fn();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
});

/**
 * Kører en session, der begynder med øvelse 8 som repetition (posten er forfalden i dag), til status. Øvelse 8 besvares
 * skiftevis forkert og rigtigt; v1's øvelser med "Kan ikke afgøres" eller det første kort som i v1's test. Giver
 * øvelse 8's opgaver i rækkefølge og dommene.
 */
async function session(niveau: Niveau): Promise<{ foerste: string | undefined; udspil: { niveau: number; seed: number; rigtig: boolean }[] }> {
  const today = dayOf(Date.now(), 4);
  const saved = { ...medUdspilPost(defaultMsSaved(), newItem(today)), level: niveau };
  localStorage.setItem(MS_STORAGE_KEY, JSON.stringify(saved));
  localStorage.setItem('fordelingstraener:v1', '{"urørt":true}');
  render(<ModspilScreen onBack={() => {}} />);
  click('Start dagens session');
  const standard = profil('standard');
  const udspil: { niveau: number; seed: number; rigtig: boolean }[] = [];
  let foerste: string | undefined;
  for (let i = 0; i < 40 && !status(); i++) {
    if (knap('Næste opgave')) {
      click('Næste opgave');
      continue;
    }
    // Øvelse 8 venter på datasættet; v1's øvelser står der med det samme.
    await waitFor(() => expect(document.querySelector('[data-ovelse]') ?? status()).toBeTruthy(), { timeout: 10_000 });
    if (status()) break;
    const rod = document.querySelector<HTMLElement>('[data-ovelse]')!;
    foerste ??= rod.dataset.ovelse;
    if (rod.dataset.ovelse !== FIND_UDSPIL) {
      expect(OVELSER, rod.dataset.ovelse).toContain(rod.dataset.ovelse);
      const svar = knap('Kan ikke afgøres') ?? kortKnapper()[0];
      expect(svar, `${rod.dataset.ovelse}: hverken "Kan ikke afgøres" eller et kort at vælge`).toBeTruthy();
      fireEvent.click(svar!);
      continue;
    }
    // Øvelse 8: opgaven er modellens for niveau og seed, og facit er modellens facit.
    const o = lavFindUdspil(Number(rod.dataset.niveau) as Niveau, Number(rod.dataset.seed), standard, data);
    const hvor = navn(o);
    const haand = tæt(document.querySelector('[data-haand="dig"]')?.textContent);
    for (const l of haandlinjer(o.vest)) expect(haand, `${hvor}: Vests hånd ${l}`).toContain(l);
    const { rigtigt, forkert } = rigtigtOgForkert(o);
    const svar: UdspilSvar = udspil.length % 2 === 0 && forkert ? forkert : rigtigt;
    fireEvent.click(within(svarGruppe()).getByRole('button', { name: svarLabel(o, svar) }));
    const d = bedoemUdspil(o, svar);
    expect(document.querySelector<HTMLElement>('[data-dom]')?.dataset.dom, `${hvor}: dommen`).toBe(d.rigtig ? 'rigtigt' : 'forkert');
    expect([...document.querySelectorAll('p')].some((p) => (p.textContent ?? '').includes(o.forklaring.da)), `${hvor}: forklaringen fra modellen`).toBe(true);
    expect(document.body.textContent, `${hvor}: Ved bordet`).toContain(o.vedBordet.da);
    tjekTabel(o, svar);
    expect(knap('Næste opgave'), hvor).toBeTruthy();
    udspil.push({ niveau: o.niveau, seed: o.seed, rigtig: d.rigtig });
  }
  expect(status(), 'sessionen slutter med status').toBeTruthy();
  return { foerste, udspil };
}

/** De gemte data efter sessionen: gyldige, én session, streak 1, og kun modspil:v1 er skrevet. */
function tjekGemt(udspil: { rigtig: boolean }[]) {
  expect(Object.keys(localStorage).sort()).toEqual(['fordelingstraener:v1', MS_STORAGE_KEY].sort());
  expect(localStorage.getItem('fordelingstraener:v1')).toBe('{"urørt":true}');
  const { saved, problems } = readMsSaved(JSON.parse(localStorage.getItem(MS_STORAGE_KEY)!));
  expect(problems, 'modspil:v1 er gyldig efter en session med øvelse 8').toEqual([]);
  expect(saved.sessions).toHaveLength(1);
  expect(saved.streak.current).toBe(1);
  // Øvelse 8's post har ét logpunkt pr. svar med dommen, som Leitner-bunken i v1.
  const post = udspilPost(saved);
  expect(post, 'øvelse 8 har sin egen Leitner-post').toBeDefined();
  expect(post!.log.map((l) => l.ok)).toEqual(udspil.map((u) => u.rigtig));
  if (udspil[udspil.length - 1] && !udspil[udspil.length - 1].rigtig) expect(post!.box, 'et forkert svar sender posten i kasse 1').toBe(1);
}

describe('En session med øvelse 8 fra start til status (accepttest 1, trin 3)', () => {
  it('niveau 1: øvelse 8 kommer først som repetition med farveknapper, facit er modellens, og posten er opdateret', async () => {
    const { foerste, udspil } = await session(1);
    expect(foerste, 'den forfaldne post kommer først').toBe(FIND_UDSPIL);
    expect(udspil.length).toBeGreaterThanOrEqual(1);
    expect(udspil[0].niveau, 'på brugerens niveau').toBe(1);
    tjekGemt(udspil);
  }, 60_000);

  it('niveau 3: øvelse 8 med kortknapper fra start til status, og facit er modellens', async () => {
    const { foerste, udspil } = await session(3);
    expect(foerste).toBe(FIND_UDSPIL);
    expect(udspil[0].niveau).toBe(3);
    tjekGemt(udspil);
  }, 60_000);
});

describe('Øvelse 8 trækkes i niveaufasen som v1\'s øvelser (Franks valg 25. nov. 2026, session 3a)', () => {
  it('på niveau 1–5 med samme chance som hver af v1\'s øvelser, på brugerens niveau', () => {
    const standard = profil('standard');
    const nu = new Date(2026, 10, 25, 12).getTime();
    const N = 1000;
    for (const niveau of [1, 2, 3, 4, 5] as const) {
      const saved = { ...defaultMsSaved(), level: niveau };
      const k = OVELSER.filter((o) => harOvelse(o, standard) && FOERSTE_NIVEAU[o] <= niveau).length;
      let n = 0;
      for (let seed = 1; seed <= N; seed++) {
        const s = nextMsStep(startMsSession(saved, nu, seed), saved, nu).session;
        const ref = udspilIOpgave(s);
        if (ref) {
          n++;
          expect(ref.niveau, `niveau ${niveau}, seed ${seed}`).toBe(niveau);
          expect(s.opgave, `niveau ${niveau}, seed ${seed}: ingen v1-opgave samtidig`).toBeNull();
        } else expect(s.opgave, `niveau ${niveau}, seed ${seed}: ellers en af v1's øvelser`).not.toBeNull();
      }
      // Seedene ligger fast, så testen er den samme hver gang; 0,05 er over 3,5 standardafvigelser ved 1000 sessioner.
      expect(Math.abs(n / N - 1 / (k + 1)), `niveau ${niveau}: ${n} af ${N} med øvelse 8, ventet ${(N / (k + 1)).toFixed(0)}`).toBeLessThan(0.05);
    }
  }, 120_000);

  it('opgaven fra niveaufasen er modellens opgave for niveau og seed', () => {
    const standard = profil('standard');
    const nu = new Date(2026, 10, 25, 12).getTime();
    let set = 0;
    for (let seed = 1; seed <= 200 && set < 10; seed++) {
      const saved = { ...defaultMsSaved(), level: ((seed % 5) + 1) as Niveau };
      const ref = udspilIOpgave(nextMsStep(startMsSession(saved, nu, seed), saved, nu).session);
      if (!ref) continue;
      const o = lavFindUdspil(ref.niveau, ref.seed, standard, data);
      expect(o.niveau).toBe(saved.level);
      expect(o.svar).toBe(saved.level <= 2 ? 'farve' : 'kort');
      set++;
    }
    expect(set).toBe(10);
  });
});
