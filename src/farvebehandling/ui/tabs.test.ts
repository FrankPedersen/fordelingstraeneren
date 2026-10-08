import { describe, expect, it } from 'vitest';

// Vitest tømmer .css-filer ved import, så stylesheetet læses fra disken (som i components.test.ts).
const nodeFs = 'node:fs';
const fs = (await import(/* @vite-ignore */ nodeFs)) as { readFileSync(path: URL, encoding: 'utf8'): string };
const css = fs.readFileSync(new URL('./farvebehandling.css', import.meta.url), 'utf8');
const rule = (selector: string) => css.match(new RegExp(`\n${selector.replace('.', '\.')} \{([^}]*)\}`))?.[1] ?? '';

describe('Fanerne (SPEC-analysevindue-layout.md, punkt 1)', () => {
  it('er én bjælke i surface-2, og den aktive fane har accent-soft og kant i accent', () => {
    expect(rule('.fb-tabs')).toMatch(/background: var\(--surface-2\)/);
    expect(rule('.fb-tabs')).toMatch(/border-radius: var\(--radius-12\)/);
    expect(rule('.fb-tabs')).toMatch(/padding: var\(--space-4\)/);
    expect(rule('.fb-tab')).toMatch(/background: transparent/);
    expect(rule('.fb-tab')).toMatch(/min-height: var\(--touch-min\)/);
    expect(rule('.fb-tab-current')).toMatch(/background: var\(--accent-soft\)/);
    expect(rule('.fb-tab-current')).toMatch(/border-color: var\(--accent\)/);
  });
});
