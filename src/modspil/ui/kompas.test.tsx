// @vitest-environment jsdom
/*
 * Accepttest 1–3 for SPEC-modspil-kompas.md (bordet med rigtige verdenshjørner, kortknapperne i spørgsmålet og hp med
 * små bogstaver). Grænsefladen:
 * - Brugerens hånd (`data-haand="dig"`) har `data-plads="E"` eller `data-plads="W"` som opgavens plads og overskriften
 *   "<Plads> · dig". Nords og brugerens hånd har hver farve i sit eget element `.ms-farvelinje`.
 * - Ingen kortknap står i bordet (`.ms-bord`). Hvor brugeren vælger et kort, står kortknapperne i gruppen "Svar" efter
 *   spørgsmålet (`<h1>`) og efter "Aftalen" (`<details>`) i Vælg kortet, og hånden ved feltet viser alle brugerens kort,
 *   der ikke er spillet, som tekst.
 * - Tallet og "hp" står i et element med klassen `ms-hp`, og `modspil.css` giver `.ms-hp` `text-transform: none`.
 * Geometrien (Nord over feltet, Øst til højre og Vest til venstre) tjekkes i Chrome: accepttest 5.
 */
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setLang } from '../../i18n';
import { ROOT } from '../../sprog/danskTekst';
import type { ModspilOpgave } from '../model/generator';
import { farveAf } from '../model/tekst';
import { eksempler, foer, kortKnapper, kortLabel, navn, svarGruppe, tæt, vaelgerKort, visOpgave, type Svar } from './testhjaelp';

const PLADSER: Record<string, string> = { W: 'Vest', E: 'Øst' };
const SYM = ['♠', '♥', '♦', '♣'];

beforeEach(() => setLang('da'));
afterEach(cleanup);

/** De farver, hånden har kort tilbage i, som tekst uden mellemrum, fx "♠D983". */
function farvelinjer(o: ModspilOpgave, plads: 'N' | 'W' | 'E'): string[] {
  const spillet = new Set(o.spillet.map((s) => s.kort));
  const ud: string[] = [];
  for (let f = 0; f < 4; f++) {
    const kort = o.haender[plads].filter((k) => farveAf(k) === f && !spillet.has(k));
    if (kort.length) ud.push(SYM[f]);
  }
  return ud;
}

describe('Bordet har rigtige verdenshjørner (accepttest 1)', () => {
  it('brugerens hånd har sin plads, overskriften "<Plads> · dig" og én farve pr. linje; Nord har én farve pr. linje', () => {
    for (const o of eksempler()) {
      const hvor = navn(o);
      visOpgave(o);
      const dig = document.querySelector<HTMLElement>('[data-haand="dig"]');
      const nord = document.querySelector<HTMLElement>('[data-haand="nord"]');
      expect(dig && nord, hvor).toBeTruthy();
      expect(dig!.dataset.plads, `${hvor}: din hånd har din plads`).toBe(o.plads);
      expect(dig!.querySelector('.eyebrow')?.textContent?.trim().startsWith(`${PLADSER[o.plads]} · dig`), `${hvor}: overskriften`).toBe(true);
      const linjer = (el: HTMLElement) => [...el.querySelectorAll('.ms-farvelinje')].map((l) => tæt(l.textContent).slice(0, 2));
      expect(linjer(nord!).map((l) => l[0]), `${hvor}: Nords farvelinjer`).toEqual(farvelinjer(o, 'N'));
      expect(linjer(dig!).map((l) => l[0]), `${hvor}: dine farvelinjer`).toEqual(farvelinjer(o, o.plads));
      const bord = document.querySelector('.ms-bord');
      expect(bord?.contains(dig!) && bord?.contains(nord!), `${hvor}: begge hænder står i bordet`).toBe(true);
      expect(kortKnapper().filter((b) => b.closest('.ms-bord')), `${hvor}: ingen kortknap i bordet`).toEqual([]);
      cleanup();
    }
  }, 30_000);

  it('feltet viser stadig V, Ø og "S · spilfører", og hånden står efter stikket i HTML', () => {
    for (const o of eksempler().filter((x) => x.spillet.length)) {
      visOpgave(o);
      const stik = screen.getByRole('img', { name: /^Stik \d+: / });
      expect(tæt(stik.textContent), navn(o)).toContain('S·spilfører');
      expect(foer(stik, document.querySelector('[data-haand="dig"]')!), navn(o)).toBe(true);
      cleanup();
    }
  }, 30_000);
});

