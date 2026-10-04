import { describe, expect, it } from 'vitest';
import { customItem, goalCandidates, linesForGoal } from '../analysis';
import { parseCards } from '../model/cards';
import { createSolver } from './client';
import { handleSolve } from './results';

// Specens eksempel: bordet B 4 3 2, hånden E 10 6 5. Ikke i banken.
const north = parseCards('J432'), south = parseCards('AT65');
const percent = (x: number) => Math.round(x * 1000) / 10;

describe('Løseren på forespørgsel (Analyse fase 2)', { timeout: 120_000 }, () => {
  it('regner et mål, flest stik og foreslår målene for en kombination uden for banken', () => {
    const three = handleSolve({ kind: 'goal', north, south, goal: 3 });
    if (three.kind !== 'goal') throw new Error('forkert svar');
    expect(percent(three.result.value)).toBe(37.3);
    expect(three.base).toMatchObject({ north: 'J432', south: 'AT65' });

    const tricks = handleSolve({ kind: 'tricks', north, south });
    if (tricks.kind !== 'tricks') throw new Error('forkert svar');
    const { goals, preferred } = goalCandidates(tricks.base, tricks.result);
    expect(goals).toContain(3);
    expect(goals).toContain(2);
    expect(preferred).toBe(3);

    const item = customItem(tricks.base, goals, { 3: three.result }, tricks.result);
    expect(item.combination.id).toBe('J432-AT65');
    expect(item.combination.source).toBeUndefined();
    expect(linesForGoal(item, 3)[0].value).toBeCloseTo(three.result.value, 12);
    expect(linesForGoal(item, 2)).toEqual([]);
  });

  it('regner en egen linje og afviser en ugyldig', () => {
    // Linje A fra specen: lille fra bordet mod 10'eren, derefter esset.
    const line = {
      id: 'egen',
      text: "Lille mod 10'eren, så esset",
      steps: [
        { leadFrom: 'N' as const, card: 'low', third: { ifSecondPlays: 'low', play: 'T', else: 'A' }, branches: [{ if: { fallen: ['A'] }, goto: 3 }] },
        { leadFrom: 'S' as const, card: 'A' },
      ],
    };
    const ok = handleSolve({ kind: 'line', north, south, goal: 3, line });
    if (ok.kind !== 'line' || !ok.lead) throw new Error('forkert svar');
    expect(percent(ok.lead.value)).toBe(37.3);
    expect(ok.errors).toEqual([]);
    const bad = handleSolve({ kind: 'line', north, south, goal: 3, line: { ...line, steps: [{ leadFrom: 'N', card: 'K' }] } });
    expect(bad).toMatchObject({ kind: 'line', lead: null });
    if (bad.kind !== 'line') throw new Error('forkert svar');
    expect(bad.errors.join(' ')).toMatch(/kan ikke spilles/);
  });

  it('svarer gennem klienten, også uden Web Worker', async () => {
    const solver = createSolver();
    const response = await solver.solve({ kind: 'goal', north, south, goal: 2 });
    expect(response.kind === 'goal' && percent(response.result.value)).toBe(100);
  });
});
