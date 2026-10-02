import { addDays, isoWeek } from './dates';

export interface Streak {
  current: number;
  best: number;
  /** Seneste dag med en gennemført session ('' = aldrig). */
  lastDay: string;
  /** Den kalenderuge, jokeren sidst blev brugt i. */
  jokerWeek?: string;
}

export function emptyStreak(): Streak {
  return { current: 0, best: 0, lastDay: '' };
}

/** Kan de glemte dage mellem lastDay og today dækkes af højst én joker pr. kalenderuge? */
function bridge(streak: Streak, today: string): { alive: boolean; jokerWeek?: string } {
  const broken = { alive: false, jokerWeek: streak.jokerWeek };
  if (!streak.lastDay) return broken;
  let jokerWeek = streak.jokerWeek;
  for (let day = addDays(streak.lastDay, 1); day < today; day = addDays(day, 1)) {
    const week = isoWeek(day);
    if (jokerWeek === week) return broken;
    jokerWeek = week;
  }
  return { alive: true, jokerWeek };
}

/** Registrerer en gennemført session. Jokeren bruges automatisk på en glemt dag. */
export function completeDay(streak: Streak, today: string): Streak {
  if (streak.lastDay && today <= streak.lastDay) return streak;
  const { alive, jokerWeek } = bridge(streak, today);
  const current = alive ? streak.current + 1 : 1;
  const next: Streak = { ...streak, current, best: Math.max(streak.best, current), lastDay: today };
  if (jokerWeek) next.jokerWeek = jokerWeek;
  return next;
}

/** Streaken, som den står på dagen `today`: 0, hvis den ikke længere kan reddes. */
export function streakOn(
  streak: Streak,
  today: string,
): { current: number; jokerUsedThisWeek: boolean } {
  const week = isoWeek(today);
  if (streak.lastDay && today <= streak.lastDay) {
    return { current: streak.current, jokerUsedThisWeek: streak.jokerWeek === week };
  }
  const { alive, jokerWeek } = bridge(streak, today);
  return { current: alive ? streak.current : 0, jokerUsedThisWeek: jokerWeek === week };
}
