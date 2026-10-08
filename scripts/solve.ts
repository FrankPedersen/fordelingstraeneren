// Forberegner farvebehandlingens opgavebank for bridgehands.com's sider 0–9 (node scripts/bridgehands.ts henter dem):
//   src/farvebehandling/content/damen-mangler-hyppighed.csv   hyppighed og rang for siden "damen mangler" (specens accepttest)
//   src/farvebehandling/content/hyppighed.csv                 hyppighed og rang på tværs af alle sider
//   src/farvebehandling/content/suit-combinations.json        opgavebanken: alle brugbare cases i hyppighedsorden
//   src/farvebehandling/content/solutions.json                løserens resultater med optimalt modspil
//   src/farvebehandling/content/hvad-nu.json                  Hvad nu?-situationerne
//   src/farvebehandling/content/app/side-N.json               appens kompakte data, én fil pr. side
//   src/farvebehandling/content/validering-side-N.md          sammenligning med kilden, begge fortolkninger af x
//   src/farvebehandling/content/linjer-side-N.md              linjeteksterne til godkendelse
//   src/farvebehandling/content/teknikker.md                  teknik pr. kombination til godkendelse
//   src/farvebehandling/content/hvad-nu.md                    Hvad nu?-situationerne til godkendelse
//   src/farvebehandling/content/kildefejl.json                mål, der fjernes, fordi kildens procent er forkert
//
//   node scripts/solve.ts                  løser det, der mangler i mellemlageret, og samler filerne
//   node scripts/solve.ts --shard 2/8      løser hver 8. case fra nr. 2 (kør flere samtidig), uden at samle
//   node scripts/solve.ts --assemble       samler filerne fra mellemlageret uden at løse
//
// Mellemlageret (én fil pr. case) ligger i FB_SOLVE_CACHE, ellers i <tmp>/fordelingstraeneren-solve. Ændres løseren,
// tælles LINES_VERSION op; ændres kun reglerne for Hvad nu?, tælles WHAT_NOW_VERSION op (så løses kun den bedste linje).
// Ændres kun Hold eller par (pairsFor), tælles PAIRS_VERSION op; så regnes kun målenes bedste linjer som parturnering.
// Ændres kun stikkene pr. sidning for de viste linjer (withLeadTricks), tælles TRICKS_VERSION op; så regnes kun de.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const LINES_VERSION = 1;
const WHAT_NOW_VERSION = 1;
const PAIRS_VERSION = 1;
const TRICKS_VERSION = 1;
const PAGES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const root = fileURLToPath(new URL('..', import.meta.url));
const content = `${root}src/farvebehandling/content/`;
const cache = process.env.FB_SOLVE_CACHE ?? join(tmpdir(), 'fordelingstraeneren-solve');
mkdirSync(cache, { recursive: true });
const load = async <T>(path: string) =>
  (await runnerImport<T>(`${root}${path}`, { configFile: false, logLevel: 'error' })).module;

const pre = await load<typeof import('../src/farvebehandling/precompute.ts')>('src/farvebehandling/precompute.ts');
const src = await load<typeof import('../src/farvebehandling/source/bridgehands.ts')>('src/farvebehandling/source/bridgehands.ts');
const tech = await load<typeof import('../src/farvebehandling/techniques.ts')>('src/farvebehandling/techniques.ts');
const wnr = await load<typeof import('../src/farvebehandling/whatnowReport.ts')>('src/farvebehandling/whatnowReport.ts');

type Solution = import('../src/farvebehandling/precompute.ts').CombinationSolution;
type Situations = Record<string, import('../src/farvebehandling/model/whatnow.ts').WhatNowSituation[]>;
interface Cached {
  lines: number;
  whatNowVersion: number;
  /** Hold eller par er regnet ind i lav.goals[mål].pairs. */
  pairsVersion?: number;
  /** Stik pr. sidning for de viste linjer er regnet ind i lav.goals[mål].leads[i].tricks. */
  tricksVersion?: number;
  key: string;
  lav: Solution;
  høj: Solution;
  whatNow: Situations;
}

const pages = PAGES.map((n) => JSON.parse(readFileSync(`${content}bridgehands-side-${n}.json`, 'utf8')));
const cases = src.classifyPages(pages);
const rows = pre.frequencyRows(cases);
const usable = rows.filter((r) => r.rank > 0).sort((a, b) => a.rank - b.rank);

const keyOf = (c: (typeof cases)[number]) => `${c.hand}/${c.dummy}:${c.needs.join(',')}`;
// Afsnit 1 beholder det korte navn, så mellemlageret fra sider med ét afsnit kan genbruges.
const fileOf = (c: (typeof cases)[number]) =>
  join(cache, (c.section ?? 1) > 1 ? `side-${c.page}-afsnit-${c.section}-case-${c.number}.json` : `side-${c.page}-case-${c.number}.json`);
function readCached(c: (typeof cases)[number]): Cached | null {
  const file = fileOf(c);
  if (!existsSync(file)) return null;
  const entry = JSON.parse(readFileSync(file, 'utf8')) as Cached;
  return entry.key === keyOf(c) && entry.lines === LINES_VERSION ? entry : null;
}

