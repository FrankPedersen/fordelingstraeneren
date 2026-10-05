import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../engine/rng';
import techniquesFile from '../content/techniques.json';
import type { BankItem } from '../analysis';
import { guessInterval } from '../model/guess';
import { defaultFbSaved, type FbSaved } from '../storage';
import { ensureStations, palaceRooms, placeOf, setScene, setTechniqueText } from './palace';
import { filterOptions, logPractice, matchCount, missingHonors, NO_FILTER, practiceItems, PRACTICE_LOG_SIZE } from './practice';
import { dueItems, dueTomorrow, freshToday, introduce } from './progression';
import {
  answerFb,
  finishFbSession,
  introduceFb,
  NIVEAU_END,
  nextFbStep,
  REPETITION_END,
  startFbSession,
  type FbSession,
} from './session';
import { grade, itemKey, makeTask, outcomeOf, possibleTypes, vacantWeights, type FbAnswer, type FbTask, type LineOption } from './tasks';
import { bankItem as byId, TEST_BANK as bank } from '../testBank';
import { linesForGoal } from '../analysis';
import { rankFromSymbol, type Rank } from '../model/cards';
import { dealCards, finished, playLead, playThird, startPlay, thirdHandEmpty, type PlayState } from '../play/play';

const techniques = techniquesFile.techniques;

/** Middag lokal tid den 5. oktober 2026. */
const T0 = new Date(2026, 9, 5, 12, 0).getTime();
const DAY = 24 * 3600_000;

const intervalOf = (o: LineOption) => guessInterval(100 * o.value);

/** Spiller en opgave i Spil den selv efter den bedste linjes trin og lægger ellers lavt. */
function autoPlay(item: BankItem, goal: number, seed: number): PlayState {
  const rng = mulberry32(seed);
  let state = startPlay(item, dealCards(item, rng));
  const best = linesForGoal(item, goal)[0].lead;
  const pick = (cards: Rank[], card: string) =>
    card === 'low' ? Math.min(...cards) : card === 'high' ? Math.max(...cards) : rankFromSymbol(card);
  let step = 0;
  while (!finished(state)) {
    const s = best.line[step];
    let hand: 'N' | 'S';
    let card: Rank;
    if (s) {
      hand = s.leadFrom;
      card = pick(hand === 'N' ? state.north : state.south, s.card);
    } else if (step === 0) {
      hand = best.hand;
      card = best.low;
    } else {
      hand = state.north.length ? 'N' : 'S';
      card = Math.min(...(hand === 'N' ? state.north : state.south));
    }
    state = playLead(state, hand, card, rng);
    if (thirdHandEmpty(state)) state = playThird(state, 0, rng);
    else {
      const partner = hand === 'N' ? state.south : state.north;
      const want = s?.third ? (state.current!.second < 11 ? s.third.play : s.third.else) : 'low';
      state = playThird(state, pick(partner, want), rng);
    }
    step++;
  }
  return state;
}

/** Det rigtige svar på en opgave. */
function rightAnswer(task: FbTask): Omit<FbAnswer, 'ms'> {
  switch (task.type) {
    case 'hold-eller-par':
      return { forms: { hold: task.options.findIndex((o) => o.bestFor === 'hold'), par: task.options.findIndex((o) => o.bestFor === 'par') } };
    case 'spil-selv':
      return { play: autoPlay(task.bank, task.goal, task.seed) };
    case 'chancen':
      return { guess: intervalOf(task.line) };
    case 'find-hullet':
      return { field: task.fields.find((f) => f.outcomes[0] === 0)!.id };
    case 'linje-mod-linje':
      return { line: task.options.findIndex((o) => o.correct) };
    default: {
      const line = task.options.findIndex((o) => o.correct);
      return { line, guess: intervalOf(task.options[line]) };
    }
  }
}

