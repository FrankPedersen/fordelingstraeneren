import { describe, expect, it } from 'vitest';
import { bydeform, IKKE_INSTRUKTIONER } from './bydeform';
import { danishStrings, danishTexts } from './danskTekst';

// Accepttesten i SPEC-beskrivende-form.md: instruktioner og forklaringer står i beskrivende form, ikke i bydeform.
// Knapper, links og navne på opgaver og øvelser står på undtagelseslisten i bydeform.ts.

describe('Beskrivende form', () => {
  it('al dansk synlig tekst er i beskrivende form', { timeout: 30_000 }, () => {
    const errors = danishTexts()
      .filter(({ file }) => !IKKE_INSTRUKTIONER.some((r) => r.test(file)))
      .flatMap(({ file, strings }) => strings.flatMap((s) => bydeform(s).map((hit) => `${file}: "${hit.slice(0, 100)}"`)));
    expect(errors).toEqual([]);
  });

  it('fejler, hvis en dansk instruktion begynder med et udsagnsord i bydeform, også efter kolon og semikolon', () => {
    expect(bydeform('Spil ud fra bordet eller hånden.')).toEqual(['Spil ud fra bordet eller hånden.']);
    expect(bydeform('Læg din og makkers p sammen til P. Under 28½ er delkontrakt.')).toHaveLength(1);
    expect(bydeform('13-sudoku: udled alle fire hænders længder.')).toEqual(['udled alle fire hænders længder.']);
    expect(bydeform('Linjen er givet; gæt chancen for målet.')).toHaveLength(1);
    expect(danishStrings("tx('Tryk på kurven for at se en uge.', 'Tap the curve to see a week.')").flatMap(bydeform)).toHaveLength(1);
  });

  it('beskrivende form, knapper, links og navne på opgaver og øvelser består', () => {
    for (const text of [
      'Udspillet kan komme fra bordet eller hånden.',
      'Parrets P er din og makkers p lagt sammen.',
      'Du taster svaret med ½ og ¼.',
      'Start dagens session',
      'Start dagens session i Pointregnskab',
      'Luk',
      'Spil den selv',
      'Find hullet',
      'Vælg linjen',
      'Gæt chancen (valgfrit)',
      'Øv dobbelt kipning i Selvvalgt',
    ]) {
      expect(bydeform(text), text).toEqual([]);
    }
  });

  it('falske træf: meldingen pas og en knap som grundled', () => {
    expect(bydeform('Pas i åbningsposition: højst 11 hp.')).toEqual([]);
    expect(bydeform('Eksportér gemmer alle fordelingssporets data i en fil.')).toEqual([]);
    expect(bydeform('Opgavetyperne: Vælg linjen, Hvor stor er chancen?, Find hullet og Spil den selv.')).toEqual([]);
  });

  it('engelsk tekst tæller ikke', () => {
    expect(danishStrings("tx('Udspillet kan komme fra bordet.', 'Lead from dummy.')").flatMap(bydeform)).toEqual([]);
  });
});
