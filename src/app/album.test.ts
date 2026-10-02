import { describe, expect, it } from 'vitest';
import { defaultSaved } from '../engine/storage';
import { patternById } from '../domain/patterns';
import { albumByGrade, isRareFind, legendaryQuiz, registerHand, unlockLegendary } from './album';

const today = '2026-10-02';

describe('Album', () => {
  it('samler et mønster første gang, det optræder i en tilfældig hånd, og tæller videre', () => {
    const first = registerHand(defaultSaved(), '6-3-3-1', today);
    expect(first.first).toBe(true);
    expect(first.saved.album['6-3-3-1']).toEqual({ first: today, count: 1 });
    const again = registerHand(first.saved, '6-3-3-1', '2026-10-05');
    expect(again.first).toBe(false);
    expect(again.saved.album['6-3-3-1']).toEqual({ first: today, count: 2 });
  });

  it('har 39 pladser i fem grader', () => {
    const grades = albumByGrade(registerHand(defaultSaved(), '4-4-3-2', today).saved);
    expect(grades.map((g) => g.slots.length)).toEqual([5, 5, 3, 11, 15]);
    expect(grades[0].slots[0]).toMatchObject({ pattern: { id: '4-4-3-2' }, entry: { count: 1 } });
    expect(grades[0].slots[1].entry).toBeUndefined();
  });

  it('fejrer de episke og legendariske fund', () => {
    expect(isRareFind(patternById('8-3-2-0'))).toBe(true);
    expect(isRareFind(patternById('7-6-0-0'))).toBe(true);
    expect(isRareFind(patternById('5-4-4-0'))).toBe(false);
  });
});

describe('Legendariske pladser', () => {
  it('kan låses op med tre spørgsmål: grad, størrelsesorden af "1 ud af N" og placeringer', () => {
    const quiz = legendaryQuiz(patternById('7-6-0-0'), 1);
    expect(quiz.map((q) => q.answer)).toEqual(['legendarisk', '1 ud af 10.000–99.999', '12']);
    for (const q of quiz) expect(q.options).toContain(q.answer);
    expect(quiz[1].options).toHaveLength(4);
    expect(legendaryQuiz(patternById('13-0-0-0'), 7)[1].answer).toBe('1 ud af 100.000.000.000–999.999.999.999');
  });

  it('låser kun legendariske pladser op og rører ikke et mønster, der allerede er samlet', () => {
    const unlocked = unlockLegendary(defaultSaved(), '7-6-0-0', today);
    expect(unlocked.album['7-6-0-0']).toEqual({ first: today, count: 0 });
    expect(unlockLegendary(defaultSaved(), '5-4-4-0', today).album).toEqual({});
    const seen = registerHand(defaultSaved(), '7-6-0-0', '2026-09-01').saved;
    expect(unlockLegendary(seen, '7-6-0-0', today).album['7-6-0-0']).toEqual({ first: '2026-09-01', count: 1 });
  });
});
