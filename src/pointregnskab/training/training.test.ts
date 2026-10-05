import { describe, expect, it } from 'vitest';
import { SYSTEM } from '../../system/interpreter';
import { makeTask, type PlacementTask, type RunningTask } from '../model/generator';
import { otherDefender } from '../model/points';
import { defaultPrSaved, type PrSaved } from '../storage';
import { BLOCKS, DECK_ORDER, deckCorrect, deckTask, NEW_PER_SESSION, RANGE_CARDS, reviewCard, warmupQueue } from './deck';
import { mulberry32 } from '../../engine/rng';
import { nextLevel } from './progression';
import { correctAnswer, grade, nextRunningMs, RUNNING_MS, timeLimit } from './scoring';
import { answerDeck, answerPrTask, isBossSession, nextPrStep, PR_PHASE_MS, startPrSession, type PrSession } from './session';

const running = (seed: number) => makeTask('running', 2, seed) as RunningTask;
const placement = (exercise: 'can' | 'who' | 'finesse', seed: number) => makeTask(exercise, 3, seed) as PlacementTask;

/** En opgave med facit "kan ikke afgøres" og en med en sikker placering. */
function byFacit(exercise: 'can' | 'who' | 'finesse', open: boolean): PlacementTask {
  for (let seed = 1; ; seed++) {
    const t = placement(exercise, seed);
    if ((t.placement === 'open') === open) return t;
  }
}

describe('Scoring', () => {
  it('rigtigt inden for tidsgrænsen 10 XP, over tidsgrænsen 5, forkert 0; ugens boss dobbelt', () => {
    const sum = makeTask('sum', 1, 1);
    expect(timeLimit('sum')).toBe(5_000);
    expect(timeLimit('who')).toBe(15_000);
    expect(grade(sum, { exercise: 'sum', points: sum.m }, 5_000)).toMatchObject({ result: 'right', xp: 10, inTime: true });
    expect(grade(sum, { exercise: 'sum', points: sum.m }, 5_001)).toMatchObject({ result: 'right', xp: 5, inTime: false });
    expect(grade(sum, { exercise: 'sum', points: sum.m + 1 }, 1_000)).toMatchObject({ result: 'wrong', xp: 0, score: 0 });
    expect(grade(sum, { exercise: 'sum', points: sum.m }, 1_000, true).xp).toBe(20);
    const who = placement('who', 1);
    expect(grade(who, { exercise: 'who', placement: who.placement }, 15_000).xp).toBe(10);
    expect(grade(who, { exercise: 'who', placement: who.placement }, 15_001).xp).toBe(5);
  });

  it('Løbende tælling: ét af to tal rigtigt giver halvt (5 XP)', () => {
    const t = running(3);
    expect(grade(t, { exercise: 'running', ...t.shown }, 1_000)).toMatchObject({ result: 'right', score: 1, xp: 10 });
    expect(grade(t, { exercise: 'running', W: t.shown.W, E: t.shown.E + 1 }, 1_000)).toMatchObject({ result: 'half', score: 0.5, xp: 5 });
    expect(grade(t, { exercise: 'running', W: t.shown.W + 1, E: t.shown.E }, 1_000)).toMatchObject({ result: 'half', score: 0.5 });
    expect(grade(t, { exercise: 'running', W: t.shown.W + 1, E: t.shown.E + 1 }, 1_000)).toMatchObject({ result: 'wrong', xp: 0 });
  });

  it('visningstiden bliver 10 % kortere efter rigtigt og 15 % længere efter forkert, inden for 800–4.000 ms', () => {
    expect(RUNNING_MS.start).toBe(2000);
    expect(nextRunningMs(2000, 'right')).toBe(1800);
    expect(nextRunningMs(2000, 'wrong')).toBe(2300);
    expect(nextRunningMs(2000, 'half')).toBe(2000);
    expect(nextRunningMs(850, 'right')).toBe(800);
    expect(nextRunningMs(3900, 'wrong')).toBe(4000);
    let ms: number = RUNNING_MS.start;
    for (let i = 0; i < 50; i++) ms = nextRunningMs(ms, 'right');
    expect(ms).toBe(800);
    for (let i = 0; i < 50; i++) ms = nextRunningMs(ms, 'wrong');
    expect(ms).toBe(4000);
  });

  it('overmod: en sikker placering, når facit er "kan ikke afgøres", er forkert og markeres', () => {
    const open = byFacit('who', true);
    for (const p of ['W', 'E'] as const) {
      expect(grade(open, { exercise: 'who', placement: p }, 1_000)).toMatchObject({ result: 'wrong', overconfident: true });
    }
    expect(grade(open, { exercise: 'who', placement: 'open' }, 1_000)).toMatchObject({ result: 'right', overconfident: false });
    const sure = byFacit('who', false);
    expect(grade(sure, { exercise: 'who', placement: 'open' }, 1_000)).toMatchObject({ result: 'wrong', overconfident: false });
    const can = byFacit('can', true);
    expect(correctAnswer(can)).toEqual({ exercise: 'can', yes: true });
    expect(grade(can, { exercise: 'can', yes: false }, 1_000)).toMatchObject({ result: 'wrong', overconfident: true });
    const finesse = byFacit('finesse', true);
    expect(grade(finesse, { exercise: 'finesse', placement: 'W' }, 1_000).overconfident).toBe(true);
  });

  it('Kan han have den?: nej kun, når honnøren sikkert sidder hos den anden', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const t = placement('can', seed);
      expect(correctAnswer(t)).toEqual({ exercise: 'can', yes: t.placement !== otherDefender(t.asked!) });
    }
  });
});

