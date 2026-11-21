// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../app/App';
import { mulberry32 } from '../../engine/rng';
import { setLang } from '../../i18n';
import { defaultFbSaved, FB_STORAGE_KEY, type FbSaved } from '../storage';
import { TEST_BANK } from '../testBank';
import { grade, makeSplitTask, SPLIT_CARDS, type FbTask, type SplitLevel, type SplitQuestion } from '../training/tasks';
import { Facit } from './Facit';
import { Opgave } from './Opgave';

/**
 * Accepttest for Splitprocenter i brugerfladen (SPEC-splitprocenter.md, Accepttest 3, 4 og 5), skrevet før byggeriet.
 *
 * Grænsefladen, byggeriet skal give (funktionerne og typerne står i training/splitprocenter.test.ts):
 *
 * - Selvvalgt: et valg med navnet "Splitprocenter" (fx en knap eller "Splitprocenter (23)") og et ⓘ med navnet
 *   "Hjælp: Splitprocenter". Et tryk på valget, og på Start, hvis valget ikke starter selv, giver Splitprocenter-opgaver
 *   på alle fire niveauer; "Næste opgave" giver den næste. Svarene logges i `practice` med `task: 'splitprocenter'` og
 *   `item` = kortet i bunken, og intet andet i de gemte data ændres (dagsplanen røres ikke).
 * - `Opgave` med en Splitprocenter-opgave viser spørgsmålet som tekst og svarknapperne i samme rækkefølge som
 *   `split.options`: niveau 1, 3 og 4 har fire knapper med hele procent ("68 %"), niveau 2 en knap pr. sidning ("4-2").
 *   Et tryk på en knap svarer (eller vælger, og så svarer "Svar"/"Answer"); `onAnswer` får `{ choice: indeks }`.
 *   Opgavens ⓘ hedder "Hjælp: Splitprocenter" og på engelsk "Help: Split percentages".
 * - Spørgsmålene på dansk (niveau 1–3 som i specen, niveau 4 er et valg under Afklaret):
 *   1. "Modparten har 5 kort i farven. Hvor ofte sidder de 3-2?"
 *   2. "Hvilken sidning er den hyppigste med 6 kort ude?"
 *   3. "Hvor ofte sidder 6 kort 3-3 eller 4-2?"
 *   4. "Modparten har 4 kort i farven. Hvor ofte sidder kongen alene hos Vest?" (esset, kongen, damen, knægten;
 *      Vest eller Øst)
 * - `Facit` med en Splitprocenter-opgave: statusboksen (role="status") med "Rigtigt"/"Forkert" ("Right"/"Wrong"),
 *   det rigtige tal med én decimal ("67,8 %", på engelsk "67.8 %"), en tabel (role="table") med en række pr. sidning
 *   for antallet (sidningen og chancen med én decimal) og, på niveau 1 og 2, huskereglen:
 *   "Et ulige antal deler sig oftest så jævnt som muligt (3-2, 4-3). Et lige antal deler sig oftest ujævnt (4-2, 5-3),
 *   undtagen 2 kort." / "An odd number of cards most often splits as evenly as possible (3-2, 4-3). An even number
 *   most often splits unevenly (4-2, 5-3), except 2 cards."
 *   `place` er null for en Splitprocenter-opgave i testen.
 * - På engelsk står der intet dansk i opgaven og facit (samme ordliste som ui/i18n.test.tsx).
 *
 * Facit regnes uafhængigt med samme optælling som i training/splitprocenter.test.ts (`waysWestHolds`).
 */

// Faste seeds, så Selvvalgts opgaver er de samme hver gang.
const seeds = vi.hoisted(() => ({ next: 1 }));
vi.mock('../../engine/rng', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../engine/rng')>();
  return { ...actual, randomSeed: () => seeds.next++ };
});

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  localStorage.clear();
  window.scrollTo = vi.fn();
  seeds.next = 1;
});

afterEach(() => {
  cleanup();
  setLang('da');
});

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const stored = (): FbSaved => JSON.parse(localStorage.getItem(FB_STORAGE_KEY)!);
/** Sidens tekst med almindelige mellemrum. */
const pageText = () => (document.body.textContent ?? '').replace(/\s+/g, ' ');

