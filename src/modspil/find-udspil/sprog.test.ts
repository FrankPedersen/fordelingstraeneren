import { describe, expect, it } from 'vitest';
import type { Card } from '../../domain/cards';
import { bydeform } from '../../sprog/bydeform';
import { fund } from '../../sprog/fagord';
import type { Tekst } from '../model/forklaring';
import { bedoemUdspil, forklarUdspil, lavFindUdspil, vedBordet, type Svarform } from '../model/findUdspil';
import { alleOpgaver, datasaet, PROFILER, SITUATIONER } from './hjaelp';

/*
 * Accepttest 7 i SPEC-modspil-v2.md, trin 2: sproget. Alle forklaringer for alle opgaver og profiler (med farve og med
 * kort) består fagords- og bydeformstestene, og engelsk har ingen danske ord. Det samme gælder "Ved bordet" for de otte
 * situationer og dommens tekst, når farven er rigtig, men kortet ikke er profilens.
 *
 * Dansk på engelsk findes som i v1's sprogtest (src/modspil/ui/sprog.test.tsx): æ, ø og å, almindelige danske ord og
 * Modspils fagord, og danske honnørbogstaver efter et farvesymbol (♠D, ♥B, ♦E).
 */

const DANSK =
  /[æøåÆØÅ]|\b(og|af|til|med|ikke|eller|kort|bordet|hånden|ingen|hvor|hvad|næste|svar|hp|vest|syd|nord|pas|spiller|makker|makkers|spilfører|spilføreren|udspil|udspillet|kald|afvisning|skift|lige|ulige|regel|aftalen|stik|niveau|opgave|rigtigt|forkert|metoderne|indstillinger|spar|hjerter|ruder|klør|konge|dame|knægt|omvendt|kompendiet|egen|farve|farven|farver|sans|mod|efter|gennemsnit|fordelinger|fordelingerne|sætter|anbefaler|profilen|meldeforløbet|forløb)\b|[♠♥♦♣]\s*[EDB](?![a-z])/i;

const data = datasaet();
const ALLE = alleOpgaver(data);
const SVAR: readonly Svarform[] = ['farve', 'kort'];
const TUNG = { timeout: 180_000 };
const farveAf = (c: Card) => Math.floor(c / 13);

/** Fejlene i en tekst: tom, husets ord og bydeform på dansk, dansk på engelsk. */
function tjek(hvor: string, t: Tekst): string[] {
  const fejl: string[] = [];
  if (!t.da?.trim() || !t.en?.trim()) fejl.push(`${hvor}: tom tekst`);
  fejl.push(...fund(t.da).map((f) => `${hvor}: "${f.word}" (husets ord: ${f.house}) i "${t.da}"`));
  fejl.push(...bydeform(t.da).map((b) => `${hvor}: bydeform "${b}" i "${t.da}"`));
  const m = t.en.match(DANSK);
  if (m) fejl.push(`${hvor}: dansk "${m[0]}" i "${t.en}"`);
  return fejl;
}

describe.each(PROFILER)('Sproget (accepttest 7): %s', (_, p) => {
  it('alle forklaringer for alle opgaver, med farve og med kort', TUNG, () => {
    const fejl: string[] = [];
    for (const t of ALLE) {
      for (const svar of SVAR) {
        const { forklaring, afvigelse } = forklarUdspil(t.situation, t.opgave, p, svar);
        const hvor = `${t.situation} #${t.indeks}, ${svar}`;
        fejl.push(...tjek(hvor, forklaring));
        if (afvigelse) fejl.push(...tjek(`${hvor}, afvigelsen`, afvigelse));
      }
    }
    expect(fejl.slice(0, 20)).toEqual([]);
  });

  it('dommen, når farven er rigtig, men kortet ikke er profilens', TUNG, () => {
    const fejl: string[] = [];
    let domme = 0;
    for (const niveau of [3, 4, 5] as const) {
      for (let seed = 1; seed <= 40; seed++) {
        const o = lavFindUdspil(niveau, seed, p, data);
        for (const kort of o.vest) {
          if (!o.facit.farver.includes(farveAf(kort)) || o.facit.kort.includes(kort)) continue;
          const dom = bedoemUdspil(o, { kort });
          if (!dom.tekst) fejl.push(`niveau ${niveau}, seed ${seed}, kort ${kort}: ingen tekst`);
          else fejl.push(...tjek(`niveau ${niveau}, seed ${seed}, kort ${kort}`, dom.tekst));
          domme++;
        }
      }
    }
    expect(fejl.slice(0, 20)).toEqual([]);
    expect(domme).toBeGreaterThan(20);
  });
});

describe('"Ved bordet" (accepttest 7)', () => {
  it('én tekst pr. situation, der består sprogtjekket', () => {
    const tekster = SITUATIONER.map((id) => vedBordet(id));
    expect(SITUATIONER.flatMap((id, i) => tjek(id, tekster[i]))).toEqual([]);
    expect(new Set(tekster.map((t) => t.da)).size).toBe(8);
    expect(new Set(tekster.map((t) => t.en)).size).toBe(8);
  });
});

describe('Testen kan se forskel', () => {
  it('fanger dansk på engelsk, husets "Ikke"-ord og bydeform', () => {
    expect(tjek('ok', { da: 'Kompendiet (s. 14) anbefaler udspil i major efter dette forløb.', en: 'The Compendium (p. 14) recommends a major lead after this auction.' })).toEqual([]);
    expect(tjek('engelsk', { da: 'Spilføreren har ofte minorfarverne.', en: 'Lead ♠D against 3NT.' })).toHaveLength(1);
    expect(tjek('engelsk', { da: 'Spilføreren har ofte minorfarverne.', en: '♥ gives 4.1 stik on average.' })).toHaveLength(1);
    expect(tjek('husets ord', { da: 'Spilføreren tager kippet i ♣.', en: 'Declarer takes the finesse in ♣.' }).length).toBeGreaterThan(0);
    expect(tjek('bydeform', { da: 'Spil ud fra den korteste major.', en: 'Lead from the shorter major.' }).length).toBeGreaterThan(0);
    expect(tjek('tom', { da: '', en: 'x' })).toHaveLength(1);
  });
});
