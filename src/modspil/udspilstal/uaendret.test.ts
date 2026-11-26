import { describe, expect, it } from 'vitest';
import type { Tekst } from '../model/forklaring';
import { datasaet, PROFILER, SITUATIONER } from '../find-udspil/hjaelp';
import { forklarUdspil, type SituationId, type Svarform } from '../model/findUdspil';
import foer from './foer.json';
import { FASTE, facitHash, nye, NYE_DA, NYE_EN, SVAR, uden } from './hjaelp';

/*
 * Accepttest 5 og 6 i SPEC-udspilstal.md. foer.json er skrevet i den røde fase med koden ved tagget
 * `v51-foer-udspilstal` (main før ændringen).
 *
 * 5. Forklaringen er ellers uændret: for 3 faste opgaver pr. situation (`FASTE` i hjaelp.ts), hver profil og begge
 *    svarformer er den nye forklaring den gamle med de nye sætninger ("Med dobbeltdummy …") indsat og intet andet. En ny
 *    sætning står enten sidst (efter Kompendiets råd) eller lige efter sætningen om de to rigtige kort ved "table feeling"
 *    ("… er begge rigtige." / "… are both right."). Afvigelsen er uændret.
 * 6. Facit er uændret: for alle 1200 opgaver og de tre profiler er `udspilFacit` (farver, kort, klar, afviger og tabel)
 *    og prisen for hvert muligt svar de samme som ved tagget (sha256 i foer.json).
 */

const TUNG = { timeout: 120_000 };
const data = datasaet();

interface Foer {
  situation: SituationId;
  indeks: number;
  seed: number;
  profil: string;
  svar: Svarform;
  forklaring: Tekst;
  afvigelse?: Tekst;
}
const FORKLARINGER = foer.forklaringer as Foer[];

/** Hvor de nye sætninger står: [sidst?, antal efter "table feeling"]; fejl, hvis en står et andet sted. */
function placering(t: string, re: RegExp, foranTF: string): { sidst: boolean; efterTF: number; andre: string[] } {
  let sidst = false;
  let efterTF = 0;
  const andre: string[] = [];
  for (const m of t.matchAll(re)) {
    const i = m.index!;
    if (i + m[0].length === t.length) sidst = true;
    else if (t.slice(0, i).endsWith(foranTF)) efterTF++;
    else andre.push(m[0]);
  }
  return { sidst, efterTF, andre };
}

describe('Forklaringen er ellers uændret (accepttest 5)', () => {
  it('foer.json har 3 opgaver pr. situation, hver profil og begge svarformer', () => {
    expect(foer.tag).toBe('v51-foer-udspilstal');
    expect(FORKLARINGER).toHaveLength(SITUATIONER.length * 3 * PROFILER.length * SVAR.length);
    for (const id of SITUATIONER) expect(FASTE[id], id).toHaveLength(3);
  });

  it('den nye forklaring er den gamle med de nye sætninger indsat de beskrevne steder og intet andet', () => {
    let medNye = 0;
    for (const f of FORKLARINGER) {
      const hvor = `${f.situation} #${f.indeks}, ${f.profil}, ${f.svar}`;
      const o = data[f.situation].opgaver[f.indeks];
      expect(o.seed, `${hvor}: seed`).toBe(f.seed);
      const p = PROFILER.find(([navn]) => navn === f.profil)![1];
      const ny = forklarUdspil(f.situation, o, p, f.svar);
      expect(ny.afvigelse, `${hvor}: afvigelsen`).toEqual(f.afvigelse);
      expect(uden(ny.forklaring.da, NYE_DA), `${hvor}: dansk`).toBe(f.forklaring.da);
      expect(uden(ny.forklaring.en, NYE_EN), `${hvor}: engelsk`).toBe(f.forklaring.en);
      const da = placering(ny.forklaring.da, NYE_DA, 'er begge rigtige.');
      const en = placering(ny.forklaring.en, NYE_EN, 'are both right.');
      expect(da.andre, `${hvor}: dansk`).toEqual([]);
      expect(en.andre, `${hvor}: engelsk`).toEqual([]);
      expect([en.sidst, en.efterTF], `${hvor}: samme steder på begge sprog`).toEqual([da.sidst, da.efterTF]);
      expect(da.efterTF, hvor).toBeLessThanOrEqual(1);
      if (nye(ny.forklaring.da, NYE_DA).length > 0) medNye++;
    }
    // De faste opgaver dækker begge steder; mindst halvdelen af forklaringerne har en ny sætning.
    expect(medNye).toBeGreaterThan(FORKLARINGER.length / 2);
  });

  it('"table feeling" med E K, K D og D B i S1 og S2 får tilføjelsen, B 10 og S3 og S7 ikke', () => {
    const efterTF = (id: SituationId, indeks: number) =>
      placering(forklarUdspil(id, data[id].opgaver[indeks], PROFILER[0][1], 'kort').forklaring.da, NYE_DA, 'er begge rigtige.').efterTF;
    expect(efterTF('S1-1nt-3nt', 55)).toBe(1); // ♥E K 4 3
    expect(efterTF('S1-1nt-3nt', 42)).toBe(1); // D B
    expect(efterTF('S2-stayman', 18)).toBe(1); // K D
    expect(efterTF('S3-transfer', 43)).toBe(0); // E K, men P9 er kun målt i S1 og S2
    expect(efterTF('S3-transfer', 8)).toBe(0); // B 10
    expect(efterTF('S7-makker-aabnet', 18)).toBe(0); // B 10
  });
});

describe('Facit er uændret (accepttest 6)', () => {
  it('udspilFacit og prisen for alle 1200 opgaver og de tre profiler er som ved tagget', TUNG, () => {
    expect(SITUATIONER.reduce((n, id) => n + data[id].opgaver.length, 0)).toBe(1200);
    expect(facitHash(data)).toBe(foer.facitHash);
  });
});
