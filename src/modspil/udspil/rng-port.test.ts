import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mulberry32, shuffle } from '../../engine/rng';
import { ROOT } from '../../sprog/danskTekst';

/*
 * Accepttest 2 i SPEC-modspil-v2.md, trin 1: porten af rng.ts (tools/udspil/rng.py) giver de samme tal som appen for
 * seed 0, 1, 42 og 2³²−1: de første 20 uint32, 20 × int(13), 20 × int(52) og en blandet kortstok. De faste tal står i
 * tools/udspil/rng-fast.json (skrevet af `python tools/udspil/rng.py --fast`), så TS-siden altid testes. Findes Python,
 * køres porten også direkte; ellers springes den del over med en besked.
 */

const SEEDS = [0, 1, 42, 2 ** 32 - 1];

function tsTal(): Record<string, { uint32: number[]; int13: number[]; int52: number[]; kortstok: number[] }> {
  const ud: ReturnType<typeof tsTal> = {};
  for (const seed of SEEDS) {
    let r = mulberry32(seed);
    const uint32 = Array.from({ length: 20 }, () => r.uint32());
    r = mulberry32(seed);
    const int13 = Array.from({ length: 20 }, () => r.int(13));
    r = mulberry32(seed);
    const int52 = Array.from({ length: 20 }, () => r.int(52));
    const kortstok = shuffle(
      Array.from({ length: 52 }, (_, c) => c),
      mulberry32(seed),
    );
    ud[String(seed)] = { uint32, int13, int52, kortstok };
  }
  return ud;
}

/** Python-kommandoen på maskinen (python3, python eller py), eller null. */
function python(): string | null {
  for (const cmd of ['python3', 'python', 'py']) {
    try {
      if (/Python 3/.test(execFileSync(cmd, ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))) return cmd;
    } catch {
      // næste kommando
    }
  }
  return null;
}

describe('Porten af rng.ts (accepttest 2)', () => {
  it('appens mulberry32, int og shuffle giver de faste tal i rng-fast.json', () => {
    const fast = JSON.parse(readFileSync(`${ROOT}tools/udspil/rng-fast.json`, 'utf8'));
    expect(tsTal()).toEqual(fast);
  });

  it('Pythons port giver de samme tal som appen', (ctx) => {
    const cmd = python();
    if (!cmd) ctx.skip('Python findes ikke på maskinen; de faste tal i rng-fast.json er testet ovenfor.');
    const ud = execFileSync(cmd!, [`${ROOT}tools/udspil/rng.py`, '--fast'], { encoding: 'utf8' });
    expect(JSON.parse(ud)).toEqual(tsTal());
  });
});
