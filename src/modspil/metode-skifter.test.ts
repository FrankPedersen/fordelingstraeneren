import { describe, expect, it } from 'vitest';
import { lavOpgave, type Niveau } from './model/generator';
import { udspilLaengde } from './model/loeser';
import { aflaesTilspil } from './model/markering';
import { profil } from './model/metoder';

/*
 * Accepttest 7a i SPEC-modspil.md: metoden skifter facit.
 *
 * - Samme seed med Standard og Omvendt giver modsat facit for et kald eller en afvisning. Det kræver, at generatoren til
 *   øvelse 4 (Aflæs markeringen) vælger fordelingen, udspillet og Østs kort uden at se på metoden for kald eller
 *   afvisning: samme seed giver samme stik, og kun aflæsningen skifter. Standard og Omvendt har samme honnørudspil
 *   (top af sekvens), så udspillet er det samme.
 * - Med 4.-højeste og 3. og 5. højeste giver samme udspil forskellig længde (løseren til øvelse 3).
 *
 * Grænsefladen står i loeser.test.ts, markering.test.ts og opgaver.test.ts.
 */

const standard = profil('standard');
const omvendt = profil('omvendt');
const MODSAT: Record<string, string> = { kald: 'afvisning', afvisning: 'kald' };

describe('Metoden skifter facit (accepttest 7a)', () => {
  it('samme tilspil: højt = kald og lavt = kald giver modsat facit', () => {
    // ♠E fra ♠E K 9 3 2, bordet ♠B 4, Øst ♠6: 6'eren er et af de to laveste kort, Vest ikke kan se.
    const t = { kontrakt: '4H' as const, udspiller: [14, 13, 9, 3, 2], udspil: 14, bord: [11, 4], tilspil: 6 };
    expect(aflaesTilspil(t, standard)).toEqual({ type: 'signal', signal: 'afvisning' });
    expect(aflaesTilspil(t, omvendt)).toEqual({ type: 'signal', signal: 'kald' });
  });

  it('samme seed med Standard og Omvendt giver samme stik og modsat facit i øvelse 4', { timeout: 60_000 }, () => {
    const set = { kald: 0, afvisning: 0 };
    for (let seed = 1; seed <= 200; seed++) {
      const niveau = (2 + (seed % 4)) as Niveau;
      const a = lavOpgave('markering', niveau, seed, standard);
      const b = lavOpgave('markering', niveau, seed, omvendt);
      const hvor = `seed ${seed}, niveau ${niveau}`;
      expect({ haender: b.haender, kontrakt: b.kontrakt, farve: b.farve, spillet: b.spillet, plads: b.plads }, hvor).toEqual({
        haender: a.haender,
        kontrakt: a.kontrakt,
        farve: a.farve,
        spillet: a.spillet,
        plads: a.plads,
      });
      expect(a.facit.type, hvor).toBe('signal');
      if (a.facit.type !== 'signal') continue;
      expect(b.facit, hvor).toEqual({ type: 'signal', signal: MODSAT[a.facit.signal] });
      set[a.facit.signal as 'kald' | 'afvisning']++;
    }
    expect(set.kald).toBeGreaterThan(0);
    expect(set.afvisning).toBeGreaterThan(0);
  });

  it('samme udspil: 4.-højeste og 3. og 5. højeste giver forskellig længde', () => {
    // Mod 4♠, udspil 2 (intet lavere kort), bordet K 7 5, Øst E 10 6 3. Skjult: 4, 8, 9, B, D.
    // 4.-højeste: Vest har tre over 2'eren og intet under, altså 4 kort. 3. og 5. højeste: 3.-højeste fra tre kort
    // eller 5.-højeste fra fem, altså 3 eller 5.
    const s = { kontrakt: '4S' as const, udspil: 2, bord: [13, 7, 5], oest: [14, 10, 6, 3] };
    expect(standard.valg['udspil-farve']).not.toBe(omvendt.valg['udspil-farve']);
    expect(udspilLaengde(s, standard)).toEqual({ type: 'laengder', laengder: [4] });
    expect(udspilLaengde(s, omvendt)).toEqual({ type: 'laengder', laengder: [3, 5] });
  });
});
