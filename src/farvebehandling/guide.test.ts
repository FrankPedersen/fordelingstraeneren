import { afterEach, describe, expect, it } from 'vitest';
import { setLang } from '../i18n';
import { compactLayout, type BandField } from './analysis';
import da from './content/guide-analyse.md?raw';
import en from './content/guide-analyse.en.md?raw';
import { parseGuide } from './ui/guideMarkdown';

// SPEC-analyse-modul.md, leverancetrin 3: guidens to filer og visningens opdeling af dem.

/** Overskrifternes niveau og nummer ("2.1"), som de står i filen. */
const numbering = (text: string) =>
  [...text.matchAll(/^(#{1,6}) (.+)$/gm)].map(([, hashes, title]) => `${hashes.length}:${/^(\d+(?:\.\d+)*) /.exec(title)?.[1] ?? '-'}`);

afterEach(() => setLang('da'));

describe('Guiden til Analyse (SPEC-analyse-modul.md, trin 3)', () => {
  it('de to filer har samme antal overskrifter med samme nummerering', () => {
    expect(numbering(da).length).toBeGreaterThan(20);
    expect(numbering(en)).toEqual(numbering(da));
  });

  it('ingen af guiderne indeholder "bridgehands"', () => {
    for (const text of [da, en]) expect(text).not.toMatch(/bridgehands/i);
  });

  it('visningen får alle overskrifter, tabeller og lister med', () => {
    for (const text of [da, en]) {
      const blocks = parseGuide(text);
      expect(blocks.filter((b) => b.kind === 'heading').length).toBe(numbering(text).length);
      expect(blocks.filter((b) => b.kind === 'table').length).toBe(text.match(/^\| ?-{3}/gm)!.length);
      expect(blocks.filter((b) => b.kind === 'list').length).toBeGreaterThan(0);
      // Hver tabelrække har lige så mange celler som overskriften.
      for (const b of blocks) if (b.kind === 'table') for (const row of b.rows) expect(row.length).toBe(b.head.length);
    }
  });
});

describe('compactLayout på engelsk', () => {
  it('en renonce hedder "void" på engelsk og "renonce" på dansk', () => {
    const field = { west: 'K x x x', east: '–', count: 1 } as BandField;
    expect(compactLayout(field)).toBe('Kxxx–renonce');
    setLang('en');
    expect(compactLayout(field)).toBe('Kxxx–void');
    expect(compactLayout({ west: '–', east: 'K x x x', count: 1 } as BandField)).toBe('void–Kxxx');
  });
});
