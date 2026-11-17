import { describe, expect, it } from 'vitest';
import { SEATS, type Seat } from '../domain/dealer';
import { OPENING_PASS } from '../pointregnskab/model/bidding';
import { allowedOf, intersect, isHonor, type Allowed } from '../pointregnskab/model/points';
import { solve, type Ledger } from '../pointregnskab/model/solver';
import { chooseCall, hcpOf, theirSuit } from '../system/interpreter';
import { lavOpgave, type ModspilOpgave, type Niveau } from './model/generator';
import { profil } from './model/metoder';

/*
 * Accepttest 6 i SPEC-modspil.md: makkers point stemmer med Pointregnskabets løser på de samme hænder, og
 * spilførers hp-interval kommer fra systemfilen via meldegiveren ("Løser, generator og facit" punkt 2). Rød, indtil
 * byggeriet har leveret generatoren (se opgaver.test.ts for hele opgavens form):
 *
 *   lavOpgave('point', niveau, seed, profil): ModspilOpgave med
 *     plads: 'E';  haender: Hands;  kontrakt: '3NT' | '4H' | '4S';
 *     meldeforloeb: { giver: Seat; meldinger: { plads: Seat; melding: string; hp?: Allowed }[] }
 *       melding som i systemfilen ('P', '1NT', '1H', '3NT', '4S' …); hp er det, meldingen viser om pladsens hp
 *       (Pointregnskabs Allowed); uden hp ingen grænse.
 *     facit: { type: 'interval'; min: number; max: number }   // Vests (makkers) mulige hp
 *
 * Meldeforløbet er kort og naturligt: Øst og Vest passer hele vejen, Syd åbner som den første, der kan åbne efter
 * systemfilen, og Syd er spilfører (kontraktens farve er Syds åbningsfarve). Pas i åbningsposition fra Øst eller Vest
 * viser 0–11 hp (Pointregnskabs OPENING_PASS); pas efter Syds åbning viser intet. Facit er Vests hp, når de usete
 * honnører fordeles på Vest og Syd, så begge ligger i deres intervaller – det samme spørgsmål, Pointregnskabets løser
 * svarer på (`solve(ledger).rest`), med Syd på løserens anden plads.
 */

const standard = profil('standard');
const kompendiet = profil('kompendiet');
const ALLE = Array.from({ length: 52 }, (_, i) => i);
const strain = (melding: string) => melding.replace(/^\d/, '');

function opgaver(antal: number, p = standard): ModspilOpgave[] {
  return Array.from({ length: antal }, (_, i) => lavOpgave('point', ((i % 5) + 1) as Niveau, i + 1, p));
}

/** Fællesmængden af det, pladsens meldinger viser; uden melding [0, m] som i Pointregnskab. */
function tilladte(o: ModspilOpgave, plads: Seat, m: number): Allowed {
  let a: Allowed | null = null;
  for (const mel of o.meldeforloeb.meldinger) if (mel.plads === plads && mel.hp) a = a ? intersect(a, mel.hp) : mel.hp;
  return a ?? [[0, m]];
}

describe('Makkers point (accepttest 6)', () => {
  it('facit er Pointregnskabets løser på de samme hænder', { timeout: 60_000 }, () => {
    for (const p of [standard, kompendiet]) {
      for (const o of opgaver(300, p)) {
        expect(o.plads).toBe('E');
        const m = 40 - hcpOf(o.haender.E) - hcpOf(o.haender.N);
        const kendt = new Set([...o.haender.E, ...o.haender.N]);
        // Pointregnskabets to pladser er Vest og Øst; her er de to skjulte hænder Vest (makker) og Syd (spilfører).
        const ledger: Ledger = {
          W: { allowed: tilladte(o, 'W', m), shown: [] },
          E: { allowed: tilladte(o, 'S', m), shown: [] },
          unseen: ALLE.filter((c) => !kendt.has(c) && isHonor(c)),
        };
        const losning = solve(ledger);
        expect(losning.feasible.length, `seed ${o.seed}`).toBeGreaterThan(0);
        expect(o.facit, `seed ${o.seed}`).toEqual({ type: 'interval', min: losning.rest.W.min, max: losning.rest.W.max });
        // Og facit er 40 − egne − bordets − spilførers interval, aldrig mere end de usete point.
        expect(o.facit.type === 'interval' && o.facit.max <= m, `seed ${o.seed}`).toBe(true);
      }
    }
  });

  it('spilførers hp-interval kommer fra systemfilen, og meldeforløbet er kort og naturligt', { timeout: 60_000 }, () => {
    const kontrakter = new Set<string>();
    for (const o of opgaver(300)) {
      const { giver, meldinger } = o.meldeforloeb;
      const hvem = `seed ${o.seed}: ${meldinger.map((x) => `${x.plads} ${x.melding}`).join(', ')}`;
      // Meldingerne går rundt fra giveren.
      meldinger.forEach((x, j) => expect(x.plads, hvem).toBe(SEATS[(SEATS.indexOf(giver) + j) % 4]));
      const aabning = meldinger.findIndex((x) => x.melding !== 'P');
      expect(meldinger[aabning]?.plads, hvem).toBe('S');
      // Syd åbner efter systemfilen, og meldingen viser regelens hp.
      const regel = chooseCall('opening', o.haender.S);
      expect(regel?.call, hvem).toBe(meldinger[aabning].melding);
      expect(meldinger[aabning].hp, hvem).toEqual(allowedOf(regel!.hcp));
      // Før åbningen kunne ingen åbne; Øst og Vest viser 0–11, Nords pas har ingen grænse.
      for (const x of meldinger.slice(0, aabning)) {
        expect(chooseCall('opening', o.haender[x.plads]), hvem).toBeNull();
        if (x.plads === 'N') expect(x.hp, hvem).toBeUndefined();
        else expect(x.hp, hvem).toEqual(OPENING_PASS);
      }
      // Efter åbningen passer Øst og Vest uden grænse, og Vest havde ingen indmelding efter systemfilen.
      for (const x of meldinger.slice(aabning + 1).filter((y) => y.plads === 'E' || y.plads === 'W')) {
        expect(x.melding, hvem).toBe('P');
        expect(x.hp, hvem).toBeUndefined();
      }
      const aabnet = meldinger[aabning].melding;
      if (/^1(NT|[SHDC])$/.test(aabnet)) expect(chooseCall(`over-${aabnet}`, o.haender.W, theirSuit(`over-${aabnet}`)), hvem).toBeNull();
      // Kontrakten er den sidste melding og i Syds åbningsfarve, så Syd er spilfører.
      expect(['3NT', '4H', '4S'], hvem).toContain(o.kontrakt);
      expect(meldinger.filter((x) => x.melding !== 'P').pop()?.melding, hvem).toBe(o.kontrakt);
      expect(strain(aabnet), hvem).toBe(strain(o.kontrakt));
      kontrakter.add(o.kontrakt);
    }
    expect(kontrakter.has('3NT')).toBe(true);
    expect(kontrakter.has('4H') || kontrakter.has('4S')).toBe(true);
  });
});
