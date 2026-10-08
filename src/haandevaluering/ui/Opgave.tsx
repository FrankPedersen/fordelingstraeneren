import { SUIT_SYMBOLS } from '../../domain/cards';
import { callText, chooseCall } from '../../system/interpreter';
import { Info } from '../../ui/Info';
import { SuitText } from '../../ui/SuitText';
import type { Exercise, HandTask } from '../model/generator';
import { DECISIONS, pOf, type Strain } from '../model/pmodel';
import type { HandAnswer, Terms } from '../training/scoring';
import { pointsText } from './format';
import { Hånd } from './Hånd';
import { Meldinger } from './Meldinger';
import { Regnskab } from './Regnskab';
import { Talpanel } from './Talpanel';
import { TEXT } from './texts';

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
export function Choices<T>({ options, onPick }: { options: readonly (readonly [T, string])[]; onPick(value: T): void }) {
  return (
    <div className="he-choices" role="group" aria-label={TEXT.answers}>
      {options.map(([value, label]) => (
        <button key={label} type="button" className="choice he-choice" onClick={() => onPick(value)}>
          <SuitText text={label} />
        </button>
      ))}
    </div>
  );
}

/** Meldingernes linjer: det, der er kendt i situationen. Honnørpoint og Farve eller sans har ingen. */
export function situation(task: HandTask): string[] {
  switch (task.exercise) {
    case 'distribution':
    case 'decision':
    case 'partner':
      return [TEXT.fitFound(SUIT_SYMBOLS[task.trump])];
    case 'wasted':
      return [TEXT.fitFound(SUIT_SYMBOLS[task.trump]), TEXT.shortnessShown(SUIT_SYMBOLS[task.short])];
    case 'add': {
      const hcp = chooseCall('opening', task.hands.N)!.hcp as [number, number];
      return [TEXT.partnerOpens(callText(task.opening), `${hcp[0]}–${hcp[1]}`)];
    }
    default:
      return [];
  }
}

/** Kontrakten for en udgang i fittens farve, fx 4♠. */
export const gameIn = (trump: number) => `4${SUIT_SYMBOLS[trump]}`;

/** Majoren i Farve eller sans: fittens farve, eller parrets længste major, når der ikke er en fit. */
export function strainSuit(task: HandTask): number {
  if (task.exercise === 'strain' && task.trump !== null) return task.trump;
  const [spades, hearts] = [0, 1].map((suit) => [...task.hands.S, ...task.hands.N].filter((c) => Math.floor(c / 13) === suit).length);
  return spades >= hearts ? 0 : 1;
}

/** Opgaven: meldingerne, hænderne og spørgsmålet. Begge hænder vises kun, hvor beslutningen gælder parret. */
export function Opgave({ task, onAnswer }: { task: HandTask; onAnswer(answer: HandAnswer): void }) {
  const lines = situation(task);
  const both = task.exercise === 'decision' || task.exercise === 'strain';
  const points = (exercise: 'honors' | 'distribution' | 'partner' | 'wasted') => (value: number) => onAnswer({ exercise, points: value });

  let question;
  switch (task.exercise) {
    case 'honors':
      question = (
        <>
          <Prompt exercise="honors" text={TEXT.honorsPrompt} />
          <Talpanel onSubmit={points('honors')} />
        </>
      );
      break;
    case 'distribution':
      question = (
        <>
          <Prompt exercise="distribution" text={TEXT.distributionPrompt(SUIT_SYMBOLS[task.trump])} />
          <Talpanel onSubmit={points('distribution')} />
        </>
      );
      break;
    case 'wasted':
      question = (
        <>
          <Prompt exercise="wasted" text={TEXT.wastedPrompt(SUIT_SYMBOLS[task.short])} />
          <Talpanel onSubmit={points('wasted')} />
        </>
      );
      break;
    case 'partner': {
      // Dit regnskab vises; spørgsmålet giver alligevel din p.
      const you = pOf(task.hands.S, { trump: task.trump });
      question = (
        <>
          <Regnskab you={you} />
          <Prompt exercise="partner" text={TEXT.partnerPrompt(pointsText(you.p))} />
          <Talpanel onSubmit={points('partner')} />
        </>
      );
      break;
    }
    case 'add':
      question = (
        <>
          <Prompt exercise="add" text={TEXT.addPrompt} />
          <Choices
            options={(['honors', 'distribution', 'notrump'] as const satisfies readonly Terms[]).map((t) => [t, TEXT.terms[t]] as const)}
            onPick={(terms) => onAnswer({ exercise: 'add', terms })}
          />
        </>
      );
      break;
    case 'decision':
      question = (
        <>
          <Prompt exercise="decision" text={TEXT.decisionPrompt} />
          <Choices options={DECISIONS.map((d) => [d, TEXT.decisions[d]] as const)} onPick={(decision) => onAnswer({ exercise: 'decision', decision })} />
        </>
      );
      break;
    case 'strain': {
      question = (
        <>
          <Prompt exercise="strain" text={TEXT.strainPrompt} />
          <Choices<Strain>
            options={[
              ['major', gameIn(strainSuit(task))],
              ['notrump', '3NT'],
            ]}
            onPick={(strain) => onAnswer({ exercise: 'strain', strain })}
          />
        </>
      );
      break;
    }
  }

  return (
    <div className="task">
      {lines.length > 0 && <Meldinger lines={lines} />}
      <div className="he-hands">
        <Hånd label={TEXT.you} cards={task.hands.S} />
        {both && <Hånd label={TEXT.partner} cards={task.hands.N} />}
      </div>
      {question}
    </div>
  );
}
