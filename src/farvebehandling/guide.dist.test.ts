import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';

// SPEC-analyse-modul.md, leverancetrin 3: guiden er ikke med i appens første indlæsning, men kan åbnes offline efter
// første besøg. Appen bygges som i `npm run build` (samme vite.config.ts) i en midlertidig mappe, så dist/ ikke røres.
const root = fileURLToPath(new URL('../../', import.meta.url));

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe('Guiden i den byggede app (SPEC-analyse-modul.md)', () => {
  it('hver guide ligger i sin egen fil, der ikke hentes ved første indlæsning, men er i service workerens offline-liste', { timeout: 180_000 }, async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'guide-dist-'));
    try {
      await build({ root, configFile: join(root, 'vite.config.ts'), logLevel: 'silent', build: { outDir, emptyOutDir: true } });
      const all = files(outDir);
      const read = (f: string) => readFileSync(f).toString('utf8');
      const name = (f: string) => f.slice(outDir.length + 1).split('\\').join('/');
      // Det, der hentes ved første indlæsning: index.html, dens script og dets statiske imports (modulepreload).
      const html = read(join(outDir, 'index.html'));
      const initial = [...html.matchAll(/(?:src|href)="\/?([^"]+\.js)"/g)].map((m) => m[1]);
      expect(initial.length).toBeGreaterThan(0);
      const sw = read(join(outDir, 'sw.js'));
      for (const marker of ['Esset skal væk, før hånden kan tage sine stik', 'The ace has to go before your hand can take its tricks']) {
        const holders = all.filter((f) => f.endsWith('.js') && read(f).includes(marker)).map(name);
        expect(holders, marker).toHaveLength(1);
        expect(initial, marker).not.toContain(holders[0]);
        // Guiden ligger ikke i Farvebehandlings egen fil (klassen fb-screen), men hentes først, når knappen bruges.
        expect(read(join(outDir, holders[0])).includes('fb-screen'), marker).toBe(false);
        expect(sw, marker).toContain(holders[0]);
      }
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
