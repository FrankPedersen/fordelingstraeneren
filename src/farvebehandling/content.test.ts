import { describe, expect, it } from 'vitest';
import page from './content/bridgehands-damen-mangler.json';
import csv from './content/damen-mangler-hyppighed.csv?raw';
import solutionsText from './content/solutions.json?raw';
import bankText from './content/suit-combinations.json?raw';
import techniquesFile from './content/techniques.json';
import report from './content/validering-damen-mangler.md?raw';
import { formatDecimal } from '../engine/format';
import { percentOf } from './model/fraction';
import { oncePerDeals } from './model/frequency';
import { frequencyRows, type Combination, type CombinationSolution } from './precompute';
import { classifyCases, type SourceCase } from './source/bridgehands';

const cases = classifyCases(page.cases as SourceCase[]);
const rows = frequencyRows(cases);
const csvRows = csv
  .trim()
  .split('\n')
  .slice(1)
  .map((line) => line.split(';'));
// De store filer læses som tekst, så tsc ikke skal udlede en type for dem.
const solutions = (JSON.parse(solutionsText) as { combinations: Record<string, CombinationSolution> }).combinations;
const bank = (JSON.parse(bankText) as { combinations: Combination[] }).combinations;

describe('Hyppighed for siden "damen mangler"', () => {
  it('kan genberegnes præcist af appen, og rangordenen er den samme', () => {
    expect(csvRows).toHaveLength(rows.length);
    rows.forEach((row, i) => {
      const [number, , , , pct, once, , rank] = csvRows[i];
      expect(Number(number)).toBe(row.case.number);
      expect(pct).toBe(row.frequency ? formatDecimal(percentOf(row.frequency, 4), 4) : '');
      expect(once).toBe(row.frequency ? String(oncePerDeals(row.frequency)) : '');
      expect(rank).toBe(row.rank ? String(row.rank) : '');
    });
  });

  it('giver specens top 10', () => {
    const top = rows.filter((r) => r.rank > 0 && r.rank <= 10).sort((a, b) => a.rank - b.rank);
    expect(top.map((r) => r.case.number)).toEqual([40, 44, 13, 33, 48, 28, 34, 20, 90, 46]);
    expect(top.map((r) => oncePerDeals(r.frequency!))).toEqual([134, 134, 201, 201, 201, 246, 362, 368, 413, 603]);
  });
});

describe('Opgavebanken', () => {
  it('indeholder de brugbare cases i hyppighedsorden', () => {
    const usable = rows.filter((r) => r.rank > 0).sort((a, b) => a.rank - b.rank);
    expect(bank.map((b) => b.source?.name)).toEqual(usable.map((r) => `bridgehands.com, Suit Combinations 2, case ${r.case.number}`));
  });

  it('har en løsning for hvert mål', () => {
    for (const b of bank) {
      const s = solutions[b.id];
      expect(s, b.id).toBeDefined();
      for (const goal of b.goals) expect(s.goals[String(goal)].leads.length, `${b.id} ${goal}`).toBeGreaterThan(0);
    }
  });

  it('sætter verified, når løserens tal stemmer med kilden inden for 0,5 procentpoint', () => {
    for (const b of bank) {
      const s = solutions[b.id];
      const ok = b.goals.every((g) => Math.abs(100 * s.goals[String(g)].value - b.source!.values[String(g)]) <= 0.5);
      expect(b.verified, b.id).toBe(ok);
    }
  });

  it('har seks teknikker med huskeregel og standardbillede', () => {
    expect(techniquesFile.techniques.map((t) => t.name)).toEqual([
      'Enkelt kipning', 'Fald eller kip', 'Spil mod honnør', 'Dobbelt kipning', 'Sikkerhedsspil', 'Begrænset valg',
    ]);
    for (const t of techniquesFile.techniques) {
      expect(t.rule.length).toBeGreaterThan(10);
      expect(t.image.length).toBeGreaterThan(5);
    }
  });
});

describe('Valideringsrapporten', () => {
  it('dækker alle brugbare cases med begge fortolkninger af x, også med 8 manglende kort', () => {
    const all = report.split('## Alle brugbare cases')[1];
    const usable = cases.filter((c) => c.usable);
    const goals = usable.reduce((n, c) => n + c.needs.length, 0);
    expect(all.split('\n').filter((l) => /^\| \d+ \|/.test(l))).toHaveLength(goals);
    for (const c of usable) expect(all).toContain(`| ${c.number} |`);
    // Case 1 og 2: fem kort over for renonce, 8 manglende kort.
    expect(usable.some((c) => c.hand.length + c.dummy.length === 5)).toBe(true);
    expect(report).toMatch(/Fortolkning "lav"/);
    expect(report).toMatch(/Fortolkning "høj"/);
  });
});
