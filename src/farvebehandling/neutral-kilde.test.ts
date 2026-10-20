import { describe, expect, it } from 'vitest';
import whatNowText from './content/hvad-nu.json?raw';
import solutionsText from './content/solutions.json?raw';
import bankText from './content/suit-combinations.json?raw';
import { appEntry, type AppEntry, type Combination, type CombinationSolution } from './precompute';
import textsSource from './ui/texts.ts?raw';
import type { WhatNowData } from './whatnowReport';

// SPEC-neutral-kilde.md, accepttest: appens tekster og data omtaler kilden neutralt. Udviklerfilerne (suit-combinations.json,
// solutions.json, hvad-nu.json) er uændrede og bruges her som facit for appens data.
const appFiles = import.meta.glob<string>('./content/app/side-*.json', { eager: true, query: '?raw', import: 'default' });
const entries = Object.values(appFiles).flatMap((text) => (JSON.parse(text) as { combinations: AppEntry[] }).combinations);
const bank = new Map((JSON.parse(bankText) as { combinations: Combination[] }).combinations.map((c) => [c.id, c]));
const solutions = (JSON.parse(solutionsText) as { combinations: Record<string, CombinationSolution> }).combinations;
const whatNow = (JSON.parse(whatNowText) as { combinations: WhatNowData }).combinations;

describe('Neutral kilde (SPEC-neutral-kilde.md)', () => {
  it('texts.ts indeholder ikke "bridgehands" på dansk eller engelsk', () => {
    expect(textsSource.match(/bridgehands/i)?.[0]).toBeUndefined();
  });

  it('app/side-N.json har ingen source.name; source.values og verified er de samme som i udviklerfilen', () => {
    expect(entries).toHaveLength(657);
    let withSource = 0;
    for (const entry of entries) {
      const source = entry.combination.source;
      if (source) {
        withSource++;
        expect(Object.keys(source), entry.combination.id).toEqual(['values']);
      }
      const { lines: _lines, source: original, ...meta } = bank.get(entry.combination.id)!;
      expect(entry.combination, entry.combination.id).toEqual({ ...meta, ...(original ? { source: { values: original.values } } : {}) });
    }
    expect(withSource).toBe(657);
  });

  it('app/side-N.json er præcis appEntry af de uændrede udviklerfiler: samme kombinationer, rækkefølge, hyppighed og løsninger', () => {
    for (const entry of entries) {
      const id = entry.combination.id;
      const frequency = { num: BigInt(entry.frequency[0]), den: BigInt(entry.frequency[1]) };
      const expected = appEntry(entry.rank, frequency, bank.get(id)!, solutions[id], whatNow[id]);
      expect(entry, id).toEqual(JSON.parse(JSON.stringify(expected)));
    }
  }, 30_000);
});
