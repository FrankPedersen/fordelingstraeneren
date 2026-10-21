import { describe, expect, it } from 'vitest';
import { bankItem } from '../testBank';
import { buildGame, type Objective } from './game';
import { solveGame } from './solve';

// SPEC-forbindelser.md, leverancetrin 1: flere indgange giver aldrig en lavere chance. I sin egen fil, så den kører
// samtidig med de andre tests af forbindelserne.

describe('Forbindelser i løseren (SPEC-forbindelser.md)', { timeout: 120_000 }, () => {
  // Flere indgange giver aldrig en lavere chance: 10 kombinationer fra banken med hovedmålet og indgange 0–3 til hver hånd.
  // En hånd med mindst lige så mange indgange, som den har kort, er ubegrænset; det samme spil regnes kun én gang.
  const MONOTONE = ['432-AQ65', '432-AQ765', '432-AKJ5', '432-AQ5', '432-K765', '2-Q543', 'J2-Q43', 'J32-AQ4', 'AK2-J543', '2-AKQ43'];
  // Løserens tolerance: en ren linje er certificeret inden for 0,002 procentpoint, blandet spil inden for 0,01.
  const tolerance = 1e-4;
  it.each(MONOTONE)('flere indgange giver aldrig en lavere chance: %s, indgange 0–3', (id) => {
    const item = bankItem(id);
    const objective: Objective = { kind: 'goal', goal: item.combination.goals[0] };
    const solved = new Map<string, number>();
    const value = (lead: 'N' | 'S', north: number, south: number) => {
      const entries = { north: north >= item.north.length ? null : north, south: south >= item.south.length ? null : south };
      const key = entries.north === null && entries.south === null ? 'ubegrænset' : `${lead} ${entries.north} ${entries.south}`;
      if (!solved.has(key)) solved.set(key, solveGame(buildGame(item.north, item.south, { objective, entries, lead })).value);
      return solved.get(key)!;
    };
    for (const lead of ['N', 'S'] as const) {
      for (let north = 0; north <= 3; north++) {
        for (let south = 0; south <= 3; south++) {
          const at = `${id} ${lead} inde, Nord ${north}, Syd ${south}`;
          if (north < 3) expect(value(lead, north + 1, south), at).toBeGreaterThanOrEqual(value(lead, north, south) - tolerance);
          if (south < 3) expect(value(lead, north, south + 1), at).toBeGreaterThanOrEqual(value(lead, north, south) - tolerance);
        }
      }
    }
  });
});
