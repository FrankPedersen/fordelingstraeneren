import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Card } from '../../domain/cards';
import { hcpOf } from '../../system/interpreter';
import { Info } from '../../ui/Info';
import { NumberPad } from '../../ui/NumberPad';
import { SuitText } from '../../ui/SuitText';
import type { Exercise, PlacementTask, PointTask } from '../model/generator';
import type { Placement } from '../model/solver';
import type { PointAnswer } from '../training/scoring';
import { lengthsText } from './format';
import { Hånd } from './Hånd';
import { Honnørchips } from './Honnørchip';
import { Ledetråde } from './Ledetråde';
import { Meldelinje } from './Meldelinje';
import { Regnskabspanel } from './Regnskabspanel';
import { TEXT, type Note } from './texts';

interface OpgaveProps {
  task: PointTask;
  /** Visningstiden pr. honnør i løbende tælling (og fra niveau 4). */
  showMs: number;
  /** Spørgsmålet vises nu; tiden til svaret regnes herfra. */
  onQuestion?(): void;
  onAnswer(answer: PointAnswer): void;
}

/** Vises honnørerne én ad gangen? I Løbende tælling og fra niveau 4. */
export const flashes = (task: PointTask): boolean => task.exercise === 'running' || (task.exercise !== 'sum' && task.level >= 4);

/** Spørgsmålet med ⓘ for øvelsen. */
function Prompt({ exercise, text }: { exercise: Exercise; text: string }) {
  return (
    <div className="with-info">
      <p className="prompt">
        <SuitText text={text} />
      </p>
      <Info topic={TEXT.exercises[exercise]}>{TEXT.help.exercises[exercise]}</Info>
    </div>
  );
}

/** Svarknapperne. */
function Choices<T>({ options, onPick }: { options: readonly (readonly [T, string])[]; onPick(value: T): void }) {
  return (
    <div className="pr-choices" role="group" aria-label={TEXT.answers}>
      {options.map(([value, label]) => (
        <button key={label} type="button" className="choice pr-choice" onClick={() => onPick(value)}>
          {label}
        </button>
      ))}
    </div>
  );
}

/** Opgaven: situationen, kortene, regnskabet og spørgsmålet. */
export function Opgave({ task, showMs, onQuestion, onAnswer }: OpgaveProps) {
  const clues = task.exercise === 'sum' ? [] : task.clues;
  const flash = flashes(task) && clues.length > 0;
  // Antal honnører, der er vist i den løbende visning.
  const [step, setStep] = useState(flash ? 0 : clues.length);
  const asked = step >= clues.length;
  const questioned = useRef(false);
  // Forælderen tegner igen hvert sekund (uret); timeren må ikke starte forfra af den grund.
  const onQuestionRef = useRef(onQuestion);
  onQuestionRef.current = onQuestion;

  useEffect(() => {
    if (asked) {
      if (!questioned.current) {
        questioned.current = true;
        onQuestionRef.current?.();
      }
      return;
    }
    const id = setTimeout(() => setStep(step + 1), showMs);
    return () => clearTimeout(id);
  }, [asked, step, showMs]);

  const flashing = !asked && (
    <div className="pr-flash" role="status" aria-live="polite">
      <p className="pr-note">{TEXT.watch}</p>
      <p className="pr-flash-card">
        <SuitText text={TEXT.plays(TEXT.seat[clues[step]?.seat ?? 'W'], TEXT.card(clues[step]?.card ?? 0))} />
      </p>
      <p className="pr-note">{TEXT.clueCounter(step + 1, clues.length)}</p>
    </div>
  );

  if (task.exercise === 'sum') {
    return (
      <div className="task">
        <Hånd label={TEXT.dummy} cards={task.hands.N} />
        <Hånd label={TEXT.you} cards={task.hands.S} />
        <Prompt exercise="sum" text={TEXT.sumPrompt} />
        <NumberPad onSubmit={(points) => onAnswer({ exercise: 'sum', points })} />
      </div>
    );
  }

  if (task.exercise === 'running') {
    return <div className="task">{asked ? <RunningAnswer onAnswer={onAnswer} /> : flashing}</div>;
  }

  return <PlacementView task={task} flashing={flashing} asked={asked} onAnswer={onAnswer} />;
}

/** Løbende tælling: først Vests point, så Østs. */
function RunningAnswer({ onAnswer }: { onAnswer(answer: PointAnswer): void }) {
  const [west, setWest] = useState<number | null>(null);
  return west === null ? (
    <>
      <Prompt exercise="running" text={TEXT.runningWest} />
      <NumberPad key="W" onSubmit={setWest} />
    </>
  ) : (
    <>
      <p className="pr-note">
        {TEXT.runningWest} {west}
      </p>
      <Prompt exercise="running" text={TEXT.runningEast} />
      <NumberPad key="E" onSubmit={(east) => onAnswer({ exercise: 'running', W: west, E: east })} />
    </>
  );
}

function PlacementView({
  task,
  flashing,
  asked,
  onAnswer,
}: {
  task: PlacementTask;
  flashing: ReactNode;
  asked: boolean;
  onAnswer(answer: PointAnswer): void;
}) {
  const [notes, setNotes] = useState<Partial<Record<Card, Note>>>({});
  const hidden = task.level >= 4;
  const card = TEXT.card(task.card);
  const { W, E } = task.ledger;
  const placementOptions = (unsure: string) =>
    [
      ['W', TEXT.seat.W],
      ['E', TEXT.seat.E],
      ['open', unsure],
    ] as const satisfies readonly (readonly [Placement, string])[];

  let question;
  if (task.exercise === 'can') {
    question = (
      <>
        <Prompt exercise="can" text={TEXT.canPrompt(TEXT.seat[task.asked!], card)} />
        <Choices
          options={[
            [true, TEXT.yes],
            [false, TEXT.no],
          ]}
          onPick={(yes) => onAnswer({ exercise: 'can', yes })}
        />
      </>
    );
  } else {
    const exercise = task.exercise;
    question = (
      <>
        <Prompt exercise={exercise} text={exercise === 'finesse' ? TEXT.finessePrompt(card) : TEXT.whoPrompt(card)} />
        <Choices
          options={placementOptions(exercise === 'finesse' ? TEXT.guess : TEXT.cantTell)}
          onPick={(placement) => onAnswer({ exercise, placement })}
        />
      </>
    );
  }

  return (
    <div className="task">
      <Meldelinje auction={task.auction} />
      <Hånd label={TEXT.dummy} cards={task.hands.N} hp={hcpOf(task.hands.N)} />
      <Hånd label={TEXT.you} cards={task.hands.S} hp={hcpOf(task.hands.S)} />
      <p className="pr-total">{TEXT.opponentsHave(task.m)}</p>
      {W.lengths && E.lengths && (
        <div className="with-info">
          <p className="pr-note">
            {TEXT.lengths}: {TEXT.lengthsLine(lengthsText(W.lengths), lengthsText(E.lengths))}
          </p>
          <Info topic={TEXT.lengths}>{TEXT.help.lengths}</Info>
        </div>
      )}
      {!hidden && <Regnskabspanel ledger={task.ledger} />}
      {asked ? (
        <>
          {!hidden && <Ledetråde clues={task.clues} />}
          <Honnørchips
            unseen={task.ledger.unseen}
            notes={notes}
            disabled={hidden}
            onNote={(c, note) => setNotes({ ...notes, [c]: note })}
          />
          {question}
        </>
      ) : (
        flashing
      )}
    </div>
  );
}
