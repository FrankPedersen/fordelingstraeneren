// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newItem } from '../engine/leitner';
import { defaultSaved, STORAGE_KEY } from '../engine/storage';
import { defaultFbSaved, FB_STORAGE_KEY } from '../farvebehandling/storage';
import { TEST_BANK } from '../farvebehandling/testBank';
import { setLang } from '../i18n';
import { defaultPrSaved, PR_STORAGE_KEY } from '../pointregnskab/storage';
import { DECK_ORDER as PR_DECK } from '../pointregnskab/training/deck';
import App from './App';

// Accepttesten for leverancetrin 1 i SPEC-analyse-modul.md: Analyse som selvstændigt modul med adressen #analyse og sit
// eget kort på forsiden. Løseren svarer hurtigt med E K B 5 / 4 3 2 fra banken som i FarvebehandlingScreen.test.tsx.
vi.mock('../farvebehandling/solver/client', async () => {
  const { TEST_BANK: bank } = await import('../farvebehandling/testBank');
  const source = bank.find((b) => b.combination.id === '432-AKJ5')!;
  const { goals, tricks, ...base } = source.solution;
  return {
    SolveCancelled: class extends Error {},
    createSolver: () => ({
      async solve(request: { kind: string; goal?: number }) {
        if (request.kind === 'tricks') return { kind: 'tricks', base, result: tricks };
        if (request.kind === 'goal') return { kind: 'goal', base, result: goals[String(request.goal)] };
        return { kind: 'line', lead: goals['3'].leads[0], errors: [] };
      },
      cancel() {},
    }),
  };
});

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const snapshot = () => JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])));
const describedBy = (name: string) => document.getElementById(screen.getByRole('button', { name }).getAttribute('aria-describedby')!)!.textContent;
const current = () => within(screen.getByRole('list', { name: 'Banken' })).getByRole('button', { current: true }).textContent;
const WAIT = { timeout: 10_000 };

/** Venter, til modulet har hentet banken og viser linjerne. */
async function moduleReady() {
  await screen.findByRole('heading', { name: 'Farvebehandling – Analyse', level: 1 }, WAIT);
  await screen.findByRole('heading', { name: 'Linjerne' }, WAIT);
}

const TODAY = '2026-10-17';
/** Fordeling med en session i dag og Farvebehandling med en streak fra i går. */
function someTracks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultSaved(), streak: { current: 4, best: 4, lastDay: TODAY }, items: { '4-4-3-2:rank': newItem('2026-10-20') } }));
  localStorage.setItem(FB_STORAGE_KEY, JSON.stringify({ ...defaultFbSaved(), streak: { current: 2, best: 2, lastDay: '2026-10-16' }, items: { [`${TEST_BANK[0].combination.id}:${TEST_BANK[0].combination.goals[0]}`]: newItem('2026-10-20') } }));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 17, 12));
  window.history.replaceState(null, '', '/');
  window.scrollTo = vi.fn();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  setLang('da');
});

