import { describe, expect, it } from 'vitest';
import page2 from './content/bridgehands-side-2.json';
import csv from './content/damen-mangler-hyppighed.csv?raw';
import allCsv from './content/hyppighed.csv?raw';
import whatNowText from './content/hvad-nu.json?raw';
import sourceErrorsText from './content/kildefejl.json?raw';
import whatNowMd from './content/hvad-nu.md?raw';
import solutionsText from './content/solutions.json?raw';
import bankText from './content/suit-combinations.json?raw';
import techniquesFile from './content/techniques.json';
import techniquesText from './content/teknikker.md?raw';
import { formatDecimal } from '../engine/format';
import { percentOf } from './model/fraction';
import { oncePerDeals } from './model/frequency';
import { plausible } from './model/whatnow';
import { applySourceErrors, frequencyCsv, frequencyRows, type AppEntry, type Combination, type CombinationSolution, type SourceError } from './precompute';
import { caseLabel, classifyCases, classifyPages, type SourceCase, type SourcePage } from './source/bridgehands';
import { proposeTechnique, techniquesReport } from './techniques';
import { whatNowReport, type WhatNowData } from './whatnowReport';

const sourcePages = Object.values(
  import.meta.glob<SourcePage>('./content/bridgehands-side-*.json', { eager: true, import: 'default' }),
).sort((a, b) => a.number - b.number);
const reports = import.meta.glob<string>('./content/validering-side-*.md', { eager: true, query: '?raw', import: 'default' });
const appFiles = import.meta.glob<string>('./content/app/side-*.json', { eager: true, query: '?raw', import: 'default' });

/** Git kan skrive filerne med CRLF på Windows; rapporterne laves med LF. */
const lf = (text: string) => text.replace(/\r\n/g, '\n');

const cases = classifyCases(page2.cases as SourceCase[]);
const rows = frequencyRows(cases);
const csvRows = csv
  .trim()
  .split('\n')
  .slice(1)
  .map((line) => line.split(';'));
// Fejl i kilden (genereret af scripts/solve.ts): målene fjernes, og en case uden mål sorteres fra.
const sourceErrors = (JSON.parse(sourceErrorsText) as { goals: SourceError[] }).goals;
const allRows = frequencyRows(applySourceErrors(classifyPages(sourcePages), sourceErrors));
// De store filer læses som tekst, så tsc ikke skal udlede en type for dem.
const solutions = (JSON.parse(solutionsText) as { combinations: Record<string, CombinationSolution> }).combinations;
const bank = (JSON.parse(bankText) as { combinations: Combination[] }).combinations;
const whatNow = (JSON.parse(whatNowText) as { combinations: WhatNowData }).combinations;

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

