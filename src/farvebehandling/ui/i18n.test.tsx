// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mulberry32 } from '../../engine/rng';
import { setLang } from '../../i18n';
import { TASK_TYPES } from '../storage';
import { TEST_BANK } from '../testBank';
import { grade, makeTask, possibleTypes } from '../training/tasks';
import { Facit } from './Facit';
import { Opgave } from './Opgave';

/** Danske bogstaver og ord fra opgaverne og løserens linjer, som ikke må stå på skærmen på engelsk. */
const DANISH = /[æøåÆØÅ]|\b(og|af|til|med|ikke|eller|linje|linjen|kort|stik|bordet|hånden|fra|lille|mod|kip|slå|lægger|dækker|ellers|ingen|hvor|hvad|vælg|tryk|svar|sidning|sidninger|chancen|målet)\b/i;

function expectEnglish(where: string) {
  for (const button of screen.queryAllByRole('button', { name: /^Help: / })) fireEvent.click(button);
  const text = document.body.textContent ?? '';
  const found = text.match(DANISH);
  expect(found?.[0], `${where}: ${found ? text.slice(Math.max(0, (found.index ?? 0) - 60), (found.index ?? 0) + 60) : ''}`).toBeUndefined();
}

beforeEach(() => {
  setLang('en');
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Farvebehandlings opgaver på engelsk', () => {
  it('viser hver af de ni opgavetyper, facit og "Hvorfor" uden dansk', () => {
    for (const type of TASK_TYPES) {
      const item = TEST_BANK.find((b) => b.combination.goals.some((g) => possibleTypes(b, g).includes(type)))!;
      const goal = item.combination.goals.find((g) => possibleTypes(item, g).includes(type))!;
      const task = makeTask(type, item, goal, mulberry32(2));
      render(<Opgave task={task} onAnswer={() => {}} />);
      expectEnglish(`${type}: opgaven`);
      cleanup();
      const answer = {};
      render(<Facit task={task} answer={answer} graded={grade(task, { ...answer, ms: 1 }, 20_000)} place={null} onNext={() => {}} />);
      expectEnglish(`${type}: facit`);
      const why = screen.queryByRole('button', { name: 'Why →' });
      if (why) {
        fireEvent.click(why);
        expectEnglish(`${type}: hvorfor`);
      }
      cleanup();
    }
  });
});
