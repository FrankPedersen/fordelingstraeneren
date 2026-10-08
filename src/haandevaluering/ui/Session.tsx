import { useState } from 'react';
import { dayOf } from '../../engine/dates';
import { formatInt } from '../../engine/format';
import { randomSeed } from '../../engine/rng';
import { streakOn } from '../../engine/streak';
import { Info } from '../../ui/Info';
import { useNow } from '../../ui/useNow';
import type { HeSaved } from '../storage';
import type { Graded, HandAnswer } from '../training/scoring';
import { answerDeck, answerHeTask, HE_PHASE_MS, nextHeStep, startHeSession, type HeSession } from '../training/session';
import { Facit } from './Facit';
import { Opgave } from './Opgave';
import { Opvarmning } from './Opvarmning';
import { TEXT } from './texts';

interface SessionProps {
  saved: HeSaved;
  update(next: HeSaved): void;
  onExit(): void;
}

const SESSION_MS = HE_PHASE_MS.warmup + HE_PHASE_MS.lightning + HE_PHASE_MS.level + HE_PHASE_MS.status;

type Result = { kind: 'deck'; ok: boolean; xp: number } | { kind: 'task'; answer: HandAnswer; graded: Graded };

/** Den daglige session: opvarmning, lynrunde, niveauopgaver og status. Status registrerer sessionen og streaken. */
export function Session({ saved, update, onExit }: SessionProps) {
  const [session, setSession] = useState<HeSession>(() => {
    const now = Date.now();
    return nextHeStep(startHeSession(saved, now, randomSeed()), saved, now).session;
  });
  const [result, setResult] = useState<Result | null>(null);
  const [levelBefore] = useState(saved.level);
  const now = useNow(1000);
  const step = session.step!;

  function advance() {
    const r = nextHeStep(session, saved, Date.now());
    if (r.saved !== saved) update(r.saved);
    setResult(null);
    setSession(r.session);
  }

  if (step.kind === 'status') {
    const today = dayOf(Date.now(), saved.settings.dayStartsAtHour);
    return (
      <section className="card" aria-labelledby="he-status">
        <div className="with-info">
          <h2 id="he-status">{TEXT.sessionDone}</h2>
          <Info topic={TEXT.phases.status}>{TEXT.help.status}</Info>
        </div>
        <p>{TEXT.sessionScore(session.correct, session.total)}</p>
        <p>{TEXT.sessionXp(session.xp)}</p>
        <div className="stats">
          <div className="stat">
            <span className="stat-value">{streakOn(saved.streak, today).current}</span>
            <span className="stat-label">{TEXT.streak}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{formatInt(saved.xp)}</span>
            <span className="stat-label">{TEXT.xp}</span>
          </div>
        </div>
        <p>
          {levelBefore !== saved.level && '↕ '}
          {TEXT.levelNow(saved.level, TEXT.levelNames[saved.level])}
        </p>
        <button type="button" className="btn primary wide" onClick={onExit}>
          {TEXT.toHome}
        </button>
      </section>
    );
  }

  let content;
  if (step.kind === 'deck') {
    content = (
      <Opvarmning
        key={session.count}
        task={step.task}
        result={result?.kind === 'deck' ? result : undefined}
        onAnswer={(a) => {
          const r = answerDeck(session, saved, a, Date.now());
          update(r.saved);
          setSession({ ...r.session, step });
          setResult({ kind: 'deck', ok: r.ok, xp: r.xp });
        }}
        onNext={advance}
      />
    );
  } else if (result?.kind === 'task') {
    content = <Facit task={step.task} answer={result.answer} graded={result.graded} onNext={advance} />;
  } else {
    content = (
      <Opgave
        key={session.count}
        task={step.task}
        onAnswer={(a) => {
          const r = answerHeTask(session, saved, a, Date.now());
          update(r.saved);
          setSession({ ...r.session, step });
          setResult({ kind: 'task', answer: a, graded: r.graded });
        }}
      />
    );
  }
  const progress = Math.min(100, (100 * (now - session.started)) / SESSION_MS);
  return (
    <div className="he-session">
      <div className="session-bar">
        <span className="phase">{TEXT.phases[session.phase]}</span>
        <span className="session-meta">{TEXT.sessionMeta(session.xp)}</span>
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
