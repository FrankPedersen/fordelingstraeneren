// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLang } from './i18n';
import { Info } from './ui/Info';

// Accepttest for SPEC-info-boks.md. Placeringen, og at bordet ikke flytter sig, ses i en rigtig browser i
// scripts/tjek-bred-layout.mjs.
const bred = (matches: boolean) =>
  vi.stubGlobal('matchMedia', (query: string) => ({ matches, media: query, addEventListener() {}, removeEventListener() {} }));

beforeEach(() => bred(true));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  setLang('da');
});

const iSpalten = () =>
  render(
    <div className="wide-left">
      <Info topic="Problemet">Forklaringen</Info>
    </div>,
  );
const knap = () => screen.getByRole('button', { name: 'Hjælp: Problemet' });

describe('En ⓘ i bordets spalte fra 1000 px', () => {
  it('åbner som en boks med emnet som navn, uden for spalten i dokumentet', () => {
    const { container } = iSpalten();
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(knap());
    const boks = screen.getByRole('dialog', { name: 'Problemet' });
    expect(boks.textContent).toContain('Forklaringen');
    expect(container.contains(boks)).toBe(false);
    expect(container.querySelector('.info-text')).toBeNull();
    expect(knap().getAttribute('aria-expanded')).toBe('true');
    expect(knap().getAttribute('aria-haspopup')).toBe('dialog');
    expect(knap().getAttribute('aria-controls')).toBe(boks.id);
  });

  it('flytter fokus til ✕, når boksen åbner', () => {
    iSpalten();
    fireEvent.click(knap());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Luk' }));
  });

  it('✕ lukker boksen, og fokus går tilbage til ⓘ', () => {
    iSpalten();
    fireEvent.click(knap());
    fireEvent.click(screen.getByRole('button', { name: 'Luk' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(knap());
    expect(knap().getAttribute('aria-expanded')).toBe('false');
  });

  it('Esc lukker boksen, og fokus går tilbage til ⓘ', () => {
    iSpalten();
    fireEvent.click(knap());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(knap());
  });

  it('et klik udenfor lukker boksen, og fokus går tilbage til ⓘ; et klik i boksen gør ikke', () => {
    iSpalten();
    fireEvent.click(knap());
    fireEvent.pointerDown(screen.getByRole('dialog'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(knap());
  });

  it('et nyt tryk på ⓘ lukker boksen', () => {
    iSpalten();
    fireEvent.click(knap());
    fireEvent.pointerDown(knap());
    fireEvent.click(knap());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(knap());
  });

  it('Tab bliver i boksen', () => {
    iSpalten();
    fireEvent.click(knap());
    const luk = screen.getByRole('button', { name: 'Luk' });
    expect(fireEvent.keyDown(document, { key: 'Tab' })).toBe(false);
    expect(document.activeElement).toBe(luk);
  });

  it('har engelsk på ✕', () => {
    setLang('en');
    render(
      <div className="wide-left">
        <Info topic="The problem">Text</Info>
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Help: The problem' }));
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });
});

describe('Ellers er ⓘ, som den er', () => {
  it('i et andet kort åbner den i kortet', () => {
    const { container } = render(<Info topic="Linjerne">Forklaringen</Info>);
    fireEvent.click(screen.getByRole('button', { name: 'Hjælp: Linjerne' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(container.querySelector('.info-text')?.textContent).toBe('Forklaringen');
    expect(screen.getByRole('note')).toBeTruthy();
  });

  it('under 1000 px åbner den i kortet, også i spalten', () => {
    bred(false);
    const { container } = iSpalten();
    fireEvent.click(knap());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(container.querySelector('.info-text')?.textContent).toBe('Forklaringen');
    expect(knap().getAttribute('aria-haspopup')).toBeNull();
  });

  it('Esc og et klik udenfor gør ingenting ved en almindelig ⓘ', () => {
    const { container } = render(<Info topic="Linjerne">Forklaringen</Info>);
    fireEvent.click(screen.getByRole('button', { name: 'Hjælp: Linjerne' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.pointerDown(document.body);
    expect(container.querySelector('.info-text')).toBeTruthy();
  });
});
