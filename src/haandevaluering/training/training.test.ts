import { describe, expect, it } from 'vitest';
import { newItem } from '../../engine/leitner';
import { mulberry32 } from '../../engine/rng';
import { GENERATED, makeTask, pairP, type HandTask } from '../model/generator';
import { defaultHeSaved, type HeSaved } from '../storage';
import { DECK_ORDER, DECK_PATTERNS, deckCorrect, deckTask, NEW_PER_SESSION, reviewCard, warmupQueue } from './deck';
import { nextLevel } from './progression';
import { facitOf, grade, isRight, TIME_LIMIT_MS, XP, type HandAnswer } from './scoring';
import { answerDeck, answerHeTask, HE_PHASE_MS, nextHeStep, startHeSession, type HeSession } from './session';

const rng = () => mulberry32(1);

describe('Leitner-bunken (Claude Codes forslag i SPEC-haandevaluering.md, Husketeknikker)', () => {
  it('har de 13 mønstre fra specens tabel, ankrene, korthed, genvejen, makkers krav og stikformlen', () => {
    expect(DECK_PATTERNS).toEqual([
      '4-4-3-2',
      '5-3-3-2',
      '5-4-3-1',
      '5-4-2-2',
      '4-3-3-3',
      '6-3-2-2',
      '6-4-2-1',
      '6-3-3-1',
      '5-5-2-1',
      '4-4-4-1',
      '7-3-2-1',
      '6-4-3-0',
      '5-4-4-0',
    ]);
    expect(DECK_ORDER).toHaveLength(30);
    expect(new Set(DECK_ORDER).size).toBe(30);
    expect(DECK_ORDER.slice(0, 6)).toEqual(['anker:game', 'korthed:0', 'genvej:ace', 'moenster:4-4-3-2', 'makker:12', 'stik']);
  });

  it('facit regnes af modellen: ankrene 28½ – 35 – 41, korthed 5-3-1, genvejen og makkers krav', () => {
    const answer = (key: string) => deckTask(key, rng()).answer;
    expect([answer('anker:game'), answer('anker:slam'), answer('anker:grand')]).toEqual([28.5, 35, 41]);
    expect([answer('korthed:0'), answer('korthed:1'), answer('korthed:2')]).toEqual([5, 3, 1]);
    expect(['ace', 'queen', 'jack', 'ten'].map((t) => answer(`genvej:${t}`))).toEqual([1, -0.5, -0.5, 0.25]);
    expect([12, 14, 16, 18, 21, 24].map((p) => answer(`makker:${p}`))).toEqual([16.5, 14.5, 12.5, 10.5, 7.5, 4.5]);
    expect(answer('moenster:5-4-3-1')).toBe(3);
    expect(() => deckTask('moenster:7-5-1-0', rng())).toThrow();
    expect(() => deckTask('ukendt', rng())).toThrow();
  });

  it('valgkortene har fire forskellige svarmuligheder med facit iblandt', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const key of ['stik', 'genvej:queen', 'genvej:ten']) {
        const task = deckTask(key, mulberry32(seed));
        if (task.kind !== 'choice') throw new Error(key);
        expect(new Set(task.options).size).toBe(4);
        expect(task.options).toContain(task.answer);
        expect(deckCorrect(task, task.answer)).toBe(true);
      }
    }
    const stik = deckTask('stik', rng());
    if (stik.kind !== 'choice') throw new Error('stik');
    expect(stik.answer).toBeCloseTo(0.31 * stik.P! + 0.75, 1);
  });

  it('opvarmningens kø: forfaldne kort først, derefter højst 3 nye', () => {
    const today = '2026-10-08';
    expect(warmupQueue({}, today)).toEqual(DECK_ORDER.slice(0, NEW_PER_SESSION));
    const items = { 'moenster:4-4-3-2': { ...newItem('2026-10-01') }, 'anker:game': { ...newItem('2026-10-09') } };
    const queue = warmupQueue(items, today);
    expect(queue[0]).toBe('moenster:4-4-3-2');
    expect(queue).not.toContain('anker:game');
    expect(queue).toHaveLength(1 + NEW_PER_SESSION);
    const reviewed = reviewCard({}, 'stik', true, 3000, today, 0);
    expect(reviewed.stik.box).toBe(2);
  });
});

