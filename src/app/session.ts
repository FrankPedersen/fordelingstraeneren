import { addDays, dayOf, daysBetween } from '../engine/dates';
import { review, type LogEntry, type Outcome, type Support } from '../engine/leitner';
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
import { HINT_COST, supportPlan } from '../memory/support';
import { makeCompleteTask, scoreComplete, type CompleteTask } from '../modes/complete/task';
import { CLUB_PATTERNS, checkEstimate, makeEstimateTask, type EstimateTask } from '../modes/estimate/task';
import { makeSudoku, type SudokuTask } from '../modes/sudoku/task';
import {
  checkHigherLower,
  makeHigherLowerTask,
  type HigherLowerAnswer,
  type HigherLowerTask,
} from '../modes/higherLower/task';
import { checkPalace, makePalaceTask, type PalaceAnswer, type PalaceTask } from '../modes/palace/task';
import {
  READ_MS,
  checkRead,
  makeRandomReadTask,
  makeTargetedReadTask,
  nextReadMs,
  type ReadTask,
} from '../modes/read/task';
import { isRareFind, registerHand } from './album';
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
  skillsOf,
  splitItemKey,
  unlockedPatterns,
} from './progression';

/** review = repetition, level = niveauøvelse, lightning = lynrunde, sudoku = 13-sudoku, repeat = hyperkorrektion. */
export type Phase = 'review' | 'level' | 'lightning' | 'sudoku' | 'repeat' | 'status';

export type ModeTask = HigherLowerTask | CompleteTask | PalaceTask | ReadTask | EstimateTask;
export type TaskKind = ModeTask['kind'];

export type Answer =
  | { kind: 'higher-lower'; choice: HigherLowerAnswer }
  | { kind: 'complete'; patterns: string[] }
  | { kind: 'palace'; answer: PalaceAnswer }
  | { kind: 'read'; lengths: number[] }
  | { kind: 'estimate'; count: number };

export interface TaskStep {
  type: 'task';
  phase: Phase;
  /** Repetitionsemner afsluttes med "Sikker" eller "Gæt". */
  stake: boolean;
  /** Støtteniveauet for opgavens emne, da opgaven blev stillet. */
  support: Support;
  task: ModeTask;
}

export type Step =
  | TaskStep
  | { type: 'intro'; patternId: string }
  /** Emnet præsenteres (station, mønster, billede) og testes straks. */
  | { type: 'present'; patternId: string; next: TaskStep }
  /** Én 13-sudoku; ugens boss får en svær opgave med dobbelt XP. */
  | { type: 'sudoku'; task: SudokuTask }
  | { type: 'status' };

/** Klubaften-estimat træner hyppigheden og hører derfor til sammenligning ligesom højere/lavere. */
const SKILL_OF: Record<TaskKind, Skill> = {
  'higher-lower': 'compare',
  estimate: 'compare',
  complete: 'complete',
  palace: 'rank',
  read: 'read',
};

const KIND_OF: Partial<Record<Skill, TaskKind>> = {
  compare: 'higher-lower',
  complete: 'complete',
  rank: 'palace',
  read: 'read',
};

/** Niveauøvelserne: Fuldfør mønsteret og Paladsvandring. */
const LEVEL_KINDS: readonly TaskKind[] = ['complete', 'palace'];

/**
 * Et nyt mønster øves straks i disse øvelser, i denne rækkefølge. Aflæsningen venter til
 * repetitionen, så lynrunden ikke er eneste sted, mønstret ses i en hånd.
 */
const PRACTICE_KINDS: readonly TaskKind[] = ['complete', 'palace', 'higher-lower'];

const CLUB_IDS = new Set(CLUB_PATTERNS.map((p) => p.id));

/** Lynrunden skifter fra dag til dag mellem højere/lavere og Lynaflæsning. */
export function lightningKind(day: string): 'higher-lower' | 'read' {
  return Math.abs(daysBetween('2026-01-01', day)) % 2 === 0 ? 'higher-lower' : 'read';
}

