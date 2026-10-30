// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setLang } from '../../i18n';
import { bankItem } from '../testBank';
import { Bridgebord } from './Bridgebord';
import { SpilSelv } from './SpilSelv';

// SPEC-forside-bred.md, del 3: Spil den selv bruger Bridgebord som Analyse og facit (kompas i table, hænderne som "♠ D432").

// Vitest tømmer .css-filer ved import, så farvebehandling.css læses fra disken; stien regnes fra repoets rod.
const nodeFs = 'node:fs';
const fs = (await import(/* @vite-ignore */ nodeFs)) as { readFileSync(path: string, encoding: 'utf8'): string };
const cwd = (globalThis as unknown as { process: { cwd(): string } }).process.cwd();
const css = fs.readFileSync(`${cwd}/src/farvebehandling/ui/farvebehandling.css`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
/** Erklæringerne for en selektor (alle regler, hvor den står i listen). */
const decl = (selector: string) =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .filter(([, s]) => s.split(',').map((x) => x.trim()).includes(selector))
    .map(([, , d]) => d)
    .join(';');

// Nord 4 3 2, Syd K 7 6 5.
const ITEM = bankItem('432-K765');
const region = () => screen.getByRole('region', { name: /^(Spil den selv|Play it yourself)$/ });
const table = () => region().querySelector('figure.fb-table') as HTMLElement;
const cards = (owner: string) =>
  within(region())
    .getAllByRole('button')
    .filter((b) => b.getAttribute('aria-label')?.startsWith(`${owner}: `)) as HTMLButtonElement[];
const card = (owner: string, rank: string) => within(region()).getByRole('button', { name: `${owner}: ${rank}` }) as HTMLButtonElement;
const atSeat = (seat: string) => table().querySelector(`.fb-compass [data-seat="${seat}"] .fb-compass-card`)?.textContent ?? null;

afterEach(() => {
  cleanup();
  setLang('da');
});

describe('Bordet i Spil den selv (SPEC-forside-bred.md, del 3)', () => {
  it('bruger Bridgebord: Nord · bordet øverst, Syd · dig nederst, Vest og Øst ved siderne og kompasset i midten', () => {
    render(<SpilSelv item={ITEM} goal={2} seed={1} onClose={() => {}} />);
    const t = table();
    expect(t).toBeTruthy();
    expect(t.querySelector('.fb-seat-north .fb-seat-name')?.textContent).toBe('Nord · bordet');
    expect(t.querySelector('.fb-seat-south .fb-seat-name')?.textContent).toBe('Syd · dig');
    // Hænderne som i systemnotatet: farvetegnet og kortene uden kortfelter.
    expect(t.querySelector('.fb-seat-north .fb-hand')?.textContent).toBe('♠432');
    expect(t.querySelector('.fb-seat-south .fb-hand')?.textContent).toBe('♠K765');
    expect(card('din hånd', 'K').classList.contains('fb-honor')).toBe(true);
    expect(card('din hånd', '7').classList.contains('fb-honor')).toBe(false);
    for (const seat of ['west', 'east']) expect(t.querySelector(`.fb-seat-${seat} .fb-hidden-hand`)?.textContent).toMatch(/^♠ \? \(\d+ kort\)$/);
    // Før første udspil står de manglende kort i kompasset som i Analyse.
    expect(t.querySelector('.fb-compass .fb-compass-missing')?.textContent).toBe('E D B 10 9 8 mangler');
    expect(t.querySelector('.fb-compass')?.getAttribute('aria-live')).toBe('polite');
    // Spil den selvs gamle bord findes ikke længere.
    expect(region().querySelector('.fb-play-card, .fb-play-trick, .fb-play-hand, .fb-play-table')).toBeNull();
  });

  it('kortene i den hånd, der er i turen, kan vælges; de andre er deaktiverede', () => {
    render(<SpilSelv item={ITEM} goal={2} seed={1} onClose={() => {}} />);
    // Før udspillet kan begge hænder spille ud.
    expect([...cards('bordet'), ...cards('din hånd')].every((b) => !b.disabled)).toBe(true);
    fireEvent.click(card('bordet', '2'));
    // 3. hånd er hånden.
    expect(cards('bordet').every((b) => b.disabled)).toBe(true);
    expect(cards('din hånd').every((b) => !b.disabled)).toBe(true);
    for (const b of [...cards('bordet'), ...cards('din hånd')]) expect(b.classList.contains('fb-hand-card')).toBe(true);
  });

  it('stikkets kort står i kompasset ved den rigtige side, og det seneste stik står, til næste udspil', () => {
    render(<SpilSelv item={ITEM} goal={2} seed={1} onClose={() => {}} />);
    expect(atSeat('N')).toBeNull();
    fireEvent.click(card('bordet', '2'));
    // Udspillet fra Nord og Øst som 2. hånd; de manglende kort står ikke længere i midten.
    expect(atSeat('N')).toBe('2');
    expect(atSeat('Ø')).toMatch(/^(E|D|B|10|9|8)$/);
    expect(atSeat('S')).toBeNull();
    expect(table().querySelector('.fb-compass-missing')).toBeNull();
    fireEvent.click(card('din hånd', '5'));
    // Hele stikket står, til næste udspil.
    expect(atSeat('S')).toBe('5');
    expect(atSeat('V')).toMatch(/^(E|D|B|10|9|8)$/);
    expect(atSeat('N')).toBe('2');
    const next = [...cards('bordet'), ...cards('din hånd')].find((b) => !b.disabled)!;
    fireEvent.click(next);
    const leader = next.getAttribute('aria-label')!.startsWith('bordet') ? 'N' : 'S';
    expect(atSeat(leader)).toBe(next.textContent);
    expect(atSeat(leader === 'N' ? 'S' : 'N')).toBeNull();
  });

  it('på engelsk står der ingen dansk ved bordet', () => {
    setLang('en');
    render(<SpilSelv item={ITEM} goal={2} seed={1} onClose={() => {}} />);
    const text = table().textContent ?? '';
    expect(text).toMatch(/North · dummy/);
    expect(text).toMatch(/\? \(\d+ cards\)/);
    expect(text).not.toMatch(/[æøåÆØÅ]|\b(kort|mangler|bordet|Nord|Syd|Vest)\b/);
  });

  it('kortene har en trykflade på mindst 44 px uden synlig kant, og hånden i turen har accent-soft og kant i accent', () => {
    const base = decl('.fb-hand-card');
    expect(base).toMatch(/min-width:\s*var\(--touch-min\)/);
    expect(base).toMatch(/min-height:\s*var\(--touch-min\)/);
    expect(base).toMatch(/border:\s*1px solid transparent/);
    expect(base).toMatch(/background:\s*transparent/);
    const turn = decl('.fb-hand-card:not(:disabled)');
    expect(turn).toMatch(/background:\s*var\(--accent-soft\)/);
    expect(turn).toMatch(/border-color:\s*var\(--accent\)/);
    // Ingen andre farver i bordets kort end accent og accent-soft (og arvet tekstfarve).
    for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      if (!sel.includes('fb-hand-card')) continue;
      for (const [, name] of body.matchAll(/var\(--([\w-]+)\)/g)) {
        expect(['touch-min', 'space-4', 'radius-8', 'accent', 'accent-soft'], `${sel.trim()}: ${name}`).toContain(name);
      }
    }
  });
});

