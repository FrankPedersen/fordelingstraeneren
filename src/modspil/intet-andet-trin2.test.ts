import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../sprog/danskTekst';

/*
 * Accepttest 8 i SPEC-modspil.md, trin 2: alle eksisterende tests består uændret, også pixelsammenligningerne mod
 * tagget. "Består" er `npm test` selv og `node scripts/tjek-bred-layout.mjs` (pixelsammenligningen ved 999 og 390 px mod
 * tagget `v43-foer-modspil-skaerme`, med Modspils gruppe på forsiden og afsnittet i vejledningen skjult). Denne test
 * sikrer "uændret" og Afgrænsning (trin 2):
 *
 * - Ingen testfil, der fandtes i tagget, er ændret, slettet eller flyttet (`git diff` fra tagget til arbejdsmappen; nye
 *   testfiler er tilladt). Det gælder også trin 1's tests i src/modspil/.
 * - Ingen fil uden for src/modspil/ er ændret, bortset fra dem, Afgrænsning (trin 2) og accepttestene nævner:
 *   `src/app/tracks.ts` (gruppen og menupunktet), `src/app/App.tsx` (den dovne skærm), vejledningen
 *   (`src/app/screens/GuideScreen.tsx`), `scripts/tjek-bred-layout.mjs` og testsiden `scripts/modspil.html`
 *   (accepttest 4), `scripts/ordliste.txt` (Franks svar 6, 17. nov.: ordlisten kommer i trin 2), specen, repoets
 *   CLAUDE.md og mock-up'en i `docs/specs/design/modspil/`, hvis den lægges i git.
 * - Ikke-committede ændringer i sporede filer tæller med; nye filer, der ikke er lagt i git, tæller ikke.
 * - Mangler tagget (GitHub Actions henter ingen tags), springes testen over med en besked, som trin 1's punkt 10.
 *
 * Kræver byggeriet en anden fil (fx `src/app/status.ts` til sporets status på forsiden eller `src/sprog/bydeform.ts`
 * til en ny knap i bydeform), skal Claude Code stoppe og spørge Frank, før listen udvides (specen, Afgrænsning).
 */

const TAG = 'v43-foer-modspil-skaerme';
const TILLADT = [
  'src/app/tracks.ts',
  'src/app/App.tsx',
  'src/app/screens/GuideScreen.tsx',
  'scripts/tjek-bred-layout.mjs',
  'scripts/modspil.html',
  'scripts/ordliste.txt',
  'SPEC-modspil.md',
  'CLAUDE.md',
];
const TILLADTE_MAPPER = ['src/modspil/', 'docs/specs/design/modspil/'];

const git = (...args: string[]): string => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

function harTag(): boolean {
  try {
    git('rev-parse', '--verify', '--quiet', `refs/tags/${TAG}^{commit}`);
    return true;
  } catch {
    return false;
  }
}

const udenfor = (filer: string[]) => filer.filter((f) => !TILLADTE_MAPPER.some((m) => f.startsWith(m)) && !TILLADT.includes(f));
const erTest = (f: string) => /\.test\.tsx?$/.test(f);

describe('Intet andet er ændret (accepttest 8, trin 2)', () => {
  it('ingen eksisterende testfil er ændret, slettet eller flyttet siden tagget', (ctx) => {
    if (!harTag()) ctx.skip(`Tagget ${TAG} findes ikke her (fx i GitHub Actions, der henter uden tags), så testen kører kun lokalt.`);
    const linjer = git('diff', '--name-status', '-z', '--no-renames', TAG, '--').split('\0').filter(Boolean);
    const aendrede: string[] = [];
    for (let i = 0; i < linjer.length; i += 2) if (linjer[i] !== 'A' && erTest(linjer[i + 1])) aendrede.push(`${linjer[i]} ${linjer[i + 1]}`);
    expect(aendrede).toEqual([]);
  });

  it('ingen fil uden for src/modspil/ er ændret, bortset fra de tilladte', (ctx) => {
    if (!harTag()) ctx.skip(`Tagget ${TAG} findes ikke her (fx i GitHub Actions, der henter uden tags), så testen kører kun lokalt.`);
    const aendrede = git('diff', '--name-only', '-z', TAG, '--').split('\0').filter(Boolean);
    expect(udenfor(aendrede)).toEqual([]);
  });

  it('testen kan se forskel', () => {
    expect(udenfor(['src/app/tracks.ts', 'src/modspil/ui/Opgave.tsx', 'docs/specs/design/modspil/1-opgave-390.html', 'src/app/status.ts', 'src/sprog/bydeform.ts', 'src/ui/styles.css'])).toEqual([
      'src/app/status.ts',
      'src/sprog/bydeform.ts',
      'src/ui/styles.css',
    ]);
    expect(['src/app/navigation.test.tsx', 'src/modspil/udspil.test.ts', 'src/modspil/model/udspil.ts'].filter(erTest)).toEqual([
      'src/app/navigation.test.tsx',
      'src/modspil/udspil.test.ts',
    ]);
  });
});
