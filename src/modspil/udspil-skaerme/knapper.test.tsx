// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { hentDatasaet, type Datasaet, type FindUdspilOpgave, type UdspilSvar } from '../model/findUdspil';
import { profil } from '../model/metoder';
import { farveAf } from '../model/tekst';
import { eksempel, eksempler, farveLabel, findSeed, kortLabel, muligeSvar, navn, PROFIL_IDER, svarGruppe, visFindUdspil } from './hjaelp';

/*
 * Accepttest 2 i SPEC-modspil-v2.md, trin 3: niveau 1–2 viser fire farveknapper og niveau 3 kortknapper; en farve uden
 * kort er deaktiveret. Der er ingen "Kan ikke afgøres" i øvelse 8 (specen, "Skærmen").
 *
 * Grænsefladen står i hjaelp.tsx, punkt 6: svarknapperne står i gruppen "Svar". Niveau 1–2: fire farveknapper i orden
 * ♠ ♥ ♦ ♣ med aria-label "Spar, 4 kort"; en farve uden kort er deaktiveret ("Klør, 0 kort"). Niveau 3–5: Vests 13 kort
 * farve for farve og faldende med aria-label som "Spar konge". Et klik svarer med det samme.
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

/** Knapperne i gruppen "Svar" med navn og om de kan trykkes, og de svar, et klik på hver giver. */
function knapper(o: FindUdspilOpgave): { navne: string[]; aktive: boolean[]; svar: UdspilSvar[] } {
  const svar: UdspilSvar[] = [];
  visFindUdspil(o, { onSvar: (s) => svar.push(s) });
  const alle = within(svarGruppe()).getAllByRole('button');
  const navne = alle.map((b) => b.getAttribute('aria-label') ?? b.textContent ?? '');
  const aktive = alle.map((b) => !(b as HTMLButtonElement).disabled);
  for (const b of alle) fireEvent.click(b);
  expect(screen.queryByRole('button', { name: 'Kan ikke afgøres' }), `${navn(o)}: ingen "Kan ikke afgøres"`).toBeNull();
  cleanup();
  return { navne, aktive, svar };
}

const renonce = (o: FindUdspilOpgave) => [0, 1, 2, 3].some((f) => !o.vest.some((c) => farveAf(c) === f));

describe('Svarknapperne (accepttest 2, trin 3)', () => {
  it('niveau 1–2: fire farveknapper i orden ♠ ♥ ♦ ♣ med antallet af kort, og et klik svarer med farven', () => {
    let set = 0;
    for (const o of eksempler(data).filter((x) => x.niveau <= 2)) {
      const k = knapper(o);
      expect(k.navne, navn(o)).toEqual([0, 1, 2, 3].map((f) => farveLabel(o, f)));
      expect(k.aktive, navn(o)).toEqual([0, 1, 2, 3].map((f) => o.vest.some((c) => farveAf(c) === f)));
      expect(k.svar, `${navn(o)}: et klik svarer med farven`).toEqual(muligeSvar(o));
      set++;
    }
    expect(set).toBe(3 * (3 + 8));
  }, 60_000);

  it('niveau 3–5: Vests 13 kort som knapper farve for farve og faldende, og et klik svarer med kortet', () => {
    const opgaver = [...eksempler(data).filter((x) => x.niveau >= 3), ...PROFIL_IDER.map((id) => findSeed(5, profil(id), data, () => true))];
    for (const o of opgaver) {
      const k = knapper(o);
      expect(k.navne, navn(o)).toEqual(muligeSvar(o).map((s) => kortLabel((s as { kort: number }).kort)));
      expect(k.aktive.every(Boolean), `${navn(o)}: alle kort kan vælges`).toBe(true);
      expect(k.svar, `${navn(o)}: et klik svarer med kortet`).toEqual(muligeSvar(o));
    }
    expect(opgaver.length).toBe(3 * 16 + 3);
  }, 60_000);

  it('en farve uden kort er deaktiveret på niveau 1 og 2, og et klik på den svarer ikke', () => {
    for (const niveau of [1, 2] as const) {
      for (const id of PROFIL_IDER) {
        const o = findSeed(niveau, profil(id), data, renonce);
        const k = knapper(o);
        const tomme = [0, 1, 2, 3].filter((f) => !o.vest.some((c) => farveAf(c) === f));
        for (const f of tomme) {
          expect(k.navne[f], navn(o)).toBe(farveLabel(o, f));
          expect(k.navne[f], navn(o)).toMatch(/, 0 kort$/);
          expect(k.aktive[f], `${navn(o)}: ${k.navne[f]} er deaktiveret`).toBe(false);
        }
        expect(k.svar.some((s) => 'farve' in s && tomme.includes(s.farve)), `${navn(o)}: en deaktiveret farve svarer ikke`).toBe(false);
      }
    }
  }, 60_000);

  it('mock-up\'ens eksempel: "Spar, 4 kort", "Hjerter, 4 kort", "Ruder, 4 kort" og "Klør, 1 kort" på niveau 1, og ♠K ♠B ♠7 ♠6 … ♣B på niveau 3', () => {
    expect(knapper(eksempel(data, 1)).navne).toEqual(['Spar, 4 kort', 'Hjerter, 4 kort', 'Ruder, 4 kort', 'Klør, 1 kort']);
    expect(knapper(eksempel(data, 3)).navne).toEqual([
      'Spar konge', 'Spar knægt', 'Spar 7', 'Spar 6',
      'Hjerter es', 'Hjerter konge', 'Hjerter 4', 'Hjerter 3',
      'Ruder 10', 'Ruder 8', 'Ruder 6', 'Ruder 3',
      'Klør knægt',
    ]);
  });
});
