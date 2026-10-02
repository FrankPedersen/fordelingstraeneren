import { describe, expect, it } from 'vitest';
import { compareFrequency } from './compare';
import { PATTERNS, patternById } from './patterns';

describe('Højere/lavere', () => {
  it('peger på det hyppigste mønster', () => {
    expect(compareFrequency(patternById('4-4-3-2'), patternById('5-3-3-2'))).toBe('a');
    expect(compareFrequency(patternById('6-4-3-0'), patternById('5-4-4-0'))).toBe('a');
    expect(compareFrequency(patternById('4-4-4-1'), patternById('5-5-2-1'))).toBe('b');
  });

  it('kalder kun 5-4-2-2/4-3-3-3 og 7-5-1-0/8-3-2-0 for ≈ (under 2 % relativ forskel)', () => {
    const equal: string[] = [];
    for (const a of PATTERNS) {
      for (const b of PATTERNS) {
        if (a.rank < b.rank || (a.rank === b.rank && a.id < b.id)) {
          if (compareFrequency(a, b) === 'equal') equal.push(`${a.id}/${b.id}`);
        }
      }
    }
    expect(equal).toEqual(['5-4-2-2/4-3-3-3', '7-5-1-0/8-3-2-0']);
  });
});
