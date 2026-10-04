import { dayOf } from '../../engine/dates';
import { review, type Outcome } from '../../engine/leitner';
import { mulberry32, type Rng } from '../../engine/rng';
import { allowsKind } from '../../engine/session';
import { completeDay } from '../../engine/streak';
import { addXp, answerXp } from '../../engine/xp';
import type { BankItem } from '../analysis';
import type { FbSaved, TaskType } from '../storage';
import { dueItems, freshToday, introduce, parseItemKey } from './progression';
import { grade, itemKey, makeTask, outcomeOf, possibleTypes, type FbAnswer, type FbTask, type Graded } from './tasks';

/**
 * Farvebehandlingens daglige session på 5 minutter (SPEC-farvebehandling.md, Session, scoring og progression):
 * repetition (60 s), niveau (til 210 s), lynrunde (60 s) og status. Timeren er blød: faserne skifter kun mellem
 * opgaverne. Opbygningen følger fordelingssporets sessionsmotor uden at bruge den.
 */
export const FB_PHASE_MS = { repetition: 60_000, niveau: 150_000, lynrunde: 60_000, status: 30_000 } as const;

/** Repetitionen slutter efter 60 s. */
export const REPETITION_END = FB_PHASE_MS.repetition;

/** Niveauet slutter efter 60 + 150 s. */
export const NIVEAU_END = FB_PHASE_MS.repetition + FB_PHASE_MS.niveau;

/** Niveauet øver de senest introducerede kombinationer. */
export const LEVEL_COMBINATIONS = 4;

export type FbPhase = keyof typeof FB_PHASE_MS;

export type FbStep =
  | { kind: 'task'; phase: Exclude<FbPhase, 'status'>; task: FbTask }
  | { kind: 'intro'; combination: string }
  | { kind: 'status' };

export interface FbSession {
  seed: number;
  started: number;
  phase: FbPhase;
  lynrundeStarted?: number;
  /** Forfaldne emner, der endnu ikke er stillet. */
  due: string[];
  /** Kombinationer introduceret i denne session. */
  introduced: string[];
  /** Emner stillet i denne session uden for lynrunden. */
  asked: string[];
  /** Opgavetyperne uden for lynrunden, til interleaving. */
  history: TaskType[];
  /** Det seneste emne i lynrunden. */
  lastLightning?: string;
  /** Antal trin indtil nu; giver hvert trin sit eget seed. */
  count: number;
  /** Rigtige svar i træk. */
  combo: number;
  xp: number;
  /** Summen af scorerne (halvt rigtigt tæller 0,5). */
  correct: number;
  total: number;
  step: FbStep | null;
  /** Hvornår det aktuelle trin blev vist. */
  shownAt: number;
}

/** Opgavetypernes vægt, når motoren vælger. Spil den selv tager længst og kommer sjældnest. */
const WEIGHT: Partial<Record<TaskType, number>> = {
  'vælg-linjen': 4,
  chancen: 2,
  'linje-mod-linje': 2,
  'nyt-mål': 2,
  'hvad-nu': 2,
  'find-hullet': 2,
  optælling: 1,
  'spil-selv': 1,
};

const todayOf = (saved: FbSaved, now: number) => dayOf(now, saved.settings.dayStartsAtHour);

const inBank = (bank: readonly BankItem[], key: string) => bank.some((b) => b.combination.id === parseItemKey(key).id);

export function startFbSession(saved: FbSaved, bank: readonly BankItem[], now: number, seed: number): FbSession {
  return {
    seed,
    started: now,
    phase: 'repetition',
    due: dueItems(saved, todayOf(saved, now)).filter((key) => inBank(bank, key)),
    introduced: [],
    asked: [],
    history: [],
    count: 0,
    combo: 0,
    xp: 0,
    correct: 0,
    total: 0,
    step: null,
    shownAt: now,
  };
}

