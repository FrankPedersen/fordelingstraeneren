import { formatInt } from '../engine/format';
import type { Saved } from '../engine/storage';
import { GRADE_LABEL, patternById } from '../domain/patterns';
import { Skyline } from '../ui/Skyline';
import { patternPercent } from '../ui/text';
import { imageOf, type PatternImage } from './images';
import { palaceOf, placeOf, roomName, stationName } from './palace';

/** "Station 3 · Køkkenbordet · Rum 1", "Loftet" eller null for legendariske mønstre. */
export function placeText(saved: Saved, patternId: string): string | null {
  const place = placeOf(patternById(patternId));
  if (place === null) return null;
  if (place === 'loft') return roomName(saved, 4);
  const name = stationName(saved, place);
  const room = roomName(saved, palaceOf(saved).stations[place - 1].room);
  return name === `Station ${place}` ? `${name} · ${room}` : `Station ${place} · ${name} · ${room}`;
}

function ImageText({ image }: { image: PatternImage }) {
  return (
    <p>
      <strong>{image.name}</strong>
      {image.shape && <span className="muted"> – {image.shape}</span>}
    </p>
  );
}

function Scene({ saved, patternId }: { saved: Saved; patternId: string }) {
  const place = placeOf(patternById(patternId));
  const scene = typeof place === 'number' ? palaceOf(saved).stations[place - 1].scene?.trim() : undefined;
  return scene ? <p className="scene">{scene}</p> : null;
}

interface PresentationCardProps {
  saved: Saved;
  patternId: string;
  /** "Nyt mønster" ved introduktionen, "Husk" på støtteniveau 3. */
  title: string;
  onContinue(): void;
}

/** Emnet præsenteres med station, mønster og billede, før det testes. */
export function PresentationCard({ saved, patternId, title, onContinue }: PresentationCardProps) {
  const p = patternById(patternId);
  const place = placeText(saved, patternId);
  const image = imageOf(saved, patternId);
  const facts: [string, string | number][] = [
    ['Rang', p.rank],
    ['Sandsynlighed', patternPercent(p)],
    ['Pr. 100 hænder', p.per100],
    ['1 ud af', formatInt(p.oneIn)],
    ['Placeringer', p.placements],
    ['Grad', GRADE_LABEL[p.grade]],
  ];
  return (
    <section className="intro">
      <p className="eyebrow">{title}</p>
      <Skyline id={p.id} size="lg" />
      {(place || image) && (
        <div className="memory card">
          {place && <p className="muted small">{place}</p>}
          {image && <ImageText image={image} />}
          <Scene saved={saved} patternId={patternId} />
        </div>
      )}
      <dl className="facts">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="spacer" />
      <button type="button" className="btn primary wide" onClick={onContinue}>
        Videre
      </button>
    </section>
  );
}

/** Ledetråden: mønstrets billede. */
export function HintBox({ image }: { image: PatternImage }) {
  return (
    <div className="memory hint" role="note">
      <span className="eyebrow">Ledetråd</span>
      <ImageText image={image} />
    </div>
  );
}

/** Efter svaret: station, billede og skyline – eller kun skyline, når støtten er aftrappet. */
export function MemoryBox({ saved, patternId, full }: { saved: Saved; patternId: string; full: boolean }) {
  const place = full ? placeText(saved, patternId) : null;
  const image = full ? imageOf(saved, patternId) : null;
  return (
    <div className="memory card memory-box">
      <Skyline id={patternId} size="sm" label={false} />
      <div>
        <p>
          <strong>{patternId}</strong>
          {place && <span className="muted"> · {place}</span>}
        </p>
        {image && <ImageText image={image} />}
        {full && <Scene saved={saved} patternId={patternId} />}
      </div>
    </div>
  );
}
