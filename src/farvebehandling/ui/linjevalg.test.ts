import { describe, expect, it } from 'vitest';
import { bandFields, linesForGoal } from '../analysis';
import { TEST_BANK } from '../testBank';
import { allLinesForGoal, uniqueWinners } from './linjevalg';

// SPEC-analyse-situation.md, leverancetrin 4: Vis alle udspil, Sammenlign og unikke vindere.

describe('Valg af linjer', () => {
  it('Vis alle udspil: alle første udspil i løserens resultat, bedste først, også dem med 0 %', () => {
    let withZero = 0;
    for (const item of TEST_BANK.slice(0, 120)) {
      for (const goal of item.combination.goals) {
        const g = item.solution.goals[String(goal)];
        const all = allLinesForGoal(item, goal);
        expect(all).toHaveLength(g.leads.length);
        expect(all[0].best).toBe(true);
        for (let i = 1; i < all.length; i++) expect(all[i].value).toBeLessThanOrEqual(all[i - 1].value + 1e-12);
        // De viste linjer har samme bogstav som i dag.
        for (const shown of linesForGoal(item, goal)) expect(all.find((l) => l.lead === shown.lead)?.letter).toBe(shown.letter);
        if (all.some((l) => l.value === 0)) withZero++;
      }
    }
    expect(withZero).toBeGreaterThan(0);
  });

  it('Sammenlign: linje A\'s unikke vindere minus linje B\'s er forskellen mellem linjernes chance', () => {
    let pairs = 0;
    for (const item of TEST_BANK.slice(0, 200)) {
      for (const goal of item.combination.goals) {
        const lines = allLinesForGoal(item, goal).filter((l) => l.lead.certified);
        for (let i = 0; i < lines.length; i++) {
          for (let j = i + 1; j < lines.length; j++) {
            const a = lines[i], b = lines[j];
            const u = uniqueWinners(bandFields(item, [a, b]), 0, 1);
            // Appens data har chancen med 6 betydende cifre; forskellen mellem to afrundede tal er højst 0,00001 forkert.
            expect(Math.abs(u.a.probability - u.b.probability - (a.value - b.value))).toBeLessThanOrEqual(1e-5 + 1e-12);
            pairs++;
          }
        }
      }
    }
    expect(pairs).toBeGreaterThan(100);
  });

  it('unikke vindere tæller sidningerne (båndets felter), hvor kun den ene linje når målet', () => {
    const item = TEST_BANK.find((b) => b.combination.id === 'J432-AT65') ?? TEST_BANK.find((b) => allLinesForGoal(b, b.combination.goals[0]).length >= 2)!;
    const goal = item.combination.goals[0];
    const [a, b] = allLinesForGoal(item, goal);
    const fields = bandFields(item, [a, b]);
    const u = uniqueWinners(fields, 0, 1);
    expect(u.a.count).toBe(fields.filter((f) => f.outcomes[0] > 0 && f.outcomes[1] === 0).length);
    expect(u.b.count).toBe(fields.filter((f) => f.outcomes[1] > 0 && f.outcomes[0] === 0).length);
  });
});
