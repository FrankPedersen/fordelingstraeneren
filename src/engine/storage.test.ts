import { describe, expect, it } from 'vitest';
import {
  BACKUP_KEY,
  STORAGE_KEY,
  defaultSaved,
  exportFileName,
  loadSaved,
  parseImport,
  saveSaved,
  summarize,
  type Saved,
} from './storage';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

function sample(): Saved {
  const saved = defaultSaved();
  saved.xp = 1240;
  saved.items['4-4-3-2:compare'] = {
    box: 3,
    due: '2026-10-05',
    support: 1,
    log: [{ t: 1_790_000_000_000, ok: true, ms: 1800, sure: true }],
  };
  saved.streak = { current: 5, best: 12, lastDay: '2026-10-01', jokerWeek: '2026-W40' };
  saved.sessions.push({ day: '2026-10-01', ms: 301_000, correct: 18, total: 22, cpm: 14 });
  return saved;
}

describe('Lagring', () => {
  it('starter med standarddata, når intet er gemt', () => {
    const saved = loadSaved(memoryStorage());
    expect(saved).toEqual(defaultSaved());
    expect(saved.settings.fastMs).toMatchObject({ compare: 3000, rank: 3000, complete: 10_000 });
  });

  it('gemmer og læser hele tilstanden under nøglen fordelingstraener:v1', () => {
    const storage = memoryStorage();
    saveSaved(storage, sample());
    expect([...storage.data.keys()]).toEqual(['fordelingstraener:v1']);
    expect(STORAGE_KEY).toBe('fordelingstraener:v1');
    expect(loadSaved(storage)).toEqual(sample());
  });

  it('bevarer ukendte felter', () => {
    const raw = {
      ...sample(),
      future: { a: 1 },
      settings: { ...sample().settings, theme: 'mørk' },
      items: { '4-4-3-2:compare': { ...sample().items['4-4-3-2:compare'], note: 'x' } },
    };
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(raw) });
    const loaded = loadSaved(storage);
    saveSaved(storage, loaded);
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!)).toEqual(raw);
  });

  it('springer ugyldige dele over og gemmer en kopi af det oprindelige', () => {
    const raw = JSON.stringify({ ...sample(), items: { 'x:compare': { box: 9 } }, xp: 'mange' });
    const storage = memoryStorage({ [STORAGE_KEY]: raw });
    const loaded = loadSaved(storage);
    expect(loaded.items).toEqual({});
    expect(loaded.xp).toBe(0);
    expect(loaded.streak).toEqual(sample().streak);
    expect(storage.data.get(BACKUP_KEY)).toBe(raw);
  });

  it('læser visningstiden for Lynaflæsning, når den findes', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ ...sample(), readMs: 2187 }) });
    expect(loadSaved(storage).readMs).toBe(2187);
    const bad = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ ...sample(), readMs: 50 }) });
    expect(loadSaved(bad).readMs).toBeUndefined();
  });

  it('kasserer ikke data, der ikke kan læses', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{ikke json' });
    expect(loadSaved(storage)).toEqual(defaultSaved());
    expect(storage.data.get(BACKUP_KEY)).toBe('{ikke json');
  });
});

describe('Import', () => {
  it('godkender en eksporteret fil og giver et resumé', () => {
    const result = parseImport(JSON.stringify(sample(), null, 2));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.saved).toEqual(sample());
    expect(summarize(result.saved)).toEqual({
      xp: 1240,
      streak: 5,
      best: 12,
      items: 1,
      sessions: 1,
      lastDay: '2026-10-01',
    });
  });

  it('afviser filer, der ikke er gyldige', () => {
    expect(parseImport('{ikke json')).toEqual({ ok: false, error: 'Filen er ikke gyldig JSON.' });
    expect(parseImport('{"navn": "noget andet"}')).toMatchObject({ ok: false });
    expect(parseImport(JSON.stringify({ ...sample(), version: 2 }))).toEqual({
      ok: false,
      error: 'Filen er fra en nyere version af appen.',
    });
    const badItem = { ...sample(), items: { '4-4-3-2:compare': { box: 7, due: 'i går' } } };
    const result = parseImport(JSON.stringify(badItem));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('4-4-3-2:compare');
  });

  it('navngiver eksportfilen efter dagen', () => {
    expect(exportFileName('2026-10-02')).toBe('fordelingstraener-2026-10-02.json');
  });
});
