import { useState } from 'react';
import type { Defender } from '../../domain/sudoku';
import { Gitter4x4, type GridCell } from '../../ui/Gitter4x4';
import { SuitText } from '../../ui/SuitText';
import { SUDOKU_BASE, sudokuPoints, type SudokuTask } from './task';

const ROWS = [
  { seat: 'N', label: 'Nord (bordet)' },
  { seat: 'E', label: 'Øst' },
  { seat: 'S', label: 'Syd (dig)' },
  { seat: 'W', label: 'Vest' },
] as const;

type Values = Record<Defender, (number | null)[]>;

interface SudokuViewProps {
  task: SudokuTask;
  /** Opgaven er løst eller opgivet; pointene lægges til XP. */
  onDone(points: number): void;
}

/** 13-sudoku: Øst og Vest udfyldes ud fra ledetrådene, der kommer én ad gangen. */
export function SudokuView({ task, onDone }: SudokuViewProps) {
  const [revealed, setRevealed] = useState(1);
  const [values, setValues] = useState<Values>({ E: [null, null, null, null], W: [null, null, null, null] });
  const [notes, setNotes] = useState<Record<string, number[]>>({});
  const [selected, setSelected] = useState<[number, number] | null>([1, 0]);
  const [pencil, setPencil] = useState(false);
  const [wrongLocks, setWrongLocks] = useState(0);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ solved: boolean; points: number } | null>(null);

  const base = SUDOKU_BASE * (task.hard ? 2 : 1);
  const left = task.clues.length - revealed;
  const rest = [0, 1, 2, 3].map((s) => 13 - task.lengths.N[s] - task.lengths.S[s]);
  const seatAt = (row: number) => ROWS[row].seat;
  const target = selected && (seatAt(selected[0]) === 'E' || seatAt(selected[0]) === 'W') ? selected : null;
  const filled = (['E', 'W'] as const).every((seat) => values[seat].every((v) => v !== null));

  const rows = ROWS.map(({ seat, label }) => ({
    label,
    cells: [0, 1, 2, 3].map((s): GridCell => {
      if (seat === 'N' || seat === 'S') return { value: task.lengths[seat][s], notes: [], fixed: true };
      const value = result && !result.solved ? task.lengths[seat][s] : values[seat][s];
      const mark = result ? (values[seat][s] === task.lengths[seat][s] ? 'right' : 'wrong') : undefined;
      return { value, notes: notes[`${seat}${s}`] ?? [], fixed: false, mark };
    }),
  }));

  function enter(n: number | null) {
    if (!target || result) return;
    const seat = seatAt(target[0]) as Defender;
    const key = `${seat}${target[1]}`;
    if (pencil && n !== null) {
      const current = notes[key] ?? [];
      const next = current.includes(n) ? current.filter((x) => x !== n) : [...current, n].sort((a, b) => a - b);
      setNotes({ ...notes, [key]: next });
      return;
    }
    const nextValues = { ...values, [seat]: values[seat].map((v, s) => (s === target[1] ? n : v)) };
    setValues(nextValues);
    if (n === null) setNotes({ ...notes, [key]: [] });
    setMessage('');
  }

  function lock() {
    const solved = (['E', 'W'] as const).every((seat) => values[seat].every((v, s) => v === task.lengths[seat][s]));
    if (solved) {
      setResult({ solved: true, points: sudokuPoints(left, wrongLocks, task.hard) });
    } else {
      setWrongLocks(wrongLocks + 1);
      setMessage(`Ikke rigtigt – låsen koster ${base} XP. Opgaven fortsætter.`);
    }
  }

  return (
    <div className="task sudoku">
      <p className="prompt">
        Find Østs og Vests fordeling{task.hard && <span className="badge boss">Ugens boss · dobbelt XP</span>}
      </p>
      <p className="instruction">Alle rækker og søjler summer til 13. Ledetrådene kommer én ad gangen.</p>

      <Gitter4x4 rows={rows} selected={result ? null : selected} onSelect={(r, c) => setSelected([r, c])} />

      <ol className="clues">
        {task.clues.slice(0, result ? task.clues.length : revealed).map((clue, i) => (
          <li key={i} className={i >= revealed ? 'muted' : ''}>
            <SuitText text={clue.text} />
          </li>
        ))}
      </ol>

      {result ? (
        <section className={`feedback ${result.solved ? 'ok' : 'bad'}`} role="status">
          <p className="feedback-title">{result.solved ? '✓ Løst' : 'Løsningen'}</p>
          <p className="feedback-meta">
            {result.points >= 0 ? `+${result.points}` : `−${-result.points}`} XP
            {result.solved && ` · ${left} ${left === 1 ? 'ledetråd' : 'ledetråde'} tilbage`}
          </p>
          <button type="button" className="btn primary" onClick={() => onDone(result.points)} autoFocus>
            Videre
          </button>
        </section>
      ) : (
        <>
          {left > 0 && (
            <button type="button" className="btn" onClick={() => setRevealed(revealed + 1)}>
              Næste ledetråd ({left} tilbage)
            </button>
          )}
          <div className="grid-keys">
            {Array.from({ length: 14 }, (_, n) => (
              <button
                key={n}
                type="button"
                className="key"
                disabled={!target || n > rest[target[1]]}
                onClick={() => enter(n)}
              >
                {n}
              </button>
            ))}
            <button type="button" className="key" aria-label="Ryd cellen" disabled={!target} onClick={() => enter(null)}>
              ⌫
            </button>
          </div>
          <div className="two">
            <button type="button" className="btn" aria-pressed={pencil} onClick={() => setPencil(!pencil)}>
              {pencil ? '✎ Noter: til' : '✎ Noter: fra'}
            </button>
            <button type="button" className="btn primary" disabled={!filled} onClick={lock}>
              Lås ({sudokuPoints(left, wrongLocks, task.hard)} XP)
            </button>
          </div>
          {message && (
            <p className="note" role="status">
              {message}
            </p>
          )}
          <button
            type="button"
            className="btn small-btn"
            onClick={() => setResult({ solved: false, points: -base * wrongLocks })}
          >
            Vis løsningen
          </button>
        </>
      )}
    </div>
  );
}
