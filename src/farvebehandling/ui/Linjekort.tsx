import type { ReactNode } from 'react';
import { formatDecimal } from '../../engine/format';
import type { LineView } from '../analysis';
import { TEXT } from './texts';
import { stepText } from '../lineText';

interface LinjekortProps {
  line: LineView;
  /** Før svaret: uden chance og uden markering af den bedste. */
  hideResult?: boolean;
  /** I facit: linjen, brugeren valgte. */
  chosen?: boolean;
  /** Som svarmulighed: kortet er en knap. */
  selected?: boolean;
  onSelect?(): void;
  /** Anden titel end "Linje A", fx "Din linje X". */
  title?: string;
  /** En knap i kortets hoved, fx "Slet". */
  action?: ReactNode;
}

/** En linje med chancen og de nummererede trin. Den bedste linje markeres, men først efter svaret. */
export function Linjekort({ line, hideResult = false, chosen = false, selected = false, onSelect, title, action }: LinjekortProps) {
  const heading = title ?? TEXT.line(line.letter);
  const badges = (
    <>
      {!hideResult && <span className="fb-line-value">{formatDecimal(100 * line.value, 1)} %</span>}
      {!hideResult && line.best && <span className="fb-badge">{TEXT.best}</span>}
      {!hideResult && line.nearBest && <span className="fb-badge fb-badge-quiet">{TEXT.equal}</span>}
      {chosen && <span className="fb-badge fb-badge-quiet">{TEXT.yourChoice}</span>}
    </>
  );
  if (onSelect) {
    return (
      <button
        type="button"
        className={`fb-line fb-line-option${selected ? ' fb-line-selected' : ''}`}
        aria-pressed={selected}
        aria-label={`${TEXT.line(line.letter)}: ${line.lead.steps.map(stepText).join(' ')}`}
        onClick={onSelect}
      >
        <span className="fb-line-head">
          <span className="fb-line-title">{TEXT.line(line.letter)}</span>
          {badges}
        </span>
        <span className="fb-steps">
          {line.lead.steps.map((step, i) => (
            <span key={i} className="fb-step">
              {i + 1}. {stepText(step)}
            </span>
          ))}
        </span>
      </button>
    );
  }
  return (
    <article className={`fb-line${!hideResult && line.best ? ' fb-line-best' : ''}`} aria-label={heading}>
      <header className="fb-line-head">
        <h3>{heading}</h3>
        {badges}
        {action}
      </header>
      <ol className="fb-steps">
        {line.lead.steps.map((step, i) => (
          <li key={i}>{stepText(step)}</li>
        ))}
      </ol>
      {!hideResult && line.mixed && <p className="fb-note">{TEXT.mixed}</p>}
    </article>
  );
}
