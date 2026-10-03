import { describe, expect, it } from 'vitest';
import { parseCards } from '../model/cards';
import { buildGame, FOURTH, LEAD, layoutOf, SECOND, THIRD, type Game } from './game';
import { validateLine, type Line } from './lines';
import { solve, solveGame, solveLine } from './solve';

const goal = (n: number) => ({ kind: 'goal', goal: n }) as const;
const percent = (x: number) => Math.round(x * 1000) / 10;

/** Linje A: lille fra bordet mod 10'eren, derefter esset. Har esset allerede taget første stik, slutter linjen. */
const lineA: Line = {
  id: 'A',
  text: "Lille fra bordet mod 10'eren, derefter esset",
  steps: [
    {
      leadFrom: 'N',
      card: 'low',
      third: { ifSecondPlays: 'low', play: 'T', else: 'A' },
      branches: [{ if: { fallen: ['A'] }, goto: 3 }],
    },
    { leadFrom: 'S', card: 'A' },
  ],
};

/** Linje B: esset, derefter lille fra bordet mod 10'eren. */
const lineB: Line = {
  id: 'B',
  text: "Esset, derefter lille fra bordet mod 10'eren",
  steps: [
    { leadFrom: 'S', card: 'A' },
    { leadFrom: 'N', card: 'low', third: { ifSecondPlays: 'low', play: 'T', else: 'low' } },
  ],
};

const B432 = parseCards('J432'), ET65 = parseCards('AT65');

describe('Linjer i B432 / E 10 6 5', { timeout: 120_000 }, () => {
  const game3 = buildGame(B432, ET65, { objective: goal(3) });
  const game2 = buildGame(B432, ET65, { objective: goal(2) });
  // Hver linje løses kun én gang, selv om flere tests bruger den.
  const cache = new Map<string, ReturnType<typeof solveLine>>();
  const line = (game: Game, l: Line) => {
    const key = `${l.id}${game === game3 ? 3 : 2}`;
    if (!cache.has(key)) cache.set(key, solveLine(game, l));
    return cache.get(key)!;
  };

  it('linje A = 37,3 % for 3 stik og 94,3 % for 2 stik', () => {
    expect(percent(line(game3, lineA).value)).toBe(37.3);
    expect(percent(line(game2, lineA).value)).toBe(94.3);
  });

  it('linje B = 6,8 % for 3 stik og 100 % for 2 stik', () => {
    expect(percent(line(game3, lineB).value)).toBe(6.8);
    expect(percent(line(game2, lineB).value)).toBe(100);
  });

  it('sidningen Kxx–Dx: linje A giver 3 stik, linje B giver 2', () => {
    // Vest K 9 8, Øst D 7.
    const layout3 = layoutOf(game3, parseCards('K98'));
    expect(line(game3, lineA).layoutValues[layout3]).toBe(1);
    expect(line(game3, lineB).layoutValues[layout3]).toBe(0);
    const layout2 = layoutOf(game2, parseCards('K98'));
    expect(line(game2, lineB).layoutValues[layout2]).toBe(1);
  });

  it('sandsynlighedsbåndets felter summer til 100 % for hver linje, også med en optælling', () => {
    // Båndet har ét felt pr. sidning med sidningens chance; feltet er grønt eller ej efter linjens resultat.
    for (const game of [game3, buildGame(B432, ET65, { objective: goal(3), vacant: { west: 7, east: 11 } })]) {
      const total = game.layouts.reduce((s, l) => s + l.weight, 0n);
      expect(total).toBe(game.denominator);
    }
    expect(line(game3, lineA).layoutValues).toHaveLength(game3.layouts.length);
  });

  it('løserens bedste linje giver 37,3 % for 3 stik og 100 % for 2 stik', () => {
    const three = solveGame(game3);
    expect(percent(three.value)).toBe(37.3);
    expect(three.leads[three.best].certified).toBe(true);
    // Den bedste linje begynder med et lille kort fra bordet.
    expect(three.leads[three.best].lead).toMatchObject({ hand: 'N', low: 2 });
    expect(percent(solveGame(game2).value)).toBe(100);
  });
});

describe('Linjeformatet', { timeout: 60_000 }, () => {
  const game = buildGame(B432, ET65, { objective: goal(3) });

  it('godkender gyldige linjer', () => {
    expect(validateLine(game, lineA)).toEqual([]);
    expect(validateLine(game, lineB)).toEqual([]);
  });

  it('afviser en opgave med et umuligt trin', () => {
    // Uden grenen kan esset være brugt i første stik, og så er trin 2 umuligt.
    const impossible: Line = { ...lineA, steps: [{ ...lineA.steps[0], branches: [] }, lineA.steps[1]] };
    expect(validateLine(game, impossible).join(' ')).toMatch(/Trin 2: E kan ikke spilles/);
    const notHeld: Line = { id: 'X', text: '', steps: [{ leadFrom: 'N', card: 'A' }] };
    expect(validateLine(game, notHeld).join(' ')).toMatch(/Trin 1/);
  });

  it('afviser en goto til næste trin', () => {
    const next: Line = {
      id: 'X',
      text: '',
      steps: [{ leadFrom: 'S', card: 'A', branches: [{ if: { showsOut: 'V' }, goto: 2 }] }, { leadFrom: 'N', card: 'low' }],
    };
    expect(validateLine(game, next).join(' ')).toMatch(/peger på det næste trin/);
  });
});

