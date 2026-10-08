import { Fragment } from 'react';
import { SUIT_SYMBOLS, type Card } from '../../domain/cards';
import { TEXT } from './texts';

/** En hånd som spillekort: én linje pr. farve (♠ ♥ ♦ ♣), honnørerne i fed og ♥ og ♦ i rødt. */
export function Hånd({ label, cards }: { label: string; cards: readonly Card[] }) {
  return (
    <section className="he-hand" aria-label={label}>
      <p className="he-eyebrow">{label}</p>
      <ul className="he-suits">
        {SUIT_SYMBOLS.map((symbol, suit) => {
          const ranks = cards
            .filter((c) => Math.floor(c / 13) === suit)
            .map((c) => c % 13)
            .sort((a, b) => b - a);
          return (
            <li key={symbol}>
              <span className={suit === 1 || suit === 2 ? 'suit-red' : undefined}>{symbol}</span>{' '}
              {ranks.length
                ? ranks.map((r, i) => (
                    <Fragment key={r}>
                      {i > 0 && ' '}
                      {r >= 8 ? <strong>{TEXT.rank(r)}</strong> : TEXT.rank(r)}
                    </Fragment>
                  ))
                : '–'}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
