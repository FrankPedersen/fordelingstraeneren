import { useEffect, useRef, useState } from 'react';
import { formatDecimal, formatInt } from '../../engine/format';
import { randomSeed } from '../../engine/rng';
import { PHASE_MS } from '../../engine/session';
import type { Saved } from '../../engine/storage';
import { comboMultiplier, type Stake } from '../../engine/xp';
import { imageOf } from '../../memory/images';
import { HintBox, MemoryBox, PresentationCard } from '../../memory/MemoryViews';
import { routeOf } from '../../memory/palace';
import { HINT_COST, supportPlan } from '../../memory/support';
import { CompleteView } from '../../modes/complete/CompleteView';
import { HigherLowerView } from '../../modes/higherLower/HigherLowerView';
import { PalaceView } from '../../modes/palace/PalaceView';
import { secondsText, xpText } from '../../ui/text';
import { useNow } from '../../ui/useNow';
import { gradeProgress } from '../progression';
import {
  finishSession,
  introducePattern,
  nextStep,
  outlook,
  startSession,
  submitAnswer,
  type Answer,
  type Feedback,
  type Phase,
  type SessionState,
  type Step,
  type TaskStep,
} from '../session';

const PHASE_LABEL: Record<Phase, string> = {
  review: 'Repetition',
  level: 'Niveauøvelse',
  lightning: 'Lynrunde',
  repeat: 'Gentagelse',
  status: 'Status',
};

/** Hele sessionens længde, til fremdriftsbjælken. */
const SESSION_MS = 300_000;

type View =
  | { kind: 'step'; step: Step; shownAt: number; hint?: boolean }
  | { kind: 'stake'; step: TaskStep; answer: Answer; shownAt: number; answeredAt: number; hint: boolean }
  | { kind: 'feedback'; step: TaskStep; answer: Answer; feedback: Feedback; hint: boolean };

interface Run {
  session: SessionState;
  view: View;
  /** Sat, når sessionen er gennemført: blev ugens joker brugt? */
  jokerUsed?: boolean;
}

function begin(saved: Saved): Run {
  const now = Date.now();
  const { state, step } = nextStep(startSession(saved, now), saved, now, randomSeed);
  return { session: state, view: { kind: 'step', step, shownAt: now } };
}

const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

interface SessionScreenProps {
  saved: Saved;
  onSave(saved: Saved): void;
  onExit(): void;
}

