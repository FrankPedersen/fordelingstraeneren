// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../app/App';
import { STORAGE_KEY } from '../../engine/storage';
import { defaultFbSaved, FB_STORAGE_KEY, type FbSaved } from '../storage';

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const stored = (): FbSaved => JSON.parse(localStorage.getItem(FB_STORAGE_KEY)!);

/** Middag lokal tid den 5. oktober 2026. */
const T0 = new Date(2026, 9, 5, 12, 0).getTime();

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function openFarvebehandling() {
  render(<App />);
  click('Farvebehandling');
  await screen.findByRole('heading', { name: 'Farvebehandling' }, { timeout: 10_000 });
}

/** Svarer på den opgave, der står på skærmen, uanset type. */
function answerAnything() {
  const holes = screen.queryByRole('group', { name: 'Hvor taber linjen? Vælg sidningen.' });
  if (holes) return fireEvent.click(within(holes).getAllByRole('button')[0]);
  const lines = screen.queryAllByRole('button', { name: /^Linje [A-D]: / });
  if (screen.queryByText('Tryk på den bedste linje')) return fireEvent.click(lines[0]);
  if (lines.length) fireEvent.click(lines[0]);
  const guess = screen.queryByRole('group', { name: /^Hvor stor er chancen|^Gæt chancen/ });
  if (guess) fireEvent.click(within(guess).getAllByRole('button')[1]);
  click('Svar');
}

