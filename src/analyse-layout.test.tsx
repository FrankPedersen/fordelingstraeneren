// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatDecimal } from './engine/format';
import { setLang } from './i18n';
import { bandFields, linesForGoal } from './farvebehandling/analysis';
import { bankItem } from './farvebehandling/testBank';
import { LayoutList } from './farvebehandling/ui/Analysevindue';
import { Resultatkort } from './farvebehandling/ui/Resultatkort';
import { SpilSelv } from './farvebehandling/ui/SpilSelv';

// Accepttest for Del 2 i SPEC-design-som-forsiden.md. Overlap og Analyse efter tegningen ses i en rigtig browser i
// scripts/tjek-bred-layout.mjs; her er reglerne i stylesheetet og det, der kan testes uden en browser.
const nodeFs = 'node:fs';
const fs = (await import(/* @vite-ignore */ nodeFs)) as { readFileSync(path: string, encoding: 'utf8'): string };
const cwd = (globalThis as unknown as { process: { cwd(): string } }).process.cwd();
const styles = fs.readFileSync(`${cwd}/src/ui/styles.css`, 'utf8');
const regler = (css: string) =>
  [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ vælger: m[1].trim().replace(/\s+/g, ' '), krop: m[2] }));

afterEach(() => {
  cleanup();
  setLang('da');
  vi.restoreAllMocks();
});

describe('Bordets spalte (SPEC-design-som-forsiden.md, Del 2, punkt 1 og 2)', () => {
  const faste = regler(styles).filter((r) => /position: sticky/.test(r.krop) && r.vælger.includes('wide-left'));

  it('står kun fast i en skærm med to spalter, aldrig bare fordi den er .wide-left', () => {
    expect(faste.length).toBe(1);
    const vælgere = faste[0].vælger.split(',').map((v) => v.trim());
    expect(vælgere).not.toContain('.wide-left.wide-fast');
    for (const v of vælgere) expect(v, v).toMatch(/^\.(cols|fb-column|fb-guide|guide-cols) > \.wide-left\.wide-fast$/);
  });

  it('er højst så høj som vinduet minus 32 px, når den står fast, og lægger sig ikke over noget', () => {
    expect(faste[0].krop).toContain('top: 16px;');
    expect(faste[0].krop).toContain('max-height: calc(100vh - 32px);');
    for (const r of regler(styles)) {
      if (r.vælger.includes('wide-left') || r.vælger.includes('fb-play')) expect(r.krop, r.vælger).not.toContain('z-index');
    }
  });
});

describe('Spil den selv (SPEC-design-som-forsiden.md, Del 2, punkt 3)', () => {
  const spilFærdig = (container: HTMLElement) => {
    for (let i = 0; i < 60; i++) {
      const kort = container.querySelector<HTMLButtonElement>('.fb-hand-card:not(:disabled)');
      if (!kort) break;
      fireEvent.click(kort);
    }
  };

  it('i Analyse har spillet én spalte, så bordet aldrig står fast dér', () => {
    const { container } = render(<SpilSelv item={bankItem('J32-AK54')} goal={3} seed={7} split={false} />);
    expect(container.querySelector('.fb-play')?.classList.contains('cols')).toBe(false);
  });

  it('efter sidste stik rulles dommen og resultatet frem, hvis de ikke kan ses', () => {
    const rul = vi.fn();
    Element.prototype.scrollIntoView = rul;
    const { container } = render(<SpilSelv item={bankItem('J32-AK54')} goal={3} seed={7} split={false} />);
    expect(rul).not.toHaveBeenCalled();
    spilFærdig(container);
    expect(within(container).getByRole('status').textContent).toMatch(/Du fulgte/);
    expect(rul).toHaveBeenCalledTimes(1);
    expect(rul).toHaveBeenCalledWith({ block: 'nearest' });
    expect((rul.mock.contexts[0] as Element).classList.contains('fb-play-result')).toBe(true);
  });
});

describe('Resultatet i Analyse (SPEC-design-som-forsiden.md, Del 2, punkt 5)', () => {
  const item = bankItem('432-AQ65');
  const goal = item.combination.goals[0];
  const best = linesForGoal(item, goal)[0];
  const chance = `${formatDecimal(100 * best.value, 1)} %`;

  it('har chancen fremhævet og den korte sætning til den brede skærm, og den lange sætning står stadig på mobil', () => {
    render(<Resultatkort item={item} goal={goal} best={best} />);
    expect(screen.getByText(`${chance} for ${goal} stik`).classList.contains('fb-result-big')).toBe(true);
    expect(screen.getByText(`Bedste chance med linje ${best.letter}.`).classList.contains('fb-result-wide')).toBe(true);
    expect(screen.getByText(`Bedste chance for ${goal} stik: ${chance} med linje ${best.letter}.`).classList.contains('fb-result-long')).toBe(true);
  });

  it('har det samme på engelsk', () => {
    setLang('en');
    render(<Resultatkort item={item} goal={goal} best={best} />);
    // Decimaltegnet følger sproget, så chancen regnes efter, at sproget er skiftet.
    const engelsk = `${formatDecimal(100 * best.value, 1)} %`;
    expect(engelsk).toContain('.');
    expect(screen.getByText(`${engelsk} for ${goal} ${goal === 1 ? 'trick' : 'tricks'}`)).toBeTruthy();
    expect(screen.getByText(`Best chance with line ${best.letter}.`)).toBeTruthy();
  });
});

describe('De afgørende sidninger i Analyse (SPEC-design-som-forsiden.md, Del 2, punkt 5)', () => {
  const item = bankItem('432-K765');
  const goal = item.combination.goals[0];
  const lines = linesForGoal(item, goal);
  const fields = bandFields(item, lines);

  it('kolonnerne har linjens bogstav til den smalle tabel, og navnet er det samme for en skærmlæser', () => {
    const { container } = render(<LayoutList fields={fields} lines={lines} selected={null} onSelect={() => {}} showAll={false} />);
    const th = within(container).getByRole('columnheader', { name: 'Linje A' });
    expect(th.getAttribute('data-letter')).toBe('A');
    expect(container.querySelector('table')?.classList.contains('fb-only-decisive')).toBe(true);
  });

  it('har alle sidninger, er kolonnen "afgør" der stadig', () => {
    const { container } = render(<LayoutList fields={fields} lines={lines} selected={null} onSelect={() => {}} showAll />);
    expect(container.querySelector('table')?.classList.contains('fb-only-decisive')).toBe(false);
  });
});

describe('Den deaktiverede primærknap (SPEC-design-som-forsiden.md, Del 2, punkt 6)', () => {
  it('er neutral grå i begge tilstande, ikke dæmpet orange', () => {
    const r = regler(styles).find((x) => x.vælger === '.btn.primary:disabled');
    expect(r, '.btn.primary:disabled').toBeTruthy();
    expect(r!.krop).toContain('background: var(--surface-2);');
    expect(r!.krop).toContain('border-color: var(--surface-2);');
    expect(r!.krop).toContain('color: var(--muted);');
    expect(r!.krop).toContain('opacity: 1;');
  });
});
