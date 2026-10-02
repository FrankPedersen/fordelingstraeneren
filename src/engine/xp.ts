/** Indsats efter et repetitionsemne. */
export type Stake = 'sure' | 'guess';

export interface AnswerXpInput {
  /** 1 = rigtigt, 0,5 = halv score, 0 = forkert. */
  score: number;
  fast: boolean;
  /** Træfsikkerheden på emnets niveau (0–1), eller null uden svar endnu. */
  levelAccuracy: number | null;
  /** Antal rigtige i træk før dette svar. */
  comboBefore: number;
  stake?: Stake;
}

export function comboMultiplier(comboBefore: number): number {
  if (comboBefore >= 10) return 2;
  if (comboBefore >= 5) return 1.5;
  return 1;
}

/** 10 XP pr. rigtigt svar, +5 for hurtigt (ved mindst 90 % træfsikkerhed), gange combo, plus indsats. */
export function answerXp({ score, fast, levelAccuracy, comboBefore, stake }: AnswerXpInput): number {
  const correct = score === 1;
  const fastBonus = correct && fast && levelAccuracy !== null && levelAccuracy >= 0.9 ? 5 : 0;
  let xp = Math.round((10 * score + fastBonus) * comboMultiplier(comboBefore));
  if (stake === 'sure') xp += correct ? 15 : -10;
  if (stake === 'guess') xp += correct ? 5 : 0;
  return xp;
}

export function addXp(total: number, delta: number): number {
  return Math.max(0, total + delta);
}
