// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { formatDecimal } from './engine/format';
import { mulberry32 } from './engine/rng';
import { setLang } from './i18n';
import { linesForGoal } from './farvebehandling/analysis';
import { bankItem, TEST_BANK } from './farvebehandling/testBank';
import { grade, makeTask } from './farvebehandling/training/tasks';
import { Analysevindue } from './farvebehandling/ui/Analysevindue';
import { Facit } from './farvebehandling/ui/Facit';
import { Linjekort } from './farvebehandling/ui/Linjekort';
import { SpilSelv } from './farvebehandling/ui/SpilSelv';
import { TEXT } from './farvebehandling/ui/texts';

// Accepttest for Del 3 i SPEC-design-som-forsiden.md: én ⓘ pr. kort. Linjekortenes placering og tab-rækkefølgen ses i en
// rigtig browser i scripts/tjek-bred-layout.mjs.
afterEach(() => {
  cleanup();
  setLang('da');
});

const hjælp = (rod: ParentNode) => [...rod.querySelectorAll('.info-btn')].map((b) => b.getAttribute('aria-label'));
const titler = (rod: ParentNode) => [...rod.querySelectorAll('.info-item strong')].map((s) => s.textContent);

describe('Én ⓘ pr. kort i Analyse', () => {
  const FEM = ['Hjælp: Vælg kombination', 'Hjælp: Problemet', 'Hjælp: Linjerne', 'Hjælp: Forskellen', `Hjælp: ${'Alle sidninger'}`];

  it('har præcis 5 ⓘ, også med situationen åben og i kortvælgeren', () => {
    const { container } = render(<Analysevindue bank={TEST_BANK} />);
    const fem = FEM.map((f) => (f === 'Hjælp: Alle sidninger' ? `Hjælp: ${TEXT.details}` : f));
    expect(hjælp(container)).toEqual(fem);
    fireEvent.click(screen.getByRole('button', { name: 'Angiv situationen' }));
    expect(container.querySelector('.fb-situation-field')).toBeTruthy();
    expect(hjælp(container)).toEqual(fem);
    fireEvent.click(screen.getByRole('button', { name: 'Kortvælger' }));
    expect(container.querySelector('.fb-import')).toBeTruthy();
    expect(hjælp(container)).toEqual(fem);
  }, 30_000);

  it('har ingen ⓘ ved Guide, ved Mål, i Situationen, i linjekortene, i tabellen eller i Resultatet', () => {
    const { container } = render(<Analysevindue bank={TEST_BANK} />);
    for (const sted of ['.fb-guide-bar', '.fb-goals', '[aria-labelledby="fb-situation"]', '.fb-line', '.fb-layout-table', '.fb-result']) {
      expect(container.querySelector(sted), sted).toBeTruthy();
      expect(container.querySelector(`${sted} .info-btn`), sted).toBeNull();
    }
  }, 30_000);

  it('Spil den selv står efter Situationen i HTML, så tab-rækkefølgen følger det, man ser', () => {
    const { container } = render(<Analysevindue bank={TEST_BANK} />);
    const situation = container.querySelector('[aria-labelledby="fb-situation"]')!;
    const knap = screen.getByRole('button', { name: 'Spil den selv ▶' });
    expect(situation.nextElementSibling).toBe(knap);
    expect(container.querySelector('[aria-labelledby="fb-problem"]')!.contains(knap)).toBe(false);
  }, 30_000);

  it('linjekortene har en klasse efter antallet af linjer', () => {
    const { container } = render(<Analysevindue bank={TEST_BANK} />);
    const antal = container.querySelectorAll('.fb-lines:not(.fb-own-lines) > .fb-line').length;
    expect(container.querySelector('.fb-lines:not(.fb-own-lines)')?.classList.contains(`fb-lines-${Math.min(antal, 5)}`)).toBe(true);
  }, 30_000);
});

