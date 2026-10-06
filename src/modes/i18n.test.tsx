// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { defaultSaved } from '../engine/storage';
import { PATTERNS, patternById } from '../domain/patterns';
import { setLang } from '../i18n';
import { routeOf } from '../memory/palace';
import { CompleteView } from './complete/CompleteView';
import { makeCompleteTask } from './complete/task';
import { EstimateView } from './estimate/EstimateView';
import { makeEstimateTask } from './estimate/task';
import { HigherLowerView } from './higherLower/HigherLowerView';
import { makeHigherLowerTask } from './higherLower/task';
import { PalaceView } from './palace/PalaceView';
import { makePalaceTask } from './palace/task';
import { ReadView } from './read/ReadView';
import { makeRandomReadTask } from './read/task';
import { SudokuView } from './sudoku/SudokuView';
import { makeSudoku } from './sudoku/task';

/** Danske bogstaver og almindelige danske ord, som ikke må stå på skærmen på engelsk. */
const DANISH = /[æøåÆØÅ]|\b(og|af|til|med|ikke|eller|kort|stik|bordet|hånden|dage|mønster|mønstre|ingen|hvor|hvad|vælg|tryk|næste|svar|melder|åbner|følger|bekende|runde|spar|hjerter|ruder|klør)\b/i;

function expectEnglish(where: string) {
  for (const button of screen.queryAllByRole('button', { name: /^Help: / })) fireEvent.click(button);
  const text = document.body.textContent ?? '';
  const found = text.match(DANISH);
  expect(found?.[0], `${where}: ${found ? text.slice(Math.max(0, (found.index ?? 0) - 60), (found.index ?? 0) + 60) : ''}`).toBeUndefined();
}

beforeEach(() => setLang('en'));
afterEach(() => {
  cleanup();
  setLang('da');
});

const pattern = patternById('5-4-3-1');
const noop = () => {};

describe('Øvelserne på engelsk', () => {
  it('Højere/lavere, Fuldfør, Klubaften-estimat og Paladsvandring med facit', () => {
    const higher = makeHigherLowerTask(3, pattern, PATTERNS.slice(0, 13), 'normal');
    render(<HigherLowerView task={higher} chosen="a" reveal onAnswer={noop} />);
    expectEnglish('Højere/lavere');
    cleanup();
    for (const seed of [1, 2, 3]) {
      const complete = makeCompleteTask(seed, pattern, 'normal');
      render(<CompleteView task={complete} reveal={false} onAnswer={noop} />);
      expectEnglish('Fuldfør');
      cleanup();
      render(<CompleteView task={complete} submitted={['5-4-3-1']} reveal onAnswer={noop} />);
      expectEnglish('Fuldfør, facit');
      cleanup();
    }
    render(<EstimateView task={makeEstimateTask(4, pattern)} answer={5} reveal onAnswer={noop} />);
    expectEnglish('Klubaften-estimat');
    cleanup();
    const route = routeOf(defaultSaved(), 3);
    for (const difficulty of ['easy', 'hard'] as const) {
      render(<PalaceView task={makePalaceTask(5, pattern, difficulty)} route={route} reveal={false} skylines onAnswer={noop} />);
      expectEnglish(`Paladsvandring (${difficulty})`);
      cleanup();
    }
  });

  it('Lynaflæsning viser A K Q J og engelske tekster', () => {
    render(<ReadView task={makeRandomReadTask(7, 3000)} reveal={false} skylines show="tap" sorted={false} onAnswer={noop} />);
    expect(document.body.textContent).toMatch(/Look at the hand/);
    expect(document.body.textContent).not.toMatch(/[EDB](?=[♠♥♦♣])/);
    expectEnglish('Lynaflæsning');
  });

  it('13-sudokuen: meldinger, spilhændelser og knapper på engelsk', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const task = makeSudoku(seed, seed === 5);
      render(<SudokuView task={task} onDone={noop} />);
      // Alle ledetråde vises.
      for (let i = 0; i < task.clues.length; i++) {
        const next = screen.queryByRole('button', { name: /^Next clue/ });
        if (next) fireEvent.click(next);
      }
      expectEnglish(`13-sudoku ${seed}`);
      cleanup();
    }
  }, 30_000);
});
