import { useState } from 'react';
import { cardsData, rankText, type Rank } from '../model/cards';
import { cardName } from '../solver/describe';
import type { LineStep } from '../solver/lines';
import { TEXT } from './texts';
import { getLang } from '../../i18n';
import { englishCardName } from '../lineText';

interface LinjeeditorProps {
  north: readonly Rank[];
  south: readonly Rank[];
  /** Fejl fra løserens validering af den seneste linje. */
  errors?: readonly string[];
  busy?: boolean;
  onSave(line: { text: string; steps: LineStep[] }): void;
  onCancel(): void;
}

/** Højst så mange trin; efter sidste trin spiller løseren videre. */
const MAX_STEPS = 4;

/** Linjen ud fra trinene, når brugeren ikke har givet den et navn. */
export function stepsText(steps: readonly LineStep[]): string {
  const name = (card: string) => (card === 'low' || card === 'high' ? TEXT.editorCardName(card) : cardNameText(symbolRank(card)));
  return steps
    .map((s) => TEXT.editorStepText(name(s.card), s.leadFrom, s.third && { play: name(s.third.play), else: name(s.third.else) }))
    .join(' ');
}

/** Kortets navn: "esset" på dansk, "the ace" på engelsk. */
const cardNameText = (rank: Rank) => (getLang() === 'en' ? englishCardName(rank) : cardName(rank));
const DATA_RANK: Record<string, Rank> = { A: 14, K: 13, Q: 12, J: 11, T: 10 };
const symbolRank = (symbol: string): Rank => DATA_RANK[symbol] ?? Number(symbol);

/**
 * En egen linje i linjeformatet: hvert trin har udspil (hånd og kort) og 3. håndens kort, når 2. hånd lægger lavt og
 * når den lægger en honnør. Løseren tjekker linjen og regner den; efter sidste trin spiller den videre optimalt.
 */
export function Linjeeditor({ north, south, errors = [], busy = false, onSave, onCancel }: LinjeeditorProps) {
  const [steps, setSteps] = useState<LineStep[]>([{ leadFrom: 'S', card: 'low' }]);
  const [name, setName] = useState('');
  const cardsOf = (hand: 'N' | 'S') => [...(hand === 'N' ? north : south)].sort((a, b) => b - a);
  const update = (i: number, step: LineStep) => setSteps(steps.map((s, k) => (k === i ? step : s)));

  const chips = (label: string, visible: string, hand: 'N' | 'S', value: string, onPick: (card: string) => void) => (
    <div className="fb-filter" role="group" aria-label={label}>
      <span>{visible}:</span>
      {['low', 'high', ...cardsOf(hand).map((r) => cardsData([r]))].map((card) => (
        <button
          key={card}
          type="button"
          className={`btn small-btn${value === card ? ' selected' : ''}`}
          aria-pressed={value === card}
          onClick={() => onPick(card)}
        >
          {card === 'low' ? TEXT.editorLow : card === 'high' ? TEXT.editorHigh : rankText(symbolRank(card))}
        </button>
      ))}
    </div>
  );

  return (
    <section className="card fb-editor-card" aria-label={TEXT.editorTitle}>
      <h3>{TEXT.editorTitle}</h3>
      <p className="fb-note">{TEXT.editorHelp}</p>
      <ol className="fb-editor-steps">
        {steps.map((s, i) => {
          const partner = s.leadFrom === 'N' ? 'S' : 'N';
          const third = s.third ?? { ifSecondPlays: 'low', play: 'low', else: 'low' };
          const setThird = (play: string, other: string) =>
            update(i, play === 'low' && other === 'low' ? { leadFrom: s.leadFrom, card: s.card } : { ...s, third: { ifSecondPlays: 'low', play, else: other } });
          return (
            <li key={i} className="fb-editor-step">
              <h4>{TEXT.editorStep(i + 1)}</h4>
              <div className="fb-filter" role="group" aria-label={TEXT.editorLeadFrom(i + 1)}>
                <span>{TEXT.editorLeadFromShort}:</span>
                {(['N', 'S'] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={`btn small-btn${s.leadFrom === h ? ' selected' : ''}`}
                    aria-pressed={s.leadFrom === h}
                    onClick={() => update(i, { leadFrom: h, card: 'low' })}
                  >
                    {h === 'N' ? TEXT.editorNorth : TEXT.editorSouth}
                  </button>
                ))}
              </div>
              {chips(TEXT.editorCard(i + 1), TEXT.editorCardShort, s.leadFrom, s.card, (card) => update(i, { ...s, card }))}
              {chips(TEXT.editorThirdLow(i + 1), TEXT.editorThirdLowShort, partner, third.play, (card) => setThird(card, third.else))}
              {chips(TEXT.editorThirdHigh(i + 1), TEXT.editorThirdHighShort, partner, third.else, (card) => setThird(third.play, card))}
              {steps.length > 1 && (
                <button type="button" className="btn small-btn" onClick={() => setSteps(steps.filter((_, k) => k !== i))}>
                  {TEXT.editorRemove(i + 1)}
                </button>
              )}
            </li>
          );
        })}
      </ol>
      {steps.length < MAX_STEPS && (
        <button type="button" className="btn small-btn" onClick={() => setSteps([...steps, { leadFrom: 'S', card: 'low' }])}>
          {TEXT.editorAdd}
        </button>
      )}
      <label className="fb-label" htmlFor="fb-line-name">
        {TEXT.editorName}
      </label>
      <input id="fb-line-name" className="fb-input" value={name} placeholder={stepsText(steps)} onChange={(e) => setName(e.target.value)} />
      {errors.length > 0 && (
        <ul className="fb-errors" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <div className="fb-actions">
        <button type="button" className="btn small-btn" onClick={onCancel}>
          {TEXT.cancel}
        </button>
        <button type="button" className="btn small-btn primary" disabled={busy} onClick={() => onSave({ text: name.trim() || stepsText(steps), steps })}>
          {TEXT.editorSave}
        </button>
      </div>
    </section>
  );
}

