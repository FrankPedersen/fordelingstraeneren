// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GuideScreen } from '../../app/screens/GuideScreen';
import type { Hands } from '../../domain/dealer';
import { setLang } from '../../i18n';
import type { HandTask } from '../model/generator';
import { parseHand } from '../model/hand';
import { pOf } from '../model/pmodel';
import { facitSentences } from './Facit';
import { Opgave } from './Opgave';
import { Regnskab } from './Regnskab';
import { TEXTS } from './texts';

// Accepttesten i SPEC-haandevaluering-kalibrering.md (version 2) for brugerfladen: et negativt trumfled vises med minus,
// slem-forklaringen taler om nøglekort, og reglerne står på dansk og engelsk.

function deal(south: string, north: string): Hands {
  const S = parseHand(south), N = parseHand(north);
  const rest = Array.from({ length: 52 }, (_, c) => c).filter((c) => !S.includes(c) && !N.includes(c));
  return { N, E: rest.slice(0, 13), S, W: rest.slice(13) };
}

/** "HCP har ret": fit i ♥, Syd har 3 trumf og Nord 5. */
const HCP_RIGHT: HandTask = { exercise: 'compare', seed: 0, hands: deal('A86.KQ8.82.QT432', 'QJ5.A7642.K764.J'), trump: 1 };
/** P = 36 uden ♣E og ♠K. */
const P36: HandTask = { exercise: 'decision', seed: 0, hands: deal('AQJ752.AK4.AK3.2', '9863.Q76.Q876.K5'), trump: 0, limit: 35 };
/** P = 35½ uden ♠E og ♥E; trumfkongen er der. */
const TWO_ACES: HandTask = { exercise: 'decision', seed: 0, hands: deal('KQJ752.KQ.KQ3.K2', 'A643.A5.J542.QJ4'), trump: 0, limit: 35 };

beforeEach(() => {
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Et negativt trumfled vises med minus', () => {
  it('facit i opgave 8: Syd har trumflængde −1½ (3 trumf) og p = 10¾', () => {
    const lines = facitSentences(HCP_RIGHT);
    expect(lines).toContain('Dig: honnørpoint 11¼, trumflængde −1½ (3 trumf), korthed +1 (dobbeltton i ♦), p = 10¾.');
    expect(lines).toContain('Makker: honnørpoint 10½, trumflængde +1½ (5 trumf), korthed +3 (singleton i ♣), p = 15.');
    expect(lines).toContain('P = 10¾ + 15 = 25¾: delkontrakt.');
    expect(lines).toContain('HCP har ret.');
    setLang('en');
    expect(facitSentences(HCP_RIGHT)).toContain('You: honour points 11¼, trump length −1½ (3 trumps), shortness +1 (doubleton in ♦), p = 10¾.');
  });

  it('regnskabet viser −1½ i trumflængdens række', () => {
    const { S, N } = HCP_RIGHT.hands;
    render(<Regnskab you={pOf(S, { trump: 1 })} partner={pOf(N, { trump: 1 })} />);
    const row = screen.getByRole('rowheader', { name: 'Trumflængde' }).closest('tr')!;
    expect([...row.querySelectorAll('td')].map((td) => td.textContent)).toEqual(['−1½', '+1½']);
  });

  it('opgave 8 viser HCP med grænsen 23', () => {
    render(<Opgave task={HCP_RIGHT} onAnswer={() => {}} />);
    expect(screen.getByText('HCP: 11 + 11 = 22 HCP → delkontrakt (grænse 23)')).toBeTruthy();
    expect(screen.getByText('Zar: 25 + 27 = 52 ZP → udgang (grænse 52)')).toBeTruthy();
  });
});

describe('Slem-forklaringen taler om nøglekort', () => {
  it('P = 36 uden ♣E og ♠K: facit nævner de to manglende nøglekort', () => {
    expect(facitSentences(P36)).toContain('P = 29 + 7 = 36: udgang.');
    expect(facitSentences(P36)).toContain('Parret mangler 2 nøglekort (♠K og et es), så lilleslem er for meget.');
    setLang('en');
    expect(facitSentences(P36)).toContain('The pair is missing 2 key cards (♠K and an ace), so small slam is too much.');
  });

  it('to manglende es med trumfkongen', () => {
    expect(facitSentences(TWO_ACES)).toContain('Parret mangler 2 nøglekort (to es), så lilleslem er for meget.');
    setLang('en');
    expect(facitSentences(TWO_ACES)).toContain('The pair is missing 2 key cards (two aces), so small slam is too much.');
  });
});

describe('Reglerne på dansk og engelsk', () => {
  it('hjælpeteksterne har den nye trumfregel, nøglekortene og 23 HCP', () => {
    const { da, en } = TEXTS;
    for (const text of [da.help.count, da.help.exercises.distribution]) expect(text).toContain('1½ pr. trumf ud over 4, minus 1½ pr. trumf under 4');
    for (const text of [en.help.count, en.help.exercises.distribution]) expect(text).toContain('1½ per trump beyond 4, minus 1½ per trump short of 4');
    expect(da.help.exercises.decision).toContain('nøglekort');
    expect(en.help.exercises.decision).toContain('key card');
    expect(da.help.exercises.compare).toContain('23 HCP');
    expect(en.help.exercises.compare).toContain('23 HCP');
    expect(da.help.exercises.compare).not.toContain('25');
    expect(en.help.exercises.compare).not.toContain('25');
  });

  it('vejledningen har eksemplet med 5-3-fit og nøglekortene', () => {
    render(<GuideScreen onBack={() => {}} />);
    expect(document.body.textContent).toContain('5-3-fit: den med 5 trumf får +1½, den med 3 trumf −1½, så parret får 0');
    expect(document.body.textContent).toContain('nøglekort');
    cleanup();
    setLang('en');
    render(<GuideScreen onBack={() => {}} />);
    expect(document.body.textContent).toContain('5-3 fit: the hand with 5 trumps gets +1½, the hand with 3 trumps −1½, so the pair gets 0');
    expect(document.body.textContent).toContain('key card');
  });
});
