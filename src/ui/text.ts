import { formatDecimal, formatPercent } from '../engine/format';
import { TOTAL_HANDS, ratioPercent } from '../domain/combinatorics';
import type { Pattern } from '../domain/patterns';

/** num / den i procent med mindst to decimaler og to betydende cifre, fx 0,072 %. */
export function percentText(num: bigint, den: bigint): string {
  const value = (Number(num) / Number(den)) * 100;
  const decimals = value >= 0.1 || value === 0 ? 2 : Math.ceil(-Math.log10(value)) + 1;
  return formatPercent(ratioPercent(num, den, decimals), decimals);
}

export function patternPercent(pattern: Pattern): string {
  return percentText(pattern.hands, TOTAL_HANDS);
}

export function secondsText(ms: number): string {
  return `${formatDecimal(ms / 1000, 1)} s`;
}

/** XP med fortegn, fx +25 XP og −10 XP. */
export function xpText(xp: number): string {
  return xp < 0 ? `−${-xp} XP` : `+${xp} XP`;
}
