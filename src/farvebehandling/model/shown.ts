/**
 * Hvilke af et måls linjer appen viser. Ligger for sig, så appen, løserscriptet og løseren i Web Workeren bruger den
 * samme regel uden at hente hinandens kode.
 */

/** Linjer inden for så mange procentpoint af den bedste er lige gode. */
export const NEAR_BEST = 0.005;
export const MAX_ALTERNATIVES = 3;

/**
 * Indeksene i `leads` for de viste linjer i visningsrækkefølge: den bedste, de lige gode (inden for 0,5 procentpoint)
 * og højst tre andre, der hver ligger mere end 0,5 procentpoint under den bedste.
 */
export function shownLeads(g: { best: number; leads: readonly { value: number }[] }): number[] {
  if (g.best < 0) return [];
  const best = g.leads[g.best];
  const ordered = g.leads.map((lead, i) => ({ lead, i })).sort((a, b) => b.lead.value - a.lead.value || a.i - b.i);
  const near = ordered.filter((o) => o.i !== g.best && best.value - o.lead.value <= NEAR_BEST);
  const others = ordered.filter((o) => best.value - o.lead.value > NEAR_BEST).slice(0, MAX_ALTERNATIVES);
  return [g.best, ...near.map((o) => o.i), ...others.map((o) => o.i)];
}
