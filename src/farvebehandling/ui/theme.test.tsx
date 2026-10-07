// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { bandFields, linesForGoal } from '../analysis';
import { TEST_BANK } from '../testBank';
import { LayoutList } from './Analysevindue';
import { Bridgebord } from './Bridgebord';
import { Sandsynlighedsbånd } from './Sandsynlighedsbånd';

afterEach(cleanup);

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
