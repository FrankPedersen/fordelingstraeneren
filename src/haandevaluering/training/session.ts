import { dayOf } from '../../engine/dates';
import { mulberry32, type Rng } from '../../engine/rng';
import { completeDay } from '../../engine/streak';
import { addXp } from '../../engine/xp';
import { exercisesFor, makeTask, type Exercise, type HandTask } from '../model/generator';
import { ANSWER_LOG_SIZE, type HeAnswerEntry, type HeSaved } from '../storage';
import { DECK_FAST_MS, deckCorrect, deckTask, reviewCard, warmupQueue, type DeckTask } from './deck';
import { nextLevel, pushAccuracy } from './progression';
import { grade, XP, type Graded, type HandAnswer } from './scoring';

/**
 * Håndevalueringens session på 5 minutter (SPEC-haandevaluering.md, Session, scoring og data): opvarmning med
 * nøgletal og kortfarvepoint pr. mønster (45 s), lynrunde med honnørpoint (45 s), niveauopgaver (150 s) og status
 * (30 s). Timeren er blød: faserne skifter kun mellem opgaverne.
 */
export const HE_PHASE_MS = { warmup: 45_000, lightning: 45_000, level: 150_000, status: 30_000 } as const;

export type HePhase = keyof typeof HE_PHASE_MS;

export type HeStep =
  | { kind: 'deck'; task: DeckTask }
  | { kind: 'task'; phase: 'lightning' | 'level'; task: HandTask }
  | { kind: 'status' };

export interface HeSession {
  seed: number;
  started: number;
  phase: HePhase;
  /** Hvornår den aktuelle fase startede. */
  phaseStarted: number;
  /** Opvarmningens kort, der endnu ikke er stillet. */
  queue: string[];
  /** Antal trin indtil nu; giver hvert trin sit eget seed. */
  count: number;
  /** Den seneste øvelse i niveaufasen, så den samme ikke kommer to gange i træk. */
  lastExercise?: Exercise;
  xp: number;
  correct: number;
  total: number;
  step: HeStep | null;
  /** Hvornår det aktuelle trin blev vist. */
  shownAt: number;
}

const todayOf = (saved: HeSaved, now: number) => dayOf(now, saved.settings.dayStartsAtHour);

export function startHeSession(saved: HeSaved, now: number, seed: number): HeSession {
  return {
    seed,
    started: now,
    phase: 'warmup',
    phaseStarted: now,
    queue: warmupQueue(saved.items, todayOf(saved, now)),
    count: 0,
    xp: 0,
    correct: 0,
    total: 0,
    step: null,
    shownAt: now,
  };
}

function rngFor(s: HeSession): Rng {
  return mulberry32((s.seed + Math.imul(s.count, 0x9e3779b1)) >>> 0);
}

function enter(s: HeSession, phase: HePhase, now: number): HeSession {
  return { ...s, phase, phaseStarted: now };
}

/** Registrerer sessionen og streaken, når status vises. */
function finish(s: HeSession, saved: HeSaved, now: number): HeSaved {
  const day = todayOf(saved, now);
  return {
    ...saved,
    streak: completeDay(saved.streak, day),
    sessions: [
      ...saved.sessions,
      { day, ms: Math.max(0, now - s.started), correct: s.correct, total: s.total, xp: s.xp, level: saved.level },
    ],
  };
}

/**
 * Næste trin. Faserne skifter, når deres tid er gået (opvarmningen også, når kortene er brugt), og status
 * registrerer sessionen. I niveaufasen kommer den samme øvelse ikke to gange i træk, når niveauet har flere.
 */
export function nextHeStep(session: HeSession, saved: HeSaved, now: number): { session: HeSession; saved: HeSaved } {
  let s = session;
  const elapsed = () => now - s.phaseStarted;
  if (s.phase === 'warmup' && (elapsed() >= HE_PHASE_MS.warmup || !s.queue.length)) s = enter(s, 'lightning', now);
  if (s.phase === 'lightning' && elapsed() >= HE_PHASE_MS.lightning) s = enter(s, 'level', now);
  if (s.phase === 'level' && elapsed() >= HE_PHASE_MS.level) {
    s = enter(s, 'status', now);
    return { session: { ...s, step: { kind: 'status' }, shownAt: now }, saved: finish(s, saved, now) };
  }
  if (s.phase === 'status') return { session: s, saved };

  const rng = rngFor(s);
  let step: HeStep;
  if (s.phase === 'warmup') step = { kind: 'deck', task: deckTask(s.queue[0], rng) };
  else if (s.phase === 'lightning') step = { kind: 'task', phase: 'lightning', task: makeTask('honors', rng.uint32()) };
  else {
    const all = exercisesFor(saved.level);
    const choices = all.length > 1 ? all.filter((e) => e !== s.lastExercise) : all;
    const exercise = choices[rng.int(choices.length)];
    step = { kind: 'task', phase: 'level', task: makeTask(exercise, rng.uint32()) };
    s = { ...s, lastExercise: exercise };
  }
  return { session: { ...s, step, count: s.count + 1, shownAt: now }, saved };
}

/** Svar på et kort i opvarmningen: Leitner-bunken flyttes, og XP gives efter lynrundens tidsgrænse. */
export function answerDeck(
  s: HeSession,
  saved: HeSaved,
  answer: number,
  now: number,
): { session: HeSession; saved: HeSaved; ok: boolean; xp: number } {
  if (s.step?.kind !== 'deck') throw new Error('Intet kort at svare på');
  const task = s.step.task;
  const ms = Math.max(0, now - s.shownAt);
  const ok = deckCorrect(task, answer);
  const xp = !ok ? XP.wrong : ms <= DECK_FAST_MS ? XP.right : XP.slow;
  const items = reviewCard(saved.items, task.key, ok, ms, todayOf(saved, now), now);
  return {
    session: { ...s, queue: s.queue.slice(1), xp: s.xp + xp, correct: s.correct + (ok ? 1 : 0), total: s.total + 1, step: null },
    saved: { ...saved, items, xp: addXp(saved.xp, xp) },
    ok,
    xp,
  };
}

/** Svar på en opgave: XP, træfsikkerhed pr. øvelse og svarloggen. Kun niveaufasens svar tilpasser niveauet. */
export function answerHeTask(
  s: HeSession,
  saved: HeSaved,
  answer: HandAnswer,
  now: number,
): { session: HeSession; saved: HeSaved; graded: Graded } {
  if (s.step?.kind !== 'task') throw new Error('Ingen opgave at svare på');
  const { task, phase } = s.step;
  const ms = Math.max(0, now - s.shownAt);
  const graded = grade(task, answer, ms);
  const entry: HeAnswerEntry = {
    day: todayOf(saved, now),
    exercise: task.exercise,
    level: saved.level,
    score: graded.score,
    ms,
    seed: task.seed,
    phase,
  };
  let next: HeSaved = {
    ...saved,
    xp: addXp(saved.xp, graded.xp),
    accuracy: { ...saved.accuracy, [task.exercise]: pushAccuracy(saved.accuracy[task.exercise], graded.score) },
    answers: [...(saved.answers ?? []), entry].slice(-ANSWER_LOG_SIZE),
  };
  if (phase === 'level') {
    const { level, log } = nextLevel({ level: saved.level, log: saved.levelLog }, graded.score);
    next = { ...next, level, levelLog: log };
  }
  return {
    session: { ...s, xp: s.xp + graded.xp, correct: s.correct + graded.score, total: s.total + 1, step: null },
    saved: next,
    graded,
  };
}
