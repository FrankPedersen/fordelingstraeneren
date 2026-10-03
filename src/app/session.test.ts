import { describe, expect, it } from 'vitest';
import type { Support } from '../engine/leitner';
import type { Stake } from '../engine/xp';
import { defaultSaved, type Saved, type Skill } from '../engine/storage';
import { compareFrequency } from '../domain/compare';
import { PATTERNS, patternById } from '../domain/patterns';
import { placeOf } from '../memory/palace';
import { completeFacit } from '../modes/complete/task';
import { introduce } from './progression';
import {
  LEVEL_END,
  SUDOKU_DEADLINE,
  completeSudoku,
  finishSession,
  introducePattern,
  lightningKind,
  nextStep,
  startSession,
  submitAnswer,
  type Answer,
  type ModeTask,
  type SessionState,
  type Step,
  type TaskStep,
} from './session';

const T0 = new Date(2026, 9, 2, 12, 0).getTime();
const today = '2026-10-02';
const later = '2026-10-05';
const yesterdayNoon = new Date(2026, 9, 1, 12, 0).getTime();

function counter() {
  let n = 0;
  return () => ++n;
}

function right(task: ModeTask): Answer {
  switch (task.kind) {
    case 'higher-lower':
      return { kind: 'higher-lower', choice: compareFrequency(patternById(task.a), patternById(task.b)) };
    case 'complete':
      return { kind: 'complete', patterns: completeFacit(task).required.map((c) => c.pattern.id) };
    case 'palace':
      return task.direction === 'to-pattern'
        ? { kind: 'palace', answer: { pattern: task.patternId } }
        : { kind: 'palace', answer: { place: placeOf(patternById(task.patternId))! } };
    case 'read':
      return { kind: 'read', lengths: [...patternById(task.patternId).lengths] };
    case 'estimate':
      return { kind: 'estimate', count: patternById(task.patternId).per100 };
  }
}

function wrong(task: ModeTask): Answer {
  switch (task.kind) {
    case 'higher-lower': {
      const choice = compareFrequency(patternById(task.a), patternById(task.b)) === 'a' ? 'b' : 'a';
      return { kind: 'higher-lower', choice };
    }
    case 'complete':
      return { kind: 'complete', patterns: [] };
    case 'palace':
      return { kind: 'palace', answer: { pattern: '13-0-0-0' } };
    case 'read':
      return { kind: 'read', lengths: [13, 0, 0, 0] };
    case 'estimate':
      return { kind: 'estimate', count: patternById(task.patternId).per100 + 5 };
  }
}

interface Options {
  ms?: number;
  answer?: (step: TaskStep) => Answer;
  stake?: Stake;
  /** Sessionens starttidspunkt. */
  at?: number;
}

/** Kører en hel session og svarer på hver opgave efter `ms` millisekunder. */
function simulate(start: Saved, { ms = 2000, answer = (s) => right(s.task), stake, at = T0 }: Options = {}) {
  const seed = counter();
  let saved = start;
  let now = at;
  let state: SessionState = startSession(saved, now);
  const steps: Step[] = [];
  for (let i = 0; i < 1000; i++) {
    const next = nextStep(state, saved, now, seed);
    state = next.state;
    steps.push(next.step);
    if (next.step.type === 'status') break;
    if (next.step.type === 'intro') {
      ({ state, saved } = introducePattern(state, saved, next.step.patternId, now));
      continue;
    }
    if (next.step.type === 'sudoku') {
      now += 30_000;
      ({ state, saved } = completeSudoku(state, saved, 40));
      continue;
    }
    const s = next.step.type === 'present' ? next.step.next : next.step;
    const shownAt = now;
    now += ms;
    const timing = { shownAt, answeredAt: now };
    ({ state, saved } = submitAnswer(state, saved, s, answer(s), timing, { stake: s.stake ? stake : undefined }));
  }
  return { state, saved, steps, now };
}

const tasks = (steps: Step[]) =>
  steps.flatMap((s) => (s.type === 'task' ? [s] : s.type === 'present' ? [s.next] : []));

