// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import tokens from '../../design/tokens.json';
import { defaultSaved, STORAGE_KEY } from '../engine/storage';
import { setLang } from '../i18n';
import App from './App';

// SPEC-forside-bred.md, del 2: forsiden fra 1000 px. Selve layoutet ses i en rigtig browser (skærmbillederne ved 390,
// 900, 1024 og 1440 px); her låses markuppen, som CSS'en bygger på, og at det brede layout kun gælder fra 1000 px.

// Vitest tømmer .css-filer ved import, så styles.css læses fra disken (som i tokens.test.ts). I jsdom er import.meta.url
// ikke en fil, så stien regnes fra repoets rod, hvor testene køres.
const nodeFs = 'node:fs';
const fs = (await import(/* @vite-ignore */ nodeFs)) as { readFileSync(path: string, encoding: 'utf8'): string };
const cwd = (globalThis as unknown as { process: { cwd(): string } }).process.cwd();
const css = fs.readFileSync(`${cwd}/src/ui/styles.css`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Reglerne i en CSS-tekst som [selektor, erklæringer]; en @media-blok springes over og står i `media`. */
function rules(text: string): { rules: [string, string][]; media: Map<string, string> } {
  const out: [string, string][] = [];
  const media = new Map<string, string>();
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf('{', i);
    if (open < 0) break;
    const head = text.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (depth > 0 && j < text.length) {
      if (text[j] === '{') depth++;
      else if (text[j] === '}') depth--;
      j++;
    }
    const body = text.slice(open + 1, j - 1);
    if (head.startsWith('@media')) media.set(head, (media.get(head) ?? '') + body);
    else out.push([head, body.trim()]);
    i = j;
  }
  return { rules: out, media };
}

const top = rules(css);
const wideHead = [...top.media.keys()].find((h) => /min-width:\s*1000px/.test(h));
const wide = wideHead ? rules(top.media.get(wideHead)!).rules : [];
/** Erklæringerne for en selektor i det brede layout (alle regler, hvor selektoren står i listen). */
const wideDecl = (selector: string) =>
  wide
    .filter(([s]) => s.split(',').map((x) => x.trim()).includes(selector))
    .map(([, d]) => d)
    .join(';');
/** Den nye klasse .home (ikke .home-group, .home-head osv.) og beholderen .home-groups. */
const mentionsWide = (selector: string) => /\.home(?![\w-])|\.home-groups/.test(selector);

