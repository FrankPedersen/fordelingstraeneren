import { describe, expect, it } from 'vitest';
import { deal } from '../../domain/dealer';
import { mulberry32 } from '../../engine/rng';
import { alleOpfyldt, appSti, fordeling, laes, maal, middelHundrededele, raaSti, situationsfil, type AppData, type Raa, type RaaOpgave, type Situation } from './hjaelp';

/*
 * Accepttest 3–5 i SPEC-modspil-v2.md, trin 1 (Kontrollen). Røde, indtil Frank har kørt generatoren
 * (`python tools/udspil/generer.py --alle`), som skriver tools/udspil/raa/<id>.json og src/modspil/content/udspil/<id>.json.
 *
 * 3. Hænderne og fordelingerne: hver opgaves hånd genskabes med appens deal(seed) og hver fordeling med appens shuffle
 *    ud fra de gemte seeds, og kravene kontrolleres med egen TS-kode og interpreter.ts (hjaelp.ts), ikke Pythons. For den
 *    første opgave pr. situation tjekkes også, at hvert seed, generatoren sprang over, virkelig ikke opfylder kravene.
 * 4. Opsummeringen: middelstik (hundrededele, rundet halvt op) og antal sætninger pr. kort i appens data regnes igen fra
 *    de rå data og skal være ens.
 * 5. Antallet: 50 opgaver pr. situation, 100 fordelinger pr. opgave, 13 kort pr. fordeling og stik mellem 0 og 13.
 */

const fil = situationsfil();
const TUNG = { timeout: 300_000 };

function tjekOpgave(s: Situation, o: RaaOpgave, fastHaand: boolean): void {
  expect(o.vest).toHaveLength(13);
  expect(new Set(o.vest).size).toBe(13);
  if (!fastHaand) {
    const h = deal(o.seed);
    expect([...h.W].sort((a, b) => a - b), `opgave ${o.seed}: Vests hånd`).toEqual(o.vest);
    expect(alleOpfyldt(h, s.krav), `opgave ${o.seed}: kravene til de fire hænder`).toBe(true);
  } else {
    expect(alleOpfyldt({ N: [], E: [], S: [], W: o.vest }, s.krav, ['W']), 'eksemplets hånd opfylder kravet til Vest').toBe(true);
  }
  for (const f of o.fordelinger) {
    const h = fordeling(o.vest, f);
    expect(new Set([...h.N, ...h.E, ...h.S, ...h.W]).size).toBe(52);
    if (!alleOpfyldt(h, s.krav, ['N', 'E', 'S'])) throw new Error(`${s.id}, opgave ${o.seed}: fordelingen ${f} opfylder ikke kravene`);
  }
}

describe.each(fil.situationer.map((s) => [s.id, s] as const))('%s', (id, s) => {
  it('hænderne og fordelingerne genskabes i TS og opfylder kravene (accepttest 3)', TUNG, () => {
    const raa = laes<Raa>(raaSti(id));
    for (const o of raa.opgaver) tjekOpgave(s, o, false);
    raa.eksempler.forEach((o, i) => {
      expect(o.seed).toBe(s.eksempler[i].seed);
      tjekOpgave(s, o, true);
    });
  });

  it('de seeds, generatoren sprang over, opfylder ikke kravene (første opgave; accepttest 3)', TUNG, () => {
    const raa = laes<Raa>(raaSti(id));
    const foerste = raa.opgaver[0];
    // Opgaverne: hvert seed før den første opgave giver en hånd, der ikke opfylder kravene.
    const rng = mulberry32(s.seed);
    let seed = rng.uint32();
    let sprunget = 0;
    while (seed !== foerste.seed) {
      if (alleOpfyldt(deal(seed), s.krav)) throw new Error(`${id}: seed ${seed} opfylder kravene, men blev sprunget over`);
      seed = rng.uint32();
      if (++sprunget > 10_000_000) throw new Error(`${id}: den første opgaves seed findes ikke i situationens række`);
    }
    // Fordelingerne: rækken fra opgavens seed giver præcis de gemte seeds blandt dem, der opfylder kravene.
    const r = mulberry32(foerste.seed);
    const brugt: number[] = [];
    let forsoeg = 0;
    while (brugt.length < foerste.fordelinger.length) {
      const f = r.uint32();
      forsoeg++;
      if (alleOpfyldt(fordeling(foerste.vest, f), s.krav, ['N', 'E', 'S'])) brugt.push(f);
    }
    expect(brugt).toEqual(foerste.fordelinger);
    expect(forsoeg).toBe(foerste.forsoeg);
  });

  it('appens opsummering er lig de rå data (accepttest 4)', TUNG, () => {
    const raa = laes<Raa>(raaSti(id));
    const app = laes<AppData>(appSti(id));
    const { saet } = maal(s.kontrakt);
    expect(app.kontrakt).toBe(s.kontrakt);
    expect(app.fordelinger).toBe(raa.fordelinger);
    const par = [...raa.opgaver.map((o, i) => [o, app.opgaver[i]] as const), ...raa.eksempler.map((o, i) => [o, app.eksempler[i]] as const)];
    expect(app.opgaver).toHaveLength(raa.opgaver.length);
    expect(app.eksempler).toHaveLength(raa.eksempler.length);
    for (const [r, a] of par) {
      expect(a.seed).toBe(r.seed);
      expect(a.vest).toEqual(r.vest);
      for (let k = 0; k < 13; k++) {
        const kolonne = r.stik.map((rk) => rk[k]);
        expect(Math.round(a.middel[k] * 100), `${id} ${r.seed} kort ${k}: middel`).toBe(middelHundrededele(kolonne));
        expect(a.saet[k], `${id} ${r.seed} kort ${k}: sætninger`).toBe(kolonne.filter((x) => x >= saet).length);
      }
    }
  });

  it('antallet: 50 opgaver, 100 fordelinger, 13 kort og stik mellem 0 og 13 (accepttest 5)', () => {
    const raa = laes<Raa>(raaSti(id));
    expect(raa.id).toBe(id);
    expect(raa.kontrakt).toBe(s.kontrakt);
    expect(raa.fordelinger).toBe(fil.fordelinger);
    expect(raa.opgaver).toHaveLength(fil.opgaver);
    expect(new Set(raa.opgaver.map((o) => o.seed)).size).toBe(fil.opgaver);
    expect(raa.eksempler).toHaveLength(s.eksempler.length);
    for (const o of [...raa.opgaver, ...raa.eksempler]) {
      expect(o.fordelinger).toHaveLength(fil.fordelinger);
      expect(o.stik).toHaveLength(fil.fordelinger);
      for (const r of o.stik) {
        expect(r).toHaveLength(13);
        for (const x of r) expect(Number.isInteger(x) && x >= 0 && x <= 13).toBe(true);
      }
    }
  });
});
