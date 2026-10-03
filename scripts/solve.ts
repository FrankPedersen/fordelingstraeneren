// Forberegner farvebehandlingens opgavebank ud fra bridgehands-siden "damen mangler":
//   src/farvebehandling/content/damen-mangler-hyppighed.csv   hyppighed og rang for alle cases
//   src/farvebehandling/content/suit-combinations.json        opgavebanken (brugbare cases i hyppighedsorden)
//   src/farvebehandling/content/solutions.json                løserens resultater med optimalt modspil
//   src/farvebehandling/content/validering-damen-mangler.md   sammenligning med kilden, begge fortolkninger af x
//   src/farvebehandling/content/linjer-damen-mangler.md       linjeteksterne til godkendelse
//
//   node scripts/solve.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const content = `${root}src/farvebehandling/content/`;
const load = async <T>(path: string) =>
  (await runnerImport<T>(`${root}${path}`, { configFile: false, logLevel: 'error' })).module;

const pre = await load<typeof import('../src/farvebehandling/precompute.ts')>('src/farvebehandling/precompute.ts');
const src = await load<typeof import('../src/farvebehandling/source/bridgehands.ts')>('src/farvebehandling/source/bridgehands.ts');

const page = JSON.parse(readFileSync(`${content}bridgehands-damen-mangler.json`, 'utf8'));
const cases = src.classifyCases(page.cases);
const rows = pre.frequencyRows(cases);
writeFileSync(`${content}damen-mangler-hyppighed.csv`, pre.frequencyCsv(rows));
console.log(pre.frequencySummary(rows));

const usable = rows.filter((r) => r.rank > 0).sort((a, b) => a.rank - b.rank);
const pageName = 'bridgehands.com, Suit Combinations 2';
const solutions: Record<string, unknown> = {};
const bank = [];
const validation = [];
const started = Date.now();
for (const [i, row] of usable.entries()) {
  const c = row.case;
  const t0 = Date.now();
  const lav = src.concreteHands(c, 'lav');
  const høj = src.concreteHands(c, 'høj');
  const lavSolution = pre.solveCombination(lav.north, lav.south, c.needs, { tricks: true });
  const højSolution = pre.solveCombination(høj.north, høj.south, c.needs);
  const entry = pre.bankEntry(c, pageName, lavSolution);
  bank.push(entry);
  solutions[entry.id] = lavSolution;
  const v = pre.validationRow(c, lavSolution, højSolution);
  validation.push(v);
  const goals = v.goals.map((g) => `${g.need}: ${g.app.lav.toFixed(1)}/${g.app.høj.toFixed(1)} (kilde ${g.source})`).join(', ');
  console.log(`${i + 1}/${usable.length} case ${c.number} ${entry.id} ${goals}  ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

writeFileSync(
  `${content}suit-combinations.json`,
  JSON.stringify({ version: 1, source: page.url, combinations: bank }, null, 1) + '\n',
);
writeFileSync(
  `${content}solutions.json`,
  JSON.stringify({ version: 1, model: pre.MODEL_TEXT, combinations: solutions }) + '\n',
);
const excluded = cases.filter((c) => !c.usable);
const report = pre.validationReport(validation, excluded, { page: page.page, url: page.url, fetched: page.fetched, tolerance: 0.5 });
writeFileSync(`${content}validering-damen-mangler.md`, report.replace('## Resultat\n', `## Resultat\n\n${pre.frequencySummary(rows)}\n`));
writeFileSync(`${content}linjer-damen-mangler.md`, pre.linesReport(bank, solutions as Record<string, any>));
console.log(`Færdig på ${((Date.now() - started) / 60000).toFixed(1)} min.`);
