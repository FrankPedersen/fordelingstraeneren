// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setLang } from '../../i18n';
import { CompleteView } from './CompleteView';
import type { CompleteTask } from './task';

// Accepttest for SPEC-fuldfoer-dom.md: sætningen om rækkefølgen står i facit efter "Vest havde …".

afterEach(() => {
  cleanup();
  setLang('da');
});

const noop = () => {};
const vest5h4c: CompleteTask = { kind: 'complete', seed: 1, patternId: '5-4-2-2', seat: 'W', lengths: [2, 5, 2, 4], known: [null, 5, null, 4], count: 3, all: true };
const vest5: CompleteTask = { kind: 'complete', seed: 1, patternId: '5-5-2-1', seat: 'W', lengths: [5, 5, 2, 1], known: [5, null, null, null], count: 3, all: false };
const paragraphs = () => [...document.querySelectorAll('.facit p')].map((p) => p.textContent);

describe('Facit i Fuldfør (SPEC-fuldfoer-dom.md)', () => {
  it('står efter "Vest havde …", når den faktiske hånd er tastet først (all: true)', () => {
    render(<CompleteView task={vest5h4c} submitted={['5-4-2-2', '5-4-3-1', '5-4-4-0']} reveal onAnswer={noop} />);
    const p = paragraphs();
    const havde = p.findIndex((t) => t?.startsWith('Vest havde'));
    expect(havde).toBeGreaterThanOrEqual(0);
    expect(p[havde + 1]).toBe('Rækkefølgen er efter hyppighed. Vests hånd var den næsthyppigste.');
  });

  it('står ikke, når et andet mønster er tastet først', () => {
    render(<CompleteView task={vest5h4c} submitted={['5-4-3-1', '5-4-2-2', '5-4-4-0']} reveal onAnswer={noop} />);
    expect(paragraphs().some((t) => t?.startsWith('Rækkefølgen'))).toBe(false);
  });

  it('gælder også opgaver med all: false, på dansk og engelsk', () => {
    render(<CompleteView task={vest5} submitted={['5-5-2-1', '5-3-3-2', '5-4-3-1']} reveal onAnswer={noop} />);
    expect(paragraphs()).toContain('Rækkefølgen er efter hyppighed. Vests hånd var nr. 4 i hyppighed.');
    cleanup();
    setLang('en');
    render(<CompleteView task={vest5} submitted={['5-5-2-1', '5-3-3-2', '5-4-3-1']} reveal onAnswer={noop} />);
    expect(paragraphs()).toContain("The order is by frequency. West's hand was no. 4 by frequency.");
  });
});
