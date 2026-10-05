import type { Card } from '../../domain/cards';
import { Info } from '../../ui/Info';
import { SuitText } from '../../ui/SuitText';
import { TEXT, type Note } from './texts';

const NEXT: Record<Note | 'none', Note | undefined> = { none: 'W', W: 'E', E: 'open', open: undefined };

interface HonnørchipsProps {
  unseen: readonly Card[];
  notes: Partial<Record<Card, Note>>;
  onNote(card: Card, note: Note | undefined): void;
  /** Notaterne er slået fra fra niveau 4. */
  disabled: boolean;
}

/** Én chip pr. uset honnør. Et tryk skifter notatet: Vest, Øst, ? og intet. Notaterne giver ikke point. */
export function Honnørchip({ card, note, onNote, disabled }: { card: Card; note?: Note; onNote(note: Note | undefined): void; disabled: boolean }) {
  const name = TEXT.card(card);
  return (
    <button
      type="button"
      className={`pr-chip${note ? ' pr-chip-noted' : ''}`}
      aria-label={TEXT.chipLabel(name, TEXT.noteNames[note ?? 'none'])}
      disabled={disabled}
      onClick={() => onNote(NEXT[note ?? 'none'])}
    >
      <span>
        <SuitText text={name} />
      </span>
      {note && <span className="pr-chip-note">{TEXT.notes[note]}</span>}
    </button>
  );
}

export function Honnørchips({ unseen, notes, onNote, disabled }: HonnørchipsProps) {
  return (
    <section className="pr-chips" aria-label={TEXT.unseen}>
      <div className="with-info">
        <h3 className="pr-eyebrow">{TEXT.unseen}</h3>
        <Info topic={TEXT.unseen}>{TEXT.help.chips}</Info>
      </div>
      <div className="pr-chip-row">
        {unseen.map((card) => (
          <Honnørchip key={card} card={card} note={notes[card]} disabled={disabled} onNote={(note) => onNote(card, note)} />
        ))}
      </div>
    </section>
  );
}
