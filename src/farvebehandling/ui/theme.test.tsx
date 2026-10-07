// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setLang } from '../../i18n';
import { bandFields, disagreements, linesForGoal } from '../analysis';
import { TEST_BANK } from '../testBank';
import { LayoutList } from './Analysevindue';
import { Bridgebord } from './Bridgebord';
import { Sandsynlighedsbånd } from './Sandsynlighedsbånd';

afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Temaet i farvebehandling (SPEC-tema.md)', () => {
  it('fb-hit står altid med ✓ og fb-miss altid med ✕, i båndet og i listen over sidninger', () => {
    let hits = 0;
    let misses = 0;
    for (const item of TEST_BANK.slice(0, 40)) {
      const goal = item.combination.goals[0];
      const lines = linesForGoal(item, goal);
      const fields = bandFields(item, lines);
      render(
        <>
          <Sandsynlighedsbånd lines={lines} fields={fields} selected={null} onSelect={() => {}} />
          <LayoutList fields={fields} lines={lines.map((l) => l.letter)} selected={null} onSelect={() => {}} />
        </>,
      );
      for (const el of document.querySelectorAll('.fb-field-hit, .fb-chip-hit')) {
        hits++;
        expect(el.textContent).toContain('✓');
        expect(el.textContent).not.toContain('✕');
      }
      for (const el of document.querySelectorAll('.fb-field-miss, .fb-chip-miss')) {
        misses++;
        expect(el.textContent).toContain('✕');
        expect(el.textContent).not.toContain('✓');
      }
      cleanup();
    }
    expect(hits).toBeGreaterThan(100);
    expect(misses).toBeGreaterThan(20);
  }, 30_000);

  it('mærket "afgør" står ved præcis de afgørende sidninger, med ⓘ på dansk og engelsk', () => {
    let marked = 0;
    for (const item of TEST_BANK.slice(0, 40)) {
      const lines = linesForGoal(item, item.combination.goals[0]);
      const fields = bandFields(item, lines);
      render(<LayoutList fields={fields} lines={lines.map((l) => l.letter)} selected={null} onSelect={() => {}} />);
      const rows = [...document.querySelectorAll('.fb-layouts > li')];
      const decisive = new Set(lines.length > 1 ? disagreements(fields).map((f) => f.id) : []);
      rows.forEach((row, i) => {
        const has = row.querySelector('.fb-decides') !== null;
        expect(has, `${item.combination.id} ${fields[i].id}`).toBe(decisive.has(fields[i].id));
        if (has) marked++;
      });
      expect(screen.queryByRole('button', { name: 'Hjælp: afgør' }) !== null).toBe(decisive.size > 0);
      cleanup();
    }
    expect(marked).toBeGreaterThan(5);
    const item = TEST_BANK.find((b) => {
      const lines = linesForGoal(b, b.combination.goals[0]);
      return lines.length > 1 && disagreements(bandFields(b, lines)).length > 0;
    })!;
    const lines = linesForGoal(item, item.combination.goals[0]);
    const fields = bandFields(item, lines);
    render(<LayoutList fields={fields} lines={lines.map((l) => l.letter)} selected={null} onSelect={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hjælp: afgør' }));
    expect(screen.getByText('Linjerne giver forskelligt resultat i denne sidning.')).toBeTruthy();
    cleanup();
    setLang('en');
    render(<LayoutList fields={fields} lines={lines.map((l) => l.letter)} selected={null} onSelect={() => {}} />);
    expect(screen.getAllByText('decides').length).toBeGreaterThan(1);
    fireEvent.click(screen.getByRole('button', { name: 'Help: decides' }));
    expect(screen.getByText('The lines give different results in this layout.')).toBeTruthy();
  }, 30_000);

  it('bordet er et diagram: hænderne som i systemnotatet, Vest og Øst ved siderne og et kompas med de manglende kort', () => {
    // Specens eksempel: bordet B 4 3 2 og hånden E 10 6 5 (rangen 2 … 14 = es).
    render(<Bridgebord north={[11, 4, 3, 2]} south={[14, 10, 6, 5]} />);
    const table = document.querySelector('.fb-table')!;
    expect(table.querySelector('.fb-seat-north .fb-hand [aria-hidden]')?.textContent).toBe('♠B432');
    expect(table.querySelector('.fb-seat-south .fb-hand [aria-hidden]')?.textContent).toBe('♠E1065');
    const compass = table.querySelector('.fb-compass')!;
    expect(compass.textContent).toBe('NVK D 9 8 7 manglerØS');
    expect(table.querySelector('.fb-seat-west')?.textContent).toBe('Vest♠ ?');
  });
});
