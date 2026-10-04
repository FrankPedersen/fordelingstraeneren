import { describe, expect, it } from 'vitest';
import { mulberry32, type Rng } from '../../engine/rng';
import { bandFields, fieldIdOf, linesForGoal } from '../analysis';
import { missingCards, parseCards } from '../model/cards';
import { bankItem } from '../testBank';
import { dealCards, finished, followsBestLine, playLead, playThird, startPlay, thirdHandEmpty, type Deal } from './play';

/** Et "tilfældigt" tal, der altid vælger det første af flere ligeværdige kort. */
const first: Rng = { next: () => 0, uint32: () => 0, int: () => 0 };

// E K 5 4 / B 3 2: bordet B 3 2, hånden E K 5 4; modparten har D 10 9 8 7 6.
const item = bankItem('J32-AK54');
const deal = (west: string, east: string): Deal => {
  const w = parseCards(west), e = parseCards(east);
  const layout = item.solution.layouts.findIndex((l) =>
    item.solution.gaps.every((gap, g) => w.filter((r) => r <= gap.high && r >= gap.low).length === l.west[g]),
  );
  return { west: w, east: e, layout };
};

describe('Spil den selv', () => {
  it('giver modpartens kort efter sidningernes chance', () => {
    const rng = mulberry32(7);
    const counts = new Map<number, number>();
    const n = 20_000;
    for (let i = 0; i < n; i++) {
      const d = dealCards(item, rng);
      counts.set(d.layout, (counts.get(d.layout) ?? 0) + 1);
      if (i < 50) {
        expect([...d.west, ...d.east].sort((a, b) => b - a)).toEqual(missingCards(item.north, item.south));
        item.solution.gaps.forEach((gap, g) =>
          expect(d.west.filter((r) => r <= gap.high && r >= gap.low)).toHaveLength(item.solution.layouts[d.layout].west[g]),
        );
      }
    }
    const den = Number(item.solution.denominator);
    item.solution.layouts.forEach((l, L) => expect((counts.get(L) ?? 0) / n).toBeCloseTo(Number(l.weight) / den, 1));
  });

  it('spiller stik med normalt modspil og tæller spilførerens stik', () => {
    let s = startPlay(item, deal('Q98', 'T76'));
    // Lille fra bordet: Øst lægger lavt (7 og 6 er ligeværdige, her 7), esset tager, og Vest kan ikke slå esset.
    s = playLead(s, 'N', 2, first);
    expect(s.current).toEqual({ leader: 'N', lead: 2, second: 7 });
    s = playThird(s, 14, first);
    expect(s.tricks[0]).toMatchObject({ second: 7, third: 14, fourth: 9, winner: 'S' });
    // Lille mod knægten: Vest lægger lavt, knægten holder.
    s = playThird(playLead(s, 'S', 4, first), 11, first);
    expect(s.tricks[1]).toMatchObject({ second: 8, third: 11, winner: 'N' });
    // Kongen: Vest kan ikke dække og lægger damen.
    s = playThird(playLead(s, 'S', 13, first), 3, first);
    expect(s.tricks[2]).toMatchObject({ second: 12, winner: 'S' });
    expect(s.won).toBe(3);
    // Sidste stik: bordet har ingen kort, og Vest kan ikke bekende.
    s = playLead(s, 'S', 5, first);
    expect(thirdHandEmpty(s)).toBe(true);
    s = playThird(s, 0, first);
    expect(s.tricks[3]).toMatchObject({ second: 0, third: 0 });
    expect(finished(s)).toBe(true);
    // Den bedste linje til 3 stik: lille fra bordet til esset, derefter mod knægten.
    expect(followsBestLine(item, 3, s)).toBe(true);
  });

  it('lader 2. hånd dække en udspillet honnør og kender en spiller, der ikke følger linjen', () => {
    let s = startPlay(item, deal('T76', 'Q98'));
    // Knægten fra bordet: Øst dækker med damen.
    s = playLead(s, 'N', 11, first);
    expect(s.current?.second).toBe(12);
    s = playThird(s, 14, first);
    // Knægten først er den dårligste linje (35,5 %), ikke en af de bedste (69,0 %).
    expect(followsBestLine(item, 3, s)).toBe(false);
  });

  it('lægger intet kort, når 3. hånd ikke kan bekende', () => {
    const void_ = bankItem('-AKJ32');
    let s = startPlay(void_, dealCards(void_, mulberry32(3)));
    s = playLead(s, 'S', 14, first);
    expect(thirdHandEmpty(s)).toBe(true);
    s = playThird(s, 0, first);
    expect(s.tricks[0].third).toBe(0);
  });

  it('finder sidningens felt i sandsynlighedsbåndet', () => {
    const d = deal('Q98', 'T76');
    const fields = bandFields(item, linesForGoal(item, 3));
    expect(fields.map((f) => f.id)).toContain(fieldIdOf(item, d.layout, d.west));
    const field = fields.find((f) => f.id === fieldIdOf(item, d.layout, d.west))!;
    expect(field.west).toBe('D x x');
  });
});