/** Mønstre introduceret i går og besvaret dengang; emnerne er forfaldne i dag med støtteniveau 1. */
function learned(ids: string[], due: Partial<Record<Skill, string>> = {}, support: Support = 1): Saved {
  let saved = defaultSaved();
  for (const id of ids) saved = introduce(saved, id, '2026-10-01');
  for (const [key, item] of Object.entries(saved.items)) {
    const skill = key.split(':')[1] as Skill;
    saved.items[key] = { ...item, due: due[skill] ?? today, support, log: [{ t: yesterdayNoon, ok: true, ms: 1 }] };
  }
  return saved;
}

describe('Session – første dag', () => {
  it('introducerer de to hyppigste mønstre og øver dem straks i alle tre øvelser', () => {
    const { steps } = simulate(defaultSaved());
    const first = steps.slice(0, 8).map((s) =>
      s.type === 'intro' ? `intro ${s.patternId}` : s.type === 'task' ? `${s.task.kind} ${s.task.patternId}` : s.type,
    );
    expect(first).toEqual([
      'intro 4-4-3-2',
      'complete 4-4-3-2',
      'palace 4-4-3-2',
      'higher-lower 4-4-3-2',
      'intro 5-3-3-2',
      'complete 5-3-3-2',
      'palace 5-3-3-2',
      'higher-lower 5-3-3-2',
    ]);
    expect(steps.filter((s) => s.type === 'intro')).toHaveLength(2);
  });

  it('tester et nyt mønster med lette opgaver: de to længste farver og mønster → station', () => {
    const [complete, palace] = tasks(simulate(defaultSaved()).steps).map((s) => s.task);
    expect(complete.kind === 'complete' && complete.known.filter((l) => l !== null)).toEqual([4, 4]);
    expect(palace).toMatchObject({ kind: 'palace', direction: 'to-station' });
  });

  it('præsenterer ikke et nyt mønster igen efter introduktionen', () => {
    expect(simulate(defaultSaved()).steps.some((s) => s.type === 'present')).toBe(false);
  });

  it('følger den bløde timer: niveauøvelse, 60 s lynrunde, 13-sudoku og derefter status', () => {
    const { steps, now } = simulate(defaultSaved());
    const all = tasks(steps);
    expect([...new Set(all.map((s) => s.phase))]).toEqual(['level', 'lightning']);
    const lightning = all.filter((s) => s.phase === 'lightning');
    expect(lightning).toHaveLength(30);
    for (const s of lightning) {
      expect(s).toMatchObject({ stake: false, support: 0, task: { kind: 'higher-lower' } });
    }
    expect(steps.at(-2)).toMatchObject({ type: 'sudoku', task: { kind: 'sudoku', hard: false } });
    expect(steps.at(-1)).toEqual({ type: 'status' });
    // Niveauøvelsen slutter efter 150 s, lynrunden varer 60 s, og sudokuen tager her 30 s.
    expect(LEVEL_END).toBe(150_000);
    expect(now - T0).toBe(150_000 + 60_000 + 30_000);
  });

  it('holder højst 2 opgaver af samme type i træk uden for lynrunden', () => {
    const kinds = tasks(simulate(defaultSaved()).steps)
      .filter((s) => s.phase !== 'lightning')
      .map((s) => s.task.kind);
    for (let i = 2; i < kinds.length; i++) {
      expect(kinds[i] === kinds[i - 1] && kinds[i] === kinds[i - 2], `opgave ${i}`).toBe(false);
    }
  });

  it('skifter mellem Fuldfør og Paladsvandring i niveauøvelsen', () => {
    const level = tasks(simulate(defaultSaved()).steps)
      .filter((s) => s.phase === 'level')
      .map((s) => s.task.kind);
    expect(level.filter((k) => k === 'palace').length).toBeGreaterThan(10);
    expect(level.filter((k) => k === 'complete').length).toBeGreaterThan(10);
  });

  it('tæller dagen i streaken og gemmer sessionen med korrekte svar pr. minut', () => {
    const { state, saved, now } = simulate(defaultSaved());
    const done = finishSession(state, saved, now);
    expect(done.streak).toMatchObject({ current: 1, best: 1, lastDay: today });
    expect(done.sessions).toEqual([
      { day: today, ms: now - T0, correct: state.total, total: state.total, cpm: 30, grades: state.grades },
    ]);
    expect(done.xp).toBe(state.xp);
    expect(done.xp).toBeGreaterThan(0);
  });
});