/** Repetitionen slutter efter 60 s. */
export const REVIEW_END = PHASE_MS.review;

/** Niveauøvelsen slutter efter 60 + 90 s. */
export const LEVEL_END = PHASE_MS.review + PHASE_MS.level;

/** 13-sudokuen springes over, hvis lynrunden slutter så sent, at der kun er tid til status. */
export const SUDOKU_DEADLINE = 300_000 - PHASE_MS.status;

/** Hver 7. session er ugens boss. */
export const BOSS_EVERY = 7;

export interface SessionState {
  startedAt: number;
  phase: Phase;
  lightningStartedAt?: number;
  lightningEndedAt?: number;
  /** Opgaverne uden for lynrunden, til interleaving og variation. */
  history: { kind: TaskKind; patternId: string }[];
  /** Mønstre introduceret i denne session. */
  introduced: string[];
  /** Mønstre, der er præsenteret i denne session. */
  presented: string[];
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
  /** Ugens boss: hver 7. session er sudokuen svær og giver dobbelt XP. */
  boss: boolean;
  sudokuShown: boolean;
  /** Rigtige og stillede opgaver pr. grad uden for lynrunden, til kurverne. */
  grades: Record<string, [number, number]>;
}

/** Giver et nyt seed til hver opgave, så den kan genskabes. */
export type SeedSource = () => number;

export function startSession(saved: Saved, now: number): SessionState {
  return {
    startedAt: now,
    phase: 'review',
    history: [],
    introduced: [],
    presented: [],
    combo: 0,
    correct: 0,
    total: 0,
    xp: 0,
    lightning: { correct: 0, total: 0 },
    repeat: [],
    recent: recentFromLogs(saved),
    boss: (saved.sessions.length + 1) % BOSS_EVERY === 0,
    sudokuShown: false,
    grades: {},
  };
}

function kindsOf(pattern: Pattern): TaskKind[] {
  return skillsOf(pattern).flatMap((skill) => KIND_OF[skill] ?? []);
}

function makeTask(
  kind: TaskKind,
  pattern: Pattern,
  saved: Saved,
  difficulty: Difficulty,
  seed: number,
): ModeTask {
  switch (kind) {
    case 'higher-lower':
      return makeHigherLowerTask(seed, pattern, unlockedPatterns(saved), difficulty);
    case 'complete':
      return makeCompleteTask(seed, pattern, difficulty);
    case 'palace':
      return makePalaceTask(seed, pattern, difficulty);
    case 'read':
      return makeTargetedReadTask(seed, pattern, saved.readMs ?? READ_MS.start);
    case 'estimate':
      return makeEstimateTask(seed, pattern);
  }
}

/** Støtteniveauet sættes, når opgaven stilles (se issue). */
const taskStep = (phase: Phase, stake: boolean, task: ModeTask): TaskStep => ({
  type: 'task',
  phase,
  stake,
  support: 0,
  task,
});

/** Repetition: forfaldne emner, blandet på tværs af øvelserne. */
function reviewStep(s: SessionState, saved: Saved, today: string, seed: SeedSource): TaskStep | null {
  const due = dueItemKeys(saved, today);
  if (due.length === 0) return null;
  const kinds = s.history.map((h) => h.kind);
  const difficulty = difficultyOf(s.recent);
  const rng = mulberry32(seed());
  // Laveste kasse og ældste forfald først; emner, der står lige, blandes.
  const order = shuffle([...due], rng).sort(
    (a, b) =>
      saved.items[a].box - saved.items[b].box || saved.items[a].due.localeCompare(saved.items[b].due),
  );
  // Sammenligning øves som højere/lavere eller, for klubaftenens mønstre, som Klubaften-estimat.
  const choices = order.map((key) => {
    const { patternId, skill } = splitItemKey(key);
    const estimate = skill === 'compare' && CLUB_IDS.has(patternId) && rng.int(2) === 0;
    return { key, kind: estimate ? 'estimate' : KIND_OF[skill]! };
  });
  const pick = choices.find((c) => allowsKind(kinds, c.kind));
  if (pick) {
    const pattern = patternById(splitItemKey(pick.key).patternId);
    return taskStep('review', true, makeTask(pick.kind, pattern, saved, difficulty, seed()));
  }
  // Kun én opgavetype er forfalden, og den har været der to gange i træk: indskyd en anden øvelse.
  const pattern = patternById(splitItemKey(order[0]).patternId);
  const other = kindsOf(pattern).find((k) => allowsKind(kinds, k)) ?? 'complete';
  return taskStep('review', false, makeTask(other, pattern, saved, difficulty, seed()));
}

