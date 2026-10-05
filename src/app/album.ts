import { formatInt } from '../engine/format';
import { mulberry32 } from '../engine/rng';
import type { Saved } from '../engine/storage';
import { GRADES, GRADE_LABEL, PATTERNS, type Grade, type Pattern } from '../domain/patterns';
import { tx } from '../i18n';

type AlbumEntry = Saved['album'][string];

/** Sjældne fund fejres med odds: de episke og legendariske mønstre. */
export function isRareFind(pattern: Pattern): boolean {
  return pattern.grade === 'epic' || pattern.grade === 'legendary';
}

/** Et mønster samles første gang, det optræder i en tilfældig hånd; derefter tælles det. */
export function registerHand(saved: Saved, patternId: string, today: string): { saved: Saved; first: boolean } {
  const entry = saved.album[patternId];
  const next: AlbumEntry = entry ? { ...entry, count: entry.count + 1 } : { first: today, count: 1 };
  return { saved: { ...saved, album: { ...saved.album, [patternId]: next } }, first: !entry };
}

/** En legendarisk plads låst op med tre rigtige svar; den har ikke været set i en hånd. */
export function unlockLegendary(saved: Saved, patternId: string, today: string): Saved {
  const pattern = PATTERNS.find((p) => p.id === patternId);
  if (!pattern || pattern.grade !== 'legendary' || saved.album[patternId]) return saved;
  return { ...saved, album: { ...saved.album, [patternId]: { first: today, count: 0 } } };
}

export function albumByGrade(saved: Saved): { grade: Grade; slots: { pattern: Pattern; entry?: AlbumEntry }[] }[] {
  return GRADES.map((grade) => ({
    grade,
    slots: PATTERNS.filter((p) => p.grade === grade).map((pattern) => ({
      pattern,
      entry: saved.album[pattern.id],
    })),
  }));
}

export interface QuizQuestion {
  prompt: string;
  options: string[];
  answer: string;
}

function magnitudeLabel(k: number): string {
  return tx(`1 ud af ${formatInt(10 ** k)}–${formatInt(10 ** (k + 1) - 1)}`, `1 in ${formatInt(10 ** k)}–${formatInt(10 ** (k + 1) - 1)}`);
}

/** Tre spørgsmål om et legendarisk mønster: grad, størrelsesorden af "1 ud af N" og antal placeringer. */
export function legendaryQuiz(pattern: Pattern, seed: number): QuizQuestion[] {
  const rng = mulberry32(seed);
  const k = Math.floor(Math.log10(pattern.oneIn));
  // Fire størrelsesordener i træk, hvor den rigtige står et tilfældigt sted (laveste er 1 ud af 1.000).
  const lowest = Math.max(3, k - rng.int(4));
  const magnitudes = [0, 1, 2, 3].map((i) => magnitudeLabel(lowest + i));
  return [
    {
      prompt: tx(`Hvilken grad har ${pattern.id}?`, `Which grade is ${pattern.id}?`),
      options: GRADES.map((g) => GRADE_LABEL[g]),
      answer: GRADE_LABEL[pattern.grade],
    },
    {
      prompt: tx(`Hvor sjælden er ${pattern.id}?`, `How rare is ${pattern.id}?`),
      options: magnitudes,
      answer: magnitudeLabel(k),
    },
    {
      prompt: tx(`Hvor mange placeringer har ${pattern.id}?`, `How many arrangements does ${pattern.id} have?`),
      options: ['4', '12', '24'],
      answer: String(pattern.placements),
    },
  ];
}
