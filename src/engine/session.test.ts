import { describe, expect, it } from 'vitest';
import { accuracy, allowsKind, correctPerMinute, difficultyOf, pushRecent } from './session';

const answers = (correct: number, total: number) =>
  Array.from({ length: total }, (_, i) => i < correct);

describe('Adaptiv sværhed', () => {
  it('gør opgaverne sværere over 90 % og lettere under 80 % af de seneste 20 svar', () => {
    expect(difficultyOf(answers(19, 20))).toBe('hard');
    expect(difficultyOf(answers(18, 20))).toBe('normal');
    expect(difficultyOf(answers(16, 20))).toBe('normal');
    expect(difficultyOf(answers(15, 20))).toBe('easy');
  });

  it('venter med at tilpasse, til der er mindst 10 svar', () => {
    expect(difficultyOf([])).toBe('normal');
    expect(difficultyOf(answers(9, 9))).toBe('normal');
    expect(difficultyOf(answers(10, 10))).toBe('hard');
  });

  it('holder vinduet på de seneste 20 svar', () => {
    let recent: boolean[] = answers(20, 20);
    recent = pushRecent(recent, false);
    expect(recent).toHaveLength(20);
    expect(accuracy(recent)).toBe(0.95);
    expect(accuracy([])).toBeNull();
  });
});

describe('Interleaving', () => {
  it('tillader højst 2 opgaver af samme type i træk', () => {
    expect(allowsKind([], 'a')).toBe(true);
    expect(allowsKind(['a'], 'a')).toBe(true);
    expect(allowsKind(['b', 'a', 'a'], 'a')).toBe(false);
    expect(allowsKind(['a', 'a'], 'b')).toBe(true);
    expect(allowsKind(['a', 'b'], 'a')).toBe(true);
  });
});

describe('correctPerMinute', () => {
  it('måler korrekte svar pr. minut med én decimal', () => {
    expect(correctPerMinute(12, 60_000)).toBe(12);
    expect(correctPerMinute(13, 65_000)).toBe(12);
    expect(correctPerMinute(7, 61_234)).toBe(6.9);
    expect(correctPerMinute(3, 0)).toBe(0);
  });
});
