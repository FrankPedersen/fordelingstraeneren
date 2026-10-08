import { describe, expect, it } from 'vitest';
import facitFile from '../content/p-model.facit.json';
import { handFacit, pairFacit, pFacit, round4, type FacitFile, type HandInput, type PairInput } from './facit';
import { gameThreshold, partnerNeeds, SHORTNESS_BY_PATTERN, type Form } from './pmodel';

/**
 * Facittesten (SPEC-haandevaluering.md, Fælles med konventionstræneren): appens model skal give facitfilens resultater.
 * Konventionstræneren kopierer p-model.json og p-model.facit.json og kører samme test på sin kopi. Ændres modellen,
 * skrives filen igen med `node scripts/p-model-facit.ts`.
 */
const file = facitFile as unknown as FacitFile;

const rounded = <T extends object>(o: T): T =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? round4(v) : v])) as T;

describe('Facitfilen p-model.facit.json', () => {
  it('har hænder, par og P-værdier, også specens eksempler', () => {
    expect(file.haender.length).toBeGreaterThanOrEqual(10);
    expect(file.par.length).toBeGreaterThanOrEqual(8);
    expect(file.P.length).toBeGreaterThanOrEqual(20);
    expect(file.haender.find((h) => h.id === 'spec-spar-fit')!.facit.p).toBe(17);
    expect(file.par.find((p) => p.id === 'spec-P-29')!.facit).toMatchObject({ P: 29, stik: 9.74, '4M': 58 });
    // Hver kontrakt og begge udfald i Farve eller sans er med.
    const contracts = new Set(file.par.map((p) => p.facit.kontrakt));
    for (const c of ['pass', 'invite', 'game', 'slam', 'grand']) expect(contracts, c).toContain(c);
    expect(new Set(file.par.map((p) => p.facit.retning))).toEqual(new Set(['major', 'notrump', null]));
  });

  it('appens model giver facitfilens resultater for hver hånd', () => {
    for (const entry of file.haender) {
      const { facit, ...input } = entry;
      expect(rounded(handFacit(input as HandInput)), entry.id).toEqual(facit);
    }
  });

  it('… for hvert par', () => {
    for (const entry of file.par) {
      const { facit, ...input } = entry;
      expect(rounded(pairFacit(input as PairInput)), entry.id).toEqual(facit);
    }
  });

  it('… for hver P, for makkers krav, for mønstrene og for turneringsformen', () => {
    for (const row of file.P) expect(rounded(pFacit(row.P)), `P = ${row.P}`).toEqual(row);
    for (const row of file.makkerSkalHave) expect(partnerNeeds(row.du)).toBe(row.makker);
    expect(file.moenstre).toEqual(SHORTNESS_BY_PATTERN);
    for (const [form, threshold] of Object.entries(file.turnering)) expect(gameThreshold(form as Form), form).toBe(threshold);
  });
});
