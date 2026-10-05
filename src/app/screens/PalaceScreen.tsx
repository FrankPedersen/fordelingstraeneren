import { useState } from 'react';
import type { Saved } from '../../engine/storage';
import { GRADES, GRADE_LABEL, PATTERNS } from '../../domain/patterns';
import { STANDARD_IMAGES, imageOf } from '../../memory/images';
import { LOFT_ROOM, isRoomOpen, palaceOf, sceneTemplate, type Palace } from '../../memory/palace';
import { Skyline } from '../../ui/Skyline';
import { gradeProgress } from '../progression';
import { tx } from '../../i18n';
import { Info } from '../../ui/Info';

const roomSpan = (r: number) =>
  [
    tx('Station 1–5', 'Stations 1–5'),
    tx('Station 6–10', 'Stations 6–10'),
    tx('Station 11–13', 'Stations 11–13'),
    tx('De episke mønstre, uden rækkefølge', 'The epic patterns, in no particular order'),
  ][r];

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
        <button type="button" className="round" aria-label={tx('Tilbage', 'Back')} onClick={onBack}>
          ←
        </button>
        <h1>{tx('Huskepalads', 'Memory palace')}</h1>
        <Info topic={tx('Huskepalads', 'Memory palace')}>
          {tx(
            'Tryk på en station for at navngive den, skrive dit eget billede og en scene. Rum 2, rum 3 og Loftet åbner, når du når de næste niveauer. Paladsvandring i sessionen øver ruten begge veje.',
            'Tap a station to name it and write your own image and a scene. Room 2, room 3 and the Attic open as you reach the next levels. Palace walk in the session practises the route both ways.',
          )}
        </Info>
      </header>
      <p className="muted small">
        {tx(
          'Vælg en rute, du kender udenad – fx dit hjem, klubben eller en fast gåtur – og læg 13 stationer på den. Station n rummer mønstret med rang n. Skriv en scene til hver station.',
          'Choose a route you know by heart – your home, the club or a regular walk – and place 13 stations along it. Station n holds the pattern with rank n. Write a scene for each station.',
        )}
      </p>

      {palace.rooms.map((room, r) => {
        const open = isRoomOpen(r + 1, level);
        return (
          <section key={r} className="card">
            <label className="field">
              <span className="muted small">{roomSpan(r)}</span>
              <input
                value={room.name}
                aria-label={tx(`Navn på rum ${r + 1}`, `Name of room ${r + 1}`)}
                disabled={!open}
                onChange={(e) => setRoomName(r, e.target.value)}
              />
            </label>
            {!open ? (
              <p className="muted small">
                {tx(
                  `Låses op på niveau ${r + 1}, når mønstrene fra graden ${GRADE_LABEL[GRADES[r - 1]]} er lært.`,
                  `Unlocks at level ${r + 1}, when the patterns of the grade ${GRADE_LABEL[GRADES[r - 1]]} are learnt.`,
                )}
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
                        placeholder={tx('Skriv dit eget billede', 'Write your own image')}
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
                          <strong>{station.name.trim() || tx('Navngiv stationen', 'Name the station')}</strong>
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
  const template = sceneTemplate(station.name.trim() || tx('stationen', 'the station'), image);
  return (
    <div className="station-editor">
      <p>
        <strong>{station.patternId}</strong> {tx(`bor ved station ${number}.`, `lives at station ${number}.`)}
      </p>
      <label className="field">
        <span>{tx('Stationens navn', 'Name of the station')}</span>
        <input
          value={station.name}
          placeholder={tx('fx hoveddøren', 'e.g. the front door')}
          onChange={(e) => onStation({ name: e.target.value })}
        />
      </label>
      <label className="field">
        <span>{tx('Billede', 'Image')}</span>
        <input
          value={saved.images[station.patternId] ?? ''}
          placeholder={standard?.name}
          onChange={(e) => onImage(e.target.value)}
        />
      </label>
      {standard && (
        <p className="muted small">
          {tx(
            `Standardbilledet er ${standard.name}: ${standard.shape}. Et billede, du selv finder på, huskes bedre.`,
            `The standard image is ${standard.name}: ${standard.shape}. An image you make up yourself is remembered better.`,
          )}
        </p>
      )}
      <label className="field">
        <span>{tx('Scene', 'Scene')}</span>
        <textarea
          rows={3}
          value={station.scene ?? ''}
          placeholder={template}
          onChange={(e) => onStation({ scene: e.target.value })}
        />
      </label>
      {!station.scene && (
        <button type="button" className="btn small-btn" onClick={() => onStation({ scene: `${template} ` })}>
          {tx('Brug skabelonen', 'Use the template')}
        </button>
      )}
      <p className="muted small">
        {tx('Gør billedet overdrevet, lad det bevæge sig, og lad det røre ved stationen.', 'Make the image exaggerated, let it move, and let it touch the station.')}
      </p>
    </div>
  );
}
