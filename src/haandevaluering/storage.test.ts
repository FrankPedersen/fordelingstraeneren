import { describe, expect, it, vi } from 'vitest';
import { newItem } from '../engine/leitner';
import {
  defaultHeSaved,
  HE_BACKUP_KEY,
  HE_STORAGE_KEY,
  heExportDue,
  heExportFileName,
  loadHeSaved,
  parseHeImport,
  readHeSaved,
  saveHeSaved,
  type HeSaved,
} from './storage';

function memory(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

const full = (): HeSaved => ({
  ...defaultHeSaved(),
  level: 3,
  levelLog: [1, 0, 1],
  accuracy: { honors: [1, 1, 0], decision: [1] },
  items: { 'anker:game': newItem('2026-10-08'), 'moenster:5-4-3-1': newItem('2026-10-09') },
  xp: 120,
  streak: { current: 2, best: 5, lastDay: '2026-10-08', jokerWeek: '2026-W41' },
  sessions: [{ day: '2026-10-08', ms: 300_000, correct: 12, total: 15, xp: 120, level: 3 }],
  answers: [{ day: '2026-10-08', exercise: 'decision', level: 3, score: 1, ms: 9000, seed: 4_000_000_000, phase: 'level' }],
  lastExport: '2026-10-01',
});

describe('Skemaet haandevaluering:v1', () => {
  it('gemmer og indlæser uden tab, og andre nøgler i localStorage er uændrede', () => {
    const others = {
      'fordelingstraener:v1': '{"version":3}',
      'farvebehandling:v1': '{"version":1}',
      'pointregnskab:v1': '{"version":1}',
    };
    const storage = memory(others);
    expect(loadHeSaved(storage)).toEqual(defaultHeSaved());
    expect(saveHeSaved(storage, full())).toBe(true);
    expect(loadHeSaved(storage)).toEqual(full());
    for (const [key, value] of Object.entries(others)) expect(storage.data.get(key)).toBe(value);
    expect([...storage.data.keys()].sort()).toEqual([...Object.keys(others), HE_STORAGE_KEY].sort());
  });

  it('de valgfrie felter kan mangle; ukendte felter bevares', () => {
    const { answers: _a, lastExport: _l, ...rest } = full();
    const { saved, problems } = readHeSaved({ ...rest, future: 1 });
    expect(problems).toEqual([]);
    expect(saved.answers).toBeUndefined();
    expect((saved as unknown as { future: number }).future).toBe(1);
  });

  it('ugyldige dele erstattes og noteres, og de gemte data kopieres, før noget overskrives', () => {
    const bad = { ...full(), level: 9, items: { ok: newItem('2026-10-08'), bad: { box: 7 } }, accuracy: { ukendt: [1] } };
    const { saved, problems } = readHeSaved(bad);
    expect(saved.level).toBe(1);
    expect(Object.keys(saved.items)).toEqual(['ok']);
    expect(problems).toEqual(['accuracy["ukendt"] er ugyldig', 'level er ugyldig', 'items["bad"] er ugyldig']);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const storage = memory({ [HE_STORAGE_KEY]: JSON.stringify(bad) });
    loadHeSaved(storage);
    expect(storage.data.get(HE_BACKUP_KEY)).toBe(JSON.stringify(bad));
    const broken = memory({ [HE_STORAGE_KEY]: '{ikke json' });
    expect(loadHeSaved(broken)).toEqual(defaultHeSaved());
    expect(broken.data.get(HE_BACKUP_KEY)).toBe('{ikke json');
    warn.mockRestore();
  });

  it('svarloggen kræver øvelse, score 0 eller 1, seed og fase', () => {
    const entry = full().answers![0];
    for (const broken of [{ ...entry, score: 0.5 }, { ...entry, seed: -1 }, { ...entry, phase: 'warmup' }, { ...entry, exercise: 'sum' }]) {
      expect(readHeSaved({ ...full(), answers: [broken] }).problems).toEqual(['answers[0] er ugyldig']);
    }
  });

  it('import: fejl ved ugyldig JSON, andre data, nyere version og ugyldige felter', () => {
    expect(parseHeImport('{')).toEqual({ ok: false, error: 'json' });
    expect(parseHeImport('{"version":1}')).toEqual({ ok: false, error: 'not-haandevaluering' });
    expect(parseHeImport(JSON.stringify({ ...full(), version: 2 }))).toEqual({ ok: false, error: 'newer' });
    expect(parseHeImport(JSON.stringify({ ...full(), xp: -5 }))).toMatchObject({ ok: false, error: 'invalid' });
    expect(parseHeImport(JSON.stringify(full()))).toEqual({ ok: true, saved: full() });
    expect(heExportFileName('2026-10-08')).toBe('haandevaluering-2026-10-08.json');
  });

  it('påmindelsen om eksport efter 30 dage, kun når der er en session at miste', () => {
    expect(heExportDue(defaultHeSaved(), '2026-12-01')).toBe(false);
    const { lastExport: _l, ...saved } = full();
    expect(heExportDue(saved, '2026-11-06')).toBe(false);
    expect(heExportDue(saved, '2026-11-07')).toBe(true);
    expect(heExportDue(full(), '2026-10-31')).toBe(true);
  });
});