/** Et forkert svar på en opgave. */
function wrongAnswer(task: FbTask): Omit<FbAnswer, 'ms'> {
  switch (task.type) {
    case 'hold-eller-par':
      return { forms: { hold: task.options.findIndex((o) => o.bestFor === 'par'), par: task.options.findIndex((o) => o.bestFor === 'hold') } };
    case 'spil-selv':
      // Et spil uden stik følger ingen linje.
      return { play: startPlay(task.bank, dealCards(task.bank, mulberry32(task.seed))) };
    case 'chancen':
      return { guess: (intervalOf(task.line) + 2) % 4 };
    case 'find-hullet':
      return { field: task.fields.find((f) => f.outcomes[0] > 0)!.id };
    default:
      return { line: task.options.findIndex((o) => !o.correct), guess: 0 };
  }
}

describe('Opgaverne', () => {
  it('Vælg linjen viser 2–4 linjer med netop én rigtig', () => {
    for (const item of bank) {
      for (const goal of item.combination.goals) {
        if (!possibleTypes(item, goal).includes('vælg-linjen')) continue;
        const task = makeTask('vælg-linjen', item, goal, mulberry32(goal));
        if (task.type !== 'vælg-linjen') throw new Error('forkert type');
        expect(task.options.length, task.item).toBeGreaterThanOrEqual(2);
        expect(task.options.length, task.item).toBeLessThanOrEqual(4);
        expect(task.options.filter((o) => o.correct), task.item).toHaveLength(1);
      }
    }
  });

  it('følger pointtabellen: rigtig linje og interval = rigtigt, forkert interval = halvt, forkert linje = forkert', () => {
    const task = makeTask('vælg-linjen', byId('J32-AK54'), 3, mulberry32(1));
    if (task.type !== 'vælg-linjen') throw new Error('forkert type');
    const best = task.options.findIndex((o) => o.correct);
    const wrong = task.options.findIndex((o) => !o.correct);
    // 69,0 % ligger i 50–75.
    expect(intervalOf(task.options[best])).toBe(2);
    expect(grade(task, { line: best, guess: 2, ms: 5000 }, 20_000)).toEqual({ score: 1, lineCorrect: true, guessCorrect: true, fast: true });
    expect(grade(task, { line: best, guess: 1, ms: 25_000 }, 20_000)).toEqual({ score: 0.5, lineCorrect: true, guessCorrect: false, fast: false });
    expect(grade(task, { line: wrong, guess: intervalOf(task.options[wrong]), ms: 5000 }, 20_000).score).toBe(0);
    expect(grade(task, { ms: 5000 }, 20_000).score).toBe(0);
  });

  it('lader gættet være valgfrit i Selvvalgt', () => {
    const task = makeTask('vælg-linjen', byId('J32-AK54'), 3, mulberry32(1));
    if (task.type !== 'vælg-linjen') throw new Error('forkert type');
    const best = task.options.findIndex((o) => o.correct);
    expect(grade(task, { line: best, ms: 5000 }, 20_000, { optionalGuess: true })).toMatchObject({ score: 1, guessCorrect: null });
    expect(grade(task, { line: best, guess: 0, ms: 5000 }, 20_000, { optionalGuess: true }).score).toBe(0.5);
    expect(grade(task, { line: best, ms: 5000 }, 20_000).score).toBe(0.5);
  });

  it('bedømmer de andre opgavetyper på deres ene svar', () => {
    const item = byId('432-AKJ5');
    const chance = makeTask('chancen', item, 3, mulberry32(2));
    expect(grade(chance, { ...rightAnswer(chance), ms: 1 }, 20_000).score).toBe(1);
    expect(grade(chance, { ...wrongAnswer(chance), ms: 1 }, 20_000).score).toBe(0);
    const pair = makeTask('linje-mod-linje', item, 3, mulberry32(3));
    expect(grade(pair, { ...rightAnswer(pair), ms: 1 }, 20_000)).toMatchObject({ score: 1, guessCorrect: null });
    expect(grade(pair, { ...wrongAnswer(pair), ms: 1 }, 20_000).score).toBe(0);
    expect(possibleTypes(item, 3)).toContain('find-hullet');
    const hole = makeTask('find-hullet', item, 3, mulberry32(4));
    if (hole.type !== 'find-hullet') throw new Error('forkert type');
    expect(hole.fields.filter((f) => f.outcomes[0] === 0)).toHaveLength(1);
    expect(hole.fields.length).toBeGreaterThanOrEqual(3);
    expect(grade(hole, { ...rightAnswer(hole), ms: 1 }, 20_000).score).toBe(1);
    expect(grade(hole, { ...wrongAnswer(hole), ms: 1 }, 20_000).score).toBe(0);
  });

  it('flytter emnet efter Leitner: hurtigt rigtigt op, langsomt eller halvt bliver, forkert i kasse 1', () => {
    expect(outcomeOf({ score: 1, lineCorrect: true, guessCorrect: true, fast: true })).toBe('fast');
    expect(outcomeOf({ score: 1, lineCorrect: true, guessCorrect: true, fast: false })).toBe('slow');
    expect(outcomeOf({ score: 0.5, lineCorrect: true, guessCorrect: false, fast: true })).toBe('slow');
    expect(outcomeOf({ score: 0, lineCorrect: false, guessCorrect: null, fast: true })).toBe('wrong');
  });

  it('regner chancerne om med ledige pladser; 13/13 giver a priori', () => {
    const item = byId('J32-AK54');
    const weights = vacantWeights(item, { west: 13, east: 13 });
    const den = Number(item.solution.denominator);
    item.solution.layouts.forEach((l, L) => expect(weights[L]).toBeCloseTo(Number(l.weight) / den, 12));
    expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);

    const task = makeTask('optælling', item, 3, mulberry32(5));
    if (task.type !== 'optælling') throw new Error('forkert type');
    const { vacant, shown } = task;
    expect(shown.suits).toHaveLength(3);
    expect(vacant.west).toBe(13 - shown.west.reduce((a, b) => a + b, 0));
    expect(vacant.east).toBe(13 - shown.east.reduce((a, b) => a + b, 0));
    const w = vacantWeights(item, vacant);
    expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    for (const o of task.options) expect(o.value).toBeCloseTo(o.line.lead.layouts.reduce((s, x, L) => s + x * w[L], 0), 12);
    expect(task.options.filter((o) => o.correct)).toHaveLength(1);
  });

  it('Hvad nu? viser første runde og 2–4 fortsættelser med netop én rigtig', () => {
    let tasks = 0;
    for (const item of bank) {
      for (const goal of item.combination.goals) {
        if (!possibleTypes(item, goal).includes('hvad-nu')) continue;
        const task = makeTask('hvad-nu', item, goal, mulberry32(goal));
        if (task.type !== 'hvad-nu') throw new Error('forkert type');
        tasks++;
        expect(task.situation.trick).toHaveLength(4);
        expect(task.options.length, task.item).toBeGreaterThanOrEqual(2);
        expect(task.options.length, task.item).toBeLessThanOrEqual(4);
        expect(task.options.filter((o) => o.correct), task.item).toHaveLength(1);
        const best = task.options.findIndex((o) => o.correct);
        expect(grade(task, { line: best, guess: intervalOf(task.options[best]), ms: 1 }, 20_000).score).toBe(1);
        expect(grade(task, { line: best, guess: (intervalOf(task.options[best]) + 1) % 4, ms: 1 }, 20_000).score).toBe(0.5);
        expect(grade(task, { line: (best + 1) % task.options.length, guess: 0, ms: 1 }, 20_000).score).toBe(0);
      }
    }
    expect(tasks).toBeGreaterThan(0);
  });

  it('Spil den selv bedømmer beslutningen: den bedste linje er rigtig, også når sidningen er imod', () => {
    const item = byId('J32-AK54');
    expect(possibleTypes(item, 3)).toContain('spil-selv');
    let wins = 0, losses = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const task = makeTask('spil-selv', item, 3, mulberry32(seed));
      if (task.type !== 'spil-selv') throw new Error('forkert type');
      const play = autoPlay(item, 3, task.seed);
      const graded = grade(task, { play, ms: 30_000 }, 20_000);
      expect(graded, `seed ${seed}`).toMatchObject({ score: 1, lineCorrect: true, guessCorrect: null, fast: false });
      if (play.won >= 3) wins++;
      else losses++;
      expect(grade(task, { ...wrongAnswer(task), ms: 1 }, 20_000).score).toBe(0);
    }
    // Linjen vinder ca. 69 % af gangene, men bedømmelsen er den samme.
    expect(wins).toBeGreaterThan(0);
    expect(losses).toBeGreaterThan(0);
  });

  it('Hold eller par: holdkampens og parturneringens linje skal begge vælges rigtigt', () => {
    // K 5 4 / E B 3 2, 3 stik: slå kongen og esset (77,0 %, 2,77 stik) mod kipning (69,0 %, 2,87 stik).
    const item = byId('K54-AJ32');
    expect(possibleTypes(item, 3)).toContain('hold-eller-par');
    expect(possibleTypes(item, 4)).not.toContain('hold-eller-par');
    expect(possibleTypes(byId('J32-AK54'), 3)).not.toContain('hold-eller-par');
    const task = makeTask('hold-eller-par', item, 3, mulberry32(1));
    if (task.type !== 'hold-eller-par') throw new Error('forkert type');
    const hold = task.options.findIndex((o) => o.bestFor === 'hold');
    const par = task.options.findIndex((o) => o.bestFor === 'par');
    expect(task.options[hold]).toMatchObject({ value: 0.770497, tricks: 2.770497, correct: true });
    expect(task.options[par].tricks).toBeCloseTo(2.867391, 6);
    expect(task.options[par].value).toBeCloseTo(0.6898, 4);
    expect(task.options[hold].line.lead.steps[0]).toBe('Slå kongen og esset.');
    // Parturneringens linje står i båndet som målet nået (1) eller ej (0).
    expect(new Set(task.options[par].line.lead.layouts)).toEqual(new Set([0, 1]));
    expect(grade(task, { forms: { hold, par }, ms: 1 }, 20_000)).toMatchObject({ score: 1, lineCorrect: true, fast: true });
    expect(grade(task, { forms: { hold: par, par: hold }, ms: 1 }, 20_000).score).toBe(0);
    // Samme linje begge steder er forkert: pointen er, at formen afgør linjen.
    expect(grade(task, { forms: { hold, par: hold }, ms: 1 }, 20_000).score).toBe(0);
    const eligible = bank.flatMap((b) => b.combination.goals.filter((g) => possibleTypes(b, g).includes('hold-eller-par')));
    expect(eligible.length).toBeGreaterThanOrEqual(100);
  });

  it('Samme farve, nyt mål: det tidligere mål har helst en anden bedste linje', () => {
    const task = makeTask('nyt-mål', byId('432-AKJ5'), 4, mulberry32(6));
    if (task.type !== 'nyt-mål') throw new Error('forkert type');
    expect(task.previousGoal).toBe(3);
    expect(possibleTypes(byId('J32-AK54'), 3)).not.toContain('nyt-mål');
  });
});

