import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bydeform } from '../sprog/bydeform';

// Sidehovedet har de samme Open Graph-mærker som de andre sider på www.kontraktbridge.dk (Franks ønske, 27. oktober 2026)
const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const og = (navn: string) => html.match(new RegExp(`<meta property="og:${navn}" content="([^"]*)"`))?.[1];
const beskrivelse = html.match(/<meta name="description" content="([^"]*)"/)?.[1];

describe('sidehovedet', () => {
  it('har og:type, og:locale og og:site_name som forsiden, Om mig, ordbogen og Scoring i bridge', () => {
    expect(og('type')).toBe('website');
    expect(og('locale')).toBe('da_DK');
    expect(og('site_name')).toBe('Kontraktbridge');
  });

  it('beholder titel, beskrivelse og adresse', () => {
    expect(og('title')).toBe('Fordelingstræneren – fordeling, point og spilføring i bridge');
    expect(og('url')).toBe('https://www.kontraktbridge.dk/fordelingstraeneren/');
    expect(og('description')).toMatch(/^Bridgetræning fem minutter om dagen/);
    expect(beskrivelse).toBe(og('description'));
  });

  // danskTekst.ts læser ikke sidehovedet (docs/beskrivende-form.md, Franks svar 31. oktober 2026)
  it('beskrivelsen står i beskrivende form', () => {
    expect(bydeform(beskrivelse!)).toEqual([]);
  });
});
