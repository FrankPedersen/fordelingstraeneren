// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLang } from '../../i18n';
import { TEST_BANK } from '../testBank';
import { Analysevindue } from './Analysevindue';

// SPEC-analyse-situation.md, leverancetrin 3: feltet "Indsæt kombination eller spil" over kortvælgeren i Analyse.
// Importen regner intet; løseren bruges ikke her.
vi.mock('../solver/client', () => ({
  SolveCancelled: class extends Error {},
  createSolver: () => ({ solve: () => new Promise(() => {}), cancel() {} }),
}));

const LIN = 'md|3SQ6HKQ84D632CQ832,ST94HJ752DK84CT65,SJ52HTDAQJ975CKJ7,|';
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));

function importText(label: string, button: string, text: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value: text } });
  click(button);
}

beforeEach(() => {
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Import i Analyse', { timeout: 60_000 }, () => {
  it('Bordet-hånden stilles op direkte; findes kombinationen i banken, bruges bankens tal', () => {
    render(<Analysevindue bank={TEST_BANK} />);
    click('Kortvælger');
    importText('Indsæt kombination eller spil', 'Importér', '5432-EDB76');
    // E D B 7 6 / 5 4 3 2 står i banken: linjerne vises straks, og der er intet at regne.
    expect(screen.queryByText(/findes ikke i banken/)).toBeNull();
    expect(screen.getAllByRole('article').length).toBeGreaterThan(0);
    const picker = screen.getByRole('group', { name: 'Kortvælger' });
    expect(within(picker).getByRole('button', { name: 'E: din hånd' })).toBeTruthy();
    expect(within(picker).getByRole('button', { name: '5: bordet' })).toBeTruthy();
  });

  it('et spil giver 8 kombinationer at vælge imellem, og den valgte står i kortvælgeren', () => {
    render(<Analysevindue bank={TEST_BANK} />);
    click('Kortvælger');
    importText('Indsæt kombination eller spil', 'Importér', LIN);
    const choices = screen.getByRole('group', { name: 'Vælg en kombination fra spillet' });
    expect(within(choices).getAllByRole('button')).toHaveLength(8);
    fireEvent.click(within(choices).getByRole('button', { name: '♦ E D B 9 7 5 – 6 3 2 (Nord–Syd)' }));
    expect(within(choices).getByRole('button', { name: '♠ E K 8 7 3 – 10 9 4 (Øst–Vest)' })).toBeTruthy();
    const picker = screen.getByRole('group', { name: 'Kortvælger' });
    expect(within(picker).getByRole('button', { name: 'E: bordet' })).toBeTruthy();
    expect(within(picker).getByRole('button', { name: '6: din hånd' })).toBeTruthy();
    expect(within(picker).getByRole('button', { name: 'K: ingen' })).toBeTruthy();
  });

  it('fejl siger, hvad der er galt, og hvordan det rettes', () => {
    render(<Analysevindue bank={TEST_BANK} />);
    click('Kortvælger');
    importText('Indsæt kombination eller spil', 'Importér', 'AK6-AJ4');
    expect(screen.getByRole('alert').textContent).toMatch(/Kortet E står to gange/);
    importText('Indsæt kombination eller spil', 'Importér', 'https://tinyurl.com/2p8x7k');
    expect(screen.getByRole('alert').textContent).toMatch(/kort link\. Åbn spillet i handvieweren og kopiér den lange adresse/);
  });

  it('på engelsk står der ingen dansk', () => {
    setLang('en');
    render(<Analysevindue bank={TEST_BANK} />);
    click('Card picker');
    importText('Paste a combination or a deal', 'Import', LIN);
    const choices = screen.getByRole('group', { name: 'Choose a combination from the deal' });
    expect(within(choices).getByRole('button', { name: '♦ A Q J 9 7 5 – 6 3 2 (North–South)' })).toBeTruthy();
    importText('Paste a combination or a deal', 'Import', 'AK6-AJ4');
    expect(screen.getByRole('alert').textContent).toMatch(/The card A appears twice/);
    for (const button of screen.queryAllByRole('button', { name: /^Help: / })) fireEvent.click(button);
    const field = document.querySelector('.fb-import')?.textContent ?? '';
    expect(field).not.toMatch(/[æøåÆØÅ]|\b(og|eller|kort|spil|indsæt|importér|bordet|hånden|fra|kombination|adressen)\b/i);
  });
});
