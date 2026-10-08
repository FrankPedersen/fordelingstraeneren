// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLang } from '../../i18n';
import { HE_STORAGE_KEY, type HeSaved } from '../storage';
import HaandevalueringScreen from './HaandevalueringScreen';

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const button = (name: string | RegExp) => screen.queryByRole('button', { name });

beforeEach(() => {
  window.scrollTo = vi.fn();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  setLang('da');
});

describe('Håndevaluering', () => {
  it('forsiden viser dagens plan, husketeknikkerne og indstillinger; et kig skriver intet', () => {
    render(<HaandevalueringScreen onBack={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Håndevaluering', level: 1 })).toBeTruthy();
    expect(screen.getByText(/3 kort til opvarmning · lynrunde med honnørpoint · niveau 1/)).toBeTruthy();
    expect(screen.getByText('Stik ≈ P/3')).toBeTruthy();
    click('Indstillinger');
    expect(screen.getByRole('heading', { name: 'Dine data' })).toBeTruthy();
    click('Tilbage til Håndevaluering');
    expect(button('Start dagens session')).toBeTruthy();
    expect(localStorage.getItem(HE_STORAGE_KEY)).toBeNull();
  });

  it('en hel session: opvarmning, lynrunde, niveau og status; kun haandevaluering:v1 skrives', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 8, 12));
    const others = { 'fordelingstraener:v1': '{"urørt":true}', 'pointregnskab:v1': '{"version":1}', 'farvebehandling:v1': '{"version":1}' };
    for (const [key, value] of Object.entries(others)) localStorage.setItem(key, value);
    render(<HaandevalueringScreen onBack={() => {}} />);
    click('Start dagens session');
    const phases = new Set<string>();
    for (let i = 0; i < 400 && !screen.queryByRole('heading', { name: 'Sessionen er gennemført' }); i++) {
      phases.add(document.querySelector('.phase')?.textContent ?? '');
      act(() => vi.advanceTimersByTime(4_000));
      if (button('Næste')) click('Næste');
      else if (button('OK')) {
        click('1');
        click('OK');
      } else {
        const choices = screen.queryByRole('group', { name: 'Svar' });
        if (choices) fireEvent.click(choices.querySelector('button')!);
      }
    }
    expect(screen.getByRole('heading', { name: 'Sessionen er gennemført' })).toBeTruthy();
    expect([...phases].filter(Boolean)).toEqual(['Opvarmning', 'Lynrunde', 'Niveau']);
    const saved = JSON.parse(localStorage.getItem(HE_STORAGE_KEY)!) as HeSaved;
    expect(saved.sessions).toHaveLength(1);
    expect(saved.streak.current).toBe(1);
    expect(Object.keys(saved.items)).toHaveLength(3);
    expect(saved.answers!.some((a) => a.phase === 'lightning' && a.exercise === 'honors')).toBe(true);
    expect(saved.answers!.some((a) => a.phase === 'level')).toBe(true);
    expect(Object.keys(localStorage).sort()).toEqual([...Object.keys(others), HE_STORAGE_KEY].sort());
    for (const [key, value] of Object.entries(others)) expect(localStorage.getItem(key)).toBe(value);
    click('Til Håndevalueringens forside');
    expect(screen.getByText(/Dagens session er gennemført/)).toBeTruthy();
  }, 30_000);
});
