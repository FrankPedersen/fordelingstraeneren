/*
 * Fælles hjælp til accepttestene for Modspil v2, trin 3 (SPEC-modspil-v2.md, "Accepttest for trin 3"). Kun til testene;
 * appen henter ikke filen. Session 3a skrev testene, før skærmene fandtes; session 3b bygger efter grænsefladen her.
 *
 * Grænsefladen, byggeriet skal give (samlet for alle trin 3's tests):
 *
 * `src/modspil/ui/FindUdspil.tsx` eksporterer `FindUdspil` med props `{ opgave: FindUdspilOpgave; nummer; antal;
 * svar?: UdspilSvar; onSvar(svar: UdspilSvar): void; onNaeste(): void; onIndstillinger(): void; xp?; iTraek? }` som v1's
 * `Opgave`. Uden `svar` viser den opgaven; med `svar` også facit. HTML'en er den samme ved alle bredder.
 *
 * Opgaven (i denne rækkefølge i HTML'en):
 * 1. Roden har `data-ovelse="find-udspil"`, `data-niveau` og `data-seed` (opgavens seed til `lavFindUdspil`) og to børn,
 *    `.wide-left` (meldeforløbet og hånden) og `.wide-right` (spørgsmålet, svarknapperne og facit), som v1.
 * 2. Teksten "Niveau 1 · opgave 2 af 4" og mærket som en knap med navnet "<profil> · <metode>", fx "Standard ·
 *    4.-højeste": profilens navn og metoden for udspillet mod kontraktens art (`gaeldende(profil, udspilKategori(art),
 *    art)`). Mærket kalder `onIndstillinger`.
 * 3. Meldeforløbet: en `<table>` med navnet "Meldeforløbet", kolonneoverskrifterne "Vest …" (fx "Vest · dig"), "Nord",
 *    "Øst" og "Syd" og meldingerne i rækkefølge (`meldingTekst`) i cellerne (`<td>`). Linjen under tabellen nævner "Syd
 *    spiller <kontrakt>" (`kontraktTekst`).
 * 4. Vests hånd (`data-haand="dig"`) som tekstlinjer pr. farve, fx "♠ KB76". Bordet vises ikke (intet
 *    `data-haand="nord"` og intet stik).
 * 5. Øvelsens navn "Find udspillet" med ⓘ ("Hjælp: Find udspillet"), spørgsmålet som `<h1>`: "Hvilken farve spilles
 *    ud?" (niveau 1–2) eller "Hvilket kort spilles ud?" (niveau 3–5).
 * 6. Svarknapperne i en gruppe med navnet "Svar" (`role="group"`). Niveau 1–2: fire farveknapper i orden ♠ ♥ ♦ ♣ med
 *    aria-label "Spar, 4 kort" (mock-up 1); en farve uden kort er deaktiveret ("Klør, 0 kort"). Niveau 3–5: Vests 13 kort
 *    som knapper, farve for farve og faldende, med aria-label som "Spar konge" (`kortLabel`). Ingen "Kan ikke afgøres".
 *    Et klik svarer med det samme: `onSvar({ farve })` eller `onSvar({ kort })`.
 *
 * Facit (med `svar`), i denne rækkefølge:
 * - mærket med `data-dom="rigtigt"` eller `data-dom="forkert"` (`bedoemUdspil`) og en overskrift, der begynder med
 *   "Rigtigt" eller "Forkert" (mock-up'en: "Forkert: ♥ giver flest stik");
 * - et `<p>`, der begynder med "Dit svar:", fx "Dit svar: ♦ · koster 0,5 stik i snit" (pris.test.tsx);
 * - domsteksten fra `bedoemUdspil` i et `<p>`, når farven er rigtig, men kortet ikke er profilens;
 * - tabellen: en `<table>` med kolonneoverskrifterne "Udspil", "Stik", "Sætter" og "Koster" (engelsk "Lead", "Tricks",
 *   "Defeats", "Cost") og én række (`<tr>` i `<tbody>`) pr. farve, Vest har kort i: første celle med farven (niveau 1–2)
 *   eller kortet (niveau 3–5, profilens kort, der giver farvens værdi), "✓" i de rigtige rækker og "dit svar" i rækken
 *   med det forkerte svar; Stik med én decimal (`tiendedele`), Sætter i hele procent med " %" og Koster (pris.test.tsx).
 *   Rækkerne står med flest stik først; er det valgte kort ikke profilens, står det i sin egen række lige under sin
 *   farves række;
 * - forklaringen (`opgave.forklaring.da`) i et `<p>`;
 * - boksen med overskriften "Ved bordet" og `opgave.vedBordet.da`;
 * - links til ordbogen kun til opslag, der findes (`https://www.kontraktbridge.dk/ordbog/#<id>`);
 * - knappen "Næste opgave", der kalder `onNaeste`.
 *
 * Sessionen og lagringen står i `src/modspil/training/findUdspil.ts` (session.test.tsx og lagring.test.tsx), og prisen i
 * `src/modspil/model/udspilPris.ts` (pris.test.tsx).
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { expect } from 'vitest';
import type { Card } from '../../domain/cards';
import { setLang } from '../../i18n';
import { bedoemUdspil, lavFindUdspil, pulje, type Datasaet, type FindUdspilOpgave, type SituationId, type UdspilSvar } from '../model/findUdspil';
import { procent, tiendedele } from '../model/findUdspilTekst';
import type { Niveau } from '../model/generator';
import { profil, type Profil, type ProfilId } from '../model/metoder';
import { farveAf, kortTekst, SYMBOLER, valoer, vaerdiAf } from '../model/tekst';
import { FindUdspil } from '../ui/FindUdspil';

export const PROFIL_IDER: readonly ProfilId[] = ['standard', 'omvendt', 'kompendiet'];

/**
 * Mock-up'ens eksempel (specen, Trin 3): S1-1nt-3nt, opgave 55 (seed 2556829236 i datasættet), profilen Standard, med
 * opgavens seed 35 på niveau 1 og seed 48 på niveau 3 (fundet med `lavFindUdspil`; eksempel.test i pris.test.tsx
 * kontrollerer det). Vest ♠K B 7 6 ♥E K 4 3 ♦10 8 6 3 ♣B.
 */