describe('Farvebehandling', { timeout: 30_000 }, () => {
  it('åbner analysevinduet med den hyppigste kombination', async () => {
    await openFarvebehandling();
    click('Analyse');
    expect(screen.getByRole('heading', { name: 'Linjerne' })).toBeTruthy();
    const best = screen.getByRole('article', { name: 'Linje A' });
    expect(within(best).getByText('69,0 %')).toBeTruthy();
    expect(within(best).getByText('✓ bedst')).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Forskellen' })).toBeTruthy();
    expect(screen.getByRole('figure', { name: /Første udspil/ })).toBeTruthy();
    expect(screen.getByText('a priori · ubegrænsede forbindelser · optimalt modspil')).toBeTruthy();
  });

  it('skifter kombination og mål og viser den valgte sidning ved bordet', async () => {
    await openFarvebehandling();
    click('Analyse');
    // Case 44: E B 3 2 / K 5 4 med målene 4 og 3 stik.
    click(/^2\. E B 3 2 \/ K 5 4/);
    click('3 stik');
    expect(screen.getByRole('button', { name: '3 stik' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(screen.getByRole('article', { name: 'Linje A' })).getByText('77,0 %')).toBeTruthy();
    const firstField = within(screen.getByRole('group', { name: 'Forskellen' })).getAllByRole('button')[0];
    fireEvent.click(firstField);
    expect(firstField.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('figure', { name: /Første udspil/ }).textContent).not.toContain('?');
  });

  it('finder en kombination med kortvælgeren', async () => {
    await openFarvebehandling();
    click('Analyse');
    click('Kortvælger');
    const tap = (card: string, times: number) => {
      for (let i = 0; i < times; i++) fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${card}: `) }));
    };
    tap('B', 1);
    tap('3', 1);
    tap('2', 1);
    tap('E', 2);
    tap('K', 2);
    tap('5', 2);
    tap('4', 2);
    expect(screen.getByRole('button', { name: 'B: bordet' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'E: din hånd' })).toBeTruthy();
    expect(screen.queryByText(/findes ikke i banken/)).toBeNull();
    // Ikke i banken: B 4 3 2 / E 10 6 5.
    click('Ryd');
    tap('B', 1);
    tap('4', 1);
    tap('3', 1);
    tap('2', 1);
    tap('E', 2);
    tap('10', 2);
    tap('6', 2);
    tap('5', 2);
    expect(screen.getByText(/findes ikke i banken/)).toBeTruthy();
  });

  it('kører dagens session: introduktion, opgaver med facit, lynrunde og status', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(T0);
    render(<App />);
    const before = localStorage.getItem(STORAGE_KEY);
    click('Farvebehandling');
    await screen.findByRole('heading', { name: 'Farvebehandling' }, { timeout: 10_000 });
    expect(screen.getByText('0 emner til repetition · 2 nye kombinationer')).toBeTruthy();
    // Et kig rører ikke lagringen.
    expect(localStorage.getItem(FB_STORAGE_KEY)).toBeNull();

    click('Start dagens session');
    expect(screen.getByText('Ny kombination')).toBeTruthy();
    expect(screen.getByText('Rum: Spil mod honnør · ny station 1')).toBeTruthy();
    expect(screen.getByText('Spil mod det kort, du vil gøre til stik.')).toBeTruthy();
    click('Prøv den');
    expect(stored().introduced).toEqual({ 'J32-AK54': '2026-10-05' });
    expect(stored().palace.stations['J32-AK54']).toEqual({ technique: 'spil-mod-honnoer', order: 1 });

    // Linjerne er skjult, indtil der er svaret.
    expect(screen.getByText('Mål: 3 stik', { selector: '.prompt' })).toBeTruthy();
    expect(screen.queryByText('✓ bedst')).toBeNull();
    answerAnything();
    expect(within(screen.getByRole('status')).getByText(/^(Rigtigt|Halvt rigtigt|Forkert)$/)).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Forskellen' })).toBeTruthy();
    expect(stored().items['J32-AK54:3'].log).toHaveLength(1);
    click('Hvorfor →');
    expect(screen.getByText('Rum: Spil mod honnør · station 1')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Alle sidninger' })).toBeTruthy();
    click('Næste opgave');

    // Den næste kombination introduceres og øves i begge mål.
    expect(screen.getByText('Ny kombination')).toBeTruthy();
    click('Prøv den');
    answerAnything();
    click('Næste opgave');
    answerAnything();
    click('Næste opgave');
    expect(Object.keys(stored().items).sort()).toEqual(['J32-AK54:3', 'K54-AJ32:3', 'K54-AJ32:4']);

    // Efter niveauet kommer lynrunden: linje mod linje.
    vi.setSystemTime(T0 + 211_000);
    answerAnything();
    click('Næste opgave');
    expect(screen.getByText('Lynrunde')).toBeTruthy();
    expect(screen.getByText('Tryk på den bedste linje')).toBeTruthy();
    vi.setSystemTime(T0 + 275_000);
    answerAnything();
    click('Næste opgave');

    expect(screen.getByRole('heading', { name: 'Dagens session er færdig' })).toBeTruthy();
    const after = stored();
    expect(after.sessions).toHaveLength(1);
    expect(after.streak).toMatchObject({ current: 1, lastDay: '2026-10-05' });
    expect(after.xp).toBe(after.sessions[0].xp);
    click('Færdig');
    expect(screen.getByText('Dagens session er gennemført. Du kan tage en til.')).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
  });

  it('viser paladsets åbne rum og gemmer egen huskeregel og scene', async () => {
    const saved = { ...defaultFbSaved(), introduced: { 'J32-AK54': '2026-10-04' } };
    localStorage.setItem(FB_STORAGE_KEY, JSON.stringify(saved));
    await openFarvebehandling();
    click('Paladset');
    expect(screen.getByRole('heading', { name: 'Spil mod honnør' })).toBeTruthy();
    expect(screen.getByText('1. E K 5 4 / B 3 2')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Lukkede rum' })).toBeTruthy();
    click('Ret huskeregel: Spil mod honnør');
    fireEvent.change(screen.getByLabelText('Huskeregel'), { target: { value: 'Mod knægten uden støtte.' } });
    click('Gem');
    expect(screen.getByText('Mod knægten uden støtte.')).toBeTruthy();
    click('Ret din scene: E K 5 4 / B 3 2');
    fireEvent.change(screen.getByLabelText('Din scene'), { target: { value: 'Tyven klatrer op ad stigen.' } });
    click('Gem');
    expect(stored().palace).toEqual({
      techniques: { 'spil-mod-honnoer': { rule: 'Mod knægten uden støtte.' } },
      stations: { 'J32-AK54': { technique: 'spil-mod-honnoer', order: 1, scene: 'Tyven klatrer op ad stigen.' } },
    });
  });

  it('Selvvalgt viser antal pr. filtervalg, grår valg med 0 ud og logger uden at røre dagsplanen', async () => {
    await openFarvebehandling();
    click('Selvvalgt');
    const all = within(screen.getByRole('group', { name: 'Teknik' })).getByRole('button', { name: 'Alle (85)' });
    expect(all.getAttribute('aria-pressed')).toBe('true');
    click(/^Dobbelt kipning \(\d+\)$/);
    const cards = screen.getByRole('group', { name: 'Antal kort' });
    const disabled = within(cards).getAllByRole('button').filter((b) => (b as HTMLButtonElement).disabled);
    expect(disabled.length).toBeGreaterThan(0);
    for (const b of disabled) expect(b.textContent).toMatch(/\(0\)$/);
    click(/^7 kort \([1-9]\d*\)$/);
    click(/^Start · \d+ kombinationer?$/);
    answerAnything();
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText(/XP/)).toBeNull();
    const after = stored();
    expect(after.practice).toHaveLength(1);
    expect(after.items).toEqual({});
    expect(after.xp).toBe(0);
    click('Næste opgave');
    click('Skift filter');
    expect(screen.getByRole('group', { name: 'Teknik' })).toBeTruthy();
  });

  it('eksporterer og importerer sine egne data uden at røre fordelingssporets', async () => {
    const fordeling = JSON.stringify({ version: 1, urørt: true });
    localStorage.setItem(STORAGE_KEY, fordeling);
    const created: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      created.push(blob);
      return 'blob:fb';
    }) as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn();
    await openFarvebehandling();
    click('Dine data');
    click('Eksportér');
    expect(JSON.parse(await created[0].text())).toEqual(defaultFbSaved());
    expect(screen.getByText('Filen er gemt.')).toBeTruthy();

    const input = document.querySelector('input[type="file"]')!;
    // En fil fra fordelingssporet afvises.
    fireEvent.change(input, { target: { files: [new File([fordeling], 'fordeling.json')] } });
    expect(await screen.findByText('Filen indeholder ikke data fra farvebehandling.')).toBeTruthy();
    const file = new File([JSON.stringify({ ...defaultFbSaved(), xp: 321 })], 'farvebehandling.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByText('Filen har 321 XP, 0 emner, 0 sessioner og en streak på 0.')).toBeTruthy();
    expect(localStorage.getItem(FB_STORAGE_KEY)).toBeNull();
    click('Erstat mine data');
    expect(stored().xp).toBe(321);
    expect(screen.getByText('Dine data er importeret.')).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(fordeling);
  });

  it('går tilbage til forsiden', async () => {
    await openFarvebehandling();
    click('Tilbage til forsiden');
    expect(screen.getByRole('heading', { name: 'Fordelingstræneren' })).toBeTruthy();
  });
});
