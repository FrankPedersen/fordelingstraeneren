import { useState } from 'react';
import { CLUB_PATTERNS, patternById, type Family } from '../domain/patterns';

const FAMILIES: Family[] = [4, 5, 6, 7];
const familyLabel = (f: Family) => (f === 7 ? '7+' : String(f));

/** De 100 hænder i rangorden, med antallene fra "Pr. 100 hænder". */
const CELLS = CLUB_PATTERNS.flatMap((p) => Array.from({ length: p.per100 }, () => p));

function MiniSkyline({ lengths }: { lengths: readonly number[] }) {
  return (
    <span className="mini-skyline" aria-hidden="true">
      {lengths.map((l, i) => (
        <span key={i} style={{ height: `${(l / 7) * 100}%` }} />
      ))}
    </span>
  );
}

interface KlubaftenProps {
  /** Et mønster, der fremhæves (fx i facit til et estimat). */
  highlight?: string;
}

/** En klubaften: 25 spil × 4 hænder = 100 hænder som 10 × 10 mini-skylines i familiefarver. */
export function Klubaften({ highlight }: KlubaftenProps) {
  const [selected, setSelected] = useState<string | undefined>(highlight);
  const active = selected ? patternById(selected) : undefined;
  const summary = CLUB_PATTERNS.map((p) => `${p.per100} × ${p.id}`).join(', ');

  return (
    <div className="club">
      <div className="club-grid" role="img" aria-label={`100 hænder: ${summary}`}>
        {CELLS.map((p, i) => (
          <span
            key={i}
            className={`club-cell family-${p.family}${active ? (active.id === p.id ? ' active' : ' dim') : ''}`}
          >
            <MiniSkyline lengths={p.lengths} />
          </span>
        ))}
      </div>
      <p className="club-caption" aria-live="polite">
        {active ? (
          <>
            <strong>{active.id}</strong>: {active.per100} af 100 hænder
          </>
        ) : (
          'Vælg et mønster for at se dets hænder.'
        )}
      </p>
      <div className="club-legend">
        {CLUB_PATTERNS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`legend-chip family-${p.family}${selected === p.id ? ' active' : ''}`}
            aria-pressed={selected === p.id}
            onClick={() => setSelected(selected === p.id ? undefined : p.id)}
          >
            <span className="swatch" aria-hidden="true" />
            {p.id} <span className="muted">× {p.per100}</span>
          </button>
        ))}
      </div>
      <p className="muted small">
        Længste farve:{' '}
        {FAMILIES.map((f) => {
          const count = CLUB_PATTERNS.filter((p) => p.family === f).reduce((sum, p) => sum + p.per100, 0);
          return `${familyLabel(f)}-kort ${count}`;
        }).join(' · ')}{' '}
        hænder.
      </p>
    </div>
  );
}