/** Metoden: se training/splitprocenter.test.ts. ways[13][k] = fordelinger, hvor Vest har netop k af farvens n kort. */
function waysWestHolds(n: number): bigint[] {
  let ways = Array.from({ length: 14 }, () => Array<bigint>(n + 1).fill(0n));
  ways[0][0] = 1n;
  for (let card = 0; card < 26; card++) {
    const suit = card < n ? 1 : 0;
    const next = Array.from({ length: 14 }, () => Array<bigint>(n + 1).fill(0n));
    for (let w = 0; w <= 13; w++) {
      for (let k = 0; k <= n; k++) {
        if (!ways[w][k]) continue;
        next[w][k] += ways[w][k];
        if (w < 13) next[w + 1][k + suit] += ways[w][k];
      }
    }
    ways = next;
  }
  return ways[13];
}

interface Row {
  label: string;
  num: bigint;
  den: bigint;
}

/** Sidningerne for n kort ude, hyppigste først. */
function rowsFor(n: number): Row[] {
  const ways = waysWestHolds(n);
  const den = ways.reduce((a, b) => a + b, 0n);
  const rows: Row[] = [];
  for (let longer = Math.ceil(n / 2); longer <= n; longer++) {
    rows.push({ label: `${longer}-${n - longer}`, num: longer * 2 === n ? ways[longer] : ways[longer] + ways[n - longer], den });
  }
  return rows.sort((a, b) => (b.num > a.num ? 1 : b.num < a.num ? -1 : 0));
}

const share = (num: bigint, den: bigint) => Number(num) / Number(den);
const rowOf = (n: number, label: string) => rowsFor(n).find((r) => r.label === label)!;
/** Procent med én decimal som i facit. */
const oneDecimal = (value: number, lang: 'da' | 'en') => {
  const text = (100 * value).toFixed(1);
  return `${lang === 'da' ? text.replace('.', ',') : text} %`;
};

const RULE = {
  da: 'Et ulige antal deler sig oftest så jævnt som muligt (3-2, 4-3). Et lige antal deler sig oftest ujævnt (4-2, 5-3), undtagen 2 kort.',
  en: 'An odd number of cards most often splits as evenly as possible (3-2, 4-3). An even number most often splits unevenly (4-2, 5-3), except 2 cards.',
};

const QUESTION = {
  1: /Modparten har (\d) kort i farven\. Hvor ofte sidder de (\d-\d)\?/,
  2: /Hvilken sidning er den hyppigste med (\d) kort ude\?/,
  3: /Hvor ofte sidder (\d) kort (\d-\d) eller (\d-\d)\?/,
  4: /Modparten har (\d) kort i farven\. Hvor ofte sidder (esset|kongen|damen|knægten) alene hos (Vest|Øst)\?/,
} as const;

interface Asked {
  level: SplitLevel;
  n: number;
  /** Det rigtige tal (0–1). */
  value: number;
  /** Niveau 2: den rigtige sidning. */
  label?: string;
}

/** Spørgsmålet på skærmen, læst af teksten, med facit fra optællingen. */
function readQuestion(): Asked {
  const text = pageText();
  const found = ([1, 2, 3, 4] as const).flatMap((level) => {
    const m = text.match(QUESTION[level]);
    return m ? [{ level, m }] : [];
  });
  expect(found.length, `intet eller flere spørgsmål: ${text.slice(0, 400)}`).toBe(1);
  const [{ level, m }] = found;
  const n = Number(m[1]);
  switch (level) {
    case 1: {
      const r = rowOf(n, m[2]);
      return { level, n, value: share(r.num, r.den) };
    }
    case 2: {
      const [top] = rowsFor(n);
      return { level, n, value: share(top.num, top.den), label: top.label };
    }
    case 3: {
      const a = rowOf(n, m[2]);
      const b = rowOf(n, m[3]);
      return { level, n, value: share(a.num + b.num, a.den) };
    }
    case 4: {
      const ways = waysWestHolds(n);
      return { level, n, value: share(ways[1], ways.reduce((x, y) => x + y, 0n) * BigInt(n)) };
    }
  }
}

const percentButtons = () => screen.queryAllByRole('button', { name: /^\d+\s?%$/ });
const splitButtons = () => screen.queryAllByRole('button', { name: /^\d-\d$/ });

/** Svarer rigtigt eller forkert på opgaven på skærmen. */
function answerOnScreen(q: Asked, right: boolean) {
  if (q.level === 2) {
    const buttons = splitButtons();
    expect(buttons.map((b) => b.textContent!.trim()).sort()).toEqual(rowsFor(q.n).map((r) => r.label).sort());
    const target = right ? q.label : rowsFor(q.n).find((r) => r.label !== q.label)!.label;
    fireEvent.click(buttons.find((b) => b.textContent!.trim() === target)!);
  } else {
    const buttons = percentButtons();
    expect(buttons).toHaveLength(4);
    const wanted = Math.round(100 * q.value);
    const correct = buttons.filter((b) => parseInt(b.textContent!, 10) === wanted);
    expect(correct, `knappen med ${wanted} %`).toHaveLength(1);
    fireEvent.click(right ? correct[0] : buttons.find((b) => b !== correct[0])!);
  }
  const submit = screen.queryByRole('button', { name: /^(Svar|Answer)$/ });
  if (submit) fireEvent.click(submit);
}

