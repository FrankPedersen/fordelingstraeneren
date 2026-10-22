// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { TEXTS } from '../haandevaluering/ui/texts';
import { setLang } from '../i18n';
import { Footer } from '../ui/Footer';
import { danishJson, danishStrings, danishTexts } from './danskTekst';
import { fund } from './fagord';

// Accepttesten i SPEC-sprog-og-ordbog.md for Fordelingstræneren: sidefodens kolonne Opslag, fagordstesten og husets
// ord i dansk tekst. T1–T3 efter Franks svar (22. oktober 2026): hp, doubleton og fittet; engelsk beholder HCP.

afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Fagordstesten', () => {
  it('al dansk synlig tekst bruger husets fagord', { timeout: 30_000 }, () => {
    const errors = danishTexts().flatMap(({ file, strings }) =>
      strings.flatMap((s) => fund(s).map((f) => `${file}: "${f.word}" (husets ord: ${f.house}) i "${s.trim().slice(0, 90)}"`)),
    );
    expect(errors).toEqual([]);
  });

  it('fejler, hvis man skriver "knibning" i en dansk tekst', () => {
    expect(fund('Spil en knibning mod damen.')).toEqual([{ word: 'knibning', house: 'kipning, kippe' }]);
    expect(danishStrings("tx('Tag en knibning', 'Take a finesse')").flatMap(fund)).toHaveLength(1);
    expect(fund('Læg kortene på blindemand, og brug broerne.')).toHaveLength(2);
    expect(fund('I snit giver linjen 2,3 stik.')).toEqual([]);
    expect(fund('Et snit mod damen.')).toHaveLength(1);
  });

  it('T1–T3: hp, doubleton og fittet i dansk tekst', () => {
    expect(fund('26 HCP')).toEqual([{ word: 'HCP', house: 'hp' }]);
    expect(fund('dobbeltton i ♦')).toEqual([{ word: 'dobbeltton', house: 'doubleton' }]);
    expect(fund('Fitten er bekræftet.')).toEqual([{ word: 'Fitten', house: 'fittet' }]);
    expect(fund('ikke det samme som en fit')).toEqual([{ word: 'en fit', house: 'et fit' }]);
    expect(fund('med en 8+ major-fit')).toEqual([{ word: 'en 8+ major-fit', house: 'et fit' }]);
    expect(fund('fittens farve')).toEqual([{ word: 'fittens', house: 'fittet' }]);
    expect(fund('26 hp, doubleton i ♦, og fittet er bekræftet; et 8+ major-fit i en major.')).toEqual([]);
  });

  it('engelsk tekst tæller ikke', () => {
    expect(danishStrings("tx('12 hp', '12 HCP')").flatMap(fund)).toEqual([]);
    expect(danishStrings("const EN = { hp: '12 HCP' }; const MONTHS_EN = ['HCP'];").flatMap(fund)).toEqual([]);
    expect(danishStrings("const tracks = [{ title: '10 hp', en: '10 HCP' }];").flatMap(fund)).toEqual([]);
    expect(danishJson({ text: '15–17 hp', textEn: '15–17 HCP' }).flatMap(fund)).toEqual([]);
    expect(danishStrings("type Unit = 'HCP'; import x from './HCP';").flatMap(fund)).toEqual([]);
  });
});

describe('Sidefoden', () => {
  it('kolonnen Opslag med Bridgeordbog står efter Trænere, på dansk og engelsk', () => {
    for (const [lang, title, link, trainers] of [
      ['da', 'Opslag', 'Bridgeordbog', 'Trænere'],
      ['en', 'Reference', 'Bridge dictionary', 'Trainers'],
    ] as const) {
      setLang(lang);
      render(createElement(Footer));
      const column = screen.getByRole('navigation', { name: title });
      expect(within(column).getByRole('link', { name: link }).getAttribute('href')).toBe('/ordbog/');
      const navs = screen.getAllByRole('navigation').map((n) => n.getAttribute('aria-labelledby'));
      expect(navs.indexOf(column.getAttribute('aria-labelledby'))).toBe(navs.indexOf(screen.getByRole('navigation', { name: trainers }).getAttribute('aria-labelledby')) + 1);
      cleanup();
    }
  });
});

describe('Husets ord i håndevalueringen', () => {
  it('dansk har hp, doubleton og fittet; engelsk beholder HCP', () => {
    const { da, en } = TEXTS;
    expect(da.comparePrompt).toBe('Hp og Zar er uenige. Hvem har ret?');
    expect(da.methods.hcp).toBe('hp');
    expect(da.shortSuit(2, '♦')).toBe('doubleton i ♦');
    expect(da.distributionPrompt('♠')).toBe('Fittet i ♠ er bekræftet. Hvad er din p nu?');
    expect(en.comparePrompt).toBe('HCP and Zar disagree. Which is right?');
    expect(en.methods.hcp).toBe('HCP');
  });
});
