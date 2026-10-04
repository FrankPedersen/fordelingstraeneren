import type { BankItem } from '../analysis';
import type { FbSaved } from '../storage';

/**
 * Farvebehandlingens eget palads (SPEC-farvebehandling.md, Huskepalads og huskeregler): hvert rum er en teknik, og
 * stationerne er teknikkens kombinationer i den rækkefølge, de er introduceret. Et rum åbner, når dets første
 * kombination dukker op. Brugeren kan erstatte rummets billede og huskeregel og give hver station sin egen scene.
 */

export interface Technique {
  id: string;
  name: string;
  order: number;
  rule: string;
  image: string;
}

export interface Station {
  combination: string;
  order: number;
  scene?: string;
  item?: BankItem;
}

export interface Room {
  technique: Technique;
  rule: string;
  image: string;
  ownRule: boolean;
  ownImage: boolean;
  stations: Station[];
}

/** Rummene i teknikkernes rækkefølge; rum uden stationer er lukkede. */
export function palaceRooms(saved: FbSaved, bank: readonly BankItem[], techniques: readonly Technique[]): Room[] {
  return [...techniques]
    .sort((a, b) => a.order - b.order)
    .map((technique) => {
      const own = saved.palace.techniques[technique.id] ?? {};
      const stations = Object.entries(saved.palace.stations)
        .filter(([, s]) => s.technique === technique.id)
        .map(([combination, s]) => ({
          combination,
          order: s.order,
          ...(s.scene ? { scene: s.scene } : {}),
          item: bank.find((b) => b.combination.id === combination),
        }))
        .sort((a, b) => a.order - b.order);
      return {
        technique,
        rule: own.rule || technique.rule,
        image: own.image || technique.image,
        ownRule: !!own.rule,
        ownImage: !!own.image,
        stations,
      };
    });
}

/** Rummet og stationen for en kombination; før introduktionen bruges bankens teknik uden station. */
export function placeOf(
  saved: FbSaved,
  bank: readonly BankItem[],
  techniques: readonly Technique[],
  combination: string,
): { room: Room; station: Station | null } | null {
  const rooms = palaceRooms(saved, bank, techniques);
  const id = saved.palace.stations[combination]?.technique ?? bank.find((b) => b.combination.id === combination)?.combination.technique;
  const room = rooms.find((r) => r.technique.id === id);
  if (!room) return null;
  return { room, station: room.stations.find((s) => s.combination === combination) ?? null };
}

/** Giver introducerede kombinationer uden station en station (fx hvis teknikken manglede ved introduktionen). */
export function ensureStations(saved: FbSaved, bank: readonly BankItem[]): FbSaved {
  let stations = saved.palace.stations;
  for (const b of bank) {
    const { id, technique } = b.combination;
    if (!(id in saved.introduced) || stations[id] || !technique) continue;
    const order = Object.values(stations).filter((s) => s.technique === technique).length + 1;
    stations = { ...stations, [id]: { technique, order } };
  }
  return stations === saved.palace.stations ? saved : { ...saved, palace: { ...saved.palace, stations } };
}

/** Eget billede eller egen huskeregel for et rum. En tom tekst giver standarden tilbage. */
export function setTechniqueText(saved: FbSaved, technique: string, field: 'image' | 'rule', text: string): FbSaved {
  const current = { ...(saved.palace.techniques[technique] ?? {}) };
  const value = text.trim();
  if (value) current[field] = value;
  else delete current[field];
  const techniques = { ...saved.palace.techniques };
  if (Object.keys(current).length) techniques[technique] = current;
  else delete techniques[technique];
  return { ...saved, palace: { ...saved.palace, techniques } };
}

/** Egen scene for en station. En tom tekst fjerner den. */
export function setScene(saved: FbSaved, combination: string, text: string): FbSaved {
  const station = saved.palace.stations[combination];
  if (!station) return saved;
  const { scene: _old, ...rest } = station;
  const value = text.trim();
  const next = value ? { ...rest, scene: value } : rest;
  return { ...saved, palace: { ...saved.palace, stations: { ...saved.palace.stations, [combination]: next } } };
}
