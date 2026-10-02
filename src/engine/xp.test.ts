import { describe, expect, it } from 'vitest';
import { addXp, answerXp, comboMultiplier } from './xp';

const base = { score: 1, fast: false, levelAccuracy: 0.5, comboBefore: 0 } as const;

describe('XP', () => {
  it('giver 10 for et rigtigt svar, 5 for halv score og 0 for et forkert', () => {
    expect(answerXp(base)).toBe(10);
    expect(answerXp({ ...base, score: 0.5 })).toBe(5);
    expect(answerXp({ ...base, score: 0 })).toBe(0);
  });

  it('giver +5 for hurtigt rigtigt, men kun når niveauets træfsikkerhed er mindst 90 %', () => {
    expect(answerXp({ ...base, fast: true, levelAccuracy: 0.9 })).toBe(15);
    expect(answerXp({ ...base, fast: true, levelAccuracy: 0.85 })).toBe(10);
    expect(answerXp({ ...base, fast: true, levelAccuracy: null })).toBe(10);
  });

  it('ganger med 1,5 efter 5 rigtige i træk og med 2 efter 10', () => {
    expect([0, 4, 5, 9, 10, 25].map(comboMultiplier)).toEqual([1, 1, 1.5, 1.5, 2, 2]);
    expect(answerXp({ ...base, comboBefore: 5 })).toBe(15);
    expect(answerXp({ ...base, comboBefore: 10, fast: true, levelAccuracy: 1 })).toBe(30);
  });

  it('lægger indsatsen til: Sikker +15 / −10, Gæt +5 / 0', () => {
    expect(answerXp({ ...base, stake: 'sure' })).toBe(25);
    expect(answerXp({ ...base, score: 0, stake: 'sure' })).toBe(-10);
    expect(answerXp({ ...base, stake: 'guess' })).toBe(15);
    expect(answerXp({ ...base, score: 0, stake: 'guess' })).toBe(0);
  });

  it('lader aldrig den samlede XP gå under 0', () => {
    expect(addXp(5, -10)).toBe(0);
    expect(addXp(100, 25)).toBe(125);
  });
});
