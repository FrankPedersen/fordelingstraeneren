// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSaved, STORAGE_KEY } from '../engine/storage';
import { setLang } from '../i18n';
import App from './App';
import { HomeScreen } from './screens/HomeScreen';
import { GROUPS, TRACK_ITEMS, type TrackItem } from './tracks';

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const before = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
const groupTitles = () => [...document.querySelectorAll('section.home-group > .with-info > h2')].map((h) => h.textContent);

/** Hele lagringen som tekst, så enhver ændring ses. */
const snapshot = () => JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])));

beforeEach(() => {
  window.scrollTo = vi.fn();
  localStorage.clear();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSaved()));
});
afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Forsidens grupper (SPEC-navigation.md)', () => {
  it('hver knap åbner den samme skærm som før med ét tryk, og intet i lagringen ændres', async () => {
    const stored = snapshot();
    render(<App />);
    for (const [button, heading] of [
      ['Huskepalads', 'Huskepalads'],
      ['Album', 'Album'],
      ['Klubaften', 'Klubaften'],
      ['Kurver', 'Kurver'],
      ['Indstillinger', 'Indstillinger'],
      ['Læs vejledningen', 'Vejledning'],
    ] as const) {
      click(button);
      expect(screen.getByRole('heading', { name: heading, level: 1 }), button).toBeTruthy();
      click('Tilbage');
    }
    for (const track of ['Pointregnskab', 'Farvebehandling']) {
      click(track);
      expect(await screen.findByRole('heading', { name: track, level: 1 }, { timeout: 10_000 })).toBeTruthy();
      click('Tilbage til forsiden');
    }
    expect(snapshot()).toBe(stored);
    click('Start dagens session');
    expect(screen.getByRole('button', { name: 'Afbryd sessionen' })).toBeTruthy();
  }, 30_000);

  it('sprogknappen står øverst og gemmer kun settings.language', () => {
    render(<App />);
    const language = screen.getByRole('button', { name: 'Skift sprog til engelsk' });
    expect(language.closest('header')).toBe(document.querySelector('main > header'));
    const old = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    const keys = Object.keys(localStorage);
    fireEvent.click(language);
    expect(Object.keys(localStorage)).toEqual(keys);
    const now = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(now).toEqual({ ...old, settings: { ...old.settings, language: 'en' } });
  });

  it('grupperne står i rækkefølgen Optælling, Spilføring; tom Vurdering vises ikke; intet menupunkt for 13-sudoku', () => {
    render(<App />);
    expect(groupTitles()).toEqual(['Optælling', 'Spilføring']);
    expect(screen.queryAllByRole('button', { name: /sudoku/i })).toEqual([]);
  });

  it('hvert menupunkt står i præcis én gruppe, med samme navn og ⓘ som før', () => {
    render(<App />);
    const sections = [...document.querySelectorAll('section.home-group')];
    for (const item of TRACK_ITEMS) {
      const buttons = screen.getAllByRole('button', { name: item.title.da });
      expect(buttons, item.id).toHaveLength(1);
      const section = buttons[0].closest('section.home-group');
      expect(sections.filter((s) => s.contains(buttons[0])), item.id).toHaveLength(1);
      expect(section?.getAttribute('aria-labelledby'), item.id).toBe(`group-${item.group}`);
      expect(screen.getByRole('button', { name: `Hjælp: ${item.title.da}` })).toBeTruthy();
    }
  });

  it('fordelingssporets elementer står først i Optælling under Fordeling i samme rækkefølge som før', () => {
    render(<App />);
    const counting = document.querySelector('section.home-group')!;
    const distribution = screen.getByRole('group', { name: 'Fordeling' });
    expect(counting.contains(distribution)).toBe(true);
    const inOrder = [
      within(distribution).getByRole('heading', { name: 'Fordeling' }),
      within(distribution).getByText('dage i træk'),
      within(distribution).getByText(/Ugens joker/),
      within(distribution).getByRole('heading', { name: /^Niveau 1/ }),
      within(distribution).getByRole('heading', { name: 'I dag' }),
      within(distribution).getByRole('button', { name: 'Start dagens session' }),
      within(distribution).getByRole('button', { name: 'Huskepalads' }),
      within(distribution).getByRole('button', { name: 'Album' }),
      within(distribution).getByRole('button', { name: 'Klubaften' }),
      within(distribution).getByRole('button', { name: 'Kurver' }),
      screen.getByRole('button', { name: 'Pointregnskab' }),
    ];
    for (let i = 1; i < inOrder.length; i++) expect(before(inOrder[i - 1], inOrder[i]), `${i}`).toBe(true);
    // Pointregnskab er sit eget spor og står ikke under Fordeling.
    expect(distribution.contains(inOrder[inOrder.length - 1])).toBe(false);
  });

  it('vejledningskortet og Indstillinger står under grupperne', () => {
    render(<App />);
    const groups = document.querySelectorAll('section.home-group');
    const last = groups[groups.length - 1];
    const guide = screen.getByRole('button', { name: 'Læs vejledningen' });
    const settings = screen.getByRole('button', { name: 'Indstillinger' });
    for (const element of [guide, settings]) {
      expect(last.contains(element)).toBe(false);
      expect(before(last, element)).toBe(true);
    }
    expect(before(guide, settings)).toBe(true);
  });

  it('hver gruppe har et ⓘ med en forklaring på begge sprog', () => {
    for (const group of GROUPS) {
      expect(group.help.da.length, group.id).toBeGreaterThan(40);
      expect(group.help.en.length, group.id).toBeGreaterThan(40);
    }
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Hjælp: Optælling' }));
    expect(screen.getByText(GROUPS[0].help.da)).toBeTruthy();
    expect(GROUPS[0].help.da).toMatch(/13-sudoku/);
    click('Skift sprog til engelsk');
    expect(groupTitles()).toEqual(['Counting', 'Declarer play']);
    fireEvent.click(screen.getByRole('button', { name: 'Help: Declarer play' }));
    expect(screen.getByText(GROUPS[1].help.en)).toBeTruthy();
  });

  it('et nyt spor med ét menupunkt kræver kun én ny linje i tracks.ts', () => {
    const onOpen = vi.fn();
    const evaluation: TrackItem = {
      id: 'evaluation',
      track: 'haandevaluering',
      group: 'evaluation',
      screen: 'evaluation',
      title: { da: 'Håndevaluering', en: 'Hand evaluation' },
      help: { da: 'Et nyt spor om vurdering af egen og makkers hånd.', en: "A new track about evaluating your own and partner's hand." },
    };
    const noop = () => {};
    render(
      <HomeScreen
        saved={defaultSaved()}
        updateReady={false}
        onStart={noop}
        onPalace={noop}
        onAlbum={noop}
        onClub={noop}
        onCurves={noop}
        onSettings={noop}
        onOpen={onOpen}
        items={[...TRACK_ITEMS, evaluation]}
      />,
    );
    // Vurdering vises nu, sidst; skærme uden egen funktion åbnes med onOpen.
    expect(groupTitles()).toEqual(['Optælling', 'Spilføring', 'Vurdering']);
    expect(screen.getByRole('button', { name: 'Hjælp: Vurdering' })).toBeTruthy();
    click('Håndevaluering');
    expect(onOpen).toHaveBeenCalledWith('evaluation');
    cleanup();
    // Uden onOpen og uden Farvebehandlings funktion er Spilføring tom og vises ikke.
    render(
      <HomeScreen saved={defaultSaved()} updateReady={false} onStart={noop} onPalace={noop} onAlbum={noop} onClub={noop} onCurves={noop} onSettings={noop} />,
    );
    expect(groupTitles()).toEqual(['Optælling']);
  });
});