/** Følger strategien fra roden gennem de givne modspilshandlinger og returnerer knuden. */
function follow(game: Game, strategy: Int8Array, start: number, defenderSlots: ((game: Game, node: number) => number)[]): number {
  let node = start;
  let d = 0;
  while (d < defenderSlots.length) {
    const k = game.kind[node];
    if (k === LEAD || k === THIRD) node = game.children[game.childStart[node] + strategy[node]];
    else if (k === SECOND || k === FOURTH) node = game.children[game.childStart[node] + defenderSlots[d++](game, node)];
    else break;
  }
  return node;
}
/** Barn-slot for et modspilskort i hullet, der indeholder `rank`. */
const playFrom = (rank: number) => (game: Game, node: number) => {
  for (let x = 0; x < game.childCount[node]; x++) {
    const s = game.childStart[node] + x;
    if (game.slotHigh[s] >= rank && rank >= game.slotLow[s]) return x;
  }
  throw new Error(`Intet hul med ${rank}`);
};

describe('Løseren med optimalt modspil', { timeout: 120_000 }, () => {
  it('vælger fald med bordet E K B 3 2 og hånden 7 6 5 4 (53,1 %) frem for kipning (51,4 %)', () => {
    const north = parseCards('AKJ32'), south = parseCards('7654');
    const game = buildGame(north, south, { objective: goal(5) });
    const best = solveGame(game);
    expect(percent(best.value)).toBe(53.1);
    const finesse: Line = {
      id: 'kipning',
      text: 'Esset først og så kipning',
      steps: [
        { leadFrom: 'N', card: 'A' },
        { leadFrom: 'S', card: 'low', third: { ifSecondPlays: 'low', play: 'J', else: 'K' } },
      ],
    };
    expect(percent(solveLine(game, finesse).value)).toBe(51.4);
  });

  it('begrænset valg: kipper mod knægten, når Øst lægger damen under esset eller kongen (64,7 %)', () => {
    const game = buildGame(parseCards('AKT32'), parseCards('7654'), { objective: goal(5) });
    const solution = solveGame(game);
    // Linjen, der begynder med en top-honnør fra bordet (Øst er 2. hånd).
    const top = solution.leads.find((l) => l.lead.hand === 'N' && l.lead.high === 14)!;
    expect(top.certified).toBe(true);
    // Øst lægger en honnør fra D B, Syd lægger lavt, Vest lægger et lille kort; så spilles mod bordet.
    const second = follow(game, top.strategy, top.root, [playFrom(12), playFrom(9)]);
    expect(game.kind[second]).toBe(LEAD);
    const leadSlot = game.childStart[second] + top.strategy[second];
    expect(game.slotHand[leadSlot]).toBe(1); // fra hånden
    // Vest lægger lavt: bordet kipper med 10'eren.
    const third = follow(game, top.strategy, second, [playFrom(9)]);
    expect(game.kind[third]).toBe(THIRD);
    const finesseSlot = game.childStart[third] + top.strategy[third];
    expect(game.slotLow[finesseSlot]).toBe(10);
    // Chancen ved kipningen: singleton honnør hos Øst (6,22 % for hver af D og B) mod D B hos Øst (6,78 %).
    // Den abstrakte sidning "Vest har én af D B" tæller allerede begge honnører med; i det konkrete spil svarer det
    // til, at Øst med D B kun lægger damen halvdelen af gangene (6,22 % mod 3,39 %).
    const singleton = Number(game.layouts[layoutOf(game, parseCards('J98'))].weight);
    const doubleton = Number(game.layouts[layoutOf(game, parseCards('98'))].weight);
    expect(percent(singleton / (singleton + doubleton))).toBe(64.7);
  });

  it('giver ikke 100 % med hånden E 10 8 2 og bordet K B 9 3 (case 73, 4 stik)', () => {
    const solution = solve(parseCards('KJ93'), parseCards('AT82'), goal(4));
    expect(solution.value).toBeLessThan(0.6);
    expect(percent(solution.value)).toBe(52.8);
  });

  it('bruger ikke kort, spilføreren ikke har set: sidninger, der ser ens ud, får samme beslutning', () => {
    const game = buildGame(B432, ET65, { objective: goal(3) });
    const best = solveGame(game).leads[0];
    // Strategien er en tabel over offentlige knuder; to sidninger med samme spillede kort når samme knude.
    const kxx = layoutOf(game, parseCards('K98'));
    const dxx = layoutOf(game, parseCards('Q98'));
    expect(kxx).toBe(dxx); // K og D er ligeværdige for spilføreren: samme abstrakte sidning
    for (let node = best.root; node < game.subtreeEnd[best.root]; node++) {
      const k = game.kind[node];
      if (k === LEAD || k === THIRD) expect(best.strategy[node]).toBeGreaterThanOrEqual(0);
    }
  });
});
