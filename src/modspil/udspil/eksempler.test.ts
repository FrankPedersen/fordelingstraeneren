import { describe, expect, it } from 'vitest';
import { appSti, bedsteFarver, farvevaerdier, fraPbn, kompendieraad, laes, situationsfil, type AppData } from './hjaelp';

/*
 * Accepttest 6 i SPEC-modspil-v2.md, trin 1: faste eksempler fra Kompendiet. Mindst én hånd pr. situation, hvor
 * Kompendiets råd er tydeligt, og opgavens bedste farve er en af dem, rådet peger på. Hånden er regnet som en ekstra
 * opgave med fast hånd (ikke med i de 150). Farvens værdi er middelstikket for profilen Standards udspil i farven; de
 * bedste farver er dem under 0,1 stik fra den bedste (Franks svar 4). Rød, indtil generatoren har kørt.
 */

const fil = situationsfil();

describe('Faste eksempler fra Kompendiet (accepttest 6)', () => {
  it('hver situation har mindst ét eksempel', () => {
    for (const s of fil.situationer) expect(s.eksempler.length, s.id).toBeGreaterThan(0);
  });

  it.each(fil.situationer.map((s) => [s.id, s] as const))('%s: den bedste farve er blandt dem, Kompendiets råd peger på', (id, s) => {
    const app = laes<AppData>(appSti(id));
    s.eksempler.forEach((eks, i) => {
      const o = app.eksempler[i];
      expect(o.haand).toBe(eks.haand);
      expect(o.vest).toEqual(fraPbn(eks.haand));
      const raad = kompendieraad(o.vest, s.kompendieraad.regler);
      expect(raad.length, `${eks.haand}: rådet peger på mindst én farve`).toBeGreaterThan(0);
      const bedste = bedsteFarver(farvevaerdier(o.vest, o.middel, s.kontrakt));
      expect(
        bedste.some((f) => raad.includes(f)),
        `${eks.haand}: bedste ${bedste.join(' ')}, rådet ${raad.join(' ')}`,
      ).toBe(true);
    });
  });
});
