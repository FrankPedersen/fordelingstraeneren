// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bydeform } from '../../sprog/bydeform';
import { KATEGORI_DATA, profil } from '../model/metoder';
import { MS_STORAGE_KEY, parseMsImport, readMsSaved } from '../storage';
import ModspilScreen from './ModspilScreen';
import { foer } from './testhjaelp';

/*
 * Accepttest 3 i SPEC-modspil.md, trin 2: Indstillinger. Profilvalget gemmes og overlever genindlæsning, og en ændret
 * metode viser "Egen". Testen dækker også mock-up'en `4-indstillinger-390.html` (de tre profiler som radioknapper og de
 * syv metoder som rullelister) og lagringen i Afgrænsning (trin 2): nøglen `modspil:v1` med eksport og import som
 * Pointregnskab.
 *
 * Grænsefladen, byggeriet skal give:
 * - `ModspilScreen` har knappen "Indstillinger", der åbner Indstillinger med overskriften "Indstillinger" (h1).
 * - Profilerne er tre radioknapper i en `<fieldset>`; hver knaps navn begynder med profilens navn (Standard, Omvendt,
 *   Kompendiet). Standard er valgt for nye brugere.
 * - Under dem står overskriften "Metoderne i <profil>" (h2, fx "Metoderne i Standard"; "Metoderne i Egen", når en metode
 *   er ændret) og de syv metoder som `<select>` med kategoriens tekst fra metoder.json som label, i filens rækkefølge.
 *   Hver `<option>` har metodens id som `value`, i filens rækkefølge; ordlyden afgør byggeriet.
 * - Ændres en metode, er ingen af de tre radioknapper valgt, og overskriften siger "Egen".
 * - Valget gemmes straks i `modspil:v1` og læses igen, når skærmen vises på ny.
 * - `src/modspil/storage.ts`: `MS_STORAGE_KEY`, `readMsSaved(input)` → `{ saved, problems }` og `parseMsImport(tekst)`
 *   → `{ ok: true, saved } | { ok: false, error }`, som Pointregnskabs `readPrSaved` og `parsePrImport`. En eksport er
 *   `saved` som JSON.
 * - Teksten i Indstillinger står i beskrivende form (Franks svar 18. nov. 2026): mock-up'ens "Vælg en profil, og ret
 *   enkelte metoder herunder." skrives om, og forklaringen under profilerne begynder som i mock-up'en.
 */

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const PROFILNAVNE = ['Standard', 'Omvendt', 'Kompendiet'];

function aabn() {
  render(<ModspilScreen onBack={() => {}} />);
  click('Indstillinger');
  expect(screen.getByRole('heading', { name: 'Indstillinger', level: 1 })).toBeTruthy();
}
/** Genindlæsning: skærmen fjernes og vises på ny ud fra lagringen. */
function genindlaes() {
  cleanup();
  aabn();
}
const radioer = () => screen.getAllByRole('radio') as HTMLInputElement[];
const valgt = () => radioer().filter((r) => r.checked).map((r) => PROFILNAVNE.find((n) => (r.labels?.[0]?.textContent ?? r.getAttribute('aria-label') ?? '').trim().startsWith(n)));
const rulleliste = (i: number) => screen.getByRole('combobox', { name: KATEGORI_DATA[i].tekst }) as HTMLSelectElement;
const vaerdier = () => KATEGORI_DATA.map((_, i) => rulleliste(i).value);
const overskrift = () => screen.getAllByRole('heading', { level: 2 }).find((h) => /^Metoderne i /.test(h.textContent ?? ''))?.textContent;

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  window.scrollTo = vi.fn();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
});

