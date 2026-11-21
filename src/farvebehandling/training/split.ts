import { isDue, type Item } from '../../engine/leitner';
import { shuffle, type Rng } from '../../engine/rng';
import type { Fraction } from '../model/fraction';
import { layoutChance, splitChance } from '../model/layouts';

/**
 * Splitprocenter (SPEC-splitprocenter.md): chancen for, hvordan modpartens n kort i en farve sidder, a priori (13 ledige
 * pladser hos hver). Alle tal regnes af `splitChance` og `layoutChance` i `model/layouts.ts`; der står ingen tal i hånden.
 */

/** Antal kort ude: 2–8. */
export const SPLIT_COUNTS: readonly number[] = [2, 3, 4, 5, 6, 7, 8];

/** En sidning uanset retning, fx "3-2": `longer` er den længste side, `chance` andelen 0–1. */
export interface SplitRow {
  label: string;
  longer: number;
  chance: number;
}

const share = (f: Fraction) => Number(f.num) / Number(f.den);

/** Alle sidninger for n kort ude, hyppigste først (sorteret på de eksakte tællere; alle har nævneren C(26, 13)). */
export function splitRows(n: number): SplitRow[] {
  const rows: { row: SplitRow; num: bigint }[] = [];
  for (let longer = Math.ceil(n / 2); longer <= n; longer++) {
    const f = splitChance(n, longer);
    rows.push({ row: { label: `${longer}-${n - longer}`, longer, chance: share(f) }, num: f.num });
  }
  return rows.sort((a, b) => (b.num > a.num ? 1 : b.num < a.num ? -1 : 0)).map((r) => r.row);
}

const rowOf = (n: number, label: string) => splitRows(n).find((r) => r.label === label)!;

/** Kortet i Leitner-bunken for en sidning, fx "split:5:3-2". */
export const splitCard = (n: number, label: string) => `split:${n}:${label}`;

/** Antallet og sidningen ud fra kortets nøgle. */
export function parseSplitCard(card: string): { n: number; label: string } {
  const [, n, label] = card.split(':');
  return { n: Number(n), label };
}

/** Leitner-bunkens 23 kort: ét pr. sidning, i rækkefølgen antal og så hyppighed. */
export const SPLIT_CARDS: readonly string[] = SPLIT_COUNTS.flatMap((n) => splitRows(n).map((r) => splitCard(n, r.label)));

export type SplitLevel = 1 | 2 | 3 | 4;
export type SplitHonor = 'E' | 'K' | 'D' | 'B';
export type SplitSeat = 'W' | 'E';

const HONORS: readonly SplitHonor[] = ['E', 'K', 'D', 'B'];

/**
 * En svarknap: niveau 1, 3 og 4 har `value` (0–1, knappen viser hele procent), niveau 2 har `label` (sidningen).
 * Niveau 1 har `from`: antallet og sidningen, tallet kommer fra.
 */
export interface SplitOption {
  value?: number;
  label?: string;
  correct: boolean;
  from?: { n: number; label: string };
}

/**
 * Et spørgsmål: `splits` er sidningen (niveau 1), de to, der lægges sammen (niveau 3), eller sidningen, honnøren alene
 * kommer fra (niveau 4); niveau 2 har ingen. `value` er det rigtige tal, og `card` kortet i bunken.
 */
export interface SplitQuestion {
  level: SplitLevel;
  n: number;
  splits: string[];
  honor?: SplitHonor;
  seat?: SplitSeat;
  value: number;
  card: string;
  options: SplitOption[];
}

/** De forkerte tal ligger mindst så mange procentpoint fra det rigtige (målt i de viste hele procent). */
export const SPLIT_MIN_GAP = 5;

/** Knapperne viser hele procent. */
export const wholePercent = (value: number) => Math.round(100 * value);

/** Antal forkerte knapper på niveau 1, 3 og 4. */
const WRONG = 3;

interface Candidate {
  value: number;
  from?: { n: number; label: string };
}

/**
 * Lægger op til `count` tal fra puljen (blandet) til de forkerte: hvert skal vise et andet helt procenttal end de
 * valgte og ligge mindst SPLIT_MIN_GAP procentpoint fra det rigtige.
 */
