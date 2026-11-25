import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../../sprog/danskTekst';

/*
 * Accepttest 8 i SPEC-modspil-v2.md, trin 2: intet andet er ændret. v1's tests består uændret (det er `npx vitest run
 * src/modspil` og `npm test` selv; denne test sikrer, at ingen af dem er ændret), og kun nye filer i src/modspil/,
 * CLAUDE.md og specen er ændret siden `v46-foer-udspil-model` (main før trin 2). Det betyder også, at v1's model,
 * generator og metodefil, situationsfilen og trin 1's datasæt og tests er uændrede.
 *
 * Ikke-committede ændringer i sporede filer tæller med. Når trin 3 begynder (tagget `v47-foer-udspil-skaerme` findes),
 * sammenlignes kun de to tags. Mangler tagget (GitHub Actions henter ingen tags), springes testen over med en besked.
 */

const TAG = 'v46-foer-udspil-model';
const NAESTE = 'v47-foer-udspil-skaerme';
const FILER = ['CLAUDE.md', 'SPEC-modspil-v2.md'];

const git = (...args: string[]): string => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

function harTag(tag: string): boolean {
  try {
    git('rev-parse', '--verify', '--quiet', `refs/tags/${tag}^{commit}`);
    return true;
  } catch {
    return false;
  }
}

/** Ændringer, der ikke er tilladt: alt andet end en ny fil i src/modspil/ og rettelser i CLAUDE.md og specen. */
const ulovlige = (aendringer: readonly (readonly [string, string])[]) =>
  aendringer.filter(([status, fil]) => !(status === 'A' && fil.startsWith('src/modspil/')) && !(status === 'M' && FILER.includes(fil))).map(([s, f]) => `${s} ${f}`);

describe('Intet andet er ændret (accepttest 8, trin 2)', () => {
  it('kun nye filer i src/modspil/, CLAUDE.md og specen er ændret siden main før trin 2', (ctx) => {
    if (!harTag(TAG)) ctx.skip(`Tagget ${TAG} findes ikke her (fx i GitHub Actions, der henter uden tags), så testen kører kun lokalt.`);
    const til = harTag(NAESTE) ? [NAESTE] : [];
    const felter = git('diff', '--name-status', '-z', '--no-renames', TAG, ...til, '--').split('\0').filter(Boolean);
    const aendringer: [string, string][] = [];
    for (let i = 0; i < felter.length; i += 2) aendringer.push([felter[i], felter[i + 1]]);
    expect(ulovlige(aendringer)).toEqual([]);
  });

  it('testen kan se forskel: en ændret eksisterende fil eller en fil uden for de tilladte ville blive fanget', () => {
    expect(
      ulovlige([
        ['A', 'src/modspil/model/findUdspil.ts'],
        ['A', 'src/modspil/find-udspil/niveauer.test.ts'],
        ['M', 'CLAUDE.md'],
        ['M', 'SPEC-modspil-v2.md'],
        ['M', 'src/modspil/model/udspil.ts'],
        ['M', 'src/modspil/udspil.test.ts'],
        ['M', 'src/modspil/content/udspil/situationer.json'],
        ['D', 'src/modspil/udspil/hjaelp.ts'],
        ['A', 'src/app/tracks.ts'],
        ['M', 'src/engine/rng.ts'],
        ['D', 'CLAUDE.md'],
      ]),
    ).toEqual([
      'M src/modspil/model/udspil.ts',
      'M src/modspil/udspil.test.ts',
      'M src/modspil/content/udspil/situationer.json',
      'D src/modspil/udspil/hjaelp.ts',
      'A src/app/tracks.ts',
      'M src/engine/rng.ts',
      'D CLAUDE.md',
    ]);
  });
});
