import { mulberry32 } from '../../engine/rng';
import type { Difficulty } from '../../engine/session';
import { patternById, type Pattern } from '../../domain/patterns';
import { placeOf, type Place } from '../../memory/palace';

export interface PalaceTask {
  kind: 'palace';
  seed: number;
  patternId: string;
  /** to-pattern: stationen vises, og mønstret tastes. to-station: mønstret vises, og stationen vælges på ruten. */
  direction: 'to-pattern' | 'to-station';
}

export type PalaceAnswer = { pattern: string } | { place: Place };

/**
 * Let: mønster → station. Svær: station → mønster. Normal: begge veje.
 * De episke mønstre har ingen station, kun Loftet, så for dem spørges der efter rummet.
 */
export function makePalaceTask(seed: number, pattern: Pattern, difficulty: Difficulty): PalaceTask {
  const place = placeOf(pattern);
  if (place === null) throw new Error(`${pattern.id} har ingen plads i paladset`);
  const rng = mulberry32(seed);
  let direction: PalaceTask['direction'] =
    difficulty === 'easy' ? 'to-station' : difficulty === 'hard' ? 'to-pattern' : rng.int(2) === 0 ? 'to-pattern' : 'to-station';
  if (place === 'loft') direction = 'to-station';
  return { kind: 'palace', seed, patternId: pattern.id, direction };
}

export function checkPalace(task: PalaceTask, answer: PalaceAnswer): boolean {
  if ('pattern' in answer) return answer.pattern === task.patternId;
  return answer.place === placeOf(patternById(task.patternId));
}