describe('Progression', () => {
  it('introducerer højst 2 nye kombinationer om dagen i hyppighedsorden', () => {
    let saved = defaultFbSaved();
    const fresh = freshToday(saved, bank, '2026-10-05');
    expect(fresh.map((b) => b.combination.id)).toEqual([bank[0].combination.id, bank[1].combination.id]);
    saved = introduce(saved, fresh[0], '2026-10-05');
    expect(freshToday(saved, bank, '2026-10-05').map((b) => b.combination.id)).toEqual([bank[1].combination.id]);
    saved = introduce(saved, fresh[1], '2026-10-05');
    expect(freshToday(saved, bank, '2026-10-05')).toEqual([]);
    expect(freshToday(saved, bank, '2026-10-06').map((b) => b.rank)).toEqual([3, 4]);
  });

  it('giver et emne pr. mål og en station i teknikkens rum', () => {
    let saved = introduce(defaultFbSaved(), byId('432-AKJ5'), '2026-10-05');
    expect(Object.keys(saved.items).sort()).toEqual(['432-AKJ5:3', '432-AKJ5:4']);
    expect(saved.items['432-AKJ5:4']).toMatchObject({ box: 1, due: '2026-10-05' });
    expect(saved.palace.stations['432-AKJ5']).toEqual({ technique: 'sikkerhedsspil', order: 1 });
    saved = introduce(saved, byId('K54-AJ32'), '2026-10-05');
    expect(saved.palace.stations['K54-AJ32']).toEqual({ technique: 'sikkerhedsspil', order: 2 });
    expect(dueItems(saved, '2026-10-05')).toHaveLength(4);
    expect(dueTomorrow(saved, '2026-10-05')).toBe(4);
  });
});

