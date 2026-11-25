import type { Item } from '../../engine/leitner';
import type { Niveau } from '../model/generator';
import type { MsSaved } from '../storage';
import type { MsSession } from './session';

/*
 * Øvelse 8 i sessionen og lagringen (SPEC-modspil-v2.md, trin 3, "Sessionen" og Afgrænsning: `modspil:v1` får ét
 * valgfrit felt til øvelse 8). Tomt modul fra session 3a: accepttest 1 og 8 (src/modspil/udspil-skaerme/) beskriver
 * det, og session 3b bygger det, sammen med ændringerne i `session.ts`, `storage.ts` og `ModspilScreen.tsx`.
 *
 * Øvelse 8 trækkes i niveaufasen som v1's øvelser fra niveau 1 og har sin egen Leitner-post med samme regler (Franks
 * valg 25. nov. 2026, session 3a). Posten står i det valgfrie felt, fordi `items` kun godtager v1's syv øvelser.
 */

/** Øvelse 8's id: `data-ovelse` på skærmen. */
export const FIND_UDSPIL = 'find-udspil';

/** Øvelse 8 i sessionen: niveauet og seedet, som `lavFindUdspil` laver opgaven ud fra, når datasættet er hentet. */
export interface UdspilRef {
  niveau: Niveau;
  seed: number;
}

/** Sessionens aktuelle opgave, når den er øvelse 8, ellers null. */
export function udspilIOpgave(session: MsSession): UdspilRef | null {
  void session;
  throw new Error('ikke bygget');
}

/** Øvelse 8's Leitner-post i gemte data, eller undefined, før øvelsen er besvaret første gang. */
export function udspilPost(saved: MsSaved): Item | undefined {
  void saved;
  throw new Error('ikke bygget');
}

/** Gemte data med øvelse 8's Leitner-post (i det valgfrie felt). */
export function medUdspilPost(saved: MsSaved, item: Item): MsSaved {
  void saved;
  void item;
  throw new Error('ikke bygget');
}
