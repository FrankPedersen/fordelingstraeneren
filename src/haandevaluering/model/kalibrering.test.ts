import { describe, expect, it } from 'vitest';
import type { Hands } from '../../domain/dealer';
import { hcpOf } from '../../system/interpreter';
import facitFile from '../content/p-model.facit.json';
import { facitOf } from '../training/scoring';
import type { FacitFile } from './facit';
import { compareMethods, makeTask, pairP, type HandTask } from './generator';
import { parseHand } from './hand';
import {
  contractFor,
  controlsOf,
  gameThreshold,
  grandAllowed,
  majorFit,
  P_MODEL,
  pOf,
  rightDecisions,
  slamAllowed,
  trumpPoints,
} from './pmodel';

// Accepttesten i SPEC-haandevaluering-kalibrering.md (version 2): trumflængden følger scripterne, HCP-grænsen i opgave 8
// er 23, og lilleslem kræver højst ét manglende nøglekort (de fire es og trumfkongen).

/** En fordeling med Syd (dig) og Nord (makker); Øst og Vest er resten af kortene. */
function deal(south: string, north: string): Hands {
  const S = parseHand(south), N = parseHand(north);
  const rest = Array.from({ length: 52 }, (_, c) => c).filter((c) => !S.includes(c) && !N.includes(c));
  return { N, E: rest.slice(0, 13), S, W: rest.slice(13) };
}

const SPADES = 0, HEARTS = 1;
/** Specens eksempel 1: begge har mindst 4 trumf. */
const EXAMPLE_1 = deal('AK752.4.KQ63.852', 'Q963.K872.94.A73');
/** "HCP har ret": ♠ E 8 6 ♥ K D 8 ♦ 8 2 ♣ D 10 4 3 2 over for ♠ D B 5 ♥ E 7 6 4 2 ♦ K 7 6 4 ♣ B, fit i ♥ (5-3). */
const HCP_RIGHT = deal('A86.KQ8.82.QT432', 'QJ5.A7642.K764.J');
/** P = 36 med fit i ♠, uden ♣E og ♠K: to manglende nøglekort. */
const P36 = deal('AQJ752.AK4.AK3.2', '9863.Q76.Q876.K5');

describe('Trumflængden: 1½ pr. trumf ud over 4, minus 1½ pr. trumf under 4', () => {
  it('trumpPoints: 3 trumf → −1½, 4 → 0, 5 → +1½, 2 → −3, 1 → −4½, 7 → +4½', () => {
    const table: [number, number][] = [[3, -1.5], [4, 0], [5, 1.5], [2, -3], [1, -4.5], [7, 4.5]];
    for (const [trumps, points] of table) expect(trumpPoints(trumps), `${trumps} trumf`).toBe(points);
    expect(P_MODEL.trumflaengde.negativ).toBe(true);
  });

  it('for parret er trumfleddet 1½ × (fittets længde − 8): 5-3 → 0, 4-4 → 0, 6-2 → 0, 5-4 → +1½, 6-3 → +1½', () => {
    const table: [number, number, number][] = [[5, 3, 0], [4, 4, 0], [6, 2, 0], [5, 4, 1.5], [6, 3, 1.5]];
    for (const [a, b, points] of table) {
      expect(trumpPoints(a) + trumpPoints(b), `${a}-${b}`).toBe(points);
      expect(points).toBe(1.5 * (a + b - 8));
    }
  });

  it('♠ E K 7 5 2 ♥ 4 ♦ K D 6 3 ♣ 8 5 2 over for ♠ D 9 6 3 ♥ K 8 7 2 ♦ 9 4 ♣ E 7 3 med fit i ♠: p = 17 og 10½, P = 27½ (uændret)', () => {
    expect(pOf(EXAMPLE_1.S, { trump: SPADES }).p).toBe(17);
    expect(pOf(EXAMPLE_1.N, { trump: SPADES }).p).toBe(10.5);
    expect(pairP(EXAMPLE_1, SPADES)).toBe(27.5);
  });

  it('"HCP har ret" med fit i ♥: Syds trumfled er −1½ og Nords +1½, P = 25¾; HCP 22 → delkontrakt, Zar 52 → udgang, P → delkontrakt', () => {
    expect(majorFit(HCP_RIGHT.S, HCP_RIGHT.N)).toBe(HEARTS);
    expect(pOf(HCP_RIGHT.S, { trump: HEARTS })).toEqual({ honors: 11.25, trump: -1.5, shortness: 1, wasted: 0, p: 10.75 });
    expect(pOf(HCP_RIGHT.N, { trump: HEARTS })).toMatchObject({ trump: 1.5, p: 15 });
    expect(pairP(HCP_RIGHT, HEARTS)).toBe(25.75);
    const m = compareMethods(HCP_RIGHT, HEARTS);
    expect(m.hcp).toMatchObject({ total: 22, decision: 'partscore' });
    expect(m.zar).toMatchObject({ total: 52, decision: 'game' });
    expect(m.decision).toBe('partscore');
    expect(m.right).toBe('hcp');
  });
});

