import { Info } from '../../ui/Info';
import { NumberPad } from '../../ui/NumberPad';
import { SuitText } from '../../ui/SuitText';
import type { DeckAnswer, DeckTask } from '../training/deck';
import { rangeText } from './format';
import { TEXT } from './texts';

interface OpvarmningProps {
  task: DeckTask;
  onAnswer(answer: DeckAnswer): void;
  /** Resultatet, når der er svaret. */
  result?: { ok: boolean; xp: number };
  onNext(): void;
}

/** Opvarmningens kort fra Leitner-bunken: en blok (tast pointene) eller et intervalkort (vælg intervallet). */
export function Opvarmning({ task, onAnswer, result, onNext }: OpvarmningProps) {
  const name = task.kind === 'block' ? task.block.ranks.map(TEXT.rank).join(' ') : TEXT.rangeNames[task.card.id];
  const facit =
    task.kind === 'block' ? TEXT.blockFacit(name, task.block.points) : TEXT.rangeFacit(name, rangeText(task.card.allowed));
  return (
    <div className="task">
      <p className="pr-eyebrow">{task.kind === 'block' ? TEXT.blocks : TEXT.rangeCards}</p>
      <p className="pr-deck-card">
        <SuitText text={name} />
      </p>
      <div className="with-info">
        <p className="prompt">{task.kind === 'block' ? TEXT.blockPrompt : TEXT.rangePrompt}</p>
        <Info topic={task.kind === 'block' ? TEXT.blocks : TEXT.rangeCards}>
          {task.kind === 'block' ? TEXT.help.blocks : TEXT.help.rangeCards}
        </Info>
      </div>
      {result ? (
        <section className={`feedback ${result.ok ? 'ok' : 'bad'}`}>
          <p className="feedback-title">{result.ok ? TEXT.right : TEXT.wrong}</p>
          <p>
            <SuitText text={facit} /> · {TEXT.gained(result.xp)}
          </p>
          <button type="button" className="btn primary wide" onClick={onNext}>
            {TEXT.next}
          </button>
        </section>
      ) : task.kind === 'block' ? (
        <NumberPad onSubmit={(points) => onAnswer({ kind: 'block', points })} />
      ) : (
        <div className="pr-choices" role="group" aria-label={TEXT.answers}>
          {task.options.map((allowed) => (
            <button key={rangeText(allowed)} type="button" className="choice pr-choice" onClick={() => onAnswer({ kind: 'range', allowed })}>
              {rangeText(allowed)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
