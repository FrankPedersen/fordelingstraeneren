// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLang } from '../../i18n';
import { linesForGoal } from '../analysis';
import { TEST_BANK } from '../testBank';
import { Analysevindue } from './Analysevindue';
import { allLinesForGoal } from './linjevalg';

// SPEC-analyse-situation.md, leverancetrin 4: knappen "Vis alle udspil", afkrydsningsfelterne "Sammenlign" og de
// unikke vindere i Analyse. Bankens tal bruges; løseren regner intet.
vi.mock('../solver/client', () => ({
  SolveCancelled: class extends Error {},
  createSolver: () => ({ solve: () => new Promise(() => {}), cancel() {} }),
}));

// En kombination fra banken, hvor første mål har mindst tre viste linjer og flere udspil end de viste.
const ITEM = TEST_BANK.find((b) => {
  const goal = b.combination.goals[0];
  return linesForGoal(b, goal).length >= 3 && allLinesForGoal(b, goal).length > linesForGoal(b, goal).length;
})!;
const GOAL = ITEM.combination.goals[0];
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const lineArticles = () => screen.getAllByRole('article').filter((a) => /^(Linje|Line) [A-Z]$/.test(a.getAttribute('aria-label') ?? ''));
const lineColumns = () => screen.getAllByRole('columnheader').map((th) => th.textContent).filter((t) => /^(Linje|Line) [A-Z]$/.test(t ?? ''));

beforeEach(() => {
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Valg af linjer i Analyse', { timeout: 60_000 }, () => {
  it('Vis alle udspil viser alle første udspil og kan slås fra igen', () => {
    render(<Analysevindue bank={[ITEM]} start={ITEM.combination.id} />);
    expect(lineArticles()).toHaveLength(linesForGoal(ITEM, GOAL).length);
    click('Vis alle udspil');
    expect(lineArticles()).toHaveLength(allLinesForGoal(ITEM, GOAL).length);
    click('Vis kun de vigtigste udspil');
    expect(lineArticles()).toHaveLength(linesForGoal(ITEM, GOAL).length);
  });

  it('Sammenlign: med præcis to linjer viser tabellen kun dem, og de unikke vindere står over tabellen', () => {
    render(<Analysevindue bank={[ITEM]} start={ITEM.combination.id} />);
    const all = lineColumns();
    expect(all.length).toBeGreaterThanOrEqual(3);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sammenlign linje A' }));
    expect(lineColumns()).toEqual(all);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sammenlign linje C' }));
    expect(lineColumns()).toEqual(['Linje A', 'Linje C']);
    expect(screen.getByText(/^Linje A vinder alene i \d+ sidning(er)? \(\d+,\d %\), linje C i \d+ \(\d+,\d %\)$/)).toBeTruthy();
    // En tredje linje: så sammenlignes de viste linjer som i dag.
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sammenlign linje B' }));
    expect(lineColumns()).toEqual(all);
    expect(screen.queryByText(/vinder alene/)).toBeNull();
  });

  it('på engelsk står der ingen dansk', () => {
    setLang('en');
    render(<Analysevindue bank={[ITEM]} start={ITEM.combination.id} />);
    click('Show all first leads');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Compare line A' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Compare line B' }));
    const unique = screen.getByText(/^Line A wins alone in \d+ layouts? \(\d+\.\d %\), line B in \d+ \(\d+\.\d %\)$/).textContent ?? '';
    for (const button of screen.queryAllByRole('button', { name: /^Help: / })) fireEvent.click(button);
    const notes = screen.getAllByRole('note').map((n) => n.textContent).join(' ');
    for (const text of [unique, notes, screen.getByRole('button', { name: 'Show only the main first leads' }).textContent ?? ''])
      expect(text).not.toMatch(/[æøåÆØÅ]|\b(og|alle|udspil|linje|sammenlign|vinder|alene|sidning|sidninger)\b/i);
  });
});
