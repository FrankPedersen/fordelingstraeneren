import { NEAR_BEST } from './analysis';
import { cardsText, missingCards, parseCards, type Rank } from './model/cards';
import type { Combination, CombinationSolution } from './precompute';
import { cardName } from './solver/describe';

/**
 * Forslag til teknik pr. kombination (åbent punkt i specen: "Teknik pr. case"). Reglerne bruger løserens linjer:
 *
 * 1. **Sikkerhedsspil:** til et lavere mål giver linjen med flest stik i gennemsnit mere end 0,5 procentpoint mindre
 *    end den bedste linje for målet. Målet kræver altså en anden linje end maksimum.
 * 2. **Hovedmålet** er det mål, hvor valget betyder mest: størst afstand fra den bedste linje til den bedste forkerte.
 *    Mål under 25 % tæller kun, hvis alle mål ligger under.
 * 3. **Hovedlinjens første kipning** afgør resten: er to eller flere af modpartens kort højere end kortet, der kippes
 *    med, er det en dobbelt kipning. Er kortet det højeste, der er tilbage i sin hånd, spilles der mod en honnør.
 *    Ellers er det en enkelt kipning, med 8 kort eller flere fald eller kip.
 * 4. **Små kort fra begge hænder** er en kipning, når håndens laveste kort har en eller to af modpartens kort over sig
 *    og mindst ét under sig; ellers gives stikket væk med vilje (sikkerhedsspil).
 * 5. **Ingen kipning:** fald eller kip.
 *
 * Begrænset valg kræver to ligeværdige honnører hos modparten og forekommer ikke på siden "damen mangler".
 */

export type TechniqueId =
  | 'enkelt-kipning'
  | 'fald-eller-kip'
  | 'spil-mod-honnoer'
  | 'dobbelt-kipning'
  | 'sikkerhedsspil'
  | 'begraenset-valg';

export interface TechniqueProposal {
  technique: TechniqueId;
  /** Målet, forslaget bygger på. */
  goal: number;
  /** Begrundelsen på dansk til godkendelseslisten. */
  reason: string;
}

const MAIN_GOAL_MIN = 0.25;

const NAME_RANK: Record<string, Rank> = { esset: 14, kongen: 13, damen: 12, knægten: 11 };
const NAME = String.raw`(esset|kongen|damen|knægten|\d+'eren)`;
const TOWARD = new RegExp(String.raw`mod ${NAME} \(kip\)`, 'i');
const RUN = new RegExp(String.raw`${NAME} fra (?:bordet|hånden); [^.]*lad den løbe`, 'i');
const DUCK = /lille fra begge hænder/i;

function rankOfName(name: string): Rank {
  const lower = name.toLowerCase();
  return NAME_RANK[lower] ?? Number(lower.replace("'eren", ''));
}

/** Kortene, linjen har nævnt før en given position (de er spillet). */
function namedBefore(text: string, index: number): Set<Rank> {
  return new Set([...text.slice(0, index).matchAll(new RegExp(NAME, 'gi'))].map((m) => rankOfName(m[1])));
}

const pct = (v: number) => `${(100 * v).toFixed(1).replace('.', ',')} %`;

/** Sandsynligheden for mindst `goal` stik med linjen, der giver flest stik i gennemsnit. */
function tricksLineChance(s: CombinationSolution, goal: number): number | null {
  if (!s.tricks || s.tricks.best < 0) return null;
  const tricks = s.tricks.leads[s.tricks.best].layouts;
  let hits = 0n;
  s.layouts.forEach((l, L) => {
    if (tricks[L] >= goal - 1e-9) hits += BigInt(l.weight);
  });
  return Number((hits * 1_000_000_000n) / BigInt(s.denominator)) / 1e9;
}

/** Afstanden fra den bedste linje til den bedste forkerte (mere end 0,5 procentpoint under). */
function decisionGap(s: CombinationSolution, goal: number): number {
  const g = s.goals[String(goal)];
  const wrong = g.leads.filter((l) => g.value - l.value > NEAR_BEST).map((l) => l.value);
  return wrong.length ? g.value - Math.max(...wrong) : 0;
}

