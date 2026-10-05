import type { Level } from '../model/generator';

/**
 * Sværheden (SPEC-pointregnskab.md, Øvelser og sværhedsgrader): tilpasses efter de seneste 20 svar i niveaufasen.
 * Over 90 % rigtige rykker et niveau op, under 80 % ét ned. Efter et skift tælles forfra.
 */
export const LEVEL_WINDOW = 20;
export const MAX_LEVEL: Level = 5;

export interface LevelState {
  level: Level;
  /** Scorerne (1, 0,5 eller 0) siden seneste skift, højst de seneste 20. */
  log: number[];
}

export function nextLevel(state: LevelState, score: number): LevelState {
  const log = [...state.log, score].slice(-LEVEL_WINDOW);
  if (log.length < LEVEL_WINDOW) return { level: state.level, log };
  const accuracy = log.reduce((s, x) => s + x, 0) / log.length;
  if (accuracy > 0.9 && state.level < MAX_LEVEL) return { level: (state.level + 1) as Level, log: [] };
  if (accuracy < 0.8 && state.level > 1) return { level: (state.level - 1) as Level, log: [] };
  return { level: state.level, log };
}

/** Glidende træfsikkerhed pr. øvelse: de seneste 20 scorer. */
export const ACCURACY_WINDOW = 20;

export function pushAccuracy(log: readonly number[] | undefined, score: number): number[] {
  return [...(log ?? []), score].slice(-ACCURACY_WINDOW);
}

export function accuracyOf(log: readonly number[] | undefined): number | null {
  return log && log.length ? log.reduce((s, x) => s + x, 0) / log.length : null;
}
