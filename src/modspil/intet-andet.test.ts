import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../sprog/danskTekst';

/*
 * Accepttest 10 i SPEC-modspil.md: intet andet er ændret.
 *
 * - "Alle eksisterende tests består" er `npm test` selv (tsc og Vitest); denne test sikrer, at ingen af dem er ændret.
 * - "Ingen fil uden for src/modspil/ er ændret": `git diff` fra tagget `v42-foer-modspil-model` (main før trin 1) til
 *   arbejdsmappen må kun nævne filer i src/modspil/ og de tilladte filer herunder. Ikke-committede ændringer i sporede
 *   filer tæller med; nye filer, der ikke er lagt i git, tæller ikke (fx en mock-up, der ligger og venter).
 * - Når trin 2 begynder (tagget `v43-foer-modspil-skaerme` findes), sammenlignes kun de to tags, så testen stadig
 *   beskriver trin 1, mens trin 2 må ændre `src/app/tracks.ts`.
 * - GitHub Actions (`.github/workflows/pages.yml`) henter kun den seneste commit og ingen tags. Mangler tagget, springes
 *   testen over med en besked i stedet for at fejle; den kører lokalt, hvor tagget findes, og før hver fletning.
 *
 * Tilladt uden for src/modspil/: specen selv (committes i roden og bliver der til trin 2 er udgivet) og repoets
 * CLAUDE.md, hvor hvert spor får sit afsnit med beslutningerne (husets praksis). Alt andet kræver Franks svar først.
 */

const TAG = 'v42-foer-modspil-model';
const NAESTE = 'v43-foer-modspil-skaerme';
const TILLADT = ['SPEC-modspil.md', 'CLAUDE.md'];

const git = (...args: string[]): string => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

function harTag(tag: string): boolean {
  try {
    git('rev-parse', '--verify', '--quiet', `refs/tags/${tag}^{commit}`);
    return true;
  } catch {
    return false;
  }
}

describe('Intet andet er ændret (accepttest 10)', () => {
  it('ingen fil uden for src/modspil/ er ændret siden main før trin 1', (ctx) => {
    if (!harTag(TAG)) ctx.skip(`Tagget ${TAG} findes ikke her (fx i GitHub Actions, der henter uden tags), så testen kører kun lokalt.`);
    const til = harTag(NAESTE) ? [NAESTE] : [];
    const aendrede = git('diff', '--name-only', '-z', TAG, ...til, '--').split('\0').filter(Boolean);
    const udenfor = aendrede.filter((f) => !f.startsWith('src/modspil/') && !TILLADT.includes(f));
    expect(udenfor).toEqual([]);
  });

  it('testen kan se forskel: en fil uden for src/modspil/ ville blive fanget', () => {
    const udenfor = ['src/app/tracks.ts', 'src/modspil/model/udspil.ts', 'SPEC-modspil.md', 'src/sprog/fagord.ts'].filter(
      (f) => !f.startsWith('src/modspil/') && !TILLADT.includes(f),
    );
    expect(udenfor).toEqual(['src/app/tracks.ts', 'src/sprog/fagord.ts']);
  });
});
