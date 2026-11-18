import { isDue, newItem, review, type Item } from '../../engine/leitner';
import { OVELSER, type Ovelse } from '../model/generator';

/**
 * Modspils Leitner-bunke (SPEC-modspil.md, Afgrænsning (trin 2)): ét emne pr. øvelse. Emnet oprettes første gang,
 * øvelsen besvares, og flyttes af motorens `review`: rigtigt og inden for et minut én kasse op, forkert til kasse 1.
 * Forfaldne øvelser kommer først i sessionen som repetition.
 */

export const itemKey = (ovelse: Ovelse): string => `ovelse:${ovelse}`;
export const ovelseAf = (key: string): Ovelse => key.replace(/^ovelse:/, '') as Ovelse;

/** Rigtigt inden for så mange millisekunder er hurtigt. */
export const HURTIGT_MS = 60_000;

/** De forfaldne øvelser i dag, i øvelsernes orden (som opvarmningens kø i Pointregnskab). */
export function warmupQueue(items: Record<string, Item>, today: string): string[] {
  return OVELSER.map(itemKey).filter((key) => key in items && isDue(items[key], today));
}

/** Øvelsens emne efter et svar; findes det ikke, oprettes det i dag. */
export function reviewOvelse(items: Record<string, Item>, ovelse: Ovelse, rigtigt: boolean, ms: number, today: string, now: number): Record<string, Item> {
  const key = itemKey(ovelse);
  const item = items[key] ?? newItem(today);
  const outcome = !rigtigt ? 'wrong' : ms <= HURTIGT_MS ? 'fast' : 'slow';
  return { ...items, [key]: review(item, outcome, today, { t: now, ok: rigtigt, ms }) };
}
