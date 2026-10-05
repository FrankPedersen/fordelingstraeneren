import { describe, expect, it } from 'vitest';
import { newItem } from '../engine/leitner';
import {
  defaultPrSaved,
  loadPrSaved,
  parsePrImport,
  PR_BACKUP_KEY,
  PR_STORAGE_KEY,
  readPrSaved,
  savePrSaved,
  type PrSaved,
} from './storage';

const sources = import.meta.glob<string>('./**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true });

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

function example(): PrSaved {
  return {
    ...defaultPrSaved(),
    level: 3,
    levelLog: [1, 0.5, 0],
    accuracy: { sum: [1, 1, 0], running: [0.5] },
    runningMs: 1620,
    items: { 'blok:EK': newItem('2026-10-05'), 'interval:opening-1NT': newItem('2026-10-05') },
    xp: 230,
    sessions: [{ day: '2026-10-05', ms: 290_000, correct: 14.5, total: 17, xp: 145, level: 3, boss: false }],
    lastExport: '2026-10-05',
  };
}

describe('Lagring under pointregnskab:v1', () => {
  it('gemmer og indlæser uden tab', () => {
    const storage = memoryStorage();
    expect(savePrSaved(storage, example())).toBe(true);
    expect([...storage.data.keys()]).toEqual([PR_STORAGE_KEY]);
    expect(loadPrSaved(storage)).toEqual(example());
    expect(readPrSaved(JSON.parse(JSON.stringify(defaultPrSaved())))).toEqual({ saved: defaultPrSaved(), problems: [] });
  });

  it('uden data starter brugeren fra standardværdierne', () => {
    const saved = loadPrSaved(memoryStorage());
    expect(saved).toEqual(defaultPrSaved());
    expect(saved).toMatchObject({ level: 1, runningMs: 2000, xp: 0 });
  });

  it('ukendte felter bevares, og ugyldige dele erstattes og kopieres først til en sikkerhedskopi', () => {
    const raw = { ...example(), fremtid: { a: 1 }, level: 9, runningMs: 100, accuracy: { sum: [1], ukendt: [1] } };
    const text = JSON.stringify(raw);
    const storage = memoryStorage({ [PR_STORAGE_KEY]: text });
    const saved = loadPrSaved(storage) as PrSaved & { fremtid?: unknown };
    expect(saved.fremtid).toEqual({ a: 1 });
    expect(saved.level).toBe(1);
    expect(saved.runningMs).toBe(2000);
    expect(saved.accuracy).toEqual({ sum: [1] });
    expect(saved.items).toEqual(example().items);
    expect(storage.data.get(PR_BACKUP_KEY)).toBe(text);
  });

  it('ulæselig JSON kopieres og giver standardværdierne', () => {
    const storage = memoryStorage({ [PR_STORAGE_KEY]: '{ikke json' });
    expect(loadPrSaved(storage)).toEqual(defaultPrSaved());
    expect(storage.data.get(PR_BACKUP_KEY)).toBe('{ikke json');
  });

  it('import: gyldig fil, ugyldig JSON, en anden app, en nyere version og ugyldigt indhold', () => {
    expect(parsePrImport(JSON.stringify(example()))).toEqual({ ok: true, saved: example() });
    expect(parsePrImport('x')).toEqual({ ok: false, error: 'json' });
    expect(parsePrImport(JSON.stringify({ version: 1, palace: {}, ownLines: [] }))).toEqual({ ok: false, error: 'not-pointregnskab' });
    expect(parsePrImport(JSON.stringify({ ...example(), version: 2 }))).toEqual({ ok: false, error: 'newer' });
    const invalid = parsePrImport(JSON.stringify({ ...example(), xp: -5 }));
    expect(invalid).toMatchObject({ ok: false, error: 'invalid' });
  });

  it('Pointregnskabet bruger kun sin egen nøgle og læser ikke sproget fra fordelingssporet', () => {
    const files = Object.entries(sources).filter(([file]) => !file.endsWith('.test.ts'));
    expect(files.length).toBeGreaterThan(5);
    for (const [file, source] of files) {
      expect(source, file).not.toMatch(/fordelingstraener:v1|farvebehandling:v1/);
      expect(source, file).not.toMatch(/localStorage/);
    }
  });
});
