import type { Exercise, PointTask } from '../model/generator';
import { otherDefender } from '../model/points';
import type { Placement } from '../model/solver';

/**
 * Scoring (SPEC-pointregnskab.md, Session, scoring, progression og data): rigtigt inden for tidsgrænsen 10 XP,
 * rigtigt over tidsgrænsen 5, ét af to tal rigtigt i løbende tælling 5 (halvt), forkert 0. Ugens boss giver dobbelt.
 */

export type PointAnswer =
  | { exercise: 'sum'; points: number }
  | { exercise: 'running'; W: number; E: number }
  /** Kan han have den?: ja eller nej. */
  | { exercise: 'can'; yes: boolean }
  /** Hvem har den? og Kipningsretning: Vest, Øst eller kan ikke afgøres / det er et gæt. */
  | { exercise: 'who' | 'finesse'; placement: Placement };

export type Result = 'right' | 'half' | 'wrong';

export interface Graded {
  result: Result;
  /** 1, 0,5 eller 0. */
  score: number;
  inTime: boolean;
  xp: number;
  /** Svaret påstod en sikker placering, men facit er "kan ikke afgøres": "Det kunne du ikke vide endnu." */
  overconfident: boolean;
}

/** Tidsgrænserne: 5 s for regnestykket og 15 s for de øvrige spørgsmål. */
export const TIME_LIMIT_MS = { sum: 5_000, other: 15_000 } as const;

export const timeLimit = (exercise: Exercise): number => (exercise === 'sum' ? TIME_LIMIT_MS.sum : TIME_LIMIT_MS.other);

export const XP = { right: 10, slow: 5, half: 5, wrong: 0 } as const;

/** Det svar, der er rigtigt. */
export function correctAnswer(task: PointTask): PointAnswer {
  switch (task.exercise) {
    case 'sum':
      return { exercise: 'sum', points: task.m };
    case 'running':
      return { exercise: 'running', ...task.shown };
    case 'can':
      return { exercise: 'can', yes: task.placement !== otherDefender(task.asked!) };
    case 'who':
    case 'finesse':
      return { exercise: task.exercise, placement: task.placement };
  }
}

function resultOf(task: PointTask, answer: PointAnswer): Result {
  const facit = correctAnswer(task);
  if (facit.exercise !== answer.exercise) throw new Error('Svaret passer ikke til opgaven');
  switch (facit.exercise) {
    case 'sum':
      return (answer as typeof facit).points === facit.points ? 'right' : 'wrong';
    case 'running': {
      const a = answer as typeof facit;
      const right = Number(a.W === facit.W) + Number(a.E === facit.E);
      return right === 2 ? 'right' : right === 1 ? 'half' : 'wrong';
    }
    case 'can':
      return (answer as typeof facit).yes === facit.yes ? 'right' : 'wrong';
    case 'who':
    case 'finesse':
      return (answer as typeof facit).placement === facit.placement ? 'right' : 'wrong';
  }
}

/** Påstod svaret en sikker placering, da facit er "kan ikke afgøres"? I Kan han have den? er det et nej. */
function isOverconfident(task: PointTask, answer: PointAnswer): boolean {
  if (task.exercise === 'sum' || task.exercise === 'running' || task.placement !== 'open') return false;
  if (answer.exercise === 'can') return !answer.yes;
  return answer.exercise !== 'sum' && answer.exercise !== 'running' && answer.placement !== 'open';
}

export function grade(task: PointTask, answer: PointAnswer, ms: number, boss = false): Graded {
  const result = resultOf(task, answer);
  const inTime = ms <= timeLimit(task.exercise);
  const base = result === 'right' ? (inTime ? XP.right : XP.slow) : result === 'half' ? XP.half : XP.wrong;
  return {
    result,
    score: result === 'right' ? 1 : result === 'half' ? 0.5 : 0,
    inTime,
    xp: boss ? 2 * base : base,
    overconfident: isOverconfident(task, answer),
  };
}

/** Visningstiden pr. kort i løbende tælling: start 2.000 ms, inden for 800–4.000 ms (som Lynaflæsning). */
export const RUNNING_MS = { start: 2000, min: 800, max: 4000 } as const;

/** 10 % kortere efter et rigtigt svar og 15 % længere efter en fejl; et halvt rigtigt svar ændrer den ikke. */
export function nextRunningMs(ms: number, result: Result): number {
  if (result === 'half') return ms;
  const next = Math.round(ms * (result === 'right' ? 0.9 : 1.15));
  return Math.min(RUNNING_MS.max, Math.max(RUNNING_MS.min, next));
}