export const EKSEMPEL = { situation: 'S1-1nt-3nt' as SituationId, indeks: 55, dataSeed: 2556829236, seed1: 35, seed3: 48 };

export function eksempel(data: Datasaet, niveau: 1 | 3): FindUdspilOpgave {
  return lavFindUdspil(niveau, niveau === 1 ? EKSEMPEL.seed1 : EKSEMPEL.seed3, profil('standard'), data);
}

/** Opgaven til fejlbeskeder. */
export const navn = (o: FindUdspilOpgave): string => `${o.situation} nr. ${o.indeks}, ${o.profil.id}, niveau ${o.niveau}, seed ${o.seed}`;

/** Den første seed fra `fra`, der giver en opgave, som passer. */
export function findSeed(niveau: Niveau, p: Profil, data: Datasaet, passer: (o: FindUdspilOpgave) => boolean, fra = 1, til = 20_000): FindUdspilOpgave {
  for (let seed = fra; seed < til; seed++) {
    const o = lavFindUdspil(niveau, seed, p, data);
    if (passer(o)) return o;
  }
  throw new Error(`Ingen opgave på niveau ${niveau} med ${p.id} passer (seed ${fra}–${til})`);
}

let gemte: FindUdspilOpgave[] | undefined;

/**
 * Opgaver til alle tre profiler på niveau 1–4: én opgave pr. situation på niveauet (niveau 1 har S1, S5 og S7, de andre
 * alle otte), fundet med de laveste seeds. Niveau 5 har samme pulje som niveau 4.
 */
export function eksempler(data: Datasaet): FindUdspilOpgave[] {
  if (gemte) return gemte;
  const ud: FindUdspilOpgave[] = [];
  for (const id of PROFIL_IDER) {
    const p = profil(id);
    for (const niveau of [1, 2, 3, 4] as const) {
      const mangler = new Set(pulje(niveau, p, data).map((r) => r.situation));
      for (let seed = 1; mangler.size > 0 && seed < 5000; seed++) {
        const o = lavFindUdspil(niveau, seed, p, data);
        if (mangler.delete(o.situation)) ud.push(o);
      }
      expect(mangler.size, `${id}, niveau ${niveau}: alle situationer`).toBe(0);
    }
  }
  return (gemte = ud);
}