describe('Analyse som selvstændigt modul (SPEC-analyse-modul.md, trin 1)', { timeout: 30_000 }, () => {
  it('#analyse som første adresse åbner Analyse med banken og den hyppigste kombination, uden fanerne', async () => {
    window.history.replaceState(null, '', '/#analyse');
    render(<App />);
    await moduleReady();
    expect(current()).toMatch(/^1\. /);
    expect(screen.queryByRole('navigation', { name: 'Farvebehandling' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Træning' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Selvvalgt' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Situationen' })).toBeTruthy();
    expect(document.querySelector('header.topbar')).toBeTruthy();
    expect(document.querySelector('footer.site-footer')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Hjælp: Farvebehandling – Analyse' }));
    expect(screen.getByRole('note').textContent).toMatch(/fanen Analyse i Farvebehandling/);
  });

  it('Tilbage fra modulet som første adresse fører til forsiden uden adresse', async () => {
    window.history.replaceState(null, '', '/#analyse');
    render(<App />);
    await moduleReady();
    click('Tilbage til forsiden');
    expect(screen.getByRole('heading', { name: 'Fordelingstræneren' })).toBeTruthy();
    expect(window.location.hash).toBe('');
  });

  it('åbnet fra forsiden: adressen bliver #analyse, og Tilbage går et skridt tilbage i browseren', async () => {
    render(<App />);
    click('Analyse');
    expect(window.location.hash).toBe('#analyse');
    await moduleReady();
    click('Tilbage til forsiden');
    expect(await screen.findByRole('heading', { name: 'Fordelingstræneren' }, WAIT)).toBeTruthy();
    // Browserens skridt tilbage sker bagefter; testen venter på det, så det ikke rammer den næste test.
    await waitFor(() => expect(window.location.hash).toBe(''));
  });

  it('forsidekortet "Analyse" står i Spilføring efter Farvebehandling, har ⓘ og ingen streak, og I dag tæller stadig fire spor', () => {
    someTracks();
    render(<App />);
    const play = screen.getByRole('region', { name: 'Spilføring' });
    expect(within(play).getAllByRole('button', { name: /^(Farvebehandling|Analyse)$/ }).map((b) => b.getAttribute('aria-label'))).toEqual(['Farvebehandling', 'Analyse']);
    expect(describedBy('Analyse')).toBe('Slå en kombination op · linjer, chancer og sidninger');
    fireEvent.click(within(play).getByRole('button', { name: 'Hjælp: Analyse' }));
    expect(within(play).getByRole('note').textContent).toBe(
      'Analysen fra Farvebehandling som selvstændigt modul: slå enhver kombination op, og se linjerne, chancerne og sidningerne, også med kendte kort, hp-grænser og forbindelser. Den findes også som fanen Analyse i Farvebehandling.',
    );
    expect(screen.getByRole('heading', { name: '1 af 4 spor er trænet' })).toBeTruthy();
    expect(screen.getByText(/^Næste: Pointregnskab/)).toBeTruthy();
  });

  it('når alle fire spor er trænet, foreslår I dag ikke Analyse', () => {
    // Som i forside.test.tsx: alle fire spor har en session i dag.
    const done = { streak: { current: 1, best: 1, lastDay: TODAY }, items: { [PR_DECK[0]]: newItem('2026-10-20') } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultSaved(), streak: done.streak, items: { '4-4-3-2:rank': newItem('2026-10-20') } }));
    for (const key of [PR_STORAGE_KEY, FB_STORAGE_KEY, 'haandevaluering:v1']) localStorage.setItem(key, JSON.stringify({ ...defaultPrSaved(), ...done }));
    render(<App />);
    expect(screen.getByRole('heading', { name: '4 af 4 spor er trænet' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tag en ekstra session i Fordeling' })).toBeTruthy();
  });

  it('at åbne modulet og kigge skriver intet, og forsidens status for Farvebehandling er uændret', async () => {
    someTracks();
    const stored = snapshot();
    render(<App />);
    const before = describedBy('Farvebehandling');
    click('Analyse');
    await moduleReady();
    fireEvent.click(within(screen.getByRole('list', { name: 'Banken' })).getAllByRole('button')[2]);
    expect(current()).toMatch(/^3\. /);
    click('Vis alle sidninger');
    click('Tilbage til forsiden');
    await screen.findByRole('heading', { name: 'Fordelingstræneren' }, WAIT);
    await waitFor(() => expect(window.location.hash).toBe(''));
    expect(describedBy('Farvebehandling')).toBe(before);
    expect(snapshot()).toBe(stored);
  });

  it('en egen linje gemt i modulet findes i fanen Analyse, og farvebehandling:v1 har ingen nye felter', async () => {
    window.history.replaceState(null, '', '/#analyse');
    render(<App />);
    await moduleReady();
    click('+ Egen linje');
    click('Gem og regn');
    await screen.findByRole('article', { name: /^Din linje X: / }, WAIT);
    const data = JSON.parse(localStorage.getItem(FB_STORAGE_KEY)!);
    expect(data.ownLines).toEqual([expect.objectContaining({ combination: TEST_BANK[0].combination.id, steps: [{ leadFrom: 'S', card: 'low' }] })]);
    const allowed = [...Object.keys(defaultFbSaved()), 'training', 'lastExport'];
    expect(Object.keys(data).filter((key) => !allowed.includes(key))).toEqual([]);
    // Samme linje i fanen Analyse i Farvebehandling.
    click('Tilbage til forsiden');
    click('Farvebehandling');
    await screen.findByRole('button', { name: 'Start dagens session' }, WAIT);
    click('Analyse');
    expect(await screen.findByRole('article', { name: /^Din linje X: / }, WAIT)).toBeTruthy();
  });

  it('fanen Analyse i Farvebehandling virker som i dag, også åbnet fra klubaftenen', async () => {
    render(<App />);
    click('Farvebehandling');
    await screen.findByRole('button', { name: 'Start dagens session' }, WAIT);
    const tabs = screen.getByRole('navigation', { name: 'Farvebehandling' });
    expect(within(tabs).getAllByRole('button').map((b) => b.textContent)).toEqual(['Træning', 'Selvvalgt', 'Analyse']);
    expect(screen.getByRole('heading', { name: 'Farvebehandling', level: 1 })).toBeTruthy();
    click('Analyse');
    expect(current()).toMatch(/^1\. /);
    click('Træning');
    click('Klubaften');
    const cells = within(screen.getByRole('group', { name: 'De 100 hyppigste kombinationer' })).getAllByRole('button');
    fireEvent.click(cells[2]);
    click('Åbn i Analyse');
    expect(within(tabs).getByRole('button', { name: 'Analyse' }).getAttribute('aria-current')).toBe('page');
    expect(current()).toMatch(/^3\. /);
  });

  it('på engelsk: kortet og modulets hoved uden dansk', async () => {
    render(<App />);
    click('Skift sprog til engelsk');
    const play = screen.getByRole('region', { name: 'Declarer play' });
    expect(describedBy('Analysis')).toBe('Look up a combination · lines, chances and layouts');
    fireEvent.click(within(play).getByRole('button', { name: 'Help: Analysis' }));
    const help = within(play).getByRole('note').textContent ?? '';
    expect(help).toMatch(/^The analysis from Suit combinations as a separate module/);
    click('Analysis');
    await screen.findByRole('heading', { name: 'Suit combinations – Analysis', level: 1 }, WAIT);
    fireEvent.click(screen.getByRole('button', { name: 'Help: Suit combinations – Analysis' }));
    const header = document.querySelector('header.fb-header')?.textContent ?? '';
    for (const text of [help, header]) expect(text).not.toMatch(/[æøåÆØÅ]|\b(og|fanen|analysen|kombination|linjerne|chancerne|sidningerne|forbindelser|kendte|kort)\b/i);
  });
});
