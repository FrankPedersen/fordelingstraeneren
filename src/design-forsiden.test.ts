import { describe, expect, it } from 'vitest';
import tokens from '../design/tokens.json';

// Accepttest for Del 1 i SPEC-design-som-forsiden.md: appen har forsidens farver, skrift, hjørner og knapper.
// Vitest tømmer .css-filer ved import, så stylesheets læses fra disken (som i src/tokens.test.ts).
const nodeFs = 'node:fs';
const fs = (await import(/* @vite-ignore */ nodeFs)) as {
  readFileSync(path: URL, encoding: 'utf8'): string;
  existsSync(path: URL): boolean;
  readdirSync(path: URL, options: { recursive: true; encoding: 'utf8' }): string[];
};
const rod = (sti: string) => new URL(`../${sti}`, import.meta.url);
const read = (sti: string) => fs.readFileSync(rod(sti), 'utf8');

const sheets = Object.fromEntries(
  [
    'src/ui/styles.css',
    'src/farvebehandling/ui/farvebehandling.css',
    'src/farvebehandling/ui/tokens.css',
    'src/pointregnskab/ui/pointregnskab.css',
    'src/haandevaluering/ui/haandevaluering.css',
  ].map((sti) => [sti, read(sti)]),
);

/** Reglerne i et stylesheet: vælger og indhold, uden kommentarer. */
function rules(css: string): { selector: string; body: string }[] {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim().replace(/\s+/g, ' '), body: m[2] }));
}
const alleRegler = Object.entries(sheets).flatMap(([sti, css]) => rules(css).map((r) => ({ sti, ...r })));
const regel = (selector: string) => {
  const fundet = alleRegler.filter((r) => r.selector === selector);
  if (!fundet.length) throw new Error(`${selector} mangler`);
  return fundet.map((r) => r.body).join('\n');
};

const colors = new Map(tokens.color.tokens.map((t) => [t.name, t.value]));
const lengths = new Map(tokens.radius.tokens.map((t) => [t.name, t.value]));
const farve = (navn: string, tilstand: 'light' | 'dark') => {
  const v = colors.get(navn);
  if (!v) throw new Error(`Farven ${navn} mangler i tokens.json`);
  return v[tilstand];
};

