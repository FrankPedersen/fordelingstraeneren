import { describe, expect, it } from 'vitest';
import { completeDay, emptyStreak, streakOn, type Streak } from './streak';

// Uge 40 i 2026 går fra mandag 28/9 til søndag 4/10.
const run = (days: string[], start: Streak = emptyStreak()) =>
  days.reduce((s, day) => completeDay(s, day), start);

describe('Streak – accepttest', () => {
  it('bruger jokeren højst én gang pr. kalenderuge', () => {
    const tueMissed = run(['2026-09-28', '2026-09-30']);
    expect(tueMissed).toMatchObject({ current: 2, jokerWeek: '2026-W40' });
    const thuMissed = completeDay(tueMissed, '2026-10-02');
    expect(thuMissed).toMatchObject({ current: 1, best: 2, jokerWeek: '2026-W40' });
  });
});

describe('Streak', () => {
  it('tæller en dag, når en session er gennemført, og kun én gang pr. dag', () => {
    const first = completeDay(emptyStreak(), '2026-09-28');
    expect(first).toEqual({ current: 1, best: 1, lastDay: '2026-09-28' });
    expect(completeDay(first, '2026-09-28')).toBe(first);
    expect(completeDay(first, '2026-09-29')).toMatchObject({ current: 2, best: 2 });
  });

  it('dækker en glemt dag i en ny uge med ugens joker', () => {
    const usedInW40: Streak = { current: 5, best: 5, lastDay: '2026-10-04', jokerWeek: '2026-W40' };
    expect(completeDay(usedInW40, '2026-10-06')).toMatchObject({ current: 6, jokerWeek: '2026-W41' });
  });

  it('dækker to glemte dage i hver sin uge med hver sin joker', () => {
    const s = run(['2026-10-03', '2026-10-06']);
    expect(s).toMatchObject({ current: 2, jokerWeek: '2026-W41' });
  });

  it('bryder streaken ved tre glemte dage i træk og bevarer rekorden', () => {
    const s = run(['2026-09-26', '2026-09-27', '2026-09-28', '2026-10-02']);
    expect(s).toMatchObject({ current: 1, best: 3 });
    expect(s.jokerWeek).toBeUndefined();
  });
});

describe('streakOn', () => {
  const s = run(['2026-09-28', '2026-09-29']);

  it('viser streaken, så længe den kan nås', () => {
    expect(streakOn(s, '2026-09-29')).toEqual({ current: 2, jokerUsedThisWeek: false });
    expect(streakOn(s, '2026-09-30')).toEqual({ current: 2, jokerUsedThisWeek: false });
  });

  it('regner med en joker, der bliver brugt, når næste session gennemføres', () => {
    expect(streakOn(s, '2026-10-01')).toEqual({ current: 2, jokerUsedThisWeek: true });
  });

  it('viser 0, når streaken er brudt', () => {
    expect(streakOn(s, '2026-10-02')).toEqual({ current: 0, jokerUsedThisWeek: false });
    expect(streakOn(emptyStreak(), '2026-10-02').current).toBe(0);
  });
});
