import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../../sprog/danskTekst';
import { fraPbn, laes, raaSti, variantSti, type Farve, type Raa } from './hjaelp';
import { analyser, domTekst, haandtal, RAEKKER, statistik, UDELADT, udvaelg, type Haandtal, type RaekkeId, type Side, type SituationId, type Valg } from './raadanalyse';

/*
 * Accepttest 4–7 i SPEC-udspilsraad.md. Røde, indtil session 2 har bygget analysen (raadanalyse.ts og
 * tools/udspil/raadanalyse.mjs) og skrevet afsnit 7a i docs/MODEL.md. Testene rettes ikke i session 2, med Franks
 * undtagelser 26. nov. 2026: sætningstallene i accepttest 5 (haandtal) og 6 regner 3NT sat ved 5 stik som appen, og
 * testene af, at analysen kun bruger forskellige hænder (accepttest 3), er nye.
 *
 * 4. Statistikken på faste, håndregnede tal: forskel, standardfejl (stikprøvespredning med n − 1, divideret med √n),
 *    interval, holder/lige/modsat ved grænsen 0,1, forskellen i chancen for at sætte og dommen i alle fem tilfælde.
 * 5. Udvælgelsen på faste hænder: A og B i P1–P9 efter reglerne (den længste og så den højeste ved flere B'er,
 *    udeladelse når A ikke er entydig), kortet efter profilen Standard og de to kort ved "table feeling".
 * 6. S1 opgave 55: P9's kolonner for hånden giver ♥E 3,35 og ♥3 2,52 stik.
 * 7. MODEL.md: teksten mellem markørerne er lig `node tools/udspil/raadanalyse.mjs --markdown`, afsnit 7a står mellem
 *    afsnit 7 og 8, og afsnit 1–7 og 8–9 er uændrede bortset fra én ny linje i afsnit 9.
 */

const TUNG = { timeout: 300_000 };
const TAG = 'v50-foer-udspilsraad';

// ---------------------------------------------------------------- hjælpere

const FARVE_NR: Record<Farve, number> = { S: 0, H: 1, D: 2, C: 3 };
const VALOER: Record<string, number> = { E: 14, K: 13, D: 12, B: 11, T: 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };

/** En side: farven og kortene (valører som E K D B T 9 … 2), stigende som i `Side`. */
const side = (f: Farve, ...v: string[]): Side => ({ farve: f, kort: v.map((x) => FARVE_NR[f] * 13 + VALOER[x] - 2).sort((a, b) => a - b) });
const valg = (a: Side, b: Side, grupper: string[] = []): Valg => ({ a, b, grupper });

const S1: SituationId = 'S1-1nt-3nt';
const S2: SituationId = 'S2-stayman';
const S3: SituationId = 'S3-transfer';
const S4: SituationId = 'S4-kun-en-farve';
const S5: SituationId = 'S5-sidefarve';
const S6: SituationId = 'S6-trumf';
const S8: SituationId = 'S8-delkontrakt';

/** Hænder med n ens forskelle d (B = 3 stik) og ens sætningsandele. */
const ens = (n: number, d: number): Haandtal[] => Array.from({ length: n }, () => ({ a: 3 + d, b: 3, aSaet: 0.5, bSaet: 0.5 }));

// ---------------------------------------------------------------- accepttest 4: statistikken

