import { dayOf } from '../../engine/dates';
import { mulberry32, type Rng } from '../../engine/rng';
import { completeDay } from '../../engine/streak';
import { addXp } from '../../engine/xp';
import { makeTask, type Exercise, type PointTask } from '../model/generator';
import { ANSWER_LOG_SIZE, type PrAnswerEntry, type PrSaved } from '../storage';
import { DECK_FAST_MS, deckCorrect, deckTask, reviewCard, warmupQueue, type DeckAnswer, type DeckTask } from './deck';
import { nextLevel, pushAccuracy } from './progression';
import { grade, nextRunningMs, XP, type Graded, type PointAnswer } from './scoring';

/**
 * Pointregnskabets egen session på 5 minutter (SPEC-pointregnskab.md, Session): opvarmning med blokke og
 * intervalkort (45 s), regnestykket som lynrunde (45 s), niveau med 3–4 opgaver af type 2–5 (150 s) og status (30 s).
 * Timeren er blød: faserne skifter kun mellem opgaverne. Hver 7. session er ugens boss med dobbelt XP.
 */
export const PR_PHASE_MS = { warmup: 45_000, sum: 45_000, level: 150_000, status: 30_000 } as const;

export type PrPhase = keyof typeof PR_PHASE_MS;

/** Niveaufasen har 3–4 opgaver: den slutter efter 4, eller efter 3, når tiden er gået. */
export const LEVEL_TASKS = { min: 3, max: 4 } as const;

/** Øvelserne i niveaufasen (type 2–5). Ugens boss har Fuldt regnskab (type 6) i stedet. */
export const LEVEL_EXERCISES: readonly Exercise[] = ['running', 'can', 'who', 'finesse'];

export const BOSS_EVERY = 7;

export type PrStep =
  | { kind: 'deck'; task: DeckTask }
  | { kind: 'task'; phase: 'sum' | 'level'; task: PointTask }
  | { kind: 'status' };

export interface PrSession {
  seed: number;
  started: number;
  phase: PrPhase;
  /** Hvornår den aktuelle fase startede. */
  phaseStarted: number;
  /** Ugens boss: hver 7. session, dobbelt XP. */
  boss: boolean;
  /** Opvarmningens kort, der endnu ikke er stillet. */
  queue: string[];
  /** Antal trin indtil nu; giver hvert trin sit eget seed. */
  count: number;
  levelTasks: number;
  /** Den seneste øvelse i niveaufasen, så den samme ikke kommer to gange i træk. */
  lastExercise?: Exercise;
  xp: number;
  /** Summen af scorerne (halvt rigtigt tæller 0,5). */
  correct: number;
  total: number;
  step: PrStep | null;
  /** Hvornår det aktuelle trin blev vist. */
  shownAt: number;
}

const todayOf = (saved: PrSaved, now: number) => dayOf(now, saved.settings.dayStartsAtHour);

/** Er den næste session ugens boss? Hver 7. session. */
export const isBossSession = (saved: PrSaved): boolean => (saved.sessions.length + 1) % BOSS_EVERY === 0;

export function startPrSession(saved: PrSaved, now: number, seed: number): PrSession {
  return {
    seed,
    started: now,
    phase: 'warmup',
    phaseStarted: now,
    boss: isBossSession(saved),
    queue: warmupQueue(saved.items, todayOf(saved, now)),
    count: 0,
    levelTasks: 0,
    xp: 0,
    correct: 0,
    total: 0,
    step: null,
    shownAt: now,
  };
}

function rngFor(s: PrSession): Rng {
  return mulberry32((s.seed + Math.imul(s.count, 0x9e3779b1)) >>> 0);
}

function enter(s: PrSession, phase: PrPhase, now: number): PrSession {
  return { ...s, phase, phaseStarted: now };
}

/** Registrerer sessionen og streaken, når status vises. */
function finish(s: PrSession, saved: PrSaved, now: number): PrSaved {
  const day = todayOf(saved, now);
  return {
    ...saved,
    streak: completeDay(saved.streak, day),
    sessions: [
      ...saved.sessions,
      { day, ms: Math.max(0, now - s.started), correct: s.correct, total: s.total, xp: s.xp, level: saved.level, boss: s.boss },
    ],
  };
}

/**
 * Næste trin. Faserne skifter, når deres tid er gået (opvarmningen også, når kortene er brugt), og status
 * registrerer sessionen.
 */
