import { dayOf } from '../../engine/dates';
import { mulberry32 } from '../../engine/rng';
import { completeDay } from '../../engine/streak';
import { addXp } from '../../engine/xp';
import { FOERSTE_NIVEAU, harOvelse, lavNiveauOpgave, lavOpgave, type ModspilOpgave, type Niveau } from '../model/generator';
import type { Profil } from '../model/metoder';
import { ANSWER_LOG_SIZE, type MsAnswerEntry, type MsSaved } from '../storage';
import { ovelseAf, reviewOvelse, warmupQueue } from './deck';
import { erRigtigt, XP_RIGTIGT, type Svar } from './scoring';

/**
 * Modspils daglige session (SPEC-modspil.md, trin 2): fire opgaver fra trin 1's generator. Først højst to forfaldne
 * øvelser fra Leitner-bunken (repetition, på brugerens niveau eller øvelsens første), så opgaver på niveauet, hvor
 * generatoren vælger øvelsen (`lavNiveauOpgave`). Status registrerer sessionen og streaken. Sværheden tilpasses som i
 * Pointregnskab ud fra de seneste 20 svar i niveaufasen.
 */

/** Opgaver pr. session ("opgave 2 af 4" i mock-up'en). */
export const ANTAL_OPGAVER = 4;
/** Højst så mange forfaldne øvelser som repetition pr. session. */
export const REPETITIONER = 2;
/** Niveauet skifter efter de seneste 20 svar: over 90 % rigtige ét op, under 80 % ét ned. */
export const NIVEAU_VINDUE = 20;

export type MsFase = 'repetition' | 'niveau';

export interface MsSession {
  seed: number;
  started: number;
  /** De forfaldne øvelser, der ikke er stillet endnu. */
  queue: string[];
  /** Antal opgaver indtil nu; giver hver opgave sit eget seed. */
  count: number;
  xp: number;
  correct: number;
  total: number;
  /** Rigtige svar i træk i sessionen. */
  iTraek: number;
  opgave: ModspilOpgave | null;
  fase: MsFase;
  /** Hvornår opgaven blev vist. */
  shownAt: number;
  /** Status: sessionen er gennemført og registreret. */
  done: boolean;
}

const todayOf = (saved: MsSaved, now: number) => dayOf(now, saved.settings.dayStartsAtHour);

/** Brugerens profil: metoderne, og navnet, de svarer til. */
export const profilAf = (saved: MsSaved): Profil => ({ id: saved.profil, valg: saved.metoder });

export function startMsSession(saved: MsSaved, now: number, seed: number): MsSession {
  return {
    seed,
    started: now,
    queue: warmupQueue(saved.items, todayOf(saved, now)).slice(0, REPETITIONER),
    count: 0,
    xp: 0,
    correct: 0,
    total: 0,
    iTraek: 0,
    opgave: null,
    fase: 'repetition',
    shownAt: now,
    done: false,
  };
}

function seedFor(s: MsSession): number {
  return mulberry32((s.seed + Math.imul(s.count, 0x9e3779b1)) >>> 0).uint32();
}

/** Registrerer sessionen og streaken, når status vises. */
function finish(s: MsSession, saved: MsSaved, now: number): MsSaved {
  const day = todayOf(saved, now);
  return {
    ...saved,
    streak: completeDay(saved.streak, day),
    sessions: [...saved.sessions, { day, ms: Math.max(0, now - s.started), correct: s.correct, total: s.total, xp: s.xp, level: saved.level }],
  };
}

/** Næste opgave, eller status efter den sidste, der registrerer sessionen. */
export function nextMsStep(session: MsSession, saved: MsSaved, now: number): { session: MsSession; saved: MsSaved } {
  if (session.done) return { session, saved };
  if (session.count >= ANTAL_OPGAVER) {
    return { session: { ...session, opgave: null, done: true, shownAt: now }, saved: finish(session, saved, now) };
  }
  const profil = profilAf(saved);
  let queue = session.queue.filter((key) => harOvelse(ovelseAf(key), profil));
  const seed = seedFor(session);
  let opgave: ModspilOpgave;
  let fase: MsFase;
  if (queue.length) {
    const ovelse = ovelseAf(queue[0]);
    const niveau = Math.max(saved.level, FOERSTE_NIVEAU[ovelse]) as Niveau;
    opgave = lavOpgave(ovelse, niveau, seed, profil);
    fase = 'repetition';
    queue = queue.slice(1);
  } else {
    opgave = lavNiveauOpgave(saved.level, seed, profil);
    fase = 'niveau';
  }
  return { session: { ...session, queue, opgave, fase, count: session.count + 1, shownAt: now }, saved };
}

/** Niveauet efter et svar i niveaufasen (som Pointregnskab). */
export function nextLevel(state: { level: Niveau; log: number[] }, score: number): { level: Niveau; log: number[] } {
  const log = [...state.log, score].slice(-NIVEAU_VINDUE);
  if (log.length < NIVEAU_VINDUE) return { level: state.level, log };
  const andel = log.reduce((s, x) => s + x, 0) / log.length;
  if (andel > 0.9 && state.level < 5) return { level: (state.level + 1) as Niveau, log: [] };
  if (andel < 0.8 && state.level > 1) return { level: (state.level - 1) as Niveau, log: [] };
  return { level: state.level, log };
}

/** Svar på opgaven: dommen, XP, Leitner-bunken, svarloggen og (i niveaufasen) niveauet. */
export function answerMsTask(s: MsSession, saved: MsSaved, svar: Svar, now: number): { session: MsSession; saved: MsSaved; rigtigt: boolean; xp: number } {
  const o = s.opgave;
  if (!o) throw new Error('Ingen opgave at svare på');
  const ms = Math.max(0, now - s.shownAt);
  const rigtigt = erRigtigt(o, svar);
  const xp = rigtigt ? XP_RIGTIGT : 0;
  const today = todayOf(saved, now);
  const entry: MsAnswerEntry = { day: today, ovelse: o.ovelse, level: o.niveau, score: rigtigt ? 1 : 0, ms };
  let next: MsSaved = {
    ...saved,
    xp: addXp(saved.xp, xp),
    items: reviewOvelse(saved.items, o.ovelse, rigtigt, ms, today, now),
    answers: [...(saved.answers ?? []), entry].slice(-ANSWER_LOG_SIZE),
  };
  if (s.fase === 'niveau') {
    const { level, log } = nextLevel({ level: saved.level, log: saved.levelLog }, rigtigt ? 1 : 0);
    next = { ...next, level, levelLog: log };
  }
  return {
    session: { ...s, xp: s.xp + xp, correct: s.correct + (rigtigt ? 1 : 0), total: s.total + 1, iTraek: rigtigt ? s.iTraek + 1 : 0 },
    saved: next,
    rigtigt,
    xp,
  };
}