describe('Statistikken (accepttest 4)', () => {
  it('forskel, standardfejl og interval: 20 hænder med +0,3 og 20 med +0,1 stik', () => {
    // Middel 0,2; afvigelserne er ± 0,1, så s² = 40 × 0,01 / 39, s = 0,101274 og standardfejlen s / √40 = 0,016013.
    // Intervallet er 0,2 ± 1,96 × 0,016013 = [0,168615; 0,231385].
    const s = statistik([...ens(20, 0.3), ...ens(20, 0.1)]);
    expect(s.n).toBe(40);
    expect(s.forskel).toBeCloseTo(0.2, 9);
    expect(s.standardfejl).toBeCloseTo(0.016013, 6);
    expect(s.interval[0]).toBeCloseTo(0.168615, 6);
    expect(s.interval[1]).toBeCloseTo(0.231385, 6);
    expect([s.holder, s.lige, s.modsat]).toEqual([1, 0, 0]);
    expect(s.saetForskel).toBeCloseTo(0, 9);
  });

  it('holder, lige og modsat ved grænsen 0,1 (0,3 − 0,2 tæller som 0,1)', () => {
    const par: [number, number][] = [
      [0.3, 0.2], // 0,1: holder
      [4, 3], // 1: holder
      [3.09, 3], // 0,09: lige
      [3, 3], // 0: lige
      [3, 3.09], // −0,09: lige
      [0.2, 0.3], // −0,1: modsat
    ];
    const s = statistik(par.map(([a, b]) => ({ a, b, aSaet: 0, bSaet: 0 })));
    expect(s.holder).toBeCloseTo(2 / 6, 9);
    expect(s.lige).toBeCloseTo(3 / 6, 9);
    expect(s.modsat).toBeCloseTo(1 / 6, 9);
  });

  it('forskellen i chancen for at sætte i procentpoint', () => {
    // (60 − 50) + (40 − 50) + (70 − 40) + (50 − 50) = 30 procentpoint over 4 hænder: 7,5.
    const andele: [number, number][] = [
      [0.6, 0.5],
      [0.4, 0.5],
      [0.7, 0.4],
      [0.5, 0.5],
    ];
    const s = statistik(andele.map(([aSaet, bSaet]) => ({ a: 3, b: 3, aSaet, bSaet })));
    expect(s.saetForskel).toBeCloseTo(7.5, 9);
  });

  it('dommen: for få hænder (n < 30) giver tallene, men ingen dom', () => {
    const s = statistik(ens(29, 1));
    expect(s.n).toBe(29);
    expect(s.forskel).toBeCloseTo(1, 9);
    expect(s.dom).toBe('for-faa');
    expect(s.udenPraktiskBetydning).toBe(false);
    expect(domTekst(s)).toBe('For få hænder');
    expect(statistik(ens(30, 1)).dom).toBe('holder');
  });

  it('dommen: holder, når intervallet ligger helt over 0', () => {
    const s = statistik([...ens(20, 0.3), ...ens(20, 0.1)]);
    expect(s.dom).toBe('holder');
    expect(s.udenPraktiskBetydning).toBe(false);
    expect(domTekst(s)).toBe('Holder');
  });

  it('dommen: modsat, når intervallet ligger helt under 0', () => {
    const s = statistik([...ens(20, -0.3), ...ens(20, -0.1)]);
    expect(s.forskel).toBeCloseTo(-0.2, 9);
    expect(s.interval[0]).toBeCloseTo(-0.231385, 6);
    expect(s.interval[1]).toBeCloseTo(-0.168615, 6);
    expect([s.holder, s.lige, s.modsat]).toEqual([0, 0, 1]);
    expect(s.dom).toBe('modsat');
    expect(domTekst(s)).toBe('Modsat');
  });

  it('dommen: ingen forskel påvist, når intervallet indeholder 0', () => {
    // Middel 0,1; afvigelserne er ± 0,5, så standardfejlen er √(40 × 0,25 / 39) / √40 = 0,080064 og intervallet
    // [−0,056926; 0,256926].
    const s = statistik([...ens(20, 0.6), ...ens(20, -0.4)]);
    expect(s.forskel).toBeCloseTo(0.1, 9);
    expect(s.standardfejl).toBeCloseTo(0.080064, 6);
    expect(s.interval[0]).toBeCloseTo(-0.056926, 6);
    expect(s.interval[1]).toBeCloseTo(0.256926, 6);
    expect([s.holder, s.lige, s.modsat]).toEqual([0.5, 0, 0.5]);
    expect(s.dom).toBe('ingen-forskel');
    expect(s.udenPraktiskBetydning).toBe(false);
    expect(domTekst(s)).toBe('Ingen forskel påvist');
  });

  it('dommen: uden praktisk betydning, når gennemsnittet ligger under 0,05 stik fra 0', () => {
    // Middel 0,02, intervallet [−0,136926; 0,176926].
    const s = statistik([...ens(20, 0.52), ...ens(20, -0.48)]);
    expect(s.forskel).toBeCloseTo(0.02, 9);
    expect(s.interval[0]).toBeCloseTo(-0.136926, 6);
    expect(s.dom).toBe('ingen-forskel');
    expect(s.udenPraktiskBetydning).toBe(true);
    expect(domTekst(s)).toBe('Ingen forskel påvist, uden praktisk betydning');

    // Også en sikker forskel kan være uden praktisk betydning: middel 0,03, standardfejl 0,003203, [0,023723; 0,036277].
    const lille = statistik([...ens(20, 0.05), ...ens(20, 0.01)]);
    expect(lille.standardfejl).toBeCloseTo(0.003203, 6);
    expect(lille.interval[0]).toBeCloseTo(0.023723, 6);
    expect(lille.dom).toBe('holder');
    expect(lille.udenPraktiskBetydning).toBe(true);
    expect([lille.holder, lille.lige, lille.modsat]).toEqual([0, 1, 0]);
    expect(domTekst(lille)).toBe('Holder, uden praktisk betydning');
  });
});

