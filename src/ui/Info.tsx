import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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

/** Luft mellem boksen og vinduets kanter og mellem boksen og ⓘ (SPEC-info-boks.md). */
const BOX_MARGIN = 16;
const BOX_GAP = 8;

/** Står knappen i bordets spalte i det brede layout? Så åbner ⓘ som en boks. Under 1000 px er spalten usynlig. */
function inBoardColumn(button: HTMLElement | null): boolean {
  return !!button?.closest('.wide-left') && !!window.matchMedia?.('(min-width: 1000px)').matches;
}

/**
 * Et lille ⓘ ved et element. Et tryk viser en kort forklaring lige under elementet, et nyt tryk skjuler den. Kræver
 * ikke hover. Står det i en `.with-info`-række, kommer ⓘ ved siden af elementet og forklaringen på linjen under.
 *
 * I bordets spalte fra 1000 px åbner ⓘ i stedet som en boks oven på indholdet, forankret ved knappen, så bordet ikke
 * flytter sig. Boksen lukkes med ✕, Esc eller et klik udenfor, og fokus går tilbage til ⓘ (SPEC-info-boks.md).
 */
export function Info({ topic, children }: InfoProps) {
  const [open, setOpen] = useState(false);
  // Står boksen åben? Det afgøres, når ⓘ trykkes, så en ændret vinduesbredde gælder fra næste tryk.
  const [box, setBox] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = () => {
    setOpen(false);
    button.current?.focus();
  };
  return (
    <span className="info">
      <button
        ref={button}
        type="button"
        className="info-btn"
        aria-label={tx(`Hjælp: ${topic}`, `Help: ${topic}`)}
        aria-expanded={open}
        aria-controls={id}
        aria-haspopup={open && box ? 'dialog' : undefined}
        onClick={() => {
          if (open) return close();
          setBox(inBoardColumn(button.current));
          setOpen(true);
        }}
      >
        <span aria-hidden="true">i</span>
      </button>
      {open && !box && (
        <span id={id} className="info-text" role="note">
          {children}
        </span>
      )}
      {open && box && (
        <InfoBox id={id} topic={topic} anchor={button} onClose={close}>
          {children}
        </InfoBox>
      )}
    </span>
  );
}

function InfoBox({ id, topic, anchor, onClose, children }: { id: string; topic: string; anchor: React.RefObject<HTMLButtonElement | null>; onClose(): void; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Under ⓘ, ellers over den, med venstre kant ved knappen og inden for vinduet; den følger knappen, når siden rulles. Pladsen sættes
  // direkte, før boksen tegnes, så den aldrig er skjult, når fokus flyttes til ✕.
  useLayoutEffect(() => {
    const update = () => {
      const a = anchor.current?.getBoundingClientRect();
      const box = root.current;
      const b = box?.getBoundingClientRect();
      if (!a || !b || !box) return;
      const left = Math.max(BOX_MARGIN, Math.min(a.left, window.innerWidth - b.width - BOX_MARGIN));
      const under = a.bottom + BOX_GAP;
      const over = a.top - BOX_GAP - b.height;
      const top = under + b.height <= window.innerHeight - BOX_MARGIN ? under : over >= BOX_MARGIN ? over : Math.max(BOX_MARGIN, window.innerHeight - b.height - BOX_MARGIN);
      box.style.left = `${left}px`;
      box.style.top = `${top}px`;
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchor]);

  useEffect(() => {
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
      // ✕ er det eneste, der kan vælges i boksen, så Tab bliver dér.
      if (e.key === 'Tab') {
        e.preventDefault();
        closeButton.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      // Et tryk på ⓘ selv lukker boksen med knappens eget klik.
      if (!root.current?.contains(target) && !anchor.current?.contains(target)) closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [anchor]);

  return createPortal(
    <div ref={root} id={id} className="info-box" role="dialog" aria-label={topic}>
      <div className="info-box-head">
        <strong>{topic}</strong>
        <button ref={closeButton} type="button" className="info-box-close" aria-label={tx('Luk', 'Close')} onClick={onClose}>
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      <div className="info-box-body">{children}</div>
    </div>,
    document.body,
  );
}
