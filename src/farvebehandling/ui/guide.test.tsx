// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../app/App';
import { setLang } from '../../i18n';
import da from '../content/guide-analyse.md?raw';
import en from '../content/guide-analyse.en.md?raw';
import { TEST_BANK } from '../testBank';
import { Analysevindue } from './Analysevindue';

// SPEC-analyse-modul.md, leverancetrin 3: knappen Guide øverst i Analyse og visningen af guiden. Løseren svarer hurtigt
// med E K B 5 / 4 3 2 fra banken som i FarvebehandlingScreen.test.tsx; her tæller kun, at situationen bevares.
vi.mock('../solver/client', async () => {
  const { TEST_BANK: bank } = await import('../testBank');
  const source = bank.find((b) => b.combination.id === '432-AKJ5')!;
  const { goals, tricks, ...base } = source.solution;
  return {
    SolveCancelled: class extends Error {},
    createSolver: () => ({
      async solve(request: { kind: string; goal?: number }) {
        if (request.kind === 'tricks') return { kind: 'tricks', base, result: tricks };
        if (request.kind === 'goal') return { kind: 'goal', base, result: goals[String(request.goal)] ?? goals['3'] };
        return { kind: 'line', lead: goals['3'].leads[0], errors: [] };
      },
      cancel() {},
    }),
  };
});

const BANK = TEST_BANK.slice(0, 5);
const WAIT = { timeout: 10_000 };
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const current = () => within(screen.getByRole('list', { name: 'Banken' })).getByRole('button', { current: true }).textContent;
/** Overskrifterne i en guidefil uden "#". */
const headings = (text: string) => [...text.matchAll(/^(#{1,6}) (.+)$/gm)].map(([, hashes, title]) => ({ level: hashes.length, title }));

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  window.scrollTo = vi.fn();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Guiden i Analyse (SPEC-analyse-modul.md, trin 3)', { timeout: 30_000 }, () => {
  it('knappen Guide står øverst i modulet og åbner guiden', async () => {
    window.history.replaceState(null, '', '/#analyse');
    render(<App />);
    const guide = await screen.findByRole('button', { name: 'Guide' }, WAIT);
    // Øverst: før alle analysens øvrige knapper (efter skærmens hoved).
    const buttons = [...document.querySelectorAll('main button')].filter((b) => !b.closest('header'));
    expect(buttons[0]).toBe(guide);
    fireEvent.click(screen.getByRole('button', { name: 'Hjælp: Guide' }));
    expect(screen.getByText('Sådan bruger du analysen, og sådan regner den.')).toBeTruthy();
    fireEvent.click(guide);
    expect(await screen.findByRole('heading', { name: 'Guide til Farvebehandling – Analyse' }, WAIT)).toBeTruthy();
  });

  it('knappen Guide står også øverst i fanen Analyse i Farvebehandling', async () => {
    render(<App />);
    click('Farvebehandling');
    await screen.findByRole('button', { name: 'Start dagens session' }, WAIT);
    click('Analyse');
    click('Guide');
    expect(await screen.findByRole('heading', { name: 'Guide til Farvebehandling – Analyse' }, WAIT)).toBeTruthy();
  });

  it('Tilbage viser samme kombination og situation som før', async () => {
    render(<Analysevindue bank={BANK} />);
    fireEvent.click(within(screen.getByRole('list', { name: 'Banken' })).getAllByRole('button')[2]);
    click('Angiv situationen');
    click('Kendte kort i andre farver, Vest: én mere');
    expect(current()).toMatch(/^3\. /);
    click('Guide');
    await screen.findByRole('heading', { name: 'Guide til Farvebehandling – Analyse' }, WAIT);
    expect(screen.queryByRole('list', { name: 'Banken' })).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'Tilbage til analysen' })[0]);
    expect(current()).toMatch(/^3\. /);
    expect(screen.getByText('Vest 1 kendt kort', { selector: '.fb-situation-chips li' })).toBeTruthy();
  });

  it('hver overskrift i guide-analyse.md vises, og indholdsfortegnelsen linker til afsnittene på niveau 2', async () => {
    window.history.replaceState(null, '', '/#analyse');
    render(<Analysevindue bank={BANK} />);
    click('Guide');
    await screen.findByRole('heading', { name: 'Guide til Farvebehandling – Analyse' }, WAIT);
    const shown = screen.getAllByRole('heading').map((h) => h.textContent);
    for (const { title } of headings(da)) expect(shown, title).toContain(title);
    const toc = screen.getByRole('navigation', { name: 'Indhold' });
    const links = within(toc).getAllByRole('link');
    const level2 = headings(da).filter((h) => h.level === 2);
    expect(links.map((a) => a.textContent)).toEqual(level2.map((h) => h.title));
    for (const link of links) {
      const target = document.getElementById(link.getAttribute('href')!.slice(1));
      expect(target?.textContent, link.textContent!).toBe(link.textContent);
    }
    // Et tryk i indholdsfortegnelsen skifter ikke appens adresse, så modulet bliver stående.
    fireEvent.click(links[3]);
    expect(window.location.hash).toBe('#analyse');
    expect(screen.getByRole('heading', { name: 'Guide til Farvebehandling – Analyse' })).toBeTruthy();
  });

  it('guidens tabeller vises som tabeller, hver i sin egen rullekasse', async () => {
    render(<Analysevindue bank={BANK} />);
    click('Guide');
    await screen.findByRole('heading', { name: 'Guide til Farvebehandling – Analyse' }, WAIT);
    const tables = [...document.querySelectorAll('.fb-guide table')];
    expect(tables.length).toBe(da.match(/^\| ?-{3}/gm)!.length);
    for (const table of tables) {
      expect(table.parentElement!.classList.contains('fb-table-scroll')).toBe(true);
      expect(table.querySelectorAll('thead th').length).toBeGreaterThan(1);
    }
    // Fed og kode.
    expect(document.querySelector('.fb-guide strong')?.textContent).toBeTruthy();
    expect([...document.querySelectorAll('.fb-guide code')].some((c) => c.textContent === 'EK65-B43')).toBe(true);
  });

  it('på engelsk viser knappen Guide den engelske guide', async () => {
    setLang('en');
    render(<Analysevindue bank={BANK} />);
    fireEvent.click(screen.getByRole('button', { name: 'Help: Guide' }));
    expect(screen.getByText('How to use the analysis, and how it calculates.')).toBeTruthy();
    click('Guide');
    await screen.findByRole('heading', { name: 'Guide to Suit Combinations – Analysis' }, WAIT);
    const shown = screen.getAllByRole('heading').map((h) => h.textContent);
    for (const { title } of headings(en)) expect(shown, title).toContain(title);
    expect(within(screen.getByRole('navigation', { name: 'Contents' })).getAllByRole('link')).toHaveLength(headings(en).filter((h) => h.level === 2).length);
    expect(screen.getAllByRole('button', { name: 'Back to the analysis' }).length).toBeGreaterThan(0);
  });
});