// ---------------------------------------------------------------- accepttest 5: udvælgelsen

describe('Rækkerne (accepttest 5)', () => {
  it('følger specens tabel: situationer, samlet eller pr. situation, og varianterne', () => {
    const r = Object.fromEntries(RAEKKER.map((x) => [x.id, [x.paastand, x.situationer, x.samlet, x.varianter]]));
    expect(Object.keys(r)).toEqual(['P1', 'P2', 'P3-D', 'P3-C', 'P4', 'P5', 'P6', 'P7', 'P8-S', 'P8-H', 'P8-D', 'P8-C', 'P9']);
    expect(r['P1']).toEqual(['P1', [S1, S2], true, []]);
    expect(r['P2']).toEqual(['P2', [S1, S2], true, []]);
    expect(r['P3-D']).toEqual(['P3', [S3], true, []]);
    expect(r['P4']).toEqual(['P4', [S3], true, []]);
    expect(r['P5']).toEqual(['P5', [S4, S5, S8], false, ['S4-singleton', 'S5-singleton', 'S8-singleton']]);
    expect(r['P6']).toEqual(['P6', [S4, S8], false, ['S4-doubleton', 'S8-doubleton']]);
    expect(r['P7']).toEqual(['P7', [S4], true, []]);
    // P8: hver sidefarve i S6 (♣ trumf), S4 (♥) og S8 (♠).
    expect(r['P8-S']).toEqual(['P8', [S6, S4], false, []]);
    expect(r['P8-H']).toEqual(['P8', [S6, S8], false, []]);
    expect(r['P8-D']).toEqual(['P8', [S6, S4, S8], false, []]);
    expect(r['P8-C']).toEqual(['P8', [S4, S8], false, []]);
    expect(r['P9']).toEqual(['P9', [S1, S2], true, ['S1-tablefeeling', 'S2-tablefeeling']]);
  });
});

type Forventet = Valg | 'udeladt' | null;

