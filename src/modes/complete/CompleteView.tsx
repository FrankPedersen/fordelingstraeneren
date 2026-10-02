import { useState } from 'react';
import { SEAT_NAMES } from '../../domain/dealer';
import { distributionText } from '../../domain/patterns';
import { PatternKeypad } from '../../ui/PatternKeypad';
import { Skyline } from '../../ui/Skyline';
import { percentText } from '../../ui/text';
import { completeFacit, instructionText, shownText, type CompleteTask } from './task';

/** Højst så mange rækker i facit; resten samles i én linje. */
const FACIT_ROWS = 6;

/** Når alle mulige mønstre skal tastes, må listen være lidt længere end facit. */
const MAX_ENTRIES = 6;

interface CompleteViewProps {
  task: CompleteTask;
  /** Brugerens svar; så låses opgaven. */
  submitted?: string[];
  /** Vis facit med procent pr. mønster. */
  reveal: boolean;
  onAnswer(patterns: string[]): void;
}

export function CompleteView({ task, submitted, reveal, onAnswer }: CompleteViewProps) {
  const [list, setList] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const locked = submitted !== undefined;
  const entries = submitted ?? list;
  const max = task.all ? MAX_ENTRIES : task.count;

  function add(lengths: number[]) {
    const id = lengths.join('-');
    if (list.includes(id)) setNote(`${id} er allerede tastet.`);
    else {
      setList([...list, id]);
      setNote('');
    }
  }

  function moveUp(i: number) {
    const next = [...list];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setList(next);
  }

  return (
    <div className="task">
      <p className="prompt">
        {SEAT_NAMES[task.seat]} har vist {shownText(task)}.
      </p>
      <p className="instruction">{instructionText(task)}</p>

      {reveal ? (
        <Facit task={task} answer={entries} />
      ) : (
        <>
          <ol className="entries">
            {entries.map((id, i) => (
              <li key={id}>
                <span className="entry-rank">{i + 1}.</span>
                <Skyline id={id} size="sm" label={false} />
                <span className="entry-id">{id}</span>
                {!locked && (
                  <span className="entry-tools">
                    <button
                      type="button"
                      className="tool"
                      aria-label={`Flyt ${id} op`}
                      disabled={i === 0}
                      onClick={() => moveUp(i)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="tool"
                      aria-label={`Fjern ${id}`}
                      onClick={() => setList(list.filter((x) => x !== id))}
                    >
                      ✕
                    </button>
                  </span>
                )}
              </li>
            ))}
            {entries.length === 0 && <li className="entries-empty">Tast et mønster nedenfor.</li>}
          </ol>
          {note && <p className="note">{note}</p>}
          {!locked && (
            <>
              <PatternKeypad onPattern={add} disabled={list.length >= max} />
              <button
                type="button"
                className="btn primary"
                disabled={list.length === 0}
                onClick={() => onAnswer(list)}
              >
                Svar
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Facit({ task, answer }: { task: CompleteTask; answer: string[] }) {
  const { total, list, required } = completeFacit(task);
  const rows = list.slice(0, Math.max(FACIT_ROWS, required.length));
  const rest = list.slice(rows.length);
  const restWeight = rest.reduce((sum, c) => sum + c.weight, 0n);
  const impossible = answer.filter((id) => !list.some((c) => c.pattern.id === id));

  return (
    <div className="facit">
      <table className="facit-table">
        <tbody>
          {rows.map((c, i) => (
            <tr key={c.pattern.id} className={i < required.length ? 'required' : 'other'}>
              <td>{i < required.length ? `${i + 1}.` : ''}</td>
              <td>
                <Skyline id={c.pattern.id} size="sm" label={false} />
              </td>
              <th scope="row">{c.pattern.id}</th>
              <td className="num">{percentText(c.weight, total)}</td>
              <td>{answer.includes(c.pattern.id) ? `din nr. ${answer.indexOf(c.pattern.id) + 1}` : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rest.length > 0 && (
        <p className="muted">
          + {rest.length} sjældnere mønstre, i alt {percentText(restWeight, total)}.
        </p>
      )}
      {impossible.length > 0 && <p>Ikke muligt her: {impossible.join(', ')}.</p>}
      <p className="muted">Dit svar: {answer.length > 0 ? answer.join(', ') : 'intet'}.</p>
      <p className="muted">
        {SEAT_NAMES[task.seat]} havde {distributionText(task.lengths)}.
      </p>
    </div>
  );
}
