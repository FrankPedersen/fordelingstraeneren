import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../engine/rng';
import { bankItem } from '../testBank';
import { canLead, dealCards, finished, playLead, playThird, startPlay, type PlayState } from './play';

// SPEC-forbindelser.md, leverancetrin 3: Spil den selv følger forbindelserne. E K 2 / B 5 4 3 (bordet / hånden).
const item = bankItem('AK2-J543');
const deal = () => dealCards(item, mulberry32(7));

/** Udspil og 3. håndens laveste kort. */
function trick(s: PlayState, hand: 'N' | 'S', card: number, seed = 1): PlayState {
  const rng = mulberry32(seed);
  const led = playLead(s, hand, card as never, rng);
  const partner = hand === 'N' ? led.south : led.north;
  return playThird(led, partner.length ? Math.min(...partner) : 0, rng);
}

describe('Spil den selv med forbindelser (SPEC-forbindelser.md, trin 3)', () => {
  it('med Syd 0 indgange og Nord inde kan der ikke spilles ud fra Syd, efter at Nord har vundet et stik', () => {
    let s = startPlay(item, deal(), { entries: { north: null, south: 0 }, lead: 'N' });
    expect(canLead(s, 'N')).toBe(true);
    expect(canLead(s, 'S')).toBe(false);
    expect(() => playLead(s, 'S', 3 as never, mulberry32(1))).toThrow();
    s = trick(s, 'N', 14);
    expect(s.tricks[0].winner).toBe('N');
    expect(s.connections).toEqual({ inde: 'N', entries: { N: Infinity, S: 0 } });
    expect(canLead(s, 'S')).toBe(false);
    expect(canLead(s, 'N')).toBe(true);
  });

  it('et udspil fra den anden hånd bruger en indgang, som tælles ned', () => {
    let s = startPlay(item, deal(), { entries: { north: null, south: 1 }, lead: 'N' });
    expect(canLead(s, 'S')).toBe(true);
    s = trick(s, 'S', 3);
    expect(s.connections!.entries.S).toBe(0);
    // Vandt bordet stikket, er hånden ikke inde, og der er ingen indgang tilbage.
    if (s.tricks[0].winner === 'N') expect(canLead(s, 'S')).toBe(false);
  });

  it('kan ingen hånd med kort nås, er spillet slut, selv om der er kort tilbage', () => {
    let s = startPlay(item, deal(), { entries: { north: null, south: 0 }, lead: 'N' });
    for (const card of [14, 13, 2]) s = trick(s, 'N', card);
    expect(s.north).toEqual([]);
    expect(s.south.length).toBe(1);
    expect(finished(s)).toBe(true);
  });

  it('uden forbindelser er spillet som i dag', () => {
    const s = startPlay(item, deal());
    expect(s.connections).toBeUndefined();
    expect(canLead(s, 'N') && canLead(s, 'S')).toBe(true);
  });
});
