import { describe, expect, it } from 'vitest';
import { parseCards } from './cards';
import { canStepEntries, gameOptionsFor, isPossible, isStandard, situationFor, STANDARD, stepEntries, type Situation } from './situation';

// SPEC-forbindelser.md, leverancetrin 1: forbindelserne i situationen. Indgange null = ubegrænset, inde Nord eller Syd.

const connections = (lead: 'N' | 'S' | undefined, north: number | null, south: number | null): Situation => ({
  ...STANDARD,
  entries: { north, south },
  ...(lead ? { lead } : {}),
});

// Bordet E, hånden K D B 3 2: Nord har 1 kort og Syd 5.
const ACE = parseCards('A'), KQJ32 = parseCards('KQJ32');

describe('Forbindelserne i situationen (model)', () => {
  it('standard er ubegrænsede forbindelser; inde betyder intet, når begge hænder er ubegrænsede', () => {
    expect(STANDARD.entries).toBeUndefined();
    expect(isStandard(connections('N', null, null))).toBe(true);
    expect(isStandard(connections('S', null, null))).toBe(true);
    expect(isStandard(connections('S', 2, null))).toBe(false);
    expect(isStandard(connections(undefined, null, 0))).toBe(false);
  });

  it('indgange er 0–5 eller ubegrænset, og inde er Nord eller Syd', () => {
    for (const e of [0, 1, 2, 3, 4, 5, null]) expect(isPossible(ACE, KQJ32, connections('N', e, e))).toBe(true);
    for (const e of [-1, 6, 1.5]) {
      expect(isPossible(ACE, KQJ32, connections('N', e, null))).toBe(false);
      expect(isPossible(ACE, KQJ32, connections('N', null, e))).toBe(false);
    }
    expect(isPossible(ACE, KQJ32, { ...connections('N', 1, 1), lead: 'Ø' as 'N' })).toBe(false);
  });

  it('en hånd med mindst lige så mange indgange, som den har kort, er ubegrænset; så forsvinder forbindelserne helt', () => {
    expect(situationFor(ACE, KQJ32, connections('N', 1, 5)).entries).toBeUndefined();
    expect(situationFor(ACE, KQJ32, connections('N', 1, 5)).lead).toBeUndefined();
    expect(situationFor(ACE, KQJ32, connections('N', 0, 4)).entries).toEqual({ north: 0, south: 4 });
    expect(situationFor(ACE, KQJ32, connections('N', 3, 2)).entries).toEqual({ north: null, south: 2 });
    expect(gameOptionsFor(ACE, KQJ32, connections('N', 1, 5))).toEqual({ vacant: { west: 13, east: 13 }, splitHonors: false });
  });

  it('spillets indstillinger bærer indgangene og hånden, der er inde (standard Syd)', () => {
    expect(gameOptionsFor(ACE, KQJ32, connections('N', null, 0))).toEqual({
      vacant: { west: 13, east: 13 },
      splitHonors: false,
      entries: { north: null, south: 0 },
      lead: 'N',
    });
    expect(gameOptionsFor(ACE, KQJ32, connections(undefined, 0, 2))).toMatchObject({ entries: { north: 0, south: 2 }, lead: 'S' });
  });

  it('trinvælgeren: "ubegrænset" står over 5', () => {
    const s = connections('S', null, 0);
    expect(stepEntries(s, 'north', -1).entries).toEqual({ north: 5, south: 0 });
    expect(stepEntries(connections('S', 5, 0), 'north', 1).entries).toEqual({ north: null, south: 0 });
    expect(stepEntries(s, 'south', 1).entries).toEqual({ north: null, south: 1 });
    expect(stepEntries(STANDARD, 'south', -1).entries).toEqual({ north: null, south: 5 });
    expect(canStepEntries(ACE, KQJ32, s, 'north', 1)).toBe(false);
    expect(canStepEntries(ACE, KQJ32, s, 'north', -1)).toBe(true);
    expect(canStepEntries(ACE, KQJ32, s, 'south', -1)).toBe(false);
    expect(canStepEntries(ACE, KQJ32, s, 'south', 1)).toBe(true);
  });
});
