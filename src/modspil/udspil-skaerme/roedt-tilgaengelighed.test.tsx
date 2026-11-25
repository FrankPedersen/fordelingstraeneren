// @vitest-environment jsdom
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLang } from '../../i18n';
import { hentDatasaet, type Datasaet } from '../model/findUdspil';
import { hverUdspilSkaerm, KORTLABEL, tekstknuder } from './hjaelp';

/*
 * Accepttest 5 i SPEC-modspil-v2.md, trin 3 (jsdom-delen): rødt kun på ♥ og ♦, og tilgængelighed og tastatur som v1's
 * punkt 6 (SPEC-modspil.md, accepttest 5–6 i trin 2; src/modspil/ui/roedt.test.tsx og tilgaengelighed.test.tsx). jsdom
 * regner ikke CSS ud, så testen ser på opbygningen; den beregnede farve, knappernes højde (mindst 44 px) og turen med
 * Tab og Enter gennem en session med øvelse 8 tjekkes i Chrome af `node scripts/tjek-bred-layout.mjs --modspil`.
 *
 * Grænsefladen, byggeriet skal give:
 * - ♥ og ♦ står i et element for sig, hvis klasse har ordet "red" (fx `suit-red` fra `src/ui/SuitText.tsx`); tal og
 *   bogstaver står uden for det røde element, også i farve- og kortknapperne, tabellen og forklaringen.
 * - Alt, der kan trykkes på, er `<button>`, `<a href>`, `<input>`, `<select>` eller `<summary>`; intet andet har
 *   `role="button"` eller `tabindex`, og intet har `tabindex="-1"`. Hver knap har et navn.
 * - En knap, der viser et kort (fx "♥E"), har aria-label "Hjerter es"; en farveknap (fx "♠ 4 kort") har aria-label
 *   "Spar, 4 kort".
 */

const RØD_KLASSE = /(^|-)(red|roed)(-|$)/;
const RØD_STIL = /#c62828|rgb\(\s*198,\s*40,\s*40\s*\)|--suit-red|--card-red/i;
const harRødKlasse = (el: Element) => [...el.classList].some((c) => RØD_KLASSE.test(c));

function tjekRødt(hvor: string) {
  for (const t of tekstknuder(document.body)) {
    const el = t.parentElement!;
    if (!/[♥♦]/.test(t.textContent ?? '') || el.closest('option')) continue;
    expect(el.textContent?.trim(), `${hvor}: "${t.textContent}" – ♥ og ♦ skal stå alene i et element`).toMatch(/^[♥♦]$/);
    expect(harRødKlasse(el) || RØD_STIL.test(el.getAttribute('style') ?? ''), `${hvor}: ${el.outerHTML} – symbolet er ikke rødt`).toBe(true);
  }
  for (const el of document.body.querySelectorAll('*')) {
    if (!harRødKlasse(el) && !RØD_STIL.test(el.getAttribute('style') ?? '')) continue;
    expect((el.textContent ?? '').replace(/\s+/g, ''), `${hvor}: ${el.outerHTML.slice(0, 120)} – rødt element med andet end ♥ og ♦`).toMatch(/^[♥♦]*$/);
  }
}

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
    const tekst = (b.textContent ?? '').replace(/\s+/g, '');
    const kort = tekst.match(/^([♠♥♦♣])(10|[2-9]|[EKDB])$/);
    if (kort) {
      const label = b.getAttribute('aria-label') ?? '';
      expect(label, `${hvor}: kortknappen ${kort[0]}`).toMatch(KORTLABEL);
      expect(label, `${hvor}: kortknappen ${kort[0]}`).toBe(`${FARVER[kort[1]]} ${VALOERER[kort[2]] ?? kort[2]}`);
    }
    const farve = tekst.match(/^([♠♥♦♣])(\d+)kort$/);
    if (farve) expect(b.getAttribute('aria-label'), `${hvor}: farveknappen ${tekst}`).toBe(`${FARVER[farve[1]]}, ${farve[2]} kort`);
  }
}

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
  setLang('da');
});

describe('Rødt kun på ♥ og ♦ (accepttest 5, trin 3)', () => {
  it('ingen rang i et rødt element på øvelse 8\'s skærme, og hvert ♥ og ♦ er rødt', () => {
    let symboler = 0;
    const skaerme = hverUdspilSkaerm('da', data, (hvor) => {
      tjekRødt(hvor);
      symboler += tekstknuder(document.body).filter((t) => /[♥♦]/.test(t.textContent ?? '')).length;
    });
    expect(skaerme).toBeGreaterThan(150);
    expect(symboler, 'testen skal have set ♥ og ♦').toBeGreaterThan(100);
  }, 120_000);

  it('testen kan se forskel: en rang i det røde element fanges', () => {
    document.body.innerHTML = '<button type="button" aria-label="Hjerter es"><span class="suit-red">♥</span>E</button>';
    expect(() => tjekRødt('rigtig')).not.toThrow();
    document.body.innerHTML = '<button type="button" aria-label="Hjerter es"><span class="suit-red">♥E</span></button>';
    expect(() => tjekRødt('rang i rødt')).toThrow();
    document.body.innerHTML = '<td>♦ dit svar</td>';
    expect(() => tjekRødt('sort symbol')).toThrow();
  });
});

describe('Tilgængelighed og tastatur som v1 (accepttest 5, trin 3)', () => {
  it('alle knapper er <button> med et navn, kort- og farveknapperne har aria-label, og intet kan kun nås med musen', () => {
    const skaerme = hverUdspilSkaerm('da', data, tjekTilgaengelighed);
    expect(skaerme).toBeGreaterThan(150);
  }, 120_000);

  it('testen kan se forskel: en klikbar div, tabindex="-1" og en farveknap uden aria-label fanges', () => {
    document.body.innerHTML = '<button type="button" aria-label="Spar, 4 kort">♠<span>4 kort</span></button><button type="button" aria-label="Spar konge">♠K</button>';
    expect(() => tjekTilgaengelighed('rigtig')).not.toThrow();
    document.body.innerHTML = '<div role="button" tabindex="0">Næste opgave</div>';
    expect(() => tjekTilgaengelighed('div')).toThrow();
    document.body.innerHTML = '<button type="button" tabindex="-1">Næste opgave</button>';
    expect(() => tjekTilgaengelighed('tabindex')).toThrow();
    document.body.innerHTML = '<button type="button">♠<span>4 kort</span></button>';
    expect(() => tjekTilgaengelighed('farveknap uden aria-label')).toThrow();
    document.body.innerHTML = '<button type="button" aria-label="Hjerter E">♥E</button>';
    expect(() => tjekTilgaengelighed('forkortet kort')).toThrow();
  });
});
