import type { Card } from '../../domain/cards';
import { bedoemUdspil, type FindUdspilOpgave, type KortRaekke, type UdspilSvar } from './findUdspil';

/*
 * Prisen i øvelse 8 (SPEC-modspil-v2.md, trin 3, "Prisen"; Franks valg 25. nov. 2026, mock-up'ens variant med prisen).
 * Prisen er det bedste svars middelstik minus det valgte svars, regnet i hundrededele, fordi middelstikkene har to
 * decimaler, og forskellen mellem to kommatal ikke altid er præcis. "Det bedste svar" er den bedste farves værdi
 * (`tabel`), så et kort, der ikke er profilens, kan koste under 0,1 stik eller mindre end nul. Accepttest 10
 * (src/modspil/udspil-skaerme/pris.test.tsx) beskriver det. Modellen fra trin 2 (`findUdspil.ts`) ændres ikke; dommen
 * er stadig rigtigt eller forkert (`bedoemUdspil`).
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

/** Under så mange hundrededele står prisen som "under 0,1 stik". */
export const UNDER_TIENDEDEL = 10;

/** Middelstikket i hundrededele. */
const h = (middel: number): number => Math.round(middel * 100);
const farveAf = (c: Card): number => Math.floor(c / 13);

function kortRaekke(o: FindUdspilOpgave, kort: Card): KortRaekke {
  const k = o.facit.kortTabel.find((x) => x.kort === kort);
  if (!k) throw new Error(`Kortet ${kort} er ikke Vests`);
  return k;
}

/**
 * Kortet, der giver farvens værdi, som i modellen: blandt profilens kort (stigende) det med det højeste middelstik og,
 * står to lige, flest sætninger; står de helt lige, det første.
 */
export function vaerdikort(o: FindUdspilOpgave, kort: readonly Card[]): Card {
  let bedst: KortRaekke | undefined;
  for (const c of kort) {
    const k = kortRaekke(o, c);
    if (!bedst || h(k.middel) > h(bedst.middel) || (h(k.middel) === h(bedst.middel) && k.saet > bedst.saet)) bedst = k;
  }
  if (!bedst) throw new Error('Farven har intet kort');
  return bedst.kort;
}

/** Det bedste svars middelstik i hundrededele: den bedste farves værdi. */
const topAf = (o: FindUdspilOpgave): number => Math.max(...o.facit.tabel.map((r) => h(r.middel)));

/** Prisen og facit-tabellens rækker for svaret. */
export function udspilPris(opgave: FindUdspilOpgave, svar: UdspilSvar): UdspilPris {
  const rigtigt = bedoemUdspil(opgave, svar).rigtig;
  const top = topAf(opgave);
  const valgt = 'farve' in svar ? opgave.facit.tabel.find((r) => r.farve === svar.farve)?.middel : kortRaekke(opgave, svar.kort).middel;
  if (valgt === undefined) throw new Error('Vest har ingen kort i farven');

  // Flest stik først; står to farver lige, i orden ♠ ♥ ♦ ♣ (sorteringen er stabil).
  const sorteret = [...opgave.facit.tabel].sort((a, b) => h(b.middel) - h(a.middel));
  const raekker: PrisRaekke[] = [];
  for (const r of sorteret) {
    const rigtig = opgave.facit.farver.includes(r.farve);
    const ditSvar = !rigtigt && ('farve' in svar ? svar.farve === r.farve : r.kort.includes(svar.kort));
    raekker.push({
      farve: r.farve,
      ...(opgave.svar === 'kort' ? { kort: vaerdikort(opgave, r.kort) } : {}),
      middel: r.middel,
      saet: r.saet,
      rigtig,
      ditSvar,
      koster: rigtigt || rigtig ? null : top - h(r.middel),
    });
    // Et kort, der ikke er profilens, får sin egen række lige under sin farves række.
    if (!rigtigt && 'kort' in svar && farveAf(svar.kort) === r.farve && !r.kort.includes(svar.kort)) {
      const k = kortRaekke(opgave, svar.kort);
      raekker.push({ farve: r.farve, kort: svar.kort, middel: k.middel, saet: k.saet, rigtig: false, ditSvar: true, koster: top - h(k.middel) });
    }
  }
  return { pris: rigtigt ? null : top - h(valgt), raekker };
}

/** Prisen med én decimal, rundet halvt op fra hundrededele som `tiendedele`: 45 → "0,5", 44 → "0,4"; på engelsk "0.5". */
export function prisTekst(hundrededele: number, sprog: 'da' | 'en'): string {
  const t10 = Math.floor((Math.round(hundrededele) + 5) / 10);
  return `${Math.floor(t10 / 10)}${sprog === 'en' ? '.' : ','}${t10 % 10}`;
}

/**
 * De rigtige svar som tekst til overskriften, med flest stik først: de rigtige farver (niveau 1–2) eller kortet, der
 * giver hver rigtig farves værdi (niveau 3–5), fx "♥" eller "♥E".
 */
export function bedsteSvar(opgave: FindUdspilOpgave): ({ farve: number } | { kort: Card })[] {
  return [...opgave.facit.tabel]
    .sort((a, b) => h(b.middel) - h(a.middel))
    .filter((r) => opgave.facit.farver.includes(r.farve))
    .map((r) => (opgave.svar === 'kort' ? { kort: vaerdikort(opgave, r.kort) } : { farve: r.farve }));
}