type Rgba = [number, number, number, number];
function parse(c: string): Rgba {
  if (c.startsWith('#')) {
    const h = c.length === 4 ? [...c.slice(1)].map((x) => x + x).join('') : c.slice(1);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }
  const [r, g, b, a] = c.match(/rgba?\(([^)]+)\)/)![1].split(',').map(Number);
  return [r, g, b, a ?? 1];
}
/** En flade, der måske er gennemsigtig, lagt oven på en anden. */
const over = (top: Rgba, under: Rgba): Rgba => [
  top[0] * top[3] + under[0] * (1 - top[3]),
  top[1] * top[3] + under[1] * (1 - top[3]),
  top[2] * top[3] + under[2] * (1 - top[3]),
  1,
];
function luminance([r, g, b]: Rgba): number {
  const lin = (c: number) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function kontrast(forgrund: string, baggrund: string, under: string): number {
  const bund = over(parse(baggrund), parse(under));
  const [hi, lo] = [luminance(over(parse(forgrund), bund)), luminance(bund)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Specens tabel: lys og mørk værdi. Mørk tilstand er accent og den valgte flade; resten er som i dag. */
const SPEC: Record<string, [string, string]> = {
  bg: ['#f2f3f4', '#12161c'],
  text: ['#1a1a1a', '#e8ecf1'],
  muted: ['#4a4a4a', '#9aa4b2'],
  line: ['rgba(26,26,26,.12)', '#2e3844'],
  ink: ['#1a1a1a', '#dfe5ec'],
  'ink-text': ['#ffffff', '#12161c'],
  accent: ['#ff9f4a', '#ff9f4a'],
  'accent-text': ['#1a1a1a', '#12161c'],
  'accent-soft': ['#fff1e3', 'rgba(255,159,74,.16)'],
  // Kanten på valgte elementer: #1a1a1a i lys tilstand som i specens tabel, og accent i mørk som i dag.
  'accent-line': ['#1a1a1a', '#ff9f4a'],
};

/** Farver, der bærer betydning, og alt andet, specen ikke nævner: uændret. */
const UÆNDRET: Record<string, [string, string]> = {
  surface: ['#ffffff', '#1b2129'],
  'surface-2': ['#eceff3', '#252d37'],
  table: ['#1f5c4a', '#1a4437'],
  'table-text': ['#ffffff', '#e8ecf1'],
  'fb-hit': ['#d6e4f5', '#1e3a5f'],
  'fb-hit-text': ['#163e73', '#d6e4f5'],
  'fb-hit-line': ['#8daad3', '#5b84bd'],
  'fb-miss': ['#f8dfcc', '#4a2a14'],
  'fb-miss-text': ['#7a3410', '#f8dfcc'],
  'fb-miss-line': ['#e0a27a', '#b9774a'],
  ok: ['#0d6e63', '#5fd0c0'],
  'ok-bg': ['#e2f3ef', '#12302c'],
  'bad-bg': ['#e9ecf1', '#262d37'],
  'fam-4': ['#2563eb', '#60a5fa'],
  'fam-5': ['#15803d', '#4ade80'],
  'fam-6': ['#d97706', '#fbbf24'],
  'fam-7': ['#7c3aed', '#a78bfa'],
  'suit-red': ['#c62828', '#ff6b6b'],
  'footer-bg': ['#1a1a1a', '#1a1a1a'],
  'footer-text': ['#f2f3f4', '#f2f3f4'],
  'footer-accent': ['#ff9f4a', '#ff9f4a'],
};

describe('Farverne (SPEC-design-som-forsiden.md, Del 1)', () => {
  it('tokens.json har specens værdier i lys og mørk tilstand', () => {
    for (const [navn, [light, dark]] of Object.entries(SPEC)) expect(colors.get(navn), navn).toEqual({ light, dark });
  });

  it('farverne, der bærer betydning, og resten er uændrede', () => {
    for (const [navn, [light, dark]] of Object.entries(UÆNDRET)) expect(colors.get(navn), navn).toEqual({ light, dark });
    for (const navn of ['card-face', 'card-edge', 'card-ink', 'card-red', 'card-muted']) {
      expect(colors.get(navn), navn).toEqual(
        { 'card-face': { light: '#ffffff', dark: '#ffffff' }, 'card-edge': { light: '#c9ced6', dark: '#c9ced6' }, 'card-ink': { light: '#1c2330', dark: '#1c2330' }, 'card-red': { light: '#c62828', dark: '#c62828' }, 'card-muted': { light: '#5d6675', dark: '#5d6675' } }[navn],
      );
    }
  });

  it('ingen af de gamle værdier eller system-ui står tilbage i appen', () => {
    // #5d6675 er ikke med: det er også card-muted, og kortenes farver er uændrede. Værdien af --muted er tjekket ovenfor.
    const GAMLE = /#5b6b82|#9fb0c6|#2a3442|#e3e9f1|#f5f6f8|#18202b|#d8dde5|#263241|system-ui/i;
    const filer = fs
      .readdirSync(rod('src'), { recursive: true, encoding: 'utf8' })
      .map((f) => f.replace(/\\/g, '/'))
      .filter((f) => /\.(css|tsx?)$/.test(f) && !/\.test\.tsx?$/.test(f))
      .map((f) => `src/${f}`);
    expect(filer.length).toBeGreaterThan(100);
    for (const sti of [...filer, 'index.html', 'vite.config.ts', 'design/tokens.json']) {
      expect(read(sti).match(GAMLE)?.[0], sti).toBeUndefined();
    }
  });

  it('teksten har kontrast 4,5:1 i begge tilstande, også på den valgte flade', () => {
    const par: [string, string][] = [
      ['text', 'bg'],
      ['text', 'surface'],
      ['text', 'surface-2'],
      ['text', 'accent-soft'],
      ['muted', 'bg'],
      ['muted', 'surface'],
      ['muted', 'surface-2'],
      ['muted', 'accent-soft'],
      ['accent-text', 'accent'],
      ['ink-text', 'ink'],
      ['footer-accent', 'footer-bg'],
    ];
    for (const tilstand of ['light', 'dark'] as const) {
      for (const [forgrund, baggrund] of par) {
        for (const under of ['bg', 'surface']) {
          const k = kontrast(farve(forgrund, tilstand), farve(baggrund, tilstand), farve(under, tilstand));
          expect(k, `${forgrund} på ${baggrund} over ${under} (${tilstand}): ${k.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it('kanten på valgte elementer og fokusringen har kontrast 3:1 mod fladerne', () => {
    for (const tilstand of ['light', 'dark'] as const) {
      for (const navn of ['accent-line', 'focus']) {
        for (const baggrund of ['bg', 'surface']) {
          const k = kontrast(farve(navn, tilstand), farve(baggrund, tilstand), farve(baggrund, tilstand));
          expect(k, `${navn} på ${baggrund} (${tilstand}): ${k.toFixed(2)}`).toBeGreaterThanOrEqual(3);
        }
      }
    }
    expect(regel(':focus-visible')).toMatch(/outline: 3px solid var\(--focus\)/);
    // På de mørke flader i topbjælken og sidefoden er ringen orange som på forsiden.
    expect(regel('.topbar :focus-visible, .site-footer :focus-visible')).toMatch(/outline-color: var\(--footer-accent\)/);
  });

  it('valgte elementer har flade i accent-soft og en kant på 2 px i accent-line, aldrig i accent', () => {
    for (const { sti, selector, body } of alleRegler) {
      for (const d of body.split(';')) {
        if (/^\s*(border|box-shadow|outline)/.test(d) && /var\(--accent\)/.test(d)) {
          // Primærknappens kant har samme farve som dens flade; Spil den selv er en primærknap fra 1000 px i Analyse.
          expect(['.btn.primary', '.fb-analysis .wide-left .fb-play-start'], `${sti}: ${selector}: ${d.trim()}`).toContain(selector);
        }
      }
    }
    const udenKant = new Set(['.track-badge.due', '.fb-row-selected td']);
    const valgte = alleRegler.filter((r) => /background: var\(--accent-soft\)/.test(r.body) && !udenKant.has(r.selector));
    expect(valgte.length).toBeGreaterThan(14);
    for (const { selector, body } of valgte) {
      // 2 px: enten en kant på 2 px eller en kant på 1 px og 1 px indeni.
      const toPx = /(2px|var\(--space-2\)) (solid|dashed) var\(--accent-line\)|box-shadow: inset 0 0 0 1px var\(--accent-line\)/.test(body);
      expect(toPx || selector === '.choice.chosen' || selector === '.cell.selected', `${selector} har ikke 2 px i accent-line`).toBe(true);
    }
    expect(regel('.choice')).toMatch(/border: 2px solid var\(--line\)/);
    expect(regel('button.cell')).toMatch(/border: 2px solid var\(--line\)/);
    expect(regel('.choice.chosen')).toMatch(/border-color: var\(--accent-line\)/);
    expect(regel('.fb-pick-S')).toMatch(/var\(--space-2\) dashed var\(--accent-line\)/);
  });

  it('primærknappen er orange med mørk tekst, og sidens baggrund og værktøjslinjen følger med', () => {
    expect(regel('.btn.primary')).toMatch(/background: var\(--accent\);[\s\S]*color: var\(--accent-text\)/);
    expect(read('index.html')).toContain('<meta name="theme-color" content="#f2f3f4" media="(prefers-color-scheme: light)" />');
    expect(read('vite.config.ts')).toContain("theme_color: '#f2f3f4'");
    expect(read('vite.config.ts')).toContain("background_color: '#f2f3f4'");
  });
});

describe('Hjørnerne (SPEC-design-som-forsiden.md, Del 1)', () => {
  it('kort har 24 px, felter og knapper 12 px, og chips og piller 9999 px', () => {
    expect(lengths.get('radius')).toBe('24px');
    expect(lengths.get('radius-12')).toBe('12px');
    expect(lengths.get('radius-pill')).toBe('9999px');
    expect(lengths.has('radius-10')).toBe(false);
    for (const s of ['.card', '.dialog', '.track-card', '.stat', '.site-footer']) expect(regel(s), s).toMatch(/border-radius: var\(--radius\);/);
    for (const s of ['.btn', '.choice', '.tool', 'input, textarea', '.key', '.cell', '.info-text', '.fb-tab', '.fb-bank-item', '.fb-input', '.fb-import-input', '.fb-editor textarea', '.fb-editor-step']) {
      expect(regel(s), s).toMatch(/border-radius: var\(--radius-12\);/);
    }
    for (const s of ['.badge', '.track-badge', '.legend-chip', '.station-number', '.fb-chip', '.fb-badge', '.pr-chip']) expect(regel(s), s).toMatch(/border-radius: var\(--radius-pill\);/);
  });

  it('hjørnerne står som tokens, så ingen gamle værdier er tilbage', () => {
    for (const { sti, selector, body } of alleRegler) {
      expect(body, `${sti}: ${selector}`).not.toMatch(/border-radius: (10|12|14|20|999)px/);
      expect(body, `${sti}: ${selector}`).not.toContain('--radius-10');
    }
  });
});

describe('Skriften (SPEC-design-som-forsiden.md, Del 1)', () => {
  const tekst = read('public/fonts/tekst.css');

  it('Inter 400 og 600 og Manrope 800 er selvhostet som på forsiden, og intet hentes udefra', () => {
    const flader = [...tekst.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => `${m[1].match(/font-family: '([^']+)'/)![1]} ${m[1].match(/font-weight: (\d+)/)![1]}`);
    expect(new Set(flader)).toEqual(new Set(['Inter 400', 'Inter 600', 'Manrope 800']));
    const css = `${tekst}${read('public/fonts/symboler.css')}`;
    expect(css).not.toMatch(/https?:/);
    for (const [, fil] of css.matchAll(/url\('([^']+)'\)/g)) expect(fs.existsSync(rod(`public/fonts/${fil}`)), fil).toBe(true);
    for (const fil of ['OFL-Inter.txt', 'OFL-Manrope.txt', 'OFL-Noto-Sans-Symbols-2.txt']) expect(fs.existsSync(rod(`public/fonts/${fil}`)), fil).toBe(true);
    const html = read('index.html');
    expect(html).toContain('href="/fonts/tekst.css"');
    expect(html).toContain('href="/fonts/symboler.css"');
    expect(html).not.toMatch(/googleapis|gstatic/);
  });

  it('skrifterne virker også uden net: appen gemmer dem offline', () => {
    expect(read('vite.config.ts')).toMatch(/globPatterns: \[[^\]]*woff2/);
  });

  it('body står i Inter, h1 i Manrope 800, og tokens.json har begge skrifter', () => {
    expect(tokens.type.families.sans.startsWith('Inter,')).toBe(true);
    expect(tokens.type.families.display.startsWith('Manrope,')).toBe(true);
    expect(regel('body')).toContain('font-family: var(--font-sans);');
    expect(regel('h1')).toMatch(/font-family: var\(--font-display\);[\s\S]*font-weight: 800;/);
  });

  it('kun vægtene 400, 600 og 800 bruges, og 800 kun med Manrope', () => {
    for (const { sti, selector, body } of alleRegler) {
      for (const [, vægt] of body.matchAll(/font-weight:\s*([^;]+);/g)) {
        expect(['400', '600', '800'], `${sti}: ${selector}: ${vægt}`).toContain(vægt.trim());
        if (vægt.trim() === '800') expect(body, `${sti}: ${selector}`).toContain('font-family: var(--font-display);');
      }
      expect(body, `${sti}: ${selector}`).not.toMatch(/font:[^;]*\b(500|700|800|900|bold)\b/);
    }
    // Overskrifter, tabeller og fed tekst er ellers fede (700) fra browseren, og Inter har kun 400 og 600.
    expect(regel('h2')).toContain('font-weight: 600;');
    expect(regel('h3')).toContain('font-weight: 600;');
    expect(regel('b, strong, th, h4')).toContain('font-weight: 600;');
  });
});

describe('Topbjælken (SPEC-design-som-forsiden.md, Del 1)', () => {
  it('Guide er en mørk pille med orange tekst som i tegningen, også i mørk tilstand', () => {
    const guide = regel('.fb-guide-bar .btn');
    expect(guide).toContain('background: var(--footer-bg);');
    expect(guide).toContain('color: var(--footer-accent);');
    expect(guide).toContain('border-radius: var(--radius-pill);');
    expect(guide).toContain('border-color: var(--line);');
  });
});
