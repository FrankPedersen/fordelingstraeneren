import { describe, expect, it } from 'vitest';
import { addDays, dayOf, daysBetween, isoWeek } from './dates';

const at = (y: number, m: number, d: number, h: number, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime();

describe('dayOf', () => {
  it('skifter dag kl. 04 lokal tid', () => {
    expect(dayOf(at(2026, 10, 2, 3, 59))).toBe('2026-10-01');
    expect(dayOf(at(2026, 10, 2, 4, 0))).toBe('2026-10-02');
    expect(dayOf(at(2026, 10, 1, 0, 30))).toBe('2026-09-30');
    expect(dayOf(at(2026, 1, 1, 2))).toBe('2025-12-31');
  });

  it('kan bruge en anden skæringstime', () => {
    expect(dayOf(at(2026, 10, 2, 3), 0)).toBe('2026-10-02');
  });
});

describe('addDays og daysBetween', () => {
  it('regner i kalenderdage hen over måneder, år og sommertid', () => {
    expect(addDays('2026-10-02', 1)).toBe('2026-10-03');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
    expect(daysBetween('2026-10-02', '2026-09-30')).toBe(-2);
  });
});

describe('isoWeek', () => {
  it('giver kalenderugen fra mandag til søndag', () => {
    expect(isoWeek('2026-09-27')).toBe('2026-W39');
    expect(isoWeek('2026-09-28')).toBe('2026-W40');
    expect(isoWeek('2026-10-02')).toBe('2026-W40');
    expect(isoWeek('2026-10-04')).toBe('2026-W40');
    expect(isoWeek('2026-10-05')).toBe('2026-W41');
  });

  it('håndterer uger hen over årsskiftet', () => {
    expect(isoWeek('2025-12-29')).toBe('2026-W01');
    expect(isoWeek('2027-01-01')).toBe('2026-W53');
    expect(isoWeek('2027-01-04')).toBe('2027-W01');
  });
});
