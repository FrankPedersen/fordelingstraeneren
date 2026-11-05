// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { suitLengths } from '../../domain/cards';
import { ReadView } from './ReadView';
import { makeRandomReadTask } from './task';

afterEach(cleanup);

// Vitest tømmer .css-filer ved import, så styles.css læses fra disken som i src/app/forside-bred.test.tsx (i jsdom er
// import.meta.url ikke en filadresse).
const nodeFs = 'node:fs';
const fs = (await import(/* @vite-ignore */ nodeFs)) as { readFileSync(path: string, encoding: 'utf8'): string };
const cwd = (globalThis as unknown as { process: { cwd(): string } }).process.cwd();
const css = fs.readFileSync(`${cwd}/src/ui/styles.css`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Den første tilfældige hånd med alle fire farver, så hver række har kort. */
function hånd() {
  for (let seed = 1; ; seed++) {
    const task = makeRandomReadTask(seed, 3000);
    if (suitLengths(task.cards).every((l) => l > 0)) return task;
  }
}

describe('Den sorterede hånd (SPEC-sorte-tal.md)', () => {
  it('kun symbolet for ♥ og ♦ er rødt; rækken, kortene og antallet har ingen klasse for rød', () => {
    const task = hånd();
    const svar = [...suitLengths(task.cards)].sort((a, b) => b - a);
    const { container } = render(
      <ReadView task={task} answer={svar} reveal skylines={false} show="tap" sorted={false} onAnswer={() => {}} />,
    );
    const rækker = [...container.querySelectorAll('.sorted-hand > p')];
    expect(rækker.map((p) => p.querySelector('.suit')?.textContent)).toEqual(['♠', '♥', '♦', '♣']);
    expect(rækker.map((p) => p.className)).toEqual(['', '', '', '']);
    expect(rækker.map((p) => p.querySelector('.suit')!.classList.contains('red'))).toEqual([false, true, true, false]);
    expect(container.querySelectorAll('.sorted-hand .red')).toHaveLength(2);
  });

  it('symbolerne har kortenes røde farve (card-red) uden et fast farvetal', () => {
    const regel = /\.sorted-hand \.suit\.red\s*\{([^}]*)\}/.exec(css);
    expect(regel?.[1].trim()).toBe('color: var(--card-red);');
    expect(css).not.toMatch(/\.sorted-hand \.red\s*\{/);
  });

  it('card-red er den samme i lys og mørk tilstand, og spillekortene er uændrede', () => {
    const mørk = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'));
    expect(/:root\s*\{[^}]*--card-red:\s*#c62828;/.exec(css)).not.toBeNull();
    expect(mørk.slice(0, mørk.indexOf('\n}'))).not.toMatch(/--card-red/);
    expect(/\.playing-card\.red\s*\{([^}]*)\}/.exec(css)?.[1].trim()).toBe('color: #c62828;');
  });
});