const current = (entry: Cached | null) =>
  !!entry && entry.whatNowVersion === WHAT_NOW_VERSION && entry.pairsVersion === PAIRS_VERSION && entry.tricksVersion === TRICKS_VERSION;

/** Hold eller par skrives ind i målene i den løsning, appen bruger. */
function withPairs(north: Parameters<typeof pre.pairsFor>[0], south: Parameters<typeof pre.pairsFor>[1], solution: Solution): Solution {
  const pairs = pre.pairsFor(north, south, solution);
  const goals = Object.fromEntries(
    Object.entries(solution.goals).map(([goal, { pairs: _old, ...g }]) => [goal, pairs[goal] === undefined ? g : { ...g, pairs: pairs[goal] }]),
  );
  return { ...solution, goals };
}

/** Løser en case (begge fortolkninger af x) og gemmer den i mellemlageret. */
function solveCase(c: (typeof cases)[number]): 'løst' | 'hvad nu' | 'par' | 'stik' | 'gemt' {
  const cached = readCached(c);
  if (current(cached)) return 'gemt';
  const lav = src.concreteHands(c, 'lav');
  if (cached) {
    const whatNow = cached.whatNowVersion === WHAT_NOW_VERSION ? cached.whatNow : pre.whatNowFor(lav.north, lav.south, c.needs, cached.lav);
    let lavSolution = cached.pairsVersion === PAIRS_VERSION ? cached.lav : withPairs(lav.north, lav.south, cached.lav);
    if (cached.tricksVersion !== TRICKS_VERSION) lavSolution = pre.withLeadTricks(lav.north, lav.south, lavSolution);
    const entry: Cached = {
      ...cached,
      whatNowVersion: WHAT_NOW_VERSION,
      pairsVersion: PAIRS_VERSION,
      tricksVersion: TRICKS_VERSION,
      whatNow,
      lav: lavSolution,
    };
    writeFileSync(fileOf(c), JSON.stringify(entry));
    return cached.whatNowVersion !== WHAT_NOW_VERSION ? 'hvad nu' : cached.pairsVersion !== PAIRS_VERSION ? 'par' : 'stik';
  }
  const høj = pre.handsFor(c, 'høj');
  const { whatNow = {}, ...solved } = pre.solveCombination(lav.north, lav.south, c.needs, { tricks: true, whatNow: true });
  const lavSolution = pre.withLeadTricks(lav.north, lav.south, withPairs(lav.north, lav.south, solved));
  const same = lav.north.join() === høj.north.join() && lav.south.join() === høj.south.join();
  const højSolution = same ? { ...lavSolution, tricks: undefined } : pre.solveCombination(høj.north, høj.south, c.needs);
  const entry: Cached = {
    lines: LINES_VERSION,
    whatNowVersion: WHAT_NOW_VERSION,
    pairsVersion: PAIRS_VERSION,
    tricksVersion: TRICKS_VERSION,
    key: keyOf(c),
    lav: lavSolution,
    høj: højSolution,
    whatNow,
  };
  writeFileSync(fileOf(c), JSON.stringify(entry));
  return 'løst';
}

const shardArg = process.argv.indexOf('--shard');
const assembleOnly = process.argv.includes('--assemble');
const [shard, shards] = shardArg >= 0 ? process.argv[shardArg + 1].split('/').map(Number) : [0, 1];
const started = Date.now();

