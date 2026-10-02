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
    expect(Object.keys(stored().items).sort()).toEqual([
      '4-4-3-2:compare',
      '4-4-3-2:complete',
      '4-4-3-2:rank',
      '4-4-3-2:read',
    ]);
  });

  it('viser klubaftenens 100 hænder og fremhæver et mønster', () => {
    render(<App />);
    click('Klubaften');
    expect(screen.getByRole('img', { name: /^100 hænder: 22 × 4-4-3-2, 16 × 5-3-3-2/ })).toBeTruthy();
    click(/^6-3-2-2 × 6$/);
    expect(screen.getByText(/af 100 hænder/).textContent).toBe('6-3-2-2: 6 af 100 hænder');
  });

  it('låser en legendarisk albumplads op med tre rigtige svar', () => {
    render(<App />);
    click('Album');
    expect(screen.getByText(/0 af 39 mønstre samlet/)).toBeTruthy();
    click(/^\?6-6-1-01 ud af 1\.382$/);
    click('Lås op med tre spørgsmål');
    click('legendarisk');
    click('1 ud af 1.000–9.999');
    click('12');
    expect(screen.getByText('✓ Låst op!')).toBeTruthy();
    click('Til albummet');
    expect(stored().album['6-6-1-0']).toMatchObject({ count: 0 });
  });

  it('viser hånden i Lynaflæsning i t millisekunder og registrerer den i albummet', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 3, 12, 0));
    render(<App />);
    click('Start dagens session');
    click('Videre');
    for (const key of ['4', '4', '3']) click(key);
    vi.setSystemTime(new Date(2026, 9, 3, 12, 4));
    click('Svar');
    click('Næste');
    expect(screen.getByText('Lynrunde')).toBeTruthy();
    expect(screen.getByLabelText('Hånden').children).toHaveLength(13);
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByLabelText('Hånden er skjult')).toBeTruthy();
    for (const key of ['4', '3', '3']) click(key);
    const album = stored().album;
    expect(Object.values(album)).toEqual([{ first: '2026-10-03', count: 1 }]);
  });

  it('tager mønstre fra tastaturet, giver feedback og går videre til Paladsvandring', () => {
    render(<App />);
    click('Start dagens session');
    click('Videre');
    for (const key of ['4', '4', '3']) click(key);
    expect(screen.getByText('4-4-3-2', { selector: '.entry-id' })).toBeTruthy();
    click('Svar');
    expect(screen.getByRole('status').textContent).toMatch(/Rigtigt|Halv score|Forkert/);
    expect(screen.getByText(/havde \d+=\d+=\d+=\d+/)).toBeTruthy();
    click('Næste');
    expect(screen.getByText('Hvor på ruten bor 4-4-3-2?')).toBeTruthy();
    click(/^1 Station 1$/);
    expect(screen.getByRole('status').textContent).toMatch(/Rigtigt/);
    // Støtteniveau 3: station, billede og skyline efter svaret.
    expect(screen.getByText(/Station 1 · Rum 1/)).toBeTruthy();
    click('Næste');
    expect(screen.getByText('Hvilket mønster er hyppigst?')).toBeTruthy();
  });

  it('viser billedet som gratis ledetråd på støtteniveau 3', () => {
    render(<App />);
    click('Start dagens session');
    click('Videre');
    click('Vis ledetråd');
    expect(screen.getByRole('note').textContent).toContain('Trappen');
  });

  it('lader brugeren navngive stationer og skrive scener i huskepaladset', () => {
    render(<App />);
    click('Huskepalads');
    expect(screen.getByText(/Låses op på niveau 2/)).toBeTruthy();
    click(/Navngiv stationen.*Trappen/);
    fireEvent.change(screen.getByLabelText('Stationens navn'), { target: { value: 'Hoveddøren' } });
    click('Brug skabelonen');
    expect((screen.getByLabelText('Scene') as HTMLTextAreaElement).value).toBe('Ved Hoveddøren: Trappen ');
    fireEvent.change(screen.getByLabelText('Billede'), { target: { value: 'Mormors trappe' } });
    expect(stored().palace.stations[0]).toMatchObject({ name: 'Hoveddøren', scene: 'Ved Hoveddøren: Trappen ' });
    expect(stored().images['4-4-3-2']).toBe('Mormors trappe');
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
