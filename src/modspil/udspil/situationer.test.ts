import { describe, expect, it } from 'vitest';
import { SEATS } from '../../domain/dealer';
import { bydeform } from '../../sprog/bydeform';
import { danishJson } from '../../sprog/danskTekst';
import { fund } from '../../sprog/fagord';
import { SYSTEM, contextsOf } from '../../system/interpreter';
import { FARVER, situationsfil, type Krav } from './hjaelp';

/*
 * Accepttest 1 i SPEC-modspil-v2.md, trin 1: situationsfilen har otte situationer med alle felter, gyldige
 * meldeforløb, kontrakt og en side i Kompendiet, og teksterne består fagords- og bydeformstestene.
 */

const fil = situationsfil();
const ID = ['S1-1nt-3nt', 'S2-stayman', 'S3-transfer', 'S4-kun-en-farve', 'S5-sidefarve', 'S6-trumf', 'S7-makker-aabnet', 'S8-delkontrakt'];
const NIVEAU_FARVE = /^([1-7])(C|D|H|S|NT)$/;
const ORDEN = ['C', 'D', 'H', 'S', 'NT'];
const KOMPENDIETS_SIDER = 27;

/** Meldingens rang (1♣ = 0 … 7NT = 34), eller null for pas. */
function rang(melding: string): number | null {
  if (melding === 'P') return null;
  const m = NIVEAU_FARVE.exec(melding);
  if (!m) throw new Error(`Ugyldig melding: ${melding}`);
  return (Number(m[1]) - 1) * 5 + ORDEN.indexOf(m[2]);
}

function kravFelter(k: Krav): string[] {
  return Object.keys(k).flatMap((n) => (n === 'enAf' ? (k.enAf ?? []).flatMap(kravFelter) : [n]));
}

describe('Situationsfilen (accepttest 1)', () => {
  it('har de otte situationer i rækkefølge og 150 opgaver med 100 fordelinger', () => {
    expect(fil.situationer.map((s) => s.id)).toEqual(ID);
    expect(fil.opgaver).toBe(150);
    expect(fil.fordelinger).toBe(100);
    expect(new Set(fil.situationer.map((s) => s.seed)).size).toBe(8);
  });

  it.each(ID)('%s har alle felter og et gyldigt meldeforløb, der ender i kontrakten', (id) => {
    const s = fil.situationer.find((x) => x.id === id)!;
    for (const felt of ['navn', 'navnEn', 'seed', 'giver', 'meldinger', 'kontrakt', 'spilfoerer', 'sider', 'krav', 'kompendieraad', 'eksempler'] as const) {
      expect(s[felt], felt).toBeDefined();
    }
    expect(Number.isInteger(s.seed) && s.seed >= 0 && s.seed < 2 ** 32).toBe(true);

    // Meldingerne går rundt fra giveren, hver højere end den forrige, og slutter med tre pas efter kontrakten.
    const meldinger = s.meldinger.map((m) => m.split(':') as [string, string]);
    expect(meldinger[0][0]).toBe(s.giver);
    meldinger.forEach(([plads], i) => expect(plads).toBe(SEATS[(SEATS.indexOf(s.giver) + i) % 4]));
    let hoejeste = -1;
    let sidste = -1;
    meldinger.forEach(([, m], i) => {
      const r = rang(m);
      if (r === null) return;
      expect(r, m).toBeGreaterThan(hoejeste);
      hoejeste = r;
      sidste = i;
    });
    expect(meldinger.length - 1 - sidste).toBe(3);
    expect(meldinger.slice(sidste + 1).every(([, m]) => m === 'P')).toBe(true);
    expect(meldinger[sidste][1]).toBe(s.kontrakt);
    // Spilføreren er den på den sidste melders side, der først meldte kontraktens benævnelse.
    const side = [meldinger[sidste][0], SEATS[(SEATS.indexOf(meldinger[sidste][0] as (typeof SEATS)[number]) + 2) % 4]];
    const benaevnelse = s.kontrakt.slice(1);
    const foerst = meldinger.find(([p, m]) => side.includes(p) && m !== 'P' && m.slice(1) === benaevnelse);
    expect(foerst?.[0]).toBe(s.spilfoerer);
    expect(s.spilfoerer).toBe('S');
    // Vest spiller ud: pladsen efter spilføreren.
    expect(SEATS[(SEATS.indexOf(s.spilfoerer) + 1) % 4]).toBe('W');

    expect(s.sider.length).toBeGreaterThan(0);
    for (const side of s.sider) expect(side >= 1 && side <= KOMPENDIETS_SIDER, `side ${side}`).toBe(true);
  });

  it.each(ID)('%s har krav til alle fire hænder med kendte felter og kendte sammenhænge i systemfilen', (id) => {
    const s = fil.situationer.find((x) => x.id === id)!;
    const kendte = new Set(['hp', 'min', 'max', 'praecis', 'jaevn', 'system', 'stop', 'pas']);
    const sammenhaenge = contextsOf(SYSTEM);
    for (const p of SEATS) {
      expect(s.krav[p], p).toBeDefined();
      for (const felt of kravFelter(s.krav[p])) expect(kendte.has(felt), `${p}: ${felt}`).toBe(true);
      if (s.krav[p].pas) expect(sammenhaenge).toContain(s.krav[p].pas);
      if (s.krav[p].system) expect(SYSTEM.some((r) => r.context === 'opening' && r.call === s.krav[p].system)).toBe(true);
    }
  });

  it.each(ID)('%s har Kompendiets råd som regler med farver og en tekst på dansk og engelsk', (id) => {
    const r = fil.situationer.find((x) => x.id === id)!.kompendieraad;
    expect(r.tekst.length).toBeGreaterThan(20);
    expect(r.tekstEn.length).toBeGreaterThan(20);
    expect(r.regler.length).toBeGreaterThan(0);
    for (const regel of r.regler) {
      expect(['farver', 'korteste', 'laengde', 'udenHonnoer', 'staerkSekvens']).toContain(regel.udvalg);
      expect(regel.blandt.length).toBeGreaterThan(0);
      for (const f of regel.blandt) expect(FARVER).toContain(f);
      if (regel.udvalg === 'laengde') expect(Number.isInteger(regel.laengde)).toBe(true);
    }
    // Sidste regel gælder altid, så rådet peger på mindst én farve, når Vest har kort i den.
    expect(r.regler[r.regler.length - 1].hvis).toBeUndefined();
  });

  it('teksterne består fagordstesten og står i beskrivende form', () => {
    const tekster = danishJson(fil).filter((t) => /\s/.test(t));
    expect(tekster.length).toBeGreaterThanOrEqual(8);
    const fejl = tekster.flatMap((t) => [...fund(t).map((f) => `"${f.word}" (husets ord: ${f.house}) i "${t}"`), ...bydeform(t).map((b) => `bydeform: "${b}"`)]);
    expect(fejl).toEqual([]);
  });

  it('de engelske tekster har ingen danske bogstaver', () => {
    for (const s of fil.situationer) {
      for (const t of [s.navnEn, s.kompendieraad.tekstEn]) expect(t, s.id).not.toMatch(/[æøåÆØÅ]/);
    }
  });
});
