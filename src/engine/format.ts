import { getLang } from '../i18n';

/** Heltal med punktum som tusindtalsseparator, fx 17.971 (på engelsk 17,971). */
export function formatInt(n: number): string {
  const rounded = Math.round(n);
  const digits = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+$)/g, getLang() === 'en' ? ',' : '.');
  return rounded < 0 ? `-${digits}` : digits;
}

/** Kommatal med decimalkomma, fx 21,55 (på engelsk 21.55). */
export function formatDecimal(n: number, decimals: number): string {
  const text = n.toFixed(decimals);
  return getLang() === 'en' ? text : text.replace('.', ',');
}

/** Procent med decimalkomma og mellemrum før tegnet, fx 21,55 %. */
export function formatPercent(value: number, decimals = 2): string {
  return `${formatDecimal(value, decimals)} %`;
}
