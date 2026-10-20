import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';

// SPEC-neutral-kilde.md, accepttest: efter en build indeholder ingen fil i dist/ teksten "bridgehands" (uanset store og små
// bogstaver). Appen bygges som i `npm run build` (samme vite.config.ts) i en midlertidig mappe, så dist/ ikke røres.
const root = fileURLToPath(new URL('../../', import.meta.url));

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe('Den byggede app (SPEC-neutral-kilde.md)', () => {
  it('ingen fil i dist/ indeholder "bridgehands"', { timeout: 180_000 }, async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'neutral-kilde-dist-'));
    try {
      await build({ root, configFile: join(root, 'vite.config.ts'), logLevel: 'silent', build: { outDir, emptyOutDir: true } });
      const all = files(outDir);
      expect(all.some((f) => /side-\d.*\.js$/.test(f))).toBe(true);
      const hits = all.filter((f) => /bridgehands/i.test(readFileSync(f).toString('latin1'))).map((f) => f.slice(outDir.length + 1));
      expect(hits).toEqual([]);
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