/** Mønstrene på det aktuelle niveau, der er introduceret (ellers alle introducerede). */
function levelPool(saved: Saved): Pattern[] {
  const grade = currentGrade(saved);
  const introduced = introducedPatterns(saved);
  const here = introduced.filter((p) => p.grade === grade);
  return here.length > 0 ? here : introduced;
}

/** Niveauøvelse: nye mønstre introduceres og øves straks; derefter Fuldfør og Paladsvandring på niveauet. */
function levelStep(s: SessionState, saved: Saved, today: string, seed: SeedSource): Step | null {
  const kinds = s.history.map((h) => h.kind);
  const task = (kind: TaskKind, pattern: Pattern, difficulty = difficultyOf(s.recent)) =>
    taskStep('level', false, makeTask(kind, pattern, saved, difficulty, seed()));

  // Et nyt mønster testes straks i hver af sine øvelser – med lette opgaver.
  for (const id of s.introduced) {
    const pattern = patternById(id);
    const done = s.history.filter((h) => h.patternId === id).map((h) => h.kind);
    const kind = PRACTICE_KINDS.find(
      (k) => kindsOf(pattern).includes(k) && !done.includes(k) && allowsKind(kinds, k),
    );
    if (kind) return task(kind, pattern, 'easy');
  }

  const fresh = nextNewPattern(saved, today);
  if (fresh) return { type: 'intro', patternId: fresh.id };

  const pool = levelPool(saved);
  if (pool.length === 0) return null;
  const usable = (kind: TaskKind) => pool.filter((p) => kindsOf(p).includes(kind));

  // Forfaldne emner i niveauøvelserne går først.
  const due = dueItemKeys(saved, today)
    .map(splitItemKey)
    .find((k) => {
      const kind = KIND_OF[k.skill];
      return (
        kind !== undefined &&
        LEVEL_KINDS.includes(kind) &&
        allowsKind(kinds, kind) &&
        pool.some((p) => p.id === k.patternId)
      );
    });
  if (due) return task(KIND_OF[due.skill]!, patternById(due.patternId));

  // Ellers skiftes der mellem Fuldfør og Paladsvandring.
  const lastLevel = [...s.history].reverse().find((h) => LEVEL_KINDS.includes(h.kind))?.kind;
  const options = LEVEL_KINDS.filter((k) => usable(k).length > 0 && allowsKind(kinds, k));
  const kind = options.find((k) => k !== lastLevel) ?? options[0] ?? 'higher-lower';
  const candidates = kind === 'higher-lower' ? pool : usable(kind);
  const last = s.history.at(-1)?.patternId;
  const choices = candidates.length > 1 ? candidates.filter((p) => p.id !== last) : candidates;
  return task(kind, choices[mulberry32(seed()).int(choices.length)]);
}

const pairOf = (task: HigherLowerTask) => [task.a, task.b].sort().join('|');

/**
 * Lynrunde: højere/lavere mellem mønstrene på de oplåste niveauer eller – hveranden dag –
 * Lynaflæsning af helt tilfældige hænder.
 */
