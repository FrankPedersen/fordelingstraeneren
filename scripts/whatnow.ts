// Forberegner opgavetypen "Hvad nu?" for opgavebanken uden at løse linjerne igen:
//   src/farvebehandling/content/hvad-nu.json                 situationerne efter første runde med fortsættelserne
//   src/farvebehandling/content/hvad-nu-damen-mangler.md     teksterne til godkendelse
//
//   node scripts/whatnow.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const content = `${root}src/farvebehandling/content/`;
const load = async <T>(path: string) =>
  (await runnerImport<T>(`${root}${path}`, { configFile: false, logLevel: 'error' })).module;

const game = await load<typeof import('../src/farvebehandling/solver/game.ts')>('src/farvebehandling/solver/game.ts');
const cfr = await load<typeof import('../src/farvebehandling/solver/cfr.ts')>('src/farvebehandling/solver/cfr.ts');
const wn = await load<typeof import('../src/farvebehandling/solver/whatnow.ts')>('src/farvebehandling/solver/whatnow.ts');
const report = await load<typeof import('../src/farvebehandling/whatnowReport.ts')>('src/farvebehandling/whatnowReport.ts');
const cards = await load<typeof import('../src/farvebehandling/model/cards.ts')>('src/farvebehandling/model/cards.ts');

const bank = JSON.parse(readFileSync(`${content}suit-combinations.json`, 'utf8')).combinations;
const solutions = JSON.parse(readFileSync(`${content}solutions.json`, 'utf8')).combinations;
const round = (v: number) => Math.round(v * 1e6) / 1e6;

const out: Record<string, Record<string, unknown[]>> = {};
const started = Date.now();
let count = 0;
for (const [i, c] of bank.entries()) {
  const t0 = Date.now();
  const north = cards.parseCards(c.north), south = cards.parseCards(c.south);
  for (const goal of c.goals) {
    const stored = solutions[c.id].goals[String(goal)];
    const best = stored.leads[stored.best];
    const g = game.buildGame(north, south, { objective: { kind: 'goal', goal } });
    let slot = -1;
    for (let x = 0; x < g.childCount[g.root]; x++) {
      const s = g.childStart[g.root] + x;
      if ((g.slotHand[s] === 0 ? 'N' : 'S') === best.hand && g.slotHigh[s] === best.high && g.slotLow[s] === best.low) slot = s;
    }
    if (slot < 0) throw new Error(`${c.id} ${goal}: udspillet findes ikke`);
    const sub = cfr.solveSubgame(g, g.children[slot]);
    if (Math.abs(sub.value - best.value) > 1e-9) throw new Error(`${c.id} ${goal}: ${sub.value} ≠ ${best.value}`);
    const situations = wn.whatNow(g, slot, sub.strategy);
    if (!situations.length) continue;
    out[c.id] ??= {};
    out[c.id][String(goal)] = situations.map((s) => ({
      ...s,
      probability: round(s.probability),
      posterior: s.posterior.map(round),
      options: s.options.map((o) => ({ ...o, value: round(o.value) })),
    }));
    count += situations.length;
  }
  console.log(`${i + 1}/${bank.length} ${c.id}  ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
writeFileSync(`${content}hvad-nu.json`, JSON.stringify({ version: 1, model: wn.WHAT_NOW_MODEL, combinations: out }) + '\n');
writeFileSync(`${content}hvad-nu-damen-mangler.md`, report.whatNowReport(bank, out as never));
console.log(`${count} situationer i ${Object.keys(out).length} kombinationer på ${((Date.now() - started) / 60000).toFixed(1)} min.`);
