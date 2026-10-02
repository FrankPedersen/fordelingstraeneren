import { addDays, dayOf } from './dates';

export type Box = 1 | 2 | 3 | 4 | 5;
export type Support = 0 | 1 | 2 | 3;

export interface LogEntry {
  t: number;
  ok: boolean;
  ms: number;
  sure?: boolean;
}

export interface Item {
  box: Box;
  due: string;
  support: Support;
  /** De seneste 20 svar. */
  log: LogEntry[];
}

/** Dage til næste gang for hver kasse. */
export const BOX_DAYS: Record<Box, number> = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 };

export const LOG_SIZE = 20;

/** fast = rigtigt og hurtigt, slow = rigtigt men langsomt, wrong = forkert. */
export type Outcome = 'fast' | 'slow' | 'wrong';

export function newItem(today: string): Item {
  return { box: 1, due: today, support: 3, log: [] };
}

export function isDue(item: Item, today: string): boolean {
  return item.due <= today;
}

/**
 * Flytter et emne efter et svar:
 * - forkert: kasse 1, forfald i morgen og ét trin mere støtte;
 * - rigtigt og hurtigt: én kasse op og ét trin mindre støtte;
 * - rigtigt men langsomt: bliver i kassen og får ny forfaldsdato.
 * Rigtige svar flytter kun et forfaldent emne, så afstanden mellem gentagelserne holdes.
 * Uden `entry` kommer svaret ikke i loggen.
 */
export function review(item: Item, outcome: Outcome, today: string, entry?: LogEntry): Item {
  const log = entry ? [...item.log, entry].slice(-LOG_SIZE) : item.log;
  if (outcome === 'wrong') {
    const support = Math.min(3, item.support + 1) as Support;
    return { ...item, box: 1, due: addDays(today, 1), support, log };
  }
  if (!isDue(item, today)) return { ...item, log };
  if (outcome === 'fast' && item.box < 5) {
    const box = (item.box + 1) as Box;
    const support = Math.max(0, item.support - 1) as Support;
    return { ...item, box, due: addDays(today, BOX_DAYS[box]), support, log };
  }
  return { ...item, due: addDays(today, BOX_DAYS[item.box]), log };
}

/** Mestret = kasse 5 og hurtigt rigtigt på tre forskellige dage. */
export function isMastered(item: Item, fastMs: number, dayStartsAtHour = 4): boolean {
  if (item.box !== 5) return false;
  const days = new Set(
    item.log.filter((e) => e.ok && e.ms < fastMs).map((e) => dayOf(e.t, dayStartsAtHour)),
  );
  return days.size >= 3;
}

/**
 * De seneste `n` svar på tværs af logge, ældste først. Et svar, der står i flere logge
 * (fx begge mønstre i højere/lavere), har samme tidsstempel og tælles én gang.
 */
export function recentAnswers(logs: Iterable<readonly LogEntry[]>, n = LOG_SIZE): boolean[] {
  const byTime = new Map<number, boolean>();
  for (const log of logs) for (const e of log) byTime.set(e.t, e.ok);
  return [...byTime]
    .sort(([a], [b]) => a - b)
    .slice(-n)
    .map(([, ok]) => ok);
}