describe('HCP-grænsen i opgave 8 er 23', () => {
  it('23 HCP er udgang, 22 HCP er delkontrakt', () => {
    expect(P_MODEL.hcpMetode.udgang).toBe(23);
    const hands23 = deal('AK752.4.KQ63.852', 'Q963.K872.A4.Q73');
    expect(hcpOf(hands23.S) + hcpOf(hands23.N)).toBe(23);
    expect(compareMethods(hands23, SPADES).hcp).toMatchObject({ total: 23, limit: 23, decision: 'game' });
    expect(compareMethods(HCP_RIGHT, HEARTS).hcp).toMatchObject({ total: 22, limit: 23, decision: 'partscore' });
  });

  it('generatoren: HCP og Zar er uenige, HCP regnes med 23, og de har ret lige ofte', () => {
    const right = { hcp: 0, zar: 0 };
    const seeds = Array.from({ length: 100 }, (_, i) => i + 1);
    for (const seed of seeds) {
      const t = makeTask('compare', seed);
      if (t.exercise !== 'compare') throw new Error('forkert opgave');
      const m = compareMethods(t.hands, t.trump);
      expect(m.hcp.limit).toBe(23);
      expect(m.hcp.decision, `seed ${seed}`).not.toBe(m.zar.decision);
      right[m.right!]++;
    }
    expect(right.hcp / seeds.length).toBeGreaterThan(0.35);
    expect(right.zar / seeds.length).toBeGreaterThan(0.35);
  }, 60_000);
});

describe('Nøglekortreglen', () => {
  it('slamAllowed: alle nøglekort, ét es eller trumfkongen mangler → ja; ét es og trumfkongen eller to es mangler → nej', () => {
    expect(slamAllowed({ aces: 4, trumpKing: true })).toBe(true);
    expect(slamAllowed({ aces: 3, trumpKing: true })).toBe(true);
    expect(slamAllowed({ aces: 4, trumpKing: false })).toBe(true);
    expect(slamAllowed({ aces: 3, trumpKing: false })).toBe(false);
    expect(slamAllowed({ aces: 2, trumpKing: true })).toBe(false);
    expect(P_MODEL.kontroller).toMatchObject({ slemHoejstManglendeNoeglekort: 1, storeslemKraeverTrumfkongen: true });
  });

  it('grandAllowed: alle fem nøglekort → ja; ét nøglekort mangler → nej', () => {
    expect(grandAllowed({ aces: 4, trumpKing: true })).toBe(true);
    expect(grandAllowed({ aces: 3, trumpKing: true })).toBe(false);
    expect(grandAllowed({ aces: 4, trumpKing: false })).toBe(false);
  });

  it('med P = 36, ét manglende es og uden trumfkongen er den rigtige beslutning udgang', () => {
    expect(majorFit(P36.S, P36.N)).toBe(SPADES);
    expect(pairP(P36, SPADES)).toBe(36);
    const controls = controlsOf(P36.S, P36.N, SPADES);
    expect(controls).toEqual({ aces: 3, trumpKing: false });
    expect(contractFor(36, controls)).toBe('game');
    expect(rightDecisions(36, controls)).toEqual(['game']);
    const task: HandTask = { exercise: 'decision', seed: 0, hands: P36, trump: SPADES, limit: 35 };
    expect(facitOf(task)).toMatchObject({ contract: 'game', right: ['game'] });
  });
});

describe('Uændret', () => {
  it("opgave 9's grænser er stadig 27½, 28 og 28½", () => {
    expect(gameThreshold('impVulnerable')).toBe(27.5);
    expect(gameThreshold('impNotVulnerable')).toBe(28);
    expect(gameThreshold('pairs')).toBe(28.5);
  });
});

describe('Facitfilen', () => {
  const file = facitFile as unknown as FacitFile;
  const fitOf = (p: FacitFile['par'][number]) => {
    const S = parseHand(p.syd), N = parseHand(p.nord);
    const trump = majorFit(S, N);
    if (trump === null) return null;
    const lengths = [S, N].map((h) => h.filter((c) => Math.floor(c / 13) === trump).length).sort((a, b) => b - a);
    return { fit: lengths.join('-'), controls: controlsOf(S, N, trump) };
  };

  it('har eksempler med 5-3-, 6-2- og 7-1-fit', () => {
    const fits = new Set(file.par.map((p) => fitOf(p)?.fit));
    for (const fit of ['5-3', '6-2', '7-1']) expect(fits, fit).toContain(fit);
  });

  it('har et eksempel med ét manglende es uden trumfkongen, hvor P siger slem, men svaret er udgang', () => {
    const example = file.par.find((p) => {
      const f = fitOf(p);
      return f !== null && f.controls.aces === 3 && !f.controls.trumpKing && p.facit.P !== null && p.facit.P >= 35;
    });
    expect(example).toBeDefined();
    expect(example!.facit.kontrakt).toBe('game');
  });
});
