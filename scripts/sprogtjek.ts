// Stavekontrol (SPEC-sprog-og-ordbog.md, Den varige kontrol): ukendte ord i al dansk synlig tekst.
//
//   node scripts/sprogtjek.ts          ukendte ord med antal og første fil
//   node scripts/sprogtjek.ts --ord    kun ordene, ét pr. linje
//
// Teksten er den samme som fagordstestens (src/sprog/danskTekst.ts). Ordene slås op med hunspell-reglerne for dansk:
// Python-pakken spylls (`pip install spylls`) med da_DK fra npm-pakken dictionary-da, som hentes første gang og gemmes
// i brugerens cache (samme cache som konventionstrænerens tools/sprogtjek.py). Rigtige ord, som hunspell ikke kender,
// står i scripts/ordliste.txt. Køres med hånden før hver udgivelse og er ikke en del af npm test (intet netværk der).
// Slutter med kode 1, når der er ukendte ord.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const { danishTexts } = (
  await runnerImport<typeof import('../src/sprog/danskTekst.ts')>(`${root}src/sprog/danskTekst.ts`, { configFile: false, logLevel: 'error' })
).module;

/** Strenge med kode, CSS eller stier springes over; tekst har mellemrum og ingen af disse tegn. */
const CODE = /[{};=]|\b[\w-]+:\S|^\s*[#./]/;
const WORD = /[A-Za-zÀ-ÖØ-öø-ÿ]+/g;

function words(text: string): string[] {
  // Adresser, filnavne, kode i `…` og feltstier som settings.readShow er ikke ord.
  const clean = text.replace(/https?:\/\/\S+|\b[\w./-]+\.(?:json|html|ts|tsx|js|css|py|md)\b|`[^`]*`|\b[A-Za-z]+(?:\.[A-Za-z]+)+\b/g, ' ');
  return [...clean.matchAll(WORD)].map((m) => m[0]).filter((w) => w.length >= 3 && w !== w.toUpperCase());
}

const known = new Set(
  readFileSync(`${root}scripts/ordliste.txt`, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l && !l.startsWith('#')),
);

const seen = new Map<string, { count: number; file: string }>();
for (const { file, strings } of danishTexts()) {
  const prose = file.endsWith('.md') ? strings : strings.filter((s) => s.trim().includes(' ') && !CODE.test(s));
  for (const w of prose.flatMap(words)) {
    if (known.has(w.toLowerCase())) continue;
    const s = seen.get(w);
    if (s) s.count++;
    else seen.set(w, { count: 1, file });
  }
}

const PYTHON = String.raw`
import io, json, os, pathlib, sys, tarfile, urllib.request
from spylls.hunspell import Dictionary
cache = pathlib.Path(os.environ.get('LOCALAPPDATA') or pathlib.Path.home() / '.cache') / 'sprogtjek' / 'dictionary-da'
if not (cache / 'index.dic').exists():
    print('Henter den danske ordbog (dictionary-da) ...', file=sys.stderr)
    with urllib.request.urlopen('https://registry.npmjs.org/dictionary-da/latest') as r:
        tarball = json.load(r)['dist']['tarball']
    with urllib.request.urlopen(tarball) as r:
        data = r.read()
    cache.mkdir(parents=True, exist_ok=True)
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as tar:
        for name in ('index.aff', 'index.dic', 'license'):
            (cache / name).write_bytes(tar.extractfile(tar.getmember('package/' + name)).read())
d = Dictionary.from_files(str(cache / 'index'))
words = json.loads(sys.stdin.buffer.read().decode('utf-8'))
sys.stdout.buffer.write(json.dumps([w for w in words if not d.lookup(w)]).encode('utf-8'))
`;
const python = process.env.PYTHON ?? (process.platform === 'win32' ? 'python' : 'python3');
const unknown: string[] = JSON.parse(execFileSync(python, ['-c', PYTHON], { input: JSON.stringify([...seen.keys()]), encoding: 'utf8', maxBuffer: 1 << 26 }));

if (process.argv.includes('--ord')) {
  console.log(unknown.sort((a, b) => a.localeCompare(b, 'da')).join('\n'));
} else {
  for (const w of unknown.sort((a, b) => seen.get(b)!.count - seen.get(a)!.count || a.localeCompare(b, 'da'))) {
    const s = seen.get(w)!;
    console.log(`${w.padEnd(28)} ${String(s.count).padStart(4)}  ${s.file}`);
  }
  console.log(unknown.length ? `${unknown.length} ukendte ord.` : 'Stavekontrol: ingen ukendte ord.');
}
process.exit(unknown.length ? 1 : 0);
