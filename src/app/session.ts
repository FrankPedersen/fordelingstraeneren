import { addDays, dayOf } from '../engine/dates';
import { review, type LogEntry, type Outcome } from '../engine/leitner';
import { mulberry32, shuffle } from '../engine/rng';
import {
  PHASE_MS,
  allowsKind,
  correctPerMinute,
  difficultyOf,
  pushRecent,
  type Difficulty,
} from '../engine/session';
import type { Saved, Skill } from '../engine/storage';
import { completeDay } from '../engine/streak';
import { addXp, answerXp, type Stake } from '../engine/xp';
import { patternById, type Pattern } from '../domain/patterns';
import { makeCompleteTask, scoreComplete, type CompleteTask } from '../modes/complete/task';
import {
  checkHigherLower,
  makeHigherLowerTask,
  type HigherLowerAnswer,
  type HigherLowerTask,
} from '../modes/higherLower/task';
import {
  currentGrade,
  dueItemKeys,
  introduce,
  introducedPatterns,
  itemKey,
  levelAccuracy,
  newPatternsWaiting,
  nextNewPattern,
  recentFromLogs,
  splitItemKey,
  unlockedPatterns,
} from './progression';

/** review = repetition, level = niveauøvelse, lightning = lynrunde, repeat = hyperkorrektion. */
export type Phase = 'review' | 'level' | 'lightning' | 'repeat' | 'status';

export type ModeTask = HigherLowerTask | CompleteTask;
export type TaskKind = ModeTask['kind'];

export type Answer =
  | { kind: 'higher-lower'; choice: HigherLowerAnswer }
  | { kind: 'complete'; patterns: string[] };

export interface TaskStep {
  type: 'task';
  phase: Phase;
  /** Repetitionsemner afsluttes med "Sikker" eller "Gæt". */
  stake: boolean;
  task: ModeTask;
}

export type Step = TaskStep | { type: 'intro'; patternId: string } | { type: 'status' };

const SKILL_OF: Record<TaskKind, Skill> = { 'higher-lower': 'compare', complete: 'complete' };
const KIND_OF: Partial<Record<Skill, TaskKind>> = { compare: 'higher-lower', complete: 'complete' };

/** Fuldfør er niveauøvelsen; højere/lavere skydes ind af hensyn til interleaving. */
const LEVEL_KINDS: readonly TaskKind[] = ['complete', 'higher-lower'];

/** Repetitionen slutter efter 60 s. */
export const REVIEW_END = PHASE_MS.review;

/** Niveauøvelsen slutter her. 13-sudoku kommer i trin 5; indtil da går dens 75 s til niveauøvelsen. */
export const LEVEL_END = PHASE_MS.review + PHASE_MS.level + PHASE_MS.sudoku;

export interface SessionState {
  startedAt: number;
  phase: Phase;
  lightningStartedAt?: number;
  lightningEndedAt?: number;
  /** Opgaverne uden for lynrunden, til interleaving og variation. */
  history: { kind: TaskKind; patternId: string }[];
  /** Mønstre introduceret i denne session. */
  introduced: string[];
  /** Rigtige svar i træk. */
  combo: number;
  correct: number;
  total: number;
  xp: number;
  lightning: { correct: number; total: number };
  /** Hyperkorrektion: forkerte svar markeret "Sikker" gentages sidst i sessionen. */
  repeat: TaskStep[];
  /** De seneste svar, til adaptiv sværhed. */
  recent: boolean[];
  /** Seneste par i lynrunden, så samme par ikke kommer to gange i træk. */
  lastPair?: string;
}

/** Giver et nyt seed til hver opgave, så den kan genskabes. */
export type SeedSource = () => number;

export function startSession(saved: Saved, now: number): SessionState {
  return {
    startedAt: now,
    phase: 'review',
    history: [],
    introduced: [],
    combo: 0,
    correct: 0,
    total: 0,
    xp: 0,
    lightning: { correct: 0, total: 0 },
    repeat: [],
    recent: recentFromLogs(saved),
  };
}

function makeTask(
  kind: TaskKind,
  pattern: Pattern,
  saved: Saved,
  difficulty: Difficulty,
  seed: number,
): ModeTask {
  return kind === 'higher-lower'
    ? makeHigherLowerTask(seed, pattern, unlockedPatterns(saved), difficulty)
    : makeCompleteTask(seed, pattern, difficulty);
}

