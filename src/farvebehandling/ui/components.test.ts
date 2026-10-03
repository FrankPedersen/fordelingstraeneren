import { describe, expect, it } from 'vitest';

// Vitest tømmer .css-filer ved import, så stylesheetet læses fra disken (som i src/tokens.test.ts).
const nodeFs = 'node:fs';
const fs = (await import(/* @vite-ignore */ nodeFs)) as { readFileSync(path: URL, encoding: 'utf8'): string };
const css = fs.readFileSync(new URL('./farvebehandling.css', import.meta.url), 'utf8');
const components = import.meta.glob<string>('./*.tsx', { query: '?raw', import: 'default', eager: true });

/** Farveværdier og tal med enhed; 0, 1px-streger og procenter er tilladt. */
function violations(source: string): string[] {
  const found: string[] = [];
  for (const m of source.matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/g)) found.push(m[0]);
  for (const m of source.matchAll(/-?\b\d*\.?\d+(px|rem|em|vh|vw|dvh|svh|lvh|pt|ch|ex|fr|cm|mm|in)\b/g)) {
    if (!/^-?1px$/.test(m[0])) found.push(m[0]);
  }
  return found;
}

describe('Farvebehandlingens komponenter', () => {
  it('indeholder ingen farveværdier og ingen tal med enhed, undtagen 0, 1px-streger og procenter', () => {
    expect(Object.keys(components).length).toBeGreaterThanOrEqual(5);
    expect(violations(css), 'farvebehandling.css').toEqual([]);
    for (const [file, source] of Object.entries(components)) expect(violations(source), file).toEqual([]);
  });

  it('har komponenterne fra tegnefladen', () => {
    for (const name of ['Bridgebord', 'Kortvælger', 'Linjekort', 'Resultatkort', 'Sandsynlighedsbånd']) {
      expect(Object.keys(components), name).toContain(`./${name}.tsx`);
      expect(components[`./${name}.tsx`], name).toMatch(new RegExp(`export function ${name}\\b`));
    }
  });

  it('fanger farver og enheder i testen selv', () => {
    expect(violations('color: #fff; width: 12px; height: 2rem; border: 1px solid; margin: 0; width: 50%')).toEqual(['#fff', '12px', '2rem']);
  });
});
