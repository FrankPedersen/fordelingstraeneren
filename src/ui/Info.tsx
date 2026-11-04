import { useId, useState, type ReactNode } from 'react';
import { tx } from '../i18n';

interface InfoProps {
  /** Elementet, hjælpen handler om; skærmlæsere hører "Hjælp: …". */
  topic: string;
  children: ReactNode;
}

/** Et emne i en samlet ⓘ: fed overskrift og højst to sætninger (SPEC-design-som-forsiden.md, Del 3). */
export interface InfoTopic {
  id: string;
  title: string;
  text: string;
}

/** Indholdet i en samlet ⓘ: en kort liste med ét punkt pr. emne. */
export function InfoList({ topics }: { topics: readonly InfoTopic[] }) {
  return (
    <span className="info-list" role="list">
      {topics.map((t) => (
        <span key={t.id} className="info-item" role="listitem">
          <strong>{t.title}</strong>
          <span>{t.text}</span>
        </span>
      ))}
    </span>
  );
}

/**
 * Et lille ⓘ ved et element. Et tryk viser en kort forklaring lige under elementet, et nyt tryk skjuler den. Kræver
 * ikke hover. Står det i en `.with-info`-række, kommer ⓘ ved siden af elementet og forklaringen på linjen under.
 */
export function Info({ topic, children }: InfoProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="info">
      <button
        type="button"
        className="info-btn"
        aria-label={tx(`Hjælp: ${topic}`, `Help: ${topic}`)}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden="true">i</span>
      </button>
      {open && (
        <span id={id} className="info-text" role="note">
          {children}
        </span>
      )}
    </span>
  );
}
