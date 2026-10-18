import { describe, expect, it } from 'vitest';
import { parseCards } from '../model/cards';
import { parseImport, type DealChoice } from './importer';

// SPEC-analyse-situation.md, leverancetrin 3: import af tekst, BBO-adresser og LIN.

const LIN = 'md|3SQ6HKQ84D632CQ832,ST94HJ752DK84CT65,SJ52HTDAQJ975CKJ7,|';
const cards = (text: string) => parseCards(text);
const pick = (choices: readonly DealChoice[], suit: DealChoice['suit'], pair: DealChoice['pair']) => {
  const c = choices.find((x) => x.suit === suit && x.pair === pair);
  if (!c) throw new Error(`${suit} ${pair} mangler`);
  return { north: c.north, south: c.south, usable: c.usable };
};

function deal(text: string) {
  const r = parseImport(text);
  if (r.kind !== 'deal') throw new Error(`forventede et spil, fik ${JSON.stringify(r)}`);
  return r.choices;
}

describe('Import', () => {
  it('Bordet-hånden: AK65-J43 og EK65-B43 giver samme kombination', () => {
    const en = parseImport('AK65-J43'), da = parseImport('EK65-B43');
    expect(en).toEqual({ kind: 'combination', north: cards('AK65'), south: cards('J43') });
    expect(da).toEqual(en);
  });

  it('AK6-AJ4 afvises, fordi esset står to gange', () => {
    expect(parseImport('AK6-AJ4')).toEqual({ kind: 'error', error: { kind: 'duplicate', rank: 14 } });
  });

  it('notation: 10 og T er 10\'eren, mellemrum ignoreres, og dansk læses ud fra E, D og B', () => {
    const expected = { kind: 'combination', north: cards('AKT5'), south: cards('J43') };
    expect(parseImport('AKT5-J43')).toEqual(expected);
    expect(parseImport('A K 10 5 - J 4 3')).toEqual(expected);
    expect(parseImport('E K 10 5 – B 4 3')).toEqual(expected);
    expect(parseImport('ek105/b43')).toEqual(expected);
    // Uden E, D og B læses teksten som engelsk: K og 9 betyder det samme på begge sprog.
    expect(parseImport('K93-765')).toEqual({ kind: 'combination', north: cards('K93'), south: cards('765') });
  });

  it('LIN: 8 kombinationer, også med Øst afledt som de resterende kort', () => {
    const choices = deal(LIN);
    expect(choices).toHaveLength(8);
    expect(pick(choices, 'D', 'NS')).toEqual({ north: cards('AQJ975'), south: cards('632'), usable: true });
    expect(pick(choices, 'C', 'NS')).toEqual({ north: cards('KJ7'), south: cards('Q832'), usable: true });
    expect(pick(choices, 'S', 'EW')).toEqual({ north: cards('AK873'), south: cards('T94'), usable: true });
    // Nord har kun 10'eren i hjerter; kombinationen kan stadig vælges.
    expect(pick(choices, 'H', 'NS')).toEqual({ north: cards('T'), south: cards('KQ84'), usable: true });
  });

  it('BBO-handviewerens adresse med lin= og med n=, s=, e=, w=', () => {
    const viaLin = deal(`https://www.bridgebase.com/tools/handviewer.html?lin=${encodeURIComponent(LIN)}`);
    expect(viaLin).toEqual(deal(LIN));
    const viaHands = deal('https://www.bridgebase.com/tools/handviewer.html?n=sj52htdaqj975ckj7&s=sq6hkq84d632cq832&w=st94hj752dk84ct65');
    expect(viaHands).toEqual(deal(LIN));
  });

  it('en hånd uden kort i farven giver en kombination, der ikke kan vælges', () => {
    const choices = deal('md|1SAKQJT98765432,HAKQJT98765432,DAKQJT98765432,|');
    expect(pick(choices, 'S', 'NS').usable).toBe(false);
  });

  it('fejl siger, hvad der er galt', () => {
    expect(parseImport('')).toEqual({ kind: 'error', error: { kind: 'empty' } });
    expect(parseImport('https://tinyurl.com/2p8x7k')).toEqual({ kind: 'error', error: { kind: 'shortLink' } });
    expect(parseImport('https://www.bridgebase.com/tools/handviewer.html?bbo=y&myhand=M-123')).toEqual({ kind: 'error', error: { kind: 'shortLink' } });
    expect(parseImport('AK65')).toEqual({ kind: 'error', error: { kind: 'separator' } });
    expect(parseImport('AKX5-J43')).toEqual({ kind: 'error', error: { kind: 'unknownSymbol', symbol: 'X' } });
    expect(parseImport('AK65-')).toEqual({ kind: 'error', error: { kind: 'emptyHand' } });
    expect(parseImport('AKQJT98-765432')).toEqual({ kind: 'error', error: { kind: 'noOpponents' } });
    expect(parseImport('md|3SQ6HKQ84D632CQ83,ST94HJ752DK84CT65,SJ52HTDAQJ975CKJ7,|')).toEqual({ kind: 'error', error: { kind: 'handSize', seat: 'S', count: 12 } });
    expect(parseImport('md|3SQ6HKQ84D632CQ832,SQ94HJ752DK84CT65,SJ52HTDAQJ975CKJ7,|')).toEqual({ kind: 'error', error: { kind: 'duplicate', rank: 12, suit: 'S' } });
    expect(parseImport('pn|Frank,Bo|')).toEqual({ kind: 'error', error: { kind: 'noDeal' } });
  });
});
