// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLang } from '../../i18n';
import { aktueltStik, eksempler, hverSkaerm, KORTLABEL, kortLabel, navn, visOpgave } from './testhjaelp';

/*
 * Accepttest 6 i SPEC-modspil.md, trin 2 (jsdom-delen): tilgængelighed. Alle knapper er `<button>`, kortknapperne har
 * aria-label som "Spar 8", og stikket har en tekst til skærmlæser. "Tastatur virker hele vejen" kræver her, at alt,
 * der kan trykkes på, er et element, tastaturet når af sig selv; selve turen med Tab og Enter fra forsiden gennem en
 * session til status køres i Chrome af `node scripts/tjek-bred-layout.mjs --modspil`.
 *
 * Grænsefladen, byggeriet skal give:
 * - Alt, der kan trykkes på, er `<button>`, `<a href>`, `<input>`, `<select>` eller `<summary>`; intet andet element har
 *   `role="button"` eller `tabindex`, og ingen af dem har `tabindex="-1"`. Hver knap har et navn (tekst eller
 *   aria-label).
 * - En knap, der viser et kort (fx "♠8" eller "♥K"), har aria-label med farvens navn og valøren: "Spar 8", "Hjerter
 *   konge" (`kortLabel` i testhjaelp.tsx).
 * - Stikket har `role="img"` og aria-label "Stik <n>: …" med pladserne og kortene (se skaerme.test.tsx).
 */

const VALOERER: Record<string, string> = { E: 'es', K: 'konge', D: 'dame', B: 'knægt' };
const FARVER: Record<string, string> = { '♠': 'Spar', '♥': 'Hjerter', '♦': 'Ruder', '♣': 'Klør' };

function tjekTilgaengelighed(hvor: string) {
  for (const el of document.body.querySelectorAll('[role="button"]')) expect(el.tagName, `${hvor}: role="button" på ${el.tagName}`).toBe('BUTTON');
  for (const el of document.body.querySelectorAll('[tabindex]')) {
    expect(el.matches('button, a[href], input, select, summary'), `${hvor}: tabindex på ${el.outerHTML.slice(0, 80)}`).toBe(true);
    expect(el.getAttribute('tabindex'), `${hvor}: ${el.outerHTML.slice(0, 80)} kan ikke nås med tastaturet`).not.toBe('-1');
  }
  for (const a of document.body.querySelectorAll('a')) expect(a.hasAttribute('href'), `${hvor}: link uden href`).toBe(true);
  for (const b of document.body.querySelectorAll('button')) {
    const navn = (b.getAttribute('aria-label') ?? b.textContent ?? '').trim();
    expect(navn, `${hvor}: knap uden navn ${b.outerHTML.slice(0, 80)}`).not.toBe('');
    // En knap, der viser et kort, har aria-label med farvens navn og valøren.
    const kort = (b.textContent ?? '').replace(/\s+/g, '').match(/^([♠♥♦♣])(10|[2-9]|[EKDB])$/);
    if (kort) {
      const label = b.getAttribute('aria-label') ?? '';
      expect(label, `${hvor}: kortknappen ${kort[0]}`).toMatch(KORTLABEL);
      expect(label, `${hvor}: kortknappen ${kort[0]}`).toBe(`${FARVER[kort[1]]} ${VALOERER[kort[2]] ?? kort[2]}`);
    }
  }
}

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  window.scrollTo = vi.fn();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Tilgængelighed (accepttest 6, trin 2)', () => {
  it('alle knapper er <button> med et navn, og intet kan kun nås med musen, på alle Modspil-skærme', () => {
    let skaerme = 0;
    hverSkaerm('da', (hvor) => {
      tjekTilgaengelighed(hvor);
      skaerme++;
    });
    expect(skaerme).toBeGreaterThan(100);
  }, 120_000);

  it('kortknapperne har aria-label, fx "Spar 8", og der er kortknapper i Vælg kortet', () => {
    let set = 0;
    for (const o of eksempler().filter((x) => x.ovelse === 'vaelg-kort')) {
      visOpgave(o);
      const knapper = screen.getAllByRole('button').filter((b) => KORTLABEL.test(b.getAttribute('aria-label') ?? ''));
      expect(knapper.length, navn(o)).toBeGreaterThan(0);
      for (const b of knapper) expect(o.haender[o.plads].map(kortLabel), navn(o)).toContain(b.getAttribute('aria-label'));
      set += knapper.length;
      cleanup();
    }
    expect(set).toBeGreaterThan(5);
  }, 60_000);

  it('stikket har en tekst til skærmlæser med stikkets nummer og kortene', () => {
    for (const o of eksempler()) {
      const stik = aktueltStik(o);
      if (!stik.kort.length) continue;
      visOpgave(o);
      const label = screen.getByRole('img', { name: /^Stik \d+: / }).getAttribute('aria-label') ?? '';
      expect(label, navn(o)).toMatch(new RegExp(`^Stik ${stik.nummer}: `));
      expect(label.length, navn(o)).toBeGreaterThan(`Stik ${stik.nummer}: `.length + 4 * stik.kort.length);
      cleanup();
    }
  }, 60_000);

  it('testen kan se forskel: en klikbar div, tabindex="-1" og en kortknap uden aria-label fanges', () => {
    document.body.innerHTML = '<button type="button" aria-label="Spar 8">♠8</button><a href="https://www.kontraktbridge.dk/ordbog/#regel-11">Regel 11</a>';
    expect(() => tjekTilgaengelighed('rigtig')).not.toThrow();
    document.body.innerHTML = '<div role="button" tabindex="0">Næste opgave</div>';
    expect(() => tjekTilgaengelighed('div')).toThrow();
    document.body.innerHTML = '<button type="button" tabindex="-1">Næste opgave</button>';
    expect(() => tjekTilgaengelighed('tabindex')).toThrow();
    document.body.innerHTML = '<button type="button">♠8</button>';
    expect(() => tjekTilgaengelighed('uden aria-label')).toThrow();
    document.body.innerHTML = '<button type="button" aria-label="Hjerter K">♥K</button>';
    expect(() => tjekTilgaengelighed('forkort')).toThrow();
  });
});
