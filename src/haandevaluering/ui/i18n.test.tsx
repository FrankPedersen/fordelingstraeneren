// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mulberry32 } from '../../engine/rng';
import { setLang } from '../../i18n';
import { GENERATED, makeTask, type HandTask } from '../model/generator';
import { DECK_ORDER, deckTask } from '../training/deck';
import { facitOf, grade, type HandAnswer } from '../training/scoring';
import { Facit } from './Facit';
import HaandevalueringScreen from './HaandevalueringScreen';
import { Opgave } from './Opgave';
import { Opvarmning } from './Opvarmning';
import { TEXTS } from './texts';

/** Danske bogstaver og ord og danske honnørbogstaver ved en farve, som ikke må stå på skærmen på engelsk. */
const DANISH =
  /[æøåÆØÅ]|\b(og|af|til|med|ikke|eller|kort|ingen|hvor|hvad|næste|svar|hp|dig|makker|udgang|delkontrakt|lilleslem|storeslem|trumf|korthed|spildte|niveau|rigtigt|forkert|opvarmning|lynrunde|gange|stik|holder|sans|grænsen|tier|dame|knægt|es)\b|[♠♥♦♣][EDB](?![a-z])/i;

function expectEnglish(where: string) {
  for (const button of screen.queryAllByRole('button', { name: /^Help: / })) {
    if (button.getAttribute('aria-expanded') !== 'true') fireEvent.click(button);
  }
  const text = document.body.textContent ?? '';
  const found = text.match(DANISH);
  expect(found?.[0], `${where}: ${found ? text.slice(Math.max(0, (found.index ?? 0) - 60), (found.index ?? 0) + 60) : ''}`).toBeUndefined();
}

/** Formen af en tekstudgave: nøglerne og funktionernes antal parametre. */
function shape(value: unknown): unknown {
  if (typeof value === 'function') return `fn${value.length}`;
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]).sort());
  return typeof value;
}

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

/** Facits svar: det rigtige, så facit og regnskabet vises. */
function rightAnswer(task: HandTask): HandAnswer {
  const facit = facitOf(task);
  if (facit.exercise === 'add') return { exercise: 'add', terms: facit.terms };
  if (facit.exercise === 'decision') return { exercise: 'decision', decision: facit.right[0] };
  if (facit.exercise === 'strain') return { exercise: 'strain', strain: facit.strain };
  return { exercise: facit.exercise, points: facit.points };
}

/** Opgaver af hver slags, så alle facitsætninger kommer med (konge over for korthed, nabovalg, kort trumf, sans). */
const TASKS: HandTask[] = GENERATED.flatMap((exercise) => Array.from({ length: 6 }, (_, i) => makeTask(exercise, i + 1)));

beforeEach(() => {
  window.scrollTo = vi.fn();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Håndevaluering på dansk og engelsk', () => {
  it('den danske og den engelske tekstfil har samme form, og alle hjælpetekster findes på begge sprog', () => {
    expect(shape(TEXTS.en)).toEqual(shape(TEXTS.da));
    for (const lang of ['da', 'en'] as const) {
      for (const text of strings(TEXTS[lang].help)) expect(text.length, lang).toBeGreaterThan(40);
    }
    expect(strings(TEXTS.en).join('\n').match(DANISH)?.[0]).toBeUndefined();
  });

  it('forsiden og indstillingerne er på engelsk, også i ⓘ', () => {
    setLang('en');
    render(<HaandevalueringScreen onBack={() => {}} />);
    expectEnglish('forsiden');
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expectEnglish('indstillingerne');
  });

  it('opgaverne og facit er på engelsk, også meldingerne, regnskabet og ⓘ, og honnørerne er A K Q J', () => {
    setLang('en');
    for (const task of TASKS) {
      render(<Opgave task={task} onAnswer={() => {}} />);
      expectEnglish(`${task.exercise} ${task.seed}: opgaven`);
      const hand = document.querySelector('.he-hand')!.textContent ?? '';
      expect(hand, `${task.exercise} ${task.seed}`).not.toMatch(/\b[EDB]\b/);
      cleanup();
      const answer = rightAnswer(task);
      render(<Facit task={task} answer={answer} graded={grade(task, answer, 1_000)} onNext={() => {}} />);
      expectEnglish(`${task.exercise} ${task.seed}: facit`);
      cleanup();
    }
  }, 30_000);

  it('opvarmningens kort er på engelsk før og efter svaret', () => {
    setLang('en');
    for (const key of DECK_ORDER) {
      const task = deckTask(key, mulberry32(1));
      render(<Opvarmning task={task} onAnswer={() => {}} onNext={() => {}} />);
      expectEnglish(`${key}: kortet`);
      cleanup();
      render(<Opvarmning task={task} result={{ ok: false, xp: 0 }} onAnswer={() => {}} onNext={() => {}} />);
      expectEnglish(`${key}: facit`);
      cleanup();
    }
  }, 30_000);
});

describe('ⓘ ved elementerne (SPEC-haandevaluering.md, Sprog og hjælp)', () => {
  const help = (topic: string) => screen.getByRole('button', { name: `Hjælp: ${topic}` });

  it('forsiden og dens plan, startknappen, husketeknikkerne og indstillinger; niveau og data i indstillinger', () => {
    render(<HaandevalueringScreen onBack={() => {}} />);
    for (const topic of ['Håndevaluering', 'I dag', 'Start dagens session', 'Husketeknikker', 'Indstillinger']) expect(help(topic), topic).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Indstillinger' }));
    expect(help('Dine data')).toBeTruthy();
    expect(help('Niveau')).toBeTruthy();
  });

  it('hver øvelse ved spørgsmålet, meldingerne, regnskabet og facit; hvert kort i opvarmningen', () => {
    for (const task of TASKS) {
      render(<Opgave task={task} onAnswer={() => {}} />);
      expect(help(TEXTS.da.exercises[task.exercise]), task.exercise).toBeTruthy();
      if (task.exercise !== 'honors' && task.exercise !== 'strain') expect(help('Meldinger'), task.exercise).toBeTruthy();
      if (task.exercise === 'partner') expect(help('Regnskab')).toBeTruthy();
      cleanup();
      const answer = rightAnswer(task);
      render(<Facit task={task} answer={answer} graded={grade(task, answer, 1_000)} onNext={() => {}} />);
      expect(help('Facit'), task.exercise).toBeTruthy();
      if (['decision', 'distribution', 'wasted'].includes(task.exercise)) expect(help('Regnskab'), task.exercise).toBeTruthy();
      cleanup();
    }
    for (const key of ['anker:game', 'korthed:1', 'genvej:queen', 'moenster:5-4-3-1', 'makker:16', 'stik']) {
      render(<Opvarmning task={deckTask(key, mulberry32(1))} onAnswer={() => {}} onNext={() => {}} />);
      expect(screen.getAllByRole('button', { name: /^Hjælp: / }), key).toHaveLength(1);
      cleanup();
    }
  }, 30_000);
});
