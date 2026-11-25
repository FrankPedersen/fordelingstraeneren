// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newItem, review, type Item } from '../../engine/leitner';
import { profil } from '../model/metoder';
import { defaultMsSaved, loadMsSaved, MS_BACKUP_KEY, MS_STORAGE_KEY, parseMsImport, readMsSaved, saveMsSaved, type MsSaved } from '../storage';
import { medUdspilPost, udspilPost } from '../training/findUdspil';
import { downloadMsExport } from '../ui/Indstillinger';

/*
 * Accepttest 8 i SPEC-modspil-v2.md, trin 3: `modspil:v1` med det nye felt overlever genindlæsning, eksport og import,
 * og data uden feltet læses som før. Afgrænsningen: `modspil:v1` får ét valgfrit felt til øvelse 8 – ingen ny nøgle og
 * ingen ændring af de eksisterende felter.
 *
 * Grænsefladen (`src/modspil/training/findUdspil.ts`): `udspilPost(saved)` giver øvelse 8's Leitner-post eller undefined,
 * og `medUdspilPost(saved, item)` giver gemte data med posten. Feltets navn og form er byggeriets; testen finder det som
 * det ene felt, `medUdspilPost` tilføjer. Som v1's valgfrie felter kontrolleres feltet kun, når det findes: er det
 * ugyldigt, noteres det i `problems`, en kopi gemmes under `modspil:v1:kopi`, og posten læses som manglende.
 */

type Lager = { getItem(key: string): string | null; setItem(key: string, value: string): void; data: Map<string, string> };
function lager(): Lager {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

/** En post med to svar: rigtigt og hurtigt, så forkert. */
function post(): Item {
  let item = newItem('2026-11-20');
  item = review(item, 'fast', '2026-11-20', { t: Date.UTC(2026, 10, 20, 12), ok: true, ms: 8_000 });
  item = review(item, 'wrong', '2026-11-22', { t: Date.UTC(2026, 10, 22, 12), ok: false, ms: 21_000 });
  return item;
}

/** Gyldige data fra v1 uden det nye felt, med alle v1's felter udfyldt. */
function v1Data(): MsSaved {
  return {
    ...defaultMsSaved(),
    profil: 'kompendiet',
    metoder: { ...profil('kompendiet').valg },
    level: 3,
    levelLog: [1, 1, 0, 1],
    items: { 'ovelse:regel11': newItem('2026-11-18'), 'ovelse:point': newItem('2026-11-19') },
    xp: 230,
    streak: { current: 2, best: 4, lastDay: '2026-11-24' },
    sessions: [{ day: '2026-11-24', ms: 240_000, correct: 3, total: 4, xp: 30, level: 3 }],
    answers: [{ day: '2026-11-24', ovelse: 'regel11', level: 3, score: 1, ms: 9_000 }],
    lastExport: '2026-11-01',
  };
}

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('Lagringen med øvelse 8 (accepttest 8, trin 3)', () => {
  it('data uden feltet læses som før: ingen problemer, de samme data og ingen post til øvelse 8', () => {
    const v1 = v1Data();
    const { saved, problems } = readMsSaved(JSON.parse(JSON.stringify(v1)));
    expect(problems).toEqual([]);
    expect(saved).toEqual(v1);
    expect(udspilPost(saved)).toBeUndefined();
    expect(udspilPost(defaultMsSaved())).toBeUndefined();
  });

  it('posten står i ét nyt valgfrit felt; nøglen og de eksisterende felter er uændrede', () => {
    const v1 = v1Data();
    const med = medUdspilPost(v1, post());
    const nye = Object.keys(med).filter((k) => !(k in v1));
    expect(nye, 'ét nyt felt').toHaveLength(1);
    for (const k of Object.keys(v1) as (keyof MsSaved)[]) expect(med[k], `feltet ${k} er uændret`).toEqual(v1[k]);
    expect(udspilPost(med)).toEqual(post());
  });

  it('posten overlever genindlæsning: gem, læs igen og gem igen giver de samme data uden kopi', () => {
    const l = lager();
    const med = medUdspilPost(v1Data(), post());
    expect(saveMsSaved(l, med)).toBe(true);
    const igen = loadMsSaved(l);
    expect(l.data.has(MS_BACKUP_KEY), 'ingen kopi af ulæselige data').toBe(false);
    expect(igen).toEqual(med);
    expect(udspilPost(igen)).toEqual(post());
    expect([...l.data.keys()]).toEqual([MS_STORAGE_KEY]);
  });

  it('posten overlever eksport og import: filen fra Indstillinger importeres med posten', async () => {
    const med = medUdspilPost(v1Data(), post());
    let blob: Blob | undefined;
    vi.spyOn(URL, 'createObjectURL').mockImplementation((b) => {
      blob = b as Blob;
      return 'blob:modspil';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadMsExport(med, Date.UTC(2026, 10, 25, 12));
    expect(blob, 'eksporten laver en fil').toBeDefined();
    const tekst = await blob!.text();
    const importeret = parseMsImport(tekst);
    expect(importeret.ok).toBe(true);
    if (!importeret.ok) return;
    expect(importeret.saved).toEqual(med);
    expect(udspilPost(importeret.saved)).toEqual(post());
  });

  it('et ugyldigt felt noteres i problems, en kopi gemmes, og posten læses som manglende; resten er uændret', () => {
    const v1 = v1Data();
    const med = medUdspilPost(v1, post());
    const [felt] = Object.keys(med).filter((k) => !(k in v1));
    for (const ugyldig of ['kasse 7', { box: 9, due: 'i morgen', support: 3, log: [] }, 42]) {
      const raa = { ...v1, [felt]: ugyldig };
      const { saved, problems } = readMsSaved(JSON.parse(JSON.stringify(raa)));
      expect(problems.length, `${JSON.stringify(ugyldig)}: problemet noteres`).toBeGreaterThan(0);
      expect(problems.some((p) => p.includes(felt)), `${JSON.stringify(ugyldig)}: ${problems.join('; ')}`).toBe(true);
      expect(udspilPost(saved)).toBeUndefined();
      const { [felt]: _vaek, ...resten } = saved as unknown as Record<string, unknown>;
      void _vaek;
      expect(resten).toEqual(v1);
      const l = lager();
      l.setItem(MS_STORAGE_KEY, JSON.stringify(raa));
      loadMsSaved(l);
      expect(l.data.get(MS_BACKUP_KEY), 'kopien af de gemte data').toBe(JSON.stringify(raa));
    }
  });

  it('en import med et ugyldigt felt afvises som ugyldig', () => {
    const v1 = v1Data();
    const [felt] = Object.keys(medUdspilPost(v1, post())).filter((k) => !(k in v1));
    const r = parseMsImport(JSON.stringify({ ...v1, [felt]: 'kasse 7' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('invalid');
  });
});
