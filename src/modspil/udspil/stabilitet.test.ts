import { describe, expect, it } from 'vitest';
import { FARVER, farvevaerdier, laes, maal, middelHundrededele, raaSti, situationsfil, type Farve, type Raa } from './hjaelp';

/*
 * Stabiliteten i SPEC-modspil-v2.md, trin 1, Kontrollen: 5 opgaver pr. situation er regnet igen med 100 nye fordelinger
 * (`python tools/udspil/kontrol.py --stabilitet`, seed = opgavens seed XOR 0x9E3779B9). For opgaverne med en klar bedste
 * farve (forspring på mindst 0,3 stik i profilen Standard) skal mindst 90 % have samme bedste farve, og den bedste farves
 * middelstik må højst afvige 0,25 mellem de to regninger. Rød, indtil kontrollen har kørt.
 */

const fil = situationsfil();
const stabilSti = (id: string) => `tools/udspil/raa/stabilitet/${id}.json`;

function vaerdier(o: { vest: number[]; stik: number[][] }, kontrakt: string) {
  const middel = Array.from({ length: 13 }, (_, k) => middelHundrededele(o.stik.map((r) => r[k])) / 100);
  return farvevaerdier(o.vest, middel, kontrakt);
}

/** Den bedste farve og forspringet over den næstbedste. */
function bedste(v: Partial<Record<Farve, number>>): { farve: Farve; forspring: number } {
  const sorteret = FARVER.filter((f) => v[f] !== undefined).sort((a, b) => (v[b] as number) - (v[a] as number));
  const forspring = sorteret.length > 1 ? (v[sorteret[0]] as number) - (v[sorteret[1]] as number) : Infinity;
  return { farve: sorteret[0], forspring };
}

describe('Stabiliteten (Kontrollen, trin 1)', () => {
  it('5 opgaver pr. situation er regnet igen med nye fordelinger', () => {
    for (const s of fil.situationer) {
      const st = laes<Raa>(stabilSti(s.id));
      const raa = laes<Raa>(raaSti(s.id));
      expect(st.opgaver.map((o) => o.seed), s.id).toEqual(raa.opgaver.slice(0, 5).map((o) => o.seed));
      for (const o of st.opgaver) expect(o.fordelinger).toHaveLength(fil.fordelinger);
    }
  });

  it('de klare opgaver har samme bedste farve i mindst 90 % og højst 0,25 stiks afvigelse', () => {
    let klare = 0;
    let samme = 0;
    const afvigelser: string[] = [];
    for (const s of fil.situationer) {
      const raa = laes<Raa>(raaSti(s.id));
      const st = laes<Raa>(stabilSti(s.id));
      expect(maal(s.kontrakt).saet).toBeGreaterThan(0);
      for (const ny of st.opgaver) {
        const gammel = raa.opgaver.find((o) => o.seed === ny.seed)!;
        const v1 = vaerdier(gammel, s.kontrakt);
        const v2 = vaerdier(ny, s.kontrakt);
        const b1 = bedste(v1);
        if (b1.forspring < 0.3) continue;
        klare++;
        if (bedste(v2).farve === b1.farve) samme++;
        const forskel = Math.abs((v1[b1.farve] as number) - (v2[b1.farve] as number));
        if (forskel > 0.25 + 1e-9) afvigelser.push(`${s.id} ${ny.seed}: ${b1.farve} ${forskel.toFixed(2)}`);
      }
    }
    expect(klare).toBeGreaterThan(0);
    expect(samme / klare).toBeGreaterThanOrEqual(0.9);
    expect(afvigelser).toEqual([]);
  });
});
