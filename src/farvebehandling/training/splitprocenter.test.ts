import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../engine/rng';
import type { BankItem } from '../analysis';
import { layoutChance, splitChance } from '../model/layouts';
import { defaultFbSaved, parseFbImport, readFbSaved, TASK_TYPES, type FbSaved, type PracticeEntry } from '../storage';
import { TEST_BANK as bank } from '../testBank';
import { introduce } from './progression';
import { answerFb, finishFbSession, introduceFb, nextFbStep, startFbSession, type FbPhase } from './session';
import { taskStats } from './stats';
import { makeSplitTask, SPLIT_CARDS, SPLIT_COUNTS, splitRows, type FbAnswer, type FbTask, type SplitLevel, type SplitQuestion } from './tasks';

/**
 * Accepttest for Splitprocenter (SPEC-splitprocenter.md, Accepttest 1–4), skrevet før byggeriet.
 *
 * Grænsefladen, byggeriet skal give (kan ligge i en ny fil, men eksporteres fra `training/tasks.ts`):
 *
 * - `SPLIT_COUNTS: readonly number[]` = [2, 3, 4, 5, 6, 7, 8] (kort ude).
 * - `splitRows(n): SplitRow[]` med `SplitRow = { label: string; longer: number; chance: number }`: alle sidninger for
 *   n kort ude, hyppigste først som i specens tabel. `label` er fx "3-2", `longer` den længste side og `chance`
 *   andelen 0–1 regnet af `splitChance(n, longer)` (a priori).
 * - `SPLIT_CARDS: readonly string[]`: Leitner-bunkens 23 kort, ét pr. sidning med nøglen `split:<n>:<label>`, fx
 *   "split:5:3-2", i rækkefølgen antal og så hyppighed.
 * - `type SplitLevel = 1 | 2 | 3 | 4` og `makeSplitTask(level, rng, n?): SplitQuestion`. Samme seed giver samme
 *   opgave. Med `n` stilles opgaven med netop så mange kort ude (niveau 3 kræver 4–8).
 * - `SplitQuestion = { level; n; splits: string[]; honor?: 'E' | 'K' | 'D' | 'B'; seat?: 'W' | 'E'; value: number;
 *   card: string; options: SplitOption[] }`:
 *   - `splits`: niveau 1 den ene sidning, niveau 3 de to, der lægges sammen;
 *   - `honor` og `seat` (niveau 4): honnøren, der sidder alene, og modspilleren (Vest eller Øst);
 *   - `value`: det rigtige tal (0–1): niveau 1 sidningen, niveau 2 den hyppigste, niveau 3 summen og niveau 4
 *     honnøren alene hos modspilleren;
 *   - `card`: kortet i bunken, opgaven hører til (et af `SPLIT_CARDS` med samme n).
 * - `SplitOption = { value?: number; label?: string; correct: boolean; from?: { n: number; label: string } }`:
 *   niveau 1, 3 og 4 har `value` (0–1, knappen viser hele procent), niveau 2 har `label` (sidningen). Niveau 1 har
 *   `from`: antallet og sidningen, tallet kommer fra.
 * - `FbTask` får varianten `TaskBase & { type: 'splitprocenter'; split: SplitQuestion }`: `item` er `split.card`,
 *   og `bank` og `goal` er kombinationen, opgaven stilles ved. `TaskType` og `TASK_TYPES` får 'splitprocenter'.
 * - `FbAnswer` får `choice?: number` (indekset i `split.options`); `grade` giver 1 for den rigtige og ellers 0.
 * - Sessionen (Afklaret: én opgave i blandingen): en almindelig session, hvor der var introduceret 4 kombinationer
 *   før sessionen, har præcis én Splitprocenter-opgave i repetitionen eller niveauet, ikke i lynrunden. Svaret logges
 *   i `training` som de andre typer, og et forkert svar flytter kortet i bunken, så det kommer igen næste dag.
 *
 * Facit regnes uafhængigt af `layouts.ts` med en optælling (`waysWestHolds`). Testen sammenligner også med
 * `splitChance` og, for niveau 4, med `layoutChance`, som specen kræver.
 */

/** Middag lokal tid den 5. oktober 2026. */
const T0 = new Date(2026, 9, 5, 12, 0).getTime();
const DAY = 24 * 3600_000;

