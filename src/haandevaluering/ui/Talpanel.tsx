import { useState } from 'react';
import { pointsText } from './format';
import { TEXT } from './texts';

interface TalpanelProps {
  onSubmit(value: number): void;
}

/** Højst så mange cifre før brøken. */
const DIGITS = 2;

/**
 * Sporets eget talpanel med ½ og ¼ (SPEC-haandevaluering.md, opgave 1): 12¾ tastes som 1, 2, ½ og ¼. Brøken er
 * højst ¾, og ⌫ sletter brøken før cifrene. Appens fælles talpanel ændres ikke.
 */
export function Talpanel({ onSubmit }: TalpanelProps) {
  const [digits, setDigits] = useState('');
  const [quarters, setQuarters] = useState(0);
  const empty = digits === '' && quarters === 0;
  const value = Number(digits || 0) + quarters / 4;

  const digitKey = (d: string) => (
    <button key={d} type="button" className="key" disabled={digits.length >= DIGITS} onClick={() => setDigits(digits === '0' ? d : digits + d)}>
      {d}
    </button>
  );
  const fractionKey = (q: 1 | 2) => (
    <button
      key={`q${q}`}
      type="button"
      className="key"
      aria-label={q === 2 ? TEXT.half : TEXT.quarter}
      disabled={quarters + q > 3}
      onClick={() => setQuarters(quarters + q)}
    >
      {q === 2 ? '½' : '¼'}
    </button>
  );

  return (
    <div className="keypad">
      <div className="keypad-display" aria-live="polite">
        {empty ? <span className="keypad-slot empty">·</span> : pointsText(value)}
      </div>
      <div className="keypad-keys">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digitKey)}
        {fractionKey(2)}
        {digitKey('0')}
        {fractionKey(1)}
        <button
          type="button"
          className="key"
          aria-label={TEXT.erase}
          disabled={empty}
          onClick={() => (quarters ? setQuarters(0) : setDigits(digits.slice(0, -1)))}
        >
          ⌫
        </button>
        <button type="button" className="key ok he-key-wide" disabled={empty} onClick={() => onSubmit(value)}>
          {TEXT.ok}
        </button>
      </div>
    </div>
  );
}
