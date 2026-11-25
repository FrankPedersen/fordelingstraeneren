import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../../sprog/danskTekst';

/*
 * Accepttest 9 i SPEC-modspil-v2.md, trin 3: alle eksisterende tests består uændret, bortset fra dem, trin 3 nævner;
 * pixelsammenligningerne er mod `v47-foer-udspil-skaerme`. "Består" er `npm test` selv, `node scripts/tjek-bred-layout.mjs`
 * (pixelsammenligningen mod tagget) og `node scripts/tjek-sidefod.mjs`. Denne test sikrer "uændret" og Afgrænsningen
 * siden tagget (main før trin 3), med ikke-committede ændringer i sporede filer:
 *
 * - Ingen eksisterende testfil er ændret, slettet eller flyttet, bortset fra `src/sidefod.test.tsx` (fem til seks
 *   trænere), `src/modspil/udspil/data.test.ts` (kun tidsgrænsen på 30 s for testen "antallet"; Franks valg 25. nov.) og,
 *   efter Franks valg i session 3a (25. nov. 2026), `src/app/forside.test.tsx` (seks trænere i sidefoden) og
 *   `src/modspil/ui/session.test.tsx` (løkken besvarer også øvelse 8).
 * - Uden for src/modspil/ er kun de filer ændret, Afgrænsningen og Franks valg i session 3a tillader: `src/ui/Footer.tsx`,
 *   `src/app/screens/GuideScreen.tsx` (kun nye linjer), `src/sprog/bydeform.ts`, `scripts/ordliste.txt`,
 *   `scripts/tjek-bred-layout.mjs`, `scripts/tjek-sidefod.mjs`, `scripts/modspil.html`, mock-up'ens kopi i
 *   `docs/specs/design/modspil-v2/`, repoets CLAUDE.md og specen, og de rettede tests ovenfor.
 * - I src/modspil/ er v1's model, generator og metodefil, modellen fra trin 2, datasættet og situationsfilen, v1's og
 *   trin 1–2's testhjælp og kontrollen uændrede (`model/`, `content/`, `bruteforce.ts`, `kontrol.ts`, `ui/testhjaelp.tsx`,
 *   `udspil/hjaelp.ts` og `find-udspil/hjaelp.ts`); nye filer er tilladt overalt i src/modspil/, og ændringer i v1's
 *   lagring, session og skærme (`storage.ts`, `training/`, `ui/`) er tilladt.
 * - Mangler tagget (GitHub Actions henter ingen tags), springes testen over med en besked.
 */

const TAG = 'v47-foer-udspil-skaerme';

const UDENFOR = [
  'src/ui/Footer.tsx',
  'src/app/screens/GuideScreen.tsx',
  'src/sprog/bydeform.ts',
  'scripts/ordliste.txt',
  'scripts/tjek-bred-layout.mjs',
  'scripts/tjek-sidefod.mjs',
  'scripts/modspil.html',
  'CLAUDE.md',
  'SPEC-modspil-v2.md',
  'src/sidefod.test.tsx',
  'src/app/forside.test.tsx',
];
const UDENFOR_MAPPER = ['docs/specs/design/modspil-v2/'];
/** Eksisterende testfiler, der må rettes (kun ændres, ikke slettes). */
const RETTEDE_TESTE = ['src/sidefod.test.tsx', 'src/app/forside.test.tsx', 'src/modspil/ui/session.test.tsx', 'src/modspil/udspil/data.test.ts'];
/** Filer og mapper i src/modspil/, hvor intet eksisterende må ændres (nye filer er tilladt). */
const URØRTE = ['src/modspil/model/', 'src/modspil/content/', 'src/modspil/bruteforce.ts', 'src/modspil/kontrol.ts', 'src/modspil/ui/testhjaelp.tsx', 'src/modspil/udspil/hjaelp.ts', 'src/modspil/find-udspil/hjaelp.ts'];

const git = (...args: string[]): string => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

function harTag(): boolean {
  try {
    git('rev-parse', '--verify', '--quiet', `refs/tags/${TAG}^{commit}`);
    return true;
  } catch {
    return false;
  }
}

const erTest = (f: string) => /\.test\.tsx?$/.test(f);

/** Ændringer (status og fil fra `git diff --name-status`), der ikke er tilladt. */
function ulovlige(aendringer: readonly (readonly [string, string])[]): string[] {
  return aendringer
    .filter(([status, f]) => {
      if (f.startsWith('src/modspil/')) {
        if (status === 'A') return false;
        if (erTest(f)) return !(status === 'M' && RETTEDE_TESTE.includes(f));
        return status !== 'M' || URØRTE.some((u) => f.startsWith(u));
      }
      if (erTest(f)) return !(status === 'M' && RETTEDE_TESTE.includes(f));
      if (UDENFOR_MAPPER.some((m) => f.startsWith(m))) return false;
      return !UDENFOR.includes(f);
    })
    .map(([s, f]) => `${s} ${f}`);
}

