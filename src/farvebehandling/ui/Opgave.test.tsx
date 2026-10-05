// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mulberry32 } from '../../engine/rng';
import techniquesFile from '../content/techniques.json';
import { guessInterval } from '../model/guess';
import { dealCards, finished, playLead, playThird, startPlay } from '../play/play';
import { defaultFbSaved } from '../storage';
import { placeOf } from '../training/palace';
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

describe('Spil den selv', () => {
  // E K 5 4 / B 3 2, 3 stik.
  const item = bankItem('J32-AK54');
  const task = makeTask('spil-selv', item, 3, mulberry32(1));
  if (task.type !== 'spil-selv') throw new Error('forkert type');

  it('samler bedømmelsen i én statusboks, og "Hvorfor" viser rummet og alle sidninger', () => {
    // Lille fra hånden, til den er tom, og 3. hånd lægger lavt.
    const rng = mulberry32(2);
    let play = startPlay(item, dealCards(item, mulberry32(task.seed)));
    while (!finished(play)) {
      const hand = play.south.length ? 'S' : 'N';
      play = playLead(play, hand, Math.min(...(hand === 'S' ? play.south : play.north)), rng);
      const partner = hand === 'S' ? play.north : play.south;
      play = playThird(play, partner.length ? Math.min(...partner) : 0, rng);
    }
    const id = item.combination.id;
    const saved = { ...defaultFbSaved(), palace: { techniques: {}, stations: { [id]: { technique: item.combination.technique, order: 1 } } } };
    const graded = grade(task, { play, ms: 1 }, 20_000);
    render(<Facit task={task} answer={{ play }} graded={graded} reward={{ xp: 10, combo: 1 }} place={placeOf(saved, [item], techniquesFile.techniques, id)} onNext={() => {}} />);
    const status = screen.getByRole('status');
    expect(within(status).getByText(graded.score === 1 ? 'Rigtigt' : 'Forkert')).toBeTruthy();
    expect(within(status).getByText(`${play.won} stik – målet var 3`)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Hvorfor →' }));
    expect(screen.getByText(/^Rum: .+ · station 1$/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Alle sidninger' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '← Facit' }));
    expect(screen.getByRole('status')).toBeTruthy();
  });
});

describe('Hold eller par', () => {
  // K 5 4 / E B 3 2, 3 stik: slå kongen og esset (holdkamp) eller kip (parturnering).
  const item = bankItem('K54-AJ32');
  const task = makeTask('hold-eller-par', item, 3, mulberry32(1));
  if (task.type !== 'hold-eller-par') throw new Error('forkert type');
  const hold = task.options.findIndex((o) => o.bestFor === 'hold');
  const par = 1 - hold;
  const letter = (i: number) => String.fromCharCode(65 + i);

  it('spørger om linjen i holdkamp og i parturnering', () => {
    const onAnswer = vi.fn();
    render(<Opgave task={task} onAnswer={onAnswer} />);
    const submit = screen.getByRole('button', { name: 'Svar' }) as HTMLButtonElement;
    fireEvent.click(within(screen.getByRole('group', { name: 'Holdkamp, 3 stik' })).getByRole('button', { name: `Linje ${letter(hold)}` }));
    expect(submit.disabled).toBe(true);
    fireEvent.click(within(screen.getByRole('group', { name: 'Parturnering, flest stik' })).getByRole('button', { name: `Linje ${letter(par)}` }));
    fireEvent.click(submit);
    expect(onAnswer).toHaveBeenCalledWith({ forms: { hold, par } });
  });

  it('viser i facit chancen for målet og stik i gennemsnit for begge linjer', () => {
    const answer = { forms: { hold: par, par: hold } };
    render(<Facit task={task} answer={answer} graded={grade(task, { ...answer, ms: 1 }, 20_000)} place={null} onNext={() => {}} />);
    expect(within(screen.getByRole('status')).getByText('Forkert')).toBeTruthy();
    expect(screen.getByText(`Holdkamp, 3 stik: du valgte linje ${letter(par)} ✗ – linje ${letter(hold)} er bedst`)).toBeTruthy();
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows[1 + hold].textContent).toBe(`Linje ${letter(hold)}77,0 % ✓2,77`);
    expect(rows[1 + par].textContent).toBe(`Linje ${letter(par)}69,0 %2,87 ✓`);
    expect(
      screen.getByText(`Linje ${letter(hold)} er sikkerhedsspillet: den giver 3 stik 8,1 procentpoint oftere, men koster 0,10 stik i gennemsnit.`),
    ).toBeTruthy();
  });
});
