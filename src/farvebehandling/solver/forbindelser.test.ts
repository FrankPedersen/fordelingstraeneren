import { describe, expect, it } from 'vitest';
import { parseCards, type Rank } from '../model/cards';
import { gameOptionsFor, STANDARD, type Situation } from '../model/situation';
import { buildGame, layoutOf, type Objective } from './game';
import { handleSolve, type SolveRequest } from './results';

// SPEC-forbindelser.md, leverancetrin 1: forbindelserne i spillet. Bordet / hånden = Nord / Syd som i de andre tests.
// Facit for den blokerede farve står i specen (regnet med løseren ubegrænset og med fordelingen af de 7 manglende kort).

const percent2 = (x: number) => Math.round(x * 10000) / 100;
const connections = (lead: 'N' | 'S', north: number | null, south: number | null): Situation => ({
  ...STANDARD,
  entries: { north, south },
  lead,
});

function goal(north: Rank[], south: Rank[], g: number, s?: Situation) {
  const response = handleSolve({ kind: 'goal', north, south, goal: g, situation: s });
  if (response.kind !== 'goal') throw new Error('forkert svar');
  return response;
}
const chance = (north: Rank[], south: Rank[], g: number, s?: Situation) => percent2(goal(north, south, g, s).result.value);

// Bordet E, hånden K D B 3 2: Vest og Øst har 10 9 8 7 6 5 4.
const ACE = parseCards('A'), KQJ32 = parseCards('KQJ32');
// E D B 10 / 6 5 4 3 2: Vest og Øst har K 9 8 7.
const EDB10 = parseCards('AQJT'), X65432 = parseCards('65432');
// 3 2 / K D B 10 9: modspillet har esset og fem små.
const X32 = parseCards('32'), KQJT9 = parseCards('KQJT9');

describe('Forbindelser i løseren (SPEC-forbindelser.md)', { timeout: 300_000 }, () => {
  it('uden begrænsning, og med indgange ≥ antal runder for begge hænder, er svaret præcis som i dag', () => {
    const requests: SolveRequest[] = [
      { kind: 'goal', north: parseCards('J432'), south: parseCards('AT65'), goal: 3 },
      { kind: 'tricks', north: parseCards('J432'), south: parseCards('AT65') },
      { kind: 'goal', north: parseCards('AKJ32'), south: parseCards('7654'), goal: 5 },
      { kind: 'goal', north: EDB10, south: X65432, goal: 5 },
    ];
    for (const request of requests) {
      const today = handleSolve(request);
      const rounds = Math.max(request.north.length, request.south.length);
      for (const s of [connections('N', null, null), connections('S', rounds, rounds)]) {
        expect(handleSolve({ ...request, situation: s })).toEqual(today);
      }
    }
  });

  it('spillet med indgange ≥ antal runder (eller ubegrænset) er det samme spil som uden forbindelser', () => {
    const cases: [Rank[], Rank[], Objective][] = [
      [parseCards('J432'), parseCards('AT65'), { kind: 'goal', goal: 3 }],
      [parseCards('AKJ32'), parseCards('7654'), { kind: 'goal', goal: 5 }],
      [EDB10, X65432, { kind: 'tricks' }],
    ];
    for (const [north, south, objective] of cases) {
      const today = buildGame(north, south, { objective });
      expect(buildGame(north, south, { objective, entries: { north: null, south: null }, lead: 'N' })).toEqual(today);
      expect(buildGame(north, south, { objective, entries: { north: 5, south: 5 }, lead: 'S' })).toEqual(today);
    }
  });

  it('bordet E, hånden K D B 3 2, ubegrænset: 4 stik 100,00 %, 5 stik 62,17 %', () => {
    expect(chance(ACE, KQJ32, 4)).toBe(100);
    expect(chance(ACE, KQJ32, 5)).toBe(62.17);
  });

  it('samme, Nord inde, Syd 0 indgange: 4 stik 0,00 % og 5 stik 0,00 % (esset vinder, og hånden kan ikke nås)', () => {
    const r = goal(ACE, KQJ32, 4, connections('N', null, 0));
    expect(percent2(r.result.value)).toBe(0);
    // Udspilsvalget er kun hænder, der kan nås: Nord er inde, og Syd har ingen indgang.
    expect(r.result.leads.map((l) => l.hand)).toEqual(['N']);
    expect(chance(ACE, KQJ32, 5, connections('N', null, 0))).toBe(0);
  });

  it('samme, Syd inde, Syd 0 og Nord 0 indgange: 4 stik 0,00 % (esset må tage stikket)', () => {
    const r = goal(ACE, KQJ32, 4, connections('S', 0, 0));
    expect(percent2(r.result.value)).toBe(0);
    expect(r.result.leads.every((l) => l.hand === 'S')).toBe(true);
  });

  it('samme, Nord inde, Syd 1 indgang: 4 stik 100,00 %, 5 stik 62,17 %', () => {
    expect(chance(ACE, KQJ32, 4, connections('N', null, 1))).toBe(100);
    expect(chance(ACE, KQJ32, 5, connections('N', null, 1))).toBe(62.17);
  });

  it('samme, Syd inde, Syd 1 indgang: 4 stik 100,00 %, 5 stik 62,17 %', () => {
    expect(chance(ACE, KQJ32, 4, connections('S', null, 1))).toBe(100);
    expect(chance(ACE, KQJ32, 5, connections('S', null, 1))).toBe(62.17);
  });

  it('E D B 10 / 6 5 4 3 2, 5 stik, Syd inde, Syd 2 indgange, Nord ubegrænset: 45,22 %, og Kxxx–renonce taber', () => {
    // Tallet er godkendt af Frank (20. oktober 2026). Ubegrænset er det 50,00 %; Kxxx–renonce kræver tre indgange til hånden.
    const s = connections('S', null, 2);
    const r = goal(EDB10, X65432, 5, s);
    expect(percent2(r.result.value)).toBe(45.22);
    // Sidningen med kongen og tre små hos Vest (9 8 7) og renonce hos Øst.
    const game = buildGame(EDB10, X65432, { objective: { kind: 'goal', goal: 5 }, ...gameOptionsFor(EDB10, X65432, s) });
    const kxxx = layoutOf(game, [13, 9, 8, 7]);
    expect(r.result.leads[r.result.best].layouts[kxxx]).toBe(0);
  });

  it('genvejen "modparten har ingen højere kort" gælder kun uden begrænsning: K D B / E er blokeret', () => {
    // Alle spilførerens kort er vindere. Med Nord inde, ingen indgang til Nord og én til Syd kan begge hænder nås, men
    // esset tager et af Nords stik, og Syd kan ikke komme tilbage til Nord: kun 1 stik.
    const KQJ = parseCards('KQJ');
    expect(chance(KQJ, ACE, 3)).toBe(100);
    expect(chance(KQJ, ACE, 2, connections('N', 0, 1))).toBe(0);
    expect(chance(KQJ, ACE, 3, connections('N', 1, 1))).toBe(100);
  });

  it('når modspillet vinder et stik, er ingen hånd inde, og næste udspil bruger en indgang', () => {
    // 3 2 / K D B 10 9, 4 stik: ubegrænset 100 %. Modspillet tager esset straks; uden indgange kan hånden ikke nås igen.
    expect(chance(X32, KQJT9, 4)).toBe(100);
    expect(chance(X32, KQJT9, 4, connections('S', 0, 0))).toBe(0);
    expect(chance(X32, KQJT9, 4, connections('S', 0, 1))).toBe(100);
  });
});
