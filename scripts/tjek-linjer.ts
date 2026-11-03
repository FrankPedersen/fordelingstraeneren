// Tæller, hvor mange gemte linjer i banken linjeformatet afviser (SPEC-linjeformat-39.md). Hver linje prøves i sit eget
// spil, og en linje for et mål også i spillet med flest stik, hvor stik pr. sidning regnes. Tager ca. 4½ minut.
//
//   node scripts/tjek-linjer.ts
//
// Afviser formatet en linje, nævnes den, og scriptet slutter med en fejl.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const load = async <T>(path: string) => (await runnerImport<T>(`${root}${path}`, { configFile: false, logLevel: 'error' })).module;

const { parseCards } = await load<typeof import('../src/farvebehandling/model/cards.ts')>('src/farvebehandling/model/cards.ts');
const { buildGame } = await load<typeof import('../src/farvebehandling/solver/game.ts')>('src/farvebehandling/solver/game.ts');
const { validateLine } = await load<typeof import('../src/farvebehandling/solver/lines.ts')>('src/farvebehandling/solver/lines.ts');

type Solution = import('../src/farvebehandling/precompute.ts').CombinationSolution;
type Game = import('../src/farvebehandling/solver/game.ts').Game;
type Step = import('../src/farvebehandling/solver/lines.ts').LineStep;

const started = Date.now();
const data = JSON.parse(readFileSync(`${root}src/farvebehandling/content/solutions.json`, 'utf8')).combinations as Record<string, Solution>;
let leads = 0, empty = 0, rejected = 0, best = 0;

const check = (id: string, goal: string, i: number, isBest: boolean, steps: Step[], game: Game) => {
  const errors = validateLine(game, { id: 'x', text: '', steps });
  if (!errors.length) return true;
  rejected++;
  if (isBest) best++;
  console.log(`${id} ${goal} #${i}${isBest ? ' (bedst)' : ''}: ${errors.join(' ')}`);
  return false;
};

for (const [id, c] of Object.entries(data)) {
  const north = parseCards(c.north), south = parseCards(c.south);
  const tricksGame = buildGame(north, south, { objective: { kind: 'tricks' } });
  for (const [goal, g] of Object.entries(c.goals)) {
    const game = buildGame(north, south, { objective: { kind: 'goal', goal: Number(goal) } });
    g.leads.forEach((l, i) => {
      leads++;
      if (!l.line.length) return void empty++;
      if (check(id, goal, i, i === g.best, l.line, game)) check(id, `${goal} med flest stik`, i, i === g.best, l.line, tricksGame);
    });
  }
  c.tricks?.leads.forEach((l, i) => {
    leads++;
    if (!l.line.length) return void empty++;
    check(id, 'flest', i, i === c.tricks!.best, l.line, tricksGame);
  });
}

console.log(`${leads} udspil, ${empty} uden trin, ${leads - empty} gemte linjer: ${rejected} afvist (${best} bedste). ${((Date.now() - started) / 1000).toFixed(0)} s.`);
process.exit(rejected ? 1 : 0);