describe('Indstillinger (accepttest 3, trin 2)', () => {
  it('de tre profiler som radioknapper og de syv metoder som rullelister; Standard er valgt for nye brugere', () => {
    aabn();
    const r = radioer();
    expect(r).toHaveLength(3);
    PROFILNAVNE.forEach((n, i) => expect(screen.getByRole('radio', { name: new RegExp(`^${n}\\b`) })).toBe(r[i]));
    expect(r[0].closest('fieldset')).toBeTruthy();
    expect(valgt()).toEqual(['Standard']);
    expect(overskrift()).toBe('Metoderne i Standard');
    expect(screen.getAllByRole('combobox')).toHaveLength(7);
    KATEGORI_DATA.forEach((k, i) => {
      const s = rulleliste(i);
      expect([...s.options].map((o) => o.value), k.id).toEqual(k.metoder.map((m) => m.id));
      for (const o of s.options) expect(o.textContent?.trim(), k.id).toBeTruthy();
      if (i > 0) expect(foer(rulleliste(i - 1), s), k.id).toBe(true);
    });
    expect(vaerdier()).toEqual(KATEGORI_DATA.map((k) => profil('standard').valg[k.id]));
    // Mock-up'ens rækkefølge: profilerne, så overskriften og metoderne.
    expect(foer(r[2], screen.getAllByRole('heading', { level: 2 }).find((h) => /^Metoderne i /.test(h.textContent ?? ''))!)).toBe(true);
    // Et kig skriver intet.
    expect(localStorage.getItem(MS_STORAGE_KEY)).toBeNull();
  });

  it('profilvalget gemmes og overlever genindlæsning, og metoderne følger profilen', () => {
    aabn();
    fireEvent.click(screen.getByRole('radio', { name: /^Omvendt\b/ }));
    expect(valgt()).toEqual(['Omvendt']);
    expect(vaerdier()).toEqual(KATEGORI_DATA.map((k) => profil('omvendt').valg[k.id]));
    expect(overskrift()).toBe('Metoderne i Omvendt');
    expect(localStorage.getItem(MS_STORAGE_KEY)).not.toBeNull();
    genindlaes();
    expect(valgt()).toEqual(['Omvendt']);
    expect(vaerdier()).toEqual(KATEGORI_DATA.map((k) => profil('omvendt').valg[k.id]));
    fireEvent.click(screen.getByRole('radio', { name: /^Kompendiet\b/ }));
    genindlaes();
    expect(valgt()).toEqual(['Kompendiet']);
    expect(overskrift()).toBe('Metoderne i Kompendiet');
  });

  it('en ændret metode viser "Egen", og ændringen overlever genindlæsning', () => {
    aabn();
    fireEvent.click(screen.getByRole('radio', { name: /^Omvendt\b/ }));
    const afkast = KATEGORI_DATA.findIndex((k) => k.id === 'afkast');
    expect(rulleliste(afkast).value).toBe('som-kald-afvisning');
    fireEvent.change(rulleliste(afkast), { target: { value: 'lavinthal' } });
    expect(valgt()).toEqual([]);
    expect(overskrift()).toBe('Metoderne i Egen');
    expect(vaerdier()).toEqual(KATEGORI_DATA.map((k) => (k.id === 'afkast' ? 'lavinthal' : profil('omvendt').valg[k.id])));
    genindlaes();
    expect(valgt()).toEqual([]);
    expect(overskrift()).toBe('Metoderne i Egen');
    expect(rulleliste(afkast).value).toBe('lavinthal');
    // Et nyt profilvalg sætter alle metoder til profilens.
    fireEvent.click(screen.getByRole('radio', { name: /^Standard\b/ }));
    expect(vaerdier()).toEqual(KATEGORI_DATA.map((k) => profil('standard').valg[k.id]));
    expect(overskrift()).toBe('Metoderne i Standard');
  });

  it('teksten i Indstillinger står i beskrivende form (Franks svar 18. nov. 2026)', () => {
    aabn();
    const tekster = [...document.querySelectorAll('main p')].map((p) => (p.textContent ?? '').trim()).filter(Boolean);
    expect(tekster.some((t) => t.startsWith('Facit og forklaringer følger de metoder, du vælger.'))).toBe(true);
    for (const t of tekster) expect(bydeform(t), t).toEqual([]);
    expect(document.body.textContent).not.toContain('Vælg en profil');
    expect(document.body.textContent).not.toContain('ret enkelte metoder');
  });

  it('kun modspil:v1 skrives, og en eksport kan importeres med profilen og metoderne (som Pointregnskab)', () => {
    localStorage.setItem('fordelingstraener:v1', '{"urørt":true}');
    aabn();
    fireEvent.click(screen.getByRole('radio', { name: /^Kompendiet\b/ }));
    const forsinket = KATEGORI_DATA.findIndex((k) => k.id === 'forsinket');
    fireEvent.change(rulleliste(forsinket), { target: { value: 'intet-forsinket' } });
    expect(Object.keys(localStorage).sort()).toEqual(['fordelingstraener:v1', MS_STORAGE_KEY].sort());
    expect(localStorage.getItem('fordelingstraener:v1')).toBe('{"urørt":true}');
    const { saved, problems } = readMsSaved(JSON.parse(localStorage.getItem(MS_STORAGE_KEY)!));
    expect(problems).toEqual([]);
    const eksport = JSON.stringify(saved);
    const importeret = parseMsImport(eksport);
    expect(importeret.ok).toBe(true);
    if (!importeret.ok) return;
    expect(importeret.saved).toEqual(saved);
    expect(parseMsImport('{"ikke":"modspil"}').ok).toBe(false);
    expect(parseMsImport('ikke json').ok).toBe(false);
    // Importeret i en tom browser: Indstillinger viser de samme metoder.
    cleanup();
    localStorage.clear();
    localStorage.setItem(MS_STORAGE_KEY, JSON.stringify(importeret.saved));
    aabn();
    expect(overskrift()).toBe('Metoderne i Egen');
    expect(vaerdier()).toEqual(KATEGORI_DATA.map((k) => (k.id === 'forsinket' ? 'intet-forsinket' : profil('kompendiet').valg[k.id])));
  });
});
