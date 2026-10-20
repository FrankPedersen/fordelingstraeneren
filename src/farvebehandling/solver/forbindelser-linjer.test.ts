import { afterEach, describe, expect, it } from 'vitest';
import { setLang } from '../../i18n';
import { englishStep, lineErrorText, stepText } from '../lineText';
import { parseCards, type Rank } from '../model/cards';
import { STANDARD, type Situation } from '../model/situation';
import { handleSolve } from './results';
import type { Line } from './lines';

// SPEC-forbindelser.md, leverancetrin 3: linjerne og egne linjer med forbindelserne. Bordet / hånden = Nord / Syd.

const connections = (lead: 'N' | 'S', north: number | null, south: number | null): Situation => ({ ...STANDARD, entries: { north, south }, lead });

function best(north: Rank[], south: Rank[], goal: number, situation?: Situation) {
  const response = handleSolve({ kind: 'goal', north, south, goal, situation });
  if (response.kind !== 'goal') throw new Error('forkert svar');
  return response.result.leads[response.result.best];
}
function ownLine(north: Rank[], south: Rank[], goal: number, line: Line, situation?: Situation) {
  const response = handleSolve({ kind: 'line', north, south, goal, line, situation });
  if (response.kind !== 'line') throw new Error('forkert svar');
  return response;
}

// E D B 10 / 6 5 4 3 2: kipningen mod kongen skal spilles fra hånden.
const EDB10 = parseCards('AQJT'), X65432 = parseCards('65432');
// 4 3 2 / E D 6 5: kipningen mod damen skal spilles fra bordet.
const X432 = parseCards('432'), AQ65 = parseCards('AQ65');
// Bordet E, hånden K D B 3 2.
const ACE = parseCards('A'), KQJ32 = parseCards('KQJ32');

afterEach(() => setLang('da'));

describe('Linjerne med forbindelser (SPEC-forbindelser.md, trin 3)', { timeout: 300_000 }, () => {
  it('et udspil, der bruger en indgang til hånden: "Gå ind på hånden med en sideindgang, og spil …"', () => {
    const lead = best(EDB10, X65432, 5, connections('S', null, 2));
    // Første udspil er fra hånden, som er inde; det næste fra hånden bruger en indgang.
    expect(lead.steps[0]).not.toMatch(/sideindgang/);
    const entry = lead.steps.find((s) => s.startsWith('Gå ind på hånden med en sideindgang, og spil '));
    expect(entry, lead.steps.join(' | ')).toBeTruthy();
    setLang('en');
    expect(stepText(entry!)).toMatch(/^Cross to hand with a side entry and lead /);
    expect(stepText(entry!)).not.toMatch(/[æøå]|\b(fra|og|lille|spil|hånden|bordet)\b/i);
  });

  it('et udspil, der bruger en indgang til bordet: "Gå ind på bordet med en sideindgang, og spil …"', () => {
    const lead = best(X432, AQ65, 3, connections('S', 1, null));
    expect(lead.hand).toBe('N');
    expect(lead.steps[0]).toMatch(/^Gå ind på bordet med en sideindgang, og spil /);
    setLang('en');
    expect(stepText(lead.steps[0])).toMatch(/^Cross to dummy with a side entry and lead /);
  });

  it('uden begrænsning er linjerne som i dag, uden sideindgange', () => {
    for (const lead of [best(EDB10, X65432, 5), best(X432, AQ65, 3)]) expect(lead.steps.join(' ')).not.toMatch(/sideindgang/);
  });

  it('de engelske skabeloner for sideindgange', () => {
    expect(englishStep('Gå ind på bordet med en sideindgang, og spil lille mod damen (kip).')).toBe(
      'Cross to dummy with a side entry and lead low towards the queen (finesse).',
    );
    expect(englishStep('Gå ind på hånden med en sideindgang, og spil lille til esset.')).toBe('Cross to hand with a side entry and lead low to the ace.');
    expect(englishStep('Gå ind på hånden med en sideindgang, og spil lille.')).toBe('Cross to hand with a side entry and lead low.');
    expect(englishStep('Gå ind på bordet med en sideindgang, og spil damen; dækker Øst, tages stikket med esset, ellers lad den løbe.')).toBe(
      'Cross to dummy with a side entry and lead the queen; if East covers, win with the ace, otherwise let it run.',
    );
    expect(englishStep('Gå ind på hånden med en sideindgang, og spil lille fra begge hænder.')).toBe('Cross to hand with a side entry and lead low from both hands.');
    expect(englishStep('Gå ind på hånden med en sideindgang, og slå kongen.')).toBe('Cross to hand with a side entry and cash the king.');
  });
});

describe('Egne linjer med forbindelser (SPEC-forbindelser.md, trin 3)', { timeout: 300_000 }, () => {
  it('en egen linje, der spiller ud fra Syd to gange med Syd 0 indgange og Nord inde, afvises med en fejl, der nævner trinnet', () => {
    const line: Line = { id: 'egen', text: '', steps: [{ leadFrom: 'S', card: 'low' }, { leadFrom: 'S', card: 'low' }] };
    const r = ownLine(ACE, KQJ32, 4, line, connections('N', null, 0));
    expect(r.lead).toBeNull();
    expect(r.errors).toEqual(['Trin 1: der er ingen indgang til hånden, så der kan ikke spilles ud derfra.']);
    setLang('en');
    expect(lineErrorText(r.errors[0])).toBe('Step 1: there is no entry to hand, so you cannot lead from there.');
  });

  it('esset fra bordet og så fra hånden: trin 2 afvises, når hånden ikke kan nås', () => {
    // E K 2 / B 5 4 3: esset vinder, så bordet er inde og har stadig kort.
    const AK2 = parseCards('AK2'), J543 = parseCards('J543');
    const line: Line = { id: 'egen', text: '', steps: [{ leadFrom: 'N', card: 'A' }, { leadFrom: 'S', card: 'low' }] };
    expect(ownLine(AK2, J543, 3, line, connections('N', null, 0)).errors).toEqual([
      'Trin 2: der er ingen indgang til hånden, så der kan ikke spilles ud derfra.',
    ]);
    // Med én indgang til hånden er linjen gyldig.
    expect(ownLine(AK2, J543, 3, line, connections('N', null, 1)).errors).toEqual([]);
    setLang('en');
    expect(lineErrorText('Trin 3: der er ingen indgang til bordet, så der kan ikke spilles ud derfra.')).toBe(
      'Step 3: there is no entry to dummy, so you cannot lead from there.',
    );
  });
});
