// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mulberry32 } from '../../engine/rng';
import { setLang } from '../../i18n';
import { makeTask, type Exercise, type Level, type PlacementTask, type PointTask } from '../model/generator';
import { correctAnswer, grade, type PointAnswer } from '../training/scoring';
import { deckTask, RANGE_CARDS } from '../training/deck';
import { Facit } from './Facit';
import { flashes, Opgave } from './Opgave';
import { Opvarmning } from './Opvarmning';
import PointregnskabScreen from './PointregnskabScreen';
import { TEXTS } from './texts';

/** Danske bogstaver, ord og honnørbogstaver, som ikke må stå på skærmen på engelsk. */
const DANISH =
  /[æøåÆØÅ]|\b(og|af|til|med|ikke|eller|kort|bordet|hånden|ingen|hvor|hvad|tryk|næste|svar|hp|vest|syd|nord|pas|spiller|lægger|mangler|kan|har|den|det|blokke|niveau|rigtigt|forkert|opvarmning|regnestykket|sidder|honnører|melding|vist|rest)\b|[♠♥♦♣][EDB](?![a-z])/i;

function expectEnglish(where: string) {
  for (const button of screen.queryAllByRole('button', { name: /^Help: / })) {
    if (button.getAttribute('aria-expanded') !== 'true') fireEvent.click(button);
  }
  const text = document.body.textContent ?? '';
  const found = text.match(DANISH);
  expect(found?.[0], `${where}: ${found ? text.slice(Math.max(0, (found.index ?? 0) - 60), (found.index ?? 0) + 60) : ''}`).toBeUndefined();
}

/** Opgaven til spørgsmålet: den løbende visning spoles frem. */
function renderTask(task: PointTask) {
  render(<Opgave task={task} showMs={100} onAnswer={() => {}} />);
  // Hver honnør får sin egen timer, når den forrige er vist.
  if (flashes(task)) for (let i = 0; i < 20; i++) act(() => vi.advanceTimersByTime(100));
}

/** Formen af en tekstudgave: nøglerne og funktionernes antal parametre. */
function shape(value: unknown): unknown {
  if (typeof value === 'function') return `fn${value.length}`;
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]).sort());
  return typeof value;
}

/** Alle tekster i en udgave, også hjælpeteksterne. */
function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const TASKS: [Exercise, Level][] = [
  ['sum', 1],
  ['running', 2],
  ['can', 1],
  ['who', 2],
  ['finesse', 3],
  ['who', 4],
  ['can', 5],
  ['full', 3],
];

beforeEach(() => {
  vi.useFakeTimers();
  window.scrollTo = vi.fn();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  setLang('da');
});