describe('Kortknapperne står i spørgsmålet (accepttest 2)', () => {
  const vaelger = () => eksempler().filter(vaelgerKort);

  it('der er opgaver, hvor brugeren vælger et kort', () => {
    expect(vaelger().length).toBeGreaterThan(3);
  });

  it('knapperne står i gruppen "Svar" efter spørgsmålet (og aftalen), og hånden viser alle dine kort som tekst', () => {
    for (const o of vaelger()) {
      const hvor = navn(o);
      visOpgave(o);
      const knapper = kortKnapper();
      expect(knapper.length, `${hvor}: kortknapper`).toBeGreaterThan(0);
      const gruppe = svarGruppe();
      const spm = screen.getByRole('heading', { level: 1 });
      expect(foer(spm, gruppe), `${hvor}: gruppen under spørgsmålet`).toBe(true);
      for (const b of knapper) expect(gruppe.contains(b), `${hvor}: ${b.getAttribute('aria-label')} i gruppen "Svar"`).toBe(true);
      const aftale = document.querySelector('details');
      if (o.ovelse === 'vaelg-kort') expect(aftale && foer(aftale, gruppe), `${hvor}: knapperne under aftalen`).toBe(true);
      const dig = document.querySelector<HTMLElement>('[data-haand="dig"]')!;
      const spillet = new Set(o.spillet.map((s) => s.kort));
      const tekst = tæt(dig.textContent);
      for (const k of o.haender[o.plads].filter((c) => !spillet.has(c))) {
        const label = kortLabel(k);
        expect(within(dig).queryByRole('button', { name: label }), `${hvor}: ${label} er ikke en knap i hånden`).toBeNull();
      }
      for (const f of farvelinjer(o, o.plads)) expect(tekst.includes(f), `${hvor}: ${f} i hånden`).toBe(true);
      cleanup();
    }
  }, 30_000);

  it('et klik svarer med kortet, og i facit har det rigtige kort grøn kant', () => {
    for (const o of vaelger()) {
      const hvor = navn(o);
      let svar: Svar | undefined;
      visOpgave(o, { onSvar: (s) => (svar = s) });
      const knap = kortKnapper()[0];
      fireEvent.click(knap);
      expect(svar?.type, hvor).toBe('kort');
      cleanup();
      visOpgave(o, { svar });
      const gruppe = svarGruppe();
      if (o.facit.type === 'kort') {
        for (const k of o.facit.kort) {
          const b = within(gruppe).queryByRole('button', { name: kortLabel(k) });
          if (b) expect(b.classList.contains('ms-rigtig'), `${hvor}: ${kortLabel(k)} er grøn`).toBe(true);
        }
      }
      cleanup();
    }
  }, 30_000);
});

describe('hp med små bogstaver (accepttest 3)', () => {
  it('i øvelse 1–3 står "<n> hp" i et element med klassen ms-hp', () => {
    const med = eksempler().filter((o) => o.ovelse === 'point' || o.ovelse === 'regel11' || o.ovelse === 'laengde');
    expect(med.length).toBeGreaterThan(0);
    for (const o of med) {
      visOpgave(o);
      const hp = [...document.querySelectorAll('.ms-bord .ms-hp')].map((e) => e.textContent?.trim());
      expect(hp.length, `${navn(o)}: hp ved Nord og ved dig`).toBe(2);
      for (const t of hp) expect(t, navn(o)).toMatch(/^\d+ hp$/);
      cleanup();
    }
  }, 30_000);

  it('modspil.css giver .ms-hp text-transform: none', () => {
    const css = readFileSync(join(ROOT, 'src/modspil/ui/modspil.css'), 'utf8');
    const regel = css.match(/\.ms-hp\s*\{([^}]*)\}/);
    expect(regel?.[1]).toMatch(/text-transform:\s*none/);
  });
});
