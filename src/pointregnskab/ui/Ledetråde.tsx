import { Info } from '../../ui/Info';
import { SuitText } from '../../ui/SuitText';
import type { Clue } from '../model/generator';
import { TEXT } from './texts';

/** Ledetrådsstrømmen: én linje pr. honnør, der er faldet, med den nyeste øverst. */
export function Ledetråde({ clues }: { clues: readonly Clue[] }) {
  return (
    <section className="pr-stream" aria-label={TEXT.latest}>
      <div className="with-info">
        <h3 className="pr-eyebrow">{TEXT.latest}</h3>
        <Info topic={TEXT.latest}>{TEXT.help.stream}</Info>
      </div>
      {clues.length ? (
        <ol className="pr-stream-list">
          {[...clues].reverse().map((c) => (
            <li key={c.card}>
              <SuitText text={TEXT.plays(TEXT.seat[c.seat], TEXT.card(c.card))} />
            </li>
          ))}
        </ol>
      ) : (
        <p className="pr-note">{TEXT.noClues}</p>
      )}
    </section>
  );
}
