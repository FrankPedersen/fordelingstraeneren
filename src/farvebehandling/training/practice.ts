import type { BankItem } from '../analysis';
import { missingCards, rankText, TEN } from '../model/cards';
import type { FbSaved, PracticeEntry } from '../storage';
import { itemKey } from './tasks';

/**
 * Selvvalgt (SPEC-farvebehandling.md): brugeren vælger teknik, antal kort, manglende honnører og mål. Hvert valg viser
 * antallet af kombinationer med de andre filtre, og valg med 0 kan ikke vælges, så et filter aldrig rammer ingenting.
 * Svarene logges, men ændrer ikke dagsplanen.
 */

export interface PracticeFilter {
  technique: string | null;
  cards: number | null;
  missing: string | null;
  goal: number | null;
}

export type FilterKey = keyof PracticeFilter;

export const NO_FILTER: PracticeFilter = { technique: null, cards: null, missing: null, goal: null };

export interface FilterOption<T> {
  value: T;
  count: number;
}

const POINTS: Record<string, number> = { E: 4, K: 3, D: 2, B: 1 };

/** Honnørpoint i en tekst som "D B 10". */
const honorPoints = (text: string) => text.split(' ').reduce((sum, card) => sum + (POINTS[card] ?? 0), 0);

/** Højst så mange svar gemmes i loggen. */
export const PRACTICE_LOG_SIZE = 500;

/** Modpartens honnører (E K D B 10), fx "D" eller "D B". */
export function missingHonors(item: BankItem): string {
  return missingCards(item.north, item.south)
    .filter((r) => r >= TEN)
    .map(rankText)
    .join(' ');
}

const valueOf: { [K in FilterKey]: (item: BankItem) => Array<NonNullable<PracticeFilter[K]>> } = {
  technique: (item) => [item.combination.technique],
  cards: (item) => [item.north.length + item.south.length],
  missing: (item) => [missingHonors(item)],
  goal: (item) => item.combination.goals,
};

export function matches(item: BankItem, filter: PracticeFilter, ignore?: FilterKey): boolean {
  return (Object.keys(valueOf) as FilterKey[]).every((key) => {
    const wanted = filter[key];
    return key === ignore || wanted === null || (valueOf[key](item) as unknown[]).includes(wanted);
  });
}

function optionsFor<K extends FilterKey>(
  bank: readonly BankItem[],
  filter: PracticeFilter,
  key: K,
  order: (a: NonNullable<PracticeFilter[K]>, b: NonNullable<PracticeFilter[K]>) => number,
  extra: readonly NonNullable<PracticeFilter[K]>[] = [],
) {
  const values = new Set<NonNullable<PracticeFilter[K]>>(extra);
  for (const item of bank) for (const v of valueOf[key](item)) values.add(v as NonNullable<PracticeFilter[K]>);
  return [...values].sort(order).map((value) => ({
    value,
    count: bank.filter((item) => matches(item, { ...filter, [key]: value })).length,
  }));
}

/** Valgmulighederne for hvert filter med antal kombinationer, givet de andre filtre. Alle teknikker står med, også dem med 0. */
export function filterOptions(bank: readonly BankItem[], filter: PracticeFilter, techniqueOrder: readonly string[]) {
  const rank = (t: string) => {
    const i = techniqueOrder.indexOf(t);
    return i < 0 ? techniqueOrder.length : i;
  };
  return {
    technique: optionsFor(bank, filter, 'technique', (a, b) => rank(a) - rank(b), techniqueOrder),
    cards: optionsFor(bank, filter, 'cards', (a, b) => a - b),
    missing: optionsFor(bank, filter, 'missing', (a, b) => honorPoints(a) - honorPoints(b) || a.length - b.length || a.localeCompare(b)),
    goal: optionsFor(bank, filter, 'goal', (a, b) => a - b),
  };
}

/** Antal kombinationer, filteret rammer. */
export function matchCount(bank: readonly BankItem[], filter: PracticeFilter): number {
  return bank.filter((item) => matches(item, filter)).length;
}

/** Emnerne (kombination × mål), filteret rammer. */
export function practiceItems(bank: readonly BankItem[], filter: PracticeFilter): string[] {
  return bank
    .filter((item) => matches(item, filter))
    .flatMap((item) => item.combination.goals.filter((g) => filter.goal === null || g === filter.goal).map((g) => itemKey(item.combination.id, g)));
}

/** Logger et svar i Selvvalgt. Emnerne og dagsplanen røres ikke. */
export function logPractice(saved: FbSaved, entry: PracticeEntry): FbSaved {
  return { ...saved, practice: [...saved.practice, entry].slice(-PRACTICE_LOG_SIZE) };
}