if (!assembleOnly) {
  // Kun de cases, der mangler, fordeles på processerne.
  const todo = usable.filter((r) => !current(readCached(r.case)));
  const mine = todo.filter((_, i) => i % shards === shard);
  for (const [i, row] of mine.entries()) {
    const t0 = Date.now();
    const label = `[${shard}/${shards}] ${i + 1}/${mine.length} side ${row.case.page} case ${row.case.number}`;
    try {
      const result = solveCase(row.case);
      if (result !== 'gemt') console.log(`${label} (${result}) ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    } catch (error) {
      // En fejl i én case stopper ikke resten; samlingen nævner de cases, der mangler.
      console.error(`${label} FEJL: ${(error as Error).message}`);
    }
  }
  console.log(`[${shard}/${shards}] færdig på ${((Date.now() - started) / 60000).toFixed(1)} min.`);
  if (shardArg >= 0) process.exit(0);
}

// ---------- Saml filerne ----------
const missing = usable.filter((r) => !current(readCached(r.case)));
if (missing.length) {
  console.error(`${missing.length} cases mangler i mellemlageret, fx side ${missing[0].case.page} case ${missing[0].case.number}.`);
  process.exit(1);
}

// Specens accepttest: siden "damen mangler" for sig.
writeFileSync(`${content}damen-mangler-hyppighed.csv`, pre.frequencyCsv(pre.frequencyRows(src.classifyCases(pages[2].cases))));

// Fejl i kilden: mål uden beslutning, hvor kildens procent er forkert, fjernes, og en case uden mål sorteres fra.
// Listen gemmes, så appens test kan regne banken og rangen igen; rapporterne viser alle kildens mål.
const validationOf = new Map(usable.map((r) => [r.case, pre.validationRow(r.case, readCached(r.case)!.lav, readCached(r.case)!.høj)]));
const pageRows = (n: number) => usable.filter((r) => r.case.page === n).map((r) => validationOf.get(r.case)!);
const errors = PAGES.flatMap((n) =>
  pageRows(n).flatMap((v) => pre.removedGoals(v, pageRows(n)).map((x) => ({ page: n, case: src.caseLabel(v.case), need: x.need, cause: x.cause }))),
);
writeFileSync(`${content}kildefejl.json`, JSON.stringify({ version: 1, goals: errors }, null, 1) + '\n');
const finalCases = pre.applySourceErrors(cases, errors);
const originalOf = new Map(finalCases.map((c, i) => [c, cases[i]]));
const finalRows = pre.frequencyRows(finalCases);
const finalUsable = finalRows.filter((r) => r.rank > 0).sort((a, b) => a.rank - b.rank);
writeFileSync(`${content}hyppighed.csv`, pre.frequencyCsv(finalRows, { pages: true }));

const bank = [];
const solutions: Record<string, Solution> = {};
const situations: Record<string, Situations> = {};
const app = new Map<number, unknown[]>();
for (const row of finalUsable) {
  const c = row.case;
  const entry = readCached(originalOf.get(c)!)!;
  // Kun de mål, der er tilbage efter kildefejlene.
  const keep = <T>(record: Record<string, T>) => Object.fromEntries(Object.entries(record).filter(([goal]) => c.needs.includes(Number(goal))));
  const lav: Solution = { ...entry.lav, goals: keep(entry.lav.goals) };
  const whatNow: Situations = keep(entry.whatNow);
  const combination = pre.bankEntry(c, `bridgehands.com, Suit Combinations ${c.page}`, lav, whatNow);
  if (solutions[combination.id]) throw new Error(`${combination.id} findes to gange`);
  bank.push(combination);
  solutions[combination.id] = lav;
  if (Object.keys(whatNow).length) situations[combination.id] = whatNow;
  if (!app.has(c.page!)) app.set(c.page!, []);
  app.get(c.page!)!.push(pre.appEntry(row.rank, row.frequency!, combination, lav, whatNow));
}
console.log(`Kildefejl: ${errors.length} mål fjernet, ${finalCases.filter((c, i) => !c.usable && cases[i].usable).length} cases uden mål.`);

writeFileSync(`${content}suit-combinations.json`, JSON.stringify({ version: 1, source: 'https://www.bridgehands.com/S/', combinations: bank }, null, 1) + '\n');
writeFileSync(`${content}solutions.json`, JSON.stringify({ version: 1, model: pre.MODEL_TEXT, combinations: solutions }) + '\n');
const whatNowModel = (await load<typeof import('../src/farvebehandling/model/whatnow.ts')>('src/farvebehandling/model/whatnow.ts')).WHAT_NOW_MODEL;
writeFileSync(`${content}hvad-nu.json`, JSON.stringify({ version: 1, model: whatNowModel, combinations: situations }) + '\n');

rmSync(`${content}app`, { recursive: true, force: true });
mkdirSync(`${content}app`);
const techniques = JSON.parse(readFileSync(`${content}techniques.json`, 'utf8')).techniques;
for (const n of PAGES) {
  const page = pages[n];
  const pageCases = cases.filter((c) => c.page === n);
  const rowsHere = pageRows(n);
  if (rowsHere.length) {
    const report = pre.validationReport(rowsHere, pageCases.filter((c) => !c.usable), { page: page.page, url: page.url, fetched: page.fetched, tolerance: 0.5 });
    const pageRows = pre.frequencyRows(pageCases);
    writeFileSync(`${content}validering-side-${n}.md`, report.replace('## Resultat\n', `## Resultat\n\n${pre.frequencySummary(pageRows)}\n`));
    const pageBank = bank.filter((b) => b.source?.name.startsWith(`bridgehands.com, Suit Combinations ${n},`));
    writeFileSync(`${content}linjer-side-${n}.md`, pre.linesReport(pageBank, solutions, pre.pageTitle(n)));
  }
  writeFileSync(`${content}app/side-${n}.json`, JSON.stringify({ version: 1, page: n, combinations: app.get(n) ?? [] }) + '\n');
}
writeFileSync(`${content}teknikker.md`, tech.techniquesReport(bank, solutions, techniques, situations));
writeFileSync(`${content}hvad-nu.md`, wnr.whatNowReport(bank, situations));

const counts: Record<string, number> = {};
for (const b of bank) counts[b.technique] = (counts[b.technique] ?? 0) + 1;
console.log(`${bank.length} kombinationer, ${Object.keys(situations).length} med Hvad nu?, teknikker ${JSON.stringify(counts)}`);
console.log(`Samlet på ${((Date.now() - started) / 1000).toFixed(0)} s.`);
