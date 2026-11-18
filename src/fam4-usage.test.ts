import { describe, expect, it } from 'vitest';
import tokens from '../design/tokens.json';

/**
 * Accepttest 6 i SPEC-splitprocenter.md, skrevet før rettelsen: fokusringen har sit eget token `focus` (siden 4.
 * november 2026), så `fam-4.usage` nævner den ikke længere. Kun sætningen "Også fokusringen (3px)." fjernes; resten af
 * teksten og farveværdierne står. Ingen eksisterende test tjekker teksten.
 */
describe('6. fam-4 (SPEC-splitprocenter.md)', () => {
  it('usage nævner ikke fokusringen, resten af teksten står, og farveværdierne er uændrede', () => {
    const fam4 = tokens.color.tokens.find((t) => t.name === 'fam-4')!;
    expect(fam4.usage).not.toMatch(/fokus/i);
    expect(fam4.usage).toBe('Mønsterfamilie 4 (blå): skylines, klubaftenens celler og forklaringer. Står aldrig alene uden tekst eller tal.');
    expect(fam4.value).toEqual({ light: '#2563eb', dark: '#60a5fa' });
  });
});
