import { describe, expect, it } from 'vitest';
import type { Item } from '../engine/leitner';
import { STORAGE_KEY } from '../engine/storage';
import {
  defaultFbSaved,
  FB_BACKUP_KEY,
  FB_STORAGE_KEY,
  fbExportFileName,
  fbSummary,
  loadFbSaved,
  parseFbImport,
  readFbSaved,
  saveFbSaved,
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