describe('Session – 13-sudoku og ugens boss', () => {
  it('lægger sudokuens point til XP', () => {
    const { state, saved } = simulate(defaultSaved());
    expect(saved.xp).toBe(state.xp);
    const before = startSession(defaultSaved(), T0);
    expect(completeSudoku(before, defaultSaved(), 40)).toMatchObject({ state: { xp: 40 }, saved: { xp: 40 } });
    expect(completeSudoku(before, defaultSaved(), -10).saved.xp).toBe(0);
  });

  it('springer sudokuen over, hvis lynrunden slutter, når der kun er tid til status', () => {
    const saved = defaultSaved();
    const late = { ...startSession(saved, T0), phase: 'lightning' as const, lightningStartedAt: T0 + 215_000 };
    expect(SUDOKU_DEADLINE).toBe(285_000);
    expect(nextStep(late, saved, T0 + 290_000, counter()).step).toEqual({ type: 'status' });
    expect(nextStep(late, saved, T0 + 280_000, counter()).step.type).toBe('sudoku');
  });

  it('gør hver 7. session til ugens boss med en svær sudoku', () => {
    const saved = defaultSaved();
    saved.sessions = Array.from({ length: 6 }, () => ({ day: '2026-09-30', ms: 300_000, correct: 1, total: 1, cpm: 1 }));
    const { steps } = simulate(saved);
    expect(steps.at(-2)).toMatchObject({ type: 'sudoku', task: { hard: true } });
    expect(startSession(defaultSaved(), T0).boss).toBe(false);
  });

  it('tæller svar pr. grad uden for lynrunden', () => {
    const { state, saved, now } = simulate(defaultSaved());
    const done = finishSession(state, saved, now);
    const outside = state.total - state.lightning.total;
    expect(done.sessions[0].grades).toEqual({ common: [outside, outside] });
  });
});

describe('Session – repetition', () => {
  it('stiller de forfaldne emner først, med indsats', () => {
    const saved = learned(['4-4-3-2', '5-3-3-2'], { compare: later, rank: later, read: later });
    const all = tasks(simulate(saved).steps);
    expect(all[0]).toMatchObject({ phase: 'review', stake: true, task: { kind: 'complete' } });
    expect(all[1]).toMatchObject({ phase: 'review', stake: true, task: { kind: 'complete' } });
    expect(all[2].phase).toBe('level');
  });

  it('indskyder en opgave af en anden type, når kun én type er forfalden', () => {
    const ids = PATTERNS.slice(0, 5).map((p) => p.id);
    const saved = learned(ids, { compare: later, rank: later, read: later });
    const review = tasks(simulate(saved, { ms: 1000 }).steps).filter((s) => s.phase === 'review');
    expect(review.slice(0, 3).map((s) => [s.task.kind, s.stake])).toEqual([
      ['complete', true],
      ['complete', true],
      ['palace', false],
    ]);
  });

  it('rykker hurtigt rigtige emner op og lader dem ikke komme igen samme dag', () => {
    const saved = learned(['4-4-3-2', '5-3-3-2'], { compare: later, rank: later, read: later });
    const after = simulate(saved, { ms: 1000 }).saved;
    expect(after.items['4-4-3-2:complete']).toMatchObject({ box: 2, due: '2026-10-04', support: 0 });
  });

  it('gentager et forkert svar markeret "Sikker" sidst i sessionen', () => {
    const saved = learned(['4-4-3-2'], { compare: later, rank: later, read: later });
    const answer = (s: TaskStep) => (s.phase === 'review' ? wrong(s.task) : right(s.task));
    const { steps } = simulate(saved, { answer, stake: 'sure' });
    const first = tasks(steps)[0];
    expect(first).toMatchObject({ phase: 'review', stake: true });
    expect(steps.at(-2)).toMatchObject({ type: 'task', phase: 'repeat', stake: false, support: 2, task: first.task });
  });

  it('gentager ikke et forkert svar markeret "Gæt"', () => {
    const saved = learned(['4-4-3-2'], { compare: later, rank: later, read: later });
    const answer = (s: TaskStep) => (s.phase === 'review' ? wrong(s.task) : right(s.task));
    const { steps } = simulate(saved, { answer, stake: 'guess' });
    expect(tasks(steps).some((s) => s.phase === 'repeat')).toBe(false);
  });
});

