// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLang } from '../../i18n';
import { bydeform, UNDTAGELSER } from '../../sprog/bydeform';
import { danishTexts } from '../../sprog/danskTekst';
import { fund } from '../../sprog/fagord';
import { hentDatasaet, type Datasaet } from '../model/findUdspil';
import { eksempel, facitTabel, hverUdspilSkaerm, KOLONNER, ren, svarPaa, visFindUdspil } from './hjaelp';

/*
 * Accepttest 6 i SPEC-modspil-v2.md, trin 3: dansk og engelsk, husets ord og beskrivende form; "Find udspillet" står på
 * undtagelseslisten (`src/sprog/bydeform.ts`), fordi det er en øvelses navn (som "Find hullet" og "Vælg kortet").
 *
 * - De eksisterende sprogtjek (`src/sprog/sprog.test.ts` og `src/sprog/bydeform.test.ts`) læser al dansk tekst i
 *   kildekoden med `danishTexts()`; testen her sikrer, at øvelse 8's skærm er med, og kører de samme regler på den tekst,
 *   skærmene viser, også ⓘ og den, der sættes sammen, mens appen kører (prisen og domsteksten).
 * - Engelsk: ingen dansk tekst på øvelse 8's engelske skærme, heller ikke i ⓘ og aria-label. Tabellens kolonner hedder
 *   "Lead", "Tricks", "Defeats" og "Cost" (specen, "Skærmen").
 * - Stavekontrollen køres med hånden før udgivelsen (`node scripts/sprogtjek.ts`, repoets CLAUDE.md).
 *
 * Grænsefladen: al ny tekst står på begge sprog som i v1 (sporets tekstfil eller `tx('dansk', 'English')`);
 * instruktioner og forklaringer i `<p>` og i beskrivende form; knapper og øvelsens navn må stå i bydeform. På engelsk
 * hedder ⓘ-knapperne "Help: …".
 */

/** Dansk, der ikke må stå på en engelsk skærm (som v1's src/modspil/ui/sprog.test.tsx), med øvelse 8's ord. */
const DANSK =
  /[æøåÆØÅ]|\b(og|af|til|med|ikke|eller|kort|bordet|hånden|ingen|hvor|hvad|næste|svar|hp|vest|syd|nord|pas|spiller|makker|makkers|spilfører|udspil|udspillet|stik|niveau|opgave|rigtigt|forkert|koster|snit|sætter|farve|farven|spilles|dit|indstillinger|spar|hjerter|ruder|klør|konge|dame|knægt|omvendt|kompendiet|egen)\b|[♠♥♦♣]\s*[EDB](?![a-z])/i;

function engelsk(hvor: string) {
  for (const b of screen.queryAllByRole('button', { name: /^Help: / })) if (b.getAttribute('aria-expanded') !== 'true') fireEvent.click(b);
  const tekst = (document.body.textContent ?? '').replace(/Fordelingstræneren/g, '');
  const fundet = tekst.match(DANSK);
  expect(fundet?.[0], `${hvor}: ${fundet ? tekst.slice(Math.max(0, (fundet.index ?? 0) - 60), (fundet.index ?? 0) + 60) : ''}`).toBeUndefined();
  for (const el of document.body.querySelectorAll('[aria-label]')) {
    const label = el.getAttribute('aria-label') ?? '';
    expect(label.match(DANSK)?.[0], `${hvor}: aria-label "${label}"`).toBeUndefined();
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

describe('Sprog (accepttest 6, trin 3)', () => {
  it('"Find udspillet" står på undtagelseslisten, og bydeformstesten godtager det', () => {
    expect(UNDTAGELSER).toContain('Find udspillet');
    expect(bydeform('Find udspillet')).toEqual([]);
  });

  it('de eksisterende sprogtjek læser øvelse 8\'s skærm', () => {
    expect(danishTexts().map((t) => t.file)).toContain('src/modspil/ui/FindUdspil.tsx');
  }, 30_000);

  it('dansk: husets ord og beskrivende form i den tekst, øvelse 8\'s skærme viser, også i ⓘ', () => {
    expect(hverUdspilSkaerm('da', data, dansk)).toBeGreaterThan(150);
  }, 120_000);

  it('engelsk: ingen dansk tekst på øvelse 8\'s skærme, i ⓘ eller i aria-label', () => {
    expect(hverUdspilSkaerm('en', data, engelsk)).toBeGreaterThan(150);
  }, 120_000);

  it('engelsk: spørgsmålet, øvelsens navn og tabellens kolonner', () => {
    for (const niveau of [1, 3] as const) {
      const o = eksempel(data, niveau);
      const svar = svarPaa(o, niveau === 1 ? { farve: 2 } : { kort: 15 });
      setLang('en');
      visFindUdspil(o, { svar });
      expect(screen.getByText('Find the lead')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Help: Find the lead' })).toBeTruthy();
      expect(facitTabel('en'), `niveau ${niveau}: ${KOLONNER.en.join(', ')}`).toBeTruthy();
      // Spørgsmålets ordlyd på engelsk er byggeriets; det står som <h1> og slutter med et spørgsmålstegn.
      expect(ren(screen.getAllByRole('heading', { level: 1 }).map((x) => x.textContent).find((t) => ren(t).endsWith('?'))), `niveau ${niveau}: spørgsmålet`).toMatch(/^[A-Z].*\?$/);
      cleanup();
      setLang('da');
    }
  });

  it('testen kan se forskel', () => {
    document.body.innerHTML = '<p>Dit svar: ♦ · koster 0,5 stik i snit</p>';
    expect(() => engelsk('engelsk')).toThrow();
    expect(() => dansk('dansk')).not.toThrow();
    document.body.innerHTML = '<p>Vælg en profil, og ret enkelte metoder herunder.</p>';
    expect(() => dansk('bydeform')).toThrow();
    document.body.innerHTML = '<p>Udspil fra blindemand.</p>';
    expect(() => dansk('husets ord')).toThrow();
    document.body.innerHTML = '<p>Your answer: ♦ · costs 0.5 tricks on average</p>';
    expect(() => engelsk('engelsk')).not.toThrow();
  });
});
