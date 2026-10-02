import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../engine/rng';
import { suitLengths } from '../domain/cards';
import { SEATS, dealWith } from '../domain/dealer';
import {
  SYSTEM,
  callText,
  chooseCall,
  contextsOf,
  hasStopper,
  hcpOf,
  satisfies,
  theirSuit,
  type Rule,
} from './interpreter';

// Kort: farve × 13 + valør, hvor valør 12 er esset (se domain/cards.ts).
const card = (suit: number, rank: number) => suit * 13 + rank;
const A = 12;
const K = 11;
const Q = 10;
const J = 9;

describe('Meldegiveren – accepttest', () => {
  it('på 10.000 tilfældige hænder opfylder den valgte melding altid sit eget shows, og ingen regel er uopnåelig', () => {
    const rng = mulberry32(2026);
    const used = new Set<Rule>();
    const broken: string[] = [];
    for (let deal = 0; deal < 2500; deal++) {
      const hands = dealWith(rng);
      for (const seat of SEATS) {
        const hand = hands[seat];
        for (const context of contextsOf(SYSTEM)) {
          const rule = chooseCall(context, hand, theirSuit(context));
          if (!rule) continue;
          used.add(rule);
          if (!satisfies(rule.shows, suitLengths(hand))) broken.push(`${context} ${rule.call}`);
        }
      }
    }
    expect(broken).toEqual([]);
    expect(SYSTEM.filter((r) => !used.has(r)).map((r) => `${r.context} ${r.call}`)).toEqual([]);
  });
});

describe('Systemfilen', () => {
  it('har gyldige regler med melding, situation, prioritet, hp, shows og tekst', () => {
    expect(SYSTEM.length).toBeGreaterThan(40);
    for (const r of SYSTEM) {
      expect(r.call).toMatch(/^([1-3](C|D|H|S|NT)|X)$/);
      expect(r.text.length).toBeGreaterThan(3);
    }
  });

  it('følger tabellens åbningsprioriteter', () => {
    const openings = SYSTEM.filter((r) => r.context === 'opening' && r.priority <= 7);
    expect(openings.map((r) => r.call)).toEqual(['2C', '2NT', '1NT', '1S', '1H', '1D', '1C']);
  });
});

describe('Krav', () => {
  const l = [5, 4, 2, 2] as const;
  it('forstår min, max, exact, geq, longest, balanced, allOf og anyOf', () => {
    expect(satisfies({ min: { S: 5, H: 4 } }, l)).toBe(true);
    expect(satisfies({ max: { D: 1 } }, l)).toBe(false);
    expect(satisfies({ exact: { C: 2 } }, l)).toBe(true);
    expect(satisfies({ geq: ['D', 'C'] }, l)).toBe(true);
    expect(satisfies({ longest: 'S' }, l)).toBe(true);
    expect(satisfies({ longest: 'S' }, [5, 5, 2, 1])).toBe(true);
    expect(satisfies({ longest: 'H' }, l)).toBe(false);
    expect(satisfies({ balanced: true }, [3, 5, 3, 2])).toBe(true);
    expect(satisfies({ balanced: true }, l)).toBe(false);
    expect(satisfies({ allOf: [] }, l)).toBe(true);
    expect(satisfies({ anyOf: [{ min: { C: 5 } }, { min: { S: 5 } }] }, l)).toBe(true);
  });
});

describe('Meldegiveren', () => {
  it('tæller honnørpoint og finder hold', () => {
    expect(hcpOf([card(0, A), card(1, K), card(2, Q), card(3, J), card(3, 8)])).toBe(10);
    expect(hasStopper([card(1, K), card(1, 2)], 1)).toBe(true);
    expect(hasStopper([card(1, K)], 1)).toBe(false);
    expect(hasStopper([card(1, Q), card(1, 3), card(1, 2)], 1)).toBe(true);
    expect(hasStopper([card(1, A)], 1)).toBe(true);
  });

  it('åbner 1♥ med 5+ hjerter som længste farve og 12–21 hp', () => {
    // ♠ E 3 2 · ♥ E K 9 7 5 · ♦ K 4 · ♣ 8 6 3 = 14 hp
    const hand = [
      card(0, A), card(0, 1), card(0, 0),
      card(1, A), card(1, K), card(1, 7), card(1, 5), card(1, 3),
      card(2, K), card(2, 2),
      card(3, 6), card(3, 4), card(3, 1),
    ];
    expect(chooseCall('opening', hand)?.call).toBe('1H');
  });

  it('skriver meldingerne med farvesymboler', () => {
    expect(['1H', '2NT', '3C', 'X'].map(callText)).toEqual(['1♥', '2NT', '3♣', 'dobling']);
  });
});
