// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../app/App';
import { STORAGE_KEY } from '../../engine/storage';

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = vi.fn();
});

afterEach(cleanup);

async function openFarvebehandling() {
  render(<App />);
  click('Farvebehandling');
  await screen.findByRole('heading', { name: 'Farvebehandling' }, { timeout: 10_000 });
}

describe('Farvebehandling', { timeout: 30_000 }, () => {
  it('åbner analysevinduet med den hyppigste kombination fra menupunktet', async () => {
    await openFarvebehandling();
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

  it('viser Træning og Selvvalgt som kommende og går tilbage uden at røre fordelingssporets data', async () => {
    render(<App />);
    const before = localStorage.getItem(STORAGE_KEY);
    click('Farvebehandling');
    await screen.findByRole('heading', { name: 'Farvebehandling' }, { timeout: 10_000 });
    click('Træning');
    expect(screen.getByText(/Træning kommer i næste version/)).toBeTruthy();
    click('Selvvalgt');
    expect(screen.getByText(/Selvvalgt kommer i næste version/)).toBeTruthy();
    click('Analyse');
    click('Tilbage til forsiden');
    expect(screen.getByRole('heading', { name: 'Fordelingstræneren' })).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
    expect(Object.keys(localStorage).filter((k) => k.startsWith('farvebehandling'))).toEqual([]);
  });
});
