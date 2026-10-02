import type { Support } from '../engine/leitner';

/** At åbne billedet før svaret koster XP på støtteniveau 2. */
export const HINT_COST = 5;

export interface SupportPlan {
  /** Emnet præsenteres (station, mønster, billede), før det testes. */
  present: boolean;
  /** Ledetråden (billedet) på tryk: gratis, mod XP eller slet ikke. */
  hint: 'free' | 'paid' | 'none';
  /** Efter svaret: station, billede og skyline; kun skyline; eller kun rigtigt/forkert og facit. */
  after: 'full' | 'skyline' | 'facit';
}

/** Aftrapningen fra SPEC.md: støtten falder, når emnet rykker op, og stiger ved fejl. */
export function supportPlan(level: Support): SupportPlan {
  switch (level) {
    case 3:
      return { present: true, hint: 'free', after: 'full' };
    case 2:
      return { present: false, hint: 'paid', after: 'full' };
    case 1:
      return { present: false, hint: 'none', after: 'skyline' };
    case 0:
      return { present: false, hint: 'none', after: 'facit' };
  }
}
