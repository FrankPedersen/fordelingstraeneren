import { describe, expect, it } from 'vitest';
import type { Card } from '../../domain/cards';
import {
  bedoemUdspil,
  forklarUdspil,
  lavFindUdspil,
  pulje,
  udspilFacit,
  vedBordet,
  type OpgaveRef,
  type SituationId,
  type UdspilFacit,
} from '../model/findUdspil';
import type { Profil } from '../model/metoder';
import { kortNavn } from '../model/tekst';
import { alleOpgaver, datasaet, NIVEAU1, NIVEAUER, PROFILER, SITUATIONER, situation } from './hjaelp';

/*
 * Accepttest 4 i SPEC-modspil-v2.md, trin 2: niveauerne. Niveau 1–2 giver kun klare opgaver og svar i farver, niveau 1
 * kun S1, S4 og S7, og niveau 3 og op svar i kort (specens niveautabel):
 *
 *   niveau 1: farven, de klare i S1, S4 og S7;  niveau 2: farven, de klare i alle otte;  niveau 3: kortet, de klare;
 *   niveau 4–5: kortet, også de tætte (forspring under 0,2) og dem, der afviger fra Kompendiet, altså alle opgaver.
 *
 * Accepttest 5 siger, at opgaver, der afviger fra Kompendiet, kun findes på niveau 4–5, så niveau 1–3 er de klare, der
 * ikke afviger. Puljen står i situationernes og datafilernes orden. Eksemplerne i datafilerne (trin 1's accepttest 6)
 * er ikke opgaver.
 *
 * Svarene (specens Niveauerne): svarer brugeren med et kort i den rigtige farve, men ikke profilens kort, er svaret
 * forkert, og dommen siger, at farven var rigtig, og hvilket kort profilen spiller ud.
 */

const data = datasaet();
const ALLE = alleOpgaver(data);
const noegle = (r: OpgaveRef) => `${r.situation}#${r.indeks}`;
const farveAf = (c: Card) => Math.floor(c / 13);
const navn = (c: Card, sprog: 'da' | 'en') => kortNavn(farveAf(c), (c % 13) + 2, sprog);
const TUNG = { timeout: 120_000 };

const facitCache = new Map<string, UdspilFacit[]>();
/** Modellens facit for alle 1200 opgaver med profilen, i ALLE's orden. */
function alleFacit(p: Profil): UdspilFacit[] {
  if (!facitCache.has(p.id)) facitCache.set(p.id, ALLE.map((t) => udspilFacit(t.situation, t.opgave, p)));
  return facitCache.get(p.id)!;
}
const forventetPulje = (p: Profil, tag: (s: SituationId, f: UdspilFacit) => boolean) =>
  ALLE.filter((t, i) => tag(t.situation, alleFacit(p)[i])).map(noegle);

