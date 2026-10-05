import { describe, expect, it } from 'vitest';

// Vitest tømmer .css-filer ved import, så stylesheetet læses fra disken (som i src/tokens.test.ts).
const nodeFs = 'node:fs';
const fs = (await import(/* @vite-ignore */ nodeFs)) as { readFileSync(path: URL, encoding: 'utf8'): string };
const css = fs.readFileSync(new URL('./pointregnskab.css', import.meta.url), 'utf8');
const components = Object.fromEntries(
  Object.entries(import.meta.glob<string>('./*.tsx', { query: '?raw', import: 'default', eager: true })).filter(([file]) => !file.endsWith('.test.tsx')),
);

/** Farveværdier og tal med enhed; 0, 1px-streger og procenter er tilladt. */
function violations(source: string): string[] {
  const found: string[] = [];
  for (const m of source.matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/g)) found.push(m[0]);
  for (const m of source.matchAll(/-?\b\d*\.?\d+(px|rem|em|vh|vw|dvh|svh|lvh|pt|ch|ex|fr|cm|mm|in)\b/g)) {
    if (!/^-?1px$/.test(m[0])) found.push(m[0]);
  }
  return found;
}

/** Tal og bogstaver i JSX-tekst, der ikke kommer fra tekstfilen (fx >Vest< eller >Næste<). */
function literalText(source: string): string[] {
  return [...source.matchAll(/>\s*([A-Za-zÆØÅæøå][^<>{}=;()[\]]*?)\s*</g)].map((m) => m[1]);
}

describe('Pointregnskabets komponenter', () => {
  it('indeholder ingen farveværdier og ingen tal med enhed, undtagen 0, 1px-streger og procenter', () => {
    expect(Object.keys(components).length).toBeGreaterThanOrEqual(8);
    expect(violations(css), 'pointregnskab.css').toEqual([]);
    for (const [file, source] of Object.entries(components)) expect(violations(source), file).toEqual([]);
  });

  it('har de nye komponenter Regnskabspanel, Honnørchip og Meldelinje', () => {
    for (const name of ['Regnskabspanel', 'Honnørchip', 'Meldelinje']) {
      expect(Object.keys(components), name).toContain(`./${name}.tsx`);
      expect(components[`./${name}.tsx`], name).toMatch(new RegExp(`export function ${name}\\b`));
    }
  });

  it('har ingen ordlyd i komponenterne; den ligger i texts.ts', () => {
    for (const [file, source] of Object.entries(components)) expect(literalText(source), file).toEqual([]);
  });

  it('fanger farver, enheder og ordlyd i testen selv', () => {
    expect(violations('color: #fff; width: 12px; height: 2rem; border: 1px solid; margin: 0; width: 50%')).toEqual(['#fff', '12px', '2rem']);
    expect(literalText('<p>Næste</p><p>{TEXT.next}</p>')).toEqual(['Næste']);
  });
});
