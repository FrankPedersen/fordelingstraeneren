// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import tokens from '../../design/tokens.json';
import { newItem } from '../engine/leitner';
import { defaultSaved, STORAGE_KEY } from '../engine/storage';
import { defaultPrSaved, PR_STORAGE_KEY } from '../pointregnskab/storage';
import { DECK_ORDER as PR_DECK } from '../pointregnskab/training/deck';
import { setLang } from '../i18n';
import App from './App';

// Accepttesten i SPEC-forside-spor.md for forsiden, Fordeling-skærmen, adresserne, topbjælken og sidefoden.

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const snapshot = () => JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])));
const describedBy = (name: string) => document.getElementById(screen.getByRole('button', { name }).getAttribute('aria-describedby')!)!.textContent;
const topbar = () => document.querySelector('header.topbar');
const footer = () => document.querySelector('footer.site-footer');

const TODAY = '2026-10-17';
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 17, 12));
  window.scrollTo = vi.fn();
  window.history.replaceState(null, '', '/');
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  setLang('da');
});

/** Fordeling med en session i dag og Pointregnskab med to kort til repetition. */
function oneTrackDone() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultSaved(), streak: { current: 4, best: 4, lastDay: TODAY }, items: { '4-4-3-2:rank': newItem('2026-10-20') } }));
  localStorage.setItem(PR_STORAGE_KEY, JSON.stringify({ ...defaultPrSaved(), level: 2, streak: { current: 1, best: 1, lastDay: '2026-10-16' }, items: { [PR_DECK[0]]: newItem(TODAY), [PR_DECK[1]]: newItem('2026-10-15') } }));
}

describe('Forsiden (SPEC-forside-spor.md)', () => {
  it('første besøg: Velkomst i stedet for I dag, og alle spor er "Ikke startet endnu"', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Velkommen' })).toBeTruthy();
    expect(screen.queryByRole('meter', { name: 'Spor trænet i dag' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Se en klubaften: 100 hænder' })).toBeTruthy();
    for (const track of ['Fordeling', 'Pointregnskab', 'Farvebehandling', 'Håndevaluering']) expect(describedBy(track), track).toMatch(/Ikke startet endnu$/);
  });

  it('I dag tæller de trænede spor, viser det næste og starter dets session; kortene har streak, niveau og ét mærke', async () => {
    oneTrackDone();
    const stored = snapshot();
    render(<App />);
    expect(screen.getByText('I dag · lørdag 17. oktober')).toBeTruthy();
    expect(screen.getByRole('heading', { name: '1 af 4 spor er trænet' })).toBeTruthy();
    expect(screen.getByRole('meter', { name: 'Spor trænet i dag' }).getAttribute('aria-valuenow')).toBe('1');
    expect(screen.getByText('Næste: Pointregnskab, med 2 emner til repetition. Ca. 5 minutter.')).toBeTruthy();
    expect(describedBy('Fordeling')).toBe('De 39 mønstre og deres hyppighed4 dage i trækNiveau 1 · almindelig✓ Trænet i dag');
    expect(describedBy('Pointregnskab')).toBe('Tæl honnørpoint under spillet1 dag i trækNiveau 22 emner til repetition');
    expect(describedBy('Farvebehandling')).toMatch(/Ikke startet endnu$/);
    expect(snapshot()).toBe(stored);
    // Knappen starter sporets session direkte (Afklaret punkt 1), uden topbjælke og sidefod.
    click('Start dagens session i Pointregnskab');
    expect(await screen.findByRole('button', { name: 'Afbryd sessionen' }, { timeout: 10_000 })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Pointregnskab', level: 1 })).toBeTruthy();
    expect(topbar()).toBeNull();
  }, 30_000);

  it('I dag starter også Farvebehandlings session direkte, når den er det næste spor', async () => {
    const done = { streak: { current: 1, best: 1, lastDay: TODAY } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultSaved(), ...done, items: { '4-4-3-2:rank': newItem('2026-10-20') } }));
    localStorage.setItem(PR_STORAGE_KEY, JSON.stringify({ ...defaultPrSaved(), ...done, items: { [PR_DECK[0]]: newItem('2026-10-20') } }));
    render(<App />);
    expect(screen.getByText(/^Næste: Farvebehandling/)).toBeTruthy();
    click('Start dagens session i Farvebehandling');
    expect(await screen.findByRole('button', { name: 'Afbryd sessionen' }, { timeout: 20_000 })).toBeTruthy();
    expect(topbar()).toBeNull();
    expect(footer()).toBeNull();
  }, 30_000);

  it('et tryk på kortet åbner sporets forside, ikke sessionen', async () => {
    oneTrackDone();
    render(<App />);
    click('Pointregnskab');
    expect(await screen.findByRole('button', { name: 'Start dagens session' }, { timeout: 10_000 })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Afbryd sessionen' })).toBeNull();
  }, 30_000);

  it('når alle fire spor er trænet, tilbydes en ekstra session i Fordeling', () => {
    const done = { streak: { current: 1, best: 1, lastDay: TODAY }, items: { [PR_DECK[0]]: newItem('2026-10-20') } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultSaved(), streak: done.streak, items: { '4-4-3-2:rank': newItem('2026-10-20') } }));
    for (const key of [PR_STORAGE_KEY, 'farvebehandling:v1', 'haandevaluering:v1']) localStorage.setItem(key, JSON.stringify({ ...defaultPrSaved(), ...done }));
    render(<App />);
    expect(screen.getByRole('heading', { name: '4 af 4 spor er trænet' })).toBeTruthy();
    expect(screen.getByText('Alle fire spor er trænet i dag.')).toBeTruthy();
    click('Tag en ekstra session i Fordeling');
    expect(screen.getByRole('button', { name: 'Afbryd sessionen' })).toBeTruthy();
  });

  it('data, der ikke kan læses, får ikke forsiden til at fejle; kortet viser "Ikke startet endnu", og intet skrives', () => {
    oneTrackDone();
    localStorage.setItem(PR_STORAGE_KEY, '{ikke json');
    const stored = snapshot();
    render(<App />);
    expect(describedBy('Pointregnskab')).toMatch(/Ikke startet endnu$/);
    expect(snapshot()).toBe(stored);
  });
});