export function SessionScreen({ saved, onSave, onExit }: SessionScreenProps) {
  // Refs holder den nyeste tilstand, så også forsinkede kald (lynrunden) ser den.
  const savedRef = useRef(saved);
  savedRef.current = saved;
  const [run, setRunState] = useState<Run>(() => begin(saved));
  const runRef = useRef(run);
  const [confirmExit, setConfirmExit] = useState(false);
  const now = useNow(250);

  function setRun(next: Run) {
    runRef.current = next;
    setRunState(next);
  }

  function save(next: Saved) {
    savedRef.current = next;
    onSave(next);
  }

  function advance(session: SessionState) {
    const t = Date.now();
    const { state, step } = nextStep(session, savedRef.current, t, randomSeed);
    if (step.type === 'status') {
      const before = savedRef.current;
      const done = finishSession(state, before, t);
      save(done);
      const jokerUsed = done.streak.jokerWeek !== before.streak.jokerWeek;
      setRun({ session: state, view: { kind: 'step', step, shownAt: t }, jokerUsed });
      return;
    }
    setRun({ session: state, view: { kind: 'step', step, shownAt: t } });
  }

  function submit(step: TaskStep, answer: Answer, shownAt: number, answeredAt: number, hint: boolean, stake?: Stake) {
    const timing = { shownAt, answeredAt };
    const r = submitAnswer(runRef.current.session, savedRef.current, step, answer, timing, { stake, hint });
    save(r.saved);
    setRun({ session: r.state, view: { kind: 'feedback', step, answer, feedback: r.feedback, hint } });
  }

  function answerTask(step: TaskStep, answer: Answer, shownAt: number, hint: boolean) {
    const answeredAt = Date.now();
    if (step.stake) {
      setRun({ ...runRef.current, view: { kind: 'stake', step, answer, shownAt, answeredAt, hint } });
    } else {
      submit(step, answer, shownAt, answeredAt, hint);
    }
  }

  function introduce(patternId: string) {
    const r = introducePattern(runRef.current.session, savedRef.current, patternId, Date.now());
    save(r.saved);
    advance(r.state);
  }

  /** Tryk fra en visning, der allerede er forladt (fx et dobbelttryk), ignoreres. */
  const isCurrent = (v: View) => runRef.current.view === v;

  // Lynrunden går selv videre efter et kort blik på svaret.
  useEffect(() => {
    const view = run.view;
    if (view.kind !== 'feedback' || view.step.phase !== 'lightning') return;
    const delay = view.feedback.score === 1 ? 600 : 1500;
    const timer = setTimeout(() => isCurrent(view) && advance(runRef.current.session), delay);
    return () => clearTimeout(timer);
    // advance læser den nyeste tilstand gennem refs, så effekten afhænger kun af visningen.
  }, [run.view]);

  const { session, view } = run;
  const current = view.step;
  const phase: Phase =
    current.type === 'task'
      ? current.phase
      : current.type === 'present'
        ? current.next.phase
        : current.type === 'intro'
          ? 'level'
          : 'status';
  const finished = phase === 'status';
  const inLightning = phase === 'lightning' && session.lightningStartedAt !== undefined;
  const lightningLeft = Math.min(PHASE_MS.lightning, PHASE_MS.lightning - (now - (session.lightningStartedAt ?? now)));
  const elapsed = now - session.startedAt;

  let content;
  if (current.type === 'status') {
    content = <StatusView session={session} saved={saved} jokerUsed={run.jokerUsed ?? false} onDone={onExit} />;
  } else if (current.type === 'intro') {
    content = (
      <PresentationCard
        saved={saved}
        patternId={current.patternId}
        title="Nyt mønster"
        onContinue={() => isCurrent(view) && introduce(current.patternId)}
      />
    );
  } else if (current.type === 'present') {
    content = (
      <PresentationCard
        saved={saved}
        patternId={current.patternId}
        title="Husk"
        onContinue={() =>
          isCurrent(view) && setRun({ ...runRef.current, view: { kind: 'step', step: current.next, shownAt: Date.now() } })
        }
      />
    );
  } else {
    const step = current;
    const plan = supportPlan(step.support);
    const image = imageOf(saved, step.task.patternId);
    const hint = view.hint ?? false;
    const canHint = step.phase !== 'lightning' && plan.hint !== 'none' && image !== null;
    content = (
      <>
        <TaskView
          key={`${step.phase}-${step.task.seed}`}
          step={step}
          saved={saved}
          answer={view.kind === 'step' ? undefined : view.answer}
          reveal={view.kind === 'feedback'}
          skylines={plan.after !== 'facit'}
          onAnswer={(a) => view.kind === 'step' && isCurrent(view) && answerTask(step, a, view.shownAt, hint)}
        />
        {canHint && hint && view.kind !== 'feedback' && <HintBox image={image} />}
        {canHint && !hint && view.kind === 'step' && (
          <button
            type="button"
            className="btn hint-btn"
            onClick={() => isCurrent(view) && setRun({ ...runRef.current, view: { ...view, hint: true } })}
          >
            Vis ledetråd{plan.hint === 'paid' ? ` (−${HINT_COST} XP)` : ''}
          </button>
        )}
        {view.kind === 'stake' && (
          <StakePrompt
            onStake={(stake) =>
              isCurrent(view) && submit(step, view.answer, view.shownAt, view.answeredAt, view.hint, stake)
            }
          />
        )}
        {view.kind === 'feedback' && (
          <>
            <FeedbackBar
              feedback={view.feedback}
              auto={step.phase === 'lightning'}
              onNext={() => isCurrent(view) && advance(runRef.current.session)}
            />
            {step.phase !== 'lightning' && plan.after !== 'facit' && (
              <MemoryBox saved={saved} patternId={step.task.patternId} full={plan.after === 'full'} />
            )}
          </>
        )}
      </>
    );
  }

  return (
    <main className="screen session">
      <header className="session-bar">
        <span className="phase">{PHASE_LABEL[phase]}</span>
        <span className="session-meta">
          {inLightning ? `${clock(lightningLeft)} · ${session.lightning.correct} rigtige` : xpText(session.xp)}
        </span>
        <button
          type="button"
          className="round"
          aria-label={finished ? 'Luk' : 'Afbryd sessionen'}
          onClick={() => (finished ? onExit() : setConfirmExit(true))}
        >
          ✕
        </button>
      </header>
      <div className="progress" aria-hidden="true">
        <span style={{ width: `${Math.min(100, (elapsed / SESSION_MS) * 100)}%` }} />
      </div>

      {content}

      {confirmExit && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="exit-title">
          <div className="dialog">
            <h2 id="exit-title">Afbryd sessionen?</h2>
            <p>Dine svar er gemt, men dagen tæller først i din streak, når en session er gennemført.</p>
            <div className="actions">
              <button type="button" className="btn primary" onClick={() => setConfirmExit(false)}>
                Fortsæt sessionen
              </button>
              <button type="button" className="btn" onClick={onExit}>
                Afbryd
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

interface TaskViewProps {
  step: TaskStep;
  saved: Saved;
  answer?: Answer;
  reveal: boolean;
  /** Facit med skylines; på støtteniveau 0 vises kun rigtigt/forkert og facit. */
  skylines: boolean;
  onAnswer(answer: Answer): void;
}

function TaskView({ step, saved, answer, reveal, skylines, onAnswer }: TaskViewProps) {
  const { task } = step;
  switch (task.kind) {
    case 'higher-lower':
      return (
        <HigherLowerView
          task={task}
          chosen={answer?.kind === 'higher-lower' ? answer.choice : undefined}
          reveal={reveal}
          onAnswer={(choice) => onAnswer({ kind: 'higher-lower', choice })}
        />
      );
    case 'complete':
      return (
        <CompleteView
          task={task}
          submitted={answer?.kind === 'complete' ? answer.patterns : undefined}
          reveal={reveal}
          skylines={skylines}
          onAnswer={(patterns) => onAnswer({ kind: 'complete', patterns })}
        />
      );
    case 'palace':
      return (
        <PalaceView
          task={task}
          route={routeOf(saved, gradeProgress(saved).level)}
          answer={answer?.kind === 'palace' ? answer.answer : undefined}
          reveal={reveal}
          skylines={skylines}
          onAnswer={(a) => onAnswer({ kind: 'palace', answer: a })}
        />
      );
  }
}

function StakePrompt({ onStake }: { onStake(stake: Stake): void }) {
  return (
    <section className="stake" aria-label="Indsats">
      <p className="prompt">Hvor sikker er du?</p>
      <div className="two">
        <button type="button" className="btn primary" onClick={() => onStake('sure')}>
          Sikker
        </button>
        <button type="button" className="btn" onClick={() => onStake('guess')}>
          Gæt
        </button>
      </div>
      <p className="muted small">Sikker: +15 XP ved rigtigt, −10 ved forkert. Gæt: +5 ved rigtigt.</p>
    </section>
  );
}

const SCORE_TEXT = {
  1: '✓ Rigtigt',
  0.5: '½ Halv score – rigtige mønstre, forkert rækkefølge',
  0: '✗ Forkert',
} as const;

function FeedbackBar({ feedback, auto, onNext }: { feedback: Feedback; auto: boolean; onNext(): void }) {
  const multiplier = comboMultiplier(feedback.combo);
  const meta = [
    xpText(feedback.xp) + (feedback.hintCost ? ` (ledetråd −${feedback.hintCost})` : ''),
    secondsText(feedback.ms) + (feedback.fast && feedback.score === 1 ? ' – hurtigt' : ''),
    feedback.combo >= 5 && `${feedback.combo} i træk, combo ×${formatDecimal(multiplier, multiplier % 1 ? 1 : 0)}`,
  ].filter(Boolean);
  return (
    <section className={`feedback ${feedback.score === 1 ? 'ok' : 'bad'}`} role="status">
      <p className="feedback-title">{SCORE_TEXT[feedback.score]}</p>
      <p className="feedback-meta">{meta.join(' · ')}</p>
      {!auto && (
        <button type="button" className="btn primary" onClick={onNext} autoFocus>
          Næste
        </button>
      )}
    </section>
  );
}

interface StatusViewProps {
  session: SessionState;
  saved: Saved;
  jokerUsed: boolean;
  onDone(): void;
}

function StatusView({ session, saved, jokerUsed, onDone }: StatusViewProps) {
  const record = saved.sessions.at(-1);
  const next = outlook(saved, Date.now());
  const days = saved.streak.current;
  return (
    <section className="status">
      <h1>Session gennemført</h1>
      <dl className="facts">
        <div>
          <dt>Streak</dt>
          <dd>{days === 1 ? '1 dag' : `${days} dage`} i træk</dd>
        </div>
        <div>
          <dt>XP</dt>
          <dd>
            {xpText(session.xp)} · {formatInt(saved.xp)} i alt
          </dd>
        </div>
        <div>
          <dt>Rigtige</dt>
          <dd>
            {session.correct} af {session.total}
          </dd>
        </div>
        <div>
          <dt>Dagens kurvepunkt</dt>
          <dd>{formatDecimal(record?.cpm ?? 0, 1)} rigtige/min i lynrunden</dd>
        </div>
      </dl>
      {jokerUsed && <p>Ugens joker dækkede en glemt dag, så din streak lever.</p>}
      <p>
        I morgen: {next.due === 1 ? '1 emne' : `${next.due} emner`} til repetition
        {next.fresh > 0 && ` og ${next.fresh === 1 ? '1 nyt mønster' : `${next.fresh} nye mønstre`}`}.
      </p>
      <div className="spacer" />
      <button type="button" className="btn primary wide" onClick={onDone} autoFocus>
        Færdig
      </button>
    </section>
  );
}
