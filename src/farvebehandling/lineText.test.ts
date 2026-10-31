import { afterEach, describe, expect, it } from 'vitest';
import { setLang } from '../i18n';
import { cardLetter, englishStep, lineErrorText, stepText } from './lineText';
import { eveningText } from './model/frequency';
import { cardsText } from './model/cards';
import { TEST_BANK } from './testBank';

afterEach(() => setLang('da'));

/** Danske ord fra løserens skabeloner, som ikke må stå tilbage på engelsk. */
const DANISH = /[æøåÆØÅ]|\b(fra|lille|mod|kipning|slå|lægger|dækker|ellers|læg|bordet|hånden|tages|stikket|løbe|honnør|begge|esset|kongen|damen|knægten|eren)\b/i;

describe('Linjerne på engelsk', () => {
  it('oversætter skabelonerne', () => {
    expect(englishStep('Kongen og esset slås.')).toBe('The king and the ace are cashed.');
    expect(englishStep('Esset, kongen og damen slås.')).toBe('The ace, the king and the queen are cashed.');
    expect(englishStep('Lille fra bordet mod knægten (kipning); lægger Øst en honnør, tages den med esset.')).toBe(
      'Low from dummy towards the jack (finesse); if East plays an honour, it is won with the ace.',
    );
    expect(englishStep('Lille fra hånden til esset.')).toBe('Low from hand to the ace.');
    expect(englishStep("10'eren fra hånden; dækker Vest, tages stikket med kongen, ellers løber den.")).toBe(
      'The 10 from hand; if West covers, the trick is won with the king, otherwise it runs.',
    );
    expect(englishStep('Damen fra bordet; 9\'eren lægges.')).toBe('The queen from dummy; the 9 is played.');
    expect(englishStep('Damen fra bordet; dækker Øst, lægges der lille, ellers lægges 9\'eren.')).toBe(
      'The queen from dummy; if East covers, low is played, otherwise the 9 is played.',
    );
    expect(englishStep("10'eren fra bordet; den løber.")).toBe('The 10 from dummy; it runs.');
    expect(englishStep('Lille fra bordet og lille fra hånden.')).toBe('Low from dummy and low from hand.');
  });

  it('efterlader ingen dansk i nogen linje i banken', () => {
    const steps = new Set<string>();
    for (const item of TEST_BANK) {
      for (const g of Object.values(item.solution.goals)) for (const lead of g.leads) lead.steps.forEach((s) => steps.add(s));
      for (const lead of item.solution.tricks?.leads ?? []) lead.steps.forEach((s) => steps.add(s));
      for (const situations of Object.values(item.whatNow)) {
        for (const s of situations) for (const o of s.options) o.steps.forEach((t) => steps.add(t));
      }
    }
    expect(steps.size).toBeGreaterThan(150);
    const left = [...steps].map(englishStep).filter((s) => DANISH.test(s));
    expect(left.slice(0, 5)).toEqual([]);
  });

  it('følger det valgte sprog, også kortenes bogstaver, hyppigheden og løserens fejl', () => {
    expect(stepText('Esset slås.')).toBe('Esset slås.');
    expect(cardsText([14, 13, 12, 11, 10])).toBe('E K D B 10');
    setLang('en');
    expect(stepText('Esset slås.')).toBe('The ace is cashed.');
    expect(cardsText([14, 13, 12, 11, 10])).toBe('A K Q J 10');
    expect(cardLetter('D')).toBe('Q');
    expect(eveningText({ num: 1n, den: 11n })).toBe('about 2.3 times per club evening');
    expect(eveningText({ num: 1n, den: 413n })).toBe('about every 17th club evening');
    expect(lineErrorText('Trin 2: et lille kort kan ikke spilles fra bordet som 3. hånd.')).toBe('Step 2: a low card cannot be played from dummy as 3rd hand.');
  });
});