describe('Adresser pr. spor', () => {
  it('#farvebehandling åbner Farvebehandling direkte, og Tilbage fører til forsiden uden adresse', async () => {
    window.history.replaceState(null, '', '/#farvebehandling');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Farvebehandling', level: 1 }, { timeout: 10_000 })).toBeTruthy();
    click('Tilbage til forsiden');
    expect(screen.getByRole('heading', { name: 'Fordelingstræneren' })).toBeTruthy();
    expect(window.location.hash).toBe('');
  }, 30_000);

  it('at åbne et spor skifter adressen, og browserens tilbage-knap fører til forsiden', async () => {
    render(<App />);
    click('Fordeling');
    expect(window.location.hash).toBe('#fordeling');
    window.history.back();
    expect(await screen.findByRole('heading', { name: 'Fordelingstræneren' })).toBeTruthy();
    expect(window.location.hash).toBe('');
  });

  it('sidefodens links til sporene åbner sporets skærm i appen', async () => {
    render(<App />);
    fireEvent.click(within(footer() as HTMLElement).getByRole('link', { name: 'Håndevaluering' }));
    expect(await screen.findByRole('heading', { name: 'Håndevaluering', level: 1 }, { timeout: 10_000 })).toBeTruthy();
  }, 30_000);
});

describe('Topbjælken og sidefoden', () => {
  it('står på forsiden, Fordeling-skærmen og sporenes skærme, men ikke i en session', async () => {
    render(<App />);
    expect(topbar() && footer()).toBeTruthy();
    click('Fordeling');
    expect(topbar() && footer()).toBeTruthy();
    click('Start dagens session');
    expect(topbar()).toBeNull();
    expect(footer()).toBeNull();
    click('Afbryd sessionen');
    click('Afbryd');
    click('Tilbage til forsiden');
    click('Pointregnskab');
    await screen.findByRole('heading', { name: 'Pointregnskab', level: 1 }, { timeout: 10_000 });
    expect(topbar() && footer()).toBeTruthy();
    click('Start dagens session');
    expect(topbar()).toBeNull();
    expect(footer()).toBeNull();
  }, 30_000);

  it('topbjælken linker til www.kontraktbridge.dk; sidefodens Trænere har de samme links som www.kontraktbridge.dk', () => {
    render(<App />);
    expect(within(topbar() as HTMLElement).getByRole('link', { name: 'Kontraktbridge' }).getAttribute('href')).toBe('https://www.kontraktbridge.dk/');
    expect(topbar()!.textContent).toBe('7NTKontraktbridgeFordelingstræneren');
    const trainers = within(footer() as HTMLElement).getByRole('navigation', { name: 'Trænere' });
    expect(within(trainers).getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Konventionstræner', '/konventionstraener/'],
      ['Fordeling', '#fordeling'],
      ['Pointregnskab', '#pointregnskab'],
      ['Farvebehandling', '#farvebehandling'],
      ['Håndevaluering', '#haandevaluering'],
      // Analyse som modul (SPEC-analyse-modul.md, trin 2).
      ['Analyse', '#analyse'],
    ]);
    expect(within(footer() as HTMLElement).queryByText('Aftaler og notater')).toBeNull();
    // SPEC-kontaktformular.md, del 3: kontaktformularen på Om mig i stedet for e-mailadressen.
    expect(within(footer() as HTMLElement).getByRole('link', { name: 'Skriv til mig' }).getAttribute('href')).toBe('/om-mig/#kontakt');
  });

  it('de nye tokens er ens i lys og mørk tilstand og består 4,5:1', () => {
    const color = (name: string) => tokens.color.tokens.find((t) => t.name === name)!.value;
    const luminance = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const contrast = (a: string, b: string) => {
      const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    for (const name of ['footer-bg', 'footer-text', 'footer-accent']) expect(color(name).light, name).toBe(color(name).dark);
    expect(contrast(color('footer-text').light, color('footer-bg').light)).toBeGreaterThan(15.5);
    expect(contrast(color('footer-accent').light, color('footer-bg').light)).toBeGreaterThan(8.4);
  });
});