const ingenting = () => {};

/** Øvelse 8's skærm som opgave 2 af 4; med `svar` viser den facit. */
export function visFindUdspil(
  opgave: FindUdspilOpgave,
  ekstra: { svar?: UdspilSvar; onSvar?: (s: UdspilSvar) => void; onNaeste?: () => void; onIndstillinger?: () => void } = {},
) {
  return render(
    <FindUdspil
      opgave={opgave}
      nummer={2}
      antal={4}
      svar={ekstra.svar}
      onSvar={ekstra.onSvar ?? ingenting}
      onNaeste={ekstra.onNaeste ?? ingenting}
      onIndstillinger={ekstra.onIndstillinger ?? ingenting}
    />,
  );
}

const FARVENAVNE = ['Spar', 'Hjerter', 'Ruder', 'Klør'];
const HONNOERER: Record<number, string> = { 11: 'knægt', 12: 'dame', 13: 'konge', 14: 'es' };

/** Kortknappens aria-label på dansk, fx "Spar konge" (som v1). */
export const kortLabel = (kort: Card): string => `${FARVENAVNE[farveAf(kort)]} ${HONNOERER[vaerdiAf(kort)] ?? vaerdiAf(kort)}`;
export const KORTLABEL = /^(Spar|Hjerter|Ruder|Klør) (2|3|4|5|6|7|8|9|10|knægt|dame|konge|es)$/;

/** Farveknappens aria-label på dansk, fx "Spar, 4 kort" (mock-up 1). */
export const farveLabel = (o: FindUdspilOpgave, farve: number): string => `${FARVENAVNE[farve]}, ${o.vest.filter((c) => farveAf(c) === farve).length} kort`;

/** Knappens navn for et svar. */
export const svarLabel = (o: FindUdspilOpgave, svar: UdspilSvar): string => ('farve' in svar ? farveLabel(o, svar.farve) : kortLabel(svar.kort));

/** Svarknapperne står i en gruppe med navnet "Svar" (dansk). */
export const svarGruppe = (): HTMLElement => screen.getByRole('group', { name: 'Svar' });

/** De mulige svar i knappernes orden: farverne ♠ ♥ ♦ ♣, Vest har kort i, eller Vests kort farve for farve, faldende. */
export function muligeSvar(o: FindUdspilOpgave): UdspilSvar[] {
  if (o.svar === 'farve') return [0, 1, 2, 3].filter((f) => o.vest.some((c) => farveAf(c) === f)).map((farve) => ({ farve }));
  return [...o.vest].sort((a, b) => farveAf(a) - farveAf(b) || vaerdiAf(b) - vaerdiAf(a)).map((kort) => ({ kort }));
}

/** Et rigtigt svar (det første i knappernes orden) og et forkert (det første forkerte), når der findes et. */
export function rigtigtOgForkert(o: FindUdspilOpgave): { rigtigt: UdspilSvar; forkert?: UdspilSvar } {
  const alle = muligeSvar(o);
  const er = (s: UdspilSvar) => ('farve' in s ? o.facit.farver.includes(s.farve) : o.facit.kort.includes(s.kort));
  return { rigtigt: alle.find(er)!, forkert: alle.find((s) => !er(s)) };
}

/**
 * Svarer på opgaven ved at klikke på knappen for svaret (dansk) og giver det svar, skærmen sendte med `onSvar`. Skærmen
 * ryddes bagefter.
 */
export function svarPaa(opgave: FindUdspilOpgave, svar: UdspilSvar): UdspilSvar {
  let givet: UdspilSvar | undefined;
  setLang('da');
  visFindUdspil(opgave, { onSvar: (s) => (givet = s) });
  fireEvent.click(within(svarGruppe()).getByRole('button', { name: svarLabel(opgave, svar) }));
  cleanup();
  expect(givet, `${navn(opgave)}: svaret kommer med det samme`).toEqual(svar);
  return givet!;
}