/** [række, situation, Vests hånd (♠.♥.♦.♣), forventet, hvorfor]. */
const TILFAELDE: [RaekkeId, SituationId, string, Forventet, string][] = [
  // P1: den korteste major (højst 3 kort) mod en minor med præcis 4 kort og 1–2 honnører.
  ['P1', S1, '752.K864.K973.Q4', valg(side('S', '7'), side('D', '3')), '♠ 7 5 2 mod ♦ K 9 7 3'],
  ['P1', S2, '752.86.KJ73.Q984', valg(side('H', '8'), side('D', '3')), 'to minorer med 4 kort: den højeste (♦)'],
  ['P1', S1, '52.864.AKQ3.J982', valg(side('S', '5'), side('C', '2')), '♦ E K D 3 har 3 honnører, så ♣'],
  ['P1', S1, 'AK5.9864.KJ73.82', valg(side('S', 'E', '5'), side('D', '3')), '♠ E K 5: "table feeling" giver begge kort'],
  ['P1', S1, '752.864.KJ73.Q98', 'udeladt', 'to lige lange majorer'],
  ['P1', S1, '752.864.9873.Q98', null, 'ingen minor med 4 kort og 1–2 honnører'],
  ['P1', S1, 'AK52.98643.KJ73.', null, 'den korteste major har 4 kort'],
  // P2: den korteste major mod den længste, delt på den korteste majors længde.
  ['P2', S1, '752.K864.K973.Q4', valg(side('S', '7'), side('H', '4'), ['3']), '3 mod 4'],
  ['P2', S2, '75.K8643.K97.Q42', valg(side('S', '7'), side('H', '4'), ['1–2']), '2 mod 5'],
  ['P2', S1, 'J852.KJ864.K97.4', valg(side('S', '2'), side('H', '6'), ['4+']), '4 mod 5'],
  ['P2', S1, '752.864.K973.Q42', 'udeladt', 'to lige lange majorer'],
  ['P2', S1, '.K8643.K973.Q842', null, 'renonce i ♠'],
  // P3: ♠ mod ♦ og ♣ hver for sig.
  ['P3-D', S3, 'Q852.K64.J973.Q4', valg(side('S', '2'), side('D', '3')), '♠ D 8 5 2 mod ♦ B 9 7 3'],
  ['P3-C', S3, 'Q852.K64.J973.Q4', valg(side('S', '2'), side('C', 'D')), 'doubleton: det højeste kort'],
  ['P3-C', S3, 'Q852.K643.J9732.', null, 'renonce i ♣'],
  ['P3-D', S3, '.K643.J9732.Q854', null, 'renonce i ♠'],
  // P4: ♥ uden dyb sekvens mod ♠.
  ['P4', S3, 'Q852.K64.J973.Q4', valg(side('H', '4'), side('S', '2')), '♥ K 6 4: det laveste kort'],
  ['P4', S3, 'Q8.QJT9.J976.Q42', valg(side('H', 'D'), side('S', 'D')), '♥ D B 10 9 er en sekvens, men ikke dyb (4 kort)'],
  ['P4', S3, 'Q8.QJT92.J97.Q42', null, '♥ D B 10 9 2 er en dyb sekvens'],
  ['P4', S3, 'Q8642..QJ98.AT42', null, 'renonce i ♥'],
  // P5: singletonen i en sidefarve mod sidefarven med 3+ kort uden honnør (den længste, så den højeste).
  ['P5', S4, '7.K8643.9762.K92', valg(side('S', '7'), side('D', '2')), '♠7 mod ♦ 9 7 6 2'],
  ['P5', S4, 'K.8643.97632.T92', valg(side('S', 'K'), side('D', '3')), 'singleton honnør; den længste B (♦ 5 kort)'],
  ['P5', S4, '7.K864.9762.T932', valg(side('S', '7'), side('D', '2')), 'lige lange B: den højeste (♦)'],
  ['P5', S4, '7.AK8643.97652.T', 'udeladt', 'to singletoner'],
  ['P5', S4, 'AJ72.K.97652.T93', null, 'singleton kun i trumf'],
  ['P5', S4, '7.K8643.KJ62.Q92', null, 'ingen sidefarve med 3+ kort uden honnør'],
  ['P5', S5, 'K8643.7.9762.T92', valg(side('H', '7'), side('D', '2')), 'S5: ♥ er en sidefarve'],
  ['P5', S8, 'K8643.7.9762.T92', valg(side('H', '7'), side('D', '2')), 'S8: ♥ er en sidefarve'],
  // P6: doubletonen uden honnør mod sidefarven med 3+ kort uden honnør.
  ['P6', S4, '72.K864.9762.KJ2', valg(side('S', '7'), side('D', '2')), '♠ 7 2 mod ♦ 9 7 6 2'],
  ['P6', S4, 'T2.Q864.9762.KJ2', valg(side('S', 'T'), side('D', '2')), '10 er ikke en honnør'],
  ['P6', S4, 'K2.Q864.9762.T92', null, 'doubletonen har en honnør'],
  ['P6', S4, '72.KQ8643.962.82', 'udeladt', 'to doubletoner uden honnør'],
  ['P6', S8, 'KJ86.72.9762.Q92', valg(side('H', '7'), side('D', '2')), 'S8: ♥ er en sidefarve'],
  // P7: sidefarven med 3+ kort uden honnør mod sidefarven med 3+ kort og 1–2 honnører uden sekvens.
  ['P7', S4, 'K73.Q864.9762.A2', valg(side('D', '2'), side('S', '3')), '♦ 9 7 6 2 mod ♠ K 7 3'],
  ['P7', S4, 'K73.8.9762.AJ542', valg(side('D', '2'), side('C', '4')), 'den længste B (♣ E B 5 4 2)'],
  ['P7', S4, 'K73.82.97652.A42', valg(side('D', '5'), side('S', '3')), 'lige lange B: den højeste (♠)'],
  ['P7', S4, 'KQ3.J864.9762.A2', null, '♠ K D 3 er en sekvens'],
  ['P7', S4, 'AKJ3.864.9762.82', null, '♠ E K B 3 har 3 honnører'],
  ['P7', S4, 'K73.86.9762.T942', 'udeladt', 'to sidefarver med 3+ kort uden honnør'],
  // P8: trumf mod hver sidefarve.
  ['P8-S', S6, 'K842.Q73.J962.95', valg(side('C', '9'), side('S', '2')), 'S6: ♣ 9 5 mod ♠ K 8 4 2'],
  ['P8-H', S6, 'K842.Q73.J962.95', valg(side('C', '9'), side('H', '3')), 'S6: ♣ mod ♥ D 7 3'],
  ['P8-D', S6, 'K842.Q73.J962.95', valg(side('C', '9'), side('D', '2')), 'S6: ♣ mod ♦ B 9 6 2'],
  ['P8-C', S6, 'K842.Q73.J962.95', null, 'B kan ikke være trumf'],
  ['P8-S', S6, 'K8432.Q73.J9652.', null, 'renonce i trumf'],
  ['P8-H', S8, '95.K842.Q73.J962', valg(side('S', '9'), side('H', '2')), 'S8: ♠ er trumf'],
  ['P8-C', S4, 'K842.95.Q73.J962', valg(side('H', '9'), side('C', '2')), 'S4: ♥ er trumf'],
  // P9: "table feeling" mod sans: toppen mod det lave kort i samme farve.
  ['P9', S1, 'KJ76.AK43.T863.J', valg(side('H', 'E'), side('H', '3'), ['E K', '4']), 'S1 opgave 55: ♥ E K 4 3'],
  ['P9', S1, 'AK74.863.J985.62', valg(side('S', 'E'), side('S', '4'), ['E K', '4']), 'E K 7 4'],
  ['P9', S2, 'KQ853.743.K98.62', valg(side('S', 'K'), side('S', '5'), ['K D', '5+']), 'K D 8 5 3'],
  ['P9', S1, 'QJ62.743.K9853.6', valg(side('S', 'D'), side('S', '2'), ['D B', '4']), 'D B 6 2'],
  ['P9', S1, 'AK7.8643.Q985.62', valg(side('S', 'E'), side('S', '7'), ['E K', '3']), 'E K 7'],
  ['P9', S1, 'AKQ4.863.J985.62', null, 'E K D 4 giver ét kort'],
  ['P9', S1, 'KQT9.863.J985.62', null, 'K D 10 9 giver ét kort'],
  ['P9', S1, 'JT62.863.Q985.A2', null, 'B 10 er ikke to honnører'],
  ['P9', S1, 'AK.86432.Q985.62', null, 'E K doubleton giver ét kort'],
  ['P9', S2, 'AK74.KQ853.62.98', 'udeladt', '"table feeling" i to farver'],
];

