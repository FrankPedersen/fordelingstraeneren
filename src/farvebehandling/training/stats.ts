import { addDays } from '../../engine/dates';
import type { BankItem } from '../analysis';
import { TASK_TYPES, type FbSaved, type PracticeEntry, type TaskType } from '../storage';
import { parseItemKey } from './progression';

/**
 * Statistikken: træfsikkerhed pr. teknik og pr. opgavetype ud fra svarene i Træning (repetition og niveau, ikke
 * lynrunden) og Selvvalgt. Et halvt rigtigt svar tæller 0,5.
 */

/** "Seneste" er de sidste så mange dage, i dag medregnet. */
export const RECENT_DAYS = 30;
/** Et svagt punkt kræver mindst så mange svar. */
export const MIN_ANSWERS = 5;

export interface Tally {
  answers: number;
  /** Summen af scorerne (1, 0,5 eller 0). */
  score: number;
}

export interface StatRow<K extends string = string> {
  key: K;
  all: Tally;
  recent: Tally;
}

export const accuracy = (t: Tally): number | null => (t.answers ? t.score / t.answers : null);

/** Alle svar, der tæller: Træning og Selvvalgt. */
export function answerLog(saved: FbSaved): PracticeEntry[] {
  return [...(saved.training ?? []), ...saved.practice];
}

function tally<K extends string>(keys: readonly K[], entries: readonly PracticeEntry[], keyOf: (e: PracticeEntry) => K | undefined, today: string): StatRow<K>[] {
  const since = addDays(today, 1 - RECENT_DAYS);
  const rows = new Map(keys.map((key) => [key, { key, all: { answers: 0, score: 0 }, recent: { answers: 0, score: 0 } }]));
  for (const entry of entries) {
    const key = keyOf(entry);
    const row = key === undefined ? undefined : rows.get(key);
    if (!row) continue;
    row.all.answers++;
    row.all.score += entry.score;
    if (entry.day >= since) {
      row.recent.answers++;
      row.recent.score += entry.score;
    }
  }
  return [...rows.values()];
}

/** Pr. teknik i den rækkefølge, `techniques` har; tekniken er kombinationens i banken. */
export function techniqueStats(saved: FbSaved, bank: readonly BankItem[], techniques: readonly string[], today: string): StatRow[] {
  const techniqueOf = new Map(bank.map((b) => [b.combination.id, b.combination.technique]));
  return tally(techniques, answerLog(saved), (e) => techniqueOf.get(parseItemKey(e.item).id), today);
}

/** Pr. opgavetype i specens rækkefølge. */
export function taskStats(saved: FbSaved, today: string): StatRow<TaskType>[] {
  return tally(TASK_TYPES, answerLog(saved), (e) => e.task, today);
}

/** Svageste først; rækker med færre end MIN_ANSWERS svar står til sidst i deres oprindelige rækkefølge. */
export function byWeakness<K extends string>(rows: readonly StatRow<K>[]): StatRow<K>[] {
  const judged = rows.filter((r) => r.all.answers >= MIN_ANSWERS);
  const few = rows.filter((r) => r.all.answers < MIN_ANSWERS);
  return [...judged.sort((a, b) => accuracy(a.all)! - accuracy(b.all)! || b.all.answers - a.all.answers), ...few];
}

/** Det svageste punkt: lavest træfsikkerhed blandt rækkerne med mindst MIN_ANSWERS svar, og under 100 %. */
export function weakest<K extends string>(rows: readonly StatRow<K>[]): StatRow<K> | null {
  const [first] = byWeakness(rows);
  return first && first.all.answers >= MIN_ANSWERS && accuracy(first.all)! < 1 ? first : null;
}
