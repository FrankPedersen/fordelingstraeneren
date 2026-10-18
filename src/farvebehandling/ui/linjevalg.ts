import { averageTricks, NEAR_BEST, type BandField, type BankItem, type LineView } from '../analysis';
import type { LeadResult } from '../precompute';

/**
 * Valg af linjer i Analyse (SPEC-analyse-situation.md, leverancetrin 4): alle første udspil og de unikke vindere, når
 * to linjer sammenlignes.
 */

/**
 * Alle første udspil i løserens resultat for målet, også dem langt under den bedste og dem med 0 %. Den bedste står
 * først og derefter de andre efter chance, så de viste linjer (`linesForGoal`) beholder deres bogstaver.
 */
export function allLinesForGoal(item: BankItem, goal: number): LineView[] {
  const g = item.solution.goals[String(goal)];
  if (!g || g.best < 0) return [];
  const best = g.leads[g.best];
  const ordered = g.leads
    .map((lead, i) => ({ lead, i }))
    .sort((a, b) => (a.i === g.best ? -1 : b.i === g.best ? 1 : b.lead.value - a.lead.value || a.i - b.i));
  return ordered.map(({ lead, i }, k) => ({
    letter: String.fromCharCode(65 + k),
    lead,
    value: lead.value,
    best: i === g.best,
    nearBest: i !== g.best && best.value - lead.value <= NEAR_BEST,
    mixed: !lead.certified,
    average: averageTricks(item.solution, lead.tricks),
  }));
}

/** En linjes nøgle til Sammenlign: det første udspil (hånd og kortgruppe), så valget holder, når bogstaverne skifter. */
export const leadKey = (lead: LeadResult) => `${lead.hand}${lead.high}-${lead.low}`;

/**
 * Unikke vindere for to linjer (indeks i båndets linjer): sidningerne, hvor kun den ene når målet, og deres samlede
 * chance. Forskellen mellem de to er forskellen mellem linjernes chance.
 */
export function uniqueWinners(fields: readonly BandField[], a: number, b: number) {
  const result = { a: { count: 0, probability: 0 }, b: { count: 0, probability: 0 } };
  for (const f of fields) {
    const x = f.outcomes[a] > 0, y = f.outcomes[b] > 0;
    if (x && !y) {
      result.a.count++;
      result.a.probability += f.probability;
    } else if (y && !x) {
      result.b.count++;
      result.b.probability += f.probability;
    }
  }
  return result;
}
