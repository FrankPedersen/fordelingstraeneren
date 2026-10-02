import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../engine/rng';
import { suitLengths } from './cards';
import { SEATS, deal, dealWith } from './dealer';
import { patternOf } from './patterns';

describe('Kortgiver – accepttest', () => {
  it('100.000 hænder på fast seed giver 4-4-3-2 i 21,55 % ± 0,4 procentpoint', () => {
    const rng = mulberry32(20261002);
    let hands = 0;
    let hits = 0;
    while (hands < 100_000) {
      const deal = dealWith(rng);
      for (const seat of SEATS) {
        hands++;
        if (patternOf(suitLengths(deal[seat])).id === '4-4-3-2') hits++;
      }
    }
    expect(hands).toBe(100_000);
    expect(Math.abs((hits / hands) * 100 - 21.55)).toBeLessThanOrEqual(0.4);
  });
});

describe('Kortgiver', () => {
  it('giver fire hænder á 13 kort, hvor alle 52 kort optræder præcis én gang', () => {
    const hands = deal(1);
    for (const seat of SEATS) expect(hands[seat]).toHaveLength(13);
    const all = SEATS.flatMap((seat) => hands[seat]).sort((a, b) => a - b);
    expect(all).toEqual(Array.from({ length: 52 }, (_, i) => i));
  });

  it('genskaber samme fordeling ud fra samme seed', () => {
    expect(deal(2026)).toEqual(deal(2026));
    expect(deal(2026)).not.toEqual(deal(2027));
  });

  it('giver altid den samme fordeling for seed 1', () => {
    // Opgaver genskabes ud fra deres seed, så kortgiverens output må ikke ændre sig mellem versioner.
    expect(deal(1)).toEqual({
      N: [8, 0, 9, 3, 33, 22, 1, 43, 51, 4, 24, 31, 13],
      E: [5, 34, 23, 35, 44, 38, 10, 19, 26, 20, 28, 47, 14],
      S: [18, 25, 50, 17, 46, 11, 48, 7, 41, 30, 21, 2, 29],
      W: [42, 32, 6, 49, 16, 40, 12, 39, 27, 36, 37, 45, 15],
    });
  });

  it('tæller farvelængder i farveordenen ♠♥♦♣', () => {
    // Kort 0–12 er spar, 13–25 hjerter, 26–38 ruder og 39–51 klør.
    expect(suitLengths([0, 12, 13, 26, 27, 28, 39, 40, 41, 42, 43, 44, 51])).toEqual([2, 1, 3, 7]);
  });
});
