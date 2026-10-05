import { describe, expect, it } from 'vitest';
import type { Item } from '../engine/leitner';
import { STORAGE_KEY } from '../engine/storage';
import {
  defaultFbSaved,
  exportDue,
  FB_BACKUP_KEY,
  FB_STORAGE_KEY,
  fbExportFileName,
  fbSummary,
  loadFbSaved,
  parseFbImport,
  persistence,
  readFbSaved,
  requestPersistence,
  saveFbSaved,
  type PracticeEntry,
} from './storage';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

const item: Item = { box: 2, due: '2026-10-05', support: 3, log: [{ t: 1, ok: true, ms: 9000 }] };

describe('Farvebehandlingens lagring', () => {
  it('gemmer og indlæser under sin egen nøgle uden at røre fordelingssporet', () => {
    const fordeling = '{"version":1,"urørt":true}';
    const storage = memoryStorage({ [STORAGE_KEY]: fordeling });
    const saved = { ...defaultFbSaved(), xp: 120, items: { 'J32-AK54:3': item }, introduced: { 'J32-AK54': '2026-10-04' } };
    expect(saveFbSaved(storage, saved)).toBe(true);
    expect(loadFbSaved(storage)).toEqual(saved);
    expect(storage.data.get(STORAGE_KEY)).toBe(fordeling);
    expect(FB_STORAGE_KEY).toBe('farvebehandling:v1');
  });

  it('erstatter ugyldige dele, bevarer ukendte felter og lægger en kopi', () => {
    const raw = { ...defaultFbSaved(), xp: -5, items: { god: item, dårlig: { box: 9 } }, fremtidigtFelt: { a: 1 } };
    const storage = memoryStorage({ [FB_STORAGE_KEY]: JSON.stringify(raw) });
    const loaded = loadFbSaved(storage) as unknown as Record<string, unknown>;
    expect(loaded.xp).toBe(0);
    expect(Object.keys(loaded.items as object)).toEqual(['god']);
    expect(loaded.fremtidigtFelt).toEqual({ a: 1 });
    expect(storage.data.get(FB_BACKUP_KEY)).toBe(JSON.stringify(raw));
  });

  it('giver standardværdier og en kopi, når data ikke er JSON', () => {
    const storage = memoryStorage({ [FB_STORAGE_KEY]: '{ikke json' });
    expect(loadFbSaved(storage)).toEqual(defaultFbSaved());
    expect(storage.data.get(FB_BACKUP_KEY)).toBe('{ikke json');
  });

  it('importerer kun gyldige filer fra farvebehandling', () => {
    expect(parseFbImport('{ikke json')).toEqual({ ok: false, error: 'Filen er ikke gyldig JSON.' });
    // En fil fra fordelingssporet afvises.
    expect(parseFbImport(JSON.stringify({ version: 1, palace: { rooms: [] }, items: {} })).ok).toBe(false);
    expect(parseFbImport(JSON.stringify({ ...defaultFbSaved(), version: 2 }))).toEqual({ ok: false, error: 'Filen er fra en nyere version af appen.' });
    const bad = parseFbImport(JSON.stringify({ ...defaultFbSaved(), items: { x: { box: 0 } } }));
    expect(bad.ok).toBe(false);
    const good = parseFbImport(JSON.stringify({ ...defaultFbSaved(), xp: 40 }));
    expect(good).toEqual({ ok: true, saved: { ...defaultFbSaved(), xp: 40 } });
  });

  it('opsummerer og navngiver eksporten', () => {
    const { saved } = readFbSaved({ ...defaultFbSaved(), xp: 15, items: { a: item } });
    expect(fbSummary(saved)).toEqual({ xp: 15, streak: 0, best: 0, items: 1, sessions: 0, lastDay: '' });
    expect(fbExportFileName('2026-10-04')).toBe('farvebehandling-2026-10-04.json');
  });
});

describe('Valgfrie felter, fast lagring og påmindelse om eksport', () => {
  const entry: PracticeEntry = { day: '2026-10-04', item: 'J32-AK54:3', task: 'hold-eller-par', score: 0.5, ms: 1000 };

  it('bevarer gyldige valgfrie felter og fjerner ugyldige', () => {
    const ok = readFbSaved({ ...defaultFbSaved(), training: [entry], lastExport: '2026-10-01' });
    expect(ok.problems).toEqual([]);
    expect(ok.saved.training).toEqual([entry]);
    expect(ok.saved.lastExport).toBe('2026-10-01');
    const bad = readFbSaved({ ...defaultFbSaved(), training: [{ ...entry, score: 2 }], lastExport: 'i går' });
    expect(bad.problems).toEqual(['training[0] er ugyldig', 'lastExport er ugyldig']);
    expect(bad.saved.training).toEqual([]);
    expect('lastExport' in bad.saved).toBe(false);
    expect(readFbSaved(defaultFbSaved()).problems).toEqual([]);
  });

  it('minder om eksport, når den seneste eksport eller den første aktivitet er 30 dage gammel', () => {
    const session = { day: '2026-09-04', ms: 300_000, correct: 3, total: 4, xp: 30 };
    expect(exportDue(defaultFbSaved(), '2026-10-04')).toBe(false);
    expect(exportDue({ ...defaultFbSaved(), sessions: [session] }, '2026-10-03')).toBe(false);
    expect(exportDue({ ...defaultFbSaved(), sessions: [session] }, '2026-10-04')).toBe(true);
    expect(exportDue({ ...defaultFbSaved(), sessions: [session], lastExport: '2026-09-20' }, '2026-10-04')).toBe(false);
    expect(exportDue({ ...defaultFbSaved(), practice: [{ ...entry, day: '2026-09-01' }] }, '2026-10-01')).toBe(true);
  });

  it('beder om fast lagring og fortæller resultatet', async () => {
    let persisted = false;
    const manager = { persisted: async () => persisted, persist: async () => (persisted = true) };
    expect(await persistence(manager)).toBe('midlertidig');
    expect(await requestPersistence(manager)).toBe('fast');
    expect(await persistence(manager)).toBe('fast');
    expect(await requestPersistence({ persisted: async () => false, persist: async () => false })).toBe('midlertidig');
    expect(await requestPersistence({})).toBe('ukendt');
    const blocked = async (): Promise<boolean> => {
      throw new Error('spærret');
    };
    expect(await persistence({ persisted: blocked })).toBe('ukendt');
  });
});
