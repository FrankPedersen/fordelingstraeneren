// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setLang } from './i18n';
import { Footer } from './ui/Footer';

// Accepttest for SPEC-sidefod.md: sidefoden er ens med forsidens. Målene ses i en rigtig browser i scripts/tjek-sidefod.mjs.
afterEach(() => {
  cleanup();
  setLang('da');
});

const links = (name: string) => within(screen.getByRole('navigation', { name })).getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')]);

describe('Sidefoden', () => {
  it('har logo, Om mig og kontakt, Trænere, Opslag og ©-linjen i forsidens rækkefølge', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'Kontraktbridge' }).getAttribute('href')).toBe('https://www.kontraktbridge.dk/');
    expect(screen.getByRole('link', { name: 'Om mig og kontakt' }).getAttribute('href')).toBe('/om-mig/');
    expect(links('Trænere')).toEqual([
      ['Konventionstræner', '/konventionstraener/'],
      ['Fordeling', '#fordeling'],
      ['Pointregnskab', '#pointregnskab'],
      ['Farvebehandling', '#farvebehandling'],
      ['Håndevaluering', '#haandevaluering'],
    ]);
    expect(links('Opslag')).toEqual([
      ['Analyse', '#analyse'],
      ['Bridgeordbog', '/ordbog/'],
      ['Scoring i bridge', '/scoring/'],
    ]);
    expect(document.querySelector('.site-footer-legal')?.textContent).toContain('© 2026 Frank Pedersen');
  });

  it('har ikke længere afsnittene Om mig og Kontakt; de står på om-mig-siden', () => {
    render(<Footer />);
    const footer = document.querySelector('footer.site-footer') as HTMLElement;
    expect(within(footer).queryByRole('heading', { name: 'Om mig' })).toBeNull();
    expect(within(footer).queryByRole('heading', { name: 'Kontakt' })).toBeNull();
    expect(within(footer).queryByRole('link', { name: 'Skriv til mig' })).toBeNull();
    expect(footer.textContent).not.toMatch(/bridgeentusiast/);
    expect(footer.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(within(footer).getByText('Gratis bridgetræning i browseren. Lavet af Frank Pedersen.')).toBeTruthy();
  });

  it('er på engelsk uden dansk', () => {
    setLang('en');
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'About me and contact' }).getAttribute('href')).toBe('/om-mig/');
    expect(links('Trainers').map((l) => l[0])).toEqual(['Convention trainer', 'Distribution', 'Point count', 'Suit combinations', 'Hand evaluation']);
    expect(links('Reference').map((l) => l[0])).toEqual(['Analysis', 'Bridge dictionary', 'Scoring in bridge']);
    expect(document.querySelector('footer')?.textContent).toContain('Free bridge training in the browser. Made by Frank Pedersen.');
    expect(document.querySelector('footer')?.textContent).not.toMatch(/[æøåÆØÅ]/);
  });
});
