// Rapporttallene for Modspil v2, trin 1 (SPEC-modspil-v2.md, Kontrollen, Rapporttal og Afklaret).
// Regner pr. situation og i alt, ud fra datasættet i tools/udspil/raa/ og src/modspil/content/udspil/:
//   - råd: andelen af opgaver, hvor mindst én af dobbeltdummys bedste farver (under 0,1 stik fra den bedste) er blandt
//     dem, Kompendiets råd peger på, og strengt: den ene bedste farve er det;
//   - klare: andelen af opgaver, hvor den bedste farve har et forspring på mindst 0,2 og 0,3 stik til den næstbedste
//     (profilen Standards udspil);
//   - median standardfejl på forskellen mellem bedste og næstbedste farve (bedste kort i hver farve, parret over
//     fordelingerne), for alle opgaver og for de klare (mindst 0,2).
//
//   node tools/udspil/rapporttal.mjs          (skriver en tabel; --json skriver tallene som JSON)
//
// Nye tal regnes ikke ind i appen; scriptet læser kun. Koden fra src/ indlæses med Vites runnerImport som i scripts/.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const root = fileURLToPath(new URL('../../', import.meta.url));
const load = async (p) => (await runnerImport(`${root}${p}`, { configFile: false, logLevel: 'error' })).module;
const h = await load('src/modspil/udspil/hjaelp.ts');
const udspil = await load('src/modspil/model/udspil.ts');
const metoder = await load('src/modspil/model/metoder.ts');

const GRAENSER = [0.2, 0.3];
const fil = h.situationsfil();
const laes = (sti) => JSON.parse(readFileSync(root + sti, 'utf8'));
const median = (a) => {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Pr. farve: kortet med det højeste middelstik blandt profilen Standards udspil, og dets stik pr. fordeling. */
function farveKolonner(o, kontrakt) {
  const sorteret = [...o.vest].sort((a, b) => a - b);
  const ud = {};
  for (const f of h.FARVER) {
    const nr = h.FARVER.indexOf(f);
    const v = sorteret.filter((c) => Math.floor(c / 13) === nr).map((c) => (c % 13) + 2);
    if (!v.length) continue;
    let bedst = null;
    for (const val of udspil.muligeUdspil(v, h.art(kontrakt), metoder.profil('standard'))) {
      const k = o.stik.map((r) => r[sorteret.indexOf(nr * 13 + val - 2)]);
      const m = k.reduce((a, x) => a + x, 0) / k.length;
      if (!bedst || m > bedst.m) bedst = { m, k };
    }
    ud[f] = bedst;
  }
  return ud;
}

/** Standardfejlen på forskellen mellem to kolonner, parret over fordelingerne. */
function standardfejl(a, b) {
  const d = a.map((x, i) => x - b[i]);
  const n = d.length;
  const m = d.reduce((x, y) => x + y, 0) / n;
  return Math.sqrt(d.reduce((x, y) => x + (y - m) ** 2, 0) / (n - 1)) / Math.sqrt(n);
}

function regn(situationer) {
  const t = { opgaver: 0, raadBlandt: 0, raadStrikt: 0, ingenRaad: 0, klare: GRAENSER.map(() => 0), se: [], seKlare: [] };
  for (const s of situationer) {
    const raa = laes(h.raaSti(s.id));
    const app = laes(h.appSti(s.id));
    for (const o of app.opgaver) {
      t.opgaver++;
      const v = h.farvevaerdier(o.vest, o.middel, s.kontrakt);
      const sorteret = h.FARVER.filter((f) => v[f] !== undefined).sort((a, b) => v[b] - v[a]);
      const forspring = sorteret.length > 1 ? v[sorteret[0]] - v[sorteret[1]] : Infinity;
      GRAENSER.forEach((g, i) => {
        if (forspring >= g - 1e-9) t.klare[i]++;
      });
      const raad = h.kompendieraad(o.vest, s.kompendieraad.regler);
      if (!raad.length) t.ingenRaad++;
      if (h.bedsteFarver(v).some((f) => raad.includes(f))) t.raadBlandt++;
      if (raad.includes(sorteret[0])) t.raadStrikt++;
      if (sorteret.length > 1) {
        const r = raa.opgaver.find((x) => x.seed === o.seed);
        const kol = farveKolonner(r, s.kontrakt);
        const se = standardfejl(kol[sorteret[0]].k, kol[sorteret[1]].k);
        t.se.push(se);
        if (forspring >= GRAENSER[0] - 1e-9) t.seKlare.push(se);
      }
    }
  }
  return {
    opgaver: t.opgaver,
    raadBlandt: t.raadBlandt,
    raadStrikt: t.raadStrikt,
    ingenRaad: t.ingenRaad,
    klare: Object.fromEntries(GRAENSER.map((g, i) => [g, t.klare[i]])),
    medianSE: median(t.se),
    medianSEklare: median(t.seKlare),
  };
}

const rader = fil.situationer.map((s) => ({ id: s.id, ...regn([s]) }));
const iAlt = { id: 'I alt', ...regn(fil.situationer) };

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rader, iAlt }, null, 1));
} else {
  const pct = (x, n) => `${((100 * x) / n).toFixed(1).replace('.', ',')} %`;
  const dec = (x) => (Number.isNaN(x) ? '–' : x.toFixed(2).replace('.', ','));
  console.log('| Situation | Opgaver | Råd blandt de bedste | Strengt | Klare ≥ 0,2 | Klare ≥ 0,3 | Median SE | Median SE (klare ≥ 0,2) | Uden råd |');
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const r of [...rader, iAlt]) {
    const navn = r.id === 'I alt' ? '**I alt**' : r.id;
    console.log(
      `| ${navn} | ${r.opgaver} | ${pct(r.raadBlandt, r.opgaver)} | ${pct(r.raadStrikt, r.opgaver)} | ${r.klare[0.2]} (${pct(r.klare[0.2], r.opgaver)}) | ${r.klare[0.3]} (${pct(r.klare[0.3], r.opgaver)}) | ${dec(r.medianSE)} | ${dec(r.medianSEklare)} | ${r.ingenRaad} |`,
    );
  }
}