/** Opgaven i sessionens aktuelle trin. */
function taskOf(s: FbSession): FbTask {
  if (s.step?.kind !== 'task') throw new Error(`Trinet er ${s.step?.kind}, ikke en opgave`);
  return s.step.task;
}

function introduceAll(saved: FbSaved, items: BankItem[], day: string): FbSaved {
  return items.reduce((s, item) => introduce(s, item, day), saved);
}

describe('Sessionen', () => {
  it('kører niveau med introduktion og øvelse i hvert mål, derefter lynrunde og status', () => {
    let saved = defaultFbSaved();
    let s: FbSession = startFbSession(saved, bank, T0, 7);
    expect(s.due).toEqual([]);
    s = nextFbStep(s, saved, bank, T0);
    expect(s.phase).toBe('niveau');
    expect(s.step).toEqual({ kind: 'intro', combination: bank[0].combination.id });
    ({ session: s, saved } = introduceFb(s, saved, bank, bank[0].combination.id, T0 + 1000));
    expect(saved.introduced[bank[0].combination.id]).toBe('2026-10-05');

    // Hvert mål øves straks.
    const goalsOf = (item: BankItem) => item.combination.goals.map((g) => itemKey(item.combination.id, g));
    let t = T0 + 2000;
    const practise = () => {
      const asked: string[] = [];
      for (;;) {
        s = nextFbStep(s, saved, bank, t);
        if (s.step?.kind !== 'task') return asked;
        asked.push(s.step.task.item);
        ({ session: s, saved } = answerFb(s, saved, rightAnswer(s.step.task), t + 3000));
        t += 5000;
      }
    };
    expect(practise()).toEqual(goalsOf(bank[0]));
    expect(s.step).toEqual({ kind: 'intro', combination: bank[1].combination.id });
    ({ session: s, saved } = introduceFb(s, saved, bank, bank[1].combination.id, t));
    // Den næste kombination øves i alle sine mål; derefter øver niveauet de introducerede emner, indtil tiden er gået.
    const second: string[] = [];
    for (let k = 0; k < bank[1].combination.goals.length; k++) {
      s = nextFbStep(s, saved, bank, t);
      second.push(taskOf(s).item);
      ({ session: s, saved } = answerFb(s, saved, rightAnswer(taskOf(s)), t + 3000));
      t += 5000;
    }
    expect(second).toEqual(goalsOf(bank[1]));
    s = nextFbStep(s, saved, bank, t);
    expect(s.phase).toBe('niveau');
    expect(s.step?.kind).toBe('task');
    s = nextFbStep(s, saved, bank, T0 + NIVEAU_END);
    expect(s.phase === 'lynrunde' || s.step?.kind === 'status').toBe(true);
  });

  it('kører lynrunden med linje mod linje i 60 s og slutter med status', () => {
    const saved = introduceAll(defaultFbSaved(), [byId('J32-AK54'), byId('432-AKJ5')], '2026-10-04');
    let s: FbSession = { ...startFbSession(saved, bank, T0, 5), due: [], phase: 'niveau' };
    s = nextFbStep(s, saved, bank, T0 + NIVEAU_END);
    expect(s.phase).toBe('lynrunde');
    expect(taskOf(s).type).toBe('linje-mod-linje');
    s = nextFbStep(s, saved, bank, T0 + NIVEAU_END + 59_000);
    expect(s.phase).toBe('lynrunde');
    s = nextFbStep(s, saved, bank, T0 + NIVEAU_END + 60_000);
    expect(s.step).toEqual({ kind: 'status' });
  });

  it('springer forfaldne emner over, hvis målet er fjernet som fejl i kilden', () => {
    // B 5 4 3 / E D 2: 4 stik er fjernet (kildens 9 % passer ikke, og alle linjer giver det samme); 3 stik er tilbage.
    expect(byId('AQ2-J543').combination.goals).toEqual([3]);
    const saved = introduce(defaultFbSaved(), byId('AQ2-J543'), '2026-10-04');
    const items = { ...saved.items, 'AQ2-J543:4': { ...saved.items['AQ2-J543:3'] } };
    const s = startFbSession({ ...saved, items }, bank, T0, 3);
    expect(s.due).toEqual(['AQ2-J543:3']);
  });

  it('stiller forfaldne emner i repetitionen, højst 60 s', () => {
    const saved = introduceAll(defaultFbSaved(), bank.slice(0, 4), '2026-10-04');
    let s = startFbSession(saved, bank, T0, 3);
    expect(s.due).toEqual(dueItems(saved, '2026-10-05'));
    s = nextFbStep(s, saved, bank, T0);
    expect(s.phase).toBe('repetition');
    expect(taskOf(s).item).toBe(dueItems(saved, '2026-10-05')[0]);
    s = nextFbStep(s, saved, bank, T0 + REPETITION_END);
    expect(s.phase).toBe('niveau');
  });

  it('logger svar i repetition og niveau til statistikken, men ikke i lynrunden', () => {
    const saved = introduce(defaultFbSaved(), byId('J32-AK54'), '2026-10-05');
    const base = startFbSession(saved, bank, T0, 1);
    const task = makeTask('vælg-linjen', byId('J32-AK54'), 3, mulberry32(1));
    if (task.type !== 'vælg-linjen') throw new Error('forkert type');
    const best = task.options.findIndex((o) => o.correct);
    const asked = (phase: 'niveau' | 'lynrunde'): FbSession => ({ ...base, step: { kind: 'task', phase, task }, shownAt: T0 });
    const niveau = answerFb(asked('niveau'), saved, { line: best, guess: 1 }, T0 + 4000).saved;
    expect(niveau.training).toEqual([{ day: '2026-10-05', item: 'J32-AK54:3', task: 'vælg-linjen', score: 0.5, ms: 4000 }]);
    expect(answerFb(asked('lynrunde'), saved, { line: best }, T0 + 4000).saved.training).toBeUndefined();
  });

  it('giver 10, 5 og 0 XP, ganger combo på og nulstiller den ved halvt eller forkert', () => {
    const saved = introduce(defaultFbSaved(), byId('J32-AK54'), '2026-10-05');
    const base = startFbSession(saved, bank, T0, 1);
    const task = makeTask('vælg-linjen', byId('J32-AK54'), 3, mulberry32(1));
    if (task.type !== 'vælg-linjen') throw new Error('forkert type');
    const best = task.options.findIndex((o) => o.correct);
    const asked = (combo: number): FbSession => ({ ...base, combo, step: { kind: 'task', phase: 'niveau', task }, shownAt: T0 });

    let r = answerFb(asked(0), saved, { line: best, guess: 2 }, T0 + 4000);
    expect(r.feedback).toMatchObject({ xp: 10, combo: 1 });
    expect(r.saved.xp).toBe(10);
    r = answerFb(asked(0), saved, { line: best, guess: 1 }, T0 + 4000);
    expect(r.feedback).toMatchObject({ xp: 5, combo: 0 });
    r = answerFb(asked(4), saved, { line: (best + 1) % task.options.length, guess: 2 }, T0 + 4000);
    expect(r.feedback).toMatchObject({ xp: 0, combo: 0 });
    // Fem rigtige i træk giver 1,5 gange XP, ti giver 2 gange.
    expect(answerFb(asked(5), saved, { line: best, guess: 2 }, T0 + 4000).feedback.xp).toBe(15);
    expect(answerFb(asked(10), saved, { line: best, guess: 2 }, T0 + 4000).feedback.xp).toBe(20);
  });

  it('flytter emner efter Leitner; lynrunden skriver ikke i loggen og flytter kun ved fejl', () => {
    const saved = introduce(defaultFbSaved(), byId('J32-AK54'), '2026-10-05');
    const base = startFbSession(saved, bank, T0, 1);
    const pair = makeTask('linje-mod-linje', byId('J32-AK54'), 3, mulberry32(2));
    const task = makeTask('vælg-linjen', byId('J32-AK54'), 3, mulberry32(1));
    const at = (phase: 'niveau' | 'lynrunde', t: FbTask): FbSession => ({ ...base, step: { kind: 'task', phase, task: t }, shownAt: T0 });

    const fast = answerFb(at('niveau', task), saved, rightAnswer(task), T0 + 5000).saved.items['J32-AK54:3'];
    expect(fast).toMatchObject({ box: 2, due: '2026-10-07' });
    expect(fast.log).toEqual([{ t: T0 + 5000, ok: true, ms: 5000 }]);
    const slow = answerFb(at('niveau', task), saved, rightAnswer(task), T0 + 25_000).saved.items['J32-AK54:3'];
    expect(slow).toMatchObject({ box: 1, due: '2026-10-06' });

    expect(answerFb(at('lynrunde', pair), saved, rightAnswer(pair), T0 + 2000).saved.items['J32-AK54:3']).toEqual(saved.items['J32-AK54:3']);
    const wrong = answerFb(at('lynrunde', pair), saved, wrongAnswer(pair), T0 + 2000).saved.items['J32-AK54:3'];
    expect(wrong).toMatchObject({ box: 1, due: '2026-10-06', log: [] });
  });

  it('registrerer sessionen og farvebehandlingens egen streak', () => {
    const saved = defaultFbSaved();
    const s = { ...startFbSession(saved, bank, T0, 1), correct: 2.5, total: 4, xp: 35 };
    const done = finishFbSession(s, saved, T0 + 300_000);
    expect(done.sessions).toEqual([{ day: '2026-10-05', ms: 300_000, correct: 2.5, total: 4, xp: 35 }]);
    expect(done.streak).toMatchObject({ current: 1, best: 1, lastDay: '2026-10-05' });
    const next = finishFbSession(s, done, T0 + DAY);
    expect(next.streak).toMatchObject({ current: 2, lastDay: '2026-10-06' });
  });
});

