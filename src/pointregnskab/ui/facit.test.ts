import { afterEach, describe, expect, it } from 'vitest';
import { setLang } from '../../i18n';
import { allowedOf, ANY } from '../model/points';
import { explain } from '../model/explain';
import type { PlacementTask } from '../model/generator';
import type { Ledger } from '../model/solver';
import { SYSTEM } from '../../system/interpreter';
import { facitSentence } from './Facit';

const RANKS = '23456789TBDKE';
const card = (suit: string, rank: string) => '♠♥♦♣'.indexOf(suit) * 13 + RANKS.indexOf(rank);
const sentence = (ledger: Ledger, c: number) => facitSentence({ ledger } as PlacementTask, explain(ledger, c)!);

/** Øst har vist sine 2 spar (♠K ♠D); ♠E er uset. */
const usedUp: Ledger = {
  W: { allowed: ANY, shown: [], lengths: [4, 3, 3, 3] },
  E: { allowed: ANY, shown: [card('♠', 'K'), card('♠', 'D')], lengths: [2, 4, 4, 3] },
  unseen: [card('♠', 'E'), card('♥', 'D')],
};

/** Øst har 1 spar til 2 usete spar-honnører, og Vest (2NT, vist 17) mangler 3–4. */
const noRoom: Ledger = {
  W: {
    allowed: allowedOf(SYSTEM.find((r) => r.context === 'opening' && r.call === '2NT')!.hcp),
    shown: [card('♣', 'E'), card('♣', 'K'), card('♣', 'B'), card('♦', 'E'), card('♦', 'K'), card('♦', 'D')],
    lengths: [2, 3, 4, 4],
  },
  E: { allowed: ANY, shown: [], lengths: [1, 4, 4, 4] },
  unseen: [card('♠', 'E'), card('♠', 'D'), card('♥', 'K')],
};

afterEach(() => setLang('da'));

describe('Facit med længdeskabelonerne', () => {
  it('"Farven er brugt op" på dansk og engelsk', () => {
    expect(sentence(usedUp, card('♠', 'E'))).toBe('Øst har vist alle sine 2 spar, så ♠E sidder hos Vest.');
    setLang('en');
    expect(sentence(usedUp, card('♠', 'E'))).toBe('East has shown all 2 of his spades, so ♠A is with West.');
  });

  it('"Ikke plads" nævner både længderne og pointene, på dansk og engelsk', () => {
    expect(sentence(noRoom, card('♠', 'E'))).toBe(
      'Øst har kun 1 spar tilbage, men der er 2 usete spar-honnører (♠E ♠D), så mindst én af dem sidder hos Vest. Vest mangler 3–4 og kan kun nå det med ♠E.',
    );
    setLang('en');
    expect(sentence(noRoom, card('♠', 'E'))).toBe(
      'East has only 1 spade left, but there are 2 unseen spade honours (♠A ♠Q), so at least one of them is with West. West needs 3–4 more and can only get there with ♠A.',
    );
  });
});