describe.each(PROFILER)('Niveauerne (accepttest 4): %s', (_, p) => {
  it('niveau 1: de klare opgaver i S1, S4 og S7, der ikke afviger fra Kompendiet', TUNG, () => {
    const forventet = forventetPulje(p, (s, f) => NIVEAU1.includes(s) && f.klar && !f.afviger);
    const p1 = pulje(1, p, data);
    expect(p1.map(noegle)).toEqual(forventet);
    expect([...new Set(p1.map((r) => r.situation))]).toEqual([...NIVEAU1]);
  });

  it('niveau 2 og 3: de klare opgaver i alle otte situationer, der ikke afviger fra Kompendiet', TUNG, () => {
    const forventet = forventetPulje(p, (_s, f) => f.klar && !f.afviger);
    for (const niveau of [2, 3] as const) {
      const pl = pulje(niveau, p, data);
      expect(pl.map(noegle), `niveau ${niveau}`).toEqual(forventet);
      expect([...new Set(pl.map((r) => r.situation))], `niveau ${niveau}`).toEqual([...SITUATIONER]);
    }
  });

  it('niveau 4 og 5: alle opgaver, også de tætte og dem, der afviger fra Kompendiet', TUNG, () => {
    for (const niveau of [4, 5] as const) expect(pulje(niveau, p, data).map(noegle), `niveau ${niveau}`).toEqual(ALLE.map(noegle));
    const facit = alleFacit(p);
    expect(facit.filter((f) => !f.klar).length).toBeGreaterThan(0);
    expect(facit.filter((f) => f.afviger).length).toBeGreaterThan(0);
  });

  it('opgaven kommer fra niveauets pulje med niveauets svarform, opgavens data, facit, forklaring og "Ved bordet"', TUNG, () => {
    for (const niveau of NIVEAUER) {
      const pl = new Set(pulje(niveau, p, data).map(noegle));
      for (let seed = 1; seed <= 40; seed++) {
        const o = lavFindUdspil(niveau, seed, p, data);
        const hvor = `niveau ${niveau}, seed ${seed}`;
        expect([o.niveau, o.seed], hvor).toEqual([niveau, seed]);
        expect(o.profil, hvor).toEqual(p);
        expect(o.svar, hvor).toBe(niveau <= 2 ? 'farve' : 'kort');
        expect(pl.has(noegle(o)), `${hvor}: ${noegle(o)} er i puljen`).toBe(true);
        const d = data[o.situation].opgaver[o.indeks];
        expect(o.vest, hvor).toEqual([...d.vest]);
        expect(o.dataSeed, hvor).toBe(d.seed);
        expect(o.facit, hvor).toEqual(udspilFacit(o.situation, d, p));
        const s = situation(o.situation);
        expect([o.giver, o.meldinger, o.kontrakt, o.art], hvor).toEqual([s.giver, s.meldinger, s.kontrakt, s.kontrakt.endsWith('NT') ? 'sans' : 'farve']);
        const tekst = forklarUdspil(o.situation, d, p, o.svar);
        expect(o.forklaring, hvor).toEqual(tekst.forklaring);
        expect(o.afvigelse, hvor).toEqual(tekst.afvigelse);
        expect(o.vedBordet, hvor).toEqual(vedBordet(o.situation));
        if (niveau <= 3) expect([o.facit.klar, o.facit.afviger], hvor).toEqual([true, false]);
        if (niveau === 1) expect(NIVEAU1, hvor).toContain(o.situation);
      }
    }
  });

  it('niveau 1 giver kun S1, S4 og S7, og niveau 2 giver alle otte situationer', TUNG, () => {
    const situationer = (niveau: 1 | 2) => new Set(Array.from({ length: 300 }, (_x, i) => lavFindUdspil(niveau, i + 1, p, data).situation));
    expect([...situationer(1)].sort()).toEqual([...NIVEAU1].sort());
    expect([...situationer(2)].sort()).toEqual([...SITUATIONER].sort());
  });

  it('niveau 1–2: svaret er en farve, og de rigtige farver er facit', TUNG, () => {
    for (const niveau of [1, 2] as const) {
      for (let seed = 1; seed <= 30; seed++) {
        const o = lavFindUdspil(niveau, seed, p, data);
        for (const farve of new Set(o.vest.map(farveAf))) {
          const dom = bedoemUdspil(o, { farve });
          const rigtig = o.facit.farver.includes(farve);
          expect([dom.rigtig, dom.farveRigtig], `niveau ${niveau}, seed ${seed}, farve ${farve}`).toEqual([rigtig, rigtig]);
        }
      }
    }
  });

  it('niveau 3–5: svaret er et kort; et kort i den rigtige farve, men ikke profilens, er forkert, og dommen siger, at farven var rigtig, og hvilket kort profilen spiller ud', TUNG, () => {
    let andetKort = 0;
    for (const niveau of [3, 4, 5] as const) {
      for (let seed = 1; seed <= 30; seed++) {
        const o = lavFindUdspil(niveau, seed, p, data);
        for (const kort of o.vest) {
          const hvor = `niveau ${niveau}, seed ${seed}, ${navn(kort, 'da')}`;
          const dom = bedoemUdspil(o, { kort });
          const rigtig = o.facit.kort.includes(kort);
          const farveRigtig = o.facit.farver.includes(farveAf(kort));
          expect([dom.rigtig, dom.farveRigtig], hvor).toEqual([rigtig, farveRigtig]);
          if (farveRigtig && !rigtig) {
            andetKort++;
            expect(dom.tekst, hvor).toBeDefined();
            for (const profilens of o.facit.kort.filter((c) => farveAf(c) === farveAf(kort))) {
              expect(dom.tekst!.da, hvor).toContain(navn(profilens, 'da'));
              expect(dom.tekst!.en, hvor).toContain(navn(profilens, 'en'));
            }
          } else expect(dom.tekst, hvor).toBeUndefined();
        }
      }
    }
    expect(andetKort).toBeGreaterThan(20);
  });
});
