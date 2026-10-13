// Regressionstest af farvebehandlingens løser mod The Official Encyclopedia of Bridge (Suit Combinations).
// Data: scripts/encyclopedia-regression.json (55 kombinationer, 92 mål, 28 Max-værdier).
//
//   node scripts/bog-regression.ts          alle kombinationer (ca. 25 min)
//   node scripts/bog-regression.ts 22 95    kun de nævnte numre
//
// Hvert mål skal ligge inden for tolerance af bogens tal. Kendte afvigelser (feltet "known") skal i stedet ramme
// appens dokumenterede værdi, så en ændring i løseren også opdages dér. Scriptet slutter med kode 1 ved en fejl.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const load = async <T>(p: string) => (await runnerImport<T>(`${root}${p}`, { configFile: false, logLevel: 'error' })).module;
const pre = await load<typeof import('../src/farvebehandling/precompute.ts')>('src/farvebehandling/precompute.ts');
const src = await load<typeof import('../src/farvebehandling/source/bridgehands.ts')>('src/farvebehandling/source/bridgehands.ts');

interface Known {
  app: number;
  reason: string;
}
interface Case {
  nr: number;
  page: number;
  dummy: string;
  hand: string;
  goals: Record<string, number>;
  max?: number;
  known?: Record<string, Known>;
}
const data = JSON.parse(readFileSync(`${root}scripts/encyclopedia-regression.json`, 'utf8')) as {
  tolerance: { percent: number; max: number; known_percent: number; known_max: number };
  cases: Case[];
};

const only = process.argv.slice(2).map(Number).filter(Number.isFinite);
const cases = only.length ? data.cases.filter((c) => only.includes(c.nr)) : data.cases;
const tol = data.tolerance;
const failures: string[] = [];
let checks = 0;
const started = Date.now();

function check(c: Case, goal: string, book: number, app: number, isMax: boolean) {
  checks++;
  const known = c.known?.[goal];
  const target = known ? known.app : book;
  const limit = isMax ? (known ? tol.known_max : tol.max) : known ? tol.known_percent : tol.percent;
  const shown = isMax ? app.toFixed(3) : `${app.toFixed(2)} %`;
  const ok = Math.abs(app - target) <= limit + 1e-9;
  const label = `nr. ${c.nr} (s. ${c.page}) ${c.dummy} / ${c.hand}, ${goal === 'max' ? 'Max' : `${goal} stik`}`;
  console.log(`${ok ? 'OK  ' : 'FEJL'} ${label}: bogen ${book}, appen ${shown}${known ? ' (kendt afvigelse)' : ''}`);
  if (!ok) failures.push(`${label}: forventet ${target} ± ${limit}, fik ${shown}`);
}

for (const c of cases) {
  const { north, south } = src.concreteHands({ hand: c.hand, dummy: c.dummy }, 'lav');
  const needs = Object.keys(c.goals).map(Number).sort((a, b) => b - a);
  const s = pre.solveCombination(north, south, needs, { tricks: c.max !== undefined });
  for (const g of needs) check(c, String(g), c.goals[String(g)], s.goals[String(g)].value * 100, false);
  if (c.max !== undefined) check(c, 'max', c.max, s.tricks!.value, true);
}

const minutes = ((Date.now() - started) / 60000).toFixed(1);
console.log(`\n${checks - failures.length} af ${checks} tal passer (${cases.length} kombinationer, ${minutes} min).`);
if (failures.length) {
  console.log('\nFejl:');
  for (const f of failures) console.log(`- ${f}`);
  process.exit(1);
}
