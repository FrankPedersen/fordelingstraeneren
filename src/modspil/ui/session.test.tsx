// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FOERSTE_NIVEAU, harOvelse, lavNiveauOpgave, lavOpgave, OVELSER, type Niveau, type Ovelse } from '../model/generator';
import { profil } from '../model/metoder';
import { MS_STORAGE_KEY, readMsSaved } from '../storage';
import ModspilScreen from './ModspilScreen';
import { dom, kortKnapper, svarGruppe, visOpgave, type Svar } from './testhjaelp';

/*
 * Accepttest 2 i SPEC-modspil.md, trin 2: en session kører fra start til status med øvelser fra trin 1, og profilen
 * skifter facit (Standard mod Omvendt på samme seed).
 *
 * Grænsefladen, byggeriet skal give:
 * - `ModspilScreen` (standardeksport fra `src/modspil/ui/ModspilScreen.tsx`, `{ onBack(): void; start?: boolean }`):
 *   knappen "Start dagens session" starter sessionen. Sessionen består af opgaver fra trin 1's generator
 *   (`lavOpgave` eller `lavNiveauOpgave`) og slutter med status, overskriften "Sessionen er gennemført".
 * - Opgaveskærmen (`Opgave` i `src/modspil/ui/Opgave.tsx`) har roden med `data-ovelse` (øvelsens id fra trin 1),
 *   `data-niveau` og `data-seed`, så testen kan genskabe opgaven. Svarknapperne står i en gruppe med navnet "Svar";
 *   "Kan ikke afgøres" er en af dem, og et klik svarer med det samme. Hvor brugeren svarer med et kort, er kortene
 *   knapper med aria-label som "Spar 8" (testhjaelp.tsx). Efter svaret viser skærmen facit med overskriften
 *   "Rigtigt …" eller "Forkert …", forklaringen fra trin 1 og knappen "Næste opgave".
 * - `Opgave` tager `{ opgave, nummer, antal, svar?, onSvar, onNaeste, onIndstillinger }`; med `svar` viser den facit.
 * - Lagringen (`src/modspil/storage.ts`): `MS_STORAGE_KEY = 'modspil:v1'` og `readMsSaved(input)`, der giver
 *   `{ saved, problems }` som Pointregnskabs `readPrSaved`. `saved` har mindst `sessions` (én pr. gennemført session)
 *   og `streak` med `current`, som de andre spor (forsidens `status.ts` læser samme felter). Kun nøglen `modspil:v1`
 *   skrives.
 */

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const knap = (name: string | RegExp) => screen.queryByRole('button', { name });
const status = () => screen.queryByRole('heading', { name: 'Sessionen er gennemført' });

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  window.scrollTo = vi.fn();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('En session fra start til status (accepttest 2, trin 2)', () => {
  it('opgaverne er fra trin 1, facit har trin 1-forklaringen, og sessionen slutter med status; kun modspil:v1 skrives', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 18, 12));
    localStorage.setItem('fordelingstraener:v1', '{"urørt":true}');
    render(<ModspilScreen onBack={() => {}} />);
    click('Start dagens session');
    const standard = profil('standard');
    const set = new Map<string, { ovelse: Ovelse; niveau: Niveau; seed: number }>();
    for (let i = 0; i < 400 && !status(); i++) {
      act(() => vi.advanceTimersByTime(3_000));
      if (knap('Næste opgave')) {
        click('Næste opgave');
        continue;
      }
      const rod = document.querySelector<HTMLElement>('[data-ovelse]');
      if (!rod) continue;
      const opgave = { ovelse: rod.dataset.ovelse as Ovelse, niveau: Number(rod.dataset.niveau) as Niveau, seed: Number(rod.dataset.seed) };
      const id = `${opgave.ovelse} ${opgave.niveau} ${opgave.seed}`;
      expect(OVELSER, id).toContain(opgave.ovelse);
      expect(harOvelse(opgave.ovelse, standard), id).toBe(true);
      expect(FOERSTE_NIVEAU[opgave.ovelse], id).toBeLessThanOrEqual(opgave.niveau);
      set.set(id, opgave);
      const kanIkke = knap('Kan ikke afgøres');
      const kort = kortKnapper()[0];
      expect(kanIkke ?? kort, `${id}: hverken "Kan ikke afgøres" eller et kort at vælge`).toBeTruthy();
      fireEvent.click(kanIkke ?? kort);
      // Facit har forklaringen fra trin 1's generator for samme øvelse, niveau og seed (Standard er valgt for nye brugere).
      const tekst = document.body.textContent ?? '';
      const mulige = [lavOpgave(opgave.ovelse, opgave.niveau, opgave.seed, standard), lavNiveauOpgave(opgave.niveau, opgave.seed, standard)];
      expect(
        mulige.some((o) => o.ovelse === opgave.ovelse && tekst.includes(o.forklaring.da)),
        `${id}: facit viser ikke forklaringen fra trin 1`,
      ).toBe(true);
      expect(dom(), id).not.toBeNull();
      expect(knap('Næste opgave'), id).toBeTruthy();
    }
    expect(status()).toBeTruthy();
    expect(set.size).toBeGreaterThanOrEqual(2);
    // Kun modspil:v1 er skrevet, og de andre nøgler er urørte.
    expect(Object.keys(localStorage).sort()).toEqual(['fordelingstraener:v1', MS_STORAGE_KEY].sort());
    expect(localStorage.getItem('fordelingstraener:v1')).toBe('{"urørt":true}');
    expect(MS_STORAGE_KEY).toBe('modspil:v1');
    const { saved, problems } = readMsSaved(JSON.parse(localStorage.getItem(MS_STORAGE_KEY)!));
    expect(problems).toEqual([]);
    expect(saved.sessions).toHaveLength(1);
    expect(saved.streak.current).toBe(1);
  }, 60_000);
});

