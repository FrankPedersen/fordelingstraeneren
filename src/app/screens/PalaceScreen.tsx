import { useState } from 'react';
import type { Saved } from '../../engine/storage';
import { GRADES, GRADE_LABEL, PATTERNS } from '../../domain/patterns';
import { STANDARD_IMAGES, imageOf } from '../../memory/images';
import { LOFT_ROOM, isRoomOpen, palaceOf, sceneTemplate, type Palace } from '../../memory/palace';
import { Skyline } from '../../ui/Skyline';
import { gradeProgress } from '../progression';

const ROOM_SPAN = ['Station 1–5', 'Station 6–10', 'Station 11–13', 'De episke mønstre, uden rækkefølge'];

interface PalaceScreenProps {
  saved: Saved;
  onSave(saved: Saved): void;
  onBack(): void;
}

export function PalaceScreen({ saved, onSave, onBack }: PalaceScreenProps) {
  const palace = palaceOf(saved);
  const level = gradeProgress(saved).level;
  const [editing, setEditing] = useState<number | null>(null);

  const savePalace = (next: Palace) => onSave({ ...saved, palace: next });

  function setRoomName(index: number, name: string) {
    savePalace({ ...palace, rooms: palace.rooms.map((r, i) => (i === index ? { ...r, name } : r)) });
  }

  function setStation(index: number, patch: Partial<Palace['stations'][number]>) {
    savePalace({ ...palace, stations: palace.stations.map((s, i) => (i === index ? { ...s, ...patch } : s)) });
  }

  function setImage(patternId: string, text: string) {
    const images = { ...saved.images };
    if (text) images[patternId] = text;
    else delete images[patternId];
    onSave({ ...saved, images });
  }

  return (
    <main className="screen">
      <header className="screen-head">
        <button type="button" className="round" aria-label="Tilbage" onClick={onBack}>
          ←
        </button>
        <h1>Huskepalads</h1>
      </header>
      <p className="muted small">
        Vælg en rute, du kender udenad – fx dit hjem, klubben eller en fast gåtur – og læg 13 stationer på
        den. Station n rummer mønstret med rang n. Skriv en scene til hver station.
      </p>

      {palace.rooms.map((room, r) => {
        const open = isRoomOpen(r + 1, level);
        return (
          <section key={r} className="card">
            <label className="field">
              <span className="muted small">{ROOM_SPAN[r]}</span>
              <input
                value={room.name}
                aria-label={`Navn på rum ${r + 1}`}
                disabled={!open}
                onChange={(e) => setRoomName(r, e.target.value)}
              />
            </label>
            {!open ? (
              <p className="muted small">
                Låses op på niveau {r + 1}, når mønstrene fra graden {GRADE_LABEL[GRADES[r - 1]]} er lært.
              </p>
            ) : r + 1 === LOFT_ROOM ? (
              <ul className="stations">
                {PATTERNS.filter((p) => p.grade === 'epic').map((p) => (
                  <li key={p.id} className="loft-row">
                    <Skyline id={p.id} size="sm" label={false} />
                    <label className="field grow">
                      <span className="small">
                        <strong>{p.id}</strong>
                      </span>
                      <input
                        value={saved.images[p.id] ?? ''}
                        placeholder="Skriv dit eget billede"
                        onChange={(e) => setImage(p.id, e.target.value)}
                      />
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <ol className="stations">
                {palace.stations.map((station, i) =>
                  station.room !== r + 1 ? null : (
                    <li key={i}>
                      <button
                        type="button"
                        className="station-row"
                        aria-expanded={editing === i}
                        onClick={() => setEditing(editing === i ? null : i)}
                      >
                        <span className="station-number">{i + 1}</span>
                        <Skyline id={station.patternId} size="sm" label={false} />
                        <span className="grow">
                          <strong>{station.name.trim() || 'Navngiv stationen'}</strong>
                          <span className="muted small"> · {imageOf(saved, station.patternId)?.name}</span>
                        </span>
                        <span aria-hidden="true">{editing === i ? '▴' : '▾'}</span>
                      </button>
                      {editing === i && (
                        <StationEditor
                          saved={saved}
                          station={station}
                          number={i + 1}
                          onStation={(patch) => setStation(i, patch)}
                          onImage={(text) => setImage(station.patternId, text)}
                        />
                      )}
                    </li>
                  ),
                )}
              </ol>
            )}
          </section>
        );
      })}
    </main>
  );
}

interface StationEditorProps {
  saved: Saved;
  station: Palace['stations'][number];
  number: number;
  onStation(patch: Partial<Palace['stations'][number]>): void;
  onImage(text: string): void;
}

function StationEditor({ saved, station, number, onStation, onImage }: StationEditorProps) {
  const standard = STANDARD_IMAGES[station.patternId];
  const image = imageOf(saved, station.patternId)?.name ?? '';
  const template = sceneTemplate(station.name.trim() || 'stationen', image);
  return (
    <div className="station-editor">
      <p>
        <strong>{station.patternId}</strong> bor ved station {number}.
      </p>
      <label className="field">
        <span>Stationens navn</span>
        <input
          value={station.name}
          placeholder="fx hoveddøren"
          onChange={(e) => onStation({ name: e.target.value })}
        />
      </label>
      <label className="field">
        <span>Billede</span>
        <input
          value={saved.images[station.patternId] ?? ''}
          placeholder={standard?.name}
          onChange={(e) => onImage(e.target.value)}
        />
      </label>
      {standard && (
        <p className="muted small">
          Standardbilledet er {standard.name}: {standard.shape}. Et billede, du selv finder på, huskes bedre.
        </p>
      )}
      <label className="field">
        <span>Scene</span>
        <textarea
          rows={3}
          value={station.scene ?? ''}
          placeholder={template}
          onChange={(e) => onStation({ scene: e.target.value })}
        />
      </label>
      {!station.scene && (
        <button type="button" className="btn small-btn" onClick={() => onStation({ scene: `${template} ` })}>
          Brug skabelonen
        </button>
      )}
      <p className="muted small">Gør billedet overdrevet, lad det bevæge sig, og lad det røre ved stationen.</p>
    </div>
  );
}
