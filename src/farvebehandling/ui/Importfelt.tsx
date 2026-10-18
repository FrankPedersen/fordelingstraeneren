import { useId, useState, type FormEvent } from 'react';
import { cardsText, rankText, type Rank } from '../model/cards';
import { Info } from '../../ui/Info';
import { SuitText } from '../../ui/SuitText';
import { parseImport, SUIT_SYMBOL, type DealChoice, type ImportError } from './importer';
import { TEXT } from './texts';

/**
 * Feltet "Indsæt kombination eller spil" over kortvælgeren i Analyse (SPEC-analyse-situation.md, leverancetrin 3).
 * En kombination stilles op direkte; fra et spil vælges en af de 8 kombinationer. Situationen udfyldes ikke af importen.
 */
interface ImportfeltProps {
  onImport(north: Rank[], south: Rank[]): void;
}

/** Fejlbeskeden: hvad der er galt, og hvordan det rettes. */
export function importErrorText(error: ImportError): string {
  const e = TEXT.importer.errors;
  switch (error.kind) {
    case 'empty':
      return e.empty;
    case 'shortLink':
      return e.shortLink;
    case 'unknownSymbol':
      return e.unknownSymbol(error.symbol);
    case 'duplicate':
      return e.duplicate(`${error.suit ? SUIT_SYMBOL[error.suit] : ''}${rankText(error.rank)}`);
    case 'separator':
      return e.separator;
    case 'emptyHand':
      return e.emptyHand;
    case 'noOpponents':
      return e.noOpponents;
    case 'handSize':
      return e.handSize(TEXT.importer.seats[error.seat], error.count);
    case 'noDeal':
      return e.noDeal;
  }
}

/** "♦ E D B 9 7 5 – 6 3 2": farven, bordet og hånden. */
export const choiceLabel = (c: DealChoice) => `${SUIT_SYMBOL[c.suit]} ${cardsText(c.north)} – ${cardsText(c.south)}`;

export function Importfelt({ onImport }: ImportfeltProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [choices, setChoices] = useState<DealChoice[] | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const id = useId();

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = parseImport(text);
    setChosen(null);
    if (result.kind === 'error') {
      setError(importErrorText(result.error));
      setChoices(null);
      return;
    }
    setError(null);
    if (result.kind === 'combination') {
      setChoices(null);
      onImport(result.north, result.south);
    } else setChoices(result.choices);
  }

  return (
    <form className="fb-import" onSubmit={submit}>
      <div className="with-info">
        <label htmlFor={id}>{TEXT.importer.label}</label>
        <Info topic={TEXT.importer.label}>{TEXT.help.importer}</Info>
      </div>
      <div className="fb-import-row">
        <input
          id={id}
          type="text"
          className="fb-import-input"
          value={text}
          placeholder={TEXT.importer.placeholder}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit" className="btn small-btn">
          {TEXT.importer.button}
        </button>
      </div>
      {error && (
        <p role="alert" className="fb-note">
          {error}
        </p>
      )}
      {choices && (
        <div className="fb-import-choices" role="group" aria-label={TEXT.importer.choose}>
          {(['NS', 'EW'] as const).map((pair) => (
            <div key={pair} className="fb-import-pair">
              <span className="fb-note">{TEXT.importer.pairs[pair]}</span>
              <div className="fb-segment">
                {choices.map((c, i) =>
                  c.pair !== pair ? null : (
                    <button
                      key={i}
                      type="button"
                      className={`btn small-btn${chosen === i ? ' selected' : ''}`}
                      aria-pressed={chosen === i}
                      aria-label={TEXT.importer.choice(choiceLabel(c), TEXT.importer.pairs[pair])}
                      title={c.usable ? undefined : TEXT.importer.unusable}
                      disabled={!c.usable}
                      onClick={() => {
                        setChosen(i);
                        onImport(c.north, c.south);
                      }}
                    >
                      <SuitText text={choiceLabel(c)} />
                    </button>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
