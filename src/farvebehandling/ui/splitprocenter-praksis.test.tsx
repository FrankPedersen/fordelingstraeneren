// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { mulberry32 } from '../../engine/rng';
import { setLang } from '../../i18n';
import { layoutChance } from '../model/layouts';
import { TEST_BANK } from '../testBank';
import { grade, makeSplitTask, SPLIT_COUNTS, type FbTask } from '../training/tasks';
import { Facit } from './Facit';

/**
 * "I praksis" i Splitprocenters facit (Franks rettelse 21. nov. 2026, SPEC-splitprocenter.md, Afklaret).
 *
 * Linjen siger fx "Med 4 kort ude og E K: toppes farven, …". Påstanden er:
 * - spilleren har topkortene, så mange som den jævneste sidnings længste side: E (2 kort ude), E K (3–4), E K D (5–6)
 *   og E K D B (7–8);
 * - modparten har kortet lige under topkortene (kongen, damen, knægten eller 10'eren) og n − 1 små kort;
 * - farven toppes: topkortene spilles fra toppen, én runde pr. topkort, og hver modspiller lægger et lille kort, så
 *   længe han har et;
 * - teknikken lykkes, når kortet under topkortene falder.
 *
 * Testen regner hver linjes chance uafhængigt ved at tælle alle sidninger: hvert af de n kort ude gives til Vest eller
 * Øst (2^n sidninger), hver sidning vejes med de ukendte pladser, C(26 − n, 13 − w) / C(26, 13), hvor w er Vests antal
 * (samme model som `layoutChance`, a priori), og runderne spilles igennem. Tallet i linjen skal være chancen afrundet
 * med én decimal, på dansk og engelsk. Franks eksempel er den faste kontrol: 4 kort ude og E K, damen falder ved 2-2
 * eller single dame, 40,7 % + 2 × 6,2 % = 53,1 %.
 */

afterEach(() => {
  cleanup();
  setLang('da');
});

const HONORS = ['E', 'K', 'D', 'B'];
const HONORS_EN = ['A', 'K', 'Q', 'J'];

/** C(n, k) med BigInt, regnet her og ikke hentet fra koden. */
function binom(n: number, k: number): bigint {
  if (k < 0 || k > n) return 0n;
  let r = 1n;
  for (let i = 0; i < k; i++) r = (r * BigInt(n - i)) / BigInt(i + 1);
  return r;
}

/** Topkortene i linjen for n kort ude: så mange som den jævneste sidnings længste side. */
const topCount = (n: number) => Math.ceil(n / 2);

/**
 * Farven toppes i k runder. Kort 0 er kortet under topkortene, resten er små. `west[i]` siger, om kort i sidder hos
 * Vest. I hver runde lægger hver modspiller et lille kort, hvis han har et, ellers kort 0, hvis han har det.
 */
function cardFalls(west: boolean[], k: number): boolean {
  const hands = [true, false].map((side) => west.flatMap((w, i) => (w === side ? [i] : [])));
  for (let round = 0; round < k; round++) {
    for (const hand of hands) {
      if (hand.length === 0) continue;
      const small = hand.findIndex((c) => c !== 0);
      const played = hand.splice(small >= 0 ? small : 0, 1)[0];
      if (played === 0) return true;
    }
  }
  return false;
}

/** Chancen for, at kortet under de k topkort falder, talt over alle 2^n sidninger: tæller og nævner. */
function countAll(n: number, k: number): { num: bigint; den: bigint } {
  const den = binom(26, 13);
  let num = 0n;
  for (let mask = 0; mask < 1 << n; mask++) {
    const west = Array.from({ length: n }, (_, i) => ((mask >> i) & 1) === 1);
    if (cardFalls(west, k)) num += binom(26 - n, 13 - west.filter(Boolean).length);
  }
  return { num, den };
}

/** Procent med én decimal, fx "53.1". */
const oneDecimal = ({ num, den }: { num: bigint; den: bigint }) => ((100 * Number(num)) / Number(den)).toFixed(1);
const expected = (n: number) => oneDecimal(countAll(n, topCount(n)));

