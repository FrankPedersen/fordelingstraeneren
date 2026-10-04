import { formatDecimal } from '../engine/format';
import { cardsText, parseCards } from './model/cards';
import type { Combination } from './precompute';
import type { Seat, TrickCard, WhatNowSituation } from './model/whatnow';

/** Hvad nu?-data pr. kombination og mål, som i hvad-nu.json. */
export type WhatNowData = Readonly<Record<string, Readonly<Record<string, readonly WhatNowSituation[]>>>>;

export const SEAT_NAME: Record<Seat, string> = { N: 'Nord', Ø: 'Øst', S: 'Syd', V: 'Vest' };

/** Første runde som tekst, fx "Nord E · Øst D · Syd 7 · Vest x". */
export function trickText(trick: readonly TrickCard[]): string {
  return trick.map((t) => `${SEAT_NAME[t.seat]} ${t.card}`).join(' · ');
}

const pct = (v: number) => `${formatDecimal(100 * v, 1)} %`;

/** Listen til godkendelse: hver situation med fortsættelserne og deres chance. */
export function whatNowReport(bank: readonly Combination[], data: WhatNowData): string {
  const out = [
    '# Hvad nu?: damen mangler',
    '',
    'Genereret af `scripts/whatnow.ts` til godkendelse. Første runde følger løserens bedste linje, og modspillerne lægger normalt: 2. hånd lavt, men dækker en udspillet honnør; 4. hånd vinder billigst, hvis makker ikke vinder; ligeværdige kort vælges tilfældigt (begrænset valg). Hver fortsættelse er derefter løst med optimalt modspil og sidningernes chance efter første runde. En situation kommer med, når en honnør falder eller en modspiller ikke kan bekende, den sker i mindst 1 % af spillene, og en rimelig fortsættelse (mindst en tredjedel af den bedstes chance) er mere end 0,5 procentpoint dårligere.',
    '',
  ];
  let total = 0;
  bank.forEach((c, i) => {
    const goals = data[c.id];
    if (!goals) return;
    out.push(`## ${i + 1}. ${cardsText(parseCards(c.south))} / ${cardsText(parseCards(c.north))}`, '');
    for (const goal of c.goals) {
      for (const s of goals[String(goal)] ?? []) {
        total++;
        out.push(`**${goal} stik** · første runde: ${trickText(s.trick)} (${pct(s.probability)} af spillene)`, '');
        s.options.forEach((o, k) => out.push(`- ${pct(o.value)}${k === 0 ? ' (bedst)' : ''}: ${o.steps.join(' ')}`));
        out.push('');
      }
    }
  });
  out.splice(4, 0, `${total} situationer.`, '');
  return out.join('\n');
}