export function nextPrStep(session: PrSession, saved: PrSaved, now: number): { session: PrSession; saved: PrSaved } {
  let s = session;
  const elapsed = () => now - s.phaseStarted;
  if (s.phase === 'warmup' && (elapsed() >= PR_PHASE_MS.warmup || !s.queue.length)) s = enter(s, 'sum', now);
  if (s.phase === 'sum' && elapsed() >= PR_PHASE_MS.sum) s = enter(s, 'level', now);
  if (
    s.phase === 'level' &&
    (s.levelTasks >= LEVEL_TASKS.max || (s.levelTasks >= LEVEL_TASKS.min && elapsed() >= PR_PHASE_MS.level))
  ) {
    s = enter(s, 'status', now);
    return { session: { ...s, step: { kind: 'status' }, shownAt: now }, saved: finish(s, saved, now) };
  }
  if (s.phase === 'status') return { session: s, saved };

  const rng = rngFor(s);
  let step: PrStep;
  if (s.phase === 'warmup') step = { kind: 'deck', task: deckTask(s.queue[0], rng) };
  else if (s.phase === 'sum') step = { kind: 'task', phase: 'sum', task: makeTask('sum', saved.level, rng.uint32()) };
  else {
    const choices = LEVEL_EXERCISES.filter((e) => e !== s.lastExercise);
    const exercise: Exercise = s.boss ? 'full' : choices[rng.int(choices.length)];
    step = { kind: 'task', phase: 'level', task: makeTask(exercise, saved.level, rng.uint32()) };
    s = { ...s, lastExercise: exercise };
  }
  return { session: { ...s, step, count: s.count + 1, shownAt: now }, saved };
}

/**
 * Spørgsmålet vises nu. I løbende tælling og fra niveau 4 vises honnørerne først én ad gangen, og tiden til svaret
 * regnes fra spørgsmålet.
 */
export function questionShown(s: PrSession, now: number): PrSession {
  return { ...s, shownAt: now };
}

/** Svar på et kort i opvarmningen: Leitner-bunken flyttes, og XP gives efter regnestykkets tidsgrænse. */
export function answerDeck(
  s: PrSession,
  saved: PrSaved,
  answer: DeckAnswer,
  now: number,
): { session: PrSession; saved: PrSaved; ok: boolean; xp: number } {
  if (s.step?.kind !== 'deck') throw new Error('Intet kort at svare på');
  const task = s.step.task;
  const ms = Math.max(0, now - s.shownAt);
  const ok = deckCorrect(task, answer);
  const base = !ok ? XP.wrong : ms <= DECK_FAST_MS ? XP.right : XP.slow;
  const xp = s.boss ? 2 * base : base;
  const items = reviewCard(saved.items, task.key, ok, ms, todayOf(saved, now), now);
  return {
    session: { ...s, queue: s.queue.slice(1), xp: s.xp + xp, correct: s.correct + (ok ? 1 : 0), total: s.total + 1, step: null },
    saved: { ...saved, items, xp: addXp(saved.xp, xp) },
    ok,
    xp,
  };
}

/**
 * Svar på en opgave: XP, træfsikkerhed pr. øvelse, svarloggen og visningstiden i løbende tælling. Kun niveaufasens
 * svar tilpasser niveauet.
 */
export function answerPrTask(
  s: PrSession,
  saved: PrSaved,
  answer: PointAnswer,
  now: number,
): { session: PrSession; saved: PrSaved; graded: Graded } {
  if (s.step?.kind !== 'task') throw new Error('Ingen opgave at svare på');
  const { task, phase } = s.step;
  const ms = Math.max(0, now - s.shownAt);
  const graded = grade(task, answer, ms, s.boss);
  const entry: PrAnswerEntry = {
    day: todayOf(saved, now),
    exercise: task.exercise,
    level: task.level,
    score: graded.score,
    ms,
    ...(graded.overconfident ? { overconfident: true as const } : {}),
  };
  let next: PrSaved = {
    ...saved,
    xp: addXp(saved.xp, graded.xp),
    accuracy: { ...saved.accuracy, [task.exercise]: pushAccuracy(saved.accuracy[task.exercise], graded.score) },
    answers: [...(saved.answers ?? []), entry].slice(-ANSWER_LOG_SIZE),
  };
  if (task.exercise === 'running') next = { ...next, runningMs: nextRunningMs(saved.runningMs, graded.result) };
  if (phase === 'level') {
    const { level, log } = nextLevel({ level: saved.level, log: saved.levelLog }, graded.score);
    next = { ...next, level, levelLog: log };
  }
  return {
    session: {
      ...s,
      xp: s.xp + graded.xp,
      correct: s.correct + graded.score,
      total: s.total + 1,
      levelTasks: s.levelTasks + (phase === 'level' ? 1 : 0),
      step: null,
    },
    saved: next,
    graded,
  };
}