/**
 * Alle øvelse 8's skærme én ad gangen på sproget: hver eksempelopgave før og efter et forkert svar (ellers et rigtigt),
 * og mock-up'ens eksempel på niveau 3 med ♥4 (rækken "dit svar" og domsteksten). Svaret gives på dansk, og skærmen
 * vises på sproget. `tjek` kaldes med skærmens navn, mens den vises. Giver antallet af skærme.
 */
export function hverUdspilSkaerm(sprog: 'da' | 'en', data: Datasaet, tjek: (hvor: string) => void): number {
  let n = 0;
  const opgaver: [FindUdspilOpgave, UdspilSvar | undefined][] = [...eksempler(data).map((o) => [o, undefined] as [FindUdspilOpgave, undefined]), [eksempel(data, 3), { kort: 15 }]];
  for (const [o, fast] of opgaver) {
    const { rigtigt, forkert } = rigtigtOgForkert(o);
    const svar = svarPaa(o, fast ?? forkert ?? rigtigt);
    setLang(sprog);
    visFindUdspil(o);
    tjek(`${navn(o)}: opgaven`);
    cleanup();
    visFindUdspil(o, { svar });
    tjek(`${navn(o)}: facit (${svarTekst(svar)})`);
    cleanup();
    n += 2;
  }
  setLang('da');
  return n;
}

/** Alle tekstknuder under et element. */
export function tekstknuder(rod: Node): Text[] {
  const ud: Text[] = [];
  const gaa = document.createTreeWalker(rod, NodeFilter.SHOW_TEXT);
  for (let t = gaa.nextNode(); t; t = gaa.nextNode()) ud.push(t as Text);
  return ud;
}

/** Dommen i facit: overskriften begynder med "Rigtigt" eller "Forkert" (som v1). */
export function dom(): 'rigtigt' | 'forkert' | null {
  const h = screen.queryAllByRole('heading').find((e) => /^(Rigtigt|Forkert)\b/.test(e.textContent ?? ''));
  return h ? (h.textContent!.startsWith('Rigtigt') ? 'rigtigt' : 'forkert') : null;
}

/** Overskriften med dommen. */
export const domOverskrift = (): HTMLElement | undefined => screen.queryAllByRole('heading').find((e) => /^(Rigtigt|Forkert)\b/.test(e.textContent ?? ''));

/** a står før b i dokumentet. */
export const foer = (a: Node, b: Node): boolean => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

/** Teksten uden mellemrum, så "♠ KB76" og "♠ K B 7 6" læses ens. */
export const tæt = (s: string | null | undefined): string => (s ?? '').replace(/\s+/g, '');

/** Teksten med ét mellemrum mellem ordene. */
export const ren = (s: string | null | undefined): string => (s ?? '').replace(/\s+/g, ' ').trim();

/** Hånden pr. farve som "♠KB76" (valørerne faldende). */
export function haandlinjer(vest: readonly Card[], sprog: 'da' | 'en' = 'da'): string[] {
  const ud: string[] = [];
  for (let f = 0; f < 4; f++) {
    const v = vest.filter((c) => farveAf(c) === f).map(vaerdiAf).sort((a, b) => b - a);
    if (v.length) ud.push(`${SYMBOLER[f]}${v.map((x) => valoer(x, sprog)).join('')}`);
  }
  return ud;
}

// ---------------------------------------------------------------- facit-tabellen

export const KOLONNER = { da: ['Udspil', 'Stik', 'Sætter', 'Koster'], en: ['Lead', 'Tricks', 'Defeats', 'Cost'] } as const;

export interface VistRaekke {
  el: HTMLTableRowElement;
  udspil: string;
  stik: string;
  saetter: string;
  koster: string;
}

/** Facit-tabellen (den med kolonnerne Udspil, Stik, Sætter og Koster), eller null. */
export function facitTabel(sprog: 'da' | 'en' = 'da'): HTMLTableElement | null {
  const tabeller = [...document.querySelectorAll('table')];
  return tabeller.find((t) => [...t.querySelectorAll('th')].slice(0, 4).map((th) => ren(th.textContent)).join('|') === KOLONNER[sprog].join('|')) ?? null;
}

