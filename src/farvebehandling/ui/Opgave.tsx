import { useState, type ReactNode } from 'react';
import { SuitText } from '../../ui/SuitText';
import type { LineView } from '../analysis';
import type { FbAnswer, FbTask, LineOption } from '../training/tasks';
import { Bridgebord } from './Bridgebord';
import { Linjekort } from './Linjekort';
import { TEXT } from './texts';

interface OpgaveProps {
  task: FbTask;
  /** Selvvalgt: facit vises efter valg af linje, så gættet er valgfrit. */
  optionalGuess?: boolean;
  onAnswer(answer: Omit<FbAnswer, 'ms'>): void;
}

/** Linjerne i opgavens rækkefølge med bogstaverne A, B, C … som brugeren ser dem. */
export function letteredLines(options: readonly LineOption[]): LineView[] {
  return options.map((o, i) => ({ ...o.line, letter: String.fromCharCode(65 + i), value: o.value }));
}

/** Opgaven: problemet, linjerne uden chancer og svarfelterne. Linjer og forskel er skjult indtil svaret. */
export function Opgave({ task, optionalGuess = false, onAnswer }: OpgaveProps) {
  const [line, setLine] = useState<number | null>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const { bank, goal } = task;

  const guessGroup = (label: string) => (
    <>
      <h2 className="fb-task-heading">{label}</h2>
      <div className="fb-intervals" role="group" aria-label={label}>
        {TEXT.intervals.map((text, i) => (
          <button
            key={text}
            type="button"
            className={`btn small-btn${guess === i ? ' selected' : ''}`}
            aria-pressed={guess === i}
            onClick={() => setGuess(guess === i && optionalGuess ? null : i)}
          >
            {text}
          </button>
        ))}
      </div>
    </>
  );

  const submit = (ready: boolean, answer: Omit<FbAnswer, 'ms'>) => (
    <button type="button" className="btn primary wide" disabled={!ready} onClick={() => onAnswer(answer)}>
      {TEXT.answer}
    </button>
  );

  let body: ReactNode;
  switch (task.type) {
    case 'vælg-linjen':
    case 'nyt-mål':
    case 'optælling': {
      const lines = letteredLines(task.options);
      body = (
        <>
          {task.type === 'nyt-mål' && <p>{TEXT.newGoal(task.previousGoal, goal)}</p>}
          {task.type === 'optælling' && (
            <section className="fb-counting" aria-label={TEXT.counting}>
              <h2 className="fb-task-heading">{TEXT.counting}</h2>
              <p className="fb-note">{TEXT.countingHelp}</p>
              {(['west', 'east'] as const).map((seat) => (
                <p key={seat}>
                  <SuitText
                    text={TEXT.shown(
                      seat === 'west' ? TEXT.west : TEXT.east,
                      task.shown.suits.map((s, i) => `${TEXT.suitSymbols[s]} ${task.shown[seat][i]}`).join(' · '),
                      task.vacant[seat],
                    )}
                  />
                </p>
              ))}
              <p className="fb-note">{TEXT.countingNote}</p>
            </section>
          )}
          <h2 className="fb-task-heading">{TEXT.chooseLine}</h2>
          <div className="fb-options">
            {lines.map((l, i) => (
              <Linjekort key={l.letter} line={l} hideResult selected={line === i} onSelect={() => setLine(i)} />
            ))}
          </div>
          {guessGroup(optionalGuess ? TEXT.guessOptional : TEXT.guessPrompt(goal))}
          {submit(line !== null && (guess !== null || optionalGuess), {
            line: line ?? undefined,
            ...(guess !== null ? { guess } : {}),
          })}
        </>
      );
      break;
    }
    case 'chancen':
      body = (
        <>
          <h2 className="fb-task-heading">{TEXT.theLine}</h2>
          <Linjekort line={{ ...task.line.line, letter: 'A' }} hideResult />
          {guessGroup(TEXT.guessPrompt(goal))}
          {submit(guess !== null, { guess: guess ?? undefined })}
        </>
      );
      break;
    case 'linje-mod-linje':
      body = (
        <>
          <h2 className="fb-task-heading">{TEXT.pickBest}</h2>
          <div className="fb-options">
            {letteredLines(task.options).map((l, i) => (
              <Linjekort key={l.letter} line={l} hideResult onSelect={() => onAnswer({ line: i })} />
            ))}
          </div>
        </>
      );
      break;
    case 'find-hullet':
      body = (
        <>
          <h2 className="fb-task-heading">{TEXT.theLine}</h2>
          <Linjekort line={{ ...task.line.line, letter: 'A' }} hideResult />
          <h2 className="fb-task-heading">{TEXT.findHole}</h2>
          <div className="fb-options" role="group" aria-label={TEXT.findHole}>
            {task.fields.map((f) => (
              <button key={f.id} type="button" className="btn wide fb-hole" onClick={() => onAnswer({ field: f.id })}>
                {TEXT.layout(f.west, f.east)}
              </button>
            ))}
          </div>
        </>
      );
      break;
  }

  return (
    <section className="card fb-task" aria-label={TEXT.goalPrompt(goal)}>
      <Bridgebord north={bank.north} south={bank.south} />
      <p className="prompt">{TEXT.goalPrompt(goal)}</p>
      {body}
    </section>
  );
}
