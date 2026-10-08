// Skriver src/haandevaluering/content/p-model.facit.json: eksempelhænder med P-modellens resultater, regnet af appens
// model (SPEC-haandevaluering.md, Fælles med konventionstræneren). Køres igen, når p-model.json eller regnereglerne
// ændres; facittesten fejler, indtil filen passer.
//
//   node scripts/p-model-facit.ts
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const load = async <T>(path: string): Promise<T> =>
  (await runnerImport<T>(`${root}${path}`, { configFile: false, logLevel: 'error' })).module;

const facit = await load<typeof import('../src/haandevaluering/model/facit.ts')>('src/haandevaluering/model/facit.ts');
const hand = await load<typeof import('../src/haandevaluering/model/hand.ts')>('src/haandevaluering/model/hand.ts');
const pm = await load<typeof import('../src/haandevaluering/model/pmodel.ts')>('src/haandevaluering/model/pmodel.ts');
const dealer = await load<typeof import('../src/domain/dealer.ts')>('src/domain/dealer.ts');
const cards = await load<typeof import('../src/domain/cards.ts')>('src/domain/cards.ts');

type SuitLetter = import('../src/haandevaluering/model/facit.ts').SuitLetter;
const LETTERS: SuitLetter[] = ['S', 'H', 'D', 'C'];
const SPEC = 'SPEC-haandevaluering.md, accepttest';

const hands: import('../src/haandevaluering/model/facit.ts').HandInput[] = [
  { id: 'spec-uden-fit', kilde: SPEC, haand: 'AK752.4.KQ63.852', trumf: null, makkersKorthed: [] },
  { id: 'spec-spar-fit', kilde: SPEC, haand: 'AK752.4.KQ63.852', trumf: 'S', makkersKorthed: [] },
  { id: 'spec-konge-over-korthed', kilde: SPEC, haand: 'AK752.4.KQ63.852', trumf: 'S', makkersKorthed: ['D'] },
  { id: 'dame-og-knaegt-over-korthed', kilde: SPEC, haand: 'AK752.4.QJ63.852', trumf: 'S', makkersKorthed: ['D'] },
  { id: 'renonce-og-syv-trumf', kilde: 'MODEL.md 1', haand: 'AKJ7652..KQ63.85', trumf: 'S', makkersKorthed: [] },
  { id: 'dobbeltton-i-trumf', kilde: `${SPEC} (6-2-fit)`, haand: 'Q7.KJ84.A5.QT983', trumf: 'S', makkersKorthed: [] },
  { id: 'singleton-i-trumf', kilde: `${SPEC} (7-1-fit)`, haand: 'A853.7.KJ952.Q64', trumf: 'H', makkersKorthed: [] },
  { id: 'tiere-i-sans', kilde: 'MODEL.md 2', haand: 'KT4.QT3.AT52.J93', trumf: null, makkersKorthed: [] },
];
// Tilfældige hænder fra kortgiveren: Syds hånd med og uden den længste major som trumf og en konge over for korthed.
for (let seed = 1; seed <= 8; seed++) {
  const south = dealer.deal(seed).S;
  const lengths = cards.suitLengths(south);
  const trump = lengths[0] >= lengths[1] ? 0 : 1;
  const king = south.find((c) => c % 13 === 11 && Math.floor(c / 13) !== trump);
  hands.push({
    id: `seed-${seed}`,
    kilde: `kortgiveren, seed ${seed} (Syd)`,
    haand: hand.handToPbn(south),
    trumf: seed % 2 ? null : LETTERS[trump],
    makkersKorthed: seed % 4 === 0 && king !== undefined ? [LETTERS[Math.floor(king / 13)]] : [],
  });
}

const pairs: import('../src/haandevaluering/model/facit.ts').PairInput[] = [
  { id: 'spec-P-29', kilde: `${SPEC} (makker med p = 12)`, syd: 'AK752.4.KQ63.852', nord: 'Q963.A98.A74.J76' },
  { id: 'storeslem', kilde: 'MODEL.md 1 og SPEC, afklaret 5', syd: 'AKJ752.A4.AK3.A2', nord: 'Q643.K2.Q52.K843' },
  { id: 'slem-uden-kontroller', kilde: 'SPEC, afklaret 5 (to es mangler)', syd: 'KQJ752.KQ.KQ3.K2', nord: 'A643.A5.J542.QJ4' },
];
// Den første fordeling fra kortgiveren for hver kontrakt og for sans med og uden alle stoppere.
const wanted = new Map<string, string>([
  ['partscore', 'delkontrakt'],
  ['game', 'udgang'],
  ['slam', 'lilleslem'],
  ['sans', 'sans med alle fire farver stoppet'],
  ['ustoppet', 'ingen fit og en ustoppet farve'],
]);
for (let seed = 1; wanted.size > 0 && seed < 1_000_000; seed++) {
  const { N, S } = dealer.deal(seed);
  const fit = pm.majorFit(S, N);
  let kind: string;
  if (fit !== null) kind = pm.contractFor(pm.pOf(S, { trump: fit }).p + pm.pOf(N, { trump: fit }).p, pm.controlsOf(S, N, fit));
  else kind = pm.strainFor(S, N) === 'notrump' ? 'sans' : 'ustoppet';
  const label = wanted.get(kind);
  if (!label) continue;
  wanted.delete(kind);
  pairs.push({ id: `seed-${seed}`, kilde: `kortgiveren, seed ${seed}: ${label}`, syd: hand.handToPbn(S), nord: hand.handToPbn(N) });
}
if (wanted.size) throw new Error(`Ingen fordeling fundet for ${[...wanted.keys()].join(', ')}`);

// Tabellens område (24–40) og grænserne, også storeslemsgrænsen 41, hvor tabellens sidste række bruges.
const ps = [24, 25, 26, 27, 27.75, 28, 28.5, 29, 29.25, 30, 31, 32, 33, 34, 34.25, 34.5, 35, 35.5, 35.75, 36, 38, 40, 40.5, 41, 41.5, 41.75];
// MODEL.md 1, "Hvad makker skal have", og en hånd, der selv har udgang.
const yours = [12, 14, 16, 18, 21, 24, 30];

const file = `${root}src/haandevaluering/content/p-model.facit.json`;
writeFileSync(file, JSON.stringify(facit.buildFacitFile(hands, pairs, ps, yours), null, 1) + '\n');
console.log(`${hands.length} hænder, ${pairs.length} par og ${ps.length} P-værdier → ${file}`);