function rngFor(session: FbSession): Rng {
  return mulberry32((session.seed + Math.imul(session.count, 0x9e3779b1)) >>> 0);
}

/** Motoren vælger opgavetypen: vægtet tilfældigt blandt de mulige, højst to af samme type i træk. */
export function chooseType(item: BankItem, goal: number, history: readonly TaskType[], rng: Rng, only?: readonly TaskType[]): TaskType {
  const possible = possibleTypes(item, goal).filter((t) => (only ? only.includes(t) : WEIGHT[t] !== undefined));
  if (!possible.length) return 'chancen';
  const allowed = possible.filter((t) => allowsKind(history, t));
  const pool = allowed.length ? allowed : possible;
  const total = pool.reduce((s, t) => s + (WEIGHT[t] ?? 1), 0);
  let r = rng.next() * total;
  for (const t of pool) {
    r -= WEIGHT[t] ?? 1;
    if (r < 0) return t;
  }
  return pool[pool.length - 1];
}

const find = (bank: readonly BankItem[], id: string) => bank.find((b) => b.combination.id === id);

function taskFor(s: FbSession, bank: readonly BankItem[], key: string, only?: readonly TaskType[]): FbTask {
  const { id, goal } = parseItemKey(key);
  const item = find(bank, id)!;
  const rng = rngFor(s);
  return makeTask(chooseType(item, goal, s.history, rng, only), item, goal, rng);
}

/** Niveauets emner: alle mål for de senest introducerede kombinationer. */
export function levelPool(saved: FbSaved, bank: readonly BankItem[]): string[] {
  const recent = bank
    .filter((b) => b.combination.id in saved.introduced)
    .sort((a, b) => saved.introduced[b.combination.id].localeCompare(saved.introduced[a.combination.id]) || b.rank - a.rank)
    .slice(0, LEVEL_COMBINATIONS);
  return recent.flatMap((b) => b.combination.goals.map((g) => itemKey(b.combination.id, g))).filter((k) => k in saved.items);
}

/** Niveau: en ny kombination introduceres og øves straks i hvert mål; derefter de senest introducerede. */
function levelStep(s: FbSession, saved: FbSaved, bank: readonly BankItem[], now: number): FbStep | null {
  for (const id of s.introduced) {
    const key = find(bank, id)?.combination.goals.map((g) => itemKey(id, g)).find((k) => !s.asked.includes(k));
    if (key) return { kind: 'task', phase: 'niveau', task: taskFor(s, bank, key) };
  }
  const fresh = freshToday(saved, bank, todayOf(saved, now))[0];
  if (fresh) return { kind: 'intro', combination: fresh.combination.id };
  const pool = levelPool(saved, bank);
  if (!pool.length) return null;
  const last = s.asked[s.asked.length - 1];
  const choices = pool.length > 1 ? pool.filter((k) => k !== last) : pool;
  return { kind: 'task', phase: 'niveau', task: taskFor(s, bank, choices[rngFor(s).int(choices.length)]) };
}

/** Lynrunde: linje mod linje blandt alle introducerede emner, hvor det kan stilles. */
function lightningStep(s: FbSession, saved: FbSaved, bank: readonly BankItem[]): FbStep | null {
  const pool = Object.keys(saved.items).filter((key) => {
    const { id, goal } = parseItemKey(key);
    const item = find(bank, id);
    return item !== undefined && possibleTypes(item, goal).includes('linje-mod-linje');
  });
  if (!pool.length) return null;
  const choices = pool.length > 1 ? pool.filter((k) => k !== s.lastLightning) : pool;
  const key = choices[rngFor(s).int(choices.length)];
  return { kind: 'task', phase: 'lynrunde', task: taskFor(s, bank, key, ['linje-mod-linje']) };
}

