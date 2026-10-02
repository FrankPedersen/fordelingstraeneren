// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEY, defaultSaved } from '../engine/storage';
import App from './App';

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY)!);

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('App', () => {
  it('viser forsiden på dansk ved første besøg', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Fordelingstræneren' })).toBeTruthy();
    expect(screen.getByText('Velkommen')).toBeTruthy();
    expect(screen.getByText(/2 nye mønstre venter/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start dagens session' })).toBeTruthy();
  });

  it('introducerer det første mønster og opretter dets emner', () => {
    render(<App />);
    click('Start dagens session');
    expect(screen.getByText('Nyt mønster')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Mønster 4-4-3-2' })).toBeTruthy();
    click('Videre');
    expect(screen.getByText(/har vist/)).toBeTruthy();
    expect(Object.keys(stored().items).sort()).toEqual(['4-4-3-2:compare', '4-4-3-2:complete']);
  });

  it('tager mønstre fra tastaturet, giver feedback og går videre til højere/lavere', () => {
    render(<App />);
    click('Start dagens session');
    click('Videre');
    for (const key of ['4', '4', '3']) click(key);
    expect(screen.getByText('4-4-3-2', { selector: '.entry-id' })).toBeTruthy();
    click('Svar');
    expect(screen.getByRole('status').textContent).toMatch(/Rigtigt|Halv score|Forkert/);
    expect(screen.getByText(/havde \d+=\d+=\d+=\d+/)).toBeTruthy();
    click('Næste');
    expect(screen.getByText('Hvilket mønster er hyppigst?')).toBeTruthy();
  });

  it('kan afbryde en session', () => {
    render(<App />);
    click('Start dagens session');
    click('Afbryd sessionen');
    expect(screen.getByRole('dialog')).toBeTruthy();
    click('Afbryd');
    expect(screen.getByRole('button', { name: 'Start dagens session' })).toBeTruthy();
  });

  it('gennemfører en session og tæller dagen i streaken', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 2, 12, 0));
    render(<App />);
    click('Start dagens session');
    click('Videre');
    for (const key of ['4', '4', '3']) click(key);
    // Lad uret løbe forbi niveauøvelsen, så næste opgave er lynrunden.
    vi.setSystemTime(new Date(2026, 9, 2, 12, 4));
    click('Svar');
    click('Næste');
    expect(screen.getByText('Lynrunde')).toBeTruthy();
    click(/Lige hyppige/);
    vi.setSystemTime(new Date(2026, 9, 2, 12, 5, 30));
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText('Session gennemført')).toBeTruthy();
    expect(stored().streak).toMatchObject({ current: 1, best: 1, lastDay: '2026-10-02' });
    expect(stored().sessions).toHaveLength(1);
    click('Færdig');
    expect(screen.getByText(/Dagens session er gennemført/)).toBeTruthy();
  });

  it('importerer en fil først, når resuméet er godkendt', async () => {
    render(<App />);
    click('Indstillinger');
    const file = new File([JSON.stringify({ ...defaultSaved(), xp: 4321 })], 'data.json', {
      type: 'application/json',
    });
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
    expect(await screen.findByText('Importér filen?')).toBeTruthy();
    expect(screen.getByText('4.321')).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    click('Overskriv mine data');
    expect(stored().xp).toBe(4321);
    expect(screen.getByText('Dine data er importeret.')).toBeTruthy();
  });

  it('afviser en ugyldig fil uden at røre de gemte data', async () => {
    render(<App />);
    click('Indstillinger');
    const file = new File(['{ikke json'], 'data.json', { type: 'application/json' });
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
    expect(await screen.findByText('Filen er ikke gyldig JSON.')).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
