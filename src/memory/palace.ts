import type { Saved } from '../engine/storage';
import { GRADES, PATTERNS, type Pattern } from '../domain/patterns';
import { tx } from '../i18n';

export type Palace = Saved['palace'];

/** Stationerne 1–13 og Loftet. */
export type Place = number | 'loft';

export const STATIONS = 13;
export const LOFT_ROOM = 4;

const ROOMS_DA = ['Rum 1', 'Rum 2', 'Rum 3', 'Loftet'];
const ROOMS_EN = ['Room 1', 'Room 2', 'Room 3', 'The Attic'];
/** Rummets standardnavn på det aktuelle sprog; et gemt standardnavn på det andet sprog oversættes også. */
const defaultRoom = (i: number) => tx(ROOMS_DA[i], ROOMS_EN[i]);
const isDefaultRoom = (name: string, i: number) => name === ROOMS_DA[i] || name === ROOMS_EN[i];

/**
 * Rummet for et mønster: rum 1–3 følger graderne almindelig, ualmindelig og sjælden
 * (station 1–5, 6–10 og 11–13), de episke bor på Loftet, og legendariske placeres ikke.
 */
export function roomOf(pattern: Pattern): number | null {
  const index = GRADES.indexOf(pattern.grade);
  return index < LOFT_ROOM ? index + 1 : null;
}

/** Stationen (= rangen) for mønstrene på ruten, 'loft' for de episke, ellers null. */
export function placeOf(pattern: Pattern): Place | null {
  const room = roomOf(pattern);
  if (room === null) return null;
  return room === LOFT_ROOM ? 'loft' : pattern.rank;
}

type Station = Palace['stations'][number];

/** Paladset med brugerens navne og scener; manglende rum og stationer får standardværdier. */
export function palaceOf(saved: Pick<Saved, 'palace'>): Palace {
  const rooms = ROOMS_DA.map((_, i) => {
    const stored = saved.palace.rooms[i] as Palace['rooms'][number] | undefined;
    const name = stored?.name;
    return { ...stored, name: name === undefined || isDefaultRoom(name, i) ? defaultRoom(i) : name };
  });
  const stations = PATTERNS.slice(0, STATIONS).map((pattern, i) => {
    const stored = saved.palace.stations[i] as Station | undefined;
    return { ...stored, name: stored?.name ?? '', room: roomOf(pattern)!, patternId: pattern.id };
  });
  return { ...saved.palace, rooms, stations };
}

export interface RouteRoom {
  room: number;
  name: string;
  open: boolean;
  /** Stationerne i rummet; Loftet har ingen. */
  stations: { place: number; name: string; patternId: string }[];
}

/** Ruten, som brugeren vælger stationer på: rum 1–3 med stationer og Loftet. */
export function routeOf(saved: Pick<Saved, 'palace'>, level: number): RouteRoom[] {
  const palace = palaceOf(saved);
  return palace.rooms.map((_, i) => ({
    room: i + 1,
    name: roomName(saved, i + 1),
    open: isRoomOpen(i + 1, level),
    stations: palace.stations
      .map((s, j) => ({ place: j + 1, name: stationName(saved, j + 1), patternId: s.patternId, room: s.room }))
      .filter((s) => s.room === i + 1)
      .map(({ place, name, patternId }) => ({ place, name, patternId })),
  }));
}

export function stationName(saved: Pick<Saved, 'palace'>, station: number): string {
  return palaceOf(saved).stations[station - 1].name.trim() || `Station ${station}`;
}

export function roomName(saved: Pick<Saved, 'palace'>, room: number): string {
  return palaceOf(saved).rooms[room - 1].name.trim() || defaultRoom(room - 1);
}

/** Rum k åbner med niveau k: rum 2 og 3 og Loftet låses op, når den foregående grad er lært. */
export function isRoomOpen(room: number, level: number): boolean {
  return room <= level;
}

export function sceneTemplate(station: string, image: string): string {
  return tx(`Ved ${station}: ${image}`, `At ${station}: ${image}`);
}