describe('Session – lynrunde, estimat og album', () => {
  it('skifter fra dag til dag mellem højere/lavere og Lynaflæsning', () => {
    expect(lightningKind('2026-10-02')).toBe('higher-lower');
    expect(lightningKind('2026-10-03')).toBe('read');
    expect(lightningKind('2025-12-31')).toBe('read');
  });

  it('viser tilfældige hænder i Lynaflæsning og registrerer hver hånd i albummet', () => {
    const nextDay = new Date(2026, 9, 3, 12, 0).getTime();
    const timed = defaultSaved();
    timed.settings.readShow = 'timed';
    const { steps, saved } = simulate(timed, { at: nextDay });
    const lightning = tasks(steps).filter((s) => s.phase === 'lightning').map((s) => s.task);
    expect(lightning).toHaveLength(30);
    for (const t of lightning) expect(t).toMatchObject({ kind: 'read', random: true });
    const seen = Object.values(saved.album).reduce((sum, e) => sum + e.count, 0);
    expect(seen).toBe(30);
    expect(Object.values(saved.album).every((e) => e.first === '2026-10-03')).toBe(true);
    // 30 rigtige svar: t går fra 3.000 ms ned mod gulvet på 800 ms.
    expect(saved.readMs).toBe(800);
  });

  it('lader t stå, når hånden vises, til brugeren trykker Klar (standard)', () => {
    const nextDay = new Date(2026, 9, 3, 12, 0).getTime();
    expect(simulate(defaultSaved(), { at: nextDay }).saved.readMs).toBeUndefined();
  });

  it('lader t stige 15 % efter en forkert aflæsning', () => {
    const saved = { ...learned(['4-4-3-2']), readMs: 2000 };
    saved.settings = { ...saved.settings, readShow: 'timed' };
    const task: ModeTask = { kind: 'read', seed: 1, patternId: '4-4-3-2', cards: [], showMs: 2000, random: false };
    const step: TaskStep = { type: 'task', phase: 'review', stake: false, support: 1, task };
    const r = submitAnswer(startSession(saved, T0), saved, step, wrong(task), { shownAt: T0, answeredAt: T0 + 900 });
    expect(r.saved.readMs).toBe(2300);
    expect(r.saved.album).toEqual({});
    expect(r.saved.items['4-4-3-2:read']).toMatchObject({ box: 1, due: '2026-10-03' });
  });

  it('øver sammenligning som Klubaften-estimat i repetitionen', () => {
    const ids = PATTERNS.slice(0, 5).map((p) => p.id);
    const saved = learned(ids, { complete: later, rank: later, read: later });
    const review = tasks(simulate(saved, { ms: 1000 }).steps).filter((s) => s.phase === 'review');
    const kinds = new Set(review.map((s) => s.task.kind));
    expect(kinds).toEqual(new Set(['higher-lower', 'estimate']));
  });
});