describe('Niveau', () => {
  const run = (level: 1 | 2 | 3 | 4 | 5, scores: number[]) =>
    scores.reduce((state, score) => nextLevel(state, score), { level, log: [] as number[] });

  it('over 90 % af de seneste 20 svar rykker et niveau op, under 80 % ét ned', () => {
    expect(run(2, [...Array(19).fill(1), 0]).level).toBe(3);
    expect(run(2, [...Array(18).fill(1), 0, 0]).level).toBe(2);
    expect(run(2, [...Array(15).fill(1), ...Array(5).fill(0)]).level).toBe(1);
    expect(run(2, [...Array(16).fill(1), ...Array(4).fill(0)]).level).toBe(2);
    expect(run(2, Array(19).fill(1)).level).toBe(2);
    // Efter et skift tælles forfra.
    const up = run(2, Array(20).fill(1));
    expect(up).toEqual({ level: 3, log: [] });
    expect(run(5, Array(20).fill(1)).level).toBe(5);
    expect(run(1, Array(20).fill(0)).level).toBe(1);
    expect(run(3, Array(20).fill(0.5)).level).toBe(2);
  });
});

describe('Leitner-bunken', () => {
  it('blokkene: E K = 7, E D = 6, K D = 5, E K D = 9, D B = 3', () => {
    const points = Object.fromEntries(BLOCKS.map((b) => [b.key, b.points]));
    expect(points).toMatchObject({ 'blok:EK': 7, 'blok:ED': 6, 'blok:KD': 5, 'blok:EKD': 9, 'blok:DB': 3, 'blok:EKDB': 10 });
    expect(BLOCKS).toHaveLength(11);
  });

  it('intervalkortene læser intervallerne fra systemfilen, og hver melding hører til præcis ét kort', () => {
    for (const rule of SYSTEM) {
      const cards = RANGE_CARDS.filter((c) => c.rules.includes(rule));
      expect(cards, `${rule.context} ${rule.call}`).toHaveLength(1);
    }
    for (const card of RANGE_CARDS.filter((c) => c.rules.length)) {
      for (const rule of card.rules) expect(JSON.stringify([rule.hcp].flat(2))).toBe(JSON.stringify(card.allowed.flat()));
    }
    const allowed = Object.fromEntries(RANGE_CARDS.map((c) => [c.id, c.allowed]));
    expect(allowed['opening-1NT']).toEqual([[15, 17]]);
    expect(allowed['two-suited']).toEqual([
      [8, 15],
      [17, 40],
    ]);
    expect(allowed['opening-pass']).toEqual([[0, 11]]);
    expect(allowed['responder-pass-after-1-suit']).toEqual([[0, 5]]);
    expect(allowed['responder-pass-after-1NT']).toEqual([[0, 7]]);
    expect(new Set(DECK_ORDER).size).toBe(BLOCKS.length + RANGE_CARDS.length);
  });

  it('intervalkortene har fire forskellige svarmuligheder med det rigtige', () => {
    const rng = mulberry32(5);
    for (const card of RANGE_CARDS) {
      const task = deckTask(card.key, rng);
      if (task.kind !== 'range') throw new Error();
      expect(new Set(task.options.map((o) => JSON.stringify(o))).size).toBe(4);
      expect(task.options).toContainEqual(card.allowed);
      expect(deckCorrect(task, { kind: 'range', allowed: card.allowed })).toBe(true);
    }
  });

  it('opvarmningen tager forfaldne kort først og højst tre nye pr. session', () => {
    const today = '2026-10-05';
    expect(warmupQueue({}, today)).toEqual(DECK_ORDER.slice(0, NEW_PER_SESSION));
    let items = reviewCard({}, 'blok:EK', true, 2_000, today, 0);
    items = reviewCard(items, 'blok:ED', false, 2_000, today, 0);
    expect(items['blok:EK'].box).toBe(2);
    expect(items['blok:ED'].box).toBe(1);
    expect(items['blok:ED'].due).toBe('2026-10-06');
    const tomorrow = warmupQueue(items, '2026-10-06');
    expect(tomorrow[0]).toBe('blok:ED');
    expect(tomorrow).not.toContain('blok:EK');
    expect(tomorrow.length).toBe(1 + NEW_PER_SESSION);
  });
});

