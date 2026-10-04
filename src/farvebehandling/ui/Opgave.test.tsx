// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mulberry32 } from '../../engine/rng';
import { guessInterval } from '../model/guess';
import { grade, makeTask } from '../training/tasks';
import { bankItem } from '../testBank';
import { Facit } from './Facit';
import { Opgave } from './Opgave';

afterEach(cleanup);

describe('Hvad nu?', () => {
  // E K 9 3 / B 2, 3 stik: lille fra hånden mod knægten, og Øst tager med damen.
  const item = bankItem('J2-AK93');
  const task = makeTask('hvad-nu', item, 3, mulberry32(3));
  if (task.type !== 'hvad-nu') throw new Error('forkert type');

  it('viser første runde, fortsættelserne uden chancer og gættet', () => {
    const onAnswer = vi.fn();
    render(<Opgave task={task} onAnswer={onAnswer} />);
    expect(screen.getByText('Første runde:')).toBeTruthy();
    expect(screen.getByLabelText(/^Første runde: Syd 3, Vest x, Nord B, Øst D$/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Hvad nu?' })).toBeTruthy();
    // Bordet viser kortene efter første runde: knægten og 3'eren er spillet.
    const table = screen.getByRole('figure');
    expect(table.textContent).toContain('♠2');
    expect(table.textContent).toContain('♠EK9');
    expect(screen.queryByText(/%$/, { selector: '.fb-line-value' })).toBeNull();
    const best = task.options.findIndex((o) => o.correct);
    fireEvent.click(screen.getAllByRole('button', { name: /^Linje [A-D]: / })[best]);
    const guess = screen.getByRole('group', { name: 'Hvor stor er chancen nu for 3 stik?' });
    fireEvent.click(within(guess).getAllByRole('button')[guessInterval(100 * task.options[best].value)]);
    fireEvent.click(screen.getByRole('button', { name: 'Svar' }));
    expect(onAnswer).toHaveBeenCalledWith({ line: best, guess: guessInterval(100 * task.options[best].value) });
  });

  it('viser i facit fortsættelsernes chance efter første runde og kun de mulige sidninger', () => {
    const best = task.options.findIndex((o) => o.correct);
    const answer = { line: best, guess: guessInterval(100 * task.options[best].value) };
    render(<Facit task={task} answer={answer} graded={grade(task, { ...answer, ms: 1 }, 20_000)} place={null} onNext={() => {}} />);
    expect(within(screen.getByRole('status')).getByText('Rigtigt')).toBeTruthy();
    expect(screen.getByText(/stadig er mulige/)).toBeTruthy();
    const letter = String.fromCharCode(65 + best);
    expect(within(screen.getByRole('article', { name: `Linje ${letter}` })).getByText('48,2 %')).toBeTruthy();
    // Kun sidninger med Øst D: båndets felter summerer til 100 % (chancerne er gemt med 6 decimaler).
    const fields = within(screen.getByRole('group', { name: 'Forskellen' })).getAllByRole('button');
    const widths = fields.map((f) => parseFloat((f as HTMLElement).style.width));
    const rows = task.options.length;
    expect(widths.reduce((a, b) => a + b, 0) / rows).toBeCloseTo(100, 2);
    for (const f of fields) expect(f.getAttribute('aria-label')).toMatch(/Øst D/);
  });
});
