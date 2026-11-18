// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLang } from '../../i18n';
import { bydeform } from '../../sprog/bydeform';
import { danishTexts } from '../../sprog/danskTekst';
import { fund } from '../../sprog/fagord';
import { hverSkaerm } from './testhjaelp';

/*
 * Accepttest 7 i SPEC-modspil.md, trin 2: sprog. Dansk og engelsk, husets ord og beskrivende form (eksisterende
 * sprogtjek).
 *
 * - De eksisterende sprogtjek (`src/sprog/sprog.test.ts` for husets ord og `src/sprog/bydeform.test.ts` for beskrivende
 *   form) læser al dansk tekst i kildekoden med `danishTexts()`. Testen her sikrer, at Modspils skærme er med, og
 *   kører de samme regler på den tekst, skærmene viser, også den, der sættes sammen, mens appen kører (forklaringerne,
 *   aftalerne og "Ved bordet").
 * - Engelsk: ingen dansk tekst på de engelske skærme, heller ikke i ⓘ, i aria-label (fx kortknapperne) eller i
 *   rullelisterne.
 * - Stavekontrollen køres med hånden før udgivelsen (`node scripts/sprogtjek.ts`, repoets CLAUDE.md).
 *
 * Grænsefladen, byggeriet skal give:
 * - Skærmene ligger i `src/modspil/ui/ModspilScreen.tsx` og `src/modspil/ui/Opgave.tsx` (og andre filer i mappen), og
 *   al tekst står på begge sprog med `tx('dansk', 'English')` eller sporets tekstfil, som i de andre spor.
 * - Instruktioner og forklaringer står i `<p>` og i beskrivende form; knapper og øvelsernes navne må stå i bydeform.
 * - På engelsk skærm: knappen "Settings" åbner Indstillinger, og ⓘ-knapperne hedder "Help: …".
 */

/** Dansk, der ikke må stå på en engelsk skærm (som i Pointregnskab), med Modspils egne ord. */
const DANSK =
  /[æøåÆØÅ]|\b(og|af|til|med|ikke|eller|kort|bordet|hånden|ingen|hvor|hvad|næste|svar|hp|vest|syd|nord|pas|spiller|makker|makkers|spilfører|udspil|udspillet|kald|afvisning|skift|lige|ulige|regel|aftalen|stik|niveau|opgave|rigtigt|forkert|metoderne|indstillinger|spar|hjerter|ruder|klør|konge|dame|knægt|omvendt|kompendiet|egen)\b|[♠♥♦♣]\s*[EDB](?![a-z])/i;

function engelsk(hvor: string) {
  for (const b of screen.queryAllByRole('button', { name: /^Help: / })) if (b.getAttribute('aria-expanded') !== 'true') fireEvent.click(b);
  // Appens navn står på dansk på begge sprog (som i src/app/i18n.test.tsx).
  const tekst = (document.body.textContent ?? '').replace(/Fordelingstræneren/g, '');
  const fundet = tekst.match(DANSK);
  expect(fundet?.[0], `${hvor}: ${fundet ? tekst.slice(Math.max(0, (fundet.index ?? 0) - 60), (fundet.index ?? 0) + 60) : ''}`).toBeUndefined();
  for (const el of document.body.querySelectorAll('[aria-label]')) {
    const label = el.getAttribute('aria-label') ?? '';
    expect(label.replace(/Fordelingstræneren/g, '').match(DANSK)?.[0], `${hvor}: aria-label "${label}"`).toBeUndefined();
  }
}

function dansk(hvor: string) {
  for (const b of screen.queryAllByRole('button', { name: /^Hjælp: / })) if (b.getAttribute('aria-expanded') !== 'true') fireEvent.click(b);
  const tekst = document.body.textContent ?? '';
  expect(fund(tekst).map((f) => `"${f.word}" (husets ord: ${f.house})`), `${hvor}: husets ord`).toEqual([]);
  for (const p of document.body.querySelectorAll('p')) {
    expect(bydeform((p.textContent ?? '').trim()), `${hvor}: beskrivende form i "${p.textContent}"`).toEqual([]);
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

describe('Sprog (accepttest 7, trin 2)', () => {
  it('de eksisterende sprogtjek læser Modspils skærme', () => {
    const filer = danishTexts().map((t) => t.file);
    expect(filer).toContain('src/modspil/ui/ModspilScreen.tsx');
    expect(filer).toContain('src/modspil/ui/Opgave.tsx');
  }, 30_000);

  it('dansk: husets ord og beskrivende form i den tekst, alle Modspil-skærme viser, også i ⓘ', () => {
    let skaerme = 0;
    hverSkaerm('da', (hvor) => {
      dansk(hvor);
      skaerme++;
    });
    expect(skaerme).toBeGreaterThan(100);
  }, 120_000);

  it('engelsk: ingen dansk tekst på Modspils skærme, i ⓘ, i aria-label eller i rullelisterne', () => {
    let skaerme = 0;
    hverSkaerm('en', (hvor) => {
      engelsk(hvor);
      skaerme++;
    });
    expect(skaerme).toBeGreaterThan(100);
  }, 120_000);

  it('testen kan se forskel', () => {
    document.body.innerHTML = '<p>Makker spillede 4.-højeste ud.</p>';
    expect(() => engelsk('engelsk')).toThrow();
    expect(() => dansk('dansk')).not.toThrow();
    document.body.innerHTML = '<p>Vælg en profil, og ret enkelte metoder herunder.</p>';
    expect(() => dansk('bydeform')).toThrow();
    document.body.innerHTML = '<p>Spilfører tager kippet.</p>';
    expect(() => dansk('husets ord')).toThrow();
    document.body.innerHTML = '<button type="button" aria-label="Spar 8">♠8</button>';
    expect(() => engelsk('aria-label')).toThrow();
    document.body.innerHTML = '<p>Partner led the fourth highest ♠Q.</p>';
    expect(() => engelsk('engelsk')).not.toThrow();
  });
});
