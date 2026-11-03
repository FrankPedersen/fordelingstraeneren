import { describe, expect, it } from 'vitest';
import solutionsText from '../content/solutions.json?raw';
import { parseCards } from '../model/cards';
import type { CombinationSolution } from '../precompute';
import { buildGame } from './game';
import { validateLine, type LineStep } from './lines';
import { leadTricks } from './results';

/**
 * De 31 kombinationer, hvor linjeformatet afviste en gemt linje med LINES_VERSION 3 (SPEC-linjeformat-39.md). Hele banken
 * tjekkes af `node scripts/tjek-linjer.ts` (ca. 4½ minut); her ligger de kombinationer, fejlen faktisk fandtes i.
 */
const BERØRTE = [
  '2-AKJ543', '2-AKJ943', '2-AKJ9873', '2-AKJT43', '2-AKQ93', '2-AKQ943', '2-AKQT3', '2-AKT98', '432-AKT95', '5432-AKT9', 'A2-KJ943',
  'AJ2-K943', 'AK2-J543', 'AK2-J983', 'AK2-J9843', 'J2-AK983', 'J2-AQ98', 'J32-AK54', 'J32-AK94', 'J32-AK954', 'J32-AK98', 'J32-AK984',
  'J432-AK95', 'J982-AK43', 'K2-AJ93', 'K2-AJ943', 'K32-AJ94', 'K82-AT93', 'Q2-AT9', 'T32-AK94', 'T32-AK954',
];

const solutions = JSON.parse(solutionsText).combinations as Record<string, CombinationSolution>;
const low = (play: string, other: string) => ({ ifSecondPlays: 'low', play, else: other });

function stored(id: string, goal: number | 'flest') {
  const c = solutions[id];
  const g = goal === 'flest' ? c.tricks! : c.goals[String(goal)];
  return { c, g, best: g.leads[g.best] };
}

describe('Gemte linjer kan spilles som helhed (SPEC-linjeformat-39.md)', { timeout: 180_000 }, () => {
  it('linjeformatet afviser ingen gemte linjer i de berørte kombinationer', () => {
    const errors: string[] = [];
    let lines = 0;
    for (const id of BERØRTE) {
      const c = solutions[id];
      const north = parseCards(c.north), south = parseCards(c.south);
      const tricksGame = buildGame(north, south, { objective: { kind: 'tricks' } });
      const check = (goal: string, steps: LineStep[], game: ReturnType<typeof buildGame>) => {
        if (!steps.length) return;
        lines++;
        for (const e of validateLine(game, { id: 'x', text: '', steps })) errors.push(`${id} ${goal}: ${e}`);
      };
      for (const [goal, g] of Object.entries(c.goals)) {
        const game = buildGame(north, south, { objective: { kind: 'goal', goal: Number(goal) } });
        // Også i spillet med flest stik, for dér regnes stik pr. sidning.
        for (const l of g.leads) {
          check(goal, l.line, game);
          check(`${goal} med flest stik`, l.line, tricksGame);
        }
      }
      for (const l of c.tricks?.leads ?? []) check('flest', l.line, tricksGame);
    }
    expect(errors).toEqual([]);
    expect(lines).toBeGreaterThan(400);
  });

  it('2 / E K B 5 4 3, 5 stik: trin 2 kan spilles efter alle grene af trin 1', () => {
    expect(stored('2-AKJ543', 5).best.line).toEqual([
      { leadFrom: 'N', card: 'low', third: low('J', 'A') },
      { leadFrom: 'S', card: 'high' },
      { leadFrom: 'S', card: 'high' },
    ]);
    expect(stored('2-AKJ543', 5).best.steps).toEqual([
      'Lille fra bordet mod knægten (kipning); lægger Øst en honnør, tages den med esset.',
      'Esset og kongen slås.',
    ]);
  });

  it('de andre former: kortet hos 3. hånd og linjer, der slutter før et trin', () => {
    // Esset er brugt i trin 1, og 3. hånd har det ikke længere i trin 2.
    expect(stored('Q2-AT9', 'flest').g.leads[1].line).toEqual([
      { leadFrom: 'N', card: 'low', third: low('low', 'A') },
      { leadFrom: 'N', card: 'Q', third: low('low', 'high') },
    ]);
    // Det højeste kort følger ikke løserens plan i trin 3, så linjen slutter før det.
    expect(stored('J32-AK94', 3).g.leads[0].line).toEqual([
      { leadFrom: 'N', card: 'J', third: low('low', 'A') },
      { leadFrom: 'S', card: 'high' },
    ]);
    expect(stored('K82-AT93', 3).g.leads[2].line).toEqual([{ leadFrom: 'N', card: 'low', third: low('T', 'A') }]);
  });

  it('stik pr. sidning regnes på hele linjen, og en afvist linje fejler højt', () => {
    const { c, best } = stored('2-AKJ543', 5);
    const north = parseCards(c.north), south = parseCards(c.south);
    expect(leadTricks(north, south, best)).toEqual(best.tricks);
    const rejected: LineStep[] = [{ leadFrom: 'N', card: 'low', third: low('J', 'A') }, { leadFrom: 'S', card: 'A' }];
    expect(() => leadTricks(north, south, { ...best, line: rejected })).toThrow(/ugyldig/);
  });
});