describe('Facit og scoring (SPEC-haandevaluering.md, Session, scoring og data)', () => {
  const tasks: HandTask[] = GENERATED.flatMap((e) => Array.from({ length: 100 }, (_, i) => makeTask(e, i + 1)));

  it('hver opgave har et facit, og facit er altid rigtigt', () => {
    for (const task of tasks) {
      const facit = facitOf(task);
      const answer: HandAnswer =
        facit.exercise === 'add'
          ? { exercise: 'add', terms: facit.terms }
          : facit.exercise === 'decision'
            ? { exercise: 'decision', decision: facit.right[0] }
            : facit.exercise === 'strain'
              ? { exercise: 'strain', strain: facit.strain }
              : { exercise: facit.exercise, points: facit.points };
      expect(isRight(task, answer), `${task.exercise} ${task.seed}`).toBe(true);
    }
  }, 30_000);

  it('opgave 3: kun honnørpoint uden fit, fordeling med fit og sansmodellen efter 1NT', () => {
    for (const task of tasks.filter((t) => t.exercise === 'add')) {
      const terms = (facitOf(task) as { terms: string }).terms;
      expect(terms).toBe({ 'no-fit': 'honors', fit: 'distribution', notrump: 'notrump' }[task.scenario]);
    }
  });

  it('opgave 4: valget er rigtigt, når det følger grænsen; inden for ½ point af grænsen er begge nabovalg rigtige', () => {
    let both = 0;
    for (const task of tasks.filter((t) => t.exercise === 'decision')) {
      const facit = facitOf(task);
      if (facit.exercise !== 'decision') throw new Error();
      expect(facit.P).toBe(pairP(task.hands, task.trump));
      const near = [26, 28.5].some((g) => Math.abs(facit.P - g) <= 0.5) || (Math.abs(facit.P - 35) <= 0.5 && facit.controls.aces >= 3);
      expect(facit.right.length, `P = ${facit.P}`).toBe(near ? 2 : 1);
      if (facit.right.length === 2) both++;
      for (const decision of ['pass', 'invite', 'game', 'slam'] as const) {
        expect(isRight(task, { exercise: 'decision', decision })).toBe(facit.right.includes(decision));
      }
    }
    expect(both).toBeGreaterThan(0);
  });

  it('opgave 6: 4M med major-fit, 3NT uden major-fit og med alle farver stoppet', () => {
    for (const task of tasks.filter((t) => t.exercise === 'strain')) {
      const facit = facitOf(task);
      if (facit.exercise !== 'strain') throw new Error();
      expect(facit.strain).toBe(task.trump === null ? 'notrump' : 'major');
      if (task.trump !== null) expect(facit.gain).toBeGreaterThanOrEqual(2.22);
      else expect(facit.stopped).toEqual([0, 1, 2, 3]);
    }
  });

  it('rigtigt 10 XP, rigtigt over tidsgrænsen 5 XP, forkert 0; 8 s for honnørpoint og 20 s for de øvrige', () => {
    const honors = makeTask('honors', 1);
    const points = (facitOf(honors) as { points: number }).points;
    expect(grade(honors, { exercise: 'honors', points }, TIME_LIMIT_MS.honors)).toEqual({ right: true, score: 1, inTime: true, xp: XP.right });
    expect(grade(honors, { exercise: 'honors', points }, TIME_LIMIT_MS.honors + 1).xp).toBe(XP.slow);
    expect(grade(honors, { exercise: 'honors', points: points + 0.25 }, 1000)).toEqual({ right: false, score: 0, inTime: true, xp: 0 });
    const partner = makeTask('partner', 1);
    const needs = (facitOf(partner) as { points: number }).points;
    expect(grade(partner, { exercise: 'partner', points: needs }, 20_000).xp).toBe(10);
    expect(grade(partner, { exercise: 'partner', points: needs }, 20_001).xp).toBe(5);
    expect([XP.right, XP.slow, XP.wrong]).toEqual([10, 5, 0]);
  });

  it('niveauet: over 90 % af de seneste 20 rykker op, under 80 % ét ned', () => {
    let state = { level: 2 as const, log: [] as number[] };
    for (let i = 0; i < 19; i++) state = nextLevel(state, 1) as typeof state;
    expect(state.level).toBe(2);
    expect(nextLevel(state, 1)).toEqual({ level: 3, log: [] });
    const down = Array.from({ length: 19 }, (_, i) => (i < 15 ? 1 : 0));
    expect(nextLevel({ level: 2, log: down }, 0)).toEqual({ level: 1, log: [] });
    const stay = Array.from({ length: 19 }, (_, i) => (i < 17 ? 1 : 0));
    expect(nextLevel({ level: 2, log: stay }, 1).level).toBe(2);
  });
});

