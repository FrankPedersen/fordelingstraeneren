import { describe, expect, it } from 'vitest';
import { formatInt } from './format';

describe('formatInt', () => {
  it('bruger punktum som tusindtalsseparator', () => {
    expect(formatInt(0)).toBe('0');
    expect(formatInt(999)).toBe('999');
    expect(formatInt(1000)).toBe('1.000');
    expect(formatInt(17_971)).toBe('17.971');
    expect(formatInt(158_753_389_900)).toBe('158.753.389.900');
    expect(formatInt(-1234)).toBe('-1.234');
  });
});
