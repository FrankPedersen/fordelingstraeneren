import { patternById } from '../domain/patterns';
import { tx } from '../i18n';

interface SkylineProps {
  /** Mønstret, fx "5-4-3-1". */
  id: string;
  /** Længden, der fylder hele højden. Mønstre side om side skal have samme værdi. */
  scale?: number;
  size?: 'sm' | 'md' | 'lg';
  /** Vis mønstret som tekst under søjlerne. */
  label?: boolean;
}

/** Mønstret som fire faldende søjler i familiens farve, altid med tal ved. */
export function Skyline({ id, scale, size = 'md', label = true }: SkylineProps) {
  const pattern = patternById(id);
  const top = scale ?? Math.max(8, pattern.lengths[0]);
  return (
    <span
      className={`skyline skyline-${size} family-${pattern.family}`}
      role="img"
      aria-label={tx(`Mønster ${id}`, `Pattern ${id}`)}
    >
      <span className="skyline-bars" aria-hidden="true">
        {pattern.lengths.map((length, i) => (
          <span key={i} className="skyline-col">
            <span className="skyline-bar" style={{ height: `${(Math.min(length, top) / top) * 100}%` }}>
              <span className="skyline-num">{length}</span>
            </span>
          </span>
        ))}
      </span>
      {label && (
        <span className="skyline-id" aria-hidden="true">
          {id}
        </span>
      )}
    </span>
  );
}
