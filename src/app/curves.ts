import { addDays, daysBetween, isoWeek } from '../engine/dates';
import type { Saved } from '../engine/storage';
import { GRADES, type Grade } from '../domain/patterns';
import { lightningKind } from './session';
import { tx } from '../i18n';

export interface WeekPoint {
  /** ISO-ugen, fx "2026-W40". */
  week: string;
  /** "uge 40". */
  label: string;
  sessions: number;
  /** Gennemsnitlige korrekte svar pr. minut i lynrunden på højere/lavere- og Lynaflæsningsdage. */
  higherLower: number | null;
  read: number | null;
  /** Træfsikkerhed (0–1) pr. grad uden for lynrunden. */
  grades: Partial<Record<Grade, number>>;
}

const mean = (values: number[]) =>
  values.length === 0 ? null : Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;

/** Ugerne fra den første til den seneste session; uger uden sessioner står som huller. */
export function weeklyCurves(saved: Saved, maxWeeks = 12): WeekPoint[] {
  if (saved.sessions.length === 0) return [];
  const days = saved.sessions.map((s) => s.day).sort();
  const weeks: string[] = [];
  for (let day = days[0]; daysBetween(day, days.at(-1)!) >= -6; day = addDays(day, 7)) {
    const week = isoWeek(day);
    if (!weeks.includes(week)) weeks.push(week);
    if (week === isoWeek(days.at(-1)!)) break;
  }

  return weeks.slice(-maxWeeks).map((week) => {
    const sessions = saved.sessions.filter((s) => isoWeek(s.day) === week);
    const grades: Partial<Record<Grade, number>> = {};
    for (const grade of GRADES) {
      const [correct, total] = sessions.reduce(
        ([c, t], s) => [c + (s.grades?.[grade]?.[0] ?? 0), t + (s.grades?.[grade]?.[1] ?? 0)],
        [0, 0],
      );
      if (total > 0) grades[grade] = correct / total;
    }
    return {
      week,
      label: tx(`uge ${Number(week.slice(6))}`, `week ${Number(week.slice(6))}`),
      sessions: sessions.length,
      higherLower: mean(sessions.filter((s) => lightningKind(s.day) === 'higher-lower').map((s) => s.cpm)),
      read: mean(sessions.filter((s) => lightningKind(s.day) === 'read').map((s) => s.cpm)),
      grades,
    };
  });
}