describe('Sessionen', () => {
  const t0 = new Date(2026, 9, 5, 12).getTime();

  function play(saved: PrSaved, seed: number): { saved: PrSaved; session: PrSession; phases: string[] } {
    let session = startPrSession(saved, t0, seed);
    let now = t0;
    const phases: string[] = [];
    for (let i = 0; i < 200; i++) {
      ({ session, saved } = nextPrStep(session, saved, now));
      phases.push(session.phase);
      const step = session.step!;
      if (step.kind === 'status') break;
      now += 4_000;
      if (step.kind === 'deck') {
        const t = step.task;
        const answer = t.kind === 'block' ? { kind: 'block' as const, points: t.block.points } : { kind: 'range' as const, allowed: t.card.allowed };
        ({ session, saved } = answerDeck(session, saved, answer, now));
      } else {
        ({ session, saved } = answerPrTask(session, saved, correctAnswer(step.task), now));
      }
    }
    return { saved, session, phases };
  }

  it('opvarmning, regnestykket, niveau og status; status registrerer sessionen og streaken', () => {
    const { saved, session, phases } = play(defaultPrSaved(), 1);
    const order = [...new Set(phases)];
    expect(order).toEqual(['warmup', 'sum', 'level', 'status']);
    expect(session.levelTasks).toBeGreaterThanOrEqual(3);
    expect(session.levelTasks).toBeLessThanOrEqual(4);
    expect(saved.sessions).toHaveLength(1);
    expect(saved.sessions[0]).toMatchObject({ day: '2026-10-05', boss: false, total: session.total, xp: session.xp });
    expect(saved.streak.current).toBe(1);
    expect(saved.xp).toBe(session.xp);
    expect(Object.keys(saved.items)).toEqual(DECK_ORDER.slice(0, NEW_PER_SESSION));
    expect(saved.accuracy.sum?.length).toBeGreaterThan(0);
    expect(saved.levelLog.length).toBe(session.levelTasks);
    // Svarloggen har regnestykket og niveaufasen, ikke opvarmningen.
    expect(saved.answers?.length).toBe(session.total - NEW_PER_SESSION);
    expect(saved.answers?.every((a) => a.day === '2026-10-05' && a.score === 1 && !a.overconfident)).toBe(true);
    expect(saved.answers?.filter((a) => a.exercise === 'sum').length).toBe(saved.accuracy.sum?.length);
  });

  it('regnestykket varer 45 s, og opvarmningen slutter, når kortene er brugt', () => {
    const { phases } = play(defaultPrSaved(), 2);
    const sumSteps = phases.filter((p) => p === 'sum').length;
    // Hvert trin tager 4 s her: 45 s giver 12 opgaver.
    expect(sumSteps).toBe(Math.ceil(PR_PHASE_MS.sum / 4_000));
    expect(phases.filter((p) => p === 'warmup').length).toBe(NEW_PER_SESSION);
  });

  it('hver 7. session er ugens boss med dobbelt XP', () => {
    let saved = defaultPrSaved();
    const bosses: boolean[] = [];
    for (let i = 0; i < 14; i++) {
      bosses.push(isBossSession(saved));
      saved = { ...saved, sessions: [...saved.sessions, { day: '2026-10-05', ms: 0, correct: 0, total: 0, xp: 0, level: 1, boss: false }] };
    }
    expect(bosses.map((b, i) => (b ? i + 1 : 0)).filter(Boolean)).toEqual([7, 14]);
    const sixDone = { ...defaultPrSaved(), sessions: saved.sessions.slice(0, 6) };
    const normal = play(defaultPrSaved(), 3).session;
    const boss = play(sixDone, 3).session;
    expect(boss.boss).toBe(true);
    expect(boss.xp).toBe(2 * normal.xp);
  });
});
