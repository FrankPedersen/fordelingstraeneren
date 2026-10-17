// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSaved, STORAGE_KEY } from '../engine/storage';
import { setLang } from '../i18n';
import App from './App';
import { HomeScreen } from './screens/HomeScreen';
import { GROUPS, TRACK_CARDS, TRACK_ITEMS, type TrackCard } from './tracks';

// Opdateret til SPEC-forside-spor.md: sporene står som kort på forsiden, og fordelingssporets elementer og menupunkter
// står på Fordeling-skærmen. Testenes hensigt fra SPEC-navigation.md er den samme.

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const before = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
const groupTitles = () => [...document.querySelectorAll('section.home-group > .with-info > h2')].map((h) => h.textContent);

/** Hele lagringen som tekst, så enhver ændring ses. */
const snapshot = () => JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])));

beforeEach(() => {
  window.scrollTo = vi.fn();
  window.history.replaceState(null, '', '/');
  localStorage.clear();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSaved()));
});
afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Forsidens grupper (SPEC-navigation.md og SPEC-forside-spor.md)', () => {
  it('hver knap åbner den samme skærm som før, og intet i lagringen ændres', async () => {
    const stored = snapshot();
    render(<App />);
    click('Fordeling');
    expect(screen.getByRole('heading', { name: 'Fordeling', level: 1 })).toBeTruthy();
    for (const [button, heading] of [
      ['Huskepalads', 'Huskepalads'],
      ['Album', 'Album'],
      ['Klubaften', 'Klubaften'],
      ['Kurver', 'Kurver'],
    ] as const) {
      click(button);
      expect(screen.getByRole('heading', { name: heading, level: 1 }), button).toBeTruthy();
      click('Tilbage');
      // Tilbage fører til Fordeling-skærmen, hvor menupunktet står.
      expect(screen.getByRole('heading', { name: 'Fordeling', level: 1 }), button).toBeTruthy();
    }
    click('Tilbage til forsiden');
    for (const [button, heading] of [
      ['Indstillinger', 'Indstillinger'],
      ['Læs vejledningen', 'Vejledning'],
    ] as const) {
      click(button);
      expect(screen.getByRole('heading', { name: heading, level: 1 }), button).toBeTruthy();
      click('Tilbage');
    }
    for (const track of ['Pointregnskab', 'Farvebehandling', 'Håndevaluering']) {
      click(track);
      expect(await screen.findByRole('heading', { name: track, level: 1 }, { timeout: 10_000 })).toBeTruthy();
      click('Tilbage til forsiden');
    }
    expect(snapshot()).toBe(stored);
    click('Fordeling');
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

  it('grupperne står i rækkefølgen Optælling, Spilføring, Vurdering; intet menupunkt for 13-sudoku', () => {
    render(<App />);
    expect(groupTitles()).toEqual(['Optælling', 'Spilføring', 'Vurdering']);
    expect(screen.queryAllByRole('button', { name: /sudoku/i })).toEqual([]);
  });

  it('hvert spor står som ét kort i præcis én gruppe', () => {
    render(<App />);
    const sections = [...document.querySelectorAll('section.home-group')];
    for (const card of TRACK_CARDS) {
      const buttons = screen.getAllByRole('button', { name: card.title.da });
      expect(buttons, card.track).toHaveLength(1);
      expect(sections.filter((s) => s.contains(buttons[0])), card.track).toHaveLength(1);
      expect(buttons[0].closest('section.home-group')?.getAttribute('aria-labelledby'), card.track).toBe(`group-${card.group}`);
    }
  });

  it('fordelingssporets elementer og menupunkter står på Fordeling-skærmen i samme rækkefølge som før, med samme navn og ⓘ', () => {
    render(<App />);
    click('Fordeling');
    const main = document.querySelector('main')!;
    const inOrder = [
      within(main).getByRole('heading', { name: 'Fordeling', level: 1 }),
      within(main).getByText('dage i træk'),
      within(main).getByText(/Ugens joker/),
      within(main).getByRole('heading', { name: /^Niveau 1/ }),
      within(main).getByRole('heading', { name: 'I dag' }),
      within(main).getByRole('button', { name: 'Start dagens session' }),
      within(main).getByRole('button', { name: 'Huskepalads' }),
      within(main).getByRole('button', { name: 'Album' }),
      within(main).getByRole('button', { name: 'Klubaften' }),
      within(main).getByRole('button', { name: 'Kurver' }),
    ];
    for (let i = 1; i < inOrder.length; i++) expect(before(inOrder[i - 1], inOrder[i]), `${i}`).toBe(true);
    for (const item of TRACK_ITEMS.filter((i) => i.track === 'fordeling')) {
      expect(screen.getByRole('button', { name: `Hjælp: ${item.title.da}` }), item.id).toBeTruthy();
    }
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
    expect(groupTitles()).toEqual(['Counting', 'Declarer play', 'Hand evaluation']);
    fireEvent.click(screen.getByRole('button', { name: 'Help: Declarer play' }));
    expect(screen.getByText(GROUPS[1].help.en)).toBeTruthy();
  });

  it('et nyt spor kræver kun én ny linje i tracks.ts', () => {
    const onOpen = vi.fn();
    const card: TrackCard = {
      track: 'nyt-spor',
      group: 'evaluation',
      screen: 'new-track',
      title: { da: 'Nyt spor', en: 'New track' },
      description: { da: 'Et nyt spor om vurdering', en: 'A new track about evaluation' },
      help: { da: 'Et nyt spor om vurdering af egen og makkers hånd.', en: "A new track about evaluating your own and partner's hand." },
    };
    const noop = () => {};
    render(<HomeScreen saved={defaultSaved()} updateReady={false} onStart={noop} onClub={noop} onSettings={noop} onOpen={onOpen} cards={[...TRACK_CARDS, card]} />);
    expect(groupTitles()).toEqual(['Optælling', 'Spilføring', 'Vurdering']);
    const evaluation = document.querySelector('section[aria-labelledby="group-evaluation"]')!;
    expect(within(evaluation as HTMLElement).getByRole('button', { name: 'Nyt spor' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hjælp: Nyt spor' })).toBeTruthy();
    click('Nyt spor');
    expect(onOpen).toHaveBeenCalledWith('new-track');
    cleanup();
    // Uden onOpen kan sporene ikke åbnes, og grupperne vises ikke.
    render(<HomeScreen saved={defaultSaved()} updateReady={false} onStart={noop} onClub={noop} onSettings={noop} />);
    expect(groupTitles()).toEqual([]);
  });
});