/** Tabellens rækker i tbody med cellernes tekst. */
export function visteRaekker(tabel: HTMLTableElement): VistRaekke[] {
  return [...tabel.querySelectorAll('tbody tr')].map((tr) => {
    const c = [...tr.querySelectorAll('th, td')].map((x) => ren(x.textContent));
    return { el: tr as HTMLTableRowElement, udspil: c[0] ?? '', stik: c[1] ?? '', saetter: c[2] ?? '', koster: c[3] ?? '' };
  });
}

/** Middelstik i hundrededele. */
export const h = (middel: number): number => Math.round(middel * 100);

/** Rækken, som testene venter den, regnet uafhængigt af byggeriet ud fra facit fra trin 2. */
export interface ForventetRaekke {
  farve: number;
  /** Niveau 3–5: de kort, rækkens første celle kan vise (ved "table feeling" to); niveau 1–2: tom. */
  kort: Card[];
  middel: number;
  saet: number;
  rigtig: boolean;
  ditSvar: boolean;
  /** Rækken "dit svar" med et kort, der ikke er profilens (står lige under sin farves række). */
  egen: boolean;
  koster: number | null;
}

export const erRigtigt = (o: FindUdspilOpgave, svar: UdspilSvar): boolean => ('farve' in svar ? o.facit.farver.includes(svar.farve) : o.facit.kort.includes(svar.kort));

/** Svarets pris i hundrededele (null ved et rigtigt svar): det bedste svars middelstik minus svarets. */
export function forventetPris(o: FindUdspilOpgave, svar: UdspilSvar): number | null {
  if (erRigtigt(o, svar)) return null;
  const top = Math.max(...o.facit.tabel.map((r) => h(r.middel)));
  const valgt = 'farve' in svar ? o.facit.tabel.find((r) => r.farve === svar.farve)!.middel : o.facit.kortTabel.find((k) => k.kort === svar.kort)!.middel;
  return top - h(valgt);
}

/**
 * Tabellens rækker (specen, "Skærmen" og "Prisen"): én pr. farve med flest stik først (står to farver lige, er
 * rækkefølgen mellem dem fri), og ved et kort, der ikke er profilens, rækken "dit svar" lige under sin farves række.
 * Koster: det bedste svars middelstik minus rækkens efter et forkert svar, "–" (null) i de rigtige rækker og i alle
 * rækker efter et rigtigt svar (Franks valg 25. nov. 2026, session 3a).
 */
export function forventedeRaekker(o: FindUdspilOpgave, svar: UdspilSvar): ForventetRaekke[] {
  const rigtigt = erRigtigt(o, svar);
  const top = Math.max(...o.facit.tabel.map((r) => h(r.middel)));
  const ud: ForventetRaekke[] = [];
  for (const r of [...o.facit.tabel].sort((a, b) => h(b.middel) - h(a.middel))) {
    const rigtig = o.facit.farver.includes(r.farve);
    // Kortet, der giver farvens værdi: samme middelstik og sætninger (ved "table feeling" kan det være begge).
    const kort = o.svar === 'kort' ? r.kort.filter((c) => o.facit.kortTabel.some((k) => k.kort === c && h(k.middel) === h(r.middel) && k.saet === r.saet)) : [];
    const ditSvar = !rigtigt && ('farve' in svar ? svar.farve === r.farve : r.kort.includes(svar.kort));
    ud.push({ farve: r.farve, kort, middel: r.middel, saet: r.saet, rigtig, ditSvar, egen: false, koster: rigtigt || rigtig ? null : top - h(r.middel) });
    if (!rigtigt && 'kort' in svar && farveAf(svar.kort) === r.farve && !r.kort.includes(svar.kort)) {
      const k = o.facit.kortTabel.find((x) => x.kort === svar.kort)!;
      ud.push({ farve: r.farve, kort: [svar.kort], middel: k.middel, saet: k.saet, rigtig: false, ditSvar: true, egen: true, koster: top - h(k.middel) });
    }
  }
  return ud;
}

/** Prisen som på skærmen: én decimal, rundet halvt op fra hundrededele (som `tiendedele`). */
export const prisSomTekst = (hundrededele: number, sprog: 'da' | 'en'): string => tiendedele(hundrededele / 100, sprog);

/** Linjen "Dit svar: …" i facit (et `<p>`), eller undefined. */
export const ditSvarLinje = (sprog: 'da' | 'en' = 'da'): HTMLElement | undefined =>
  [...document.querySelectorAll('p')].find((p) => ren(p.textContent).startsWith(sprog === 'da' ? 'Dit svar:' : 'Your answer:'));

