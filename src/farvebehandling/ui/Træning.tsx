import { useEffect, useRef, useState } from 'react';
import { dayOf } from '../../engine/dates';
import { formatDecimal } from '../../engine/format';
import { randomSeed } from '../../engine/rng';
import { streakOn } from '../../engine/streak';
import type { BankItem } from '../analysis';
import type { FbSaved } from '../storage';
import { placeOf, type Technique } from '../training/palace';
import { dueItems, dueTomorrow, freshToday, parseItemKey } from '../training/progression';
import {
  answerFb,
  finishFbSession,
  FB_PHASE_MS,
  introduceFb,
  nextFbStep,
  startFbSession,
  type FbFeedback,
  type FbSession,
} from '../training/session';
import type { FbAnswer } from '../training/tasks';
import { Data } from './Data';
import { Facit } from './Facit';
import { Introduktion } from './Introduktion';
import { Opgave } from './Opgave';
import { Palads } from './Palads';
import { TEXT } from './texts';

interface TræningProps {
  bank: readonly BankItem[];
  saved: FbSaved;
  update(next: FbSaved): void;
  techniques: readonly Technique[];
}

/** Træning: forsiden med dagens plan, den daglige session, paladset og dine data. */
export function Træning({ bank, saved, update, techniques }: TræningProps) {
  const [view, setView] = useState<'home' | 'session' | 'palace' | 'data'>('home');
  const home = () => setView('home');
  if (view === 'session') return <SessionView bank={bank} saved={saved} update={update} techniques={techniques} onExit={home} />;
  if (view === 'palace') return <Palads bank={bank} saved={saved} update={update} techniques={techniques} onBack={home} />;
  if (view === 'data') return <Data saved={saved} update={update} onBack={home} />;

  const today = dayOf(Date.now(), saved.settings.dayStartsAtHour);
  const due = dueItems(saved, today).filter((k) => bank.some((b) => b.combination.id === parseItemKey(k).id)).length;
  const fresh = freshToday(saved, bank, today).length;
  const streak = streakOn(saved.streak, today).current;
  return (
    <div className="fb-narrow">
      <div className="stats">
        <div className="stat">
          <span className="stat-value">{streak}</span>
          <span className="stat-label">{TEXT.daysInRow(streak)}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{saved.xp}</span>
          <span className="stat-label">{TEXT.xp}</span>
        </div>
      </div>
      <section className="card">
        <h2>{TEXT.today}</h2>
        <p>{TEXT.todayPlan(due, fresh)}</p>
        {saved.sessions.some((s) => s.day === today) && <p className="fb-note">{TEXT.doneToday}</p>}
        <button type="button" className="btn primary wide" onClick={() => setView('session')}>
          {TEXT.start}
        </button>
        <p className="fb-note">{TEXT.ownTrack}</p>
      </section>
      <div className="fb-actions">
        <button type="button" className="btn" onClick={() => setView('palace')}>
          {TEXT.palace}
        </button>
        <button type="button" className="btn" onClick={() => setView('data')}>
          {TEXT.data}
        </button>
      </div>
    </div>
  );
}

/** Opdaterer visningen hvert sekund, så tidslinjen følger med. */
function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const SESSION_MS = FB_PHASE_MS.repetition + FB_PHASE_MS.niveau + FB_PHASE_MS.lynrunde + FB_PHASE_MS.status;

function SessionView({ bank, saved, update, techniques, onExit }: TræningProps & { onExit(): void }) {
  const [session, setSession] = useState<FbSession>(() => {
    const now = Date.now();
    return nextFbStep(startFbSession(saved, bank, now, randomSeed()), saved, bank, now);
  });
  const [result, setResult] = useState<{ answer: Omit<FbAnswer, 'ms'>; feedback: FbFeedback } | null>(null);
  const recorded = useRef(false);
  const now = useNow(1000);
  const step = session.step!;

  // Status: sessionen er gennemført og tæller i streaken.
  useEffect(() => {
    if (step.kind === 'status' && !recorded.current) {
      recorded.current = true;
      update(finishFbSession(session, saved, Date.now()));
    }
  }, [step, session, saved, update]);

  function advance() {
    setResult(null);
    setSession(nextFbStep(session, saved, bank, Date.now()));
  }

  function confirmIntro(id: string) {
    const r = introduceFb(session, saved, bank, id, Date.now());
    update(r.saved);
    setSession(nextFbStep(r.session, r.saved, bank, Date.now()));
  }

  function answer(a: Omit<FbAnswer, 'ms'>) {
    const r = answerFb(session, saved, a, Date.now());
    update(r.saved);
    setSession(r.session);
    setResult({ answer: a, feedback: r.feedback });
  }

  if (step.kind === 'status') {
    const today = dayOf(Date.now(), saved.settings.dayStartsAtHour);
    return (
      <div className="fb-narrow">
        <section className="card" aria-labelledby="fb-status">
          <h2 id="fb-status">{TEXT.sessionDone}</h2>
          <p>{TEXT.sessionScore(formatDecimal(session.correct, session.correct % 1 ? 1 : 0), session.total)}</p>
          <p>{TEXT.sessionXp(session.xp)}</p>
          <div className="stats">
            <div className="stat">
              <span className="stat-value">{streakOn(saved.streak, today).current}</span>
              <span className="stat-label">{TEXT.streak}</span>
            </div>
            <div className="stat">
              <span className="stat-value">{saved.xp}</span>
              <span className="stat-label">{TEXT.xp}</span>
            </div>
          </div>
          <p>{TEXT.tomorrow(dueTomorrow(saved, today))}</p>
          <button type="button" className="btn primary wide" onClick={onExit}>
            {TEXT.toHome}
          </button>
        </section>
      </div>
    );
  }

  const phase = step.kind === 'task' ? step.phase : 'niveau';
  const progress = Math.min(100, (100 * (now - session.started)) / SESSION_MS);
  let content;
  if (step.kind === 'intro') {
    const item = bank.find((b) => b.combination.id === step.combination)!;
    content = <Introduktion item={item} room={placeOf(saved, bank, techniques, item.combination.id)?.room ?? null} onNext={() => confirmIntro(item.combination.id)} />;
  } else if (result) {
    content = (
      <Facit
        task={step.task}
        answer={result.answer}
        graded={result.feedback.graded}
        reward={{ xp: result.feedback.xp, combo: result.feedback.combo }}
        place={placeOf(saved, bank, techniques, step.task.bank.combination.id)}
        onNext={advance}
      />
    );
  } else {
    content = <Opgave key={session.count} task={step.task} onAnswer={answer} />;
  }
  return (
    <div className="fb-narrow fb-session">
      <div className="session-bar">
        <span className="phase">{TEXT.phases[phase]}</span>
        <span className="session-meta">{TEXT.sessionMeta(session.xp, session.combo)}</span>
        <button type="button" className="round" aria-label={TEXT.stop} onClick={onExit}>
          ✕
        </button>
      </div>
      <div className="progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      {content}
    </div>
  );
}
