// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../app/App';
import { setLang } from '../../i18n';
import { PR_STORAGE_KEY, type PrSaved } from '../storage';
import PointregnskabScreen from './PointregnskabScreen';

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

describe('Pointregnskab i appen', () => {
  it('åbnes fra forsidens menupunkt med ⓘ og går tilbage igen', async () => {
    render(<App />);
    expect(button('Hjælp: Pointregnskab')).toBeTruthy();
    click('Pointregnskab');
    expect(await screen.findByRole('heading', { name: 'Pointregnskab', level: 1 }, { timeout: 10_000 })).toBeTruthy();
    expect(button('Start dagens session')).toBeTruthy();
    click('Tilbage til forsiden');
    expect(button('Start dagens session')).toBeTruthy();
    expect(button('Pointregnskab')).toBeTruthy();
    // Et kig skriver intet.
    expect(localStorage.getItem(PR_STORAGE_KEY)).toBeNull();
  }, 30_000);

  it('en hel session: opvarmning, regnestykket, niveau og status; kun pointregnskab:v1 skrives', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 6, 12));
    localStorage.setItem('fordelingstraener:v1', '{"urørt":true}');
    render(<PointregnskabScreen onBack={() => {}} />);
    click('Start dagens session');
    const phases = new Set<string>();
    for (let i = 0; i < 300 && !screen.queryByRole('heading', { name: 'Sessionen er gennemført' }); i++) {
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
    expect([...phases].filter(Boolean)).toEqual(['Opvarmning', 'Regnestykket', 'Niveau']);
    const saved = JSON.parse(localStorage.getItem(PR_STORAGE_KEY)!) as PrSaved;
    expect(saved.sessions).toHaveLength(1);
    expect(saved.streak.current).toBe(1);
    expect(Object.keys(saved.items)).toHaveLength(3);
    expect(saved.answers?.length).toBeGreaterThan(3);
    expect(Object.keys(localStorage).sort()).toEqual(['fordelingstraener:v1', PR_STORAGE_KEY]);
    expect(localStorage.getItem('fordelingstraener:v1')).toBe('{"urørt":true}');
    click('Til Pointregnskabs forside');
    expect(screen.getByText(/Dagens session er gennemført/)).toBeTruthy();
  }, 30_000);
});
