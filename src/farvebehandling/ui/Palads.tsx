import { useState } from 'react';
import type { BankItem } from '../analysis';
import { cardsText } from '../model/cards';
import type { FbSaved } from '../storage';
import { palaceRooms, setScene, setTechniqueText, type Room, type Technique } from '../training/palace';
import { TEXT } from './texts';

interface PaladsProps {
  bank: readonly BankItem[];
  saved: FbSaved;
  update(next: FbSaved): void;
  techniques: readonly Technique[];
  onBack(): void;
}

type Editing = { kind: 'rule' | 'image'; technique: string; text: string } | { kind: 'scene'; combination: string; text: string };

/** Paladset: de åbne rum med huskeregel, billede og stationer; brugeren kan erstatte tekster og skrive scener. */
export function Palads({ bank, saved, update, techniques, onBack }: PaladsProps) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const rooms = palaceRooms(saved, bank, techniques);
  const open = rooms.filter((r) => r.stations.length > 0);
  const closed = rooms.filter((r) => r.stations.length === 0);

  function save() {
    if (!editing) return;
    update(
      editing.kind === 'scene'
        ? setScene(saved, editing.combination, editing.text)
        : setTechniqueText(saved, editing.technique, editing.kind, editing.text),
    );
    setEditing(null);
  }

  const editor = (label: string) =>
    editing && (
      <div className="fb-editor">
        <label className="fb-label" htmlFor="fb-edit">
          {label}
        </label>
        <textarea id="fb-edit" value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} />
        <p className="fb-note">{TEXT.resetHint}</p>
        <div className="fb-actions">
          <button type="button" className="btn small-btn" onClick={() => setEditing(null)}>
            {TEXT.cancel}
          </button>
          <button type="button" className="btn small-btn primary" onClick={save}>
            {TEXT.save}
          </button>
        </div>
      </div>
    );

  const roomText = (room: Room, kind: 'rule' | 'image') => {
    const title = kind === 'rule' ? TEXT.memory : TEXT.image;
    const isEditing = editing?.kind === kind && editing.technique === room.technique.id;
    const own = kind === 'rule' ? room.ownRule : room.ownImage;
    return isEditing ? (
      editor(title)
    ) : (
      <div className="fb-room-row">
        <p>
          <span className="fb-label">{title}: </span>
          {kind === 'rule' ? room.rule : room.image} <span className="fb-note">({own ? TEXT.own : TEXT.standard})</span>
        </p>
        <button
          type="button"
          className="btn small-btn"
          aria-label={`${TEXT.editLabel(title)}: ${room.technique.name}`}
          onClick={() => setEditing({ kind, technique: room.technique.id, text: own ? (kind === 'rule' ? room.rule : room.image) : '' })}
        >
          {TEXT.edit}
        </button>
      </div>
    );
  };

  return (
    <div className="fb-narrow">
      <header className="screen-head">
        <button type="button" className="round" aria-label={TEXT.backToTraining} onClick={onBack}>
          ←
        </button>
        <h2>{TEXT.palace}</h2>
      </header>
      <p className="fb-note">{TEXT.palaceHelp}</p>
      {open.map((room) => (
        <section key={room.technique.id} className="card fb-room" aria-labelledby={`fb-room-${room.technique.id}`}>
          <h2 id={`fb-room-${room.technique.id}`}>{room.technique.name}</h2>
          {roomText(room, 'rule')}
          {roomText(room, 'image')}
          <ol className="fb-stations">
            {room.stations.map((s) => {
              const holding = s.item ? `${cardsText(s.item.south)} / ${cardsText(s.item.north)}` : s.combination;
              const isEditing = editing?.kind === 'scene' && editing.combination === s.combination;
              return (
                <li key={s.combination} className="fb-station">
                  <span className="fb-station-name">
                    {s.order}. {holding}
                  </span>
                  {isEditing ? (
                    editor(TEXT.scene)
                  ) : (
                    <div className="fb-room-row">
                      <span className="fb-note">{s.scene ?? TEXT.noScene}</span>
                      <button
                        type="button"
                        className="btn small-btn"
                        aria-label={`${TEXT.editLabel(TEXT.scene)}: ${holding}`}
                        onClick={() => setEditing({ kind: 'scene', combination: s.combination, text: s.scene ?? '' })}
                      >
                        {TEXT.edit}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      {closed.length > 0 && (
        <section className="card" aria-labelledby="fb-closed">
          <h2 id="fb-closed">{TEXT.closedRooms}</h2>
          <p className="fb-note">{TEXT.closedHelp}</p>
          <ul className="fb-closed">
            {closed.map((r) => (
              <li key={r.technique.id}>{r.technique.name}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