describe('Hyppighed på tværs af siderne 0–9', () => {
  it('har alle ti sider fra bridgehands.com', () => {
    expect(sourcePages.map((p) => p.number)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(sourcePages[2].cases).toEqual(page2.cases);
  });

  it('kan genberegnes præcist af appen', () => {
    expect(frequencyCsv(allRows, { pages: true })).toBe(lf(allCsv));
  });
});

describe('Opgavebanken', () => {
  it('indeholder alle brugbare cases fra siderne 0–9 i hyppighedsorden', () => {
    const usable = allRows.filter((r) => r.rank > 0).sort((a, b) => a.rank - b.rank);
    expect(bank.map((b) => b.source?.name)).toEqual(
      usable.map((r) => `bridgehands.com, Suit Combinations ${r.case.page}, case ${caseLabel(r.case)}`),
    );
    expect(new Set(bank.map((b) => b.id)).size).toBe(bank.length);
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
      expect(b.technique, b.id).toBe(proposeTechnique(b.north, b.south, b.goals, solutions[b.id], whatNow[b.id]).technique);
    }
    expect(techniquesReport(bank, solutions, techniquesFile.techniques, whatNow)).toBe(lf(techniquesText));
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

describe('Appens data', () => {
  const entries = Object.values(appFiles).flatMap((text) => (JSON.parse(text) as { combinations: AppEntry[] }).combinations);

  it('har hele banken med samme rang, fordelt på én fil pr. side', () => {
    expect(entries).toHaveLength(bank.length);
    const sorted = [...entries].sort((a, b) => a.rank - b.rank);
    expect(sorted.map((e) => e.combination.id)).toEqual(bank.map((b) => b.id));
    expect(sorted.map((e) => e.rank)).toEqual(bank.map((_, i) => i + 1));
  });

  it('holder hver fil under 2 MB, så appen kan gemme den offline', () => {
    for (const [file, text] of Object.entries(appFiles)) expect(new TextEncoder().encode(text).length, file).toBeLessThan(2 * 1024 * 1024);
  });
});

describe('Hvad nu?', () => {
  it('har situationer med chancer, der summerer til 1, og et rimeligt forkert valg', () => {
    let count = 0;
    for (const [id, goals] of Object.entries(whatNow)) {
      const combination = bank.find((b) => b.id === id)!;
      expect(combination, id).toBeDefined();
      for (const [goal, situations] of Object.entries(goals)) {
        expect(combination.goals).toContain(Number(goal));
        for (const s of situations) {
          count++;
          expect(s.trick).toHaveLength(4);
          expect(s.probability).toBeGreaterThanOrEqual(0.01);
          expect(s.posterior.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 4);
          const values = s.options.map((o) => o.value);
          expect(values).toEqual([...values].sort((a, b) => b - a));
          expect(s.options.some((o) => plausible(o, values[0]) && values[0] - o.value > 0.005), `${id} ${goal}`).toBe(true);
        }
      }
    }
    expect(count).toBeGreaterThan(0);
  });

  it('listen til godkendelse er opdateret', () => {
    expect(whatNowReport(bank, whatNow)).toBe(lf(whatNowMd));
  });
});

describe('Valideringsrapporterne', () => {
  it('dækker alle brugbare cases fra siden "damen mangler" med begge fortolkninger af x, også med 8 manglende kort', () => {
    const report = reports['./content/validering-side-2.md'];
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

  it('har en rapport for hver side med brugbare cases, der dækker alle dens mål', () => {
    for (const page of sourcePages) {
      // Samme kort på tværs af siderne tæller kun én gang, så sorteringen er den samlede.
      const usable = classifyPages(sourcePages).filter((c) => c.page === page.number && c.usable);
      if (!usable.length) continue;
      const report = reports[`./content/validering-side-${page.number}.md`];
      expect(report, `side ${page.number}`).toBeDefined();
      const all = report.split('## Alle brugbare cases')[1];
      expect(all.split('\n').filter((l) => /^\| [\d.]+ \|/.test(l)), `side ${page.number}`).toHaveLength(
        usable.reduce((n, c) => n + c.needs.length, 0),
      );
    }
  });
});

describe('Fejl i kilden', () => {
  it('fjerner de listede mål fra banken, og en case uden mål tilbage er sorteret fra', () => {
    expect(sourceErrors).toHaveLength(14);
    for (const e of sourceErrors) {
      const b = bank.find((x) => x.source?.name === `bridgehands.com, Suit Combinations ${e.page}, case ${e.case}`);
      if (b) expect(b.goals, `side ${e.page} case ${e.case}`).not.toContain(e.need);
    }
    const dropped = allRows.filter((r) => r.case.reason?.startsWith('Fejl i kilden'));
    expect(dropped.map((r) => `${r.case.page}:${caseLabel(r.case)}`)).toEqual(['1:51', '5:1', '6:2.29']);
    expect(bank).toHaveLength(657);
  });

  it('giver hver afvigelse en årsag i rapporterne', () => {
    for (const [file, report] of Object.entries(reports)) {
      const table = lf(report).split('## Afvigelser')[1].split('\n## ')[0];
      for (const line of table.split('\n').filter((l) => /^\| [\d.]+ \|/.test(l))) expect(line.split('|')[8].trim(), file).not.toBe('');
    }
    // K D 10 9 / x: kildens 11 % for 2 stik er forkert; 2 stik er sikre, og alle linjer giver det samme.
    expect(lf(reports['./content/validering-side-5.md'])).toContain(
      '| 1 | K D 10 9 / x | 2 | 11 % | 100,0 % | 100,0 % | lav | målet er sikkert med begge fortolkninger; **fjernet** (alle linjer giver det samme) |',
    );
  });
});
