import { useEffect, useState } from 'react';
import { SUIT_SYMBOLS, suitLengths, type Card } from '../../domain/cards';
import { distributionText } from '../../domain/patterns';
import { PatternKeypad } from '../../ui/PatternKeypad';
import { Skyline } from '../../ui/Skyline';
import { checkRead, rankLabel, type ReadTask } from './task';

interface ReadViewProps {
  task: ReadTask;
  /** De tastede længder; så låses opgaven. */
  answer?: number[];
  reveal: boolean;
  skylines: boolean;
  /** tap: hånden vises, til brugeren trykker Klar. timed: hånden vises i t ms. */
  show: 'tap' | 'timed';
  /** Kortene sorteres efter farve som hjælp. */
  sorted: boolean;
  /** Svaret og tidspunktet, hånden forsvandt (svartiden måles derfra). */
  onAnswer(lengths: number[], hiddenAt: number): void;
}

const suitOf = (card: Card) => Math.floor(card / 13);
const isRed = (card: Card) => suitOf(card) === 1 || suitOf(card) === 2;

/** Hånden vises, til brugeren trykker Klar, eller i t millisekunder; derefter tastes mønstret. */
export function ReadView({ task, answer, reveal, skylines, show, sorted, onAnswer }: ReadViewProps) {
  const [hiddenAt, setHiddenAt] = useState<number | null>(null);

  useEffect(() => {
    if (show !== 'timed') return;
    const timer = setTimeout(() => setHiddenAt(Date.now()), task.showMs);
    return () => clearTimeout(timer);
  }, [show, task.showMs]);

  const showing = hiddenAt === null && answer === undefined;
  const typed = answer?.join('-');
  const right = answer !== undefined && checkRead(task, answer);
  const prompt = showing
    ? show === 'tap'
      ? 'Se hånden, og tryk Klar'
      : 'Se hånden …'
    : reveal
      ? 'Hånden'
      : 'Hvilket mønster var det?';

  return (
    <div className="task">
      <p className="prompt">{prompt}</p>
      {reveal ? (
        <SortedHand cards={task.cards} />
      ) : showing && sorted ? (
        <div className="hand-sorted" aria-label="Hånden">
          {SUIT_SYMBOLS.map((symbol, suit) => {
            const cards = task.cards.filter((c) => suitOf(c) === suit).sort((a, b) => b - a);
            return cards.length === 0 ? null : (
              <div key={symbol} className="hand">
                {cards.map((card) => (
                  <CardFace key={card} card={card} />
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="hand" aria-label={showing ? 'Hånden' : 'Hånden er skjult'}>
          {task.cards.map((card) =>
            showing ? <CardFace key={card} card={card} /> : <span key={card} className="playing-card back" />,
          )}
        </div>
      )}
      {showing && show === 'tap' && (
        <button type="button" className="btn primary" onClick={() => setHiddenAt(Date.now())}>
          Klar – skjul hånden
        </button>
      )}
      {answer === undefined && (
        <PatternKeypad disabled={showing} onPattern={(lengths) => onAnswer(lengths, hiddenAt ?? Date.now())} />
      )}
      {typed && !reveal && <p className="note">Dit svar: {typed}</p>}
      {reveal && (
        <div className="pair">
          <div className={`choice ${right ? 'right' : 'wrong'}`}>
            <span className="muted small">Dit svar</span>
            {skylines ? <Skyline id={typed!} /> : <strong>{typed}</strong>}
          </div>
          {!right && (
            <div className="choice right">
              <span className="muted small">Facit · {distributionText(suitLengths(task.cards))}</span>
              {skylines ? <Skyline id={task.patternId} /> : <strong>{task.patternId}</strong>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CardFace({ card }: { card: Card }) {
  return (
    <span className={`playing-card${isRed(card) ? ' red' : ''}`}>
      <span>{rankLabel(card % 13)}</span>
      <span>{SUIT_SYMBOLS[suitOf(card)]}</span>
    </span>
  );
}

/** Hånden sorteret farve for farve, til facit. */
function SortedHand({ cards }: { cards: Card[] }) {
  return (
    <div className="sorted-hand">
      {SUIT_SYMBOLS.map((symbol, suit) => {
        const ranks = cards
          .filter((c) => suitOf(c) === suit)
          .map((c) => c % 13)
          .sort((a, b) => b - a);
        return (
          <p key={symbol} className={suit === 1 || suit === 2 ? 'red' : ''}>
            <span className="suit">{symbol}</span> {ranks.length ? ranks.map(rankLabel).join(' ') : '–'}
            <span className="muted"> ({ranks.length})</span>
          </p>
        );
      })}
    </div>
  );
}
