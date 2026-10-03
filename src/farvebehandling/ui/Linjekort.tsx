import { formatDecimal } from '../../engine/format';
import type { LineView } from '../analysis';
import { TEXT } from './texts';

interface LinjekortProps {
  line: LineView;
}

/** En linje med chancen og de nummererede trin. Den bedste linje markeres. */
export function Linjekort({ line }: LinjekortProps) {
  return (
    <article className={`fb-line${line.best ? ' fb-line-best' : ''}`} aria-label={TEXT.line(line.letter)}>
      <header className="fb-line-head">
        <h3>{TEXT.line(line.letter)}</h3>
        <span className="fb-line-value">{formatDecimal(100 * line.value, 1)} %</span>
        {line.best && <span className="fb-badge">{TEXT.best}</span>}
        {line.nearBest && <span className="fb-badge fb-badge-quiet">{TEXT.equal}</span>}
      </header>
      <ol className="fb-steps">
        {line.lead.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      {line.mixed && <p className="fb-note">{TEXT.mixed}</p>}
    </article>
  );
}
