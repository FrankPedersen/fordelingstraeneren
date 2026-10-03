/** Et eksakt forhold mellem to heltal. Sandsynligheder regnes som tæller og nævner og deles først til sidst. */
export interface Fraction {
  num: bigint;
  den: bigint;
}

export function fraction(num: bigint, den: bigint): Fraction {
  if (den === 0n) throw new Error('Nævneren er 0');
  return { num, den };
}

export function addFractions(a: Fraction, b: Fraction): Fraction {
  if (a.den === b.den) return { num: a.num + b.num, den: a.den };
  return { num: a.num * b.den + b.num * a.den, den: a.den * b.den };
}

export function scaleFraction(f: Fraction, factor: bigint): Fraction {
  return { num: f.num * factor, den: f.den };
}

/** Som kommatal; kun til visning og sammenligning med kilder. */
export function toNumber(f: Fraction): number {
  return Number(f.num) / Number(f.den);
}

/** Procent med `decimals` decimaler, afrundet halvt op. */
export function percentOf(f: Fraction, decimals = 2): number {
  const scale = 10n ** BigInt(decimals);
  return Number((2n * f.num * 100n * scale + f.den) / (2n * f.den)) / Number(scale);
}

/** -1, 0 eller 1 alt efter om f er mindre end, lig med eller større end percent/100. */
export function comparePercent(f: Fraction, percent: number): number {
  // percent har højst 6 decimaler i praksis; skaler til heltal.
  const scale = 1_000_000n;
  const p = BigInt(Math.round(percent * 1_000_000));
  const left = f.num * 100n * scale;
  const right = p * f.den;
  return left < right ? -1 : left > right ? 1 : 0;
}