function pick(wrong: Candidate[], right: number, pool: readonly Candidate[], count: number, rng: Rng): void {
  let added = 0;
  for (const c of shuffle([...pool], rng)) {
    if (added >= count || wrong.length >= WRONG) return;
    const w = wholePercent(c.value);
    if (Math.abs(w - wholePercent(right)) < SPLIT_MIN_GAP || wrong.some((x) => wholePercent(x.value) === w)) continue;
    wrong.push(c);
    added++;
  }
}

/** Det rigtige tal og de forkerte, blandet. */
function percentOptions(right: Candidate, wrong: readonly Candidate[], rng: Rng): SplitOption[] {
  if (wrong.length !== WRONG) throw new Error('For få forkerte tal');
  const option = (c: Candidate, correct: boolean): SplitOption => ({ value: c.value, correct, ...(c.from ? { from: c.from } : {}) });
  return shuffle([option(right, true), ...wrong.map((c) => option(c, false))], rng);
}

/** Alle sidningers tal for n kort ude som kandidater. */
const rowsAsCandidates = (n: number): Candidate[] => splitRows(n).map((r) => ({ value: r.chance, from: { n, label: r.label } }));

const neighbours = (n: number) => [n - 1, n + 1].filter((m) => SPLIT_COUNTS.includes(m));

/**
 * Niveau 1: chancen for én sidning. De forkerte er to andre sidningers tal for samme antal (så mange, der ligger
 * mindst 5 procentpoint fra), mindst ét fra et nabo-antal og resten fra andre antal.
 */
function level1(n: number, label: string, rng: Rng): SplitQuestion {
  const right: Candidate = { value: rowOf(n, label).chance, from: { n, label } };
  const wrong: Candidate[] = [];
  pick(wrong, right.value, rowsAsCandidates(n).filter((c) => c.from!.label !== label), 2, rng);
  pick(wrong, right.value, neighbours(n).flatMap(rowsAsCandidates), 1, rng);
  pick(wrong, right.value, SPLIT_COUNTS.filter((m) => m !== n).flatMap(rowsAsCandidates), WRONG, rng);
  return { level: 1, n, splits: [label], value: right.value, card: splitCard(n, label), options: percentOptions(right, wrong, rng) };
}

/** Niveau 2: den hyppigste sidning; knapperne er alle sidningerne for antallet. */
function level2(n: number, rng: Rng): SplitQuestion {
  const rows = splitRows(n);
  const options = shuffle(rows.map((r, i) => ({ label: r.label, correct: i === 0 })), rng);
  return { level: 2, n, splits: [], value: rows[0].chance, card: splitCard(n, rows[0].label), options };
}

/** To sidninger for n kort ude, der ligger ved siden af hinanden (fx 3-3 og 4-2), med deres sum. */
function adjacentPairs(n: number): { labels: [string, string]; value: number }[] {
  const pairs: { labels: [string, string]; value: number }[] = [];
  for (let longer = Math.ceil(n / 2); longer < n; longer++) {
    const a = `${longer}-${n - longer}`;
    const b = `${longer + 1}-${n - longer - 1}`;
    const sum = splitChance(n, longer).num + splitChance(n, longer + 1).num;
    pairs.push({ labels: [a, b], value: share({ num: sum, den: splitChance(n, longer).den }) });
  }
  return pairs;
}

/**
 * Niveau 3: to sidninger lagt sammen, som når en linje virker ved begge (4–8 kort ude). De forkerte er hver sidning
 * for sig, de andre par for antallet og resten (100 % minus summen), derefter parrene for nabo-antallene.
 */
function level3(n: number, rng: Rng): SplitQuestion {
  const pairs = adjacentPairs(n);
  const pair = pairs[rng.int(pairs.length)];
  const right: Candidate = { value: pair.value };
  const wrong: Candidate[] = [];
  const close = [
    ...pair.labels.map((label) => ({ value: rowOf(n, label).chance })),
    ...pairs.filter((p) => p !== pair).map((p) => ({ value: p.value })),
    { value: 1 - pair.value },
  ];
  pick(wrong, right.value, close, WRONG, rng);
  pick(wrong, right.value, neighbours(n).flatMap((m) => adjacentPairs(m).map((p) => ({ value: p.value }))), WRONG, rng);
  pick(wrong, right.value, SPLIT_COUNTS.flatMap(rowsAsCandidates), WRONG, rng);
  return { level: 3, n, splits: [...pair.labels], value: pair.value, card: splitCard(n, pair.labels[0]), options: percentOptions(right, wrong, rng) };
}

