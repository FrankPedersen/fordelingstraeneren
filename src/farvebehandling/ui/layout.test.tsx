// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLang } from '../../i18n';
import { bandFields, disagreements, linesForGoal, sortFields } from '../analysis';
import { TEST_BANK } from '../testBank';
import { LayoutList } from './Analysevindue';
import { Linjekort } from './Linjekort';

// Fanebjælkens stylesheet tjekkes i tabs.test.ts, som kører i Node og kan læse filen.

/** En kombination med flere linjer, der er uenige, så tabellen har afgørende sidninger. */
const item = TEST_BANK.find((b) => {
  const lines = linesForGoal(b, b.combination.goals[0]);
  return lines.length > 2 && disagreements(bandFields(b, lines)).length > 1;
})!;
const goal = item.combination.goals[0];
const lines = linesForGoal(item, goal);

afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Analysevinduets layout (SPEC-analysevindue-layout.md)', () => {
  it('bankens viste linjer har stik pr. sidning, og gennemsnittet står på linjekortet med ⓘ på begge sprog', () => {
    let checked = 0;
    for (const b of TEST_BANK) {
      for (const g of b.combination.goals) {
        for (const l of linesForGoal(b, g)) {
          expect(l.lead.tricks, `${b.combination.id} ${g} ${l.letter}`).toHaveLength(b.solution.layouts.length);
          expect(l.average).not.toBeNull();
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(1000);
    const line = lines[0];
    render(<Linjekort line={line} />);
    const text = `Flest stik i gennemsnit: ${line.average!.toFixed(2).replace('.', ',')} stik`;
    expect(screen.getByText(text)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Hjælp: Stik i gennemsnit' }));
    expect(screen.getByText(/vægtet efter chance/)).toBeTruthy();
    cleanup();
    setLang('en');
    render(<Linjekort line={line} />);
    expect(screen.getByText(`Average tricks: ${line.average!.toFixed(2)}`)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Help: Average tricks' }));
    expect(screen.getByText(/weighted by chance/)).toBeTruthy();
    cleanup();
    // Før svaret vises gennemsnittet ikke.
    render(<Linjekort line={line} hideResult />);
    expect(screen.queryByText(/Average tricks/)).toBeNull();
  }, 30_000);

  it('tabellen har én kolonne pr. viste linje, de afgørende sidninger først, og hvert felt har ✓ eller ✕ og stik', () => {
    const fields = sortFields(bandFields(item, lines), 'fordeling');
    const onSelect = vi.fn();
    render(<LayoutList fields={fields} lines={lines} selected={null} onSelect={onSelect} grouping="fordeling" showAll />);
    const table = document.querySelector('.fb-layout-table')!;
    const headers = [...table.querySelectorAll('thead th')].map((th) => th.textContent);
    expect(headers).toEqual(['Vest', 'Øst', 'Chance', ...lines.map((l) => `Linje ${l.letter}`), 'afgør']);
    const rows = [...table.querySelectorAll('tbody tr:not(.fb-group-row)')];
    expect(rows).toHaveLength(fields.length);
    const decisive = disagreements(fields);
    rows.slice(0, decisive.length).forEach((row) => {
      expect(row.classList.contains('fb-row-decides')).toBe(true);
      expect(row.querySelector('.fb-decides')).not.toBeNull();
    });
    rows.slice(decisive.length).forEach((row) => expect(row.querySelector('.fb-decides')).toBeNull());
    for (const row of rows) {
      const cells = [...row.querySelectorAll('.fb-chip')];
      expect(cells).toHaveLength(lines.length);
      for (const cell of cells) expect(cell.textContent).toMatch(/^(✓|✕) \d+$/);
    }
    // Mellemoverskrifterne er grupperingen; et tryk på rækkens knap vælger sidningen som før.
    expect(table.querySelectorAll('.fb-group-row').length).toBeGreaterThan(0);
    fireEvent.click(within(rows[0] as HTMLElement).getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(decisive[0].id);
  });

  it('uden "Vis alle" står kun de afgørende sidninger; med honnørplacering som gruppering skifter mellemoverskrifterne', () => {
    const fields = sortFields(bandFields(item, lines), 'honnører');
    render(<LayoutList fields={fields} lines={lines} selected={null} onSelect={() => {}} grouping="honnører" showAll={false} />);
    expect(document.querySelectorAll('.fb-layout-table tbody tr')).toHaveLength(disagreements(fields).length);
    cleanup();
    render(<LayoutList fields={fields} lines={lines} selected={null} onSelect={() => {}} grouping="honnører" />);
    expect([...document.querySelectorAll('.fb-group-row')].every((r) => /^Vest har /.test(r.textContent ?? ''))).toBe(true);
  });

  it('på engelsk står der intet dansk i tabellen eller på linjekortene', () => {
    setLang('en');
    const fields = sortFields(bandFields(item, lines), 'fordeling');
    render(
      <>
        <LayoutList fields={fields} lines={lines} selected={null} onSelect={() => {}} grouping="fordeling" />
        {lines.map((l) => (
          <Linjekort key={l.letter} line={l} />
        ))}
      </>,
    );
    for (const button of screen.queryAllByRole('button', { name: /^Help: / })) fireEvent.click(button);
    const text = document.body.textContent ?? '';
    expect(text.match(/[æøåÆØÅ]|\b(Vest|Øst|kort|stik|linje|afgør|har|ingen|gennemsnit|chancen)\b/)?.[0]).toBeUndefined();
  });
});
