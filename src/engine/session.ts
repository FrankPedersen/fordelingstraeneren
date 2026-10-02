/** Fasernes varighed i ms (SPEC.md, Sessionsmotor). Timeren er blød: en påbegyndt opgave gøres færdig. */
export const PHASE_MS = {
  review: 60_000,
  level: 90_000,
  lightning: 60_000,
  sudoku: 75_000,
  status: 15_000,
} as const;

export type Difficulty = 'easy' | 'normal' | 'hard';

/** Træfsikkerheden måles over de seneste 20 svar. */
export const RECENT_WINDOW = 20;

/** Sværheden tilpasses først, når vinduet rummer så mange svar. */
export const MIN_ANSWERS_TO_ADAPT = 10;

export function accuracy(recent: readonly boolean[]): number | null {
  if (recent.length === 0) return null;
  return recent.filter(Boolean).length / recent.length;
}

/** Over 90 % træfsikkerhed gør opgaverne sværere, under 80 % gør dem lettere. */
export function difficultyOf(recent: readonly boolean[]): Difficulty {
  if (recent.length < MIN_ANSWERS_TO_ADAPT) return 'normal';
  const a = accuracy(recent)!;
  if (a > 0.9) return 'hard';
  if (a < 0.8) return 'easy';
  return 'normal';
}

export function pushRecent(recent: readonly boolean[], ok: boolean): boolean[] {
  return [...recent, ok].slice(-RECENT_WINDOW);
}

/** Interleaving: højst `maxRun` opgaver af samme type i træk. */
export function allowsKind(history: readonly string[], kind: string, maxRun = 2): boolean {
  if (history.length < maxRun) return true;
  return history.slice(-maxRun).some((k) => k !== kind);
}

/** Korrekte svar pr. minut med én decimal. */
export function correctPerMinute(correct: number, ms: number): number {
  if (ms <= 0) return 0;
  return Math.round((correct * 600_000) / ms) / 10;
}
