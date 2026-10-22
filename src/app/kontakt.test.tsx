// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { setLang } from '../i18n';
import { ROOT } from '../sprog/danskTekst';
import { Footer } from '../ui/Footer';

// Accepttesten i SPEC-kontaktformular.md, del 3: sidefodens kolonne Kontakt linker til formularen på Om mig, og
// e-mailadressen står ikke i appen.

afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Sidefodens kolonne Kontakt', () => {
  it('"Skriv til mig" / "Write to me" fører til /om-mig/#kontakt', () => {
    for (const [lang, contact, link] of [
      ['da', 'Kontakt', 'Skriv til mig'],
      ['en', 'Contact', 'Write to me'],
    ] as const) {
      setLang(lang);
      render(createElement(Footer));
      const footer = document.querySelector('footer.site-footer') as HTMLElement;
      expect(within(footer).getByRole('heading', { name: contact })).toBeTruthy();
      expect(screen.getByRole('link', { name: link }).getAttribute('href')).toBe('/om-mig/#kontakt');
      expect(footer.querySelector('a[href^="mailto:"]')).toBeNull();
      cleanup();
    }
  });

  it('e-mailadressen står ikke i de filer, appen bygges af', () => {
    const address = ['frank', 'steen', 'pedersen'].join('.');
    const files = execFileSync('git', ['ls-files', '-z', 'src', 'public', 'index.html'], { cwd: ROOT, encoding: 'utf8' })
      .split('\0')
      .filter((f) => f && !/\.test\.tsx?$/.test(f) && !/\.(png|ico|webp|jpg)$/.test(f));
    expect(files.length).toBeGreaterThan(50);
    expect(files.filter((f) => readFileSync(ROOT + f, 'utf8').includes(address))).toEqual([]);
  });
});
