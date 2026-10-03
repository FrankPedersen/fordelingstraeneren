import { describe, expect, it } from 'vitest';
import tokens from '../design/tokens.json';

// Vitest tømmer .css-filer ved import (også med ?raw), så styles.css læses fra disken.
// Modulnavnet står i en variabel, så Nodes typer ikke trækkes ind i resten af programmet.
const nodeFs = 'node:fs';
const fs = (await import(/* @vite-ignore */ nodeFs)) as { readFileSync(path: URL, encoding: 'utf8'): string };
const css = fs.readFileSync(new URL('./ui/styles.css', import.meta.url), 'utf8');

/** CSS-variablerne i en blok, uden --. */
function variables(block: string): Map<string, string> {
  return new Map([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));
}

const light = variables(css.match(/:root\s*\{([^}]*)\}/)![1]);
const dark = variables(css.match(/prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([^}]*)\}/)![1]);
const colors = new Map(tokens.color.tokens.map((t) => [t.name, t.value]));
const lengths = new Map(
  [...tokens.spacing.tokens, ...tokens.radius.tokens, ...tokens.size.tokens].map((t) => [t.name, t.value]),
);

describe('Designtokens', () => {
  it('har hver farve og radius fra :root med samme navn og lyse værdi', () => {
    expect(light.size).toBeGreaterThan(0);
    for (const [name, value] of light) {
      const token = colors.get(name)?.light ?? lengths.get(name);
      expect(token, `--${name}`).toBe(value);
    }
  });

  it('har de mørke værdier fra prefers-color-scheme: dark', () => {
    expect(dark.size).toBeGreaterThan(0);
    for (const [name, value] of dark) {
      expect(colors.get(name)?.dark, `--${name}`).toBe(value);
    }
  });

  it('henter de øvrige farver og alle længder fra styles.css', () => {
    const source = css.toLowerCase();
    for (const [name, value] of colors) {
      if (light.has(name)) continue;
      expect(source, name).toContain(value.light.toLowerCase());
      expect(source, name).toContain(value.dark.toLowerCase());
    }
    for (const [name, value] of lengths) {
      expect(source, name).toMatch(new RegExp(`[\\s(:]${value.replace('.', '\\.')}[\\s;)]`));
    }
  });

  it('bruger appens skrift', () => {
    const body = css.match(/\nbody\s*\{([^}]*)\}/)![1];
    expect(body).toContain(`font-family: ${tokens.type.families.sans};`);
    expect(body).toContain(`font-size: ${tokens.type.groups[1].styles[0].fontSize};`);
  });

  it('har unikke navne, en lys og en mørk værdi pr. farve og en note på hver token', () => {
    const all = [...tokens.color.tokens, ...tokens.spacing.tokens, ...tokens.radius.tokens, ...tokens.size.tokens];
    expect(new Set(all.map((t) => t.name)).size).toBe(all.length);
    for (const t of all) expect(t.usage.length, t.name).toBeGreaterThan(10);
    for (const t of tokens.color.tokens) {
      expect(t.value.light, t.name).toBeTruthy();
      expect(t.value.dark, t.name).toBeTruthy();
    }
  });
});
