import { addDays } from '../../engine/dates';
import { isDue, newItem } from '../../engine/leitner';
import type { BankItem } from '../analysis';
import type { FbSaved } from '../storage';
import { itemKey } from './tasks';

/**
 * Progression i farvebehandling: kombinationerne introduceres i hyppighedsorden (bankens rækkefølge) uanset teknik,
 * højst `settings.newPerDay` om dagen. Ét emne pr. kombination og mål.
 */

export function introducedOn(saved: FbSaved, day: string): number {
  return Object.values(saved.introduced).filter((d) => d === day).length;
}

/** De næste kombinationer, der kan introduceres i dag. */
export function freshToday(saved: FbSaved, bank: readonly BankItem[], today: string): BankItem[] {
  const room = Math.max(0, saved.settings.newPerDay - introducedOn(saved, today));
  return bank.filter((b) => !(b.combination.id in saved.introduced)).slice(0, room);
}

/**
 * Introducerer en kombination: et emne pr. mål i kasse 1 og en station i teknikkens rum i paladset. Stationen
 * gemmes med teknik og nummer, så paladset bevarer sin orden, selv om banken senere får en anden teknik.
 */
export function introduce(saved: FbSaved, bank: BankItem, today: string): FbSaved {
  const { id, technique, goals } = bank.combination;
  const items = { ...saved.items };
  for (const goal of goals) {
    const key = itemKey(id, goal);
    if (!items[key]) items[key] = newItem(today);
  }
  let stations = saved.palace.stations;
  if (!stations[id] && technique) {
    const order = Object.values(stations).filter((s) => s.technique === technique).length + 1;
    stations = { ...stations, [id]: { technique, order } };
  }
  return { ...saved, items, introduced: { ...saved.introduced, [id]: today }, palace: { ...saved.palace, stations } };
}

/** Forfaldne emner: ældste forfald først. */
export function dueItems(saved: FbSaved, today: string): string[] {
  return Object.entries(saved.items)
    .filter(([, item]) => isDue(item, today))
    .sort(([ka, a], [kb, b]) => a.due.localeCompare(b.due) || ka.localeCompare(kb))
    .map(([key]) => key);
}

/** Antal emner, der er forfaldne i morgen. */
export function dueTomorrow(saved: FbSaved, today: string): number {
  return dueItems(saved, addDays(today, 1)).length;
}

/** Emnets kombination og mål ud fra nøglen. */
export function parseItemKey(key: string): { id: string; goal: number } {
  const i = key.lastIndexOf(':');
  return { id: key.slice(0, i), goal: Number(key.slice(i + 1)) };
}
