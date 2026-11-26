import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../../sprog/danskTekst';
import { TAG } from './hjaelp';

/*
 * Accepttest 8 i SPEC-udspilstal.md: intet andet er ændret siden `v51-foer-udspilstal` (main før ændringen) end filerne
 * i Afgrænsningen og specen. Ikke-committede ændringer og nye, usporede filer tæller med. Desuden:
 * - raadanalyse.ts har kun fået nye linjer (analysen og tabellerne i 7a er uændrede);
 * - kompas.test.tsx har kun fået tidsgrænsen 30 s (`});` → `}, 30_000);`);
 * - CLAUDE.md har fået én ny linje og mistet ingen, og scripts/ordliste.txt har kun fået nye ord.
 * Når næste grens tag (`v52-foer-*`) findes, sammenlignes de to tags, så senere grene ikke gør testen rød. Mangler
 * tagget (GitHub Actions henter ingen tags), springes testen over med en besked.
 */

const TILLADT = [
  'src/modspil/udspil/raadanalyse.ts',
  'tools/udspil/raadanalyse.mjs',
  'src/modspil/content/udspil/raadtal.json',
  'src/modspil/model/findUdspilTekst.ts',
  'src/modspil/model/findUdspil.ts',
  'src/modspil/ui/tekster.ts',
  'src/modspil/ui/kompas.test.tsx',
  'CLAUDE.md',
  'scripts/ordliste.txt',
  'SPEC-udspilstal.md',
];
/** Nye filer: raadtal.json, specen og accepttestene. */
const NYE = ['src/modspil/content/udspil/raadtal.json', 'SPEC-udspilstal.md'];
const MAPPE = 'src/modspil/udspilstal/';

const git = (...args: string[]): string => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

function harTag(): boolean {
  try {
    git('rev-parse', '--verify', '--quiet', `refs/tags/${TAG}^{commit}`);
    return true;
  } catch {
    return false;
  }
}

/** Næste grens tag, når det findes. */
const naeste = (): string[] => git('tag', '--list', 'v52-foer-*').split('\n').filter(Boolean).slice(0, 1);

/** Ændringerne siden tagget som [status, fil]; mod arbejdsmappen tæller ikke-committede og nye, usporede filer med. */
function aendringer(): [string, string][] {
  const til = naeste();
  const felter = git('diff', '--name-status', '-z', '--no-renames', TAG, ...til, '--').split('\0').filter(Boolean);
  const ud: [string, string][] = [];
  for (let i = 0; i < felter.length; i += 2) ud.push([felter[i], felter[i + 1]]);
  if (til.length === 0) for (const f of git('ls-files', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean)) ud.push(['?', f]);
  return ud;
}

/** Ændringer, der ikke er tilladt. */
function ulovlige(liste: readonly (readonly [string, string])[]): string[] {
  return liste
    .filter(([status, f]) => {
      const ny = status === 'A' || status === '?';
      if (f.startsWith(MAPPE)) return !ny;
      if (NYE.includes(f)) return !ny;
      return !(TILLADT.includes(f) && status === 'M');
    })
    .map(([s, f]) => `${s} ${f}`);
}

/** Linjerne, en fil har mistet (-) og fået (+) siden tagget. */
function linjer(fil: string): { minus: string[]; plus: string[] } {
  const diff = git('diff', '-U0', TAG, ...naeste(), '--', fil)
    .split('\n')
    .map((l) => l.replace(/\r$/, ''))
    .filter((l) => /^[-+]/.test(l) && !/^(---|\+\+\+) /.test(l));
  return { minus: diff.filter((l) => l.startsWith('-')).map((l) => l.slice(1)), plus: diff.filter((l) => l.startsWith('+')).map((l) => l.slice(1)) };
}

const springOver = `Tagget ${TAG} findes ikke her (fx i GitHub Actions, der henter uden tags), så testen kører kun lokalt.`;

describe('Intet andet er ændret (accepttest 8)', () => {
  it('kun filerne i Afgrænsningen og specen er ændret siden tagget', (ctx) => {
    if (!harTag()) ctx.skip(springOver);
    expect(ulovlige(aendringer())).toEqual([]);
  });

  it('raadanalyse.ts har kun fået nye linjer', (ctx) => {
    if (!harTag()) ctx.skip(springOver);
    const { minus, plus } = linjer('src/modspil/udspil/raadanalyse.ts');
    expect(minus).toEqual([]);
    expect(plus.length).toBeGreaterThan(0);
  });

  it('kompas.test.tsx har kun fået tidsgrænsen 30 s', (ctx) => {
    if (!harTag()) ctx.skip(springOver);
    const { minus, plus } = linjer('src/modspil/ui/kompas.test.tsx');
    expect(minus.length).toBeGreaterThan(0);
    expect(new Set(minus)).toEqual(new Set(['  });']));
    expect(new Set(plus)).toEqual(new Set(['  }, 30_000);']));
    expect(plus).toHaveLength(minus.length);
  });

  it('CLAUDE.md har fået én ny linje, og ordlisten har kun fået nye ord', (ctx) => {
    if (!harTag()) ctx.skip(springOver);
    const claude = linjer('CLAUDE.md');
    expect(claude.minus).toEqual([]);
    expect(claude.plus.filter((l) => l.trim() !== '')).toHaveLength(1);
    expect(linjer('scripts/ordliste.txt').minus).toEqual([]);
  });

  it('testen kan se forskel', () => {
    expect(ulovlige([['M', 'src/modspil/model/findUdspil.ts'], ['A', 'src/modspil/udspilstal/x.test.ts'], ['?', 'SPEC-udspilstal.md']])).toEqual([]);
    expect(ulovlige([['M', 'src/modspil/model/udspilPris.ts']])).toEqual(['M src/modspil/model/udspilPris.ts']);
    expect(ulovlige([['M', 'src/modspil/content/udspil/situationer.json']])).toEqual(['M src/modspil/content/udspil/situationer.json']);
    expect(ulovlige([['D', 'src/modspil/udspilstal/foer.json']])).toEqual(['D src/modspil/udspilstal/foer.json']);
    expect(ulovlige([['M', 'docs/MODEL.md']])).toEqual(['M docs/MODEL.md']);
  });
});
