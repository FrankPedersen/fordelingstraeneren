import type { Pattern } from './patterns';

/** Svaret i højere/lavere: mønster a, mønster b eller ≈ (lige hyppige). */
export type Frequency = 'a' | 'b' | 'equal';

/** ≈ er rigtigt, når den relative forskel er under 2 %. */
export function compareFrequency(a: Pattern, b: Pattern): Frequency {
  const [high, low] = a.hands > b.hands ? [a.hands, b.hands] : [b.hands, a.hands];
  if ((high - low) * 50n < high) return 'equal';
  return a.hands > b.hands ? 'a' : 'b';
}
