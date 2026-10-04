import type { Room } from '../training/palace';
import { TEXT } from './texts';

interface RumkortProps {
  room: Room;
  /** Stationens nummer; `fresh` = stationen oprettes, når kombinationen introduceres. */
  station: number | null;
  fresh?: boolean;
  scene?: string;
}

/** Paladsets rum for en kombination: teknikken, huskeregel, billede og stationens scene. */
export function Rumkort({ room, station, fresh = false, scene }: RumkortProps) {
  return (
    <section className="card fb-room" aria-label={TEXT.memory}>
      <p className="eyebrow">
        {fresh && station ? TEXT.newStation(room.technique.name, station) : TEXT.room(room.technique.name, station)}
      </p>
      <p className="fb-rule">
        <span className="fb-label">{TEXT.memory}: </span>
        {room.rule}
      </p>
      <p className="fb-note">
        <span className="fb-label">{TEXT.image}: </span>
        {room.image}
      </p>
      {scene && (
        <p className="fb-note">
          <span className="fb-label">{TEXT.scene}: </span>
          {scene}
        </p>
      )}
    </section>
  );
}
