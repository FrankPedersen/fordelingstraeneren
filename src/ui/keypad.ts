// Mønstertastaturet: cifrene 0–9 og "10+". Når tre længder er tastet, udfyldes den fjerde med
// 13 minus resten. "10+" står for den lange farve; dens længde er 13 minus de tre andre, så den
// kun kan tastes, når resten højst er 3.

export type Key = number | 'long' | 'back';
export type Entry = number | 'long';
export type KeypadState = readonly Entry[];

const digitsOf = (state: KeypadState) => state.filter((e): e is number => e !== 'long');
const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);

export function canPress(state: KeypadState, key: Key): boolean {
  if (key === 'back') return state.length > 0;
  const total = sum(digitsOf(state));
  const hasLong = state.includes('long');
  if (key === 'long') return !hasLong && total <= 3;
  return total + key <= (hasLong ? 3 : 13);
}

/** Trykker en tast. Er mønstret komplet, returneres længderne (faldende), og tastaturet nulstilles. */
export function press(state: KeypadState, key: Key): { state: KeypadState; lengths?: number[] } {
  if (!canPress(state, key)) return { state };
  if (key === 'back') return { state: state.slice(0, -1) };
  const next = [...state, key];
  const digits = digitsOf(next);
  if (digits.length < 3) return { state: next };
  return { state: [], lengths: [...digits, 13 - sum(digits)].sort((a, b) => b - a) };
}

/** De fire felter i faldende orden; null er et tomt felt. */
export function slots(state: KeypadState): (string | null)[] {
  const shown: (string | null)[] = [
    ...(state.includes('long') ? ['10+'] : []),
    ...digitsOf(state)
      .sort((a, b) => b - a)
      .map(String),
  ];
  while (shown.length < 4) shown.push(null);
  return shown;
}
