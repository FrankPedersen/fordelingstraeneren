import { useEffect, useRef, useState } from 'react';
import { isoWeek } from '../../engine/dates';
import { formatDecimal, formatInt } from '../../engine/format';
import { randomSeed } from '../../engine/rng';
import { PHASE_MS } from '../../engine/session';
import type { Saved } from '../../engine/storage';
import { comboMultiplier, type Stake } from '../../engine/xp';
import { patternById } from '../../domain/patterns';
import { imageOf } from '../../memory/images';
import { HintBox, MemoryBox, PresentationCard } from '../../memory/MemoryViews';
import { routeOf } from '../../memory/palace';
import { HINT_COST, supportPlan } from '../../memory/support';
import { CompleteView } from '../../modes/complete/CompleteView';
import { EstimateView } from '../../modes/estimate/EstimateView';
import { HigherLowerView } from '../../modes/higherLower/HigherLowerView';
import { PalaceView } from '../../modes/palace/PalaceView';
import { ReadView } from '../../modes/read/ReadView';
import { SudokuView } from '../../modes/sudoku/SudokuView';
import { Klubaften } from '../../ui/Klubaften';
import { secondsText, xpText } from '../../ui/text';
import { useNow } from '../../ui/useNow';
import { gradeProgress } from '../progression';
import {
  completeSudoku,
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
import { tx } from '../../i18n';

const phaseLabel = (phase: Phase): string =>
  ({
    review: tx('Repetition', 'Review'),
    level: tx('Niveauøvelse', 'Level practice'),
    lightning: tx('Lynrunde', 'Lightning round'),
    sudoku: '13-sudoku',
    repeat: tx('Gentagelse', 'Repeat'),
    status: 'Status',
  })[phase];

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

  function sudokuDone(points: number) {
    const r = completeSudoku(runRef.current.session, savedRef.current, points);
    save(r.saved);
    advance(r.state);
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
    // Et nyt eller sjældent fund i albummet får tid til at blive fejret.
    const album = view.feedback.album;
    const delay = album && (album.first || album.rare) ? 2500 : view.feedback.score === 1 ? 600 : 1500;
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
          : current.type === 'sudoku'
            ? 'sudoku'
            : 'status';
  const finished = phase === 'status';
  const inLightning = phase === 'lightning' && session.lightningStartedAt !== undefined;
  const lightningLeft = Math.min(PHASE_MS.lightning, PHASE_MS.lightning - (now - (session.lightningStartedAt ?? now)));
  const elapsed = now - session.startedAt;

  let content;
  if (current.type === 'status') {
    content = <StatusView session={session} saved={saved} jokerUsed={run.jokerUsed ?? false} onDone={onExit} />;
  } else if (current.type === 'sudoku') {
    content = <SudokuView task={current.task} onDone={(points) => isCurrent(view) && sudokuDone(points)} />;
  } else if (current.type === 'intro') {
    content = (
      <PresentationCard
        saved={saved}
        patternId={current.patternId}
        title={tx('Nyt mønster', 'New pattern')}
        onContinue={() => isCurrent(view) && introduce(current.patternId)}
      />
    );
  } else if (current.type === 'present') {
    content = (
      <PresentationCard
        saved={saved}
        patternId={current.patternId}
        title={tx('Husk', 'Remember')}
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
          onAnswer={(a, startedAt) =>
            view.kind === 'step' && isCurrent(view) && answerTask(step, a, startedAt ?? view.shownAt, hint)
          }
        />
        {canHint && hint && view.kind !== 'feedback' && <HintBox image={image} />}
        {canHint && !hint && view.kind === 'step' && (
          <button
            type="button"
            className="btn hint-btn"
            onClick={() => isCurrent(view) && setRun({ ...runRef.current, view: { ...view, hint: true } })}
          >
            {tx('Vis ledetråd', 'Show hint')}
            {plan.hint === 'paid' ? ` (−${HINT_COST} XP)` : ''}
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
        <span className="phase">{phaseLabel(phase)}</span>
        <span className="session-meta">
          {inLightning ? `${clock(lightningLeft)} · ${session.lightning.correct} ${tx('rigtige', 'correct')}` : xpText(session.xp)}
        </span>
        <button
          type="button"
          className="round"
          aria-label={finished ? tx('Luk', 'Close') : tx('Afbryd sessionen', 'Stop the session')}
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
            <h2 id="exit-title">{tx('Afbryd sessionen?', 'Stop the session?')}</h2>
            <p>
              {tx(
                'Dine svar er gemt, men dagen tæller først i din streak, når en session er gennemført.',
                'Your answers are saved, but the day only counts in your streak when a session is completed.',
              )}
            </p>
            <div className="actions">
              <button type="button" className="btn primary" onClick={() => setConfirmExit(false)}>
                {tx('Fortsæt sessionen', 'Continue the session')}
              </button>
              <button type="button" className="btn" onClick={onExit}>
                {tx('Afbryd', 'Stop')}
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
  /** `startedAt` erstatter visningstidspunktet, når svartiden måles fra et senere tidspunkt. */
  onAnswer(answer: Answer, startedAt?: number): void;
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
    case 'read':
      return (
        <ReadView
          task={task}
          answer={answer?.kind === 'read' ? answer.lengths : undefined}
          reveal={reveal}
          skylines={skylines}
          show={saved.settings.readShow ?? 'tap'}
          sorted={saved.settings.readSorted ?? false}
          onAnswer={(lengths, hiddenAt) => onAnswer({ kind: 'read', lengths }, hiddenAt)}
        />
      );
    case 'estimate':
      return (
        <EstimateView
          task={task}
          answer={answer?.kind === 'estimate' ? answer.count : undefined}
          reveal={reveal}
          onAnswer={(count) => onAnswer({ kind: 'estimate', count })}
        />
      );
  }
}

function StakePrompt({ onStake }: { onStake(stake: Stake): void }) {
  return (
    <section className="stake" aria-label={tx('Indsats', 'Stake')}>
      <p className="prompt">{tx('Hvor sikker er du?', 'How sure are you?')}</p>
      <div className="two">
        <button type="button" className="btn primary" onClick={() => onStake('sure')}>
          {tx('Sikker', 'Sure')}
        </button>
        <button type="button" className="btn" onClick={() => onStake('guess')}>
          {tx('Gæt', 'Guess')}
        </button>
      </div>
      <p className="muted small">
        {tx('Sikker: +15 XP ved rigtigt, −10 ved forkert. Gæt: +5 ved rigtigt.', 'Sure: +15 XP if right, −10 if wrong. Guess: +5 if right.')}
      </p>
    </section>
  );
}

const scoreText = (score: 0 | 0.5 | 1): string =>
  score === 1
    ? tx('✓ Rigtigt', '✓ Right')
    : score === 0.5
      ? tx('½ Halv score – rigtige mønstre, forkert rækkefølge', '½ Half score – right patterns, wrong order')
      : tx('✗ Forkert', '✗ Wrong');

function FeedbackBar({ feedback, auto, onNext }: { feedback: Feedback; auto: boolean; onNext(): void }) {
  const multiplier = comboMultiplier(feedback.combo);
  const meta = [
    xpText(feedback.xp) + (feedback.hintCost ? ` (${tx('ledetråd', 'hint')} −${feedback.hintCost})` : ''),
    secondsText(feedback.ms) + (feedback.fast && feedback.score === 1 ? tx(' – hurtigt', ' – fast') : ''),
    feedback.combo >= 5 && `${feedback.combo} ${tx('i træk', 'in a row')}, combo ×${formatDecimal(multiplier, multiplier % 1 ? 1 : 0)}`,
  ].filter(Boolean);
  const album = feedback.album;
  const find = album && patternById(album.patternId);
  return (
    <section className={`feedback ${feedback.score === 1 ? 'ok' : 'bad'}`} role="status">
      <p className="feedback-title">{scoreText(feedback.score)}</p>
      <p className="feedback-meta">{meta.join(' · ')}</p>
      {find && album.rare && (
        <p className="find">
          {tx('Sjældent fund!', 'Rare find!')} {find.id}: {tx('1 ud af', '1 in')} {formatInt(find.oneIn)}
        </p>
      )}
      {find && album.first && (
        <p className="find">
          {tx('Nyt i albummet:', 'New in the album:')} {find.id}
        </p>
      )}
      {!auto && (
        <button type="button" className="btn primary" onClick={onNext} autoFocus>
          {tx('Næste', 'Next')}
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
      <h1>{tx('Session gennemført', 'Session complete')}</h1>
      <dl className="facts">
        <div>
          <dt>Streak</dt>
          <dd>{tx(`${days === 1 ? '1 dag' : `${days} dage`} i træk`, `${days === 1 ? '1 day' : `${days} days`} in a row`)}</dd>
        </div>
        <div>
          <dt>XP</dt>
          <dd>
            {xpText(session.xp)} · {formatInt(saved.xp)} {tx('i alt', 'in total')}
          </dd>
        </div>
        <div>
          <dt>{tx('Rigtige', 'Correct')}</dt>
          <dd>{tx(`${session.correct} af ${session.total}`, `${session.correct} of ${session.total}`)}</dd>
        </div>
        <div>
          <dt>{tx('Dagens kurvepunkt', "Today's chart point")}</dt>
          <dd>
            {formatDecimal(record?.cpm ?? 0, 1)} {tx('rigtige/min i lynrunden', 'correct/min in the lightning round')}
          </dd>
        </div>
      </dl>
      {jokerUsed && <p>{tx('Ugens joker dækkede en glemt dag, så din streak lever.', "This week's joker covered a missed day, so your streak lives on.")}</p>}
      {session.boss && <WeekStatus saved={saved} />}
      <p>
        {tx(
          `I morgen: ${next.due === 1 ? '1 emne' : `${next.due} emner`} til repetition${next.fresh > 0 ? ` og ${next.fresh === 1 ? '1 nyt mønster' : `${next.fresh} nye mønstre`}` : ''}.`,
          `Tomorrow: ${next.due === 1 ? '1 item' : `${next.due} items`} to review${next.fresh > 0 ? ` and ${next.fresh === 1 ? '1 new pattern' : `${next.fresh} new patterns`}` : ''}.`,
        )}
      </p>
      <div className="spacer" />
      <button type="button" className="btn primary wide" onClick={onDone} autoFocus>
        {tx('Færdig', 'Done')}
      </button>
    </section>
  );
}

/** Ugens status på bossens dag: ugens sessioner og klubaftenen. */
function WeekStatus({ saved }: { saved: Saved }) {
  const week = isoWeek(saved.sessions.at(-1)?.day ?? '');
  const sessions = saved.sessions.filter((s) => isoWeek(s.day) === week);
  const correct = sessions.reduce((sum, s) => sum + s.correct, 0);
  const total = sessions.reduce((sum, s) => sum + s.total, 0);
  return (
    <section className="card">
      <h2>{tx('Ugens status', "This week's status")}</h2>
      <p>
        {tx(
          `${sessions.length} ${sessions.length === 1 ? 'session' : 'sessioner'} i uge ${Number(week.slice(6))} · ${correct} af ${total} rigtige.`,
          `${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'} in week ${Number(week.slice(6))} · ${correct} of ${total} correct.`,
        )}
      </p>
      <p className="muted small">{tx('Sådan ser 100 hænder ud på en klubaften:', 'This is what 100 hands look like at a club evening:')}</p>
      <Klubaften />
    </section>
  );
}