describe('Udvælgelsen (accepttest 5)', () => {
  it.each(TILFAELDE)('%s i %s: %s', (raekke, situation, haand, forventet, hvorfor) => {
    const r = udvaelg(raekke, situation, fraPbn(haand));
    if (forventet === null) expect(r, hvorfor).toBeNull();
    else if (forventet === 'udeladt') expect(r, hvorfor).toMatchObject({ udeladt: expect.stringMatching(/\S/) });
    else expect(r, hvorfor).toMatchObject(forventet);
  });

  it('haandtal: ved to kort bruges kortet med flest middelstik, og står de lige, det med flest sætninger', () => {
    // P1 med ♠ E K 5 ("table feeling") mod ♦ K B 7 3 i 3NT (sat ved 5 stik, 8 − niveau som appen; rettet fra 4 i
    // session 2 med Franks godkendelse 26. nov. 2026). To fordelinger; Vests kort stigende.
    const vest = fraPbn('AK5.9864.KJ73.82');
    const v = udvaelg('P1', S1, vest) as Valg;
    const kolonne = (kort: number) => vest.indexOf(kort);
    const [s5, sE] = side('S', '5', 'E').kort;
    const [d3] = side('D', '3').kort;
    const stik = (spar5: number[], sparE: number[], ruder3: number[]) =>
      [0, 1].map((i) => {
        const raekke = Array<number>(13).fill(0);
        raekke[kolonne(s5)] = spar5[i];
        raekke[kolonne(sE)] = sparE[i];
        raekke[kolonne(d3)] = ruder3[i];
        return raekke;
      });
    // ♠5 giver 5 og 5 (middel 5, sat 2 af 2); ♠E 6 og 3 (middel 4,5); ♦3 3 og 5 (middel 4, sat 1 af 2).
    expect(haandtal(v, { vest, stik: stik([5, 5], [6, 3], [3, 5]) }, '3NT')).toEqual({ a: 5, b: 4, aSaet: 1, bSaet: 0.5 });
    // ♠5 4 og 4 og ♠E 5 og 3 står lige (middel 4); ♠E sætter i 1 af 2 og bruges.
    expect(haandtal(v, { vest, stik: stik([4, 4], [5, 3], [3, 5]) }, '3NT')).toEqual({ a: 4, b: 4, aSaet: 0.5, bSaet: 0.5 });
  });
});

