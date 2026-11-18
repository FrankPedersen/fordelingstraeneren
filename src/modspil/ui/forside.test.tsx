// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { execFileSync } from 'node:child_process';
import { transformWithOxc } from 'vite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../app/App';
import { GROUPS, TRACK_CARDS, TRACK_ITEMS } from '../../app/tracks';
import { setLang } from '../../i18n';
import { ROOT } from '../../sprog/danskTekst';

/*
 * Accepttest 1 i SPEC-modspil.md, trin 2: forsiden viser gruppen Modspil med ét menupunkt og ⓘ på begge sprog, og de
 * andre grupper er uændrede. Testen dækker også ruten (Afgrænsning: skærmen indlæses dovent som Pointregnskab) og det
 * nye afsnit i vejledningen.
 *
 * Grænsefladen, byggeriet skal give:
 * - `src/app/tracks.ts`: gruppen `{ id: 'defense', title: { da: 'Modspil', en: 'Defence' }, help: { da, en } }` står i
 *   GROUPS lige efter `play` (Spilføring). Ét menupunkt i TRACK_ITEMS og ét kort i TRACK_CARDS med `group: 'defense'`,
 *   `track: 'modspil'` og `screen: 'modspil'`; kortets titel er "Modspil" / "Defence". Alt andet i filen er som i
 *   tagget `v43-foer-modspil-skaerme`.
 * - `src/app/App.tsx`: skærmen `modspil` (adressen `#modspil`) henter `src/modspil/ui/ModspilScreen.tsx` dovent.
 * - `ModspilScreen` (standardeksport, `{ onBack(): void; start?: boolean }`): overskriften "Modspil" (h1), knapperne
 *   "Start dagens session", "Indstillinger" og "Tilbage til forsiden". Et kig skriver intet i lagringen.
 * - Vejledningen har et afsnit (`<details>`) med titlen "Modspil" / "Defence". De eksisterende afsnit ændres ikke:
 *   `git diff` fra tagget har kun nye linjer i `src/app/screens/GuideScreen.tsx`.
 */

const TAG = 'v43-foer-modspil-skaerme';
const git = (...args: string[]): string => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
function harTag(): boolean {
  try {
    git('rev-parse', '--verify', '--quiet', `refs/tags/${TAG}^{commit}`);
    return true;
  } catch {
    return false;
  }
}