/** Repetition: forfaldne emner, blandet på tværs af øvelserne. */
function reviewStep(s: SessionState, saved: Saved, today: string, seed: SeedSource): TaskStep | null {
  const due = dueItemKeys(saved, today);
  if (due.length === 0) return null;
  const kinds = s.history.map((h) => h.kind);
  const difficulty = difficultyOf(s.recent);
  // Laveste kasse og ældste forfald først; emner, der står lige, blandes.
  const order = shuffle([...due], mulberry32(seed())).sort(
    (a, b) =>
      saved.items[a].box - saved.items[b].box || saved.items[a].due.localeCompare(saved.items[b].due),
  );
  const kindOf = (key: string) => KIND_OF[splitItemKey(key).skill]!;
  const key = order.find((k) => allowsKind(kinds, kindOf(k)));
  if (key) {
    const pattern = patternById(splitItemKey(key).patternId);
    const task = makeTask(kindOf(key), pattern, saved, difficulty, seed());
    return { type: 'task', phase: 'review', stake: true, task };
  }
  // Kun én opgavetype er forfalden, og den har været der to gange i træk: indskyd den anden type.
  const other: TaskKind = kindOf(order[0]) === 'complete' ? 'higher-lower' : 'complete';
  const pattern = patternById(splitItemKey(order[0]).patternId);
  return { type: 'task', phase: 'review', stake: false, task: makeTask(other, pattern, saved, difficulty, seed()) };
}

/** Mønstrene på det aktuelle niveau, der er introduceret (ellers alle introducerede). */
function levelPool(saved: Saved): Pattern[] {
  const grade = currentGrade(saved);
  const introduced = introducedPatterns(saved);
  const here = introduced.filter((p) => p.grade === grade);
  return here.length > 0 ? here : introduced;
}

/** Niveauøvelse: nye mønstre introduceres og øves straks; derefter niveauets mønstre. */
function levelStep(s: SessionState, saved: Saved, today: string, seed: SeedSource): Step | null {
  const kinds = s.history.map((h) => h.kind);
  const task = (kind: TaskKind, pattern: Pattern, difficulty = difficultyOf(s.recent)): TaskStep => ({
    type: 'task',
    phase: 'level',
    stake: false,
    task: makeTask(kind, pattern, saved, difficulty, seed()),
  });

  // Et nyt mønster testes straks efter introduktionen – med lette opgaver.
  for (const id of s.introduced) {
    const done = s.history.filter((h) => h.patternId === id).map((h) => h.kind);
    const kind = LEVEL_KINDS.find((k) => !done.includes(k) && allowsKind(kinds, k));
    if (kind) return task(kind, patternById(id), 'easy');
  }

  const fresh = nextNewPattern(saved, today);
  if (fresh) return { type: 'intro', patternId: fresh.id };

  const pool = levelPool(saved);
  if (pool.length === 0) return null;
  const kind = LEVEL_KINDS.find((k) => allowsKind(kinds, k))!;
  const due = dueItemKeys(saved, today)
    .map(splitItemKey)
    .find((k) => KIND_OF[k.skill] === kind && pool.some((p) => p.id === k.patternId));
  if (due) return task(kind, patternById(due.patternId));
  const last = s.history.at(-1)?.patternId;
  const choices = pool.length > 1 ? pool.filter((p) => p.id !== last) : pool;
  return task(kind, choices[mulberry32(seed()).int(choices.length)]);
}

const pairOf = (task: HigherLowerTask) => [task.a, task.b].sort().join('|');

/** Lynrunde: højere/lavere mellem mønstrene på de oplåste niveauer. */
function lightningStep(s: SessionState, saved: Saved, seed: SeedSource): TaskStep {
  const pool = unlockedPatterns(saved);
  const difficulty = difficultyOf(s.recent);
  let task = makeHigherLowerTask(seed(), null, pool, difficulty);
  for (let i = 0; i < 5 && pairOf(task) === s.lastPair; i++) {
    task = makeHigherLowerTask(seed(), null, pool, difficulty);
  }
  return { type: 'task', phase: 'lightning', stake: false, task };
}

function issue(state: SessionState, step: Step): { state: SessionState; step: Step } {
  if (step.type !== 'task') return { state, step };
  const entry = { kind: step.task.kind, patternId: step.task.patternId };
  return { state: { ...state, history: [...state.history, entry] }, step };
}

/**
 * Næste skridt i sessionen. Timeren er blød: faserne skifter kun mellem opgaverne.
 * Repetition (højst 60 s) → niveauøvelse → lynrunde (60 s) → gentagelser → status.
 */
export function nextStep(
  state: SessionState,
  saved: Saved,
  now: number,
  seed: SeedSource,
): { state: SessionState; step: Step } {
  const today = dayOf(now, saved.settings.dayStartsAtHour);
  const elapsed = now - state.startedAt;
  let s = state;
  if (s.phase === 'review') {
    const step = elapsed < REVIEW_END ? reviewStep(s, saved, today, seed) : null;
    if (step) return issue(s, step);
    s = { ...s, phase: 'level' };
  }
  if (s.phase === 'level') {
    const step = elapsed < LEVEL_END ? levelStep(s, saved, today, seed) : null;
    if (step) return issue(s, step);
    s = { ...s, phase: 'lightning', lightningStartedAt: now };
  }
  if (s.phase === 'lightning') {
    if (now - (s.lightningStartedAt ?? now) < PHASE_MS.lightning) {
      const step = lightningStep(s, saved, seed);
      return { state: { ...s, lastPair: pairOf(step.task as HigherLowerTask) }, step };
    }
    s = { ...s, phase: 'repeat', lightningEndedAt: now };
  }
  if (s.phase === 'repeat') {
    const [first, ...rest] = s.repeat;
    if (first) return { state: { ...s, repeat: rest }, step: first };
    s = { ...s, phase: 'status' };
  }
  return { state: s, step: { type: 'status' } };
}

