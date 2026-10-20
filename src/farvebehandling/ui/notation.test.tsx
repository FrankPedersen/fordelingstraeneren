// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mulberry32 } from '../../engine/rng';
import { setLang } from '../../i18n';
import { bandFields, customItem, disagreements, linesForGoal, sortFields, type BankItem, type Grouping, type LineView } from '../analysis';
import { parseCards } from '../model/cards';
import { handleSolve } from '../solver/results';
import { TEST_BANK } from '../testBank';
import { grade, makeTask } from '../training/tasks';
import { disagreeText, LayoutList } from './Analysevindue';
import { Facit } from './Facit';
import { TEXT } from './texts';

// SPEC-notation-sidninger.md, accepttest for visningen. E D B 10 / 6 5 4 3 2, mål 5, regnet med løseren som i kortvælgeren.
function edb(): BankItem {
  const response = handleSolve({ kind: 'goal', north: parseCards('AQJT'), south: parseCards('65432'), goal: 5 });
  if (response.kind !== 'goal') throw new Error('forkert svar');
  return customItem(response.base, [5], { '5': response.result });
}
const item = edb();
const lines = linesForGoal(item, 5);

/** Tabellen med én linje, så ingen sidning afgør, og alle rækker står under mellemoverskrifterne. */
function table(grouping: Grouping, shown: readonly LineView[] = lines.slice(0, 1)) {
  const fields = sortFields(bandFields(item, shown), grouping);
  render(<LayoutList fields={fields} lines={shown} selected={null} onSelect={() => {}} grouping={grouping} showAll />);
  return fields;
}
const rowOf = (name: string) => screen.getByRole('button', { name }).closest('tr')!;
const cells = (tr: Element) => [...tr.querySelectorAll('td')].map((td) => td.textContent);
const groupHeaders = () => [...document.querySelectorAll('.fb-group-row th')].map((th) => th.textContent);

