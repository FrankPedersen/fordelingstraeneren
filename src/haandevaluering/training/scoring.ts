import type { Exercise, HandTask } from '../model/generator';
import { pairP } from '../model/generator';
import {
  chances,
  contractFor,
  controlsOf,
  expectedTricks,
  fitLength,
  partnerNeeds,
  pOf,
  rightDecisions,
  shortcut,
  stoppedSuits,
  strainFor,
  trumpGain,
  type Chances,
  type Contract,
  type Controls,
  type Decision,
  type PBreakdown,
  type Shortcut,
  type Strain,
} from '../model/pmodel';

/**
 * Facit og scoring (SPEC-haandevaluering.md, Session, scoring og data): rigtigt 10 XP, rigtigt over tidsgrænsen 5 XP,
 * forkert 0. Tidsgrænserne er 8 s for honnørpoint og 20 s for de øvrige. Facit regnes altid af modellen.
 */

/** Opgave 3: hvilke led gælder? */
export type Terms = 'honors' | 'distribution' | 'notrump';

export type HandAnswer =
  /** Opgave 1, 2, 5 og 7: et tal i kvarte point. */
  | { exercise: 'honors' | 'distribution' | 'partner' | 'wasted'; points: number }
  | { exercise: 'add'; terms: Terms }
  | { exercise: 'decision'; decision: Decision }
  | { exercise: 'strain'; strain: Strain };

export type Facit =
  | { exercise: 'honors'; points: number; shortcut: Shortcut }
  | { exercise: 'distribution' | 'wasted'; points: number; you: PBreakdown }
  | { exercise: 'partner'; you: number; points: number }
  | { exercise: 'add'; terms: Terms }
  | {
      exercise: 'decision';
      P: number;
      you: PBreakdown;
      partner: PBreakdown;
      tricks: number;
      chances: Chances;
      controls: Controls;
      contract: Contract;
      /** De rigtige svar: modellens valg og nabovalget inden for ½ point af en grænse. */
      right: Decision[];
    }
  | {
      exercise: 'strain';
      strain: Strain;
      /** De stoppede farver (0–3). */
      stopped: number[];
      /** Antal trumf og hvor mange stik farvekontrakten giver mere end sans; null uden major-fit. */
      trumps: number | null;
      gain: number | null;
    };

export function facitOf(task: HandTask): Facit {
  const { S, N } = task.hands;
  switch (task.exercise) {
    case 'honors': {
      const s = shortcut(S);
      return { exercise: 'honors', points: s.total, shortcut: s };
    }
    case 'distribution': {
      const you = pOf(S, { trump: task.trump });
      return { exercise: 'distribution', points: you.p, you };
    }
    case 'wasted': {
      const you = pOf(S, { trump: task.trump, partnerShort: [task.short] });
      return { exercise: 'wasted', points: you.p, you };
    }
    case 'partner': {
      const you = pOf(S, { trump: task.trump }).p;
      return { exercise: 'partner', you, points: partnerNeeds(you) };
    }
    case 'add':
      return { exercise: 'add', terms: task.scenario === 'no-fit' ? 'honors' : task.scenario === 'fit' ? 'distribution' : 'notrump' };
    case 'decision': {
      const P = pairP(task.hands, task.trump);
      const controls = controlsOf(S, N, task.trump);
      return {
        exercise: 'decision',
        P,
        you: pOf(S, { trump: task.trump }),
        partner: pOf(N, { trump: task.trump }),
        tricks: expectedTricks(P),
        chances: chances(P),
        controls,
        contract: contractFor(P, controls),
        right: rightDecisions(P, controls),
      };
    }
    case 'strain': {
      const strain = strainFor(S, N);
      if (strain === null) throw new Error(`Opgave 6 uden facit (seed ${task.seed})`);
      const trumps = task.trump === null ? null : fitLength(S, N, task.trump);
      return { exercise: 'strain', strain, stopped: stoppedSuits(S, N), trumps, gain: trumps === null ? null : trumpGain(trumps) };
    }
  }
}

export function isRight(task: HandTask, answer: HandAnswer): boolean {
  const facit = facitOf(task);
  if (facit.exercise !== answer.exercise) throw new Error('Svaret passer ikke til opgaven');
  switch (facit.exercise) {
    case 'honors':
    case 'distribution':
    case 'wasted':
    case 'partner':
      return (answer as { points: number }).points === facit.points;
    case 'add':
      return (answer as { terms: Terms }).terms === facit.terms;
    case 'decision':
      return facit.right.includes((answer as { decision: Decision }).decision);
    case 'strain':
      return (answer as { strain: Strain }).strain === facit.strain;
  }
}

/** Tidsgrænserne: 8 s for honnørpoint og 20 s for de øvrige. */
export const TIME_LIMIT_MS = { honors: 8_000, other: 20_000 } as const;

export const timeLimit = (exercise: Exercise): number => (exercise === 'honors' ? TIME_LIMIT_MS.honors : TIME_LIMIT_MS.other);

export const XP = { right: 10, slow: 5, wrong: 0 } as const;

export interface Graded {
  right: boolean;
  /** 1 eller 0. */
  score: number;
  inTime: boolean;
  xp: number;
}

export function grade(task: HandTask, answer: HandAnswer, ms: number): Graded {
  const right = isRight(task, answer);
  const inTime = ms <= timeLimit(task.exercise);
  return { right, score: right ? 1 : 0, inTime, xp: right ? (inTime ? XP.right : XP.slow) : XP.wrong };
}
