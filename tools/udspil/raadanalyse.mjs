// Kompendiets udspilsråd mod dobbeltdummy (SPEC-udspilsraad.md): tabellerne til afsnit 7a i docs/MODEL.md.
// Læser basens rådata (tools/udspil/raa/<situation>.json) og varianternes (tools/udspil/raa/varianter/<variant>.json)
// og regner med src/modspil/udspil/raadanalyse.ts.
//
//   node tools/udspil/raadanalyse.mjs --markdown   tabellerne, som de står mellem markørerne i docs/MODEL.md
//   node tools/udspil/raadanalyse.mjs --json       tallene som JSON
//
// Uden argument skrives tabellerne som med --markdown. Scriptet læser kun; koden fra src/ indlæses med Vites
// runnerImport som i scripts/ og tools/udspil/rapporttal.mjs.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const root = fileURLToPath(new URL('../../', import.meta.url));
const load = async (p) => (await runnerImport(`${root}${p}`, { configFile: false, logLevel: 'error' })).module;
const ra = await load('src/modspil/udspil/raadanalyse.ts');

const mangler = [];
const laes = (sti) => {
  if (!existsSync(root + sti)) {
    mangler.push(sti);
    return undefined;
  }
  return JSON.parse(readFileSync(root + sti, 'utf8'));
};

const base = Object.fromEntries(ra.SITUATIONER.map((id) => [id, laes(`tools/udspil/raa/${id}.json`)]));
const varianter = Object.fromEntries(ra.VARIANTER.map((id) => [id, laes(`tools/udspil/raa/varianter/${id}.json`)]));
if (mangler.length) {
  console.error(`Rådataene mangler: ${mangler.join(', ')}. Se tools/udspil/README.md (generer.py --varianter).`);
  process.exit(1);
}

const resultat = ra.analyser({ base, varianter });
if (process.argv.includes('--json')) console.log(JSON.stringify(resultat, null, 1));
else console.log(ra.markdown(resultat));
