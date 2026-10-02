import { describe, expect, it } from 'vitest';
import { canPress, press, slots, type Key, type KeypadState } from './keypad';

function type(keys: Key[]) {
  let state: KeypadState = [];
  let lengths: number[] | undefined;
  for (const key of keys) ({ state, lengths } = press(state, key));
  return { state, lengths };
}

describe('Mønstertastatur', () => {
  it('tager længderne i vilkårlig rækkefølge og udfylder den fjerde efter tre', () => {
    expect(type([3, 5, 4]).lengths).toEqual([5, 4, 3, 1]);
    expect(type([2, 2, 5]).lengths).toEqual([5, 4, 2, 2]);
    expect(type([3, 5, 4]).state).toEqual([]);
  });

  it('udfylder også lange farver', () => {
    expect(type([1, 1, 0]).lengths).toEqual([11, 1, 1, 0]);
    expect(type([0, 0, 0]).lengths).toEqual([13, 0, 0, 0]);
  });

  it('bruger "10+" som den lange farve, hvis længde gives af de tre andre', () => {
    const partial = type(['long', 2, 1]);
    expect(partial.lengths).toBeUndefined();
    expect(slots(partial.state)).toEqual(['10+', '2', '1', null]);
    expect(type(['long', 2, 1, 0]).lengths).toEqual([10, 2, 1, 0]);
    expect(type([1, 'long', 1, 0]).lengths).toEqual([11, 1, 1, 0]);
  });

  it('spærrer taster, der ville gøre mønstret umuligt', () => {
    const { state } = type([9, 4]);
    expect(canPress(state, 0)).toBe(true);
    expect(canPress(state, 1)).toBe(false);
    expect(canPress(state, 'long')).toBe(false);
    const long = type(['long']).state;
    expect(canPress(long, 3)).toBe(true);
    expect(canPress(long, 4)).toBe(false);
    expect(canPress(long, 'long')).toBe(false);
    expect(press(state, 1).state).toBe(state);
  });

  it('sletter seneste tast', () => {
    expect(type([1, 'long', 'back']).state).toEqual([1]);
    expect(canPress([], 'back')).toBe(false);
  });

  it('viser de tastede længder sorteret faldende', () => {
    expect(slots(type([2, 5]).state)).toEqual(['5', '2', null, null]);
    expect(slots([])).toEqual([null, null, null, null]);
  });
});