/**
 * Niveau 4: en bestemt honnør alene hos en bestemt modspiller med 3–5 kort ude, `layoutChance(n, 1)`: sidningen
 * (n−1)-1 delt på de n kort, der kan sidde alene, og på begge hænder. De forkerte er de typiske fejl (glemt én af
 * delingerne eller delt én gang for meget), derefter sidningernes tal for antallet (kun med 5 kort ude, hvor to af de
 * typiske fejl ligger under 5 procentpoint fra det rigtige).
 */
function level4(n: number, rng: Rng): SplitQuestion {
  const honor = HONORS[rng.int(HONORS.length)];
  const seat: SplitSeat = rng.int(2) === 0 ? 'W' : 'E';
  const value = share(layoutChance(n, 1));
  const label = `${n - 1}-1`;
  const wrong: Candidate[] = [];
  const typical = [2 * value, rowOf(n, label).chance, n * value, value / 2].map((v) => ({ value: v }));
  pick(wrong, value, typical, WRONG, rng);
  pick(wrong, value, rowsAsCandidates(n).map((c) => ({ value: c.value })), WRONG, rng);
  return { level: 4, n, splits: [label], honor, seat, value, card: splitCard(n, label), options: percentOptions({ value }, wrong, rng) };
}

/**
 * Antallene, et niveau kan stille: niveau 3 kræver 4–8 kort ude, fordi to sidninger med 2 eller 3 kort er 100 %, og
 * niveau 4 bruger kun 3–5, fordi honnøren alene med 6–8 kort ude er 0–1 % (Franks rettelse 18. nov. 2026).
 */
export const splitCounts = (level: SplitLevel): readonly number[] =>
  level === 3 ? SPLIT_COUNTS.filter((n) => n >= 4) : level === 4 ? SPLIT_COUNTS.filter((n) => n >= 3 && n <= 5) : SPLIT_COUNTS;

/**
 * En opgave på niveau 1–4 fra `rng`; samme seed giver samme opgave. Med `n` stilles den med netop så mange kort ude.
 * Niveau 1 spørger om den hyppigste eller næsthyppigste sidning.
 */
export function makeSplitTask(level: SplitLevel, rng: Rng, n?: number): SplitQuestion {
  const counts = splitCounts(level);
  const m = n ?? counts[rng.int(counts.length)];
  if (!counts.includes(m)) throw new Error(`Niveau ${level} kan ikke stilles med ${m} kort ude`);
  switch (level) {
    case 1:
      return level1(m, splitRows(m)[rng.int(2)].label, rng);
    case 2:
      return level2(m, rng);
    case 3:
      return level3(m, rng);
    case 4:
      return level4(m, rng);
  }
}

/** Sessionen stiller et kort fra bunken på niveau 1, også når sidningen er sjælden (Franks svar 18. nov. 2026). */
export function makeSplitCardTask(card: string, rng: Rng): SplitQuestion {
  const { n, label } = parseSplitCard(card);
  return level1(n, label, rng);
}

/**
 * Kortet, sessionen stiller: det ældste forfaldne i bunken, ellers det næste nye i tabellens rækkefølge. Et nyt kort
 * er forfaldent fra start som et nyt emne; det gemmes først, når det er besvaret. `undefined`, når intet er forfaldent.
 */
export function nextSplitCard(deck: Record<string, Item> | undefined, today: string): string | undefined {
  const cards = deck ?? {};
  const due = SPLIT_CARDS.filter((c) => cards[c] && isDue(cards[c], today)).sort(
    (a, b) => cards[a].due.localeCompare(cards[b].due) || SPLIT_CARDS.indexOf(a) - SPLIT_CARDS.indexOf(b),
  );
  return due[0] ?? SPLIT_CARDS.find((c) => !cards[c]);
}

/** Topkortene, der toppes med for n kort ude: så mange som den jævneste sidnings længste side. */
export const toppingHonors = (n: number): SplitHonor[] => HONORS.slice(0, Math.ceil(n / 2));

/** Chancen for den jævneste sidning (fx 3-2 med 5 kort ude): dér falder alle modpartens kort, når farven toppes. */
export const evenSplit = (n: number): SplitRow => splitRows(n).find((r) => r.longer === Math.ceil(n / 2))!;
