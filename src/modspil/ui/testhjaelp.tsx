/*
 * Fælles hjælp til accepttestene for Modspil trin 2 (SPEC-modspil.md, "Accepttest (trin 2)"). Kun til testene; appen
 * henter ikke filen. Grænsefladen, testene bygger på, står øverst i hver testfil og samlet i `skaerme.test.tsx`.
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { expect } from 'vitest';
import type { Card } from '../../domain/cards';
import { ROOT } from '../../sprog/danskTekst';
import { FOERSTE_NIVEAU, harOvelse, lavOpgave, OVELSER, type ModspilOpgave } from '../model/generator';
import { erUklar } from '../model/loeser';
import { profil, type ProfilId } from '../model/metoder';
import { farveAf, vaerdiAf } from '../model/tekst';
import { setLang } from '../../i18n';
import ModspilScreen from './ModspilScreen';
import { Opgave } from './Opgave';

/** Svaret, som opgaveskærmen giver med `onSvar` og får tilbage i `svar` for at vise facit. */
export type Svar = Parameters<Parameters<typeof Opgave>[0]['onSvar']>[0];

export const PROFIL_IDER: readonly ProfilId[] = ['standard', 'omvendt', 'kompendiet'];

let gemte: ModspilOpgave[] | undefined;

/**
 * Opgaver til alle øvelser i alle tre profiler: seed 1 og 3 på øvelsens første niveau (begge varianter, aflæs og vælg,
 * i øvelse 6 og 7), seed 2 på niveau 4 (hp-intervallerne og "Hvilke?") og udspillets længde med et uklart facit.
 */
export function eksempler(): ModspilOpgave[] {
  if (gemte) return gemte;
  const ud: ModspilOpgave[] = [];
  for (const id of PROFIL_IDER) {
    const p = profil(id);
    for (const ovelse of OVELSER) {
      if (!harOvelse(ovelse, p)) continue;
      for (const seed of [1, 3]) ud.push(lavOpgave(ovelse, FOERSTE_NIVEAU[ovelse], seed, p));
      ud.push(lavOpgave(ovelse, 4, 2, p));
    }
    let seed = 1;
    while (!erUklar(lavOpgave('laengde', 3, seed, p).facit)) seed++;
    ud.push(lavOpgave('laengde', 3, seed, p));
  }
  return (gemte = ud);
}

/** Opgaven til fejlbeskeder: øvelse, profil, niveau og seed. */
export const navn = (o: ModspilOpgave): string => `${o.ovelse}, ${o.profil.id}, niveau ${o.niveau}, seed ${o.seed}`;

/** Øvelser, hvor brugeren svarer med et kort fra hånden: Vælg kortet og vælg-varianten af øvelse 6 og 7. */
export const vaelgerKort = (o: ModspilOpgave): boolean => o.ovelse === 'vaelg-kort' || o.sporgsmaal.variant === 'vaelg';

/** Det aktuelle stik: kortene fra det seneste udspil (hvert stik har fire kort). Tomt, når intet er spillet. */
export function aktueltStik(o: ModspilOpgave): { nummer: number; kort: ModspilOpgave['spillet'] } {
  if (!o.spillet.length) return { nummer: 0, kort: [] };
  const start = Math.floor((o.spillet.length - 1) / 4) * 4;
  return { nummer: start / 4 + 1, kort: o.spillet.slice(start) };
}

const FARVENAVNE = ['Spar', 'Hjerter', 'Ruder', 'Klør'];
const HONNOERER: Record<number, string> = { 11: 'knægt', 12: 'dame', 13: 'konge', 14: 'es' };

/** Kortknappens aria-label på dansk, fx "Spar 8" (specen) og "Hjerter konge" (valg under Afklaret). */
export const kortLabel = (kort: Card): string => `${FARVENAVNE[farveAf(kort)]} ${HONNOERER[vaerdiAf(kort)] ?? vaerdiAf(kort)}`;
export const KORTLABEL = /^(Spar|Hjerter|Ruder|Klør) (2|3|4|5|6|7|8|9|10|knægt|dame|konge|es)$/;

