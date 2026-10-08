import { describe, expect, it } from 'vitest';
import { suitLengths } from '../../domain/cards';
import { deal } from '../../domain/dealer';
import { PATTERNS } from '../../domain/patterns';
import { mulberry32 } from '../../engine/rng';
import { hcpOf } from '../../system/interpreter';
import { handToPbn, parseHand } from './hand';
import {
  chances,
  contractFor,
  controlsOf,
  expectedTricks,
  gameThreshold,
  honorPoints,
  majorFit,
  naturalFrequency,
  notrumpPoints,
  P_MODEL,
  partnerNeeds,
  pOf,
  rightDecisions,
  SHORTNESS_BY_PATTERN,
  shortcut,
  shortnessOfLength,
  tableValue,
  trickFormula,
  zarOpens,
  zarPoints,
} from './pmodel';

// Accepttesten i SPEC-haandevaluering.md, Leverancetrin.
const SPEC_HAND = parseHand('AK752.4.KQ63.852');
const SPADES = 0;

describe('P-modellen (SPEC-haandevaluering.md, accepttest)', () => {
  it('♠ E K 7 5 2 ♥ 4 ♦ K D 6 3 ♣ 8 5 2: HCP 12, honnørpoint 12½, og genvejen giver det samme', () => {
    expect(hcpOf(SPEC_HAND)).toBe(12);
    expect(honorPoints(SPEC_HAND)).toBe(12.5);
    expect(shortcut(SPEC_HAND)).toMatchObject({ hcp: 12, aces: 1, queens: 1, jacks: 0, tens: 0, total: 12.5 });
  });

  it('genvejen og formlen giver altid det samme', () => {
    for (let seed = 1; seed <= 2000; seed++) {
      const hand = deal(seed).S;
      expect(shortcut(hand).total, handToPbn(hand)).toBe(honorPoints(hand));
    }
  });

  it('samme hånd med bekræftet spar-fit: p = 12½ + 1½ + 3 = 17; før fitten lægges fordelingsleddene ikke til', () => {
    expect(pOf(SPEC_HAND, { trump: SPADES })).toEqual({ honors: 12.5, trump: 1.5, shortness: 3, wasted: 0, p: 17 });
    expect(pOf(SPEC_HAND)).toEqual({ honors: 12.5, trump: 0, shortness: 0, wasted: 0, p: 12.5 });
  });

  it('P = 29 giver stik ≈ 9,6 og 4M ≈ 58 % (lineær interpolation mellem 28½ og 30), og stikforventningen springer ikke ved tabellens rækker', () => {
    expect(expectedTricks(29)).toBeCloseTo(9.6, 10);
    expect(chances(29).game).toBeCloseTo(58, 10);
    // Fra P = 24 til 40 i kvarte point: aldrig faldende og aldrig mere end tabellens stejleste stykke (0,4 stik pr. point
    // mellem 28½ og 30), heller ikke ved rækkerne.
    for (let P = 24; P < 40; P += 0.25) {
      const step = expectedTricks(P + 0.25) - expectedTricks(P);
      expect(step, `P = ${P}`).toBeGreaterThanOrEqual(0);
      expect(step, `P = ${P}`).toBeLessThanOrEqual(0.4 * 0.25 + 1e-9);
    }
    // Makker med p = 12 over for specens hånd giver P = 29.
    const partner = parseHand('Q963.A98.A74.J76');
    expect(pOf(SPEC_HAND, { trump: SPADES }).p + pOf(partner, { trump: SPADES }).p).toBe(29);
  });

  it('P = 28½ giver 4M = 50 %, og grænserne 28½, 35 og 41 vælger udgang, lilleslem og storeslem; fra P = 28 til 29 er både delkontrakt og udgang rigtige', () => {
    expect(chances(28.5).game).toBe(50);
    expect(contractFor(24)).toBe('partscore');
    expect(contractFor(28.25)).toBe('partscore');
    expect(contractFor(28.5)).toBe('game');
    expect(contractFor(34.75)).toBe('game');
    expect(contractFor(35)).toBe('slam');
    expect(contractFor(40.75)).toBe('slam');
    expect(contractFor(41)).toBe('grand');
    expect(rightDecisions(27.75)).toEqual(['partscore']);
    for (const P of [28, 28.25, 28.5, 28.75, 29]) expect(rightDecisions(P), `P = ${P}`).toEqual(['partscore', 'game']);
    expect(rightDecisions(29.25)).toEqual(['game']);
  });

  it('kortfarvepoint tælles ikke i trumffarven: en 6-2-fit giver ingen dobbelttonpoint for de 2 trumf, og en 7-1-fit ingen singletonpoint', () => {
    // 2 trumf (♠) og en dobbeltton i ♦: kun ♦ tæller.
    expect(pOf(parseHand('Q7.KJ84.A5.QT983'), { trump: SPADES })).toMatchObject({ trump: 0, shortness: 1 });
    // 1 trumf (♥) og ingen anden korthed.
    expect(pOf(parseHand('A853.7.KJ952.Q64'), { trump: 1 })).toMatchObject({ trump: 0, shortness: 0 });
    // Samme hænder uden for trumffarven tæller som mønstret.
    expect(pOf(parseHand('Q7.KJ84.A5.QT983'), { trump: 1 }).shortness).toBe(2);
    expect(pOf(parseHand('A853.7.KJ952.Q64'), { trump: SPADES }).shortness).toBe(3);
  });

  it('samme hånd i Zar: 12 + 4 + 9 + 4 = 29 ZP, dvs. åbning', () => {
    expect(zarPoints(SPEC_HAND)).toEqual({ hcp: 12, controls: 4, long: 9, spread: 4, zp: 29 });
    expect(zarOpens(SPEC_HAND)).toBe(true);
    expect(zarOpens(parseHand('KT4.QT3.AT52.J93'))).toBe(false);
  });

  it('sans: HCP + ¼ pr. tier, uden længdepoint', () => {
    expect(notrumpPoints(parseHand('KT4.QT3.AT52.J93'))).toBe(10.75);
    // En lang farve giver ingen point i sans.
    expect(notrumpPoints(parseHand('AKJ7652..KQ63.85'))).toBe(13);
    expect(notrumpPoints(SPEC_HAND)).toBe(12);
  });

  it('kortfarvepoint pr. mønster svarer til tabellen og beregnes ud fra mønstrene', () => {
    const table: Record<string, number> = {
      '4-3-3-3': 0,
      '4-4-3-2': 1,
      '5-3-3-2': 1,
      '5-4-3-1': 3,
      '5-4-2-2': 2,
      '6-3-2-2': 2,
      '6-4-2-1': 4,
      '6-3-3-1': 3,
      '5-5-2-1': 4,
      '4-4-4-1': 3,
      '7-3-2-1': 4,
      '6-4-3-0': 5,
      '5-4-4-0': 5,
    };
    for (const [id, points] of Object.entries(table)) expect(SHORTNESS_BY_PATTERN[id], id).toBe(points);
    expect(Object.keys(SHORTNESS_BY_PATTERN)).toHaveLength(PATTERNS.length);
    // Hver hånds kortfarvepoint er mønstrets minus trumffarvens.
    for (let seed = 1; seed <= 200; seed++) {
      const hand = deal(seed).N;
      const lengths = suitLengths(hand);
      const id = [...lengths].sort((a, b) => b - a).join('-');
      expect(pOf(hand, { trump: SPADES }).shortness).toBe(SHORTNESS_BY_PATTERN[id] - shortnessOfLength(lengths[SPADES]));
    }
  });

  it('en konge over for makkers viste korthed trækker 1 fra; en dame eller knægt gør ikke', () => {
    expect(pOf(SPEC_HAND, { trump: SPADES, partnerShort: [2] })).toMatchObject({ wasted: -1, p: 16 });
    expect(pOf(SPEC_HAND, { trump: SPADES, partnerShort: [3] })).toMatchObject({ wasted: 0, p: 17 });
    const queenJack = parseHand('AK752.4.QJ63.852');
    expect(pOf(queenJack, { trump: SPADES, partnerShort: [2] })).toMatchObject({ wasted: 0, p: 14.5 });
    // Uden bekræftet fit er der hverken fordelingsled eller spildte værdier.
    expect(pOf(SPEC_HAND, { partnerShort: [2] }).p).toBe(12.5);
  });
});

