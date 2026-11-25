import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../../sprog/danskTekst';

/*
 * Accepttest 7 i SPEC-modspil-v2.md, trin 1: kun tools/udspil/, src/modspil/content/udspil/, de nye tests i
 * src/modspil/udspil/, .gitignore, CLAUDE.md og specen er ændret siden `v45-foer-udspil-data` (main før trin 1).
 * Ikke-committede ændringer i sporede filer tæller med. Når trin 2 begynder (tagget `v46-foer-udspil-model` findes),
 * sammenlignes kun de to tags. Mangler tagget (GitHub Actions henter ingen tags), springes testen over med en besked.
 */

const TAG = 'v45-foer-udspil-data';
const NAESTE = 'v46-foer-udspil-model';
const MAPPER = ['tools/udspil/', 'src/modspil/content/udspil/', 'src/modspil/udspil/'];
const FILER = ['.gitignore', 'CLAUDE.md', 'SPEC-modspil-v2.md'];

const git = (...args: string[]): string => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

function harTag(tag: string): boolean {
  try {
    git('rev-parse', '--verify', '--quiet', `refs/tags/${tag}^{commit}`);
    return true;
  } catch {
    return false;
  }
}

const udenfor = (filer: string[]) => filer.filter((f) => !MAPPER.some((m) => f.startsWith(m)) && !FILER.includes(f));

describe('Intet andet er ændret (accepttest 7, trin 1)', () => {
  it('kun de tilladte filer og mapper er ændret siden main før trin 1', (ctx) => {
    if (!harTag(TAG)) ctx.skip(`Tagget ${TAG} findes ikke her (fx i GitHub Actions, der henter uden tags), så testen kører kun lokalt.`);
    const til = harTag(NAESTE) ? [NAESTE] : [];
    const aendrede = git('diff', '--name-only', '-z', TAG, ...til, '--').split('\0').filter(Boolean);
    expect(udenfor(aendrede)).toEqual([]);
  });

  it('testen kan se forskel: en fil uden for de tilladte ville blive fanget', () => {
    expect(udenfor(['src/modspil/model/udspil.ts', 'tools/udspil/generer.py', 'src/modspil/udspil/data.test.ts', 'CLAUDE.md', 'src/engine/rng.ts'])).toEqual([
      'src/modspil/model/udspil.ts',
      'src/engine/rng.ts',
    ]);
  });
});