// ---------------------------------------------------------------- accepttest 6: S1 opgave 55

describe('S1 opgave 55 (accepttest 6)', () => {
  it('P9 giver ♥E 3,35 og ♥3 2,52 stik', () => {
    const raa = laes<Raa>(raaSti(S1));
    const o = raa.opgaver[55];
    expect(o.seed).toBe(2556829236);
    expect(o.vest).toEqual(fraPbn('KJ76.AK43.T863.J'));
    const v = udvaelg('P9', S1, o.vest);
    expect(v).toMatchObject(valg(side('H', 'E'), side('H', '3'), ['E K', '4']));
    const t = haandtal(v as Valg, o, '3NT');
    expect(t.a).toBeCloseTo(3.35, 9);
    expect(t.b).toBeCloseTo(2.52, 9);
    // 3NT sættes ved 5 stik som i appens facit (rettet fra 0,47 og 0,23, der var 4 stik; Franks godkendelse 26. nov. 2026).
    expect(t.aSaet).toBeCloseTo(0.14, 9);
    expect(t.bSaet).toBeCloseTo(0.04, 9);
  });
});

// ---------------------------------------------------------------- accepttest 3: kun forskellige hænder

describe('Analysen bruger kun forskellige hænder (accepttest 3, Franks valg 26. nov. 2026)', () => {
  it('en hånd, der står to gange, tæller én gang og står som udeladt', () => {
    const raa = laes<Raa>(raaSti(S1));
    const o = raa.opgaver[55];
    const p9 = analyser({ base: { [S1]: { ...raa, opgaver: [o, o] } }, varianter: {} }).raekker.find((x) => x.raekke === 'P9' && x.gruppe === null)!;
    expect(p9.nBase).toBe(1);
    expect(p9.udeladt).toEqual({ [UDELADT.dublet]: 1 });
  });

  it('S5-singletons 4 dubletter: P5 i S5 bruger 146 varianthænder', TUNG, () => {
    const data = { base: { [S5]: laes<Raa>(raaSti(S5)) }, varianter: { 'S5-singleton': laes<Raa>(variantSti('S5-singleton')) } };
    const p5 = analyser(data).raekker.find((x) => x.raekke === 'P5' && x.situation === S5 && x.gruppe === null)!;
    expect(p5.nVariant).toBe(146);
    expect(p5.udeladt).toEqual({ [UDELADT.dublet]: 4 });
  });
});

