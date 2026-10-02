/** Binomialkoefficienten C(n, k) som eksakt heltal. */
export function binomial(n: number, k: number): bigint {
  if (k < 0 || k > n) return 0n;
  const m = Math.min(k, n - k);
  let result = 1n;
  // Efter i trin er result = C(n - m + i, i), så divisionen går altid op.
  for (let i = 1; i <= m; i++) result = (result * BigInt(n - m + i)) / BigInt(i);
  return result;
}

/** Antallet af mulige 13-korts hænder: C(52, 13) = 635.013.559.600. */
export const TOTAL_HANDS = binomial(52, 13);

/** C(13, l) for l = 0–13: antal måder at få l kort i én farve. */
export const SUIT_WAYS: readonly bigint[] = Array.from({ length: 14 }, (_, l) => binomial(13, l));

/** num / den i procent, eksakt afrundet (halvt op) til `decimals` decimaler. */
export function ratioPercent(num: bigint, den: bigint, decimals = 2): number {
  const scale = 10n ** BigInt(decimals);
  return Number((2n * num * 100n * scale + den) / (2n * den)) / Number(scale);
}
