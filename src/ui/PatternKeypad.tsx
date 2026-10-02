import { Fragment, useState } from 'react';
import { canPress, press, slots, type Key, type KeypadState } from './keypad';

const KEYS: { key: Key; label: string; name?: string }[] = [
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => ({ key: d, label: String(d) })),
  { key: 'long', label: '10+', name: '10 eller flere' },
  { key: 0, label: '0' },
  { key: 'back', label: '⌫', name: 'Slet' },
];

interface PatternKeypadProps {
  /** Kaldes med de fire længder (faldende), når mønstret er komplet. */
  onPattern(lengths: number[]): void;
  disabled?: boolean;
}

/** Mønstertastaturet: længderne tastes i vilkårlig rækkefølge; den fjerde udfyldes selv. */
export function PatternKeypad({ onPattern, disabled = false }: PatternKeypadProps) {
  const [state, setState] = useState<KeypadState>([]);

  function tap(key: Key) {
    const result = press(state, key);
    setState(result.state);
    if (result.lengths) onPattern(result.lengths);
  }

  return (
    <div className="keypad">
      <div className="keypad-display" aria-live="polite">
        {slots(state).map((slot, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="keypad-dash">-</span>}
            <span className={slot === null ? 'keypad-slot empty' : 'keypad-slot'}>{slot ?? '·'}</span>
          </Fragment>
        ))}
      </div>
      <div className="keypad-keys">
        {KEYS.map(({ key, label, name }) => (
          <button
            key={String(key)}
            type="button"
            className="key"
            aria-label={name}
            disabled={disabled || !canPress(state, key)}
            onClick={() => tap(key)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