beforeEach(() => {
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Sidningstabellen med antal og chance pr. sidning (SPEC-notation-sidninger.md)', () => {
  it('Kx–xx: antallet står i Øst-cellen, og chancen pr. sidning under den samlede chance; knappen siger det hele', () => {
    table('fordeling');
    const tr = rowOf('Vest K x, Øst x x, 3 sidninger på hver 6,78 %, i alt 20,35 %');
    const [west, east, chance] = cells(tr);
    expect(west).toBe('K x');
    expect(east).toBe('x x (3)');
    expect(chance).toBe('20,35 %3 × 6,78 %');
    expect(tr.querySelector('.fb-each')?.textContent).toBe('3 × 6,78 %');
  });

  it('K–xxx og Kxxx–renonce har kun én sidning: intet antal og intet "1 ×"', () => {
    table('fordeling');
    expect(cells(rowOf('Vest K, Øst x x x, 6,22 %')).slice(1, 3)).toEqual(['x x x', '6,22 %']);
    expect(cells(rowOf('Vest K x x x, Øst –, 4,78 %')).slice(1, 3)).toEqual(['–', '4,78 %']);
    expect(document.body.textContent).not.toMatch(/1 ×/);
  });

  it('mellemoverskrifterne har gruppens samlede chance og antal sidninger: "2–2 · 40,70 % · 6 sidninger" og "K · 50,00 % · 8 sidninger"', () => {
    table('fordeling');
    expect(groupHeaders()).toContain('2–2 · 40,70 % · 6 sidninger');
    expect(groupHeaders()).toContain('4–0 · 4,78 % · 1 sidning');
    cleanup();
    table('honnører');
    expect(groupHeaders()).toEqual(['K · 50,00 % · 8 sidninger', 'ingen honnører · 50,00 % · 8 sidninger']);
  });

  it('over de afgørende sidninger står det samlede antal og chance; sætningen under båndet tæller sidninger', () => {
    const fields = sortFields(bandFields(item, lines), 'fordeling');
    const decisive = disagreements(fields);
    expect(decisive.length).toBeGreaterThan(0);
    render(<LayoutList fields={fields} lines={lines} selected={null} onSelect={() => {}} showAll />);
    const count = decisive.reduce((s, f) => s + f.count, 0);
    const total = decisive.reduce((s, f) => s + f.probability, 0);
    const summary = document.querySelector('.fb-decisive-summary')!;
    expect(summary.textContent).toBe(`${count === 1 ? '1 sidning' : `${count} sidninger`} · ${(100 * total).toFixed(2).replace('.', ',')} %`);
    // "Linjerne er uenige i …" tæller de konkrete sidninger og bruger den korte form med antal.
    const text = disagreeText(decisive);
    expect(text).toMatch(new RegExp(`^Linjerne er uenige i ${count} sidninger: `));
    expect(text).toContain(decisive.find((f) => f.count > 1) ? '(' : '');
  });

  it('ⓘ ved Chance-overskriften forklarer notationen; der kommer ingen ny kolonne', () => {
    table('fordeling', lines);
    const header = [...document.querySelectorAll('.fb-layout-table thead th')];
    expect(header).toHaveLength(4 + lines.length);
    fireEvent.click(within(header[2] as HTMLElement).getByRole('button', { name: 'Hjælp: Chance' }));
    expect(
      screen.getByText(
        'Rækken samler sidninger, der kun adskiller sig i små kort (x). Tallet i parentes er antallet af sidninger; under chancen står chancen for hver af dem.',
      ),
    ).toBeTruthy();
    // Tabellen står fortsat i sin rullekasse.
    expect(document.querySelector('.fb-table-scroll > .fb-layout-table')).not.toBeNull();
  });

  it('Facit bruger samme tabel under "Hvorfor"', () => {
    const b = TEST_BANK.find((x) => bandFields(x, linesForGoal(x, x.combination.goals[0])).some((f) => f.count > 1))!;
    const task = makeTask('vælg-linjen', b, b.combination.goals[0], mulberry32(2));
    render(<Facit task={task} answer={{}} graded={grade(task, { ms: 1 }, 20_000)} place={null} onNext={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hvorfor →' }));
    const rows = [...document.querySelectorAll('.fb-layout-table tbody tr:not(.fb-group-row)')];
    expect(rows.some((tr) => /\(\d+\)$/.test(tr.querySelectorAll('td')[1].textContent ?? ''))).toBe(true);
    expect(document.querySelector('.fb-each')?.textContent).toMatch(/^\d+ × \d+,\d\d %$/);
    expect(groupHeaders().every((h) => / · \d+,\d\d % · \d+ sidning(er)?$/.test(h ?? ''))).toBe(true);
  });

  it('alle nye tekster findes på dansk og engelsk, og den engelske tabel har ingen dansk tekst', () => {
    // Den engelske tekstfil har samme type som den danske (Texts = typeof DA), så nøglerne findes på begge sprog.
    for (const lang of ['da', 'en'] as const) {
      setLang(lang);
      for (const key of ['layoutRow', 'groupSummary', 'decisiveSummary', 'eachChance', 'countSuffix'] as const) {
        expect(typeof TEXT[key], `${lang} ${key}`).toBe('function');
      }
      expect(TEXT.help.chanceColumn.length, lang).toBeGreaterThan(40);
    }
    expect(TEXT.help.chanceColumn).toMatch(/^The row collects layouts/);
    const fields = sortFields(bandFields(item, lines), 'honnører');
    render(<LayoutList fields={fields} lines={lines} selected={null} onSelect={() => {}} grouping="honnører" showAll />);
    for (const button of screen.queryAllByRole('button', { name: /^Help: / })) fireEvent.click(button);
    const labels = [...document.querySelectorAll('.fb-row-select')].map((b) => b.getAttribute('aria-label')).join(' ');
    const text = `${document.body.textContent} ${labels} ${disagreeText(disagreements(fields))}`;
    expect(text.match(/[æøåÆØÅ]|\b(og|i alt|sidning|sidninger|hver|ingen|honnører|uenige|afgør)\b/i)?.[0]).toBeUndefined();
    expect(screen.getByRole('button', { name: 'West K x, East x x, 3 layouts at 6.78 % each, 20.35 % in all' })).toBeTruthy();
  });
});
