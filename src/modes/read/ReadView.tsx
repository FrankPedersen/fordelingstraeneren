import { useEffect, useState } from 'react';
import { SUIT_SYMBOLS, suitLengths, type Card } from '../../domain/cards';
import { distributionText } from '../../domain/patterns';
import { PatternKeypad } from '../../ui/PatternKeypad';
import { Skyline } from '../../ui/Skyline';
import { checkRead, rankLabel, type ReadTask } from './task';
import { tx } from '../../i18n';
import { Info } from '../../ui/Info';

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
      ? tx('Se hånden, og tryk Klar', 'Look at the hand, and tap Ready')
      : tx('Se hånden …', 'Look at the hand …')
    : reveal
      ? tx('Hånden', 'The hand')
      : tx('Hvilket mønster var det?', 'Which pattern was it?');

  return (
    <div className="task">
      <div className="with-info">
        <p className="prompt">{prompt}</p>
        <Info topic={tx('Lynaflæsning', 'Lightning reading')}>
          {tx(
            'Tæl farverne i hånden, og tast mønstret: de fire længder, længste først eller i vilkårlig rækkefølge. Svartiden måles fra, hånden er skjult. Under Indstillinger kan hånden vises sorteret efter farve eller kun et øjeblik.',
            'Count the suits in the hand and type the pattern: the four lengths, longest first or in any order. The answer time is measured from when the hand is hidden. Under Settings the hand can be shown sorted by suit or only for a moment.',
          )}
        </Info>
      </div>
      {reveal ? (
        <SortedHand cards={task.cards} />
      ) : showing && sorted ? (
        <div className="hand-sorted" aria-label={tx('Hånden', 'The hand')}>
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
        <div className="hand" aria-label={showing ? tx('Hånden', 'The hand') : tx('Hånden er skjult', 'The hand is hidden')}>
          {task.cards.map((card) =>
            showing ? <CardFace key={card} card={card} /> : <span key={card} className="playing-card back" />,
          )}
        </div>
      )}
      {showing && show === 'tap' && (
        <button type="button" className="btn primary" onClick={() => setHiddenAt(Date.now())}>
          {tx('Klar – skjul hånden', 'Ready – hide the hand')}
        </button>
      )}
      {answer === undefined && (
        <PatternKeypad disabled={showing} onPattern={(lengths) => onAnswer(lengths, hiddenAt ?? Date.now())} />
      )}
      {typed && !reveal && (
        <p className="note">
          {tx('Dit svar:', 'Your answer:')} {typed}
        </p>
      )}
      {reveal && (
        <div className="pair">
          <div className={`choice ${right ? 'right' : 'wrong'}`}>
            <span className="muted small">{tx('Dit svar', 'Your answer')}</span>
            {skylines ? <Skyline id={typed!} /> : <strong>{typed}</strong>}
          </div>
          {!right && (
            <div className="choice right">
              <span className="muted small">
                {tx('Facit', 'Answer')} · {distributionText(suitLengths(task.cards))}
              </span>
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
