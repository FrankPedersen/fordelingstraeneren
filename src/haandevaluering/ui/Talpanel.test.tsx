// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Talpanel } from './Talpanel';

afterEach(cleanup);

describe('Talpanelet', () => {
  it('sporets talpanel har ½ og ¼: 12¾ tastes som 1, 2, ½ og ¼, og ⌫ sletter brøken først', () => {
    const onSubmit = vi.fn();
    render(<Talpanel onSubmit={onSubmit} />);
    const key = (name: string) => screen.getByRole('button', { name });
    expect((key('OK') as HTMLButtonElement).disabled).toBe(true);
    for (const name of ['1', '2', 'En halv', 'En kvart']) fireEvent.click(key(name));
    expect(document.querySelector('.keypad-display')!.textContent).toBe('12¾');
    // Brøken er højst ¾.
    expect((key('En kvart') as HTMLButtonElement).disabled).toBe(true);
    expect((key('En halv') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(key('OK'));
    expect(onSubmit).toHaveBeenLastCalledWith(12.75);
    fireEvent.click(key('Slet'));
    expect(document.querySelector('.keypad-display')!.textContent).toBe('12');
    fireEvent.click(key('Slet'));
    fireEvent.click(key('Slet'));
    fireEvent.click(key('En halv'));
    fireEvent.click(key('OK'));
    expect(onSubmit).toHaveBeenLastCalledWith(0.5);
  });

});
