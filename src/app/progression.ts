import { dayOf } from '../engine/dates';
import { newItem, recentAnswers } from '../engine/leitner';
import { accuracy } from '../engine/session';
import { SKILLS, type Saved, type Skill } from '../engine/storage';
import { GRADES, PATTERNS, findPattern, type Grade, type Pattern } from '../domain/patterns';
import { placeOf } from '../memory/palace';

/** Færdighederne for et mønster. Rang (paladset) kun for mønstre med en plads; legendariske placeres ikke. */
export function skillsOf(pattern: Pattern): Skill[] {
  const skills: Skill[] = ['compare', 'complete', 'read'];
  return placeOf(pattern) === null ? skills : ['rank', ...skills];
}

export const NEW_PATTERNS_PER_DAY = 2;

/** Næste grad låses op, når alle emner i den nuværende står i mindst denne kasse. */
export const UNLOCK_BOX = 3;

export function itemKey(patternId: string, skill: Skill): string {
  return `${patternId}:${skill}`;
}

export function splitItemKey(key: string): { patternId: string; skill: Skill } {
  const i = key.lastIndexOf(':');
  return { patternId: key.slice(0, i), skill: key.slice(i + 1) as Skill };
}

export function isIntroduced(saved: Saved, patternId: string): boolean {
  return SKILLS.some((skill) => itemKey(patternId, skill) in saved.items);
}

export function introducedPatterns(saved: Saved): Pattern[] {
  return PATTERNS.filter((p) => isIntroduced(saved, p.id));
}

function isGradeDone(saved: Saved, grade: Grade): boolean {
  return PATTERNS.filter((p) => p.grade === grade).every((p) =>
    skillsOf(p).every((skill) => (saved.items[itemKey(p.id, skill)]?.box ?? 0) >= UNLOCK_BOX),
  );
}

/**
 * Det aktuelle niveau: den højeste grad med et introduceret mønster – eller den næste, når den er
 * lært. Oplåsningen er varig: en fejl på et lavere niveau låser ikke niveauet igen.
 */
export function currentGrade(saved: Saved): Grade {
  const reached = introducedPatterns(saved).reduce((max, p) => Math.max(max, GRADES.indexOf(p.grade)), 0);
  const done = isGradeDone(saved, GRADES[reached]) && reached < GRADES.length - 1;
  return GRADES[done ? reached + 1 : reached];
}

/** Mønstrene i graderne til og med det aktuelle niveau. */
export function unlockedPatterns(saved: Saved): Pattern[] {
  const level = GRADES.indexOf(currentGrade(saved));
  return PATTERNS.filter((p) => GRADES.indexOf(p.grade) <= level);
}

/**
 * Mønstre, der er introduceret på dagen: deres ældste svar er fra dagen, eller de er ikke
 * besvaret endnu. Skemaet har ingen introduktionsdato, så den udledes af loggene.
 */
function introducedOn(saved: Saved, day: string): Pattern[] {
  return introducedPatterns(saved).filter((p) => {
    const times = SKILLS.flatMap((s) => saved.items[itemKey(p.id, s)]?.log.map((e) => e.t) ?? []);
    return times.length === 0 || dayOf(Math.min(...times), saved.settings.dayStartsAtHour) === day;
  });
}

/** Det hyppigste mønster på det aktuelle niveau, der ikke er introduceret – hvis dagens kvote tillader det. */
export function nextNewPattern(saved: Saved, today: string): Pattern | null {
  if (introducedOn(saved, today).length >= NEW_PATTERNS_PER_DAY) return null;
  const grade = currentGrade(saved);
  return PATTERNS.find((p) => p.grade === grade && !isIntroduced(saved, p.id)) ?? null;
}

function waitingInGrade(saved: Saved): number {
  const grade = currentGrade(saved);
  return PATTERNS.filter((p) => p.grade === grade && !isIntroduced(saved, p.id)).length;
}

/** Antal nye mønstre, en ny dag kan bringe (højst kvoten på 2). */
export function newPatternsWaiting(saved: Saved): number {
  return Math.min(NEW_PATTERNS_PER_DAY, waitingInGrade(saved));
}

/** Antal nye mønstre, der kan introduceres i dag. */
export function newPatternsToday(saved: Saved, today: string): number {
  const quota = Math.max(0, NEW_PATTERNS_PER_DAY - introducedOn(saved, today).length);
  return Math.min(quota, waitingInGrade(saved));
}

/** Opretter mønstrets emner: kasse 1, forfaldne i dag og med fuld støtte. */
export function introduce(saved: Saved, patternId: string, today: string): Saved {
  const pattern = findPattern(patternId);
  if (!pattern) return saved;
  const missing = skillsOf(pattern).filter((skill) => !saved.items[itemKey(patternId, skill)]);
  if (missing.length === 0) return saved;
  const items = { ...saved.items };
  for (const skill of missing) items[itemKey(patternId, skill)] = newItem(today);
  return { ...saved, items };
}

/** Giver de introducerede mønstre emner for færdigheder, der er kommet til siden (fx rang i trin 3). */
export function ensureItems(saved: Saved, today: string): Saved {
  return introducedPatterns(saved).reduce((next, p) => introduce(next, p.id, today), saved);
}

/** Forfaldne emner for mønstrenes færdigheder: laveste kasse og ældste forfald først. */
export function dueItemKeys(saved: Saved, day: string): string[] {
  const active = (key: string) => {
    const { patternId, skill } = splitItemKey(key);
    const pattern = findPattern(patternId);
    return pattern !== undefined && skillsOf(pattern).includes(skill);
  };
  return Object.entries(saved.items)
    .filter(([key, item]) => active(key) && item.due <= day)
    .sort(([ka, a], [kb, b]) => a.box - b.box || a.due.localeCompare(b.due) || ka.localeCompare(kb))
    .map(([key]) => key);
}

/** De seneste 20 svar på tværs af emnerne, eller kun på mønstre fra én grad. */
export function recentFromLogs(saved: Saved, grade?: Grade): boolean[] {
  const logs = Object.entries(saved.items)
    .filter(([key]) => !grade || findPattern(splitItemKey(key).patternId)?.grade === grade)
    .map(([, item]) => item.log);
  return recentAnswers(logs);
}

/** Træfsikkerheden over de seneste 20 svar på niveauet (graden). */
export function levelAccuracy(saved: Saved, grade: Grade): number | null {
  return accuracy(recentFromLogs(saved, grade));
}

export interface GradeProgress {
  grade: Grade;
  /** Niveauet 1–5 følger graderne. */
  level: number;
  introduced: number;
  patterns: number;
  /** Emner i kasse 3 eller højere. */
  itemsDone: number;
  items: number;
}

export function gradeProgress(saved: Saved): GradeProgress {
  const grade = currentGrade(saved);
  const patterns = PATTERNS.filter((p) => p.grade === grade);
  const keys = patterns.flatMap((p) => skillsOf(p).map((skill) => itemKey(p.id, skill)));
  return {
    grade,
    level: GRADES.indexOf(grade) + 1,
    introduced: patterns.filter((p) => isIntroduced(saved, p.id)).length,
    patterns: patterns.length,
    itemsDone: keys.filter((key) => (saved.items[key]?.box ?? 0) >= UNLOCK_BOX).length,
    items: keys.length,
  };
}
