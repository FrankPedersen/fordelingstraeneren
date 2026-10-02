import { useState } from 'react';

interface NumberPadProps {
  /** Højst så mange cifre. */
  digits?: number;
  onSubmit(value: number): void;
}

/** Talpanel til et antal, fx et estimat ud af 100. */
export function NumberPad({ digits = 2, onSubmit }: NumberPadProps) {
  const [value, setValue] = useState('');
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'ok'];
  return (
    <div className="keypad">
      <div className="keypad-display" aria-live="polite">
        {value || <span className="keypad-slot empty">·</span>}
      </div>
      <div className="keypad-keys">
        {keys.map((key) =>
          key === 'back' ? (
            <button key={key} type="button" className="key" aria-label="Slet" disabled={!value} onClick={() => setValue(value.slice(0, -1))}>
              ⌫
            </button>
          ) : key === 'ok' ? (
            <button key={key} type="button" className="key ok" disabled={!value} onClick={() => onSubmit(Number(value))}>
              OK
            </button>
          ) : (
            <button
              key={key}
              type="button"
              className="key"
              disabled={value.length >= digits}
              onClick={() => setValue(value === '0' ? key : value + key)}
            >
              {key}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
