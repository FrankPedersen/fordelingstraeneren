// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDecimal } from '../../engine/format';
import { setLang } from '../../i18n';
import { STANDARD } from '../model/situation';
import { handleSolve } from '../solver/results';
import { bankItem } from '../testBank';
import { Analysevindue } from './Analysevindue';

// SPEC-forbindelser.md, leverancetrin 2: blokken Forbindelser i panelet Situationen, chips, forudsætningslinjen og
// beregningen i browseren. Løseren er den rigtige (handleSolve) som i Situationspanel.test.tsx.
const control = vi.hoisted(() => ({ calls: [] as { kind: string; situation?: unknown }[] }));
vi.mock('../solver/client', async () => {
  const { handleSolve } = await import('../solver/results');
  class SolveCancelled extends Error {}
  return {
    SolveCancelled,
    createSolver: () => ({
      solve(request: Parameters<typeof handleSolve>[0]) {
        control.calls.push({ kind: request.kind, situation: request.situation });
        return Promise.resolve(handleSolve(request));
      },
      cancel() {},
    }),
  };
});

// E D B 7 6 / 5 4 3 2 (hånden / bordet): kipningen mod kongen skal spilles fra bordet, så indgangene til Nord tæller.
const START = '5432-AQJ76';
const BANK = [bankItem(START)];
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const times = (name: string | RegExp, n: number) => {
  for (let i = 0; i < n; i++) click(name);
};
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
/** Hånden, der er inde: knappen i feltet Inde. */
const inde = (hand: string) => fireEvent.click(within(screen.getByRole('group', { name: 'Inde' })).getByRole('button', { name: hand }));
const WAIT = { timeout: 10_000 };