beforeEach(() => {
  window.scrollTo = vi.fn();
  window.history.replaceState(null, '', '/');
  localStorage.clear();
  // Fordeling har en session, så forsiden viser I dag (ikke Velkomst).
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...defaultSaved(), sessions: [{ day: '2026-10-29', ms: 300000, correct: 10, total: 12, cpm: 20 }] }),
  );
});
afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Forsiden fra 1000 px (SPEC-forside-bred.md, del 2)', () => {
  it('forsidens rod har klassen home, og grupperne står i én omsluttende div i samme rækkefølge som før', () => {
    render(<App />);
    const main = document.querySelector('main')!;
    expect([...main.classList]).toEqual(['screen', 'home']);
    const groups = main.querySelector(':scope > .home-groups')!;
    expect(groups).toBeTruthy();
    expect([...groups.children].map((c) => `${c.tagName}.${c.className}`)).toEqual(['SECTION.home-group', 'SECTION.home-group', 'SECTION.home-group']);
    expect([...groups.querySelectorAll(':scope > section > .with-info > h2')].map((h) => h.textContent)).toEqual(['Optælling', 'Spilføring', 'Vurdering']);
    // I dag står før grupperne, Vejledning og Indstillinger efter.
    const today = main.querySelector('[aria-labelledby="today"]')!;
    expect(today.compareDocumentPosition(groups) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(groups.nextElementSibling?.querySelector('h2')?.textContent).toBe('Vejledning');
  });

  it('sporets kort, dets ⓘ og forklaringen står i samme rækkefølge som før: kortet, ⓘ og forklaringen under kortet', () => {
    render(<App />);
    const rows = [...document.querySelectorAll('.home-groups section.home-group > .with-info:not(:first-child)')];
    expect(rows.length).toBe(5);
    for (const row of rows) {
      const [card, info] = [...row.children];
      expect(card.matches('button.track-card')).toBe(true);
      const button = info.querySelector('button.info-btn') as HTMLButtonElement;
      expect(button.getAttribute('aria-label')).toMatch(/^Hjælp: /);
      fireEvent.click(button);
      expect(button.getAttribute('aria-expanded')).toBe('true');
      const text = row.querySelector('.info-text')!;
      expect(card.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      fireEvent.click(button);
    }
  });

  it('home-width er 1200px i :root og i tokens.json', () => {
    expect(css).toMatch(/:root\s*\{[^}]*--home-width:\s*1200px;/);
    expect(tokens.size.tokens.find((t) => t.name === 'home-width')?.value).toBe('1200px');
  });

  it('under 1000 px er forsiden som i dag: uden for @media (min-width: 1000px) er home-groups kun display: contents', () => {
    expect(wideHead).toBeTruthy();
    const outside = top.rules.filter(([s]) => mentionsWide(s));
    expect(outside).toEqual([['.home-groups', 'display: contents;']]);
    for (const [head, body] of top.media) {
      if (head === wideHead) continue;
      expect(rules(body).rules.filter(([s]) => mentionsWide(s)), head).toEqual([]);
    }
  });

  it('fra 1000 px: højst home-width med 32 px sidemargen, tre lige brede kolonner med 24 px imellem, og knappen i I dag mindst 280 px', () => {
    expect(wideDecl('.screen.home')).toMatch(/max-width:\s*var\(--home-width\)/);
    expect(wideDecl('.screen.home')).toMatch(/padding-left:\s*32px/);
    expect(wideDecl('.screen.home')).toMatch(/padding-right:\s*32px/);
    expect(wideDecl('.home-groups')).toMatch(/display:\s*flex/);
    expect(wideDecl('.home-groups')).toMatch(/flex-wrap:\s*wrap/);
    expect(wideDecl('.home-groups')).toMatch(/gap:\s*24px/);
    // 280 px og ikke specens 300 px: med Windows' rullebjælke (15 px) er der 945 px ved 1024 px, og 3 × 300 + 2 × 24 = 948.
    expect(wideDecl('.home .home-group')).toMatch(/flex:\s*1 1 280px/);
    expect(wideDecl('.home .home-group')).toMatch(/min-width:\s*0/);
    expect(wide.some(([s, d]) => /\[aria-labelledby='today'\]\s*>\s*\.btn/.test(s) && /min-width:\s*280px/.test(d))).toBe(true);
  });

  it('fra 1000 px følger Vejledning og Indstillinger gruppernes tre kolonner, og Velkomsts og Vejlednings knapper har naturlig bredde, mindst 280 px (Afklaret 13 og 21)', () => {
    expect(wideDecl('.screen.home')).toMatch(/display:\s*grid/);
    // Tre lige brede kolonner med 24 px imellem, som grupperne.
    expect(wideDecl('.screen.home')).toMatch(/grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
    expect(wideDecl('.screen.home')).toMatch(/column-gap:\s*24px/);
    expect(wideDecl('.screen.home > *')).toMatch(/grid-column:\s*1 \/ -1/);
    expect(wideDecl('.home > section.card:not([aria-labelledby])')).toMatch(/grid-column:\s*span 2/);
    expect(wideDecl('.home > section.card:not([aria-labelledby])')).not.toMatch(/grid-column:\s*auto/);
    expect(wideDecl('.home > .two')).toMatch(/grid-column:\s*auto/);
    for (const selector of [".home > [aria-labelledby='welcome'] > .btn", '.home > section.card:not([aria-labelledby]) > .btn']) {
      expect(wideDecl(selector), selector).toMatch(/min-width:\s*280px/);
    }
    // Indstillinger fylder den tredje kolonne og har sit ⓘ inde i knappen som sporenes, med en trykflade på 44 px.
    expect(wideDecl('.home > .two .btn')).not.toMatch(/flex:\s*0 0 auto/);
    expect(wideDecl('.home > .two .info-btn')).toMatch(/position:\s*absolute/);
    expect(wideDecl('.home > .two .info-btn::after')).toMatch(/inset:\s*-10px/);
  });

  it('fra 1000 px står sidefodens kolonner side om side på forsiden med ophavslinjen under (Afklaret 14)', () => {
    expect(wideDecl('.home .site-footer')).toMatch(/grid-template-columns:[^;]*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
    expect(wideDecl('.home .site-footer-legal')).toMatch(/grid-column:\s*1 \/ -1/);
    // Kun forsidens sidefod: ingen bred regel for .site-footer uden .home.
    expect(wide.filter(([s]) => s.includes('site-footer') && !s.includes('.home'))).toEqual([]);
  });

  it('fra 1000 px står sporets ⓘ i kortet med en trykflade på mindst 44 px, og topbjælken har forsidens indre bredde', () => {
    const info = wide.find(([s]) => /\.home-group\s*>\s*\.with-info:not\(:first-child\)\s*\.info-btn$/.test(s));
    expect(info?.[1]).toMatch(/position:\s*absolute/);
    const area = wide.find(([s]) => /\.home-group\s*>\s*\.with-info:not\(:first-child\)\s*\.info-btn::after$/.test(s));
    // Cirklen er 26 px med en kant på 1 px; ::after regnes fra indersiden (24 px), så 10 px til hver side giver 44 px.
    expect(area?.[1]).toMatch(/inset:\s*-10px;/);
    expect(wideDecl('.topbar:has(+ .home)')).toMatch(/padding-left:\s*max\(/);
  });
});
