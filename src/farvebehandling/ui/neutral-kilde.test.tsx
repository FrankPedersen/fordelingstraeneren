// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLang } from '../../i18n';
import { customItem, linesForGoal, type BankItem } from '../analysis';
import { parseCards } from '../model/cards';
import { handleSolve } from '../solver/results';
import { bankItem, TEST_BANK } from '../testBank';
import { Analysevindue } from './Analysevindue';
import { Resultatkort } from './Resultatkort';

// SPEC-neutral-kilde.md, accepttest for det, brugeren ser.
const BOOK = 'Suit Combinations in Bridge (Jethalal M. Shah)';

function card(item: BankItem) {
  const goal = item.combination.goals[0];
  render(<Resultatkort item={item} goal={goal} best={linesForGoal(item, goal)[0]} />);
}

beforeEach(() => {
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Neutral kilde i Analyse (SPEC-neutral-kilde.md)', () => {
  it('Resultatkortet for E K D B 3 / 2 siger, at tallene stemmer med de klassiske farvebehandlinger, på dansk og engelsk', () => {
    const item = bankItem('2-AKQJ3');
    expect(item.combination.verified).toBe(true);
    card(item);
    expect(screen.getByText('Tallene stemmer med de klassiske farvebehandlinger.')).toBeTruthy();
    cleanup();
    setLang('en');
    card(item);
    expect(screen.getByText('The figures agree with the classic suit combinations.')).toBeTruthy();
  });

  it('en kombination, hvis tal afviger, siger det uden at henvise til valideringsrapporten', () => {
    const item = TEST_BANK.find((b) => !b.combination.verified)!;
    card(item);
    expect(screen.getByText('Tallene afviger fra de klassiske farvebehandlinger; appen bruger sin egen beregning.')).toBeTruthy();
    cleanup();
    setLang('en');
    card(item);
    expect(screen.getByText('The figures differ from the classic suit combinations; the app uses its own calculation.')).toBeTruthy();
  });

  it('en kombination fra kortvælgeren, der ikke er i banken, viser fortsat "Regnet i appen; der er ingen kilde at sammenligne med."', () => {
    // B 4 3 2 / E 10 6 5 er ikke i banken.
    const response = handleSolve({ kind: 'goal', north: parseCards('J432'), south: parseCards('AT65'), goal: 3 });
    if (response.kind !== 'goal') throw new Error('forkert svar');
    expect(TEST_BANK.some((b) => b.combination.id === 'J432-AT65')).toBe(false);
    card(customItem(response.base, [3], { '3': response.result }));
    expect(screen.getByText('Regnet i appen; der er ingen kilde at sammenligne med.')).toBeTruthy();
  }, 60_000);

  it('banken viser "De klassiske farvebehandlinger, hyppigste først.", og ⓘ ved Vælg kombination nævner bogen', () => {
    render(<Analysevindue bank={TEST_BANK} />);
    expect(screen.getByText('De klassiske farvebehandlinger, hyppigste først.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Hjælp: Vælg kombination' }));
    expect(screen.getByText(new RegExp(`med inspiration fra ${BOOK.replace(/[()]/g, '\\$&')}\\. Alle chancer er regnet i appen\\.$`))).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/bridgehands/i);
  }, 30_000);

  it('på engelsk: bankens tekst og ⓘ ved Choose a combination, uden dansk og uden bridgehands', () => {
    setLang('en');
    render(<Analysevindue bank={TEST_BANK} />);
    expect(screen.getByText('The classic suit combinations, most frequent first.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Help: Choose a combination' }));
    expect(screen.getByText(new RegExp(`inspired by ${BOOK.replace(/[()]/g, '\\$&')}\\. All chances are worked out in the app\\.$`))).toBeTruthy();
    const text = document.querySelector('[aria-labelledby="fb-choose"]')?.textContent ?? '';
    expect(text.match(/[æøåÆØÅ]|\b(og|af|med|ikke|kort|hyppigste|banken|kombination|regnet|chancer)\b|bridgehands/i)?.[0]).toBeUndefined();
  }, 30_000);
});
