import { useMemo, useState } from 'react';
import { formatInt } from '../../engine/format';
import { clubEvening, type BankItem } from '../analysis';
import { cardsText } from '../model/cards';
import { eveningText, oncePerDeals } from '../model/frequency';
import type { Technique } from '../training/palace';
import { TEXT } from './texts';

interface KlubaftenProps {
  bank: readonly BankItem[];
  techniques: readonly Technique[];
  /** Åbner kombinationen i Analyse. */
  onOpen(id: string): void;
  onBack(): void;
}

const holdingOf = (b: BankItem) => `${cardsText(b.south)} / ${cardsText(b.north)}`;

/**
 * Klubaftenen som i fordelingstræneren: de 100 hyppigste kombinationer som 10 × 10 felter i rangorden. Et felt viser
 * kombinationen og hyppigheden, tekniknapperne fremhæver deres felter, og listen nedenunder har hyppigheden for alle.
 */
export function Klubaften({ bank, techniques, onOpen, onBack }: KlubaftenProps) {
  const club = useMemo(() => clubEvening(bank), [bank]);
  const [technique, setTechnique] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const nameOf = (id: string) => techniques.find((t) => t.id === id)?.name ?? id;
  const chips = techniques
    .map((t) => ({ t, count: club.techniques[t.id] ?? 0 }))
    .sort((a, b) => b.count - a.count || a.t.order - b.t.order);
  const active = club.items.find((b) => b.combination.id === current) ?? null;
  const listed = club.items
    .map((b, i) => ({ b, share: club.share[i] }))
    .filter(({ b }) => !technique || b.combination.technique === technique);

  return (
    <div className="fb-narrow">
      <header className="screen-head">
        <button type="button" className="round" aria-label={TEXT.backToTraining} onClick={onBack}>
          ←
        </button>
        <h2>{TEXT.club}</h2>
      </header>
      <p className="fb-note">{TEXT.clubIntro}</p>
      <div className="fb-club-grid" role="group" aria-label={TEXT.clubGrid}>
        {club.items.map((b) => {
          const id = b.combination.id;
          const highlight = technique ? (b.combination.technique === technique ? ' fb-club-active' : ' fb-club-dim') : '';
          return (
            <button
              key={id}
              type="button"
              className={`fb-club-cell${highlight}${current === id ? ' fb-club-current' : ''}`}
              aria-label={TEXT.clubCell(b.rank, holdingOf(b), eveningText(b.frequency))}
              aria-pressed={current === id}
              onClick={() => setCurrent(current === id ? null : id)}
            >
              <span>{b.rank}</span>
            </button>
          );
        })}
      </div>
      <section className="card fb-club-caption" aria-live="polite">
        {active ? (
          <>
            <p className="fb-club-name">{TEXT.clubName(active.rank, holdingOf(active))}</p>
            <p>{TEXT.clubOften(eveningText(active.frequency), formatInt(oncePerDeals(active.frequency)))}</p>
            <div className="fb-actions">
              <span className="fb-note">{nameOf(active.combination.technique)}</span>
              <button type="button" className="btn small-btn fb-push" onClick={() => onOpen(active.combination.id)}>
                {TEXT.openInAnalysis}
              </button>
            </div>
          </>
        ) : (
          <p className="fb-note">
            {technique ? TEXT.clubTechnique(nameOf(technique), club.techniques[technique] ?? 0) : TEXT.clubHint}
          </p>
        )}
      </section>
      <div className="fb-filter" role="group" aria-label={TEXT.filters.technique}>
        {chips.map(({ t, count }) => (
          <button
            key={t.id}
            type="button"
            className={`btn small-btn${technique === t.id ? ' selected' : ''}`}
            aria-pressed={technique === t.id}
            disabled={!count}
            onClick={() => {
              setTechnique(technique === t.id ? null : t.id);
              setCurrent(null);
            }}
          >
            {TEXT.clubChip(t.name, count)}
          </button>
        ))}
      </div>
      <p className="fb-note">{TEXT.clubCards(club.cards)}</p>
      <section className="card" aria-labelledby="fb-club-list">
        <h3 id="fb-club-list">{technique ? TEXT.clubListFor(nameOf(technique)) : TEXT.clubList}</h3>
        <ul className="fb-club-list" aria-labelledby="fb-club-list">
          {listed.map(({ b, share }) => (
            <li key={b.combination.id}>
              <button type="button" className="fb-club-row" onClick={() => onOpen(b.combination.id)}>
                <span className="fb-club-name">{TEXT.clubName(b.rank, holdingOf(b))}</span>
                <span className="fb-note">{eveningText(b.frequency)}</span>
                <span className="fb-club-bar" aria-hidden="true">
                  <span style={{ width: `${Math.max(1, Math.round(1000 * share) / 10)}%` }} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