/** Kortknapperne på skærmen (dansk): knapperne, hvis aria-label er et kort. */
export const kortKnapper = (): HTMLElement[] => screen.queryAllByRole('button').filter((b) => KORTLABEL.test(b.getAttribute('aria-label') ?? ''));

/** Svarknapperne står i en gruppe med navnet "Svar" (som i Pointregnskab). */
export const svarGruppe = (): HTMLElement => screen.getByRole('group', { name: 'Svar' });

const ingenting = () => {};

/** Opgaveskærmen som opgave 2 af 4; med `svar` viser den facit. */
export function visOpgave(
  opgave: ModspilOpgave,
  ekstra: { svar?: Svar; onSvar?: (s: Svar) => void; onNaeste?: () => void; onIndstillinger?: () => void } = {},
) {
  return render(
    <Opgave
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

/**
 * Svarer på opgaven og giver svaret: `klik` vælger knappen (standard: "Kan ikke afgøres", eller det første kort, når
 * brugeren vælger et kort). Skærmen ryddes bagefter.
 */
export function svarPaa(opgave: ModspilOpgave, klik?: () => HTMLElement): Svar {
  let svar: Svar | undefined;
  visOpgave(opgave, { onSvar: (s) => (svar = s) });
  const knap = klik ? klik() : vaelgerKort(opgave) ? kortKnapper()[0] : within(svarGruppe()).getByRole('button', { name: 'Kan ikke afgøres' });
  expect(knap, navn(opgave)).toBeTruthy();
  fireEvent.click(knap);
  cleanup();
  expect(svar, `${navn(opgave)}: svaret kommer med det samme`).toBeDefined();
  return svar!;
}

/** Dommen i facit: overskriften begynder med "Rigtigt" eller "Forkert" (mock-up'en). */
export function dom(): 'rigtigt' | 'forkert' | null {
  const h = screen.queryAllByRole('heading').find((e) => /^(Rigtigt|Forkert)\b/.test(e.textContent ?? ''));
  return h ? (h.textContent!.startsWith('Rigtigt') ? 'rigtigt' : 'forkert') : null;
}

/** a står før b i dokumentet. */
export const foer = (a: Node, b: Node): boolean => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

/** Teksten uden mellemrum, så "♠ K103" og "♠ K 10 3" læses ens. */
export const tæt = (s: string | null | undefined): string => (s ?? '').replace(/\s+/g, '');

/**
 * Opslagene i Bridgeordbogen (`../Forside/ordbog/index.html`, repoet ved siden af). null, hvor repoet ikke findes (fx i
 * GitHub Actions); så springes kontrollen af linkene over.
 */
export function ordbogensOpslag(): Set<string> | null {
  try {
    const html = readFileSync(`${ROOT}../Forside/ordbog/index.html`, 'utf8');
    return new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  } catch {
    return null;
  }
}

/**
 * Alle Modspils skærme én ad gangen på sproget: sporets forside, Indstillinger og hver eksempelopgave før og efter
 * svaret (svaret gives på dansk, facit vises på sproget). `tjek` kaldes med skærmens navn, mens den vises.
 */
export function hverSkaerm(sprog: 'da' | 'en', tjek: (hvor: string) => void): void {
  setLang(sprog);
  render(<ModspilScreen onBack={ingenting} />);
  tjek('sporets forside');
  fireEvent.click(screen.getByRole('button', { name: sprog === 'da' ? 'Indstillinger' : 'Settings' }));
  tjek('Indstillinger');
  cleanup();
  for (const o of eksempler()) {
    setLang('da');
    const svar = svarPaa(o);
    setLang(sprog);
    visOpgave(o);
    tjek(`${navn(o)}: opgaven`);
    cleanup();
    visOpgave(o, { svar });
    tjek(`${navn(o)}: facit`);
    cleanup();
  }
  setLang('da');
}

/** Alle tekstknuder under et element. */
export function tekstknuder(rod: Node): Text[] {
  const ud: Text[] = [];
  const gaa = document.createTreeWalker(rod, NodeFilter.SHOW_TEXT);
  for (let n = gaa.nextNode(); n; n = gaa.nextNode()) ud.push(n as Text);
  return ud;
}