/** tracks.ts, som den var i tagget: filen har ingen import, så den kan køres, når typerne er fjernet. */
async function tracksFoer() {
  const { code } = await transformWithOxc(git('show', `${TAG}:src/app/tracks.ts`), 'tracks.ts', { lang: 'ts' });
  return new Function(`${code.replace(/^export /gm, '')}\nreturn { GROUPS, TRACK_ITEMS, TRACK_CARDS };`)() as {
    GROUPS: typeof GROUPS;
    TRACK_ITEMS: typeof TRACK_ITEMS;
    TRACK_CARDS: typeof TRACK_CARDS;
  };
}

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const gruppeTitler = () => [...document.querySelectorAll('section.home-group > .with-info > h2')].map((h) => h.textContent);
const modspilGruppe = () => document.querySelector<HTMLElement>('section.home-group[aria-labelledby="group-defense"]');

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  window.scrollTo = vi.fn();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Forsiden viser gruppen Modspil (accepttest 1, trin 2)', () => {
  it('tracks.ts: gruppen defense efter Spilføring med ⓘ-tekst på begge sprog, ét menupunkt og ét kort', () => {
    expect(GROUPS.map((g) => g.id)).toEqual(['counting', 'play', 'defense', 'evaluation']);
    const gruppe = GROUPS.find((g) => g.id === ('defense' as never))!;
    expect(gruppe.title).toEqual({ da: 'Modspil', en: 'Defence' });
    expect(gruppe.help.da.length).toBeGreaterThan(40);
    expect(gruppe.help.en.length).toBeGreaterThan(40);
    expect(gruppe.help.en).not.toMatch(/[æøåÆØÅ]/);
    const punkter = TRACK_ITEMS.filter((i) => i.group === ('defense' as never));
    expect(punkter.map((i) => [i.track, i.screen])).toEqual([['modspil', 'modspil']]);
    const kort = TRACK_CARDS.filter((c) => c.group === ('defense' as never));
    expect(kort.map((c) => [c.track, c.screen, c.title.da, c.title.en])).toEqual([['modspil', 'modspil', 'Modspil', 'Defence']]);
    for (const tekst of [punkter[0].help, kort[0].help, kort[0].description]) {
      expect(tekst.da.length).toBeGreaterThan(10);
      expect(tekst.en.length).toBeGreaterThan(10);
      expect(tekst.en).not.toMatch(/[æøåÆØÅ]/);
    }
  });

  it('de andre grupper, menupunkter og kort er som i tagget', async (ctx) => {
    if (!harTag()) ctx.skip(`Tagget ${TAG} findes ikke her (fx i GitHub Actions), så sammenligningen kører kun lokalt.`);
    const foer = await tracksFoer();
    expect(GROUPS.filter((g) => g.id !== ('defense' as never))).toEqual(foer.GROUPS);
    expect(TRACK_ITEMS.filter((i) => i.group !== ('defense' as never))).toEqual(foer.TRACK_ITEMS);
    expect(TRACK_CARDS.filter((c) => c.group !== ('defense' as never))).toEqual(foer.TRACK_CARDS);
  });

  it('forsiden: Modspil står mellem Spilføring og Vurdering med ét menupunkt og ⓘ til gruppen og kortet på dansk og engelsk', () => {
    render(<App />);
    expect(gruppeTitler()).toEqual(['Optælling', 'Spilføring', 'Modspil', 'Vurdering']);
    const gruppe = modspilGruppe()!;
    expect(gruppe).toBeTruthy();
    const kort = gruppe.querySelectorAll('button.track-card');
    expect(kort).toHaveLength(1);
    expect(kort[0].getAttribute('aria-label')).toBe('Modspil');
    const hjaelp = within(gruppe).getAllByRole('button', { name: /^Hjælp: / });
    expect(hjaelp).toHaveLength(2);
    const [gruppensInfo, kortetsInfo] = hjaelp;
    fireEvent.click(gruppensInfo);
    expect(within(gruppe).getByText(GROUPS.find((g) => g.id === ('defense' as never))!.help.da)).toBeTruthy();
    fireEvent.click(kortetsInfo);
    expect(within(gruppe).getByText(TRACK_CARDS.find((c) => c.track === 'modspil')!.help.da)).toBeTruthy();

    click('Skift sprog til engelsk');
    expect(gruppeTitler()).toEqual(['Counting', 'Declarer play', 'Defence', 'Hand evaluation']);
    const engelsk = modspilGruppe()!;
    expect(engelsk.querySelector('button.track-card')?.getAttribute('aria-label')).toBe('Defence');
    const help = within(engelsk).getAllByRole('button', { name: /^Help: / });
    expect(help).toHaveLength(2);
    if (help[0].getAttribute('aria-expanded') !== 'true') fireEvent.click(help[0]);
    expect(within(engelsk).getByText(GROUPS.find((g) => g.id === ('defense' as never))!.help.en)).toBeTruthy();
  });

  it('menupunktet åbner Modspil (#modspil, indlæst dovent) og går tilbage til forsiden; et kig skriver intet', async () => {
    render(<App />);
    const foer = JSON.stringify(Object.keys(localStorage).sort());
    fireEvent.click(modspilGruppe()!.querySelector('button.track-card')!);
    expect(await screen.findByRole('heading', { name: 'Modspil', level: 1 }, { timeout: 10_000 })).toBeTruthy();
    expect(window.location.hash).toBe('#modspil');
    expect(screen.getByRole('button', { name: 'Start dagens session' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Indstillinger' })).toBeTruthy();
    click('Tilbage til forsiden');
    expect(gruppeTitler()).toContain('Modspil');
    expect(localStorage.getItem('modspil:v1')).toBeNull();
    expect(JSON.stringify(Object.keys(localStorage).sort())).toBe(foer);
  }, 30_000);

  it('adressen #modspil åbner sporet direkte', async () => {
    window.history.replaceState(null, '', '/#modspil');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Modspil', level: 1 }, { timeout: 10_000 })).toBeTruthy();
  }, 30_000);

  it('vejledningen har et afsnit om Modspil på dansk og engelsk', () => {
    render(<App />);
    click('Læs vejledningen');
    const titler = () => [...document.querySelectorAll('details > summary')].map((s) => s.textContent?.trim());
    expect(titler()).toContain('Modspil');
    const afsnit = [...document.querySelectorAll('details')].find((d) => d.querySelector('summary')?.textContent?.trim() === 'Modspil')!;
    expect((afsnit.textContent ?? '').length).toBeGreaterThan(200);
    cleanup();
    setLang('en');
    render(<App />);
    click('Read the guide');
    expect(titler()).toContain('Defence');
  });

  it('vejledningens eksisterende afsnit er uændrede: GuideScreen.tsx har kun nye linjer siden tagget', (ctx) => {
    if (!harTag()) ctx.skip(`Tagget ${TAG} findes ikke her (fx i GitHub Actions), så sammenligningen kører kun lokalt.`);
    const diff = git('diff', '--unified=0', TAG, '--', 'src/app/screens/GuideScreen.tsx');
    expect(diff, 'GuideScreen.tsx er ikke ændret endnu').not.toBe('');
    const fjernet = diff.split('\n').filter((l) => l.startsWith('-') && !l.startsWith('---'));
    expect(fjernet).toEqual([]);
  });
});
