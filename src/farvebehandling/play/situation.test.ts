import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../engine/rng';
import { KING } from '../model/cards';
import { handleSolve } from '../solver/results';
import { bankItem } from '../testBank';
import { situationItem } from '../ui/Situationspanel';
import { dealCards } from './play';

// SPEC-analyse-situation.md, leverancetrin 2: Spil den selv, åbnet fra Analyse med en situation, trækker kun sidninger,
// der er mulige i situationen, med situationens vægte.

describe('Spil den selv med en situation', () => {
  it('giver kun mulige sidninger, med situationens chancer', { timeout: 60_000 }, () => {
    // E D B 7 6 / 5 4 3 2, Vest maks. 0 hp: kongen sidder altid hos Øst.
    const item = bankItem('5432-AQJ76');
    const goal = item.combination.goals[0];
    const situation = { known: { west: 3, east: 0 }, maxHp: { west: 0, east: 10 } };
    const response = handleSolve({ kind: 'goal', north: item.north, south: item.south, goal, situation });
    if (response.kind !== 'goal') throw new Error('forkert svar');
    const view = situationItem(item, goal, response.base, response.result);
    const den = Number(view.solution.denominator);
    const expected = view.solution.layouts.map((l) => Number(l.weight) / den);
    const counts = expected.map(() => 0);
    const rng = mulberry32(7);
    const N = 4000;
    for (let i = 0; i < N; i++) {
      const deal = dealCards(view, rng);
      expect(deal.west).not.toContain(KING);
      counts[deal.layout]++;
    }
    counts.forEach((c, L) => {
      if (expected[L] === 0) expect(c).toBe(0);
      else expect(Math.abs(c / N - expected[L])).toBeLessThan(0.03);
    });
  });
});
