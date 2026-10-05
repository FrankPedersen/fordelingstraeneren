import { Fragment } from 'react';
import { SUIT_SYMBOLS, type Card } from '../../domain/cards';
import { TEXT } from './texts';

interface HåndProps {
  /** Fx "Bordet (Nord)". */
  label: string;
  cards: readonly Card[];
  /** Hp-tallet ved hånden; udelades i Regnestykket, hvor det er selve opgaven. */
  hp?: number;
}

/** En hånd farve for farve (♠ ♥ ♦ ♣) med honnørerne i fed og ♥ og ♦ i rødt. */
export function Hånd({ label, cards, hp }: HåndProps) {
  return (
    <section className="pr-hand" aria-label={label}>
      <div className="pr-hand-head">
        <span className="pr-eyebrow">{label}</span>
        {hp !== undefined && <span className="pr-hp">{TEXT.hp(hp)}</span>}
      </div>
      <p className="pr-suits">
        {SUIT_SYMBOLS.map((symbol, suit) => {
          const ranks = cards
            .filter((c) => Math.floor(c / 13) === suit)
            .map((c) => c % 13)
            .sort((a, b) => b - a);
          return (
            <span key={symbol} className="pr-suit">
              <span className={suit === 1 || suit === 2 ? 'suit-red' : undefined}>{symbol}</span>{' '}
              {ranks.length
                ? ranks.map((r, i) => (
                    <Fragment key={r}>
                      {i > 0 && ' '}
                      {r >= 9 ? <strong>{TEXT.rank(r)}</strong> : TEXT.rank(r)}
                    </Fragment>
                  ))
                : '–'}
            </span>
          );
        })}
      </p>
    </section>
  );
}