// ---------------------------------------------------------------- accepttest 7: MODEL.md

const START = '<!-- raadanalyse:start -->';
const SLUT = '<!-- raadanalyse:slut -->';
const OVERSKRIFT = '## 7a. Kompendiets udspilsråd mod dobbeltdummy';
const lf = (t: string) => t.replace(/\r\n/g, '\n');
const model = () => lf(readFileSync(ROOT + 'docs/MODEL.md', 'utf8'));

const git = (...args: string[]): string => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
function harTag(): boolean {
  try {
    git('rev-parse', '--verify', '--quiet', `refs/tags/${TAG}^{commit}`);
    return true;
  } catch {
    return false;
  }
}

/** MODEL.md uden afsnit 7a (fra overskriften til "## 8."). */
function uden7a(tekst: string): string {
  const fra = tekst.indexOf(`\n${OVERSKRIFT}\n`) + 1;
  const til = tekst.indexOf('\n## 8. ') + 1;
  return tekst.slice(0, fra) + tekst.slice(til);
}

const ikkeTomme = (t: string) => t.split('\n').filter((l) => l.trim() !== '');

describe('MODEL.md (accepttest 7)', () => {
  it('afsnit 7a står mellem afsnit 7 og 8 med overskriften og markørerne', () => {
    const t = model();
    const i7 = t.indexOf('\n## 7. Udspil\n');
    const i7a = t.indexOf(`\n${OVERSKRIFT}\n`);
    const i8 = t.indexOf('\n## 8. Forbehold\n');
    expect(i7).toBeGreaterThan(-1);
    expect(i7a).toBeGreaterThan(i7);
    expect(i8).toBeGreaterThan(i7a);
    const start = t.indexOf(START);
    const slut = t.indexOf(SLUT);
    expect(start).toBeGreaterThan(i7a);
    expect(slut).toBeGreaterThan(start);
    expect(i8).toBeGreaterThan(slut);
  });

  it('teksten mellem markørerne er lig node tools/udspil/raadanalyse.mjs --markdown', TUNG, () => {
    const t = model();
    const start = t.indexOf(START);
    const slut = t.indexOf(SLUT);
    expect(start).toBeGreaterThan(-1);
    expect(slut).toBeGreaterThan(start);
    const ud = lf(execFileSync(process.execPath, ['tools/udspil/raadanalyse.mjs', '--markdown'], { cwd: ROOT, encoding: 'utf8' }));
    expect(ud.trim().length).toBeGreaterThan(0);
    expect(t.slice(start + START.length, slut).trim()).toBe(ud.trim());
  });

  it('afsnit 1–7 og 8–9 er uændrede bortset fra én ny linje i afsnit 9', (ctx) => {
    if (!harTag()) ctx.skip(`Tagget ${TAG} findes ikke her (fx i GitHub Actions, der henter uden tags), så testen kører kun lokalt.`);
    const foer = lf(git('show', `${TAG}:docs/MODEL.md`));
    const nu = model();
    expect(nu).toContain(`\n${OVERSKRIFT}\n`);
    const rest = uden7a(nu);
    const i9foer = foer.indexOf('\n## 9. ');
    const i9 = rest.indexOf('\n## 9. ');
    expect(i9foer).toBeGreaterThan(-1);
    expect(rest.slice(0, i9)).toBe(foer.slice(0, i9foer));
    // Afsnit 9: de samme linjer (tomme linjer tæller ikke) og præcis én ny.
    const a = ikkeTomme(foer.slice(i9foer));
    const b = ikkeTomme(rest.slice(i9));
    expect(b).toHaveLength(a.length + 1);
    const ny = b.findIndex((l, i) => l !== a[i]);
    expect([...b.slice(0, ny), ...b.slice(ny + 1)]).toEqual(a);
  });
});
