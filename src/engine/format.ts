/** Heltal med punktum som tusindtalsseparator, fx 17.971. */
export function formatInt(n: number): string {
  const rounded = Math.round(n);
  const digits = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+$)/g, '.');
  return rounded < 0 ? `-${digits}` : digits;
}