function lightningStep(s: SessionState, saved: Saved, today: string, seed: SeedSource): TaskStep {
  if (lightningKind(today) === 'read') {
    return taskStep('lightning', false, makeRandomReadTask(seed(), saved.readMs ?? READ_MS.start));
  }
  const pool = unlockedPatterns(saved);
  const difficulty = difficultyOf(s.recent);
  let task = makeHigherLowerTask(seed(), null, pool, difficulty);
  for (let i = 0; i < 5 && pairOf(task) === s.lastPair; i++) {
    task = makeHigherLowerTask(seed(), null, pool, difficulty);
  }
  return taskStep('lightning', false, task);
}

function supportOf(saved: Saved, task: ModeTask): Support {
  return saved.items[itemKey(task.patternId, SKILL_OF[task.kind])]?.support ?? 3;
}

/**
 * Stiller opgaven: sætter emnets støtteniveau og præsenterer emnet først, hvis niveauet er 3
 * (højst én gang pr. mønster pr. session). Lynrunden kører uden støtte.
 */
function issue(state: SessionState, saved: Saved, step: Step): { state: SessionState; step: Step } {
  if (step.type !== 'task') return { state, step };
  const lightning = step.phase === 'lightning';
  const ready: TaskStep = { ...step, support: lightning ? 0 : supportOf(saved, step.task) };
  const id = step.task.patternId;
  const history =
    lightning || step.phase === 'repeat'
      ? state.history
      : [...state.history, { kind: step.task.kind, patternId: id }];
  if (supportPlan(ready.support).present && !state.presented.includes(id)) {
    return {
      state: { ...state, history, presented: [...state.presented, id] },
      step: { type: 'present', patternId: id, next: ready },
    };
  }
  return { state: { ...state, history }, step: ready };
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
    if (step) return issue(s, saved, step);
    s = { ...s, phase: 'level' };
  }
  if (s.phase === 'level') {
    const step = elapsed < LEVEL_END ? levelStep(s, saved, today, seed) : null;
    if (step) return issue(s, saved, step);
    s = { ...s, phase: 'lightning', lightningStartedAt: now };
  }
  if (s.phase === 'lightning') {
    if (now - (s.lightningStartedAt ?? now) < PHASE_MS.lightning) {
      const step = lightningStep(s, saved, today, seed);
      const lastPair = step.task.kind === 'higher-lower' ? pairOf(step.task) : undefined;
      return issue({ ...s, lastPair }, saved, step);
    }
    s = { ...s, phase: 'sudoku', lightningEndedAt: now };
  }
  if (s.phase === 'sudoku') {
    if (!s.sudokuShown && elapsed < SUDOKU_DEADLINE) {
      return { state: { ...s, sudokuShown: true }, step: { type: 'sudoku', task: makeSudoku(seed(), s.boss) } };
    }
    s = { ...s, phase: 'repeat' };
  }
  if (s.phase === 'repeat') {
    const [first, ...rest] = s.repeat;
    if (first) return issue({ ...s, repeat: rest }, saved, first);
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
    state: {
      ...state,
      introduced: [...state.introduced, patternId],
      presented: [...state.presented, patternId],
    },
    saved: introduce(saved, patternId, today),
  };
}

/** Sudokuen er løst (eller opgivet): pointene lægges til XP. */
export function completeSudoku(
  state: SessionState,
  saved: Saved,
  points: number,
): { state: SessionState; saved: Saved } {
  return { state: { ...state, xp: state.xp + points }, saved: { ...saved, xp: addXp(saved.xp, points) } };
}

export function scoreAnswer(task: ModeTask, answer: Answer): 0 | 0.5 | 1 {
  if (task.kind === 'higher-lower' && answer.kind === 'higher-lower') {
    return checkHigherLower(task, answer.choice) ? 1 : 0;
  }
  if (task.kind === 'complete' && answer.kind === 'complete') {
    return scoreComplete(task, answer.patterns);
  }
  if (task.kind === 'palace' && answer.kind === 'palace') {
    return checkPalace(task, answer.answer) ? 1 : 0;
  }
  if (task.kind === 'read' && answer.kind === 'read') {
    return checkRead(task, answer.lengths) ? 1 : 0;
  }
  if (task.kind === 'estimate' && answer.kind === 'estimate') {
    return checkEstimate(task, answer.count) ? 1 : 0;
  }
  throw new Error('Svaret passer ikke til opgaven');
}