describe('P-modellen: tabellen, stikforventningen og beslutningen', () => {
  it('tabellen interpoleres lineært, og uden for den bruges nærmeste række', () => {
    for (const row of P_MODEL.tabel.raekker) {
      expect(tableValue(row.P, '4M')).toBe(row['4M']);
      expect(tableValue(row.P, '6M')).toBe(row['6M']);
      expect(tableValue(row.P, '7M')).toBe(row['7M']);
    }
    expect(chances(20)).toEqual(chances(24));
    expect(chances(45)).toEqual(chances(40));
    expect(chances(31).game).toBeCloseTo(82.5, 10);
  });

  it('stikforventningen er tabellens "Gns. stik"; formlen bruges kun i forklaringer, og huskeversionen P/3 ligger inden for 0,2 stik fra P = 24 til 32', () => {
    for (const row of P_MODEL.tabel.raekker) expect(expectedTricks(row.P)).toBe(row.stik);
    expect(expectedTricks(38)).toBeCloseTo(11.9, 10);
    expect(trickFormula(29)).toBeCloseTo(9.74, 10);
    for (let P = 24; P <= 32; P += 0.25) expect(Math.abs(P / 3 - expectedTricks(P)), `P = ${P}`).toBeLessThanOrEqual(0.2);
  });

  it('inden for ½ point af en grænse, grænserne medregnet, er begge nabovalg rigtige', () => {
    expect(rightDecisions(24)).toEqual(['partscore']);
    expect(rightDecisions(34.25)).toEqual(['game']);
    expect(rightDecisions(34.5)).toEqual(['game', 'slam']);
    expect(rightDecisions(35.5)).toEqual(['game', 'slam']);
    expect(rightDecisions(35.75)).toEqual(['slam']);
    expect(rightDecisions(40.25)).toEqual(['slam']);
    expect(rightDecisions(40.5)).toEqual(['slam', 'grand']);
    expect(rightDecisions(41.5)).toEqual(['slam', 'grand']);
    expect(rightDecisions(41.75)).toEqual(['grand']);
  });

  it('kontroltjekket: slem kræver højst ét manglende es, storeslem alle fire es og trumfkongen', () => {
    expect(contractFor(36, { aces: 3, trumpKing: false })).toBe('slam');
    expect(contractFor(36, { aces: 2, trumpKing: true })).toBe('game');
    expect(rightDecisions(35, { aces: 2, trumpKing: true })).toEqual(['game']);
    expect(contractFor(42, { aces: 4, trumpKing: false })).toBe('slam');
    expect(contractFor(42, { aces: 3, trumpKing: true })).toBe('slam');
    expect(rightDecisions(41, { aces: 3, trumpKing: true })).toEqual(['slam']);
    const south = parseHand('AKJ752.A4.AK3.A2'), north = parseHand('Q643.K2.Q52.K843');
    expect(controlsOf(south, north, SPADES)).toEqual({ aces: 4, trumpKing: true });
  });

  it('hvad makker skal have til udgang: tabellen i MODEL.md 1 (28½ minus dine point)', () => {
    const table: [number, number][] = [[12, 16.5], [14, 14.5], [16, 12.5], [18, 10.5], [21, 7.5], [24, 4.5]];
    for (const [you, partner] of table) expect(partnerNeeds(you)).toBe(partner);
    expect(partnerNeeds(30)).toBe(0);
  });

  it('turneringsformen: udgang ved P ≈ 27½ i zonen, 28 uden for zonen og 28½ ved parturnering', () => {
    expect(gameThreshold('impVulnerable')).toBe(27.5);
    expect(gameThreshold('impNotVulnerable')).toBe(28);
    expect(gameThreshold('pairs')).toBe(28.5);
  });

  it('majorfitten er den længste 8+ fit i spar eller hjerter', () => {
    expect(majorFit(SPEC_HAND, parseHand('Q963.A98.A74.J76'))).toBe(0);
    expect(majorFit(parseHand('A4.98763.AQ98.JT'), parseHand('KQ76.KJT.42.AQ52'))).toBe(1);
    expect(majorFit(parseHand('96.A853.642.9875'), parseHand('KQ3.K74.AJ93.KQ2'))).toBeNull();
  });

  it('chancen som naturlig frekvens: 58 % er ca. 3 ud af 5 gange', () => {
    expect(naturalFrequency(58)).toEqual({ k: 3, n: 5 });
    expect(naturalFrequency(50)).toEqual({ k: 1, n: 2 });
    expect(naturalFrequency(74)).toEqual({ k: 3, n: 4 });
    expect(naturalFrequency(91)).toEqual({ k: 9, n: 10 });
    expect(naturalFrequency(7)).toEqual({ k: 1, n: 14 });
    expect(naturalFrequency(97.125)).toEqual({ k: 1, n: 1 });
    expect(naturalFrequency(98)).toEqual({ k: 1, n: 1 });
    expect(naturalFrequency(0)).toEqual({ k: 0, n: 1 });
    expect(naturalFrequency(100)).toEqual({ k: 1, n: 1 });
    for (let x = 0.5; x < 100; x += 0.5) {
      const { k, n } = naturalFrequency(x);
      expect(k / n).toBeGreaterThan(0);
      // Under 95 % er det aldrig "næsten altid".
      if (x < 95) expect(k / n, `${x} %`).toBeLessThan(1);
    }
  });

  it('PBN-notationen læses og skrives uden tab', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const hand = deal(rng.uint32()).W;
      expect(parseHand(handToPbn(hand)).sort((a, b) => a - b)).toEqual([...hand].sort((a, b) => a - b));
    }
    expect(() => parseHand('AK752.4.KQ63.85')).toThrow();
  });
});
