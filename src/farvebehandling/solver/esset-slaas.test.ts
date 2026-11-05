import { describe, expect, it } from 'vitest';
import { parseCards, type Rank } from '../model/cards';
import { englishStep } from '../lineText';
import { followsLine } from '../play/play';
import { describeLine } from './describe';
import { buildGame, type Game } from './game';
import { validateLine, type Line, type LineStep } from './lines';
import { solveGame, solveLine } from './solve';
import { TEST_BANK } from '../testBank';

// Accepttest for SPEC-esset-slaas.md: hovedvejen efter en kipning (A), 3. hånds kort pr. gren (B), de nye ord (D),
// mærket for grenen (E) og "lille fra begge hænder" lagt sammen (F). Chancerne må ikke ændre sig.

const goal = (n: number) => ({ kind: 'goal', goal: n }) as const;

/** Løserens bedste linje for et mål og dens beskrivelse. Bordet (Nord) først, så hånden (Syd). */
function bestLine(north: string, south: string, n: number) {
  const game = buildGame(parseCards(north), parseCards(south), { objective: goal(n) });
  const solution = solveGame(game);
  const lead = solution.leads[solution.best];
  const text = describeLine(game, lead.strategy, lead.slot);
  // En linje uden trin kan ikke spilles som helhed (løseren spiller det hele); så er værdien NaN.
  return { game, lead, text, value: text.line.steps.length ? solveLine(game, { ...text.line, id: 'A' }).value : Number.NaN };
}

// Banken og løserens skabeloner, læst som tekst.
const BANK_FILES = import.meta.glob<string>(['../content/app/side-*.json', '../content/solutions.json', '../content/hvad-nu.json', '../content/suit-combinations.json'], { query: '?raw', import: 'default', eager: true });
const SKABELONER = import.meta.glob<string>(['./describe.ts', './whatnow.ts', './lines.ts', '../lineText.ts'], { query: '?raw', import: 'default', eager: true });
const udenKommentarer = (kode: string) => kode.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');

/** Kort til followsLine: rang pr. hånd, højeste først. */
const ranks = (s: string): Rank[] => [...parseCards(s)].sort((a, b) => b - a);