function aendringer(): [string, string][] {
  const felter = git('diff', '--name-status', '-z', '--no-renames', TAG, '--').split('\0').filter(Boolean);
  const ud: [string, string][] = [];
  for (let i = 0; i < felter.length; i += 2) ud.push([felter[i], felter[i + 1]]);
  return ud;
}

describe('Intet andet er ændret (accepttest 9, trin 3)', () => {
  it('kun de tilladte filer er ændret siden main før trin 3, og ingen eksisterende test ud over de fire tilladte', (ctx) => {
    if (!harTag()) ctx.skip(`Tagget ${TAG} findes ikke her (fx i GitHub Actions, der henter uden tags), så testen kører kun lokalt.`);
    expect(ulovlige(aendringer())).toEqual([]);
  });

  it('data.test.ts har kun fået tidsgrænsen på 30 s for testen "antallet"', (ctx) => {
    if (!harTag()) ctx.skip(`Tagget ${TAG} findes ikke her.`);
    const diff = git('diff', '-U0', TAG, '--', 'src/modspil/udspil/data.test.ts')
      .split('\n')
      .map((l) => l.replace(/\r$/, ''))
      .filter((l) => /^[-+]/.test(l) && !/^(---|\+\+\+) /.test(l));
    expect(diff).toEqual(['-  });', '+  }, 30_000);']);
    expect(git('diff', '-U3', TAG, '--', 'src/modspil/udspil/data.test.ts')).toContain('for (const x of r) expect(Number.isInteger(x) && x >= 0 && x <= 13).toBe(true);');
  });

  it('vejledningen har kun fået nye linjer', (ctx) => {
    if (!harTag()) ctx.skip(`Tagget ${TAG} findes ikke her.`);
    const tal = git('diff', '--numstat', TAG, '--', 'src/app/screens/GuideScreen.tsx').trim();
    const slettet = tal ? Number(tal.split('\t')[1]) : 0;
    expect(slettet, 'slettede linjer i GuideScreen.tsx').toBe(0);
  });

  it('testen kan se forskel', () => {
    expect(
      ulovlige([
        ['A', 'src/modspil/ui/FindUdspil.tsx'],
        ['A', 'src/modspil/udspil-skaerme/pris.test.tsx'],
        ['A', 'src/modspil/model/udspilPris.ts'],
        ['M', 'src/modspil/ui/ModspilScreen.tsx'],
        ['M', 'src/modspil/storage.ts'],
        ['M', 'src/modspil/training/session.ts'],
        ['M', 'src/modspil/ui/session.test.tsx'],
        ['M', 'src/modspil/udspil/data.test.ts'],
        ['M', 'src/sidefod.test.tsx'],
        ['M', 'src/app/forside.test.tsx'],
        ['M', 'src/ui/Footer.tsx'],
        ['M', 'scripts/tjek-sidefod.mjs'],
        ['A', 'docs/specs/design/modspil-v2/canvas.json'],
        ['M', 'SPEC-modspil-v2.md'],
        ['M', 'src/modspil/model/findUdspil.ts'],
        ['M', 'src/modspil/model/generator.ts'],
        ['M', 'src/modspil/content/udspil/S1-1nt-3nt.json'],
        ['M', 'src/modspil/ui/skaerme.test.tsx'],
        ['M', 'src/modspil/ui/testhjaelp.tsx'],
        ['D', 'src/modspil/ui/Opgave.tsx'],
        ['D', 'src/sidefod.test.tsx'],
        ['M', 'src/app/navigation.test.tsx'],
        ['M', 'src/app/tracks.ts'],
        ['M', 'src/engine/rng.ts'],
      ]),
    ).toEqual([
      'M src/modspil/model/findUdspil.ts',
      'M src/modspil/model/generator.ts',
      'M src/modspil/content/udspil/S1-1nt-3nt.json',
      'M src/modspil/ui/skaerme.test.tsx',
      'M src/modspil/ui/testhjaelp.tsx',
      'D src/modspil/ui/Opgave.tsx',
      'D src/sidefod.test.tsx',
      'M src/app/navigation.test.tsx',
      'M src/app/tracks.ts',
      'M src/engine/rng.ts',
    ]);
  });
});
