import { describe, expect, it } from 'vitest';
import page from './content/bridgehands-damen-mangler.json';
import csv from './content/damen-mangler-hyppighed.csv?raw';
import solutionsText from './content/solutions.json?raw';
import bankText from './content/suit-combinations.json?raw';
import techniquesFile from './content/techniques.json';
import techniquesText from './content/teknikker-damen-mangler.md?raw';
import report from './content/validering-damen-mangler.md?raw';
import { formatDecimal } from '../engine/format';
import { percentOf } from './model/fraction';
import { oncePerDeals } from './model/frequency';
import { frequencyRows, type Combination, type CombinationSolution } from './precompute';
import { classifyCases, type SourceCase } from './source/bridgehands';
import { proposeTechnique, techniquesReport } from './techniques';

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

  it('giver hver kombination teknikken fra forslaget, og listen til godkendelse er opdateret', () => {
    const ids = techniquesFile.techniques.map((t) => t.id);
    for (const b of bank) {
      expect(ids, b.id).toContain(b.technique);
      expect(b.technique, b.id).toBe(proposeTechnique(b.north, b.south, b.goals, solutions[b.id]).technique);
    }
    expect(techniquesReport(bank, solutions, techniquesFile.techniques)).toBe(techniquesText);
  });

  it('foreslår teknikker, der passer med linjerne', () => {
    const technique = (id: string) => bank.find((b) => b.id === id)!.technique;
    // E K 5 4 / B 3 2: lille fra hånden mod knægten, der står uden støtte.
    expect(technique('J32-AK54')).toBe('spil-mod-honnoer');
    // E K B 5 / 4 3 2 til 3 stik: esset og kongen først; linjen med flest stik giver kun 69,0 %.
    expect(technique('432-AKJ5')).toBe('sikkerhedsspil');
    // B 7 6 5 4 / E K 3 2: ni kort, esset og kongen.
    expect(technique('AK32-J7654')).toBe('fald-eller-kip');
    // E K B 9 / 3 2: 9'eren først mod damen og 10'eren.
    expect(technique('32-AKJ9')).toBe('dobbelt-kipning');
    // E K 3 2 / B 10 9: knægten løber.
    expect(technique('JT9-AK32')).toBe('enkelt-kipning');
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