describe('Pointregnskab på dansk og engelsk', () => {
  it('den danske og den engelske tekstfil har samme form, og alle hjælpetekster findes på begge sprog', () => {
    expect(shape(TEXTS.en)).toEqual(shape(TEXTS.da));
    for (const lang of ['da', 'en'] as const) {
      for (const text of strings(TEXTS[lang].help)) expect(text.length, lang).toBeGreaterThan(40);
    }
    const english = strings(TEXTS.en).join('\n');
    expect(english.match(DANISH)?.[0]).toBeUndefined();
  }, 30_000);

  it('forsiden og indstillingerne er på engelsk, også i ⓘ', () => {
    setLang('en');
    render(<PointregnskabScreen onBack={() => {}} />);
    expectEnglish('forsiden');
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expectEnglish('indstillingerne');
  }, 30_000);

  it('opgaverne, facit og opvarmningen er på engelsk, også meldingerne og ⓘ', () => {
    setLang('en');
    for (const [exercise, level] of TASKS) {
      const task = makeTask(exercise, level, 11);
      renderTask(task);
      expectEnglish(`${exercise} ${level}: opgaven`);
      cleanup();
      const answer = correctAnswer(task);
      render(<Facit task={task} answer={answer} graded={grade(task, answer, 1_000)} onNext={() => {}} />);
      expectEnglish(`${exercise} ${level}: facit`);
      cleanup();
    }
    // Niveau 5: facit med længdeskabelonerne.
    for (let seed = 1; seed <= 8; seed++) {
      const task = makeTask('who', 5, seed);
      const answer = correctAnswer(task);
      render(<Facit task={task} answer={answer} graded={grade(task, answer, 1_000)} onNext={() => {}} />);
      expectEnglish(`niveau 5, seed ${seed}: facit`);
      cleanup();
    }
    for (const key of ['blok:EKD', RANGE_CARDS[0].key, 'interval:two-suited']) {
      const task = deckTask(key, mulberry32(1));
      render(<Opvarmning task={task} onAnswer={() => {}} onNext={() => {}} />);
      expectEnglish(`${key}: kortet`);
      cleanup();
      render(<Opvarmning task={task} result={{ ok: false, xp: 0 }} onAnswer={() => {}} onNext={() => {}} />);
      expectEnglish(`${key}: facit`);
      cleanup();
    }
  }, 30_000);

  it('overmod på engelsk: "You couldn\'t know that yet." efterfulgt af sætningen for "kan ikke afgøres"', () => {
    setLang('en');
    let task: PlacementTask | undefined;
    for (let seed = 1; !task; seed++) {
      const t = makeTask('who', 3, seed) as PlacementTask;
      if (t.placement === 'open') task = t;
    }
    const answer: PointAnswer = { exercise: 'who', placement: 'W' };
    render(<Facit task={task} answer={answer} graded={grade(task, answer, 1_000)} onNext={() => {}} />);
    const text = document.body.textContent ?? '';
    expect(text).toContain("You couldn't know that yet.");
    expect(text.indexOf("You couldn't know that yet.")).toBeLessThan(text.indexOf('Both placements fit:'));
    expectEnglish('overmod');
  }, 30_000);
});

describe('ⓘ ved elementerne', () => {
  const help = (topic: string) => screen.getByRole('button', { name: `Hjælp: ${topic}` });

  it('forsiden: titlen, dagens plan, startknappen, husketeknikkerne, blokke, intervalkort og indstillinger; data i indstillinger', () => {
    render(<PointregnskabScreen onBack={() => {}} />);
    for (const topic of ['Pointregnskab', 'I dag', 'Start dagens session', 'Husketeknikker', 'Blokke', 'Intervalkort', 'Indstillinger']) {
      expect(help(topic), topic).toBeTruthy();
    }
    fireEvent.click(screen.getByRole('button', { name: 'Indstillinger' }));
    expect(help('Dine data')).toBeTruthy();
    expect(help('Niveau')).toBeTruthy();
  }, 30_000);

  it('opgaverne: øvelsen ved spørgsmålet, regnskabspanelet, meldelinjen, ledetrådene, chippene og facit', () => {
    for (const [exercise, level] of TASKS) {
      const task = makeTask(exercise, level, 5);
      renderTask(task);
      expect(help(TEXTS.da.exercises[exercise]), exercise).toBeTruthy();
      if (task.exercise !== 'sum' && task.exercise !== 'running') {
        expect(help('Meldingerne')).toBeTruthy();
        expect(help('Usete honnører')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Hjælp: Regnskab' }) !== null).toBe(level < 4);
        expect(screen.queryByRole('button', { name: 'Hjælp: Seneste' }) !== null).toBe(level < 4);
        if (task.ledger.W.lengths) expect(help('Længderne fra 13-sudokuen')).toBeTruthy();
      }
      cleanup();
      const answer = correctAnswer(task);
      render(<Facit task={task} answer={answer} graded={grade(task, answer, 1_000)} onNext={() => {}} />);
      expect(help('Facit')).toBeTruthy();
      cleanup();
    }
  }, 30_000);
});
