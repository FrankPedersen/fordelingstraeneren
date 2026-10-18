import { describe, expect, it } from 'vitest';
import goldenText from './uden-situation.json?raw';
import { parseCards } from '../model/cards';
import type { Vacant } from '../model/layouts';
import { TEST_BANK } from '../testBank';
import { buildGame, type Game, type Objective } from './game';
import { handleSolve, type SolveRequest } from './results';

/**
 * Spillet og løserens svar uden situation skal være præcis som før SPEC-analyse-situation (tagget
 * v8-foer-analyse-situation). Fixturen er skrevet af den uændrede kode: `FB_GOLDEN=skriv npx vitest run uden-situation`.
 */

// Vitest kan ikke importere node:fs statisk uden Node-typer (som i ui/components.test.ts).
const nodeFs = 'node:fs';
const fs = (await import(/* @vite-ignore */ nodeFs)) as { writeFileSync(path: URL, data: string): void };
const write = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.FB_GOLDEN === 'skriv';

/** FNV-1a over en række tal. */
function hash(values: Iterable<number | string>): string {
  let h = 0x811c9dc5;
  for (const v of values) {
    for (const ch of String(v) + ',') {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
  }
  return h.toString(16).padStart(8, '0');
}

const ARRAYS = [
  'kind', 'payoff', 'tricks', 'opponentHigh', 'parent', 'parentSlot', 'childStart', 'childCount', 'children', 'subtreeEnd',
  'slotHand', 'slotHigh', 'slotLow', 'itemLayout', 'itemNode', 'itemChildStart', 'itemChildren', 'nodeItemStart', 'nodeItemCount',
] as const;

/** Spillets struktur som hashes: alle typede arrays, hullerne, sidningerne og nævneren. */
function fingerprint(game: Game): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of ARRAYS) out[name] = hash(game[name]);
  out.declarer = hash(game.declarer.flatMap((d) => [d.rank, d.hand]));
  out.gaps = hash(game.gaps);
  out.layouts = hash(game.layouts.flatMap((l) => [...l.west, l.count, l.weight.toString()]));
  out.layoutWeight = hash(game.layoutWeight);
  out.denominator = game.denominator.toString();
  out.root = String(game.root);
  return out;
}

interface GameCase {
  id: string;
  objective: Objective;
  vacant?: Vacant;
}

// Hver 16. kombination i banken (2–8 manglende kort), med det højeste mål og flest stik; hver fjerde også med en optælling.
const sample = TEST_BANK.filter((_, i) => i % 16 === 0);
const gameCases: GameCase[] = sample.flatMap((item, i) => {
  const goal = Math.max(...item.combination.goals);
  const cases: GameCase[] = [
    { id: item.combination.id, objective: { kind: 'goal', goal } },
    { id: item.combination.id, objective: { kind: 'tricks' } },
  ];
  if (i % 4 === 0) cases.push({ id: item.combination.id, objective: { kind: 'goal', goal }, vacant: { west: 9, east: 11 } });
  return cases;
});
const caseKey = (c: GameCase) => `${c.id} ${c.objective.kind === 'goal' ? c.objective.goal : 'stik'}${c.vacant ? ` ${c.vacant.west}/${c.vacant.east}` : ''}`;

const cards = (id: string) => id.split('-').map(parseCards) as [number[], number[]];

// Linje A fra specen: lille fra bordet mod 10'eren, derefter esset.
const lineA = {
  id: 'A',
  text: "Lille fra bordet mod 10'eren, derefter esset",
  steps: [
    { leadFrom: 'N' as const, card: 'low', third: { ifSecondPlays: 'low', play: 'T', else: 'A' }, branches: [{ if: { fallen: ['A'] }, goto: 3 }] },
    { leadFrom: 'S' as const, card: 'A' },
  ],
};
const B432 = parseCards('J432'), ET65 = parseCards('AT65');
const EKB32 = parseCards('AKJ32'), X7654 = parseCards('7654');
const requests: Record<string, SolveRequest> = {
  'B432/ET65 mål 3': { kind: 'goal', north: B432, south: ET65, goal: 3 },
  'B432/ET65 mål 2': { kind: 'goal', north: B432, south: ET65, goal: 2 },
  'B432/ET65 stik': { kind: 'tricks', north: B432, south: ET65 },
  'B432/ET65 linje A': { kind: 'line', north: B432, south: ET65, goal: 3, line: lineA },
  'EKB32/7654 mål 5': { kind: 'goal', north: EKB32, south: X7654, goal: 5 },
  'EKB32/7654 mål 4': { kind: 'goal', north: EKB32, south: X7654, goal: 4 },
  'EKB32/7654 stik': { kind: 'tricks', north: EKB32, south: X7654 },
};

interface Golden {
  games: Record<string, Record<string, string>>;
  solve: Record<string, unknown>;
}

describe('Uden situation er spillet og svarene præcis som før', { timeout: 300_000 }, () => {
  if (write) {
    it('skriver fixturen', () => {
      const golden: Golden = { games: {}, solve: {} };
      for (const c of gameCases) {
        const [north, south] = cards(c.id);
        golden.games[caseKey(c)] = fingerprint(buildGame(north, south, { objective: c.objective, vacant: c.vacant }));
      }
      for (const [name, request] of Object.entries(requests)) golden.solve[name] = JSON.parse(JSON.stringify(handleSolve(request)));
      fs.writeFileSync(new URL('./uden-situation.json', import.meta.url), JSON.stringify(golden, null, 1) + '\n');
    });
    return;
  }
  const golden = JSON.parse(goldenText) as Golden;

  it(`spillet bygges som før for ${gameCases.length} kombinationer og mål`, () => {
    expect(Object.keys(golden.games)).toHaveLength(gameCases.length);
    for (const c of gameCases) {
      const [north, south] = cards(c.id);
      expect({ key: caseKey(c), ...fingerprint(buildGame(north, south, { objective: c.objective, vacant: c.vacant })) }).toEqual({
        key: caseKey(c),
        ...golden.games[caseKey(c)],
      });
    }
  });

  for (const [name, request] of Object.entries(requests)) {
    it(`handleSolve giver præcis samme svar: ${name}`, () => {
      expect(JSON.parse(JSON.stringify(handleSolve(request)))).toEqual(golden.solve[name]);
    });
  }
});
