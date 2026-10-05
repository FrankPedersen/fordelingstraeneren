import { useState } from 'react';
import type { Defender } from '../../domain/sudoku';
import { Gitter4x4, type GridCell } from '../../ui/Gitter4x4';
import { SuitText } from '../../ui/SuitText';
import { SUDOKU_BASE, sudokuPoints, type SudokuTask } from './task';
import { tx } from '../../i18n';
import { Info } from '../../ui/Info';

const rowsOf = () =>
  [
    { seat: 'N', label: tx('Nord (bordet)', 'North (dummy)') },
    { seat: 'E', label: tx('Øst', 'East') },
    { seat: 'S', label: tx('Syd (dig)', 'South (you)') },
    { seat: 'W', label: tx('Vest', 'West') },
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
  const seatAt = (row: number) => rowsOf()[row].seat;
  const target = selected && (seatAt(selected[0]) === 'E' || seatAt(selected[0]) === 'W') ? selected : null;
  const filled = (['E', 'W'] as const).every((seat) => values[seat].every((v) => v !== null));

  const rows = rowsOf().map(({ seat, label }) => ({
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
      setMessage(tx(`Ikke rigtigt – låsen koster ${base} XP. Opgaven fortsætter.`, `Not right – the lock costs ${base} XP. The task continues.`));
    }
  }

  return (
    <div className="task sudoku">
      <div className="with-info">
        <p className="prompt">
          {tx("Find Østs og Vests fordeling", "Find East's and West's distribution")}
          {task.hard && <span className="badge boss">{tx('Ugens boss · dobbelt XP', 'Weekly boss · double XP')}</span>}
        </p>
        <Info topic="13-sudoku">
          {tx(
            'Tryk på en celle i Østs eller Vests række, og tast antallet af kort. "Noter" lader dig skrive flere muligheder i en celle. Hent ledetråde én ad gangen, og tryk "Lås", når hele fordelingen er udfyldt: point = grundpoint × (ledetråde tilbage + 1), og en forkert lås koster grundpointene.',
            "Tap a cell in East's or West's row and type the number of cards. \"Notes\" lets you write several possibilities in a cell. Fetch clues one at a time, and tap \"Lock\" when the whole distribution is filled in: points = base points × (clues left + 1), and a wrong lock costs the base points.",
          )}
        </Info>
      </div>
      <p className="instruction">
        {tx('Alle rækker og søjler summer til 13. Ledetrådene kommer én ad gangen.', 'All rows and columns add up to 13. The clues come one at a time.')}
      </p>

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
          <p className="feedback-title">{result.solved ? tx('✓ Løst', '✓ Solved') : tx('Løsningen', 'The solution')}</p>
          <p className="feedback-meta">
            {result.points >= 0 ? `+${result.points}` : `−${-result.points}`} XP
            {result.solved && tx(` · ${left} ${left === 1 ? 'ledetråd' : 'ledetråde'} tilbage`, ` · ${left} ${left === 1 ? 'clue' : 'clues'} left`)}
          </p>
          <button type="button" className="btn primary" onClick={() => onDone(result.points)} autoFocus>
            {tx('Videre', 'Continue')}
          </button>
        </section>
      ) : (
        <>
          {left > 0 && (
            <button type="button" className="btn" onClick={() => setRevealed(revealed + 1)}>
              {tx(`Næste ledetråd (${left} tilbage)`, `Next clue (${left} left)`)}
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
            <button type="button" className="key" aria-label={tx('Ryd cellen', 'Clear the cell')} disabled={!target} onClick={() => enter(null)}>
              ⌫
            </button>
          </div>
          <div className="two">
            <button type="button" className="btn" aria-pressed={pencil} onClick={() => setPencil(!pencil)}>
              {pencil ? tx('✎ Noter: til', '✎ Notes: on') : tx('✎ Noter: fra', '✎ Notes: off')}
            </button>
            <button type="button" className="btn primary" disabled={!filled} onClick={lock}>
              {tx('Lås', 'Lock')} ({sudokuPoints(left, wrongLocks, task.hard)} XP)
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
            {tx('Vis løsningen', 'Show the solution')}
          </button>
        </>
      )}
    </div>
  );
}
