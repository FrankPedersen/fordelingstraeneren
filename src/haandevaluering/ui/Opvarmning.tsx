import { Info } from '../../ui/Info';
import { SuitText } from '../../ui/SuitText';
import { trickMnemonic } from '../model/pmodel';
import type { DeckTask } from '../training/deck';
import { pointsText, signedText, tricksText } from './format';
import { Choices } from './Opgave';
import { Talpanel } from './Talpanel';
import { TEXT, type DeckGroup, type ShortcutKind } from './texts';

/** Kortets spørgsmål ud fra nøglen, fx "korthed:1" → "Kortfarvepoint for en singleton?". */
function prompt(task: DeckTask): string {
  const [group, arg] = task.key.split(':') as [DeckGroup, string | undefined];
  switch (group) {
    case 'anker':
      return TEXT.anchorPrompt[arg!];
    case 'korthed':
      return TEXT.shortnessPrompt(Number(arg));
    case 'genvej':
      return TEXT.shortcutPrompt(arg as ShortcutKind);
    case 'moenster':
      return TEXT.patternPrompt(arg!);
    case 'makker':
      return TEXT.partnerPrompt(pointsText(Number(arg)));
    case 'stik':
      return TEXT.tricksPrompt(pointsText(task.kind === 'choice' ? task.P! : 0));
  }
}

/** Et svar som tekst: stik med decimal, genvejens led med fortegn, ellers point med brøk. */
function valueText(task: DeckTask, value: number): string {
  if (task.key === 'stik') return tricksText(value);
  if (task.key.startsWith('genvej:')) return signedText(value);
  return pointsText(value);
}

interface OpvarmningProps {
  task: DeckTask;
  onAnswer(answer: number): void;
  /** Resultatet, når der er svaret. */
  result?: { ok: boolean; xp: number };
  onNext(): void;
}

/** Opvarmningens kort fra Leitner-bunken: et tal på talpanelet eller ét af fire svar. */
export function Opvarmning({ task, onAnswer, result, onNext }: OpvarmningProps) {
  const group = task.key.split(':')[0] as DeckGroup;
  return (
    <div className="task">
      <div className="with-info">
        <p className="he-eyebrow">{TEXT.deckGroups[group]}</p>
        <Info topic={TEXT.deckGroups[group]}>{TEXT.help.deck[group]}</Info>
      </div>
      <p className="he-deck-card">
        <SuitText text={prompt(task)} />
      </p>
      {result ? (
        <section className={`feedback ${result.ok ? 'ok' : 'bad'}`}>
          <p className="feedback-title">
            {result.ok ? TEXT.right : TEXT.wrong} · {TEXT.gained(result.xp)}
          </p>
          <p>{TEXT.deckFacit(valueText(task, task.answer))}</p>
          {task.kind === 'choice' && task.P !== undefined && <p className="he-note">{TEXT.mnemonic(tricksText(trickMnemonic(task.P)))}</p>}
          <button type="button" className="btn primary wide" onClick={onNext}>
            {TEXT.next}
          </button>
        </section>
      ) : task.kind === 'number' ? (
        <Talpanel onSubmit={onAnswer} />
      ) : (
        <Choices options={task.options.map((v) => [v, valueText(task, v)] as const)} onPick={onAnswer} />
      )}
    </div>
  );
}
