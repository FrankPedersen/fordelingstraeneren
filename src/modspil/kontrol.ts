import { describe, expect, it } from 'vitest';
import { bruteFacit } from './bruteforce';
import { FOERSTE_NIVEAU, harOvelse, lavOpgave, OVELSER, type Niveau } from './model/generator';
import type { Profil } from './model/metoder';

/**
 * Accepttest 7 i SPEC-modspil.md: den uafhængige kontrol. For hver øvelse, profilen har, laves opgaver for seed 1 til
 * `antal` (niveauet går på omgang mellem øvelsens niveauer), og facit, metoden og (i regel 11 og 12) hvilke skal være
 * de samme som den uafhængige gennemregning (brute force) i `bruteforce.ts`, der ikke deler kode med løseren. Kun til
 * testene; appen henter ikke filen. Titlerne er på dansk (Franks svar 6, 17. nov. 2026): "uafhængig gennemregning" og
 * "tilfældige spil" i stedet for "brute force" og "seeds".
 */

/** Data uden felter, der er undefined, og med nøglerne i fast orden. */
function ordnet(x: unknown): unknown {
  if (Array.isArray(x)) return x.map(ordnet);
  if (x !== null && typeof x === 'object') {
    return Object.fromEntries(
      Object.entries(x)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => [k, ordnet(v)]),
    );
  }
  return x;
}

const ens = (a: unknown, b: unknown): boolean => JSON.stringify(ordnet(a)) === JSON.stringify(ordnet(b));
const vis = (x: unknown): string => JSON.stringify(ordnet(x));

export function kontrolSuite(navn: string, profil: Profil, antal: number): void {
  describe(`Uafhængig gennemregning af facit (accepttest 7): ${navn}`, () => {
    for (const ovelse of OVELSER) {
      it(`${ovelse}: ${antal.toLocaleString('da-DK')} tilfældige spil giver samme facit som den uafhængige gennemregning`, { timeout: 300_000 }, (ctx) => {
        if (!harOvelse(ovelse, profil)) ctx.skip(`profilen har ikke øvelsen ${ovelse}`);
        const niveauer = ([1, 2, 3, 4, 5] as Niveau[]).filter((n) => n >= FOERSTE_NIVEAU[ovelse]);
        const fejl: string[] = [];
        for (let seed = 1; seed <= antal && fejl.length < 10; seed++) {
          const niveau = niveauer[seed % niveauer.length];
          const hvor = `seed ${seed}, niveau ${niveau}`;
          try {
            const o = lavOpgave(ovelse, niveau, seed, profil);
            const b = bruteFacit(o);
            if (!ens(o.facit, b.facit)) fejl.push(`${hvor}: facit ${vis(o.facit)}, gennemregningen ${vis(b.facit)}`);
            if (!ens(o.metode, b.metode)) fejl.push(`${hvor}: metoden ${vis(o.metode)}, gennemregningen ${vis(b.metode)}`);
            if (o.hvilke !== undefined && !ens(o.hvilke, b.hvilke)) fejl.push(`${hvor}: hvilke ${vis(o.hvilke)}, gennemregningen ${vis(b.hvilke)}`);
          } catch (e) {
            fejl.push(`${hvor}: ${(e as Error).message}`);
          }
        }
        expect(fejl).toEqual([]);
      });
    }
  });
}