/** Svaret som tekst, fx "♦" eller "♥4". */
export const svarTekst = (svar: UdspilSvar, sprog: 'da' | 'en' = 'da'): string => ('farve' in svar ? SYMBOLER[svar.farve] : kortTekst(svar.kort, sprog));

/**
 * Tjekker facit-tabellen på skærmen mod de forventede rækker: farven og kortet i første celle, ✓ og "dit svar", Stik og
 * Sætter fra facit, rækkefølgen og Koster ("–" eller prisen med én decimal; under 0,1 stik i rækken "dit svar" er
 * cellens tekst fri).
 */
export function tjekTabel(o: FindUdspilOpgave, svar: UdspilSvar, sprog: 'da' | 'en' = 'da'): void {
  const hvor = `${navn(o)}, svar ${svarTekst(svar)}`;
  const tabel = facitTabel(sprog);
  expect(tabel, `${hvor}: facit-tabellen med kolonnerne ${KOLONNER[sprog].join(', ')}`).toBeTruthy();
  const vist = visteRaekker(tabel!);
  const ventet = forventedeRaekker(o, svar);
  expect(vist.length, `${hvor}: én række pr. farve (og "dit svar")`).toBe(ventet.length);
  // Hver række hører til den farve, hvis symbol står i første celle (og ingen andres).
  const farveI = vist.map((r, i) => {
    const s = SYMBOLER.filter((x) => r.udspil.includes(x));
    expect(s.length, `${hvor}, række ${i + 1} (${r.udspil}): ét farvesymbol`).toBe(1);
    return SYMBOLER.indexOf(s[0]);
  });
  const procentTegn = sprog === 'da' ? ' %' : '%';
  const set = new Set<number>();
  vist.forEach((r, i) => {
    const f = farveI[i];
    // Anden række med samme farve er rækken "dit svar" med et kort, der ikke er profilens, lige under farvens række.
    const egen = set.has(f);
    if (egen) expect(farveI[i - 1], `${hvor}, række ${i + 1}: "dit svar" står lige under sin farves række`).toBe(f);
    set.add(f);
    const v = ventet.find((x) => x.farve === f && x.egen === egen);
    const her = `${hvor}, række ${i + 1} (${r.udspil})`;
    expect(v, `${her}: rækken findes ikke i facit`).toBeTruthy();
    if (!v) return;
    if (v.kort.length) expect(v.kort.some((k) => tæt(r.udspil).includes(kortTekst(k, sprog))), `${her}: kortet ${v.kort.map((k) => kortTekst(k, sprog)).join(' eller ')}`).toBe(true);
    expect(r.udspil.includes('✓'), `${her}: ✓ i de rigtige rækker`).toBe(v.rigtig);
    expect(/dit svar|your answer/i.test(r.udspil), `${her}: "dit svar" i rækken med det forkerte svar`).toBe(v.ditSvar);
    expect(r.stik, `${her}: Stik`).toBe(tiendedele(v.middel, sprog));
    expect(r.saetter, `${her}: Sætter`).toBe(`${procent(v.saet, o.facit.fordelinger)}${procentTegn}`);
    if (v.koster === null) expect(r.koster, `${her}: Koster`).toBe('–');
    else if (v.koster >= 10) expect(r.koster, `${her}: Koster`).toBe(prisSomTekst(v.koster, sprog));
  });
  // Rækkefølgen: farvernes rækker med flest stik først (står to farver lige, må de bytte plads).
  const middel = (f: number) => h(o.facit.tabel.find((r) => r.farve === f)!.middel);
  const farverne = farveI.filter((f, i) => farveI.indexOf(f) === i);
  for (let i = 1; i < farverne.length; i++) expect(middel(farverne[i]) <= middel(farverne[i - 1]), `${hvor}: flest stik først (${farverne.map((f) => SYMBOLER[f]).join(' ')})`).toBe(true);
}

/** Dommen og domsteksten, som modellen giver dem. */
export const modellensDom = (o: FindUdspilOpgave, svar: UdspilSvar) => bedoemUdspil(o, svar);