describe('Paladset', () => {
  it('åbner et rum, når dets første kombination er introduceret, med stationerne i rækkefølge', () => {
    let saved = defaultFbSaved();
    expect(palaceRooms(saved, bank, techniques).every((r) => r.stations.length === 0)).toBe(true);
    saved = introduceAll(saved, [byId('J32-AK54'), byId('K54-AJ32'), byId('432-AKJ5')], '2026-10-05');
    const rooms = palaceRooms(saved, bank, techniques);
    expect(rooms.map((r) => r.technique.name)).toEqual(techniques.map((t) => t.name));
    const safety = rooms.find((r) => r.technique.id === 'sikkerhedsspil')!;
    expect(safety.stations.map((s) => [s.combination, s.order])).toEqual([['K54-AJ32', 1], ['432-AKJ5', 2]]);
    expect(safety.rule).toBe('Sikr målet, ikke maksimum.');
    expect(placeOf(saved, bank, techniques, '432-AKJ5')?.station?.order).toBe(2);
    expect(placeOf(saved, bank, techniques, 'J32-AK4')).toMatchObject({ room: { technique: { id: 'fald-eller-kip' } }, station: null });
  });

  it('lader brugeren erstatte billede, huskeregel og scene', () => {
    let saved = introduce(defaultFbSaved(), byId('J32-AK54'), '2026-10-05');
    saved = setTechniqueText(saved, 'spil-mod-honnoer', 'rule', '  Mod knægten!  ');
    saved = setTechniqueText(saved, 'spil-mod-honnoer', 'image', 'Stigen');
    saved = setScene(saved, 'J32-AK54', 'Tyven på stigen');
    let room = palaceRooms(saved, bank, techniques).find((r) => r.technique.id === 'spil-mod-honnoer')!;
    expect(room).toMatchObject({ rule: 'Mod knægten!', image: 'Stigen', ownRule: true, ownImage: true });
    expect(room.stations[0].scene).toBe('Tyven på stigen');
    saved = setTechniqueText(saved, 'spil-mod-honnoer', 'rule', '');
    saved = setTechniqueText(saved, 'spil-mod-honnoer', 'image', ' ');
    saved = setScene(saved, 'J32-AK54', '');
    room = palaceRooms(saved, bank, techniques).find((r) => r.technique.id === 'spil-mod-honnoer')!;
    expect(room).toMatchObject({ rule: 'Spil mod det kort, du vil gøre til stik.', ownRule: false, ownImage: false });
    expect(room.stations[0].scene).toBeUndefined();
    expect(saved.palace.techniques).toEqual({});
  });

  it('giver introducerede kombinationer uden station en station', () => {
    const saved = { ...defaultFbSaved(), introduced: { 'J32-AK54': '2026-10-05' } };
    expect(ensureStations(saved, bank).palace.stations).toEqual({ 'J32-AK54': { technique: 'spil-mod-honnoer', order: 1 } });
    const done = ensureStations(saved, bank);
    expect(ensureStations(done, bank)).toBe(done);
  });
});