/** Facit: tallet med én decimal, tabellen med alle sidninger for antallet og huskereglen på niveau 1 og 2. */
function expectFacit(q: Asked, lang: 'da' | 'en') {
  const text = pageText();
  expect(text).toContain(oneDecimal(q.value, lang));
  const tables = screen.getAllByRole('table');
  const complete = tables.find((table) => {
    const rows = within(table)
      .getAllByRole('row')
      .map((r) => (r.textContent ?? '').replace(/\s+/g, ' '));
    return rowsFor(q.n).every((r) => rows.some((t) => t.includes(r.label) && t.includes(oneDecimal(share(r.num, r.den), lang))));
  });
  expect(complete, `en tabel med alle sidninger for ${q.n} kort`).toBeDefined();
  const splitRowsShown = within(complete!)
    .getAllByRole('row')
    .filter((r) => /\d-\d/.test(r.textContent ?? ''));
  expect(splitRowsShown).toHaveLength(rowsFor(q.n).length);
  if (q.level === 1 || q.level === 2) expect(text).toContain(RULE[lang]);
}

/** Danske bogstaver og ord, som ikke må stå på skærmen på engelsk (som i ui/i18n.test.tsx). */
const DANISH = /[æøåÆØÅ]|\b(og|af|til|med|ikke|eller|linje|linjen|kort|stik|bordet|hånden|fra|lille|mod|kipning|slå|lægger|dækker|ellers|ingen|hvor|hvad|vælg|tryk|svar|sidning|sidninger|chancen|målet)\b/i;

function expectEnglish(where: string) {
  for (const button of screen.queryAllByRole('button', { name: /^Help: / })) fireEvent.click(button);
  const text = document.body.textContent ?? '';
  const found = text.match(DANISH);
  expect(found?.[0], `${where}: ${found ? text.slice(Math.max(0, (found.index ?? 0) - 60), (found.index ?? 0) + 60) : ''}`).toBeUndefined();
}

/** En kombination med n kort ude (ellers den første), som opgaven stilles ved. */
function splitTask(q: SplitQuestion): FbTask {
  const item = TEST_BANK.find((b) => 13 - b.north.length - b.south.length === q.n) ?? TEST_BANK[0];
  return { type: 'splitprocenter', item: q.card, bank: item, goal: item.combination.goals[0], split: q };
}

/** Det, testen ved om en opgave fra `makeSplitTask`, i samme form som det, der læses af skærmen. */
function askedOf(q: SplitQuestion): Asked {
  if (q.level === 2) return { level: 2, n: q.n, value: q.value, label: rowsFor(q.n)[0].label };
  return { level: q.level, n: q.n, value: q.value };
}

describe('4 og 5. Splitprocenter i Selvvalgt', () => {
  it('står i Selvvalgt med ⓘ og giver opgaver på alle fire niveauer med facit; svarene logges uden at røre dagsplanen', async () => {
    render(<App />);
    click('Farvebehandling');
    await screen.findByRole('button', { name: 'Start dagens session' }, { timeout: 10_000 });
    click('Selvvalgt');
    expect(screen.getAllByRole('button', { name: 'Hjælp: Splitprocenter' }).length).toBeGreaterThan(0);
    click(/^Splitprocenter\b/);
    if (!Object.values(QUESTION).some((re) => re.test(pageText()))) click(/^Start\b/);

    const seen = new Set<SplitLevel>();
    const scores: number[] = [];
    for (let i = 0; i < 80 && seen.size < 4; i++) {
      const q = readQuestion();
      seen.add(q.level);
      const right = i % 2 === 0;
      answerOnScreen(q, right);
      expect(within(screen.getByRole('status')).getByText(right ? 'Rigtigt' : 'Forkert')).toBeTruthy();
      expectFacit(q, 'da');
      scores.push(right ? 1 : 0);
      click('Næste opgave');
    }
    expect([...seen].sort()).toEqual([1, 2, 3, 4]);

    const after = stored();
    expect(after.practice.map((p) => p.task)).toEqual(scores.map(() => 'splitprocenter'));
    expect(after.practice.map((p) => p.score)).toEqual(scores);
    for (const p of after.practice) expect(SPLIT_CARDS).toContain(p.item);
    expect({ ...after, practice: [] }).toEqual({ ...defaultFbSaved(), practice: [] });
  }, 60_000);
});