beforeEach(() => {
  control.calls = [];
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Forbindelser i panelet Situationen (SPEC-forbindelser.md)', { timeout: 120_000 }, () => {
  it('blokken Forbindelser: indgange til Nord og Syd som trinvælgere, "ubegrænset" står over 5', () => {
    render(<Analysevindue bank={BANK} start={START} />);
    click('Angiv situationen');
    const panel = screen.getByRole('region', { name: 'Situationen' });
    expect(within(panel).getByRole('heading', { name: 'Forbindelser' })).toBeTruthy();
    expect(screen.getByRole('status', { name: 'Indgange til Nord' }).textContent).toBe('ubegrænset');
    expect(screen.getByRole('status', { name: 'Indgange til Syd' }).textContent).toBe('ubegrænset');
    expect(button('Indgange til Nord: én mere').disabled).toBe(true);
    click('Indgange til Nord: én mindre');
    expect(screen.getByRole('status', { name: 'Indgange til Nord' }).textContent).toBe('5');
    times('Indgange til Nord: én mindre', 5);
    expect(screen.getByRole('status', { name: 'Indgange til Nord' }).textContent).toBe('0');
    expect(button('Indgange til Nord: én mindre').disabled).toBe(true);
    times('Indgange til Nord: én mere', 6);
    expect(screen.getByRole('status', { name: 'Indgange til Nord' }).textContent).toBe('ubegrænset');
  });

  it('feltet Inde vises kun, når en hånd har begrænsede indgange, og står på Syd', () => {
    render(<Analysevindue bank={BANK} start={START} />);
    click('Angiv situationen');
    expect(screen.queryByRole('group', { name: 'Inde' })).toBeNull();
    click('Indgange til Syd: én mindre');
    const lead = screen.getByRole('group', { name: 'Inde' });
    expect(within(lead).getByRole('button', { name: 'Syd' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(lead).getByRole('button', { name: 'Nord' }).getAttribute('aria-pressed')).toBe('false');
    click('Indgange til Syd: én mere');
    expect(screen.queryByRole('group', { name: 'Inde' })).toBeNull();
  });

  it('chips, forudsætningslinjen og chancen regnet i browseren med forbindelserne', async () => {
    render(<Analysevindue bank={BANK} start={START} />);
    click('Angiv situationen');
    times('Indgange til Nord: én mindre', 6);
    const chips = () => [...document.querySelectorAll('.fb-situation-chips li')].map((li) => li.textContent);
    expect(chips()).toEqual(['Syd inde', 'Nord 0 indgange']);
    expect(screen.getByText('a priori · Syd inde, Nord 0 indgange og Syd ubegrænset · optimalt modspil')).toBeTruthy();
    const item = bankItem(START), goal = item.combination.goals[0];
    const situation = { ...STANDARD, entries: { north: 0, south: null }, lead: 'S' as const };
    const facit = handleSolve({ kind: 'goal', north: item.north, south: item.south, goal, situation });
    if (facit.kind !== 'goal') throw new Error('forkert svar');
    const value = `${formatDecimal(100 * facit.result.value, 1)} %`;
    expect((await screen.findAllByText(value, { selector: '.fb-line-value' }, WAIT)).length).toBeGreaterThan(0);
    expect(control.calls.at(-1)).toMatchObject({ kind: 'goal', situation: { entries: { north: 0, south: null } } });

    // Syd 2 indgange og Nord inde.
    times('Indgange til Nord: én mere', 6);
    times('Indgange til Syd: én mindre', 4);
    inde('Nord');
    expect(chips()).toEqual(['Nord inde', 'Syd 2 indgange']);
    expect(screen.getByText('a priori · Nord inde, Nord ubegrænset og Syd 2 indgange · optimalt modspil')).toBeTruthy();
    inde('Syd');
    expect(chips()).toEqual(['Syd inde · Syd 2 indgange']);
    expect(await screen.findByText(/Syd inde, Nord ubegrænset og Syd 2 indgange/, {}, WAIT)).toBeTruthy();
  });

  it('forbindelserne står sammen med kendte kort og hp-grænser', () => {
    render(<Analysevindue bank={BANK} start={START} />);
    click('Angiv situationen');
    click('Kendte kort i andre farver, Vest: én mere');
    times('Indgange til Syd: én mindre', 5);
    expect(screen.getByText('Vest 1 kendt kort · Syd inde, Nord ubegrænset og Syd 1 indgang · optimalt modspil')).toBeTruthy();
  });

  it('indgange mindst lige så mange som hånden har kort er ubegrænset: bankens tal bruges, og intet regnes', () => {
    render(<Analysevindue bank={BANK} start={START} />);
    click('Angiv situationen');
    // Bordet har 4 kort og hånden 5.
    click('Indgange til Nord: én mindre');
    click('Indgange til Syd: én mindre');
    expect(control.calls).toHaveLength(0);
    expect(document.querySelectorAll('.fb-line-value').length).toBeGreaterThan(0);
  });

  it('Nulstil fjerner forbindelserne', () => {
    render(<Analysevindue bank={BANK} start={START} />);
    click('Angiv situationen');
    times('Indgange til Syd: én mindre', 3);
    click('Nulstil');
    expect(screen.getByText('A priori · ubegrænsede forbindelser')).toBeTruthy();
    expect(document.querySelector('.fb-situation-chips')).toBeNull();
    expect(screen.getByText('a priori · ubegrænsede forbindelser · optimalt modspil')).toBeTruthy();
  });

  it('på engelsk står der ingen dansk, og ⓘ forklarer felterne', async () => {
    setLang('en');
    render(<Analysevindue bank={BANK} start={START} />);
    click('Set the situation');
    times('Entries to North: one less', 6);
    times('Entries to South: one less', 4);
    expect(screen.getByRole('heading', { name: 'Entries' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'On lead' })).toBeTruthy();
    expect(screen.getByText('South on lead · South 2 entries', { selector: '.fb-situation-chips li' })).toBeTruthy();
    expect(screen.getByText('North 0 entries', { selector: '.fb-situation-chips li' })).toBeTruthy();
    expect(screen.getByText('a priori · South on lead, North 0 entries and South 2 entries · best defence')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Help: Entries' }));
    fireEvent.click(screen.getByRole('button', { name: 'Help: On lead' }));
    const panel = screen.getByRole('region', { name: 'The situation' }).textContent ?? '';
    expect(panel).toMatch(/uses an entry/);
    const chips = document.querySelector('.fb-situation-chips')?.textContent ?? '';
    const assumptions = screen.getByText(/· best defence$/).textContent ?? '';
    for (const text of [panel, chips, assumptions]) {
      expect(text).not.toMatch(/[æøåÆØÅ]|\b(og|inde|indgang|indgange|ubegrænset|forbindelser|nord|syd|bordet|hånden|kort|hp|maks)\b/i);
    }
    await screen.findAllByText(/%/, { selector: '.fb-line-value' }, WAIT);
  });
});
