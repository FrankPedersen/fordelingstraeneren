import { describe, expect, it, vi } from 'vitest';
import { newItem } from '../engine/leitner';
import { defaultSaved, type Saved } from '../engine/storage';
import { defaultFbSaved, FB_STORAGE_KEY } from '../farvebehandling/storage';
import { defaultHeSaved, HE_STORAGE_KEY } from '../haandevaluering/storage';
import { DECK_ORDER as HE_DECK } from '../haandevaluering/training/deck';
import { defaultPrSaved, PR_STORAGE_KEY } from '../pointregnskab/storage';
import { DECK_ORDER as PR_DECK } from '../pointregnskab/training/deck';
import { itemKey } from './progression';
import { todayOverview, trackStatuses } from './status';
import { TRACK_CARDS } from './tracks';

/** En lagring, der kun kan læses; setItem må aldrig kaldes. */
function storageOf(values: Record<string, string>) {
  const setItem = vi.fn();
  return { getItem: (key: string) => values[key] ?? null, setItem };
}

const NOON = new Date(2026, 9, 17, 12).getTime(); // lørdag 17. oktober 2026 kl. 12
// Sporene med status; modulet Analyse har ingen (SPEC-analyse-modul.md).
const ORDER = TRACK_CARDS.filter((c) => c.status !== false).map((c) => c.track);

describe('Status fra sporene (SPEC-forside-spor.md)', () => {
  it('uden data er alle fire spor "ikke startet" uden tal', () => {
    const statuses = trackStatuses(defaultSaved(), storageOf({}), NOON);
    expect(Object.keys(statuses)).toEqual(ORDER);
    for (const track of ORDER) expect(statuses[track], track).toMatchObject({ started: false, streak: 0, level: null, doneToday: false, due: 0 });
  });

  it('læser streak, niveau, dagens session og emner til repetition fra hvert spor', () => {
    const fordeling: Saved = {
      ...defaultSaved(),
      streak: { current: 3, best: 9, lastDay: '2026-10-16' },
      items: { [itemKey('4-4-3-2', 'rank')]: newItem('2026-10-15'), [itemKey('4-4-3-2', 'compare')]: newItem('2026-10-20') },
    };
    const pr = { ...defaultPrSaved(), level: 3, streak: { current: 5, best: 5, lastDay: '2026-10-17' }, items: { [PR_DECK[0]]: newItem('2026-10-17'), [PR_DECK[1]]: newItem('2026-10-16') } };
    const fb = { ...defaultFbSaved(), streak: { current: 2, best: 2, lastDay: '2026-10-16' }, items: { 'a:1': newItem('2026-10-10'), 'b:2': newItem('2026-10-18') } };
    const he = { ...defaultHeSaved(), level: 1, streak: { current: 1, best: 1, lastDay: '2026-10-17' }, items: { [HE_DECK[0]]: newItem('2026-10-30') } };
    const storage = storageOf({ [PR_STORAGE_KEY]: JSON.stringify(pr), [FB_STORAGE_KEY]: JSON.stringify(fb), [HE_STORAGE_KEY]: JSON.stringify(he) });
    const s = trackStatuses(fordeling, storage, NOON);
    expect(s.fordeling).toMatchObject({ started: true, streak: 3, level: 1, grade: 'common', doneToday: false, due: 1 });
    expect(s.pointregnskab).toMatchObject({ started: true, streak: 5, level: 3, doneToday: true, due: 2 });
    expect(s.farvebehandling).toMatchObject({ started: true, streak: 2, level: null, doneToday: false, due: 1 });
    expect(s.haandevaluering).toMatchObject({ started: true, streak: 1, level: 1, doneToday: true, due: 0 });
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(todayOverview(ORDER, s)).toEqual({ done: 2, total: 4, next: 'fordeling' });
  });

  it('dagen skifter kl. 04: kl. 03.30 er det stadig gårsdagens session', () => {
    const pr = { ...defaultPrSaved(), streak: { current: 1, best: 1, lastDay: '2026-10-16' }, items: { [PR_DECK[0]]: newItem('2026-10-20') } };
    const storage = storageOf({ [PR_STORAGE_KEY]: JSON.stringify(pr) });
    expect(trackStatuses(defaultSaved(), storage, new Date(2026, 9, 17, 3, 30).getTime()).pointregnskab.doneToday).toBe(true);
    expect(trackStatuses(defaultSaved(), storage, new Date(2026, 9, 17, 4, 30).getTime()).pointregnskab.doneToday).toBe(false);
  });

  it('data, der ikke kan læses, giver "ikke startet" uden at fejle og uden at skrive', () => {
    const storage = storageOf({ [PR_STORAGE_KEY]: '{ikke json', [FB_STORAGE_KEY]: '"en tekst"', [HE_STORAGE_KEY]: 'null' });
    const s = trackStatuses(defaultSaved(), storage, NOON);
    for (const track of ['pointregnskab', 'farvebehandling', 'haandevaluering']) expect(s[track].started, track).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('det næste spor er det første i forsidens rækkefølge, der ikke er trænet i dag', () => {
    const status = (doneToday: boolean) => ({ track: '', started: true, streak: 1, level: null, grade: null, doneToday, due: 0, fresh: 0 });
    expect(todayOverview(ORDER, { fordeling: status(true), pointregnskab: status(true), farvebehandling: status(false), haandevaluering: status(false) }).next).toBe('farvebehandling');
    expect(todayOverview(ORDER, { fordeling: status(true), pointregnskab: status(true), farvebehandling: status(true), haandevaluering: status(true) })).toEqual({ done: 4, total: 4, next: null });
  });
});
