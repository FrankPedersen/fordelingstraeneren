import { describe, expect, it } from 'vitest';
import { bydeform, IKKE_INSTRUKTIONER } from './bydeform';
import { danishStrings, danishTexts } from './danskTekst';
import { englishStep } from '../farvebehandling/lineText';
import { TEST_BANK } from '../farvebehandling/testBank';

// Accepttesten i SPEC-beskrivende-form.md: instruktioner og forklaringer står i beskrivende form, ikke i bydeform.
// Knapper, links og navne på opgaver og øvelser står på undtagelseslisten i bydeform.ts.

describe('Beskrivende form', () => {
  // Linjeteksterne følger også beskrivende form, på dansk og engelsk (SPEC-sprog-kipning-toppe, Afklaret 3).
  it('linjeteksterne i banken og i Hvad nu? står i beskrivende form på dansk og engelsk', { timeout: 30_000 }, () => {
    const steps = new Set<string>();
    for (const item of TEST_BANK) {
      for (const goal of Object.values(item.solution.goals)) for (const lead of goal.leads) for (const s of lead.steps) steps.add(s);
      for (const situations of Object.values(item.whatNow)) for (const s of situations) for (const o of s.options) for (const t of o.steps) steps.add(t);
    }
    expect(steps.size).toBeGreaterThan(100);
    const engelsk = /^(Cash|Lead|Play|Win|Let|Cross|Take|Duck|Run)\b|[;,] (play|win|let|cash|lead|take)\b|otherwise (play|let)\b/;
    const errors = [...steps].flatMap((s) => [
      ...bydeform(s).map((hit) => `"${hit}" i "${s}"`),
      ...(/\bellers (lad|læg)\b/.test(s) ? [`"ellers lad/læg" i "${s}"`] : []),
      ...(engelsk.test(englishStep(s)) ? [`engelsk: "${englishStep(s)}"`] : []),
    ]);
    expect(errors).toEqual([]);
  });

  it('fejler på løserens gamle skabeloner i bydeform', () => {
    expect(bydeform('Slå esset.')).toEqual(['Slå esset.']);
    expect(bydeform('Gå ind på hånden med en sideindgang, og spil lille.')).toHaveLength(1);
    expect(bydeform('Esset slås.')).toEqual([]);
    expect(bydeform('Damen fra hånden; dækker Vest, lægges der lille, ellers løber den.')).toEqual([]);
  });

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