describe('De samlede ⓘ', () => {
  it('Problemet har mål, situationen, felterne, forbindelser og Inde, hver med fed overskrift', () => {
    render(<Analysevindue bank={TEST_BANK} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hjælp: Problemet' }));
    expect(titler(screen.getByRole('note'))).toEqual(['Mål', 'Situationen', 'Kendte kort i andre farver', 'Maks. hp i farven', 'Forbindelser', 'Inde']);
  }, 30_000);

  it('Linjerne har linjerne, alle udspil, Sammenlign, dine linjer, snittet og resultatet', () => {
    render(<Analysevindue bank={TEST_BANK} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hjælp: Linjerne' }));
    expect(titler(screen.getByRole('note'))).toEqual(['Linjerne', 'Vis alle udspil', 'Sammenlign', 'Dine linjer', 'Flest stik i snit', 'Resultatet']);
  }, 30_000);

  it('intet indhold går tabt: hvert emne fra de gamle ⓘ står i den samlede', () => {
    const tekst = (liste: readonly { title: string; text: string }[]) => liste.map((t) => `${t.title} ${t.text}`).join(' ');
    const EMNER: [readonly { title: string; text: string }[], string[]][] = [
      [TEXT.help.chooseList, ['hyppigste først', 'honnørpoint', 'Jethalal M. Shah', 'regnet i appen', 'bygger du selv', 'Ét tryk'.toLowerCase(), 'tre tryk', 'løseren regne', 'bordet-hånden', 'LIN-tekst', 'handviewer', '8 kombinationer', 'første hånd bliver bordet', 'henter intet', 'situationen sætter du selv']],
      [TEXT.help.problemList, ['antal stik', 'sikkerhedsspil', 'meldingerne', 'betingede', 'udelukker', 'a priori', 'stoppe den', '13 minus', 'manglende kort', 'E 4, K 3, D 2, B 1', 'grænserne', 'grået ud', 'umulig', 'Sikre indgange', 'gratis', 'bruger en indgang', 'ingen hånd inde', 'Ubegrænset', 'første stik', 'vindende kort', 'begrænsede indgange']],
      [TEXT.help.linesList, ['nummererede trin', 'Bedste linje', '0,5 procentpoint', 'optimalt modspil', 'ubegrænsede forbindelser', 'Alle første udspil', '0 %', 'bedste fortsættelse', 'præcis to linjer', 'afgør', 'vinder alene', 'viste linjer', 'trin for trin', 'ved siden af løserens', 'Efter sidste trin', 'vægtet efter chance', 'parturnering', 'Bedste chance for målet', 'hvor tit']],
      [TEXT.help.layoutsList, ['modpartens kort', 'chance og resultat', 'Vests antal kort', 'honnørernes placering', 'forskelligt resultat', 'små kort', 'parentes', 'for hver af dem']],
      [TEXT.help.playList, ['3. håndens kort', 'normalt modspil', 'lyser fordelingen op', 'bedste linjer', 'vægtet efter chance', 'gratis', 'tælles ned', 'ingen hånd inde', 'grået ud']],
    ];
    for (const [liste, ord] of EMNER) for (const o of ord) expect(tekst(liste).toLowerCase(), o).toContain(o.toLowerCase());
  });

  it('har den samme liste på engelsk, og hvert emne er højst to sætninger', () => {
    const lister = () => [TEXT.help.chooseList, TEXT.help.problemList, TEXT.help.linesList, TEXT.help.layoutsList, TEXT.help.playList];
    const sætninger = (t: string) => t.replace('M. Shah', 'Shah').split(/[.!?](?:\s+|$)/).filter(Boolean).length;
    const dansk = lister().map((l) => l.map((t) => t.id));
    for (const liste of lister()) for (const t of liste) expect(sætninger(t.text), t.text).toBeLessThanOrEqual(2);
    setLang('en');
    expect(lister().map((l) => l.map((t) => t.id))).toEqual(dansk);
    for (const liste of lister()) for (const t of liste) expect(sætninger(t.text), t.text).toBeLessThanOrEqual(2);
  });
});

describe('Linjekortet', () => {
  const item = bankItem('432-K765');
  const line = linesForGoal(item, item.combination.goals[0])[0];

  it('siger "Flest stik i snit" uden ⓘ og uden "stik" til sidst', () => {
    const { container } = render(<Linjekort line={line} />);
    expect(screen.getByText(`Flest stik i snit: ${formatDecimal(line.average!, 2)}`)).toBeTruthy();
    expect(container.querySelector('.info-btn')).toBeNull();
    expect(container.textContent).not.toContain('gennemsnit');
  });

  it('siger "Avg. tricks" på engelsk', () => {
    setLang('en');
    render(<Linjekort line={line} />);
    expect(screen.getByText(`Avg. tricks: ${formatDecimal(line.average!, 2)}`)).toBeTruthy();
  });
});

describe('Facit og Spil den selv følger samme regel', () => {
  const item = bankItem('432-K765');
  const goal = item.combination.goals[0];

  it('Facit har ingen ⓘ i linjekortene, og Linjerne samler linjerne, snittet og resultatet', () => {
    const task = makeTask('chancen', item, goal, mulberry32(1));
    const svar = { guess: 0 };
    const { container } = render(<Facit task={task} answer={svar} graded={grade(task, { ...svar, ms: 1 }, 20_000)} place={null} onNext={() => {}} />);
    expect(container.querySelector('.fb-line .info-btn')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Hjælp: Linjerne' }));
    expect(titler(screen.getByRole('note'))).toEqual(['Linjerne', 'Flest stik i snit', 'Resultatet']);
  });

  it('Hvorfor har ingen ⓘ i Resultatet og tabellen, men én ved Alle sidninger', () => {
    const task = makeTask('chancen', item, goal, mulberry32(1));
    const svar = { guess: 0 };
    const { container } = render(<Facit task={task} answer={svar} graded={grade(task, { ...svar, ms: 1 }, 20_000)} place={null} onNext={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hvorfor →' }));
    expect(container.querySelector('.fb-result .info-btn')).toBeNull();
    expect(container.querySelector('.fb-layout-table .info-btn')).toBeNull();
    const kort = screen.getByRole('heading', { name: 'Alle sidninger' }).closest('section')!;
    fireEvent.click(within(kort as HTMLElement).getByRole('button', { name: /^Hjælp: / }));
    expect(titler(kort)).toEqual(['Sidningerne', 'afgør', 'Chance']);
  });

  it('Spil den selv har én ⓘ, og forbindelserne står kun i den, når de er begrænsede', () => {
    const { container } = render(<SpilSelv item={item} goal={goal} seed={1} split={false} />);
    expect(hjælp(container)).toEqual(['Hjælp: Spil den selv']);
    fireEvent.click(screen.getByRole('button', { name: 'Hjælp: Spil den selv' }));
    expect(titler(container)).toEqual(['Spil den selv', 'Flest stik i snit']);
    cleanup();
    const med = render(<SpilSelv item={item} goal={goal} seed={1} split={false} connections={{ entries: { north: 1, south: 1 }, lead: 'S' }} />);
    expect(hjælp(med.container)).toEqual(['Hjælp: Spil den selv']);
    fireEvent.click(screen.getByRole('button', { name: 'Hjælp: Spil den selv' }));
    expect(titler(med.container)).toEqual(['Spil den selv', 'Flest stik i snit', 'Forbindelser i spillet']);
  });
});