describe('Selvvalgt', () => {
  const order = techniques.map((t) => t.id);

  it('viser antallet af kombinationer for hvert valg, og intet valg med 0 kan ramme ingenting', () => {
    const all = filterOptions(bank, NO_FILTER, order);
    expect(all.technique.reduce((n, o) => n + o.count, 0)).toBe(bank.length);
    expect(all.cards.reduce((n, o) => n + o.count, 0)).toBe(bank.length);
    expect(all.missing.reduce((n, o) => n + o.count, 0)).toBe(bank.length);
    expect(all.missing.map((o) => o.value)).toContain('D');
    // Alle seks teknikker står i filtret i rækkefølge, også en teknik uden kombinationer.
    expect(all.technique.map((o) => o.value)).toEqual(order);

    const filter = { ...NO_FILTER, technique: 'fald-eller-kip', cards: 9 };
    const options = filterOptions(bank, filter, order);
    for (const key of ['technique', 'cards', 'missing', 'goal'] as const) {
      for (const o of options[key]) {
        const chosen = { ...filter, [key]: o.value };
        expect(matchCount(bank, chosen), `${key}=${o.value}`).toBe(o.count);
        if (o.count > 0) expect(practiceItems(bank, chosen).length).toBeGreaterThan(0);
      }
    }
  });

  it('giver emner for kombinationerne og målet', () => {
    expect(missingHonors(byId('432-AKT5'))).toBe('D B');
    const items = practiceItems(bank, { ...NO_FILTER, goal: 4, cards: 7 });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((k) => k.endsWith(':4'))).toBe(true);
  });

  it('logger svarene uden at røre emnerne', () => {
    let saved = introduce(defaultFbSaved(), byId('J32-AK54'), '2026-10-05');
    const items = saved.items;
    for (let i = 0; i < PRACTICE_LOG_SIZE + 3; i++) {
      saved = logPractice(saved, { day: '2026-10-05', item: 'J32-AK54:3', task: 'vælg-linjen', score: 1, ms: i });
    }
    expect(saved.practice).toHaveLength(PRACTICE_LOG_SIZE);
    expect(saved.practice[0].ms).toBe(3);
    expect(saved.items).toBe(items);
  });
});