describe('Session – aftrapning', () => {
  it('præsenterer et emne på støtteniveau 3, før det testes, og kun én gang pr. mønster', () => {
    const saved = learned(['4-4-3-2'], {}, 3);
    const { steps } = simulate(saved);
    const presented = steps.filter((s) => s.type === 'present');
    expect(presented).toHaveLength(1);
    expect(steps[0]).toMatchObject({ type: 'present', patternId: '4-4-3-2', next: { phase: 'review', support: 3 } });
  });

  it('præsenterer ikke emner med lavere støtte', () => {
    const { steps } = simulate(learned(['4-4-3-2'], {}, 2));
    expect(steps.some((s) => s.type === 'present')).toBe(false);
    expect(tasks(steps)[0].support).toBe(2);
  });

  it('lader ledetråden koste 5 XP på støtteniveau 2 og være gratis på niveau 3', () => {
    const saved = learned(['4-4-3-2', '5-3-3-2']);
    const state = startSession(saved, T0);
    const timing = { shownAt: T0, answeredAt: T0 + 5000 };
    const task: ModeTask = { kind: 'palace', seed: 1, patternId: '4-4-3-2', direction: 'to-station' };
    const at = (support: Support): TaskStep => ({ type: 'task', phase: 'level', stake: false, support, task });
    const paid = submitAnswer(state, saved, at(2), right(task), timing, { hint: true });
    expect(paid.feedback).toMatchObject({ xp: 5, hintCost: 5 });
    const free = submitAnswer(state, saved, at(3), right(task), timing, { hint: true });
    expect(free.feedback).toMatchObject({ xp: 10, hintCost: 0 });
  });
});

describe('Session – svar', () => {
  const step = (phase: TaskStep['phase']): TaskStep => ({
    type: 'task',
    phase,
    stake: false,
    support: 1,
    task: { kind: 'higher-lower', seed: 1, patternId: '4-4-3-2', a: '4-4-3-2', b: '5-3-3-2' },
  });
  const saved = learned(['4-4-3-2', '5-3-3-2']);
  const timing = { shownAt: T0, answeredAt: T0 + 1000 };
  const state = startSession(saved, T0);

  it('sender begge mønstres sammenligningsemne i kasse 1 ved en fejl i højere/lavere', () => {
    const r = submitAnswer(state, saved, step('level'), wrong(step('level').task), timing);
    for (const id of ['4-4-3-2', '5-3-3-2']) {
      expect(r.saved.items[`${id}:compare`]).toMatchObject({ box: 1, due: '2026-10-03' });
      expect(r.saved.items[`${id}:compare`].log).toHaveLength(2);
    }
    expect(r.feedback).toMatchObject({ score: 0, xp: 0, combo: 0 });
  });

  it('flytter i lynrunden kun emner ved fejl og skriver ikke i loggen', () => {
    const boxed = { ...saved, items: { ...saved.items } };
    boxed.items['4-4-3-2:compare'] = { ...boxed.items['4-4-3-2:compare'], box: 3 };
    const ok = submitAnswer(state, boxed, step('lightning'), right(step('lightning').task), timing);
    expect(ok.saved.items).toEqual(boxed.items);
    expect(ok.state.lightning).toEqual({ correct: 1, total: 1 });
    const bad = submitAnswer(state, boxed, step('lightning'), wrong(step('lightning').task), timing);
    expect(bad.saved.items['4-4-3-2:compare']).toMatchObject({ box: 1, log: boxed.items['4-4-3-2:compare'].log });
  });

  it('giver XP med combo og indsats', () => {
    // (10 + 5 for hurtigt) × 2 efter 10 rigtige i træk, + 15 for "Sikker".
    const streaky = { ...state, combo: 10 };
    const r = submitAnswer(streaky, saved, step('review'), right(step('review').task), timing, { stake: 'sure' });
    expect(r.feedback).toMatchObject({ score: 1, xp: 45, combo: 11, fast: true });
    expect(r.saved.xp).toBe(45);
    expect(r.saved.items['4-4-3-2:compare'].log.at(-1)).toEqual({ t: T0 + 1000, ok: true, ms: 1000, sure: true });
  });

  it('gør fuldfør sværere ved over 90 % træfsikkerhed: kun én kendt farve', () => {
    const ids = PATTERNS.slice(0, 5).map((p) => p.id);
    const sharp = learned(ids, { compare: later, complete: later, rank: later, read: later });
    sharp.items['4-4-3-2:complete'].log = Array.from({ length: 20 }, (_, i) => ({ t: i + 1, ok: true, ms: 1 }));
    const r = nextStep(startSession(sharp, T0), sharp, T0, counter());
    const t = (r.step as TaskStep).task;
    expect(t.kind).toBe('complete');
    if (t.kind === 'complete') expect(t.known.filter((l) => l !== null)).toHaveLength(1);
  });
});
