/**
 * Husets fagord i dansk tekst (SPEC-sprog-og-ordbog.md, Husets fagord og Den varige kontrol). Bruges af fagordstesten
 * (`sprog.test.ts`, i `npm test`). "i snit" (gennemsnit) er tilladt.
 */

/** Husets "Ikke"-ord og det ord, der skal stå i stedet. T1–T3 efter Franks svar (22. oktober 2026). */
export const IKKE_ORD: readonly { pattern: RegExp; house: string }[] = [
  { pattern: /\bdobbeltknib[a-zæøå]*/gi, house: 'dobbelt kipning' },
  { pattern: /\bknib[a-zæøå]*/gi, house: 'kipning, kippe' },
  { pattern: /\bsnit(?:tet|ter|tene)?\b/gi, house: 'kipning' },
  { pattern: /\bblindemand[a-zæøå]*/gi, house: 'bordet' },
  { pattern: /\bden blinde\b/gi, house: 'bordet' },
  { pattern: /\bbroer(?:ne)?\b/gi, house: 'forbindelser, indgang' },
  // T1–T3: hp, doubleton og fittet i dansk tekst; engelsk beholder HCP.
  { pattern: /\bHCP\b/g, house: 'hp' },
  { pattern: /\bdobbeltton[a-zæøå]*/gi, house: 'doubleton' },
  { pattern: /\bfitten\b/gi, house: 'fittet' },
];

export interface Fund {
  word: string;
  house: string;
}

/** Alle "Ikke"-ord i en dansk tekst. */
export function fund(text: string): Fund[] {
  const out: Fund[] = [];
  for (const { pattern, house } of IKKE_ORD) {
    for (const m of text.matchAll(pattern)) {
      if (m[0].toLowerCase() === 'snit' && /\bi\s+$/i.test(text.slice(Math.max(0, m.index - 3), m.index))) continue;
      out.push({ word: m[0], house });
    }
  }
  return out;
}