describe('Bridgebord uden spil er uændret (SPEC-forside-bred.md, del 3)', () => {
  // Markuppen fra v25-foer-forside-bred, før Bridgebord fik de valgfrie felter til Spil den selv.
  const BEFORE = ["<figure class=\"fb-table\" aria-label=\"Problemet\"><div class=\"fb-seat fb-seat-north\"><span class=\"fb-seat-name\">Nord · bordet</span><span class=\"fb-hand\"><span aria-hidden=\"true\"><span class=\"fb-suit\">♠</span><span class=\"fb-honor\">B</span><span>4</span><span>3</span><span>2</span></span><span class=\"fb-sr\">B 4 3 2</span></span></div><div class=\"fb-seat fb-seat-west\"><span class=\"fb-seat-name\">Vest</span><span class=\"fb-hidden-hand\">♠ ?</span></div><div class=\"fb-compass\"><span class=\"fb-compass-row\" aria-hidden=\"true\">N</span><span class=\"fb-compass-row fb-compass-middle\"><span aria-hidden=\"true\">V</span><span class=\"fb-compass-missing\">K D 9 8 7 mangler</span><span aria-hidden=\"true\">Ø</span></span><span class=\"fb-compass-row\" aria-hidden=\"true\">S</span></div><div class=\"fb-seat fb-seat-east\"><span class=\"fb-seat-name\">Øst</span><span class=\"fb-hidden-hand\">♠ ?</span></div><div class=\"fb-seat fb-seat-south\"><span class=\"fb-hand\"><span aria-hidden=\"true\"><span class=\"fb-suit\">♠</span><span class=\"fb-honor\">E</span><span class=\"fb-honor\">10</span><span>6</span><span>5</span></span><span class=\"fb-sr\">E 10 6 5</span></span><span class=\"fb-seat-name\">Syd · dig</span></div></figure>", "<figure class=\"fb-table\" aria-label=\"Første udspil: lille fra bordet\"><div class=\"fb-seat fb-seat-north\"><span class=\"fb-seat-name\">Nord · bordet</span><span class=\"fb-hand\"><span aria-hidden=\"true\"><span class=\"fb-suit\">♠</span><span>4</span><span>3</span><span>2</span></span><span class=\"fb-sr\">4 3 2</span></span></div><div class=\"fb-seat fb-seat-west\"><span class=\"fb-seat-name\">Vest</span><span class=\"fb-hidden-hand\">♠ D 9</span></div><div class=\"fb-compass\"><span class=\"fb-compass-row\" aria-hidden=\"true\">N</span><span class=\"fb-compass-row fb-compass-middle\"><span aria-hidden=\"true\">V</span><span class=\"fb-compass-missing\">E D B 10 9 8 mangler</span><span aria-hidden=\"true\">Ø</span></span><span class=\"fb-compass-row\" aria-hidden=\"true\">S</span></div><div class=\"fb-seat fb-seat-east\"><span class=\"fb-seat-name\">Øst</span><span class=\"fb-hidden-hand\">♠ E B 10 8</span></div><div class=\"fb-seat fb-seat-south\"><span class=\"fb-hand\"><span aria-hidden=\"true\"><span class=\"fb-suit\">♠</span><span class=\"fb-honor\">K</span><span>7</span><span>6</span><span>5</span></span><span class=\"fb-sr\">K 7 6 5</span></span><span class=\"fb-seat-name\">Syd · dig</span></div><figcaption class=\"fb-note\"><span aria-hidden=\"true\">↓ </span>Første udspil: lille fra bordet</figcaption></figure>"];

  it('Analyse, facit og opgaverne får præcis samme markup som før', () => {
    const a = render(<Bridgebord north={[11, 4, 3, 2]} south={[14, 10, 6, 5]} />).container.innerHTML;
    cleanup();
    const b = render(
      <Bridgebord north={[4, 3, 2]} south={[13, 7, 6, 5]} west="D 9" east="E B 10 8" arrow="ned" caption="Første udspil: lille fra bordet" />,
    ).container.innerHTML;
    expect([a, b]).toEqual(BEFORE);
  });
});
