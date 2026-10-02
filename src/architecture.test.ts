import { describe, expect, it } from 'vitest';

const engineSources = import.meta.glob<string>('./engine/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

describe('Arkitektur', () => {
  it('engine/ importerer ikke fra domain/ eller system/', () => {
    const files = Object.entries(engineSources);
    expect(files.length).toBeGreaterThan(0);
    for (const [file, source] of files) {
      for (const [, specifier] of source.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
        expect(specifier, `${file} importerer ${specifier}`).not.toMatch(
          /(^|\/)(domain|system)(\/|$)/,
        );
      }
    }
  });
});
