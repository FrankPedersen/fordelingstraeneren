import { describe, expect, it } from 'vitest';
import tokens from '../design/tokens.json';

// Vitest tømmer .css-filer ved import, så stylesheets læses fra disken (som i src/tokens.test.ts).
const nodeFs = 'node:fs';
const fs = (await import(/* @vite-ignore */ nodeFs)) as { readFileSync(path: URL, encoding: 'utf8'): string };
const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const sheets = {
  'styles.css': read('./ui/styles.css'),
  'farvebehandling.css': read('./farvebehandling/ui/farvebehandling.css'),
  'pointregnskab.css': read('./pointregnskab/ui/pointregnskab.css'),
};

const colors = new Map(tokens.color.tokens.map((t) => [t.name, t.value]));

/** Specens tabel (SPEC-tema.md, Tokens): lys og mørk værdi. Accent og ink har siden fået forsidens værdier (SPEC-design-som-forsiden.md). */
const SPEC: Record<string, [string, string]> = {
  accent: ['#ff9f4a', '#ff9f4a'],
  'accent-soft': ['#fff1e3', 'rgba(255,159,74,.16)'],
  'accent-text': ['#1a1a1a', '#12161c'],
  table: ['#1f5c4a', '#1a4437'],
  'table-text': ['#ffffff', '#e8ecf1'],
  'fb-hit': ['#d6e4f5', '#1e3a5f'],
  'fb-hit-text': ['#163e73', '#d6e4f5'],
  'fb-hit-line': ['#8daad3', '#5b84bd'],
  'fb-miss': ['#f8dfcc', '#4a2a14'],
  'fb-miss-text': ['#7a3410', '#f8dfcc'],
  'fb-miss-line': ['#e0a27a', '#b9774a'],
};

/** Farven som r, g og b fra 0 til 1; en gennemsigtig farve lægges oven på `under`. */
function rgb(color: string, under = '#ffffff'): number[] {
  const m = color.match(/rgba\(([^)]+)\)/);
  if (!m) return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255);
  const [r, g, b, a] = m[1].split(',').map(Number);
  return [r / 255, g / 255, b / 255].map((c, i) => c * a + rgb(under)[i] * (1 - a));
}

/** Relativ luminans efter WCAG 2. */
function luminance(color: string, under?: string): number {
  const [r, g, b] = rgb(color, under);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: string, b: string, under?: string): number {
  const [hi, lo] = [luminance(a, under), luminance(b, under)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Reglerne i et stylesheet: vælger og indhold, uden kommentarer. */
function rules(css: string): { selector: string; body: string }[] {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim().replace(/\s+/g, ' '), body: m[2] }));
}

const rule = (sheet: keyof typeof sheets, selector: string) => {
  const found = rules(sheets[sheet]).find((r) => r.selector === selector);
  if (!found) throw new Error(`${selector} mangler i ${sheet}`);
  return found.body;
};

describe('Temaet (SPEC-tema.md)', () => {
  it('tokens.json har specens værdier, og ink har forsidens værdi i lys tilstand', () => {
    for (const [name, [light, dark]] of Object.entries(SPEC)) expect(colors.get(name), name).toEqual({ light, dark });
    expect(colors.get('ink')).toEqual({ light: '#1a1a1a', dark: '#dfe5ec' });
    expect(colors.get('ink-text')).toEqual({ light: '#ffffff', dark: '#12161c' });
  });

  it('alle tekstpar i tabellen er mindst 4,5:1 i både lys og mørk tilstand', () => {
    const pairs: [string, string][] = [
      ['accent-text', 'accent'],
      ['text', 'accent-soft'],
      ['table-text', 'table'],
      ['fb-hit-text', 'fb-hit'],
      ['fb-miss-text', 'fb-miss'],
    ];
    for (const [text, surface] of pairs) {
      for (const mode of ['light', 'dark'] as const) {
        const ratio = contrast(colors.get(text)![mode], colors.get(surface)![mode], colors.get('surface')![mode]);
        expect(ratio, `${text} på ${surface} (${mode}): ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('ingen primærknap eller valgt tilstand bruger ink; primærknappen bruger accent', () => {
    const selected = /primary|selected|chosen|current|active|pressed|aria-expanded|noted|fb-pick-[NS]|fb-line-best|fb-badge/;
    let checked = 0;
    for (const [sheet, css] of Object.entries(sheets)) {
      for (const r of rules(css)) {
        if (!selected.test(r.selector)) continue;
        checked++;
        expect(r.body, `${sheet}: ${r.selector}`).not.toMatch(/var\(--ink(-text)?\)/);
      }
    }
    expect(checked).toBeGreaterThan(15);
    expect(rule('styles.css', '.btn.primary')).toMatch(/background: var\(--accent\);[\s\S]*color: var\(--accent-text\)/);
    // ink bruges fortsat til målere og fremdrift.
    expect(rule('styles.css', '.meter > span')).toContain('var(--ink)');
    expect(rule('styles.css', '.progress > span')).toContain('var(--ink)');
  });

  it('rigtigt og forkert i fordelingssporets og Pointregnskabets øvelser er uændret og bliver hverken blå eller orange', () => {
    expect(rule('styles.css', '.choice.right')).toMatch(/border-color: var\(--ok\);\s*background: var\(--ok-bg\);/);
    expect(rule('styles.css', '.choice.wrong')).toMatch(/border-style: dashed;/);
    expect(rule('styles.css', '.cell.right')).toMatch(/border-color: var\(--ok\);\s*background: var\(--ok-bg\);/);
    expect(rule('styles.css', '.cell.wrong')).toMatch(/border-style: dashed;/);
    expect(rule('styles.css', '.feedback.ok')).toMatch(/background: var\(--ok-bg\);/);
    expect(rule('styles.css', '.feedback.bad')).toMatch(/background: var\(--bad-bg\);/);
    for (const sheet of ['styles.css', 'pointregnskab.css'] as const) {
      for (const r of rules(sheets[sheet])) expect(r.body, `${sheet}: ${r.selector}`).not.toMatch(/var\(--fb-(hit|miss)/);
    }
  });

  it('farvebehandlingens nås har kant i fb-hit-line, og nås ikke har altid stiplet kant', () => {
    for (const r of rules(sheets['farvebehandling.css'])) {
      if (/var\(--fb-hit\)/.test(r.body)) expect(r.body, r.selector).toMatch(/border: 1px solid var\(--fb-hit-line\)/);
      if (/var\(--fb-miss\)/.test(r.body)) expect(r.body, r.selector).toMatch(/border: 1px dashed var\(--fb-miss-line\)/);
    }
  });
});
