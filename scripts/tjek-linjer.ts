// Kontrollerer de gemte linjer i banken (SPEC-linjeformat-39.md og SPEC-linjeplan-23.md):
//   1. Linjeformatet må ikke afvise en linje. Hver linje prøves i sit eget spil, og en linje for et mål også i spillet
//      med flest stik, hvor stik pr. sidning regnes.
//   2. Spillet som helhed skal en linje give den gemte chance. Undtagelserne står i UNDTAGET.
//
//   node scripts/tjek-linjer.ts                 begge dele (ca. 9 procestimer, så kør det delt)
//   node scripts/tjek-linjer.ts --shard 2/8     hver 8. kombination fra nr. 2 (kør flere samtidig)
//   node scripts/tjek-linjer.ts --hurtig        kun linjeformatet (5–7 minutter)
//   node scripts/tjek-linjer.ts 32-JT54         kun de nævnte kombinationer
//
// Afviger en linje, nævnes den, og scriptet slutter med en fejl.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const load = async <T>(path: string) => (await runnerImport<T>(`${root}${path}`, { configFile: false, logLevel: 'error' })).module;

const { parseCards } = await load<typeof import('../src/farvebehandling/model/cards.ts')>('src/farvebehandling/model/cards.ts');
const { buildGame } = await load<typeof import('../src/farvebehandling/solver/game.ts')>('src/farvebehandling/solver/game.ts');
const { validateLine } = await load<typeof import('../src/farvebehandling/solver/lines.ts')>('src/farvebehandling/solver/lines.ts');
const { solveLine } = await load<typeof import('../src/farvebehandling/solver/solve.ts')>('src/farvebehandling/solver/solve.ts');

type Solution = import('../src/farvebehandling/precompute.ts').CombinationSolution;
type Game = import('../src/farvebehandling/solver/game.ts').Game;
type Step = import('../src/farvebehandling/solver/lines.ts').LineStep;

/**
 * Linjer, der spillet som helhed må give en anden chance: 31 med `certified: false`, hvor det optimale spil kræver
 * blanding, så den gemte chance er midten af grænserne, og J32-KT84 flest#5, hvor forskellen er inden for løserens
 * tolerance (1,7503 stik). Linjerne følger løserens valg overalt (SPEC-linjeformat-39.md, Fund uden for de 39).
 */
const UNDTAGET = new Set([
  '32-QJ84 2#0', '32-QJ84 flest#0', 'AQ2-J9543 flest#2', 'J2-AK983 flest#3', 'J2-AK9843 6#0',
  'J2-AK9843 flest#0', 'J2-AK9843 flest#3', 'J2-AK9873 6#0', 'J2-AK9873 flest#0', 'J2-AK9873 flest#3',
  'J2-AQ9843 flest#4', 'J32-AK954 flest#0', 'J32-AK98 flest#2', 'J32-AK98 flest#3', 'J32-KT84 flest#5',
  'J432-AK95 4#0', 'J432-AK95 flest#0', 'J432-AQ98 flest#4', 'J82-AQ976 flest#5', 'J9-AQ5432 flest#4',
  'J92-AQ643 flest#6', 'J932-AQ54 flest#5', 'J98-AK32 flest#3', 'J98-AK432 5#0', 'J98-AK432 flest#3',
  'J98-AK732 flest#3', 'J98-AQ432 flest#4', 'J982-AK43 4#0', 'J982-AQ43 flest#5', 'K82-AT93 flest#5',
  'T32-AJ84 flest#0', 'T32-AK94 flest#0',
]);
const MAKS_FORSKEL = 1e-6;

const shardArg = process.argv.indexOf('--shard');
const [shard, shards] = shardArg >= 0 ? process.argv[shardArg + 1].split('/').map(Number) : [0, 1];
const hurtig = process.argv.includes('--hurtig');
const kun = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && all[i - 1] !== '--shard');

const started = Date.now();
const data = JSON.parse(readFileSync(`${root}src/farvebehandling/content/solutions.json`, 'utf8')).combinations as Record<string, Solution>;
const valgte = Object.entries(data).filter(([id], i) => (kun.length ? kun.includes(id) : i % shards === shard));
let leads = 0, empty = 0, rejected = 0, best = 0, wrong = 0, excepted = 0;

const check = (id: string, goal: string, i: number, isBest: boolean, steps: Step[], game: Game) => {
  const errors = validateLine(game, { id: 'x', text: '', steps });
  if (!errors.length) return true;
  rejected++;
  if (isBest) best++;
  console.log(`${id} ${goal} #${i}${isBest ? ' (bedst)' : ''}: ${errors.join(' ')}`);
  return false;
};

/** Giver linjen spillet som helhed den gemte chance? */
const play = (id: string, goal: string, i: number, steps: Step[], stored: number, game: Game) => {
  if (hurtig) return;
  const name = `${id} ${goal}#${i}`;
  const value = solveLine(game, { id: 'x', text: '', steps }).value;
  const differs = Math.abs(value - stored) > MAKS_FORSKEL;
  if (UNDTAGET.has(name)) {
    excepted++;
    if (!differs) console.log(`${name}: står på listen over undtagelser, men giver den gemte chance`);
  } else if (differs) {
    wrong++;
    console.log(`${name}: spillet som helhed ${value}, gemt ${stored}`);
  }
};

for (const [id, c] of valgte) {
  const north = parseCards(c.north), south = parseCards(c.south);
  const tricksGame = buildGame(north, south, { objective: { kind: 'tricks' } });
  for (const [goal, g] of Object.entries(c.goals)) {
    const game = buildGame(north, south, { objective: { kind: 'goal', goal: Number(goal) } });
    g.leads.forEach((l, i) => {
      leads++;
      if (!l.line.length) return void empty++;
      const ok = check(id, goal, i, i === g.best, l.line, game);
      if (ok) {
        check(id, `${goal} med flest stik`, i, i === g.best, l.line, tricksGame);
        play(id, goal, i, l.line, l.value, game);
      }
    });
  }
  c.tricks?.leads.forEach((l, i) => {
    leads++;
    if (!l.line.length) return void empty++;
    if (check(id, 'flest', i, i === c.tricks!.best, l.line, tricksGame)) play(id, 'flest', i, l.line, l.value, tricksGame);
  });
}

const spillet = hurtig ? '' : ` Spillet som helhed: ${wrong} uden for listen, ${excepted} på listen.`;
console.log(`${leads} udspil, ${empty} uden trin, ${leads - empty} gemte linjer: ${rejected} afvist (${best} bedste).${spillet} ${((Date.now() - started) / 1000).toFixed(0)} s.`);
process.exit(rejected || wrong ? 1 : 0);