/**
 * Metoden: de 26 kort, Vest og Øst har, gives ét ad gangen til Vest eller Øst, og n af dem er farvens. ways[w][k]
 * tæller måderne, Vest har fået w kort i alt og k af farvens. Til sidst har Vest 13, så ways[13][k] er antallet af
 * fordelinger, hvor Vest har netop k af farvens n kort (C(n, k) · C(26 − n, 13 − k), men regnet ved optælling).
 */
function waysWestHolds(n: number): bigint[] {
  let ways = Array.from({ length: 14 }, () => Array<bigint>(n + 1).fill(0n));
  ways[0][0] = 1n;
  for (let card = 0; card < 26; card++) {
    const suit = card < n ? 1 : 0;
    const next = Array.from({ length: 14 }, () => Array<bigint>(n + 1).fill(0n));
    for (let w = 0; w <= 13; w++) {
      for (let k = 0; k <= n; k++) {
        if (!ways[w][k]) continue;
        next[w][k] += ways[w][k]; // kortet går til Øst
        if (w < 13) next[w + 1][k + suit] += ways[w][k]; // kortet går til Vest
      }
    }
    ways = next;
  }
  return ways[13];
}

interface Facit {
  label: string;
  longer: number;
  num: bigint;
  den: bigint;
  value: number;
}

/** Facit for n kort ude: hver sidning uanset retning (3-2 = Vest 3 eller Vest 2), hyppigste først. */
function facitRows(n: number): Facit[] {
  const ways = waysWestHolds(n);
  const den = ways.reduce((a, b) => a + b, 0n);
  const rows: Facit[] = [];
  for (let longer = Math.ceil(n / 2); longer <= n; longer++) {
    const num = longer * 2 === n ? ways[longer] : ways[longer] + ways[n - longer];
    rows.push({ label: `${longer}-${n - longer}`, longer, num, den, value: Number(num) / Number(den) });
  }
  return rows.sort((a, b) => b.value - a.value);
}

const facitOf = (n: number, label: string) => facitRows(n).find((r) => r.label === label)!;

/** Én bestemt honnør alene hos én bestemt modspiller: Vest har netop den af farvens n kort. */
function singletonFacit(n: number): number {
  const ways = waysWestHolds(n);
  const den = ways.reduce((a, b) => a + b, 0n);
  return Number(ways[1]) / Number(den) / n;
}

const whole = (value: number) => Math.round(100 * value);
const LEVELS: readonly SplitLevel[] = [1, 2, 3, 4];
const SEEDS = Array.from({ length: 60 }, (_, i) => i + 1);
const tasks = (level: SplitLevel) => SEEDS.map((seed) => makeSplitTask(level, mulberry32(seed)));

describe('1. Tallene', () => {
  it('har 23 sidninger for 2–8 kort ude, hyppigste først, og hver er lig med splitChance og med optællingen', () => {
    expect([...SPLIT_COUNTS]).toEqual([2, 3, 4, 5, 6, 7, 8]);
    let count = 0;
    for (const n of SPLIT_COUNTS) {
      const rows = splitRows(n);
      const facit = facitRows(n);
      expect(rows.map((r) => r.label), `${n} kort`).toEqual(facit.map((f) => f.label));
      rows.forEach((row, i) => {
        const f = splitChance(n, row.longer);
        expect(row.longer).toBe(facit[i].longer);
        // splitChance er lig med optællingen, eksakt.
        expect(f.num * facit[i].den, `${n} kort ${row.label}`).toBe(facit[i].num * f.den);
        expect(row.chance, `${n} kort ${row.label}`).toBeCloseTo(Number(f.num) / Number(f.den), 12);
      });
      count += rows.length;
    }
    expect(count).toBe(23);
  });

  it('summen for hvert antal kort er 100 %', () => {
    for (const n of SPLIT_COUNTS) {
      expect(splitRows(n).reduce((s, r) => s + r.chance, 0), `${n} kort`).toBeCloseTo(1, 12);
      // Eksakt: tællerne summer til nævneren (alle har nævneren C(26, 13)).
      const fractions = splitRows(n).map((r) => splitChance(n, r.longer));
      expect(fractions.reduce((s, f) => s + f.num, 0n)).toBe(fractions[0].den);
      const facit = facitRows(n);
      expect(facit.reduce((s, f) => s + f.num, 0n)).toBe(facit[0].den);
    }
  });

  it('Leitner-bunken har ét kort pr. sidning, 23 i alt', () => {
    expect([...SPLIT_CARDS]).toEqual(SPLIT_COUNTS.flatMap((n) => facitRows(n).map((f) => `split:${n}:${f.label}`)));
    expect(new Set(SPLIT_CARDS).size).toBe(23);
  });
});

