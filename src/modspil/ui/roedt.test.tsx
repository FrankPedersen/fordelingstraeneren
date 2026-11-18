// @vitest-environment jsdom
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLang } from '../../i18n';
import { hverSkaerm, tekstknuder } from './testhjaelp';

/*
 * Accepttest 5 i SPEC-modspil.md, trin 2 (jsdom-delen): rødt kun på ♥ og ♦, og ingen rang i et rødt element på nogen
 * Modspil-skærm (specen, "Farver for farverne"). jsdom regner ikke CSS ud, så testen ser på opbygningen: hvert ♥ og ♦
 * står alene i sit eget element med en rød klasse, og et element med en rød klasse eller rød stil indeholder kun ♥ og ♦.
 * Den beregnede farve (#c62828) tjekkes i Chrome af `node scripts/tjek-bred-layout.mjs --modspil`.
 *
 * Grænsefladen, byggeriet skal give:
 * - ♥ og ♦ står i et element for sig, hvis klasse har ordet "red" (fx `suit-red` fra `src/ui/SuitText.tsx` eller
 *   `card-red` på spillekortene), fx `<span class="suit-red">♥</span> K84` og `4<span class="suit-red">♥</span>`.
 * - Tal og bogstaver står uden for det røde element, også i kortknapperne, stikket, meldeforløbet og forklaringerne.
 *   Rullelisternes `<option>` kan ikke have et element indeni og er ikke med.
 */

const RØD_KLASSE = /(^|-)(red|roed)(-|$)/;
const RØD_STIL = /#c62828|rgb\(\s*198,\s*40,\s*40\s*\)|--suit-red|--card-red/i;
const harRødKlasse = (el: Element) => [...el.classList].some((c) => RØD_KLASSE.test(c));

function tjekRødt(hvor: string) {
  // Hvert ♥ og ♦ står alene i et rødt element.
  for (const t of tekstknuder(document.body)) {
    const el = t.parentElement!;
    if (!/[♥♦]/.test(t.textContent ?? '') || el.closest('option')) continue;
    expect(el.textContent?.trim(), `${hvor}: "${t.textContent}" – ♥ og ♦ skal stå alene i et element`).toMatch(/^[♥♦]$/);
    expect(harRødKlasse(el) || RØD_STIL.test(el.getAttribute('style') ?? ''), `${hvor}: ${el.outerHTML} – symbolet er ikke rødt`).toBe(true);
  }
  // Ingen rang (eller anden tekst) i et rødt element.
  for (const el of document.body.querySelectorAll('*')) {
    if (!harRødKlasse(el) && !RØD_STIL.test(el.getAttribute('style') ?? '')) continue;
    expect((el.textContent ?? '').replace(/\s+/g, ''), `${hvor}: ${el.outerHTML.slice(0, 120)} – rødt element med andet end ♥ og ♦`).toMatch(/^[♥♦]*$/);
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

describe('Rødt kun på ♥ og ♦ (accepttest 5, trin 2)', () => {
  it('ingen rang i et rødt element på nogen Modspil-skærm, og hvert ♥ og ♦ er rødt', () => {
    let skaerme = 0;
    let symboler = 0;
    hverSkaerm('da', (hvor) => {
      tjekRødt(hvor);
      skaerme++;
      symboler += tekstknuder(document.body).filter((t) => /[♥♦]/.test(t.textContent ?? '')).length;
    });
    expect(skaerme).toBeGreaterThan(100);
    expect(symboler, 'testen skal have set ♥ og ♦').toBeGreaterThan(50);
  }, 120_000);

  it('testen kan se forskel: en rang i det røde element fanges', () => {
    document.body.innerHTML = '<p><span class="suit-red">♥</span> K84</p>';
    expect(() => tjekRødt('rigtig')).not.toThrow();
    document.body.innerHTML = '<p><span class="suit-red">♥ K84</span></p>';
    expect(() => tjekRødt('rang i rødt')).toThrow();
    document.body.innerHTML = '<p>♥ K84</p>';
    expect(() => tjekRødt('sort symbol')).toThrow();
    document.body.innerHTML = '<p>Syd spiller 4<span style="color: #c62828">♥</span></p>';
    expect(() => tjekRødt('rød stil')).not.toThrow();
    document.body.innerHTML = '<p><span style="color: #c62828">4♥</span></p>';
    expect(() => tjekRødt('tal i rød stil')).toThrow();
  });
});
