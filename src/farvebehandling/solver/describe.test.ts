import { describe, expect, it } from 'vitest';
import { parseCards } from '../model/cards';
import { describeLine } from './describe';
import { buildGame } from './game';
import { validateLine } from './lines';
import { solveGame, solveLine } from './solve';

const goal = (n: number) => ({ kind: 'goal', goal: n }) as const;

/** Løserens bedste linje for et mål og dens beskrivelse. Bordet (Nord) først, så hånden (Syd). */
function bestLine(north: string, south: string, n: number) {
  const game = buildGame(parseCards(north), parseCards(south), { objective: goal(n) });
  const solution = solveGame(game);
  const lead = solution.leads[solution.best];
  return { game, lead, text: describeLine(game, lead.strategy, lead.slot) };
}

describe('Linjerne på dansk', { timeout: 120_000 }, () => {
  it('B432 / E 10 6 5, 3 stik: lille mod 10\'eren, derefter esset', () => {
    const game = buildGame(parseCards('J432'), parseCards('AT65'), { objective: goal(3) });
    const solution = solveGame(game);
    const best = solution.leads[solution.best];
    const text = describeLine(game, best.strategy, best.slot);
    expect(text.steps).toEqual(["Lille fra bordet mod 10'eren (kipning); lægger Øst en honnør, tages den med esset.", 'Slå esset.']);
    // Linjen i linjeformatet er gyldig og giver samme chance, når løseren spiller videre efter sidste trin.
    expect(validateLine(game, { ...text.line, id: 'A' })).toEqual([]);
    expect(solveLine(game, { ...text.line, id: 'A' }).value).toBeCloseTo(best.value, 6);
    // Esset først giver 6,8 %.
    const ace = solution.leads.find((l) => l.lead.hand === 'S' && l.lead.high === 14)!;
    expect(describeLine(game, ace.strategy, ace.slot).steps).toEqual(['Slå esset.']);
  });

  it('E K B 3 2 / 7 6 5 4, 5 stik: slå esset og kongen', () => {
    const game = buildGame(parseCards('AKJ32'), parseCards('7654'), { objective: goal(5) });
    const solution = solveGame(game);
    const best = solution.leads[solution.best];
    expect(describeLine(game, best.strategy, best.slot).steps).toEqual(['Slå esset og kongen.']);
  });

  it('E D 6 5 / 4 3 2, 3 stik: mod damen (kipning), og den gemte linje giver løserens chance', () => {
    const { game, lead, text } = bestLine('432', 'AQ65', 3);
    expect(text.steps).toEqual(['Lille fra bordet mod damen (kipning); lægger Øst en honnør, tages den med esset.']);
    expect(text.line.steps).toEqual([{ leadFrom: 'N', card: 'low', third: { ifSecondPlays: 'low', play: 'Q', else: 'A' } }]);
    expect(validateLine(game, { ...text.line, id: 'A' })).toEqual([]);
    expect(solveLine(game, { ...text.line, id: 'A' }).value).toBeCloseTo(lead.value, 6);
  });

  it('E D 6 5 / 4 3 2, 2 stik: kipningen med damen står i tredje runde', () => {
    const { game, lead, text } = bestLine('432', 'AQ65', 2);
    expect(text.steps).toEqual([
      'Lille fra bordet til esset.',
      'Lille fra begge hænder.',
      'Lille fra bordet mod damen (kipning); lægger Øst en honnør, lægges der lille.',
    ]);
    expect(solveLine(game, { ...text.line, id: 'A' }).value).toBeCloseTo(lead.value, 6);
  });

  it("E D 10 / 3 2, 3 stik: 10'eren er ikke lille", () => {
    const { text } = bestLine('32', 'AQT', 3);
    expect(text.steps[0]).toBe("Lille fra bordet mod 10'eren (kipning); lægger Øst en honnør, tages den med esset.");
  });

  it("E K 4 3 2 / D 10, 5 stik: bordets 10'er er ikke lille", () => {
    const { text } = bestLine('QT', 'AK432', 5);
    expect(text.steps[0]).toBe("Lille fra hånden mod 10'eren (kipning); lægger Vest en honnør, tages den med damen.");
  });

  it('K D 8 7 6 5 / 4 3 2, 5 stik: den gemte linje giver løserens chance', () => {
    const { game, lead, text } = bestLine('432', 'KQ8765', 5);
    expect(text.line.steps.length).toBeGreaterThan(0);
    expect(solveLine(game, { ...text.line, id: 'A' }).value).toBeCloseTo(lead.value, 6);
  });

  it("E K D 9 4 / 3 2, 4 stik: uændret, B 10 alene er stadig en honnør", () => {
    const { text } = bestLine('32', 'AKQ94', 4);
    expect(text.steps).toEqual(["Lille fra bordet mod 9'eren (kipning); lægger Øst en honnør, tages den med esset.", 'Slå esset.']);
  });

  it('nævner en gren, når 3. hånd skal reagere på en honnør', () => {
    const game = buildGame(parseCards('K2'), parseCards('AJ543'), { objective: goal(4) });
    const solution = solveGame(game);
    const texts = solution.leads.map((l) => describeLine(game, l.strategy, l.slot).steps.join(' '));
    expect(texts.some((t) => /lægger Øst en honnør, tages den med esset/.test(t))).toBe(true);
  });
});
