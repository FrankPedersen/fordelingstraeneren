// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../app/App';
import { formatDecimal } from '../../engine/format';
import { STORAGE_KEY } from '../../engine/storage';
import techniquesFile from '../content/techniques.json';
import { linesForGoal } from '../analysis';
import { defaultFbSaved, FB_STORAGE_KEY, type FbSaved } from '../storage';
import { filterOptions, NO_FILTER } from '../training/practice';
import { itemKey, possibleTypes } from '../training/tasks';
import { TEST_BANK } from '../testBank';

// Løseren testes for sig i solver/results.test.ts. Her svarer en hurtig løser med E K B 5 / 4 3 2 fra banken, så testene
// af brugerfladen ikke afhænger af maskinens hastighed.
vi.mock('../solver/client', async () => {
  const { TEST_BANK: bank } = await import('../testBank');
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

// Faste seeds, så sessionens valg af opgavetype er det samme hver gang, uanset hvilke test der kører før.
const seeds = vi.hoisted(() => ({ next: 1 }));
vi.mock('../../engine/rng', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../engine/rng')>();
  return { ...actual, randomSeed: () => seeds.next++ };
});

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const stored = (): FbSaved => JSON.parse(localStorage.getItem(FB_STORAGE_KEY)!);

/** Middag lokal tid den 5. oktober 2026. */
const T0 = new Date(2026, 9, 5, 12, 0).getTime();

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = vi.fn();
  seeds.next = 1;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/** Åbner farvebehandling og venter, til banken er hentet. */
async function openFarvebehandling() {
  render(<App />);
  click('Farvebehandling');
  await screen.findByRole('heading', { name: 'Farvebehandling' }, { timeout: 10_000 });
  await screen.findByRole('button', { name: 'Start dagens session' }, { timeout: 10_000 });
}

/** Spiller alle kort i Spil den selv ved at trykke på det første kort, der kan spilles. */
function playOut() {
  for (let i = 0; i < 40; i++) {
    const region = screen.queryByRole('region', { name: 'Spil den selv' });
    if (!region) return;
    const cards = within(region)
      .queryAllByRole('button')
      .filter((b) => /^(bordet|din hånd): /.test(b.getAttribute('aria-label') ?? '') && !(b as HTMLButtonElement).disabled);
    if (!cards.length) return;
    fireEvent.click(cards[0]);
  }
}

/** Svarer på den opgave, der står på skærmen, uanset type. */
function answerAnything() {
  if (screen.queryByRole('region', { name: 'Spil den selv' })) return playOut();
  const holes = screen.queryByRole('group', { name: 'Hvor taber linjen? Vælg sidningen.' });
  if (holes) return fireEvent.click(within(holes).getAllByRole('button')[0]);
  const lines = screen.queryAllByRole('button', { name: /^Linje [A-D]: / });
  if (screen.queryByText('Tryk på den bedste linje')) return fireEvent.click(lines[0]);
  if (lines.length) fireEvent.click(lines[0]);
  const guess = screen.queryByRole('group', { name: /^Hvor stor er chancen|^Gæt chancen/ });
  if (guess) fireEvent.click(within(guess).getAllByRole('button')[1]);
  click('Svar');
}

const percent = (v: number) => `${formatDecimal(100 * v, 1)} %`;

describe('Farvebehandling', { timeout: 30_000 }, () => {
  it('åbner analysevinduet med den hyppigste kombination', async () => {
    await openFarvebehandling();
    click('Analyse');
    expect(screen.getByRole('heading', { name: 'Linjerne' })).toBeTruthy();
    const first = TEST_BANK[0];
    const best = linesForGoal(first, first.combination.goals[0])[0];
    const article = screen.getByRole('article', { name: 'Linje A' });
    expect(within(article).getByText(percent(best.value))).toBeTruthy();
    expect(within(article).getByText('✓ bedst')).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Forskellen' })).toBeTruthy();
    expect(screen.getByRole('figure', { name: /Første udspil/ })).toBeTruthy();
    expect(screen.getByText('a priori · ubegrænsede forbindelser · optimalt modspil')).toBeTruthy();
    expect(screen.getByRole('button', { name: `Alle (${TEST_BANK.length})` })).toBeTruthy();
  });

  it('filtrerer efter modpartens honnørpoint, skifter kombination og mål og viser sidningen ved bordet', async () => {
    await openFarvebehandling();
    click('Analyse');
    // Modparten har 2 hp (damen), case 44: E B 3 2 / K 5 4 med målene 4 og 3 stik.
    click(/^2 hp \(\d+\)$/);
    const list = screen.getByRole('list', { name: 'Banken' });
    expect(within(list).getAllByRole('button')).toHaveLength(TEST_BANK.filter((b) => b.points === 2).length);
    fireEvent.click(within(list).getByRole('button', { name: /^\d+\. E B 3 2 \/ K 5 4 ·/ }));
    click('3 stik');
    expect(screen.getByRole('button', { name: '3 stik' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(screen.getByRole('article', { name: 'Linje A' })).getByText('77,0 %')).toBeTruthy();
    expect(screen.getByText(/^Es og konge uden damen med 7 kort/)).toBeTruthy();
    const firstField = within(screen.getByRole('group', { name: 'Forskellen' })).getAllByRole('button')[0];
    fireEvent.click(firstField);
    expect(firstField.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('figure', { name: /Første udspil/ }).textContent).not.toContain('?');
  });

  it('finder en kombination med kortvælgeren', async () => {
    await openFarvebehandling();
    click('Analyse');
    click('Kortvælger');
    const tap = (card: string, times: number) => {
      for (let i = 0; i < times; i++) fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${card}: `) }));
    };
    tap('B', 1);
    tap('3', 1);
    tap('2', 1);
    tap('E', 2);
    tap('K', 2);
    tap('5', 2);
    tap('4', 2);
    expect(screen.getByRole('button', { name: 'B: bordet' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'E: din hånd' })).toBeTruthy();
    expect(screen.queryByText(/findes ikke i banken/)).toBeNull();
    // Ikke i banken: 2 over for 3.
    click('Ryd');
    tap('2', 1);
    tap('3', 2);
    expect(screen.getByText(/findes ikke i banken/)).toBeTruthy();
  });

  it('regner en kombination uden for banken og en egen linje i appen (fase 2)', async () => {
    await openFarvebehandling();
    click('Analyse');
    click('Kortvælger');
    const tap = (card: string, times: number) => {
      for (let i = 0; i < times; i++) fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${card}: `) }));
    };
    // Specens eksempel B 4 3 2 / E 10 6 5 er ikke på bridgehands' sider.
    for (const c of ['B', '4', '3', '2']) tap(c, 1);
    for (const c of ['E', '10', '6', '5']) tap(c, 2);
    expect(screen.getByText(/findes ikke i banken/)).toBeTruthy();
    click('Regn den ud');
    expect(await screen.findByText('Regnet i appen; der er ingen kilde at sammenligne med.')).toBeTruthy();
    // De foreslåede mål; et nyt mål regnes, når man vælger det.
    const goals = within(screen.getByRole('group', { name: 'Mål' })).getAllByRole('button');
    expect(goals.length).toBeGreaterThanOrEqual(2);
    const other = goals.find((b) => b.getAttribute('aria-pressed') === 'false')!;
    fireEvent.click(other);
    expect(await screen.findByText(new RegExp(`^Bedste chance for ${other.textContent!.replace(' stik', '')} stik`))).toBeTruthy();
    // En egen linje: lille fra hånden.
    click('+ Egen linje');
    click('Gem og regn');
    const own = await screen.findByRole('article', { name: /^Din linje X: / });
    expect(stored().ownLines).toEqual([expect.objectContaining({ steps: [{ leadFrom: 'S', card: 'low' }] })]);
    fireEvent.click(within(own).getByRole('button', { name: 'Slet' }));
    expect(stored().ownLines).toEqual([]);
  });

  it('spiller kombinationen selv fra analysevinduet mod normalt modspil', async () => {
    await openFarvebehandling();
    click('Analyse');
    click('Spil den selv ▶');
    const region = screen.getByRole('region', { name: 'Spil den selv' });
    expect(within(region).getByText('Spil ud fra bordet eller hånden.')).toBeTruthy();
    expect(within(region).getAllByText(/^\? \(\d+ kort\)$/)).toHaveLength(2);
    playOut();
    expect(within(region).getByText(/stik – målet/)).toBeTruthy();
    expect(within(region).getByText('Fordelingen, du spillede mod, lyser op i båndet.')).toBeTruthy();
    const band = within(region).getByRole('group', { name: 'Forskellen' });
    expect(within(band).getAllByRole('button').some((b) => b.getAttribute('aria-pressed') === 'true')).toBe(true);
    expect(within(region).queryAllByText(/^\? \(/)).toHaveLength(0);
    fireEvent.click(within(region).getByRole('button', { name: 'Ny fordeling' }));
    expect(within(region).getByText('Spil ud fra bordet eller hånden.')).toBeTruthy();
    fireEvent.click(within(region).getByRole('button', { name: 'Luk' }));
    expect(screen.queryByRole('region', { name: 'Spil den selv' })).toBeNull();
  });

  it('kører dagens session: introduktion, opgaver med facit, lynrunde og status', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(T0);
    const [first, second] = TEST_BANK;
    render(<App />);
    const before = localStorage.getItem(STORAGE_KEY);
    click('Farvebehandling');
    await screen.findByRole('button', { name: 'Start dagens session' }, { timeout: 10_000 });
    expect(screen.getByText('0 emner til repetition · 2 nye kombinationer')).toBeTruthy();
    // Et kig rører ikke lagringen.
    expect(localStorage.getItem(FB_STORAGE_KEY)).toBeNull();

    click('Start dagens session');
    expect(screen.getByText('Ny kombination')).toBeTruthy();
    const room = techniquesFile.techniques.find((t) => t.id === first.combination.technique)!;
    expect(screen.getByText(`Rum: ${room.name} · ny station 1`)).toBeTruthy();
    expect(screen.getByText(room.rule)).toBeTruthy();
    click('Prøv den');
    expect(stored().introduced).toEqual({ [first.combination.id]: '2026-10-05' });
    expect(stored().palace.stations[first.combination.id]).toEqual({ technique: room.id, order: 1 });

    // Linjerne er skjult, indtil der er svaret (Spil den selv viser bordet med kortene).
    const prompt = screen.queryByText(`Mål: ${first.combination.goals[0]} stik`, { selector: '.prompt' });
    expect(prompt ?? screen.queryByRole('region', { name: 'Spil den selv' })).toBeTruthy();
    expect(screen.queryByText('✓ bedst')).toBeNull();
    answerAnything();
    expect(within(screen.getByRole('status')).getByText(/^(Rigtigt|Halvt rigtigt|Forkert)$/)).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Forskellen' })).toBeTruthy();
    expect(stored().items[itemKey(first.combination.id, first.combination.goals[0])].log).toHaveLength(1);
    click('Hvorfor →');
    expect(screen.getByText(`Rum: ${room.name} · station 1`)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Alle sidninger' })).toBeTruthy();
    click('Næste opgave');
    for (let k = 1; k < first.combination.goals.length; k++) {
      answerAnything();
      click('Næste opgave');
    }

    // Den næste kombination introduceres og øves i alle sine mål.
    expect(screen.getByText('Ny kombination')).toBeTruthy();
    click('Prøv den');
    for (const _ of second.combination.goals) {
      answerAnything();
      click('Næste opgave');
    }
    const keys = [first, second].flatMap((b) => b.combination.goals.map((g) => itemKey(b.combination.id, g)));
    expect(Object.keys(stored().items).sort()).toEqual(keys.sort());

    // Efter niveauet kommer lynrunden med linje mod linje, hvis et af emnerne har den opgave; ellers status.
    vi.setSystemTime(T0 + 211_000);
    answerAnything();
    click('Næste opgave');
    const lightning = [first, second].some((b) => b.combination.goals.some((g) => possibleTypes(b, g).includes('linje-mod-linje')));
    if (lightning) {
      expect(screen.getByText('Lynrunde')).toBeTruthy();
      expect(screen.getByText('Tryk på den bedste linje')).toBeTruthy();
      vi.setSystemTime(T0 + 275_000);
      answerAnything();
      click('Næste opgave');
    }

    expect(screen.getByRole('heading', { name: 'Dagens session er færdig' })).toBeTruthy();
    const after = stored();
    expect(after.sessions).toHaveLength(1);
    expect(after.streak).toMatchObject({ current: 1, lastDay: '2026-10-05' });
    expect(after.xp).toBe(after.sessions[0].xp);
    click('Færdig');
    expect(screen.getByText('Dagens session er gennemført. Du kan tage en til.')).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
  });

  it('viser paladsets åbne rum og gemmer egen huskeregel og scene', async () => {
    const saved = { ...defaultFbSaved(), introduced: { 'J32-AK54': '2026-10-04' } };
    localStorage.setItem(FB_STORAGE_KEY, JSON.stringify(saved));
    await openFarvebehandling();
    click('Paladset');
    expect(screen.getByRole('heading', { name: 'Spil mod honnør' })).toBeTruthy();
    expect(screen.getByText('1. E K 5 4 / B 3 2')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Lukkede rum' })).toBeTruthy();
    click('Ret huskeregel: Spil mod honnør');
    fireEvent.change(screen.getByLabelText('Huskeregel'), { target: { value: 'Mod knægten uden støtte.' } });
    click('Gem');
    expect(screen.getByText('Mod knægten uden støtte.')).toBeTruthy();
    click('Ret din scene: E K 5 4 / B 3 2');
    fireEvent.change(screen.getByLabelText('Din scene'), { target: { value: 'Tyven klatrer op ad stigen.' } });
    click('Gem');
    expect(stored().palace).toEqual({
      techniques: { 'spil-mod-honnoer': { rule: 'Mod knægten uden støtte.' } },
      stations: { 'J32-AK54': { technique: 'spil-mod-honnoer', order: 1, scene: 'Tyven klatrer op ad stigen.' } },
    });
  });

  it('Selvvalgt viser antal pr. filtervalg, grår valg med 0 ud og logger uden at røre dagsplanen', async () => {
    await openFarvebehandling();
    click('Selvvalgt');
    const all = within(screen.getByRole('group', { name: 'Teknik' })).getByRole('button', { name: `Alle (${TEST_BANK.length})` });
    expect(all.getAttribute('aria-pressed')).toBe('true');
    // En teknik, hvor nogle kortantal har 0 kombinationer.
    const order = techniquesFile.techniques.map((t) => t.id);
    const technique = filterOptions(TEST_BANK, NO_FILTER, order).technique.find(
      (t) => t.count > 0 && filterOptions(TEST_BANK, { ...NO_FILTER, technique: t.value }, order).cards.some((c) => c.count === 0),
    )!;
    const name = techniquesFile.techniques.find((t) => t.id === technique.value)!.name;
    click(new RegExp(`^${name} \\(\\d+\\)$`));
    const cards = screen.getByRole('group', { name: 'Antal kort' });
    const disabled = within(cards).getAllByRole('button').filter((b) => (b as HTMLButtonElement).disabled);
    expect(disabled.length).toBeGreaterThan(0);
    for (const b of disabled) expect(b.textContent).toMatch(/\(0\)$/);
    const enabled = within(cards).getAllByRole('button').filter((b) => !(b as HTMLButtonElement).disabled && /kort/.test(b.textContent!));
    fireEvent.click(enabled[0]);
    click(/^Start · \d+ kombinationer?$/);
    answerAnything();
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText(/XP/)).toBeNull();
    const after = stored();
    expect(after.practice).toHaveLength(1);
    expect(after.items).toEqual({});
    expect(after.xp).toBe(0);
    click('Næste opgave');
    click('Skift filter');
    expect(screen.getByRole('group', { name: 'Teknik' })).toBeTruthy();
  });

  it('eksporterer og importerer sine egne data uden at røre fordelingssporets', async () => {
    const fordeling = JSON.stringify({ version: 1, urørt: true });
    localStorage.setItem(STORAGE_KEY, fordeling);
    const created: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      created.push(blob);
      return 'blob:fb';
    }) as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn();
    await openFarvebehandling();
    click('Dine data');
    click('Eksportér');
    expect(JSON.parse(await created[0].text())).toEqual(defaultFbSaved());
    expect(screen.getByText('Filen er gemt.')).toBeTruthy();

    const input = document.querySelector('input[type="file"]')!;
    // En fil fra fordelingssporet afvises.
    fireEvent.change(input, { target: { files: [new File([fordeling], 'fordeling.json')] } });
    expect(await screen.findByText('Filen indeholder ikke data fra farvebehandling.')).toBeTruthy();
    const file = new File([JSON.stringify({ ...defaultFbSaved(), xp: 321 })], 'farvebehandling.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByText('Filen har 321 XP, 0 emner, 0 sessioner og en streak på 0.')).toBeTruthy();
    expect(localStorage.getItem(FB_STORAGE_KEY)).toBeNull();
    click('Erstat mine data');
    expect(stored().xp).toBe(321);
    expect(screen.getByText('Dine data er importeret.')).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(fordeling);
  });

  it('går tilbage til forsiden', async () => {
    await openFarvebehandling();
    click('Tilbage til forsiden');
    expect(screen.getByRole('heading', { name: 'Fordelingstræneren' })).toBeTruthy();
  });
});
