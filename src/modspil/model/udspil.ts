import { regel, type Honnoersvar, type KategoriId, type Kontraktart, type Profil } from './metoder';

export type { Kontraktart } from './metoder';

/**
 * Udspilsreglen (SPEC-modspil.md, "Løser, generator og facit" punkt 3, og accepttest 2): Vests kort ud fra hans kort i
 * farven og aftalerne. En honnørsekvens giver toppen (mod sans efter honnørmetoden), to honnørkort i træk mod sans er
 * "table feeling" (toppen eller det lave kort, altså ikke entydigt), og ellers spilles metodens lave kort. Fra
 * singleton spilles kortet og fra doubleton det højeste. Valørerne er 2–14 (B 11, D 12, K 13, E 14).
 */

/** Kontrakterne i trin 1; Syd spiller, og Nord er bordet. */
export type Kontrakt = '3NT' | '4H' | '4S';

export const kontraktart = (k: Kontrakt): Kontraktart => (k === '3NT' ? 'sans' : 'farve');

/** Trumffarven (♠ 0, ♥ 1) eller null mod sans. */
export const trumf = (k: Kontrakt): number | null => (k === '4S' ? 0 : k === '4H' ? 1 : null);

/** Kategorien for et lavt udspil i kontrakten. */
export const udspilKategori = (art: Kontraktart): Extract<KategoriId, 'udspil-sans' | 'udspil-farve'> => (art === 'sans' ? 'udspil-sans' : 'udspil-farve');

export const faldende = (xs: readonly number[]): number[] => [...xs].sort((a, b) => b - a);

/** Metodens lave kort fra kortene `h`, sorteret faldende. */
export function lavtUdspil(h: readonly number[], art: Kontraktart, profil: Profil): number {
  if (h.length <= 2) return h[0];
  return regel(profil, udspilKategori(art), art).lavtKort(h);
}

/** Honnørudspillet fra kortene (vilkårlig orden): ét kort, "table feeling" eller ingen sekvens. */
export function honnoerUdspil(holding: readonly number[], art: Kontraktart, profil: Profil): Honnoersvar {
  return regel(profil, 'honnoerudspil', art).udspil(faldende(holding), art);
}

/** De kort, Vest kan spille ud fra `holding` (valører i vilkårlig orden) efter profilen, sorteret faldende. */
export function muligeUdspil(holding: readonly number[], art: Kontraktart, profil: Profil): number[] {
  const h = faldende(holding);
  const lav = lavtUdspil(h, art, profil);
  const honnoer = regel(profil, 'honnoerudspil', art).udspil(h, art);
  if (honnoer === null) return [lav];
  if (honnoer === 'table-feeling') return lav === h[0] ? [lav] : [h[0], lav];
  return [honnoer];
}

/** Det entydige udspil, eller null, når udspillet ikke er entydigt ("table feeling"). */
export function udspil(holding: readonly number[], art: Kontraktart, profil: Profil): number | null {
  const mulige = muligeUdspil(holding, art, profil);
  return mulige.length === 1 ? mulige[0] : null;
}

/** Den mindste længde for et lavt udspil efter metoden: 4 med 4.-højeste, ellers 3. */
export function mindsteLaengde(art: Kontraktart, profil: Profil): number {
  return regel(profil, udspilKategori(art), art).mindsteLaengde;
}

/**
 * Passer et lavt udspil med Vests kort? Vest har mindst metodens mindste længde, udspillet er metodens lave kort, og
 * honnørreglen giver ikke et andet kort ("table feeling" tæller med, fordi det lave kort også er muligt).
 */
export function lavtUdspilPasser(holding: readonly number[], kort: number, art: Kontraktart, profil: Profil): boolean {
  if (holding.length < mindsteLaengde(art, profil)) return false;
  const h = faldende(holding);
  if (lavtUdspil(h, art, profil) !== kort) return false;
  const honnoer = regel(profil, 'honnoerudspil', art).udspil(h, art);
  return honnoer === null || honnoer === 'table-feeling' || honnoer === kort;
}
