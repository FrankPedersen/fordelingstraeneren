// Henter en side fra bridgehands.com's farvebehandlinger og gemmer cases som JSON i src/farvebehandling/content/.
// Kun til udvikling; appen henter intet udefra.
//
//   node scripts/bridgehands.ts            (side 2, "damen mangler")
//   node scripts/bridgehands.ts 3 navn     (anden side og filnavn)
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const page = process.argv[2] ?? '2';
const name = process.argv[3] ?? 'damen-mangler';
const url = `https://www.bridgehands.com/S/Suit_Combination_${page}.htm`;
const root = fileURLToPath(new URL('..', import.meta.url));

const { module: source } = await runnerImport<typeof import('../src/farvebehandling/source/bridgehands.ts')>(
  `${root}src/farvebehandling/source/bridgehands.ts`,
  { configFile: false, logLevel: 'error' },
);

const response = await fetch(url, { headers: { 'User-Agent': 'Fordelingstraeneren (udvikling)' } });
if (!response.ok) throw new Error(`${url}: ${response.status}`);
const html = new TextDecoder('windows-1252').decode(await response.arrayBuffer());
const title = /<title>([^<]*)<\/title>/i.exec(html)?.[1].trim() ?? `Suit Combinations ${page}`;
const heading = /High Card Point[^<]*<\/b>|<b>([^<]*held by[^<]*)<\/b>/i.exec(html.replace(/\s+/g, ' '))?.[0]
  ?.replace(/<[^>]*>/g, '')
  .trim();
const cases = source.parseBridgehands(html);
const out = {
  page: heading ? `${title.replace(/: Bridge Play$/, '')} – ${heading}` : title,
  url,
  fetched: new Date().toISOString().slice(0, 10),
  cases,
};
const file = `${root}src/farvebehandling/content/bridgehands-${name}.json`;
writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
console.log(`${cases.length} cases fra ${url} → ${file}`);