describe('Sessionen (5 minutter)', () => {
  /** Svarer rigtigt på alt og lader `ms` gå pr. svar. */
  function run(saved: HeSaved, ms: number, wrong = false) {
    let t = Date.parse('2026-10-08T10:00:00');
    let session: HeSession = startHeSession(saved, t, 42);
    const phases: string[] = [];
    for (let i = 0; i < 500; i++) {
      ({ session, saved } = nextHeStep(session, saved, t));
      if (phases.at(-1) !== session.phase) phases.push(session.phase);
      const step = session.step!;
      if (step.kind === 'status') break;
      t += ms;
      if (step.kind === 'deck') {
        ({ session, saved } = answerDeck(session, saved, wrong ? NaN : step.task.answer, t));
        continue;
      }
      const facit = facitOf(step.task);
      const answer: HandAnswer =
        facit.exercise === 'add'
          ? { exercise: 'add', terms: facit.terms }
          : facit.exercise === 'decision'
            ? { exercise: 'decision', decision: facit.right[0] }
            : facit.exercise === 'strain'
              ? { exercise: 'strain', strain: facit.strain }
              : { exercise: facit.exercise, points: wrong ? -1 : facit.points };
      ({ session, saved } = answerHeTask(session, saved, answer, t));
    }
    return { session, saved, phases };
  }

  it('opvarmning, lynrunde, niveauopgaver og status; sessionen og streaken registreres', () => {
    const { session, saved, phases } = run(defaultHeSaved(), 5_000);
    expect(phases).toEqual(['warmup', 'lightning', 'level', 'status']);
    expect(saved.sessions).toHaveLength(1);
    // 30 rigtige svar i niveaufasen: efter de første 20 rykker niveauet op.
    expect(saved.sessions[0]).toMatchObject({ day: '2026-10-08', level: 2, correct: session.total, total: session.total });
    expect(saved.streak.current).toBe(1);
    expect(Object.keys(saved.items)).toEqual(DECK_ORDER.slice(0, NEW_PER_SESSION));
    expect(session.xp).toBe(saved.xp);
    const lightning = saved.answers!.filter((a) => a.phase === 'lightning');
    expect(lightning.length).toBe(Math.ceil(HE_PHASE_MS.lightning / 5_000));
    expect(lightning.every((a) => a.exercise === 'honors')).toBe(true);
    const level = saved.answers!.filter((a) => a.phase === 'level');
    expect(level.length).toBe(Math.ceil(HE_PHASE_MS.level / 5_000));
    expect(level.slice(0, 20).every((a) => a.level === 1 && (a.exercise === 'honors' || a.exercise === 'partner'))).toBe(true);
    expect(level.slice(20).every((a) => a.level === 2 && (a.exercise === 'distribution' || a.exercise === 'add'))).toBe(true);
    // Den samme øvelse kommer ikke to gange i træk i niveaufasen.
    for (let i = 1; i < level.length; i++) expect(level[i].exercise).not.toBe(level[i - 1].exercise);
    // Kun niveaufasens svar tilpasser niveauet; svarloggen har seedet, så opgaven kan genskabes.
    expect(saved.levelLog).toHaveLength(level.length - 20);
    const first = level[0];
    expect(makeTask(first.exercise, first.seed).seed).toBe(first.seed);
  });

  it('forkerte svar giver 0 XP og flytter kortene i kasse 1', () => {
    const { saved } = run(defaultHeSaved(), 5_000, true);
    for (const item of Object.values(saved.items)) expect(item.box).toBe(1);
    expect(saved.answers!.filter((a) => a.exercise === 'honors').every((a) => a.score === 0)).toBe(true);
  });
});
