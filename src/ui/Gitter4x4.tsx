import { SUIT_SYMBOLS } from '../domain/cards';
import { tx } from '../i18n';

const suitName = (c: number) => tx(['spar', 'hjerter', 'ruder', 'klør'][c], ['spades', 'hearts', 'diamonds', 'clubs'][c]);

export interface GridCell {
  value: number | null;
  /** Blyantsnoter: de længder, brugeren overvejer. */
  notes: number[];
  /** Kendt på forhånd (Nord og Syd). */
  fixed: boolean;
  /** Efter løsningen: om cellen var rigtig. */
  mark?: 'right' | 'wrong';
}

interface Gitter4x4Props {
  rows: { label: string; cells: GridCell[] }[];
  selected: [number, number] | null;
  onSelect(row: number, col: number): void;
}

const sum = (values: (number | null)[]) => values.reduce<number>((a, v) => a + (v ?? 0), 0);

/** 4 × 4-gitteret i 13-sudoku: rækkerne er pladserne, søjlerne farverne, og alt summer til 13. */
export function Gitter4x4({ rows, selected, onSelect }: Gitter4x4Props) {
  const columnSum = (c: number) => sum(rows.map((row) => row.cells[c].value));
  return (
    <table className="grid4">
      <thead>
        <tr>
          <th />
          {SUIT_SYMBOLS.map((symbol, i) => (
            <th key={symbol} scope="col" className={i === 1 || i === 2 ? 'red' : ''}>
              {symbol}
            </th>
          ))}
          <th scope="col">Σ</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => {
          const values = row.cells.map((c) => c.value);
          const complete = values.every((v) => v !== null);
          return (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {row.cells.map((cell, c) => (
                <td key={c}>
                  {cell.fixed ? (
                    <span className="cell fixed">{cell.value}</span>
                  ) : (
                    <button
                      type="button"
                      className={[
                        'cell',
                        selected?.[0] === r && selected[1] === c && 'selected',
                        cell.mark,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-label={`${row.label}, ${suitName(c)}: ${cell.value ?? (cell.notes.length ? `${tx('noter', 'notes')} ${cell.notes.join(', ')}` : tx('tom', 'empty'))}`}
                      onClick={() => onSelect(r, c)}
                    >
                      {cell.value ?? (cell.notes.length > 0 && <span className="notes">{cell.notes.join(' ')}</span>)}
                    </button>
                  )}
                </td>
              ))}
              <td className={`sum${complete && sum(values) === 13 ? ' ok' : ''}`}>{complete ? sum(values) : ''}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">Σ</th>
          {[0, 1, 2, 3].map((c) => (
            <td key={c} className={`sum${columnSum(c) === 13 ? ' ok' : ''}`}>
              {columnSum(c)}
            </td>
          ))}
          <td />
        </tr>
      </tfoot>
    </table>
  );
}
