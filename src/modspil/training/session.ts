import { dayOf } from '../../engine/dates';
import { isDue, newItem, review } from '../../engine/leitner';
import { mulberry32 } from '../../engine/rng';
import { completeDay } from '../../engine/streak';
import { addXp } from '../../engine/xp';
import { FOERSTE_NIVEAU, harOvelse, lavNiveauOpgave, lavOpgave, OVELSER, type ModspilOpgave, type Niveau } from '../model/generator';
import type { Profil } from '../model/metoder';
import { ANSWER_LOG_SIZE, type MsAnswerEntry, type MsSaved } from '../storage';
import { HURTIGT_MS, ovelseAf, reviewOvelse, warmupQueue } from './deck';
import { medUdspilPost, udspilPost, UDSPIL_KEY, type UdspilRef } from './findUdspil';
import { erRigtigt, XP_RIGTIGT, type Svar } from './scoring';

/**
 * Modspils daglige session (SPEC-modspil.md, trin 2): fire opgaver fra trin 1's generator. Først højst to forfaldne
 * øvelser fra Leitner-bunken (repetition, på brugerens niveau eller øvelsens første), så opgaver på niveauet, hvor
 * generatoren vælger øvelsen (`lavNiveauOpgave`). Status registrerer sessionen og streaken. Sværheden tilpasses som i
 * Pointregnskab ud fra de seneste 20 svar i niveaufasen.
 *
 * Øvelse 8, "Find udspillet" (SPEC-modspil-v2.md, trin 3), indgår med sin egen Leitner-post: som repetition, når
 * posten er forfalden, og i niveaufasen med samme chance som hver af v1's øvelser (`trakUdspil`).
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
  /**
   * Øvelse 8, "Find udspillet" (SPEC-modspil-v2.md, trin 3): niveauet og seedet, når den aktuelle opgave er øvelse 8
   * (så er `opgave` null). Skærmen laver opgaven med `lavFindUdspil`, når datasættet er hentet, så lodtrækningen ikke
   * venter på det.
   */
  udspil?: UdspilRef | null;
  fase: MsFase;
  /** Hvornår opgaven blev vist. */
  shownAt: number;
  /** Status: sessionen er gennemført og registreret. */
  done: boolean;
}

const todayOf = (saved: MsSaved, now: number) => dayOf(now, saved.settings.dayStartsAtHour);

/** Brugerens profil: metoderne, og navnet, de svarer til. */
export const profilAf = (saved: MsSaved): Profil => ({ id: saved.profil, valg: saved.metoder });

/**
 * De forfaldne øvelser i dag i øvelsernes orden: v1's syv fra Leitner-bunken og til sidst øvelse 8, når dens post er
 * forfalden (Franks valg 25. nov. 2026, session 3a). Sessionen tager de første `REPETITIONER`.
 */
export function repetitionsKoe(saved: MsSaved, today: string): string[] {
  const post = udspilPost(saved);
  return [...warmupQueue(saved.items, today), ...(post && isDue(post, today) ? [UDSPIL_KEY] : [])];
}

/** Antallet af v1's øvelser, profilen har på niveauet. */
const v1Oevelser = (niveau: Niveau, profil: Profil): number => OVELSER.filter((o) => harOvelse(o, profil) && FOERSTE_NIVEAU[o] <= niveau).length;

/**
 * Trækkes øvelse 8 i niveaufasen? Den har samme chance som hver af v1's øvelser på niveauet, 1/(k + 1), hvor k er
 * antallet af v1's øvelser, profilen har på niveauet (Franks valg 25. nov. 2026, session 3a). Lodtrækningen bruger sin
 * egen talrække fra opgavens seed, så v1's opgave for et seed er den samme som før, når øvelse 8 ikke trækkes.
 */
export function trakUdspil(niveau: Niveau, seed: number, profil: Profil): boolean {
  const k = v1Oevelser(niveau, profil);
  return mulberry32((seed ^ 0x6d2b79f5) >>> 0).int(k + 1) === k;
}

export function startMsSession(saved: MsSaved, now: number, seed: number): MsSession {
  return {
    seed,
    started: now,
    queue: repetitionsKoe(saved, todayOf(saved, now)).slice(0, REPETITIONER),
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
    return { session: { ...session, opgave: null, udspil: null, done: true, shownAt: now }, saved: finish(session, saved, now) };
  }
  const profil = profilAf(saved);
  let queue = session.queue.filter((key) => key === UDSPIL_KEY || harOvelse(ovelseAf(key), profil));
  const seed = seedFor(session);
  let opgave: ModspilOpgave | null = null;
  let udspil: UdspilRef | null = null;
  let fase: MsFase;
  if (queue.length) {
    // Øvelse 8 som repetition: på brugerens niveau (den begynder på niveau 1).
    if (queue[0] === UDSPIL_KEY) udspil = { niveau: saved.level, seed };
    else {
      const ovelse = ovelseAf(queue[0]);
      const niveau = Math.max(saved.level, FOERSTE_NIVEAU[ovelse]) as Niveau;
      opgave = lavOpgave(ovelse, niveau, seed, profil);
    }
    fase = 'repetition';
    queue = queue.slice(1);
  } else {
    if (trakUdspil(saved.level, seed, profil)) udspil = { niveau: saved.level, seed };
    else opgave = lavNiveauOpgave(saved.level, seed, profil);
    fase = 'niveau';
  }
  return { session: { ...session, queue, opgave, udspil, fase, count: session.count + 1, shownAt: now }, saved };
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

/**
 * Svar på øvelse 8 med dommen fra `bedoemUdspil` (skærmen har opgaven): XP, øvelsens egen Leitner-post og (i
 * niveaufasen) niveauet, med samme regler som v1's øvelser. Svarloggen `answers` godtager kun v1's øvelser, så øvelse
 * 8's svar står i postens log.
 */
export function answerUdspilTask(s: MsSession, saved: MsSaved, rigtigt: boolean, now: number): { session: MsSession; saved: MsSaved; rigtigt: boolean; xp: number } {
  if (!s.udspil) throw new Error('Den aktuelle opgave er ikke øvelse 8');
  const ms = Math.max(0, now - s.shownAt);
  const xp = rigtigt ? XP_RIGTIGT : 0;
  const today = todayOf(saved, now);
  const item = udspilPost(saved) ?? newItem(today);
  const outcome = !rigtigt ? 'wrong' : ms <= HURTIGT_MS ? 'fast' : 'slow';
  let next: MsSaved = medUdspilPost({ ...saved, xp: addXp(saved.xp, xp) }, review(item, outcome, today, { t: now, ok: rigtigt, ms }));
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
