import { describe, expect, it } from 'vitest';
import { hentDatasaet, lavFindUdspil } from '../model/findUdspil';
import type { Niveau } from '../model/generator';
import { datasaet, NIVEAUER, PROFILER, SITUATIONER } from './hjaelp';

/*
 * Accepttest 6 i SPEC-modspil-v2.md, trin 2: genskabelse. Samme seed, niveau og profil giver samme opgave og facit, også
 * når andre opgaver er lavet imellem, og med en kopi af datasættet. Modellen ændrer ikke datasættet. Datasættet hentes
 * dovent (`hentDatasaet`) og er det samme som filerne (trin 3 indlæser det første gang, øvelse 8 bruges).
 */

const data = datasaet();
const TUNG = { timeout: 120_000 };

describe.each(PROFILER)('Genskabelse (accepttest 6): %s', (_, p) => {
  it('samme seed, niveau og profil giver samme opgave og facit, også når andre opgaver er lavet imellem', TUNG, () => {
    const kopi = structuredClone(data);
    for (const niveau of NIVEAUER) {
      for (let seed = 1; seed <= 15; seed++) {
        const a = lavFindUdspil(niveau, seed, p, data);
        lavFindUdspil(niveau, seed + 1000, p, data);
        lavFindUdspil(((niveau % 5) + 1) as Niveau, seed, p, data);
        expect(lavFindUdspil(niveau, seed, p, data), `niveau ${niveau}, seed ${seed}`).toEqual(a);
        expect(lavFindUdspil(niveau, seed, p, kopi), `niveau ${niveau}, seed ${seed}, kopi af datasættet`).toEqual(a);
      }
    }
  });

  it('modellen ændrer ikke datasættet', TUNG, () => {
    const foer = JSON.stringify(data);
    for (const niveau of NIVEAUER) for (let seed = 1; seed <= 20; seed++) lavFindUdspil(niveau, seed, p, data);
    expect(JSON.stringify(data)).toBe(foer);
  });

  it('forskellige seeds giver forskellige opgaver', TUNG, () => {
    const opgaver = new Set(Array.from({ length: 50 }, (_x, i) => lavFindUdspil(4, i + 1, p, data)).map((o) => `${o.situation}#${o.indeks}`));
    expect(opgaver.size).toBeGreaterThanOrEqual(25);
  });
});

describe('Datasættet hentes dovent', () => {
  it('hentDatasaet giver de otte situationers data som filerne', TUNG, async () => {
    const hentet = await hentDatasaet();
    expect(Object.keys(hentet).sort()).toEqual([...SITUATIONER].sort());
    for (const id of SITUATIONER) expect(hentet[id], id).toEqual(data[id]);
  });
});
