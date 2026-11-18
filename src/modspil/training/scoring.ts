import type { Card } from '../../domain/cards';
import type { ModspilOpgave } from '../model/generator';
import type { Signal } from '../model/loeser';

/**
 * Svaret på en opgave og dommen (SPEC-modspil.md, trin 2). Facit kommer fra trin 1's generator; her sammenlignes kun.
 * "Kan ikke afgøres" er rigtigt, når facit er det, og forkert ellers (at vide, hvornår man ikke ved det, er en del af
 * færdigheden).
 */
export type Svar =
  | { type: 'kan-ikke-afgoeres' }
  | { type: 'tvetydig' }
  | { type: 'interval'; min: number; max: number }
  /** Regel 11 og 12: antallet; fra niveau 4 også hvilke kort, eller "kan ikke afgøres" for hvilke. */
  | { type: 'tal'; tal: number; hvilke?: Card[] | 'kan-ikke-afgoeres' }
  | { type: 'laengder'; laengder: number[] }
  | { type: 'signal'; signal: Signal }
  | { type: 'forsinket'; vaerdi: 'passiv' | 'aktiv' }
  | { type: 'kort'; kort: Card };

/** XP for et rigtigt svar; et forkert giver 0. */
export const XP_RIGTIGT = 10;

const sammeMaengde = (a: readonly number[], b: readonly number[]) => a.length === b.length && [...a].sort((x, y) => x - y).join() === [...b].sort((x, y) => x - y).join();

/** Er svaret rigtigt? */
export function erRigtigt(o: ModspilOpgave, svar: Svar): boolean {
  const f = o.facit;
  switch (f.type) {
    case 'kan-ikke-afgoeres':
      return svar.type === 'kan-ikke-afgoeres';
    case 'tvetydig':
      return svar.type === 'tvetydig';
    case 'interval':
      return svar.type === 'interval' && svar.min === f.min && svar.max === f.max;
    case 'laengder':
      return svar.type === 'laengder' && sammeMaengde(svar.laengder, f.laengder);
    case 'signal':
      return svar.type === 'signal' && svar.signal === f.signal;
    case 'forsinket':
      return svar.type === 'forsinket' && svar.vaerdi === f.vaerdi;
    case 'kort':
      // I Vælg afkastet uden et entydigt kort er facit de kort, der læses rigtigt i flest fordelinger (Franks svar 1).
      return svar.type === 'kort' && f.kort.includes(svar.kort);
    case 'tal': {
      if (svar.type !== 'tal' || svar.tal !== f.tal) return false;
      // Fra niveau 4 spørger opgaven også "Hvilke?"; uden et svar på det tæller kun antallet.
      const h = o.hvilke;
      if (!h || svar.hvilke === undefined) return true;
      if (h.type === 'kort') return svar.hvilke !== 'kan-ikke-afgoeres' && sammeMaengde(svar.hvilke, h.kort);
      return svar.hvilke === 'kan-ikke-afgoeres';
    }
  }
}
