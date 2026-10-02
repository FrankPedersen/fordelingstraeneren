// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SuitText } from './SuitText';

afterEach(cleanup);

describe('SuitText', () => {
  it('farver hjerter og ruder røde og lader spar og klør stå i tekstfarven', () => {
    const { container } = render(<SuitText text="Vest har vist 5♠, 4♥, 3♦ og 1♣." />);
    expect(container.textContent).toBe('Vest har vist 5♠, 4♥, 3♦ og 1♣.');
    expect([...container.querySelectorAll('.suit-red')].map((s) => s.textContent)).toEqual(['♥', '♦']);
  });
});
