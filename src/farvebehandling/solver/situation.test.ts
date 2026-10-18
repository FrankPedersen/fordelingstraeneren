import { describe, expect, it } from 'vitest';
import { parseCards, type Rank } from '../model/cards';
import { STANDARD, type Situation } from '../model/situation';
import { buildGame } from './game';
import { handleSolve, type SolveRequest } from './results';
import { solveGame } from './solve';

// SPEC-analyse-situation.md, leverancetrin 1: situationen i løserens forespørgsel. Facit er regnet med løseren
// (18. oktober 2026). Bordet / hånden = Nord / Syd som i de andre tests.

const percent2 = (x: number) => Math.round(x * 10000) / 100;
const situation = (known: [number, number], maxHp: [number, number]): Situation => ({
  known: { west: known[0], east: known[1] },
  maxHp: { west: maxHp[0], east: maxHp[1] },
});

function goal(north: Rank[], south: Rank[], g: number, s?: Situation) {
  const response = handleSolve({ kind: 'goal', north, south, goal: g, situation: s });
  if (response.kind !== 'goal') throw new Error('forkert svar');
  return response;
}
/** Udspillets værdi: hånd og et kort i den spillede gruppe af ligeværdige kort. */
function lead(response: ReturnType<typeof goal>, hand: 'N' | 'S', card: Rank) {
  const found = response.result.leads.find((l) => l.hand === hand && l.high >= card && card >= l.low);
  if (!found) throw new Error(`intet udspil ${hand} ${card}`);
  return percent2(found.value);
}

// E D B 10 / 6 5 4 3 2: Vest og Øst har K 9 8 7.
const EDB10 = parseCards('AQJT'), X65432 = parseCards('65432');
// B 5 / E D 7 6 4 2: Vest og Øst har K 10 9 8 3.
const B5 = parseCards('J5'), EDX = parseCards('AQ7642');
// E B 4 3 / 6 5 2: K og D ligger i samme hul.
const EB43 = parseCards('AJ43'), X652 = parseCards('652');

describe('Situationen i løseren', { timeout: 300_000 }, () => {
  it('standardsituationen giver præcis samme svar som uden situation', () => {
    const requests: SolveRequest[] = [
      { kind: 'goal', north: parseCards('J432'), south: parseCards('AT65'), goal: 3 },
      { kind: 'tricks', north: parseCards('J432'), south: parseCards('AT65') },
      { kind: 'goal', north: parseCards('AKJ32'), south: parseCards('7654'), goal: 5 },
    ];
    for (const request of requests) expect(handleSolve({ ...request, situation: STANDARD })).toEqual(handleSolve(request));
  });

  it('E D B 10 / 6 5 4 3 2, 5 stik, kendte kort Vest 5 og Øst 2: lille fra begge hænder 42,11 %, esset 12,49 %', () => {
    const r = goal(EDB10, X65432, 5, situation([5, 2], [10, 10]));
    expect(lead(r, 'S', 2)).toBe(42.11);
    expect(lead(r, 'N', 14)).toBe(12.49);
    expect(percent2(r.result.value)).toBe(42.11);
  });

  it('E D B 10 / 6 5 4 3 2, 5 stik, Øst maks. 0 hp: lille fra begge hænder 100,00 %', () => {
    const r = goal(EDB10, X65432, 5, situation([0, 0], [10, 0]));
    expect(lead(r, 'S', 2)).toBe(100);
    expect(percent2(r.result.value)).toBe(100);
  });

  it('E D B 10 / 6 5 4 3 2, 5 stik, Vest maks. 0 hp: 12,43 % (esset eller lille fra hånden)', () => {
    const r = goal(EDB10, X65432, 5, situation([0, 0], [0, 10]));
    expect(percent2(r.result.value)).toBe(12.43);
    expect(lead(r, 'N', 14)).toBe(12.43);
    expect(lead(r, 'S', 2)).toBe(12.43);
  });

  it('E D B 10 / 6 5 4 3 2, 5 stik, Vest maks. 0 hp og kendte kort Vest 5, Øst 2: 6,86 %', () => {
    expect(percent2(goal(EDB10, X65432, 5, situation([5, 2], [0, 10])).result.value)).toBe(6.86);
  });

  it('B 5 / E D 7 6 4 2, 5 stik, Vest maks. 0 hp: knægten fra bordet 84,78 %', () => {
    const r = goal(B5, EDX, 5, situation([0, 0], [0, 10]));
    expect(lead(r, 'N', 11)).toBe(84.78);
  });

  it('en egen linje og flest stik regnes også med situationen', () => {
    const line = handleSolve({
      kind: 'line', north: B5, south: EDX, goal: 5, situation: situation([0, 0], [0, 10]),
      line: { id: 'egen', text: 'Knægten fra bordet', steps: [{ leadFrom: 'N', card: 'J' }] },
    });
    if (line.kind !== 'line' || !line.lead) throw new Error('forkert svar');
    expect(percent2(line.lead.value)).toBe(84.78);
    // Øst har ingen honnør: kipningen giver altid 5 stik.
    const tricks = handleSolve({ kind: 'tricks', north: EDB10, south: X65432, situation: situation([0, 0], [10, 0]) });
    if (tricks.kind !== 'tricks') throw new Error('forkert svar');
    expect(tricks.result.value).toBeCloseTo(5, 9);
  });

  it('svaret har situationens vægte: udelukkede sidninger har vægt 0, og nævneren er summen', () => {
    const r = goal(EDB10, X65432, 5, situation([0, 0], [0, 10]));
    const weights = r.base.layouts.map((l) => BigInt(l.weight));
    expect(weights.reduce((a, b) => a + b, 0n).toString()).toBe(r.base.denominator);
    expect(weights.filter((w) => w === 0n).length).toBeGreaterThan(0);
    expect(r.base.layouts).toHaveLength(r.result.leads[0].layouts.length);
  });

  it('delingen af huller: uden grænse giver det delte spil samme værdi som det udelte', () => {
    for (const [north, south, goals] of [[EB43, X652, [3, 2]], [parseCards('AJ2'), parseCards('T43'), [2]], [parseCards('A932'), parseCards('JT54'), [3]]] as const) {
      for (const g of goals) {
        const whole = solveGame(buildGame(north, south, { objective: { kind: 'goal', goal: g } }));
        const split = buildGame(north, south, { objective: { kind: 'goal', goal: g }, splitHonors: true });
        expect(split.parts.length).toBeGreaterThan(split.gaps.length);
        expect(solveGame(split).value).toBeCloseTo(whole.value, 4);
      }
    }
  });

  it('delingen af huller: uden blandede huller er det delte spil identisk med det udelte', () => {
    for (const [north, south] of [[EDB10, X65432], [B5, EDX]]) {
      const objective = { kind: 'goal', goal: 5 } as const;
      expect(buildGame(north, south, { objective, splitHonors: true })).toEqual(buildGame(north, south, { objective }));
    }
  });
});
