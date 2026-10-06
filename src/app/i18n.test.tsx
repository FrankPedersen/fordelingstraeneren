// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSaved, STORAGE_KEY } from '../engine/storage';
import { setLang } from '../i18n';
import App from './App';

/** Danske bogstaver og almindelige danske ord, som ikke må stå på skærmen på engelsk. */
const DANISH = /[æøåÆØÅ]|\b(og|af|til|med|ikke|eller|linje|linjen|linjerne|kort|stik|bordet|hånden|dage|emner|mønster|mønstre|ingen|hvor|hvad|vælg|tryk|næste|svar|træning|selvvalgt|tilbage|forsiden|klubaften|kurver|indstillinger)\b/i;

/** Den synlige tekst; appens navn står på dansk på begge sprog. */
const visible = () => (document.body.textContent ?? '').replace(/Fordelingstræneren/g, '');

/** Åbner alle ⓘ på skærmen, så deres forklaringer også bliver tjekket. */
function openAllHelp() {
  for (const button of screen.queryAllByRole('button', { name: /^Help: / })) {
    if (button.getAttribute('aria-expanded') !== 'true') fireEvent.click(button);
  }
}

/** Ingen dansk på skærmen, heller ikke i forklaringerne. */
function expectEnglish(where: string) {
  openAllHelp();
  const found = visible().match(DANISH);
  expect(found?.[0], `${where}: ${found ? visible().slice(Math.max(0, (found.index ?? 0) - 60), (found.index ?? 0) + 60) : ''}`).toBeUndefined();
}

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));

/** Spil den selv: trykker på det første kort, der kan spilles, til spillet er slut. */
function playOut() {
  for (let i = 0; i < 40; i++) {
    const region = screen.queryByRole('region', { name: 'Play it yourself' });
    if (!region) return;
    const cards = within(region)
      .queryAllByRole('button')
      .filter((b) => /^(dummy|your hand): /.test(b.getAttribute('aria-label') ?? '') && !(b as HTMLButtonElement).disabled);
    if (!cards.length) return;
    fireEvent.click(cards[0]);
  }
}

/** Svarer på farvebehandlings opgave, uanset type (som i FarvebehandlingScreen.test.tsx, men på engelsk). */
function answerAnything() {
  if (screen.queryByRole('region', { name: 'Play it yourself' })) return playOut();
  const holes = screen.queryByRole('group', { name: 'Where does the line fail? Choose the layout.' });
  if (holes) return fireEvent.click(within(holes).getAllByRole('button')[0]);
  const lines = screen.queryAllByRole('button', { name: /^Line [A-D]: / });
  if (screen.queryByText('Tap the best line')) return fireEvent.click(lines[0]);
  if (lines.length) fireEvent.click(lines[0]);
  const guess = screen.queryByRole('group', { name: /^How big is the chance|^Guess the chance/ });
  if (guess) fireEvent.click(within(guess).getAllByRole('button')[1]);
  for (const form of screen.queryAllByRole('group', { name: /^(Teams|Pairs)/ })) fireEvent.click(within(form).getAllByRole('button')[0]);
  click('Answer');
}

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Engelsk', () => {
  it('kontrol: tjekket finder dansk, når sproget er dansk, også i forklaringerne', () => {
    render(<App />);
    expect(visible()).toMatch(DANISH);
    const before = visible().length;
    for (const button of screen.getAllByRole('button', { name: /^Hjælp: / })) fireEvent.click(button);
    expect(visible().length).toBeGreaterThan(before + 500);
  });

  it('skifter hele forsiden til engelsk, gemmer valget og skifter tilbage', () => {
    render(<App />);
    click('Skift sprog til engelsk');
    expect(screen.getByRole('button', { name: "Start today's session" })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).settings.language).toBe('en');
    expectEnglish('forsiden');
    click('Switch language to Danish');
    expect(screen.getByRole('button', { name: 'Start dagens session' })).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).settings.language).toBe('da');
  });

  it('husker sproget og viser fordelingssporets skærme og den første opgave på engelsk', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultSaved(), settings: { ...defaultSaved().settings, language: 'en' } }));
    render(<App />);
    expect(screen.getByRole('button', { name: "Start today's session" })).toBeTruthy();
    for (const [button, title] of [
      ['Read the guide', 'Guide'],
      ['Settings', 'Settings'],
      ['Memory palace', 'Memory palace'],
      ['Album', 'Album'],
      ['Charts', 'Charts'],
      ['Club evening', 'Club evening'],
    ] as const) {
      click(button);
      expect(screen.getByRole('heading', { name: title, level: 1 })).toBeTruthy();
      expectEnglish(title);
      click('Back');
    }
    click("Start today's session");
    expectEnglish('sessionen');
  }, 30_000);

  it('viser farvebehandling på engelsk: Træning, Selvvalgt, Analyse og undersiderne', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultSaved(), settings: { ...defaultSaved().settings, language: 'en' } }));
    render(<App />);
    click('Suit combinations');
    await screen.findByRole('button', { name: "Start today's session" }, { timeout: 10_000 });
    expectEnglish('Træning');
    for (const [button, title] of [
      ['The palace', 'The palace'],
      ['Club evening', 'Club evening'],
      ['Statistics', 'Statistics'],
      ['Your data', 'Your data'],
    ] as const) {
      click(button);
      expect(screen.getByRole('heading', { name: title })).toBeTruthy();
      expectEnglish(title);
      click('Back to Training');
    }
    click('Free practice');
    expectEnglish('Selvvalgt');
    click('Analysis');
    expectEnglish('Analyse');
    click('Card picker');
    expectEnglish('kortvælgeren');
    click('Training');
    click("Start today's session");
    expect(screen.getByText('New combination')).toBeTruthy();
    expectEnglish('introduktionen');
    click('Try it');
    expectEnglish('den første opgave');
    answerAnything();
    expect(screen.getByRole('button', { name: 'Next task' })).toBeTruthy();
    expectEnglish('facit');
    click('Why →');
    expectEnglish('hvorfor');
  }, 30_000);
});
