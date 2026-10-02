import { describe, expect, it } from 'vitest';
import { patternById } from '../../domain/patterns';
import { checkPalace, makePalaceTask, type PalaceTask } from './task';

const seeds = Array.from({ length: 100 }, (_, i) => i + 1);

describe('Paladsvandring – opgaver', () => {
  it('genskabes ud fra sit seed', () => {
    const p = patternById('5-4-3-1');
    expect(makePalaceTask(4, p, 'normal')).toEqual(makePalaceTask(4, p, 'normal'));
  });

  it('går begge veje ved normal sværhed', () => {
    const directions = new Set(seeds.map((s) => makePalaceTask(s, patternById('6-3-2-2'), 'normal').direction));
    expect(directions).toEqual(new Set(['to-pattern', 'to-station']));
  });

  it('beder om stationen, når det skal være let, og om mønstret, når det skal være svært', () => {
    for (const seed of seeds) {
      expect(makePalaceTask(seed, patternById('5-4-2-2'), 'easy').direction).toBe('to-station');
      expect(makePalaceTask(seed, patternById('5-4-2-2'), 'hard').direction).toBe('to-pattern');
    }
  });

  it('spørger kun efter rummet for de episke mønstre på Loftet', () => {
    for (const seed of seeds) {
      expect(makePalaceTask(seed, patternById('7-4-1-1'), 'hard').direction).toBe('to-station');
    }
    expect(() => makePalaceTask(1, patternById('7-6-0-0'), 'normal')).toThrow();
  });

  it('godkender mønstret ved stationen og stationen for mønstret', () => {
    const toPattern: PalaceTask = { kind: 'palace', seed: 1, patternId: '6-4-2-1', direction: 'to-pattern' };
    expect(checkPalace(toPattern, { pattern: '6-4-2-1' })).toBe(true);
    expect(checkPalace(toPattern, { pattern: '6-3-3-1' })).toBe(false);
    const toStation: PalaceTask = { ...toPattern, direction: 'to-station' };
    expect(checkPalace(toStation, { place: 7 })).toBe(true);
    expect(checkPalace(toStation, { place: 8 })).toBe(false);
    const loft: PalaceTask = { ...toStation, patternId: '5-5-3-0' };
    expect(checkPalace(loft, { place: 'loft' })).toBe(true);
    expect(checkPalace(loft, { place: 13 })).toBe(false);
  });
});
