import type { Card } from '../../domain/cards';
import type { FindUdspilOpgave, UdspilSvar } from './findUdspil';

/*
 * Prisen i øvelse 8 (SPEC-modspil-v2.md, trin 3, "Prisen"; Franks valg 25. nov. 2026, mock-up'ens variant med prisen).
 * Tomt modul fra session 3a: accepttest 10 (src/modspil/udspil-skaerme/pris.test.tsx) beskriver det, og session 3b
 * bygger det. Modellen fra trin 2 (`findUdspil.ts`) ændres ikke.
 */

/** Én række i facit-tabellen med kolonnerne Udspil, Stik, Sætter og Koster. */
export interface PrisRaekke {
  farve: number;
  /**
   * Niveau 3–5: kortet i rækkens første celle, dvs. profilens kort, der giver farvens værdi, eller det valgte kort i
   * rækken "dit svar". Niveau 1–2: undefined (rækken er farven).
   */
  kort?: Card;
  /** Middelstik med to decimaler, som i datasættet. */
  middel: number;
  /** Antal fordelinger, hvor kontrakten sættes. */
  saet: number;
  /** Rækken er rigtig (grøn kant og ✓). */
  rigtig: boolean;
  /** Rækken er brugerens forkerte svar ("dit svar", stiplet kant og grå flade). */
  ditSvar: boolean;
  /**
   * Kolonnen "Koster" i hundrededele stik: det bedste svars middelstik minus rækkens. null står som "–": de rigtige
   * rækker og alle rækker efter et rigtigt svar (Franks valg 25. nov. 2026, session 3a).
   */
  koster: number | null;
}

export interface UdspilPris {
  /**
   * Svarets pris i hundrededele stik: det bedste svars middelstik minus det valgte svars (niveau 1–2 farvens værdi fra
   * `tabel`, niveau 3–5 kortets middelstik fra `kortTabel`). null ved et rigtigt svar. Med et kort, der ikke er
   * profilens, kan den være under 10 og endda negativ.
   */
  pris: number | null;
  /** Tabellens rækker i skærmens rækkefølge: flest stik først, og rækken "dit svar" lige under sin farves række. */
  raekker: PrisRaekke[];
}

/** Prisen og facit-tabellens rækker for svaret. */
export function udspilPris(opgave: FindUdspilOpgave, svar: UdspilSvar): UdspilPris {
  void opgave;
  void svar;
  throw new Error('ikke bygget');
}

/** Prisen med én decimal, rundet halvt op fra hundrededele som `tiendedele`: 45 → "0,5", 44 → "0,4"; på engelsk "0.5". */
export function prisTekst(hundrededele: number, sprog: 'da' | 'en'): string {
  void hundrededele;
  void sprog;
  throw new Error('ikke bygget');
}