/** Brugeren har set introduktionen af et nyt mønster: dets emner oprettes. */
export function introducePattern(
  state: SessionState,
  saved: Saved,
  patternId: string,
  now: number,
): { state: SessionState; saved: Saved } {
  const today = dayOf(now, saved.settings.dayStartsAtHour);
  return {
    state: { ...state, introduced: [...state.introduced, patternId] },
    saved: introduce(saved, patternId, today),
  };
}

export function scoreAnswer(task: ModeTask, answer: Answer): 0 | 0.5 | 1 {
  if (task.kind === 'higher-lower' && answer.kind === 'higher-lower') {
    return checkHigherLower(task, answer.choice) ? 1 : 0;
  }
  if (task.kind === 'complete' && answer.kind === 'complete') {
    return scoreComplete(task, answer.patterns);
  }
  throw new Error('Svaret passer ikke til opgaven');
}

/** Emnerne, et svar flytter. Højere/lavere rammer begge mønstre (parreglen). */
function itemKeysOf(task: ModeTask): string[] {
  return task.kind === 'higher-lower'
    ? [itemKey(task.a, 'compare'), itemKey(task.b, 'compare')]
    : [itemKey(task.patternId, 'complete')];
}

export interface Feedback {
  score: 0 | 0.5 | 1;
  xp: number;
  fast: boolean;
  ms: number;
  /** Rigtige i træk efter svaret. */
  combo: number;
}

export function submitAnswer(
  state: SessionState,
  saved: Saved,
  step: TaskStep,
  answer: Answer,
  timing: { shownAt: number; answeredAt: number },
  stake?: Stake,
): { state: SessionState; saved: Saved; feedback: Feedback } {
  const { task, phase } = step;
  const score = scoreAnswer(task, answer);
  const ok = score === 1;
  const ms = Math.max(0, timing.answeredAt - timing.shownAt);
  const fast = ms < saved.settings.fastMs[SKILL_OF[task.kind]];
  const today = dayOf(timing.answeredAt, saved.settings.dayStartsAtHour);
  const xp = answerXp({
    score,
    fast,
    levelAccuracy: levelAccuracy(saved, patternById(task.patternId).grade),
    comboBefore: state.combo,
    stake,
  });

  // Halv score i fuldfør behandles som rigtigt men langsomt: emnet bliver stående.
  const outcome: Outcome = score === 0 ? 'wrong' : ok && fast ? 'fast' : 'slow';
  // Lynrunden skriver ikke i loggen og flytter kun emner ved fejl.
  const lightning = phase === 'lightning';
  const entry: LogEntry | undefined = lightning
    ? undefined
    : { t: timing.answeredAt, ok, ms, ...(stake ? { sure: stake === 'sure' } : {}) };
  const items = { ...saved.items };
  for (const key of itemKeysOf(task)) {
    const item = items[key];
    if (item && !(lightning && outcome !== 'wrong')) items[key] = review(item, outcome, today, entry);
  }

  const combo = ok ? state.combo + 1 : 0;
  const next: SessionState = {
    ...state,
    combo,
    correct: state.correct + (ok ? 1 : 0),
    total: state.total + 1,
    xp: state.xp + xp,
    lightning: lightning
      ? { correct: state.lightning.correct + (ok ? 1 : 0), total: state.lightning.total + 1 }
      : state.lightning,
    recent: pushRecent(state.recent, ok),
    repeat:
      stake === 'sure' && !ok ? [...state.repeat, { ...step, phase: 'repeat', stake: false }] : state.repeat,
  };
  return {
    state: next,
    saved: { ...saved, items, xp: addXp(saved.xp, xp) },
    feedback: { score, xp, fast, ms, combo },
  };
}

/** Sessionen er gennemført: dagen tæller i streaken, og sessionen gemmes. */
export function finishSession(state: SessionState, saved: Saved, now: number): Saved {
  const today = dayOf(now, saved.settings.dayStartsAtHour);
  const lightningMs =
    state.lightningStartedAt === undefined ? 0 : (state.lightningEndedAt ?? now) - state.lightningStartedAt;
  const record = {
    day: today,
    ms: now - state.startedAt,
    correct: state.correct,
    total: state.total,
    cpm: correctPerMinute(state.lightning.correct, lightningMs),
  };
  return { ...saved, streak: completeDay(saved.streak, today), sessions: [...saved.sessions, record] };
}

/** Hvad der venter i morgen: forfaldne emner og nye mønstre. */
export function outlook(saved: Saved, now: number): { due: number; fresh: number } {
  const tomorrow = addDays(dayOf(now, saved.settings.dayStartsAtHour), 1);
  return { due: dueItemKeys(saved, tomorrow).length, fresh: newPatternsWaiting(saved) };
}
