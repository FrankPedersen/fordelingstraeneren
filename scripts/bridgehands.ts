// Henter bridgehands.com's farvebehandlinger (Suit Combinations 0–9, sorteret efter modpartens honnørpoint) og gemmer
// hver side som JSON i src/farvebehandling/content/bridgehands-side-N.json. Kun til udvikling; appen henter intet udefra.
//
//   node scripts/bridgehands.ts          (alle sider 0–9)
//   node scripts/bridgehands.ts 3 4      (udvalgte sider)
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const pages = process.argv.length > 2 ? process.argv.slice(2).map(Number) : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const root = fileURLToPath(new URL('..', import.meta.url));

const { module: source } = await runnerImport<typeof import('../src/farvebehandling/source/bridgehands.ts')>(
  `${root}src/farvebehandling/source/bridgehands.ts`,
  { configFile: false, logLevel: 'error' },
);

for (const number of pages) {
  const url = `https://www.bridgehands.com/S/Suit_Combination_${number}.htm`;
  const response = await fetch(url, { headers: { 'User-Agent': 'Fordelingstraeneren (udvikling)' } });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const html = new TextDecoder('windows-1252').decode(await response.arrayBuffer());
  const title = /<title>([^<]*)<\/title>/i.exec(html)?.[1].trim() ?? `Suit Combinations ${number}`;
  const sections = source.sectionTitles(html);
  const cases = source.parseBridgehands(html);
  const out = {
    number,
    page: sections.length ? `${title.replace(/: Bridge Play$/, '')} – ${sections.join(' / ')}` : title,
    sections,
    url,
    fetched: new Date().toISOString().slice(0, 10),
    cases,
  };
  const file = `${root}src/farvebehandling/content/bridgehands-side-${number}.json`;
  writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
  console.log(`${cases.length} cases fra ${url} → ${file}`);
}