describe('2. Opgaverne', () => {
  it('niveau 1–4 genereres fra et seed og kan genskabes', () => {
    for (const level of LEVELS) {
      for (const seed of SEEDS) {
        const q = makeSplitTask(level, mulberry32(seed));
        expect(makeSplitTask(level, mulberry32(seed)), `niveau ${level}, seed ${seed}`).toEqual(q);
        expect(q.level).toBe(level);
        expect(SPLIT_COUNTS).toContain(q.n);
        expect(SPLIT_CARDS).toContain(q.card);
        expect(q.card.startsWith(`split:${q.n}:`), q.card).toBe(true);
      }
      // Seedet bestemmer opgaven: forskellige seeds giver forskellige opgaver.
      expect(new Set(tasks(level).map((q) => JSON.stringify(q))).size, `niveau ${level}`).toBeGreaterThan(1);
    }
  });

  it('præcis én knap er rigtig, og niveau 1, 3 og 4 har 4 procenter, hvor de forkerte er mindst 5 procentpoint fra det rigtige', () => {
    for (const level of LEVELS) {
      for (const q of tasks(level)) {
        const where = `niveau ${level}: ${JSON.stringify(q)}`;
        expect(q.options.filter((o) => o.correct), where).toHaveLength(1);
        if (level === 2) continue;
        expect(q.options, where).toHaveLength(4);
        const right = q.options.find((o) => o.correct)!;
        expect(right.value, where).toBeCloseTo(q.value, 12);
        // Knapperne viser hele procent: alle forskellige, og de forkerte mindst 5 procentpoint fra det rigtige.
        const shown = q.options.map((o) => whole(o.value!));
        expect(new Set(shown).size, where).toBe(4);
        for (const o of q.options.filter((x) => !x.correct)) expect(Math.abs(whole(o.value!) - whole(q.value)), where).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it('niveau 1: den hyppigste eller næsthyppigste sidning; de forkerte er andre sidningers tal for samme antal og et nabo-antal', () => {
    const ranks = new Set<number>();
    for (const q of tasks(1)) {
      const where = JSON.stringify(q);
      const facit = facitRows(q.n);
      expect(q.splits, where).toHaveLength(1);
      const [label] = q.splits;
      expect(facit.slice(0, 2).map((f) => f.label), where).toContain(label);
      expect(q.value, where).toBeCloseTo(facitOf(q.n, label).value, 12);
      ranks.add(facit.findIndex((f) => f.label === label));
      const right = q.options.find((o) => o.correct)!;
      expect(right.from, where).toEqual({ n: q.n, label });
      // Hvert forkert tal er en rigtig sidnings tal: antallet og sidningen, det kommer fra.
      const wrong = q.options.filter((o) => !o.correct);
      for (const o of wrong) {
        expect(SPLIT_COUNTS, where).toContain(o.from!.n);
        expect(o.value, where).toBeCloseTo(facitOf(o.from!.n, o.from!.label).value, 12);
      }
      // Så mange fra samme antal, som der er plads til (to), og mindst ét fra et nabo-antal (n ± 1).
      const usable = facit.filter((f) => f.label !== label && Math.abs(whole(f.value) - whole(q.value)) >= 5).length;
      expect(wrong.filter((o) => o.from!.n === q.n).length, where).toBe(Math.min(2, usable));
      expect(wrong.some((o) => Math.abs(o.from!.n - q.n) === 1), where).toBe(true);
    }
    // Både den hyppigste og den næsthyppigste bliver spurgt.
    expect([...ranks].sort()).toEqual([0, 1]);
  });

  it('niveau 2: knapperne er sidningerne for antallet (en anden sidning er forkert), og den hyppigste er rigtig', () => {
    for (const q of tasks(2)) {
      const where = JSON.stringify(q);
      const facit = facitRows(q.n);
      expect(q.options.map((o) => o.label).sort(), where).toEqual(facit.map((f) => f.label).sort());
      expect(q.options.find((o) => o.correct)!.label, where).toBe(facit[0].label);
      expect(q.value, where).toBeCloseTo(facit[0].value, 12);
    }
  });

  it('niveau 3: to sidninger for samme antal lagt sammen, med 4–8 kort ude', () => {
    for (const q of tasks(3)) {
      const where = JSON.stringify(q);
      expect(q.n, where).toBeGreaterThanOrEqual(4);
      expect(q.splits, where).toHaveLength(2);
      expect(new Set(q.splits).size, where).toBe(2);
      const [a, b] = q.splits.map((label) => facitOf(q.n, label));
      expect(a && b, where).toBeTruthy();
      expect(q.value, where).toBeCloseTo(Number(a.num + b.num) / Number(a.den), 12);
    }
  });

  it('stiller en opgave med et bestemt antal kort ude', () => {
    for (const level of LEVELS) {
      for (const n of level === 3 ? [4, 5, 6, 7, 8] : SPLIT_COUNTS) {
        const q = makeSplitTask(level, mulberry32(n), n);
        expect(q.n, `niveau ${level}, ${n} kort`).toBe(n);
        expect(q.level).toBe(level);
      }
    }
  });
});

describe('3. Niveau 4: en bestemt honnør alene', () => {
  it('kongen alene med 4 kort ude hos én bestemt modspiller er 6,2 % (3-1 delt på 4 kort og 2 hænder), regnet af layoutChance', () => {
    const one = layoutChance(4, 1);
    const expected = Number(one.num) / Number(one.den);
    expect((100 * expected).toFixed(1)).toBe('6.2');
    expect(expected).toBeCloseTo(singletonFacit(4), 12);
    // 3-1 delt på 4 kort og 2 hænder, eksakt.
    const split = splitChance(4, 3);
    expect(one.num * 8n * split.den).toBe(split.num * one.den);
    const king = SEEDS.map((seed) => makeSplitTask(4, mulberry32(seed), 4)).find((q) => q.honor === 'K');
    expect(king, 'ingen opgave med kongen alene').toBeDefined();
    const q = king as SplitQuestion;
    expect(q.n).toBe(4);
    expect(['W', 'E']).toContain(q.seat);
    expect(q.value).toBeCloseTo(expected, 12);
    expect(q.options.find((o) => o.correct)!.value).toBeCloseTo(expected, 12);
  });

  it('for alle antal er chancen layoutChance(n, 1), og honnøren og modspilleren skifter med seedet', () => {
    const honors = new Set<string>();
    const seats = new Set<string>();
    for (const q of tasks(4)) {
      const one = layoutChance(q.n, 1);
      expect(q.value, JSON.stringify(q)).toBeCloseTo(Number(one.num) / Number(one.den), 12);
      expect(q.value).toBeCloseTo(singletonFacit(q.n), 12);
      expect(['E', 'K', 'D', 'B']).toContain(q.honor);
      honors.add(q.honor!);
      seats.add(q.seat!);
    }
    expect(honors.size).toBeGreaterThan(1);
    expect([...seats].sort()).toEqual(['E', 'W']);
  });
});

function introduceAll(saved: FbSaved, items: BankItem[], day: string): FbSaved {
  return items.reduce((s, item) => introduce(s, item, day), saved);
}

/**
 * Kører en hel session med 5 s pr. opgave. Splitprocenter besvares rigtigt eller forkert; de andre opgaver besvares
 * med et tomt svar (forkert), så kun Splitprocenter afgør noget her.
 */
function runSession(saved: FbSaved, start: number, seed: number, split: 'rigtigt' | 'forkert') {
  let s = startFbSession(saved, bank, start, seed);
  const splits: { phase: FbPhase; task: FbTask & { type: 'splitprocenter' } }[] = [];
  const scores: number[] = [];
  let t = start;
  for (let i = 0; i < 400; i++) {
    s = nextFbStep(s, saved, bank, t);
    const step = s.step!;
    if (step.kind === 'status') return { saved: finishFbSession(s, saved, t), splits, scores };
    if (step.kind === 'intro') {
      ({ session: s, saved } = introduceFb(s, saved, bank, step.combination, t));
      continue;
    }
    let answer: Omit<FbAnswer, 'ms'> = {};
    const task = step.task;
    if (task.type === 'splitprocenter') {
      splits.push({ phase: step.phase, task });
      const right = task.split.options.findIndex((o) => o.correct);
      answer = { choice: split === 'rigtigt' ? right : (right + 1) % task.split.options.length };
    }
    const result = answerFb(s, saved, answer, t + 3000);
    if (task.type === 'splitprocenter') scores.push(result.feedback.graded.score);
    ({ session: s, saved } = result);
    t += 5000;
  }
  throw new Error('Sessionen sluttede ikke');
}

describe('4. Sessionen, lagringen og statistikken', () => {
  it('typen gemmes i TaskType, og gamle data uden typen indlæses uændret', () => {
    expect(TASK_TYPES).toContain('splitprocenter');
    const entry: PracticeEntry = { day: '2026-10-05', item: 'split:5:3-2', task: 'splitprocenter', score: 1, ms: 4000 };
    const withSplit = { ...defaultFbSaved(), practice: [entry], training: [entry] };
    const read = readFbSaved(JSON.parse(JSON.stringify(withSplit)));
    expect(read.problems).toEqual([]);
    expect(read.saved.practice).toEqual([entry]);
    expect(read.saved.training).toEqual([entry]);
    expect(parseFbImport(JSON.stringify(withSplit)).ok).toBe(true);

    // Gamle data: emner, palads, svar af de gamle typer, valgfrie felter og et ukendt felt.
    const old: FbSaved & { ukendt: unknown } = {
      ...introduceAll(defaultFbSaved(), bank.slice(0, 3), '2026-10-01'),
      practice: [{ day: '2026-10-02', item: `${bank[0].combination.id}:${bank[0].combination.goals[0]}`, task: 'vælg-linjen', score: 0.5, ms: 9000 }],
      training: [{ day: '2026-10-03', item: `${bank[1].combination.id}:${bank[1].combination.goals[0]}`, task: 'hold-eller-par', score: 1, ms: 7000 }],
      lastExport: '2026-10-03',
      streak: { current: 3, best: 5, lastDay: '2026-10-03' },
      xp: 120,
      sessions: [{ day: '2026-10-03', ms: 300_000, correct: 4.5, total: 6, xp: 40 }],
      ukendt: { bevares: true },
    };
    const again = readFbSaved(JSON.parse(JSON.stringify(old)));
    expect(again.problems).toEqual([]);
    expect(again.saved).toEqual(old);
  });

  it('en session har én Splitprocenter-opgave i blandingen, den logges til statistikken, og et forkert svar kommer igen næste dag', () => {
    const start = introduceAll(defaultFbSaved(), bank.slice(0, 4), '2026-10-04');
    const day1 = runSession(start, T0, 21, 'forkert');
    expect(day1.splits).toHaveLength(1);
    const [first] = day1.splits;
    expect(first.phase).not.toBe('lynrunde');
    expect(first.task.item).toBe(first.task.split.card);
    expect(SPLIT_CARDS).toContain(first.task.item);
    expect(day1.scores).toEqual([0]);
    expect(day1.saved.training!.filter((e) => e.task === 'splitprocenter')).toEqual([
      { day: '2026-10-05', item: first.task.item, task: 'splitprocenter', score: 0, ms: 3000 },
    ]);
    const row = taskStats(day1.saved, '2026-10-05').find((r) => r.key === 'splitprocenter');
    expect(row?.all).toEqual({ answers: 1, score: 0 });

    // Leitner-bunken: kortet, der blev svaret forkert på, kommer igen næste dag.
    const day2 = runSession(day1.saved, T0 + DAY, 22, 'rigtigt');
    expect(day2.splits).toHaveLength(1);
    expect(day2.splits[0].task.item).toBe(first.task.item);
    expect(day2.scores).toEqual([1]);
    const row2 = taskStats(day2.saved, '2026-10-06').find((r) => r.key === 'splitprocenter');
    expect(row2?.all).toEqual({ answers: 2, score: 1 });
  });
});
