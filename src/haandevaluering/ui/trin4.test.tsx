// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Hands } from '../../domain/dealer';
import { setLang } from '../../i18n';
import { makeTask, type HandTask } from '../model/generator';
import { parseHand } from '../model/hand';
import { gameThreshold } from '../model/pmodel';
import { grade, type HandAnswer } from '../training/scoring';
import { Facit } from './Facit';
import { Opgave } from './Opgave';

// SPEC-haandevaluering.md, leverancetrin 4: opgave 8 og 9 i brugerfladen. Eksempel 2 fra Franks svar (21. oktober 2026):
// ♠ B 6 5 ♥ K B 9 2 ♦ 9 8 7 ♣ E K 3 over for ♠ E D 10 ♥ E D 8 7 ♦ 10 6 4 ♣ D 6 4, fit i ♥.

function deal(south: string, north: string): Hands {
  const S = parseHand(south), N = parseHand(north);
  const rest = Array.from({ length: 52 }, (_, c) => c).filter((c) => !S.includes(c) && !N.includes(c));
  return { N, E: rest.slice(0, 13), S, W: rest.slice(13) };
}
const EXAMPLE: HandTask = { exercise: 'compare', seed: 0, hands: deal('J65.KJ92.987.AK3', 'AQT.AQ87.T64.Q64'), trump: 1 };
const lines = () => [...document.querySelectorAll('.he-facit-line')].map((p) => p.textContent);

beforeEach(() => {
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Opgave 8: Sammenlign metoder', () => {
  it('opgaven viser begge hænder og HCP og Zar med tal og beslutning, men ikke P', () => {
    const onAnswer = vi.fn();
    render(<Opgave task={EXAMPLE} onAnswer={onAnswer} />);
    expect(document.querySelectorAll('.he-hand')).toHaveLength(2);
    expect(document.body.textContent).toContain('Fit fundet i ♥');
    expect(screen.getByText('Hp: 12 + 14 = 26 hp → udgang (grænse 23)')).toBeTruthy();
    expect(screen.getByText('Zar: 24 + 26 = 50 ZP → delkontrakt (grænse 52)')).toBeTruthy();
    expect(screen.getByText('Hp og Zar er uenige. Hvem har ret?')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/P =|\bp =/);
    fireEvent.click(screen.getByRole('button', { name: 'Hjælp: Sammenlign metoder' }));
    expect(screen.getByRole('note').textContent).not.toMatch(/senere/);
    const answers = within(screen.getByRole('group', { name: 'Svar' }));
    expect(answers.getAllByRole('button').map((b) => b.textContent)).toEqual(['hp', 'Zar']);
    fireEvent.click(answers.getByRole('button', { name: 'Zar' }));
    expect(onAnswer).toHaveBeenCalledWith({ exercise: 'compare', method: 'zar' });
  });

  it('facit viser P pr. hånd og forklarer, hvad den forkerte metode overså', () => {
    const answer: HandAnswer = { exercise: 'compare', method: 'zar' };
    render(<Facit task={EXAMPLE} answer={answer} graded={grade(EXAMPLE, answer, 5_000)} onNext={() => {}} />);
    expect(screen.getByText(/^Rigtigt ·/)).toBeTruthy();
    expect(lines()).toEqual([
      'Hp: 12 + 14 = 26 hp → udgang (grænse 23)',
      'Zar: 24 + 26 = 50 ZP → delkontrakt (grænse 52)',
      'Dig: honnørpoint 12, p = 12.',
      'Makker: honnørpoint 15, p = 15.',
      'P = 12 + 15 = 27: delkontrakt.',
      'Zar har ret.',
      'Hp overså, at fordelingen giver for lidt: trumflængde og korthed giver 0 og esser, damer, knægte og tiere +1, så 26 hp bliver kun P = 27.',
    ]);
    cleanup();
    const wrong: HandAnswer = { exercise: 'compare', method: 'hcp' };
    render(<Facit task={EXAMPLE} answer={wrong} graded={grade(EXAMPLE, wrong, 5_000)} onNext={() => {}} />);
    expect(screen.getByText(/^Forkert ·/)).toBeTruthy();
    expect(screen.getByText('Dit svar: hp')).toBeTruthy();
  });

  it('på engelsk', () => {
    setLang('en');
    render(<Opgave task={EXAMPLE} onAnswer={() => {}} />);
    expect(screen.getByText('HCP: 12 + 14 = 26 HCP → game (limit 23)')).toBeTruthy();
    expect(screen.getByText('Zar: 24 + 26 = 50 ZP → partscore (limit 52)')).toBeTruthy();
    expect(screen.getByText('HCP and Zar disagree. Which is right?')).toBeTruthy();
    cleanup();
    const answer: HandAnswer = { exercise: 'compare', method: 'zar' };
    render(<Facit task={EXAMPLE} answer={answer} graded={grade(EXAMPLE, answer, 5_000)} onNext={() => {}} />);
    expect(lines().slice(2)).toEqual([
      'You: honour points 12, p = 12.',
      'Partner: honour points 15, p = 15.',
      'P = 12 + 15 = 27: partscore.',
      'Zar is right.',
      'HCP missed that the distribution adds too little: trump length and shortness add 0 and aces, queens, jacks and tens +1, so 26 HCP is only P = 27.',
    ]);
  });
});

describe('Opgave 9: Turneringsform', () => {
  it('opgaven viser turneringsformen, og facit bruger formens udgangsgrænse', () => {
    const tasks = Array.from({ length: 30 }, (_, i) => makeTask('form', i + 1));
    const task = tasks.find((t) => t.exercise === 'form' && t.form === 'impVulnerable')!;
    if (task.exercise !== 'form') throw new Error('forkert opgave');
    render(<Opgave task={task} onAnswer={() => {}} />);
    expect(screen.getByText('Holdturnering (IMP) i zonen')).toBeTruthy();
    expect(screen.getByText('Hvilket niveau?')).toBeTruthy();
    expect(within(screen.getByRole('group', { name: 'Svar' })).getAllByRole('button')).toHaveLength(4);
    cleanup();
    const answer: HandAnswer = { exercise: 'form', decision: 'game' };
    render(<Facit task={task} answer={answer} graded={grade(task, answer, 5_000)} onNext={() => {}} />);
    expect(lines()).toContain(`Holdturnering (IMP) i zonen: udgang er rigtig fra ca. 37 % for 4${['♠', '♥'][task.trump]}, dvs. P ≥ 27½.`);
    expect(gameThreshold(task.form)).toBe(27.5);
    cleanup();
    setLang('en');
    render(<Opgave task={task} onAnswer={() => {}} />);
    expect(screen.getByText('Teams (IMPs), vulnerable')).toBeTruthy();
  });
});
