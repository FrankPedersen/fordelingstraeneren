/** Seedbar pseudotilfældig talgenerator. */
export interface Rng {
  /** Næste heltal i [0, 2^32). */
  uint32(): number;
  /** Næste tal i [0, 1). */
  next(): number;
  /** Et heltal i [0, n), præcis ligefordelt. */
  int(n: number): number;
}

/** mulberry32: 32-bit tilstand, så samme seed altid giver samme talrække. */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  const uint32 = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
  return {
    uint32,
    next: () => uint32() / 2 ** 32,
    int(n) {
      // Afvis værdier over det største multiplum af n, så modulo ikke skævvrider fordelingen.
      const limit = 2 ** 32 - (2 ** 32 % n);
      let x = uint32();
      while (x >= limit) x = uint32();
      return x % n;
    },
  };
}

/** Fisher–Yates: blander arrayet på stedet og returnerer det. */
export function shuffle<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
