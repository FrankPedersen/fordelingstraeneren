// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDecimal } from '../../engine/format';
import { setLang } from '../../i18n';
import { handleSolve } from '../solver/results';
import { bankItem } from '../testBank';
import { Analysevindue } from './Analysevindue';

// SPEC-analyse-situation.md, leverancetrin 2: panelet Situationen i Analyse. Løseren er den rigtige (handleSolve), men
// kan holdes tilbage, så ventevisningen og Stop kan testes.
const control = vi.hoisted(() => ({
  hold: false,
  calls: [] as { kind: string; situation?: unknown }[],
  pending: [] as { request: unknown; resolve(value: unknown): void; reject(error: unknown): void }[],
}));
vi.mock('../solver/client', async () => {
  const { handleSolve } = await import('../solver/results');
  class SolveCancelled extends Error {}
  return {
    SolveCancelled,
    createSolver: () => ({
      solve(request: Parameters<typeof handleSolve>[0]) {
        control.calls.push({ kind: request.kind, situation: request.situation });
        if (!control.hold) return Promise.resolve(handleSolve(request));
        return new Promise((resolve, reject) => control.pending.push({ request, resolve, reject }));
      },
      cancel() {
        for (const job of control.pending.splice(0)) job.reject(new SolveCancelled());
      },
    }),
  };
});

// E D B 7 6 / 5 4 3 2 (hånden / bordet): modparten har K 10 9 8. Kongen står alene i sit hul.
const START = '5432-AQJ76';
// Banken med kun denne kombination: hele banken gør hvert tryk langsomt i jsdom (listen tegnes igen).
const BANK = [bankItem(START)];
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const times = (name: string | RegExp, n: number) => {
  for (let i = 0; i < n; i++) click(name);
};
const WAIT = { timeout: 10_000 };