export function proposeTechnique(north: string, south: string, goals: readonly number[], s: CombinationSolution): TechniqueProposal {
  const n = parseCards(north), so = parseCards(south);
  const missing = missingCards(n, so);
  const count = n.length + so.length;
  const top = Math.max(...goals);

  // 1. Sikkerhedsspil: et lavere mål kræver en anden linje end flest stik.
  for (const goal of [...goals].sort((a, b) => b - a)) {
    if (goal === top) continue;
    const chance = tricksLineChance(s, goal);
    const best = s.goals[String(goal)].value;
    if (chance !== null && chance < best - NEAR_BEST) {
      return {
        technique: 'sikkerhedsspil',
        goal,
        reason: `Til ${goal} stik giver den bedste linje ${pct(best)}, linjen med flest stik kun ${pct(chance)}.`,
      };
    }
  }

  // 2. Hovedmålet: hvor valget betyder mest, blandt målene med mindst 25 % chance (ellers alle).
  const likely = goals.filter((g) => s.goals[String(g)].value >= MAIN_GOAL_MIN);
  const candidates = likely.length ? likely : goals;
  let goal = candidates[0];
  for (const g of candidates) if (decisionGap(s, g) > decisionGap(s, goal) + 1e-12) goal = g;
  const result = s.goals[String(goal)];
  const text = result.leads[result.best].steps.join(' ');
  const above = (r: Rank) => missing.filter((m) => m > r).length;
  const below = (r: Rank) => missing.filter((m) => m < r).length;
  const single = (why: string): TechniqueProposal =>
    count >= 8
      ? { technique: 'fald-eller-kip', goal, reason: `${why} med ${count} kort: fald eller kip.` }
      : { technique: 'enkelt-kipning', goal, reason: `${why} med ${count} kort.` };
  const double = (r: Rank, why: string): TechniqueProposal => ({
    technique: 'dobbelt-kipning',
    goal,
    reason: `${why}, og ${above(r)} af modpartens kort er højere.`,
  });

  // 3.–4. Den første kipning i hovedlinjen.
  const first = [TOWARD, RUN, DUCK]
    .map((re) => ({ re, m: re.exec(text) }))
    .filter((x): x is { re: RegExp; m: RegExpExecArray } => x.m !== null)
    .sort((a, b) => a.m.index - b.m.index)[0];
  if (first && first.re !== DUCK) {
    const f = rankOfName(first.m[1]);
    const name = cardName(f);
    if (first.re === RUN) {
      const why = `${name[0].toUpperCase()}${name.slice(1)} spilles ud og løber`;
      return above(f) >= 2 ? double(f, why) : single(why);
    }
    if (above(f) >= 2) return double(f, `Der kippes mod ${name}`);
    const hand = n.includes(f) ? n : so;
    const played = namedBefore(text, first.m.index);
    if (!hand.some((r) => r > f && !played.has(r))) {
      return { technique: 'spil-mod-honnoer', goal, reason: `Der spilles mod ${name}, som er det højeste kort, der er tilbage i hånden.` };
    }
    return single(`Kipning mod ${name}`);
  }
  if (first) {
    const played = namedBefore(text, first.m.index);
    const lowest = (hand: Rank[]) => Math.min(...hand.filter((r) => !played.has(r)));
    const card = Math.max(lowest(n), lowest(so));
    if (above(card) >= 1 && above(card) <= 2 && below(card) >= 1) {
      const why = `Små kort fra begge hænder kipper med ${cardName(card)}`;
      return above(card) === 2 ? double(card, why) : single(why);
    }
    return { technique: 'sikkerhedsspil', goal, reason: 'Små kort fra begge hænder giver et stik væk for at sikre resten.' };
  }

  // 5. Ingen kipning: der spilles på fald.
  return { technique: 'fald-eller-kip', goal, reason: `Linjen spiller på fald med ${count} kort.` };
}

interface TechniqueInfo {
  id: string;
  name: string;
  order: number;
}

/** Godkendelseslisten: teknikkerne i rækkefølge med deres kombinationer og begrundelsen for hver. */
export function techniquesReport(
  bank: readonly Combination[],
  solutions: Readonly<Record<string, CombinationSolution>>,
  techniques: readonly TechniqueInfo[],
): string {
  const rows = bank.map((c, i) => ({ c, rank: i + 1, p: proposeTechnique(c.north, c.south, c.goals, solutions[c.id]) }));
  const out = [
    '# Teknik pr. kombination: damen mangler',
    '',
    'Genereret af `scripts/techniques.ts` til godkendelse (åbent punkt i specen: "Teknik pr. case"). Hver kombination får én teknik, og teknikken er rummet i paladset. Reglerne står i `src/farvebehandling/techniques.ts`:',
    '',
    '1. **Sikkerhedsspil:** til et lavere mål giver linjen med flest stik i gennemsnit mere end 0,5 procentpoint mindre end den bedste linje.',
    '2. **Hovedmålet** er det mål, hvor valget af linje betyder mest. Mål under 25 % tæller kun, hvis alle mål ligger under.',
    '3. **Hovedlinjens første kipning:** to eller flere af modpartens kort over kortet = dobbelt kipning; spilles der mod det højeste kort, der er tilbage i hånden = spil mod honnør; ellers enkelt kipning, med 8 kort eller flere fald eller kip.',
    '4. **Små kort fra begge hænder** er en kipning, når det laveste kort har en eller to af modpartens kort over sig; ellers et sikkerhedsspil.',
    '5. **Ingen kipning:** fald eller kip.',
    '',
    'Begrænset valg kræver to ligeværdige honnører hos modparten og forekommer ikke på siden.',
    '',
  ];
  for (const t of [...techniques].sort((a, b) => a.order - b.order)) {
    const own = rows.filter((r) => r.p.technique === t.id);
    out.push(`## ${t.name} (${own.length})`, '');
    if (!own.length) out.push('Ingen kombinationer.', '');
    else {
      out.push('| Rang | Hånd / bordet | Mål | Begrundelse |', '| --- | --- | --- | --- |');
      for (const r of own) {
        const holding = `${cardsText(parseCards(r.c.south))} / ${cardsText(parseCards(r.c.north))}`;
        out.push(`| ${r.rank} | ${holding} | ${r.c.goals.join(', ')} | ${r.p.reason} |`);
      }
      out.push('');
    }
  }
  return out.join('\n');
}
