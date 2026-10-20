// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLang } from '../../i18n';
import { bankItem } from '../testBank';
import { Analysevindue } from './Analysevindue';

// SPEC-forbindelser.md, leverancetrin 3: Spil den selv åbnet fra Analyse følger forbindelserne. Løseren er den rigtige.
vi.mock('../solver/client', async () => {
  const { handleSolve } = await import('../solver/results');
  class SolveCancelled extends Error {}
  return {
    SolveCancelled,
    createSolver: () => ({
      solve: (request: Parameters<typeof handleSolve>[0]) => Promise.resolve(handleSolve(request)),
      cancel() {},
    }),
  };
});

// E K 2 / B 5 4 3 (bordet / hånden).
const START = 'AK2-J543';
const BANK = [bankItem(START)];
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const times = (name: string, n: number) => {
  for (let i = 0; i < n; i++) click(name);
};
const WAIT = { timeout: 20_000 };

beforeEach(() => {
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  setLang('da');
});

/** Syd 0 indgange og Nord inde, regnet i browseren, og Spil den selv åbnet. */
async function openPlay(less: string, lead: string, north: string, playButton: string) {
  times(less, 6);
  fireEvent.click(within(screen.getByRole('group', { name: lead })).getByRole('button', { name: north }));
  fireEvent.click(await screen.findByRole('button', { name: playButton }, WAIT));
  return screen.getByRole('region', { name: /^(Spil den selv|Play it yourself)$/ });
}

describe('Spil den selv med forbindelser (SPEC-forbindelser.md, trin 3)', { timeout: 120_000 }, () => {
  it('med Syd 0 indgange og Nord inde er udspil fra hånden grået ud, efter at bordet har vundet et stik', async () => {
    render(<Analysevindue bank={BANK} start={START} />);
    click('Angiv situationen');
    const play = await openPlay('Indgange til Syd: én mindre', 'Inde', 'Nord', 'Spil den selv ▶');
    const card = (name: string) => within(play).getByRole('button', { name }) as HTMLButtonElement;
    expect(within(play).getByText('Nord inde · Syd 0 indgange')).toBeTruthy();
    expect(card('din hånd: 3').disabled).toBe(true);
    expect(card('bordet: E').disabled).toBe(false);
    fireEvent.click(card('bordet: E'));
    // 3. hånd: hånden lægger et kort, så esset vinder, og bordet er inde.
    fireEvent.click(card('din hånd: 3'));
    expect(within(play).getByText('Nord inde · Syd 0 indgange')).toBeTruthy();
    expect(card('din hånd: 4').disabled).toBe(true);
    expect(card('bordet: K').disabled).toBe(false);
    fireEvent.click(within(play).getByRole('button', { name: 'Hjælp: Forbindelser i spillet' }));
    expect(within(play).getByRole('note').textContent).toMatch(/indgang/);
  });

  it('på engelsk står der ingen dansk i forbindelserne', async () => {
    setLang('en');
    render(<Analysevindue bank={BANK} start={START} />);
    click('Set the situation');
    const play = await openPlay('Entries to South: one less', 'On lead', 'North', 'Play it yourself ▶');
    expect(within(play).getByText('North on lead · South 0 entries')).toBeTruthy();
    fireEvent.click(within(play).getByRole('button', { name: 'Help: Entries in play' }));
    const note = within(play).getByRole('note').textContent ?? '';
    expect(note).not.toMatch(/[æøåÆØÅ]|\b(og|inde|indgang|indgange|hånden|bordet|udspil)\b/i);
  });
});