describe('Esset slås (SPEC-esset-slaas.md)', { timeout: 300_000 }, () => {
  it('nr. 1: 4 3 2 / E D 6 5, 3 stik: lykkes kipningen, indkasseres esset', () => {
    const r = bestLine('432', 'AQ65', 3);
    expect(r.text.steps[1]).toBe('Lykkes kipningen, indkasseres esset.');
    expect(r.value).toBeCloseTo(r.lead.value, 9);
  });

  it('nr. 3: 4 3 2 / E K B 5, 4 stik: lykkes kipningen, toppes farven med esset og kongen', () => {
    const r = bestLine('432', 'AKJ5', 4);
    expect(r.text.steps[1]).toBe('Lykkes kipningen, toppes farven med esset og kongen.');
    expect(r.value).toBeCloseTo(r.lead.value, 9);
  });

  it('nr. 4: 4 3 2 / K 7 6 5, 2 stik: lille fra begge hænder lægges sammen efter mærket', () => {
    const r = bestLine('432', 'K765', 2);
    expect(r.text.steps[1]).toBe('Lykkes kipningen, spilles der lille fra begge hænder to gange.');
    expect(r.value).toBeCloseTo(r.lead.value, 9);
  });

  it('nr. 7: B 3 2 / E K 5 4, 3 stik: mislykkes kipningen, indkasseres kongen', () => {
    const r = bestLine('J32', 'AK54', 3);
    expect(r.text.steps.at(-1)).toBe('Mislykkes kipningen, indkasseres kongen.');
    expect(r.value).toBeCloseTo(r.lead.value, 9);
  });

  it('nr. 8: B 3 2 / K 5 4, 1 stik: mislykkes kipningen, går teksten videre med den næste kipning', () => {
    const r = bestLine('J32', 'K54', 1);
    expect(r.text.steps[1]).toMatch(/^Mislykkes kipningen, spilles der lille fra hånden mod knægten \(kipning\)/);
    // En linje uden trin spilles helt af løseren og kan ikke spilles som helhed.
    if (r.text.line.steps.length) expect(r.value).toBeCloseTo(r.lead.value, 9);
  });

  it('teksten fortsætter efter en kipning altid med mærket, også på engelsk', () => {
    for (const [n, s, g] of [['432', 'AQ65', 3], ['432', 'AKJ5', 4], ['432', 'K765', 2], ['J32', 'AK54', 3], ['J32', 'K54', 1], ['432', 'KQ8765', 5]] as const) {
      const { steps } = bestLine(n, s, g).text;
      steps.forEach((step, i) => {
        if (i > 0 && steps[i - 1].includes('(kipning)')) {
          expect(step, `${n} / ${s}, ${g} stik`).toMatch(/^(Lykkes|Mislykkes) kipningen, /);
          expect(englishStep(step)).toMatch(/^If the finesse (succeeds|fails), /);
        }
      });
    }
  });

  it('ingen tekst siger "slås", og de nye ord har engelsk', () => {
    for (const [n, s, g] of [['J432', 'AT65', 3], ['AKJ32', '7654', 5], ['2', 'AKJ543', 5], ['432', 'AQ65', 3], ['432', 'AKJ5', 4], ['QT', 'AK432', 4]] as const) {
      for (const step of bestLine(n, s, g).text.steps) {
        expect(step).not.toMatch(/\bslås\b/);
        expect(englishStep(step)).not.toMatch(/[æøå]|\b(og|fra|lille|indkasseres|toppes|spilles)\b/);
      }
    }
    expect(englishStep('Esset og kongen indkasseres.')).toBe('The ace and king are cashed.');
    expect(englishStep('Farven toppes med esset og kongen.')).toBe('The ace and king are played for the drop.');
    expect(englishStep('Farven toppes med esset.')).toBe('The ace is played for the drop.');
    expect(englishStep('Damen spilles fra hånden.')).toBe('The queen is played from hand.');
    expect(englishStep('Lille fra begge hænder to gange.')).toBe('Low from both hands twice.');
    expect(englishStep('Lille fra begge hænder tre gange.')).toBe('Low from both hands three times.');
  });

  it('2 / E K B 5 4 3 (5 stik) og 3 2 / B 10 5 4 (1 stik) giver 59,75 % og 24,73 %, når linjen spilles som helhed', () => {
    const a = bestLine('2', 'AKJ543', 5);
    expect(a.value).toBeCloseTo(a.lead.value, 9);
    expect(Math.round(a.value * 10000) / 100).toBe(59.75);
    const b = bestLine('32', 'JT54', 1);
    expect(b.value).toBeCloseTo(b.lead.value, 9);
    expect(Math.round(b.value * 10000) / 100).toBe(24.73);
  });

  it('linjer fra gruppe C i SPEC-linjeplan-23.md får trin igen og giver den gemte chance', () => {
    for (const [n, s, g] of [['KJ92', 'AT83', 4], ['QT', 'AK432', 4], ['K32', 'AT954', 3]] as const) {
      const r = bestLine(n, s, g);
      expect(r.text.line.steps.length, `${n} / ${s}, ${g} stik`).toBeGreaterThan(0);
      expect(r.value).toBeCloseTo(r.lead.value, 9);
    }
  });

  it('3. hånds kort pr. gren: en linje med thirdIf læses af lineMask og følges af followsLine', () => {
    // B 3 2 / E K 5 4: lille til esset; derefter lille mod knægten, men er damen faldet, lægges kongen.
    const game: Game = buildGame(parseCards('J32'), parseCards('AK54'), { objective: goal(3) });
    const steps: LineStep[] = [
      { leadFrom: 'N', card: 'low', third: { ifSecondPlays: 'low', play: 'A', else: 'A' } },
      { leadFrom: 'S', card: 'low', third: { ifSecondPlays: 'low', play: 'J', else: 'low' }, thirdIf: [{ if: { fallen: ['Q'] }, third: { ifSecondPlays: 'low', play: 'low', else: 'low' } }] },
    ];
    const line: Line = { id: 'X', text: '', steps };
    expect(validateLine(game, line)).toEqual([]);
    const start = { north: ranks('J32'), south: ranks('AK54'), west: ranks('Q876'), east: ranks('T9') };
    // Damen falder ikke i første stik (Øst lægger 9'eren), så trin 2 er lille mod knægten.
    expect(followsLine(steps, [
      { leader: 'N', lead: 2, second: 9, third: 14, fourth: 6, winner: 'S' },
      { leader: 'S', lead: 4, second: 7, third: 11, fourth: 10, winner: 'N' },
    ], start)).toBe(true);
    // Lægger Øst damen i første stik, er trin 2 lille fra begge hænder, ikke knægten.
    const start2 = { north: ranks('J32'), south: ranks('AK54'), west: ranks('T987'), east: ranks('Q6') };
    const første = { leader: 'N', lead: 2, second: 12, third: 14, fourth: 7, winner: 'S' } as const;
    expect(followsLine(steps, [første, { leader: 'S', lead: 4, second: 8, third: 3, fourth: 6, winner: 'V' }], start2)).toBe(true);
    expect(followsLine(steps, [første, { leader: 'S', lead: 4, second: 8, third: 11, fourth: 6, winner: 'N' }], start2)).toBe(false);
  });

  it('gamle linjer uden thirdIf læses og spilles uændret', () => {
    const game = buildGame(parseCards('J432'), parseCards('AT65'), { objective: goal(3) });
    const old: Line = { id: 'A', text: '', steps: [{ leadFrom: 'N', card: 'low', third: { ifSecondPlays: 'low', play: 'T', else: 'A' } }, { leadFrom: 'S', card: 'high' }] };
    expect(validateLine(game, old)).toEqual([]);
    expect(solveLine(game, old).value).toBeGreaterThan(0);
  });

  it('ingen linjetekst i banken og ingen af løserens skabeloner indeholder "slås"', () => {
    // Testen skal læse alle filerne; en tom glob ville ellers give grønt.
    expect(Object.keys(BANK_FILES).length).toBe(13);
    expect(Object.keys(SKABELONER).length).toBe(4);
    for (const [fil, tekst] of Object.entries(BANK_FILES)) expect(tekst.match(/.{0,40}\bslås\b.{0,10}/)?.[0], fil).toBeUndefined();
    for (const [fil, kode] of Object.entries(SKABELONER)) expect(udenKommentarer(kode).match(/.{0,40}\bslås\b.{0,10}/)?.[0], fil).toBeUndefined();
  });

  it('hver tekst i banken, der fortsætter efter en kipning, siger, hvilken gren den fortsætter på', () => {
    const fejl: string[] = [];
    for (const item of TEST_BANK) {
      for (const [mål, g] of Object.entries(item.solution.goals)) {
        for (const lead of g.leads) {
          lead.steps.forEach((step, i) => {
            if (i > 0 && lead.steps[i - 1].includes('(kipning)') && !/^(Lykkes|Mislykkes) kipningen, /.test(step)) fejl.push(`${item.combination.id} ${mål}: ${step}`);
          });
        }
      }
    }
    expect(fejl.slice(0, 5)).toEqual([]);
  });
});

