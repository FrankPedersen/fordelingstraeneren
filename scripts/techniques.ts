// Sætter teknikken pr. kombination i opgavebanken ud fra de forberegnede løsninger, uden at løse igen:
//   src/farvebehandling/content/suit-combinations.json        feltet technique
//   src/farvebehandling/content/teknikker-damen-mangler.md    teknik pr. kombination til godkendelse
//
//   node scripts/techniques.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const content = `${root}src/farvebehandling/content/`;
const tech = (
  await runnerImport<typeof import('../src/farvebehandling/techniques.ts')>(`${root}src/farvebehandling/techniques.ts`, {
    configFile: false,
    logLevel: 'error',
  })
).module;

const bankFile = JSON.parse(readFileSync(`${content}suit-combinations.json`, 'utf8'));
const solutions = JSON.parse(readFileSync(`${content}solutions.json`, 'utf8')).combinations;
const techniques = JSON.parse(readFileSync(`${content}techniques.json`, 'utf8')).techniques;

const counts: Record<string, number> = {};
for (const c of bankFile.combinations) {
  c.technique = tech.proposeTechnique(c.north, c.south, c.goals, solutions[c.id]).technique;
  counts[c.technique] = (counts[c.technique] ?? 0) + 1;
}
writeFileSync(`${content}suit-combinations.json`, JSON.stringify(bankFile, null, 1) + '\n');
writeFileSync(`${content}teknikker-damen-mangler.md`, tech.techniquesReport(bankFile.combinations, solutions, techniques));
console.log(counts);