describe('Profilen skifter facit (accepttest 2, trin 2)', () => {
  /** Dommen for hvert af svarknapperne i opgaven, i knappernes rækkefølge. */
  function domme(opgave: ReturnType<typeof lavOpgave>): { knapper: string[]; domme: (string | null)[] } {
    visOpgave(opgave);
    const knapper = within(svarGruppe()).getAllByRole('button').map((b) => b.textContent ?? '');
    cleanup();
    const ud: (string | null)[] = [];
    for (let i = 0; i < knapper.length; i++) {
      let svar: Svar | undefined;
      visOpgave(opgave, { onSvar: (s) => (svar = s) });
      fireEvent.click(within(svarGruppe()).getAllByRole('button')[i]);
      cleanup();
      visOpgave(opgave, { svar });
      ud.push(dom());
      cleanup();
    }
    return { knapper, domme: ud };
  }

  it('samme seed med Standard og Omvendt: samme stik og svarmuligheder, og det rigtige svar for den ene er forkert for den anden', () => {
    let fundet = 0;
    for (let seed = 1; seed <= 40 && fundet < 3; seed++) {
      const a = lavOpgave('markering', 2, seed, profil('standard'));
      const b = lavOpgave('markering', 2, seed, profil('omvendt'));
      if (a.facit.type !== 'signal' || b.facit.type !== 'signal') continue;
      const hvor = `seed ${seed}`;
      visOpgave(a);
      const stikA = screen.getByRole('img', { name: /^Stik \d+: / }).getAttribute('aria-label');
      expect(screen.getByRole('button', { name: 'Standard · højt = kald' }), hvor).toBeTruthy();
      cleanup();
      visOpgave(b);
      expect(screen.getByRole('img', { name: /^Stik \d+: / }).getAttribute('aria-label'), hvor).toBe(stikA);
      expect(screen.getByRole('button', { name: 'Omvendt · lavt = kald' }), hvor).toBeTruthy();
      cleanup();
      const da = domme(a);
      const db = domme(b);
      expect(db.knapper, hvor).toEqual(da.knapper);
      expect(da.domme.filter((d) => d === 'rigtigt'), hvor).toHaveLength(1);
      expect(db.domme.filter((d) => d === 'rigtigt'), hvor).toHaveLength(1);
      expect(da.domme.indexOf('rigtigt'), hvor).not.toBe(db.domme.indexOf('rigtigt'));
      expect(db.domme[da.domme.indexOf('rigtigt')], hvor).toBe('forkert');
      fundet++;
    }
    expect(fundet).toBe(3);
  }, 60_000);
});