describe('3. Niveau 4 i opgaven og facit', () => {
  it('kongen alene med 4 kort ude hos én bestemt modspiller: knappen 6 % og facit 6,2 %', () => {
    const q = Array.from({ length: 60 }, (_, i) => makeSplitTask(4, mulberry32(i + 1), 4)).find((x) => x.honor === 'K');
    expect(q, 'ingen opgave med kongen alene').toBeDefined();
    const task = splitTask(q!);
    const onAnswer = vi.fn();
    render(<Opgave task={task} onAnswer={onAnswer} />);
    expect(pageText()).toMatch(/Modparten har 4 kort i farven\. Hvor ofte sidder kongen alene hos (Vest|Øst)\?/);
    expect(screen.getAllByRole('button', { name: 'Hjælp: Splitprocenter' }).length).toBeGreaterThan(0);
    const asked = readQuestion();
    expect(asked.level).toBe(4);
    answerOnScreen(asked, true);
    const right = q!.options.findIndex((o) => o.correct);
    expect(onAnswer).toHaveBeenCalledWith({ choice: right });
    cleanup();
    render(<Facit task={task} answer={{ choice: right }} graded={grade(task, { choice: right, ms: 1 }, 20_000)} place={null} onNext={() => {}} />);
    expect(within(screen.getByRole('status')).getByText('Rigtigt')).toBeTruthy();
    expect(pageText()).toContain('6,2 %');
    expectFacit(asked, 'da');
  });
});

describe('5. Opgaven og facit på begge sprog', () => {
  it('dansk: knapperne følger opgavens rækkefølge, og facit har huskereglen og rækken for antallet', () => {
    for (const level of [1, 2, 3, 4] as const) {
      const q = makeSplitTask(level, mulberry32(30 + level));
      const task = splitTask(q);
      const onAnswer = vi.fn();
      render(<Opgave task={task} onAnswer={onAnswer} />);
      const asked = readQuestion();
      expect(asked.level).toBe(level);
      expect(asked.n).toBe(q.n);
      expect(asked.value).toBeCloseTo(q.value, 12);
      const buttons = level === 2 ? splitButtons() : percentButtons();
      expect(buttons.map((b) => b.textContent!.trim().replace(/\s+/g, ' '))).toEqual(
        q.options.map((o) => (level === 2 ? o.label! : `${Math.round(100 * o.value!)} %`)),
      );
      const wrong = q.options.findIndex((o) => !o.correct);
      answerOnScreen(asked, false);
      expect(onAnswer).toHaveBeenCalledTimes(1);
      const [[given]] = onAnswer.mock.calls;
      expect(q.options[given.choice].correct).toBe(false);
      cleanup();
      render(<Facit task={task} answer={{ choice: wrong }} graded={grade(task, { choice: wrong, ms: 1 }, 20_000)} place={null} onNext={() => {}} />);
      expect(within(screen.getByRole('status')).getByText('Forkert')).toBeTruthy();
      expectFacit(askedOf(q), 'da');
      cleanup();
    }
  });

  it('engelsk: opgaven og facit uden dansk, med huskeregel og rækken for antallet', () => {
    setLang('en');
    for (const level of [1, 2, 3, 4] as const) {
      const q = makeSplitTask(level, mulberry32(10 + level));
      const task = splitTask(q);
      const onAnswer = vi.fn();
      render(<Opgave task={task} onAnswer={onAnswer} />);
      expect(screen.getAllByRole('button', { name: 'Help: Split percentages' }).length).toBeGreaterThan(0);
      const buttons = level === 2 ? splitButtons() : percentButtons();
      expect(buttons).toHaveLength(q.options.length);
      expectEnglish(`niveau ${level}: opgaven`);
      const right = q.options.findIndex((o) => o.correct);
      fireEvent.click(buttons[right]);
      const submit = screen.queryByRole('button', { name: 'Answer' });
      if (submit) fireEvent.click(submit);
      expect(onAnswer).toHaveBeenCalledWith({ choice: right });
      cleanup();
      render(<Facit task={task} answer={{ choice: right }} graded={grade(task, { choice: right, ms: 1 }, 20_000)} place={null} onNext={() => {}} />);
      expect(within(screen.getByRole('status')).getByText('Right')).toBeTruthy();
      expectFacit(askedOf(q), 'en');
      expectEnglish(`niveau ${level}: facit`);
      cleanup();
    }
  });
});
