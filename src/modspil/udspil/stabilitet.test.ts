import { describe, expect, it } from 'vitest';
import { profil } from '../model/metoder';
import { muligeUdspil } from '../model/udspil';
import { art, FARVER, farvevaerdier, laes, maal, middelHundrededele, raaSti, situationsfil, type Farve, type Raa } from './hjaelp';

/*
 * Stabiliteten i SPEC-modspil-v2.md, trin 1, Kontrollen: 5 opgaver pr. situation er regnet igen med 100 nye fordelinger
 * (`python tools/udspil/kontrol.py --stabilitet`, seed = opgavens seed XOR 0x9E3779B9). For opgaverne med en klar bedste
 * farve (forspring på mindst 0,3 stik i profilen Standard) skal mindst 90 % have samme bedste farve, og den bedste farves
 * middelstik må højst afvige 3 standardfejl mellem de to regninger (Franks valg 25. nov. 2026, session 1b; før 0,25 stik,
 * som 100 fordelinger ikke kan holde). Standardfejlen på forskellen er √(s₁²/n₁ + s₂²/n₂), hvor s er spredningen af
 * stikkene for farvens kort (profilen Standards kort; ved "table feeling" det bedste af de to) i hver regning.
 */

/** Middelstik og standardfejl for farvens kort i én regning (kortet med det højeste middel blandt Standards udspil). */
function kortStatistik(o: { vest: number[]; stik: number[][] }, f: Farve, kontrakt: string): { middel: number; se2: number } {
  const sorteret = [...o.vest].sort((a, b) => a - b);
  const nr = FARVER.indexOf(f);
  const valoerer = sorteret.filter((c) => Math.floor(c / 13) === nr).map((c) => (c % 13) + 2);
  let bedst = { middel: -Infinity, se2: 0 };
  for (const v of muligeUdspil(valoerer, art(kontrakt), profil('standard'))) {
    const kolonne = o.stik.map((r) => r[sorteret.indexOf(nr * 13 + v - 2)]);
    const n = kolonne.length;
    const middel = kolonne.reduce((a, x) => a + x, 0) / n;
    const s2 = kolonne.reduce((a, x) => a + (x - middel) ** 2, 0) / (n - 1);
    if (middel > bedst.middel) bedst = { middel, se2: s2 / n };
  }
  return bedst;
}

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

  it('de klare opgaver har samme bedste farve i mindst 90 % og højst 3 standardfejls afvigelse', () => {
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
        const k1 = kortStatistik(gammel, b1.farve, s.kontrakt);
        const k2 = kortStatistik(ny, b1.farve, s.kontrakt);
        const forskel = Math.abs(k1.middel - k2.middel);
        const se = Math.sqrt(k1.se2 + k2.se2);
        if (forskel > 3 * se + 1e-9) afvigelser.push(`${s.id} ${ny.seed}: ${b1.farve} ${forskel.toFixed(2)} stik > 3 × ${se.toFixed(2)}`);
      }
    }
    expect(klare).toBeGreaterThan(0);
    expect(samme / klare).toBeGreaterThanOrEqual(0.9);
    expect(afvigelser).toEqual([]);
  });
});