/** Emnerne, et svar flytter. Højere/lavere rammer begge mønstre (parreglen). */
function itemKeysOf(task: ModeTask): string[] {
  if (task.kind === 'higher-lower') return [itemKey(task.a, 'compare'), itemKey(task.b, 'compare')];
  return [itemKey(task.patternId, SKILL_OF[task.kind])];
}

export interface Feedback {
  score: 0 | 0.5 | 1;
  xp: number;
  /** XP trukket for at åbne ledetråden. */
  hintCost: number;
  fast: boolean;
  ms: number;
  /** Rigtige i træk efter svaret. */
  combo: number;
  /** En tilfældig hånd i albummet: første gang mønstret samles, og om det er et sjældent fund. */
  album?: { patternId: string; first: boolean; rare: boolean };
}

export interface AnswerOptions {
  stake?: Stake;
  /** Brugeren åbnede ledetråden før svaret. */
  hint?: boolean;
}

export function submitAnswer(
  state: SessionState,
  saved: Saved,
  step: TaskStep,
  answer: Answer,
  timing: { shownAt: number; answeredAt: number },
  { stake, hint = false }: AnswerOptions = {},
): { state: SessionState; saved: Saved; feedback: Feedback } {
  const { task, phase } = step;
  const score = scoreAnswer(task, answer);
  const ok = score === 1;
  const ms = Math.max(0, timing.answeredAt - timing.shownAt);
  const fast = ms < saved.settings.fastMs[SKILL_OF[task.kind]];
  const today = dayOf(timing.answeredAt, saved.settings.dayStartsAtHour);
  const hintCost = hint && supportPlan(step.support).hint === 'paid' ? HINT_COST : 0;
  const xp =
    answerXp({
      score,
      fast,
      levelAccuracy: levelAccuracy(saved, patternById(task.patternId).grade),
      comboBefore: state.combo,
      stake,
    }) - hintCost;

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

  let after: Saved = { ...saved, items, xp: addXp(saved.xp, xp) };
  let album: Feedback['album'];
  if (task.kind === 'read') {
    // t tilpasses kun, når hånden vises i t ms; ellers bestemmer brugeren selv visningstiden.
    if (saved.settings.readShow === 'timed') after.readMs = nextReadMs(saved.readMs ?? READ_MS.start, ok);
    // Hver tilfældig hånd registreres i albummet.
    if (task.random) {
      const registered = registerHand(after, task.patternId, today);
      after = registered.saved;
      album = { patternId: task.patternId, first: registered.first, rare: isRareFind(patternById(task.patternId)) };
    }
  }

  const combo = ok ? state.combo + 1 : 0;
  const grade = patternById(task.patternId).grade;
  const [gradeCorrect, gradeTotal] = state.grades[grade] ?? [0, 0];
  const next: SessionState = {
    ...state,
    grades: lightning ? state.grades : { ...state.grades, [grade]: [gradeCorrect + (ok ? 1 : 0), gradeTotal + 1] },
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
    saved: after,
    feedback: { score, xp, hintCost, fast, ms, combo, ...(album ? { album } : {}) },
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
    ...(Object.keys(state.grades).length > 0 ? { grades: state.grades } : {}),
  };
  return { ...saved, streak: completeDay(saved.streak, today), sessions: [...saved.sessions, record] };
}

/** Hvad der venter i morgen: forfaldne emner og nye mønstre. */
export function outlook(saved: Saved, now: number): { due: number; fresh: number } {
  const tomorrow = addDays(dayOf(now, saved.settings.dayStartsAtHour), 1);
  return { due: dueItemKeys(saved, tomorrow).length, fresh: newPatternsWaiting(saved) };
}