/** Næste trin i sessionen. */
export function nextFbStep(session: FbSession, saved: FbSaved, bank: readonly BankItem[], now: number): FbSession {
  const elapsed = now - session.started;
  let s: FbSession = { ...session };
  let step: FbStep | null = null;
  if (s.phase === 'repetition') {
    if (elapsed < REPETITION_END && s.due.length) {
      const [key, ...rest] = s.due;
      s = { ...s, due: rest };
      step = { kind: 'task', phase: 'repetition', task: taskFor(s, bank, key) };
    } else s.phase = 'niveau';
  }
  if (!step && s.phase === 'niveau') {
    step = elapsed < NIVEAU_END ? levelStep(s, saved, bank, now) : null;
    if (!step) s = { ...s, phase: 'lynrunde', lynrundeStarted: now };
  }
  if (!step && s.phase === 'lynrunde') {
    step = now - (s.lynrundeStarted ?? now) < FB_PHASE_MS.lynrunde ? lightningStep(s, saved, bank) : null;
    if (!step) s.phase = 'status';
  }
  step ??= { kind: 'status' };
  if (step.kind === 'task') {
    const key = step.task.item;
    if (step.phase === 'lynrunde') s.lastLightning = key;
    else s = { ...s, asked: [...s.asked, key], history: [...s.history, step.task.type] };
  }
  return { ...s, step, count: s.count + 1, shownAt: now };
}

/** Brugeren har set introduktionen: emnerne oprettes, og kombinationen får sin station i paladset. */
export function introduceFb(session: FbSession, saved: FbSaved, bank: readonly BankItem[], id: string, now: number): { session: FbSession; saved: FbSaved } {
  const item = find(bank, id);
  if (!item) return { session, saved };
  return {
    session: { ...session, introduced: [...session.introduced, id] },
    saved: introduce(saved, item, todayOf(saved, now)),
  };
}

export interface FbFeedback {
  graded: Graded;
  xp: number;
  ms: number;
  /** Rigtige i træk efter svaret. */
  combo: number;
}

/**
 * Bedømmer svaret og giver XP med combo. Leitner: rigtigt og hurtigt = én kasse op, rigtigt men langsomt eller halvt =
 * bliver stående, forkert = kasse 1. Lynrunden skriver ikke i loggen og flytter kun emner ved fejl.
 */
export function answerFb(session: FbSession, saved: FbSaved, answer: Omit<FbAnswer, 'ms'>, now: number): { session: FbSession; saved: FbSaved; feedback: FbFeedback } {
  const step = session.step;
  if (!step || step.kind !== 'task') throw new Error('Der er ingen opgave at svare på');
  const ms = Math.max(0, now - session.shownAt);
  const graded = grade(step.task, { ...answer, ms }, saved.settings.fastMs);
  const ok = graded.score === 1;
  const outcome: Outcome = outcomeOf(graded);
  const lightning = step.phase === 'lynrunde';
  const item = saved.items[step.task.item];
  let items = saved.items;
  if (item && !(lightning && outcome !== 'wrong')) {
    const entry = lightning ? undefined : { t: now, ok, ms };
    items = { ...items, [step.task.item]: review(item, outcome, todayOf(saved, now), entry) };
  }
  const xp = answerXp({ score: graded.score, fast: false, levelAccuracy: null, comboBefore: session.combo });
  const combo = ok ? session.combo + 1 : 0;
  return {
    session: { ...session, combo, xp: session.xp + xp, correct: session.correct + graded.score, total: session.total + 1 },
    saved: { ...saved, items, xp: addXp(saved.xp, xp) },
    feedback: { graded, xp, ms, combo },
  };
}

/** Sessionen er gennemført: dagen tæller i farvebehandlingens streak (adskilt fra fordelingssporets), og sessionen gemmes. */
export function finishFbSession(session: FbSession, saved: FbSaved, now: number): FbSaved {
  const day = todayOf(saved, now);
  const record = { day, ms: now - session.started, correct: session.correct, total: session.total, xp: session.xp };
  return { ...saved, sessions: [...saved.sessions, record], streak: completeDay(saved.streak, day) };
}