/** Facit for en opgave med n kort ude og linjen "I praksis" som tekst. */
function practiceLine(n: number): string {
  const q = makeSplitTask(1, mulberry32(n), n);
  const bank = TEST_BANK.find((b) => 13 - b.north.length - b.south.length === n) ?? TEST_BANK[0];
  const task: FbTask = { type: 'splitprocenter', item: q.card, bank, goal: bank.combination.goals[0], split: q };
  const right = q.options.findIndex((o) => o.correct);
  render(<Facit task={task} answer={{ choice: right }} graded={grade(task, { choice: right, ms: 1 }, 20_000)} place={null} onNext={() => {}} />);
  const p = [...document.querySelectorAll('p')].find((el) => /^\s*(I praksis|In practice):/.test(el.textContent ?? ''));
  expect(p, `facit med ${n} kort ude har ingen linje "I praksis"`).toBeDefined();
  const text = p!.textContent!.replace(/\s+/g, ' ').trim();
  cleanup();
  return text;
}

const DA = /^I praksis: Med (\d) kort ude og ([EKDB](?: [EKDB])*): toppes farven, .+ i (\d+,\d) %\.$/;
const EN = /^In practice: With (\d) cards out and ([AKQJ](?: [AKQJ])*): playing for the drop, .+ (\d+\.\d) % of the time\.$/;

describe('"I praksis" i Splitprocenters facit: tallet er talt over alle sidninger', () => {
  it('vægtene er de ukendte pladsers, som i layoutChance', () => {
    for (const n of SPLIT_COUNTS) for (let w = 0; w <= n; w++) expect(layoutChance(n, w)).toEqual({ num: binom(26 - n, 13 - w), den: binom(26, 13) });
  });

  it('Franks kontrol: 4 kort ude og E K, damen falder ved 2-2 eller single dame: 40,7 % + 2 × 6,2 % = 53,1 %', () => {
    const den = binom(26, 13);
    const twoTwo = binom(4, 2) * binom(22, 11);
    const singleQueen = binom(22, 12);
    const total = countAll(4, 2);
    expect(total.num).toBe(twoTwo + 2n * singleQueen);
    expect(oneDecimal({ num: twoTwo, den })).toBe('40.7');
    expect(oneDecimal({ num: singleQueen, den })).toBe('6.2');
    expect(oneDecimal(total)).toBe('53.1');
    expect(practiceLine(4)).toContain('53,1 %');
  });

  it('dansk: hver linje for 2–8 kort ude har topkortene og chancen med én decimal', () => {
    const lines = SPLIT_COUNTS.map((n) => {
      const line = practiceLine(n);
      const m = DA.exec(line);
      expect(m, line).not.toBeNull();
      return `${m![1]} kort ude, ${m![2]}: ${m![3]} %`;
    });
    expect(lines).toEqual(SPLIT_COUNTS.map((n) => `${n} kort ude, ${HONORS.slice(0, topCount(n)).join(' ')}: ${expected(n).replace('.', ',')} %`));
  });

  it('engelsk: hver linje for 2–8 kort ude har topkortene og chancen med én decimal', () => {
    setLang('en');
    const lines = SPLIT_COUNTS.map((n) => {
      const line = practiceLine(n);
      const m = EN.exec(line);
      expect(m, line).not.toBeNull();
      return `${m![1]} cards out, ${m![2]}: ${m![3]} %`;
    });
    expect(lines).toEqual(SPLIT_COUNTS.map((n) => `${n} cards out, ${HONORS_EN.slice(0, topCount(n)).join(' ')}: ${expected(n)} %`));
  });

  it('linjen siger, hvilket kort der falder, på dansk og engelsk', () => {
    const da = ['kongen', 'damen', 'damen', 'knægten', 'knægten', "10'eren", "10'eren"];
    const en = ['king', 'queen', 'queen', 'jack', 'jack', 'ten', 'ten'];
    expect(SPLIT_COUNTS.map(practiceLine)).toEqual(
      SPLIT_COUNTS.map(
        (n, i) => `I praksis: Med ${n} kort ude og ${HONORS.slice(0, topCount(n)).join(' ')}: toppes farven, falder ${da[i]} i ${expected(n).replace('.', ',')} %.`,
      ),
    );
    setLang('en');
    expect(SPLIT_COUNTS.map(practiceLine)).toEqual(
      SPLIT_COUNTS.map(
        (n, i) =>
          `In practice: With ${n} cards out and ${HONORS_EN.slice(0, topCount(n)).join(' ')}: playing for the drop, the ${en[i]} falls ${expected(n)} % of the time.`,
      ),
    );
  });
});