beforeEach(() => {
  control.hold = false;
  control.calls = [];
  control.pending = [];
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Situationen i Analyse', { timeout: 120_000 }, () => {
  it('er foldet sammen på standard og bruger bankens tal', () => {
    render(<Analysevindue bank={BANK} start={START} />);
    const panel = screen.getByRole('region', { name: 'Situationen' });
    expect(within(panel).getByText('A priori · ubegrænsede forbindelser')).toBeTruthy();
    expect(within(panel).queryByRole('button', { name: /én mere/ })).toBeNull();
    expect(screen.getByText('a priori · ubegrænsede forbindelser · optimalt modspil')).toBeTruthy();
    expect(control.calls).toHaveLength(0);
  });

  it('trinvælgerne: grænserne og umulige valg er grået ud, og ⓘ forklarer hvorfor', () => {
    render(<Analysevindue bank={BANK} start={START} />);
    click('Angiv situationen');
    const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
    expect(button('Kendte kort i andre farver, Vest: én mindre').disabled).toBe(true);
    expect(button('Maks. hp i farven, Øst: én mere').disabled).toBe(true);
    expect(button('Kendte kort i andre farver, Vest: én mere').disabled).toBe(false);
    // Vest maks. 0 hp, så skal Øst kunne have kongen (3 hp): Øst kan ikke komme under 3.
    times('Maks. hp i farven, Vest: én mindre', 10);
    expect(button('Maks. hp i farven, Vest: én mindre').disabled).toBe(true);
    times('Maks. hp i farven, Øst: én mindre', 7);
    expect(screen.getByRole('status', { name: 'Maks. hp i farven, Øst' }).textContent).toBe('3');
    expect(button('Maks. hp i farven, Øst: én mindre').disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Hjælp: Maks. hp i farven' }));
    expect(screen.getByRole('note').textContent).toMatch(/umulig/);
  });

  it('med en situation regnes i browseren: chips, forudsætningslinjen, betingede chancer og udelukkede sidninger', async () => {
    render(<Analysevindue bank={BANK} start={START} />);
    click('Angiv situationen');
    times('Maks. hp i farven, Vest: én mindre', 10);
    expect(screen.getByText('Vest maks. 0 hp', { selector: '.fb-situation-chips li' })).toBeTruthy();
    expect(screen.getByText('Vest maks. 0 hp · ubegrænsede forbindelser · optimalt modspil')).toBeTruthy();
    // Kongen sidder hos Øst, foran E D B. Facit regnes med løseren, som appen bruger.
    const item = bankItem(START), goal = item.combination.goals[0];
    const facit = handleSolve({ kind: 'goal', north: item.north, south: item.south, goal, situation: { known: { west: 0, east: 0 }, maxHp: { west: 0, east: 10 } } });
    if (facit.kind !== 'goal') throw new Error('forkert svar');
    expect(await screen.findByText('4 sidninger er udelukket af situationen', {}, WAIT)).toBeTruthy();
    expect(screen.getAllByText(`${formatDecimal(100 * facit.result.value, 1)} %`, { selector: '.fb-line-value' }).length).toBeGreaterThan(0);
    expect(control.calls.at(-1)).toMatchObject({ kind: 'goal', situation: { maxHp: { west: 0, east: 10 } } });
    // Tabellen og båndet viser kun de mulige sidninger: ingen med kongen hos Vest.
    click('Vis alle sidninger');
    const table = screen.getByRole('table');
    for (const row of within(table).getAllByRole('button')) expect(row.textContent).not.toMatch(/K/);
  });

  it('ventevisningen viser den tid, der er gået, og Stop stopper beregningen', async () => {
    control.hold = true;
    render(<Analysevindue bank={BANK} start={START} />);
    click('Angiv situationen');
    click('Kendte kort i andre farver, Vest: én mere');
    expect(await screen.findByText('Regner … 0 s', {}, WAIT)).toBeTruthy();
    expect(await screen.findByText('Regner … 1 s', {}, WAIT)).toBeTruthy();
    click('Stop');
    expect(await screen.findByText(/Beregningen blev stoppet/, {}, WAIT)).toBeTruthy();
    control.hold = false;
    click('Regn med situationen');
    expect(await screen.findByText(/Vest 1 kendt kort · ubegrænsede forbindelser/, {}, WAIT)).toBeTruthy();
    expect(await screen.findAllByRole('article', {}, WAIT)).not.toHaveLength(0);
  });

  it('Nulstil giver standard, foldet sammen og bankens tal', async () => {
    render(<Analysevindue bank={BANK} start={START} />);
    click('Angiv situationen');
    click('Kendte kort i andre farver, Øst: én mere');
    expect(screen.getByText('Øst 1 kendt kort', { selector: '.fb-situation-chips li' })).toBeTruthy();
    click('Nulstil');
    expect(screen.getByText('A priori · ubegrænsede forbindelser')).toBeTruthy();
    expect(document.querySelector('.fb-situation-chips')).toBeNull();
    expect(screen.getByText('a priori · ubegrænsede forbindelser · optimalt modspil')).toBeTruthy();
    // Beregningen, der var sat i gang, er stoppet; bankens tal vises.
    await act(() => new Promise((r) => setTimeout(r, 800)));
    expect(screen.queryByText(/Regner/)).toBeNull();
  });

  it('på engelsk står der ingen dansk', async () => {
    setLang('en');
    render(<Analysevindue bank={BANK} start={START} />);
    click('Set the situation');
    times('Max. HCP in the suit, West: one less', 10);
    click('Known cards in other suits, East: one more');
    expect(await screen.findByText('4 layouts are excluded by the situation', {}, WAIT)).toBeTruthy();
    for (const button of screen.queryAllByRole('button', { name: /^Help: / })) fireEvent.click(button);
    const panel = screen.getByRole('region', { name: 'The situation' }).textContent ?? '';
    const chips = document.querySelector('.fb-situation-chips')?.textContent ?? '';
    const assumptions = screen.getByText(/unlimited entries · best defence/).textContent ?? '';
    const excluded = screen.getByText(/excluded by the situation/).textContent ?? '';
    for (const text of [panel, chips, assumptions, excluded]) expect(text).not.toMatch(/[æøåÆØÅ]|\b(og|kort|hp|maks|kendte|ledige|udelukket|sidning|sidninger|chancen|grænse)\b/i);
  });
});
