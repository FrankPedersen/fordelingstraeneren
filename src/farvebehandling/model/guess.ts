/** Gætteintervallerne i "Hvor stor er chancen?". Grænsen hører til intervallet over: 25,0 → 25–50. */
export const GUESS_INTERVALS = [
  { from: 0, to: 25, label: '0–25 %' },
  { from: 25, to: 50, label: '25–50 %' },
  { from: 50, to: 75, label: '50–75 %' },
  { from: 75, to: 100, label: '75–100 %' },
] as const;

/**
 * Intervallet for en chance i procent. Chancen afrundes først til én decimal som i visningen,
 * så et facit på 25,0 % altid hører til 25–50, også hvis det eksakte tal er 24,98 %.
 */
export function guessInterval(percent: number): number {
  const shown = Math.round(percent * 10) / 10;
  if (shown >= 75) return 3;
  if (shown >= 50) return 2;
  if (shown >= 25) return 1;
  return 0;
}
