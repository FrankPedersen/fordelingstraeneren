import { describe, expect, it } from 'vitest';
import { mulberry32, shuffle } from './rng';

describe('mulberry32', () => {
  it('matcher referenceimplementeringen', () => {
    // De første 32-bit værdier fra den kanoniske mulberry32 (bryc, "PRNGs in JavaScript").
    const reference: [number, number[]][] = [
      [0, [1144304738, 1416247, 958946056, 627933444]],
      [1, [2693262067, 11749833, 2265367787, 4213581821]],
      [123456789, [1107202814, 4169434471, 3372958138, 885470128]],
    ];
    for (const [seed, expected] of reference) {
      const rng = mulberry32(seed);
      expect(expected.map(() => rng.uint32()), `seed ${seed}`).toEqual(expected);
    }
  });

  it('next() ligger i [0, 1) og er uint32 / 2^32', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const x = a.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      expect(x).toBe(b.uint32() / 2 ** 32);
    }
  });

  it('int(n) giver alle heltal i [0, n) lige ofte', () => {
    const rng = mulberry32(7);
    const counts = new Array<number>(6).fill(0);
    for (let i = 0; i < 60_000; i++) counts[rng.int(6)]++;
    // Forventet 10.000 hver; spredningen er ca. 91.
    for (const c of counts) expect(Math.abs(c - 10_000)).toBeLessThan(400);
  });
});

describe('shuffle (Fisher–Yates)', () => {
  it('bevarer elementerne og blander på stedet', () => {
    const items = Array.from({ length: 52 }, (_, i) => i);
    const result = shuffle(items, mulberry32(3));
    expect(result).toBe(items);
    expect([...result].sort((a, b) => a - b)).toEqual(Array.from({ length: 52 }, (_, i) => i));
  });

  it('giver alle 6 permutationer af tre elementer lige ofte', () => {
    const rng = mulberry32(11);
    const counts = new Map<string, number>();
    for (let i = 0; i < 60_000; i++) {
      const key = shuffle(['a', 'b', 'c'], rng).join('');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(6);
    for (const c of counts.values()) expect(Math.abs(c - 10_000)).toBeLessThan(400);
  });
});
