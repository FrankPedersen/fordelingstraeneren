import { describe, expect, it } from 'vitest';
import { defaultSaved, type Saved } from '../engine/storage';
import { PATTERNS } from '../domain/patterns';
import {
  currentGrade,
  dueItemKeys,
  gradeProgress,
  introduce,
  isIntroduced,
  nextNewPattern,
  unlockedPatterns,
} from './progression';

const today = '2026-10-02';
const noon = (d: number) => new Date(2026, 9, d, 12).getTime();

/** Lader alle mønstrets emner få et svar på dagen. */
function answered(saved: Saved, patternId: string, t: number): Saved {
  const items = { ...saved.items };
  for (const key of Object.keys(items)) {
    if (key.startsWith(`${patternId}:`)) items[key] = { ...items[key], log: [{ t, ok: true, ms: 1000 }] };
  }
  return { ...saved, items };
}

function inBox(saved: Saved, box: 1 | 2 | 3 | 4 | 5, grade = 'common'): Saved {
  let next = saved;
  for (const p of PATTERNS.filter((q) => q.grade === grade)) next = introduce(next, p.id, today);
  const items = { ...next.items };
  for (const key of Object.keys(items)) items[key] = { ...items[key], box, log: [{ t: noon(1), ok: true, ms: 1 }] };
  return { ...next, items };
}

describe('Progression', () => {
  it('begynder på niveau 1 med det hyppigste mønster', () => {
    const saved = defaultSaved();
    expect(currentGrade(saved)).toBe('common');
    expect(nextNewPattern(saved, today)?.id).toBe('4-4-3-2');
    expect(unlockedPatterns(saved).map((p) => p.id)).toEqual([
      '4-4-3-2',
      '5-3-3-2',
      '5-4-3-1',
      '5-4-2-2',
      '4-3-3-3',
    ]);
  });

  it('introducerer et mønster med et emne pr. færdighed i kasse 1, forfaldent i dag', () => {
    const saved = introduce(defaultSaved(), '4-4-3-2', today);
    expect(isIntroduced(saved, '4-4-3-2')).toBe(true);
    expect(Object.keys(saved.items).sort()).toEqual(['4-4-3-2:compare', '4-4-3-2:complete']);
    expect(saved.items['4-4-3-2:compare']).toEqual({ box: 1, due: today, support: 3, log: [] });
  });

  it('introducerer højst 2 nye mønstre pr. dag', () => {
    let saved = introduce(defaultSaved(), '4-4-3-2', today);
    expect(nextNewPattern(saved, today)?.id).toBe('5-3-3-2');
    saved = introduce(saved, '5-3-3-2', today);
    expect(nextNewPattern(saved, today)).toBeNull();
    saved = answered(answered(saved, '4-4-3-2', noon(2)), '5-3-3-2', noon(2));
    expect(nextNewPattern(saved, today)).toBeNull();
    expect(nextNewPattern(saved, '2026-10-03')?.id).toBe('5-4-3-1');
  });

  it('låser næste grad op, når alle emner i graden står i kasse 3 eller højere', () => {
    expect(currentGrade(inBox(defaultSaved(), 2))).toBe('common');
    const done = inBox(defaultSaved(), 3);
    expect(currentGrade(done)).toBe('uncommon');
    expect(nextNewPattern(done, today)?.id).toBe('6-3-2-2');
    expect(unlockedPatterns(done)).toHaveLength(10);
  });

  it('viser fremdriften på det aktuelle niveau', () => {
    const saved = introduce(defaultSaved(), '4-4-3-2', today);
    expect(gradeProgress(saved)).toEqual({
      grade: 'common',
      level: 1,
      introduced: 1,
      patterns: 5,
      itemsDone: 0,
      items: 10,
    });
  });

  it('ordner forfaldne emner efter kasse og forfaldsdato', () => {
    const saved = defaultSaved();
    saved.items = {
      '4-4-3-2:compare': { box: 2, due: '2026-10-01', support: 2, log: [] },
      '5-3-3-2:compare': { box: 1, due: '2026-10-02', support: 3, log: [] },
      '5-4-3-1:complete': { box: 1, due: '2026-09-30', support: 3, log: [] },
      '5-4-2-2:complete': { box: 1, due: '2026-10-03', support: 3, log: [] },
      '4-3-3-3:rank': { box: 1, due: '2026-09-01', support: 3, log: [] },
      'ukendt:compare': { box: 1, due: '2026-09-01', support: 3, log: [] },
    };
    expect(dueItemKeys(saved, today)).toEqual([
      '5-4-3-1:complete',
      '5-3-3-2:compare',
      '4-4-3-2:compare',
    ]);
  });
});
