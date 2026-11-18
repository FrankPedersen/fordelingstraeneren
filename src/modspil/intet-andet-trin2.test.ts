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
 *   testfiler er tilladt). Det gælder også trin 1's tests i src/modspil/. Undtaget er `src/app/navigation.test.tsx` og
 *   `src/app/forside-bred.test.tsx`, der er rettet fra tre til fire grupper (Franks svar 18. nov. 2026), og
 *   `src/app/status.test.ts`, `src/app/forside.test.tsx` og `src/app/analyse-modul.test.tsx`, der er rettet fra fire
 *   til fem spor i I dag (Franks svar 2, 18. nov. 2026).
 * - Ingen fil uden for src/modspil/ er ændret, bortset fra dem, Afgrænsning (trin 2) og accepttestene nævner:
 *   `src/app/tracks.ts` (gruppen og menupunktet), `src/app/App.tsx` (den dovne skærm), vejledningen
 *   (`src/app/screens/GuideScreen.tsx`), `scripts/tjek-bred-layout.mjs` og testsiden `scripts/modspil.html`
 *   (accepttest 4), `scripts/ordliste.txt` (Franks svar 6, 17. nov.: ordlisten kommer i trin 2), specen, repoets
 *   CLAUDE.md og mock-up'en i `docs/specs/design/modspil/` (i git, Franks svar 18. nov. 2026). Franks svar 18. nov. 2026
 *   tillader også `src/app/status.ts` (Modspils kort viser streak og niveau som Pointregnskab) og undtagelseslisten i
 *   `src/sprog/bydeform.ts` (øvelsesnavnene "Vælg kortet" og "Vælg afkastet"). Franks svar 2, 18. nov. 2026, tillader
 *   `src/app/screens/HomeScreen.tsx` (velkomsten og I dag siger fem spor) og `src/ui/styles.css` (de fire grupper står
 *   2 × 2 fra 1000 px); vejledningen er allerede tilladt.
 * - Ikke-committede ændringer i sporede filer tæller med; nye filer, der ikke er lagt i git, tæller ikke.
 * - Mangler tagget (GitHub Actions henter ingen tags), springes testen over med en besked, som trin 1's punkt 10.
 *
 * Kræver byggeriet en anden fil (fx `src/ui/Footer.tsx`), skal Claude Code stoppe og spørge Frank, før listen udvides
 * (specen, Afgrænsning).
 */

const TAG = 'v43-foer-modspil-skaerme';
const TILLADT = [
  'src/app/tracks.ts',
  'src/app/App.tsx',
  'src/app/screens/GuideScreen.tsx',
  'src/app/status.ts',
  'src/app/screens/HomeScreen.tsx',
  'src/ui/styles.css',
  'src/sprog/bydeform.ts',
  'scripts/tjek-bred-layout.mjs',
  'scripts/modspil.html',
  'scripts/ordliste.txt',
  'SPEC-modspil.md',
  'CLAUDE.md',
];
const TILLADTE_MAPPER = ['src/modspil/', 'docs/specs/design/modspil/'];
/**
 * Eksisterende testfiler, Frank har tilladt at rette: fra tre til fire grupper på forsiden (svar 18. nov. 2026) og fra
 * fire til fem spor i I dag (svar 2, 18. nov. 2026).
 */
const RETTEDE_TESTE = ['src/app/navigation.test.tsx', 'src/app/forside-bred.test.tsx', 'src/app/status.test.ts', 'src/app/forside.test.tsx', 'src/app/analyse-modul.test.tsx'];

const git = (...args: string[]): string => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

function harTag(): boolean {
  try {
    git('rev-parse', '--verify', '--quiet', `refs/tags/${TAG}^{commit}`);
    return true;
  } catch {
    return false;
  }
}

const udenfor = (filer: string[]) =>
  filer.filter((f) => !TILLADTE_MAPPER.some((m) => f.startsWith(m)) && !TILLADT.includes(f) && !RETTEDE_TESTE.includes(f));
const erTest = (f: string) => /\.test\.tsx?$/.test(f);
/** En ændret eksisterende testfil, der ikke er tilladt: alt andet end en ny fil og de fem rettede (kun ændret, ikke slettet). */
const ulovligTestRettelse = (status: string, f: string) => status !== 'A' && erTest(f) && !(status === 'M' && RETTEDE_TESTE.includes(f));

describe('Intet andet er ændret (accepttest 8, trin 2)', () => {
  it('ingen eksisterende testfil er ændret, slettet eller flyttet siden tagget, bortset fra de fem tilladte', (ctx) => {
    if (!harTag()) ctx.skip(`Tagget ${TAG} findes ikke her (fx i GitHub Actions, der henter uden tags), så testen kører kun lokalt.`);
    const linjer = git('diff', '--name-status', '-z', '--no-renames', TAG, '--').split('\0').filter(Boolean);
    const aendrede: string[] = [];
    for (let i = 0; i < linjer.length; i += 2) if (ulovligTestRettelse(linjer[i], linjer[i + 1])) aendrede.push(`${linjer[i]} ${linjer[i + 1]}`);
    expect(aendrede).toEqual([]);
  });

  it('ingen fil uden for src/modspil/ er ændret, bortset fra de tilladte', (ctx) => {
    if (!harTag()) ctx.skip(`Tagget ${TAG} findes ikke her (fx i GitHub Actions, der henter uden tags), så testen kører kun lokalt.`);
    const aendrede = git('diff', '--name-only', '-z', TAG, '--').split('\0').filter(Boolean);
    expect(udenfor(aendrede)).toEqual([]);
  });

  it('testen kan se forskel', () => {
    expect(
      udenfor([
        'src/app/tracks.ts',
        'src/modspil/ui/Opgave.tsx',
        'docs/specs/design/modspil/1-opgave-390.html',
        'src/app/status.ts',
        'src/sprog/bydeform.ts',
        'src/app/navigation.test.tsx',
        'src/app/status.test.ts',
        'src/ui/styles.css',
        'src/app/screens/HomeScreen.tsx',
        'src/ui/Footer.tsx',
        'src/ui/TopBar.tsx',
        'src/app/i18n.test.tsx',
        'src/sidefod.test.tsx',
      ]),
    ).toEqual(['src/ui/Footer.tsx', 'src/ui/TopBar.tsx', 'src/app/i18n.test.tsx', 'src/sidefod.test.tsx']);
    expect(
      [
        ['M', 'src/app/navigation.test.tsx'],
        ['M', 'src/app/forside-bred.test.tsx'],
        ['D', 'src/app/navigation.test.tsx'],
        ['M', 'src/app/status.test.ts'],
        ['M', 'src/app/forside.test.tsx'],
        ['M', 'src/app/analyse-modul.test.tsx'],
        ['D', 'src/app/status.test.ts'],
        ['M', 'src/app/i18n.test.tsx'],
        ['M', 'src/modspil/loeser.test.ts'],
        ['A', 'src/modspil/ui/ny.test.tsx'],
        ['M', 'src/modspil/model/udspil.ts'],
      ].filter(([status, f]) => ulovligTestRettelse(status, f)),
    ).toEqual([
      ['D', 'src/app/navigation.test.tsx'],
      ['D', 'src/app/status.test.ts'],
      ['M', 'src/app/i18n.test.tsx'],
      ['M', 'src/modspil/loeser.test.ts'],
    ]);
    expect(['src/app/navigation.test.tsx', 'src/modspil/udspil.test.ts', 'src/modspil/model/udspil.ts'].filter(erTest)).toEqual([
      'src/app/navigation.test.tsx',
      'src/modspil/udspil.test.ts',
    ]);
  });
});
