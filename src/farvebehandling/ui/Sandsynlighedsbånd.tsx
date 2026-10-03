import { formatDecimal } from '../../engine/format';
import type { BandField, LineView } from '../analysis';
import { TEXT } from './texts';

interface SandsynlighedsbåndProps {
  lines: readonly LineView[];
  fields: readonly BandField[];
  selected: string | null;
  onSelect(id: string): void;
}

const percent = (p: number) => `${formatDecimal(100 * p, 2)} %`;

/** Felter, der er smallere end 5 %, får intet tegn; resultatet står i listen over sidninger. */
const MIN_SYMBOL = 0.05;

/**
 * Én vandret søjle pr. linje på 100 %, delt i sidninger efter deres chance. Felterne står i samme rækkefølge for alle
 * linjer; mørkt felt med ✓ = målet nås, lyst felt med stiplet kant og ✕ = målet nås ikke. Et tryk vælger sidningen.
 */
export function Sandsynlighedsbånd({ lines, fields, selected, onSelect }: SandsynlighedsbåndProps) {
  return (
    <div className="fb-band" role="group" aria-label={TEXT.difference}>
      {lines.map((line, k) => (
        <div key={line.letter} className="fb-band-row">
          <span className="fb-band-letter" aria-hidden="true">
            {line.letter}
          </span>
          <div className="fb-band-bar" aria-label={TEXT.line(line.letter)}>
            {fields.map((f) => {
              const hit = f.outcomes[k] > 0;
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`fb-field ${hit ? 'fb-field-hit' : 'fb-field-miss'}${selected === f.id ? ' fb-field-selected' : ''}`}
                  style={{ width: `${100 * f.probability}%` }}
                  aria-label={`${TEXT.line(line.letter)}: ${TEXT.fieldLabel(f.west, f.east, percent(f.probability), hit ? TEXT.reaches : TEXT.misses)}`}
                  aria-pressed={selected === f.id}
                  onClick={() => onSelect(f.id)}
                >
                  {f.probability >= MIN_SYMBOL && <span aria-hidden="true">{hit ? TEXT.hit : TEXT.miss}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="fb-note">{TEXT.legend}</p>
    </div>
  );
}
