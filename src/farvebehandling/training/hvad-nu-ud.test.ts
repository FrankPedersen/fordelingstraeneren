import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { mulberry32 } from '../../engine/rng';
import { defaultFbSaved, type TaskType } from '../storage';
import { TEST_BANK as bank } from '../testBank';
import { chooseType } from './session';
import { taskStats } from './stats';
import { possibleTypes } from './tasks';

// SPEC-hvad-nu-ud.md: Hvad nu? er taget ud af Træning og Selvvalgt (Franks valg 25. november 2026).
describe('Hvad nu? er taget ud (SPEC-hvad-nu-ud.md)', () => {
  it('motoren vælger aldrig Hvad nu?, heller ikke hvor typen er mulig', () => {
    let cases = 0;
    const histories: TaskType[][] = [[], ['vælg-linjen', 'vælg-linjen'], ['chancen']];
    for (const item of bank) {
      for (const goal of item.combination.goals) {
        if (!possibleTypes(item, goal).includes('hvad-nu')) continue;
        cases++;
        for (let seed = 1; seed <= 50; seed++) {
          for (const history of histories) {
            expect(chooseType(item, goal, history, mulberry32(seed))).not.toBe('hvad-nu');
          }
        }
      }
    }
    expect(cases).toBeGreaterThan(0);
    // Løkken over hele banken er tung; tidsgrænsen er 30 s som husets andre tunge tests.
  }, 30_000);

  it('Træning og Selvvalgt vælger typen med chooseType uden en liste, der kan give Hvad nu?', () => {
    const session = readFileSync(new URL('./session.ts', import.meta.url), 'utf8');
    const selvvalgt = readFileSync(new URL('../ui/Selvvalgt.tsx', import.meta.url), 'utf8');
    expect(session).not.toMatch(/'hvad-nu'/);
    expect(selvvalgt).toMatch(/chooseType\(item, goal, history, rng\)/);
  });

  it('gamle Hvad nu?-svar læses og tæller i statistikken som før', () => {
    const saved = {
      ...defaultFbSaved(),
      practice: [{ day: '2026-11-20', item: 'J32-AK54:3', task: 'hvad-nu' as const, score: 0.5 as const, ms: 1000 }],
    };
    expect(taskStats(saved, '2026-11-25').find((r) => r.key === 'hvad-nu')!.all).toEqual({ answers: 1, score: 0.5 });
  });

  it('vejledningerne nævner ikke Hvad nu? som opgavetype', () => {
    const guide = readFileSync(new URL('../../app/screens/GuideScreen.tsx', import.meta.url), 'utf8');
    const types = guide.split('\n').find((l) => l.includes('Opgavetyperne:'))!;
    expect(types).not.toMatch(/Hvad nu\?|What now\?/);
    for (const f of ['guide-analyse.md', 'guide-analyse.en.md']) {
      const md = readFileSync(new URL(`../content/${f}`, import.meta.url), 'utf8');
      expect(md, f).not.toMatch(/^#+ .*(Hvad nu\?|What now\?)/m);
    }
  });
});
