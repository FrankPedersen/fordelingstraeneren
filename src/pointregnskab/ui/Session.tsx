import { useCallback, useState } from 'react';
import { dayOf } from '../../engine/dates';
import { formatDecimal, formatInt } from '../../engine/format';
import { randomSeed } from '../../engine/rng';
import { streakOn } from '../../engine/streak';
import { Info } from '../../ui/Info';
import { useNow } from '../../ui/useNow';
import type { PrSaved } from '../storage';
import type { DeckAnswer } from '../training/deck';
import type { Graded, PointAnswer } from '../training/scoring';
import { answerDeck, answerPrTask, nextPrStep, PR_PHASE_MS, questionShown, startPrSession, type PrSession } from '../training/session';
import { Facit } from './Facit';
import { Opgave } from './Opgave';
import { Opvarmning } from './Opvarmning';
import { TEXT } from './texts';

interface SessionProps {
  saved: PrSaved;
  update(next: PrSaved): void;
  onExit(): void;
}

const SESSION_MS = PR_PHASE_MS.warmup + PR_PHASE_MS.sum + PR_PHASE_MS.level + PR_PHASE_MS.status;

type Result = { kind: 'deck'; ok: boolean; xp: number } | { kind: 'task'; answer: PointAnswer; graded: Graded };

/** Den daglige session: opvarmning, regnestykket, niveau og status. Status registrerer sessionen og streaken. */
export function Session({ saved, update, onExit }: SessionProps) {
  const [session, setSession] = useState<PrSession>(() => {
    const now = Date.now();
    return nextPrStep(startPrSession(saved, now, randomSeed()), saved, now).session;
  });
  const [result, setResult] = useState<Result | null>(null);
  const [levelBefore] = useState(saved.level);
  const now = useNow(1000);
  const step = session.step!;
  const onQuestion = useCallback(() => setSession((s) => questionShown(s, Date.now())), []);

  function advance() {
    const r = nextPrStep(session, saved, Date.now());
    if (r.saved !== saved) update(r.saved);
    setResult(null);
    setSession(r.session);
  }

  if (step.kind === 'status') {
    const today = dayOf(Date.now(), saved.settings.dayStartsAtHour);
    return (
      <section className="card" aria-labelledby="pr-status">
        <div className="with-info">
          <h2 id="pr-status">{TEXT.sessionDone}</h2>
          <Info topic={TEXT.phases.status}>{TEXT.help.status}</Info>
        </div>
        <p>{TEXT.sessionScore(formatDecimal(session.correct, session.correct % 1 ? 1 : 0), session.total)}</p>
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
        onAnswer={(a: DeckAnswer) => {
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
        showMs={saved.runningMs}
        onQuestion={onQuestion}
        onAnswer={(a) => {
          const r = answerPrTask(session, saved, a, Date.now());
          update(r.saved);
          setSession({ ...r.session, step });
          setResult({ kind: 'task', answer: a, graded: r.graded });
        }}
      />
    );
  }
  const progress = Math.min(100, (100 * (now - session.started)) / SESSION_MS);
  return (
    <div className="pr-session">
      <div className="session-bar">
        <span className="phase">{TEXT.phases[session.phase]}</span>
        <span className="session-meta">{TEXT.sessionMeta(session.xp, session.boss)}</span>
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
