import { ALL_RANKS, rankText, type Rank } from '../model/cards';
import { TEXT } from './texts';

interface KortvælgerProps {
  north: readonly Rank[];
  south: readonly Rank[];
  onChange(north: Rank[], south: Rank[]): void;
}

/** Tryk på et kort: ingen → bordet → din hånd → ingen. */
export function Kortvælger({ north, south, onChange }: KortvælgerProps) {
  function cycle(rank: Rank) {
    if (north.includes(rank)) onChange(north.filter((r) => r !== rank), [...south, rank]);
    else if (south.includes(rank)) onChange([...north], south.filter((r) => r !== rank));
    else onChange([...north, rank], [...south]);
  }
  return (
    <div className="fb-picker">
      <p className="fb-note">{TEXT.pickerHelp}</p>
      <div className="fb-picker-cards" role="group" aria-label={TEXT.picker}>
        {ALL_RANKS.map((rank) => {
          const owner = north.includes(rank) ? 'N' : south.includes(rank) ? 'S' : 'none';
          return (
            <button
              key={rank}
              type="button"
              className={`fb-pick fb-pick-${owner}`}
              aria-label={TEXT.pickerCard(rankText(rank), TEXT.owners[owner])}
              onClick={() => cycle(rank)}
            >
              <span className="fb-pick-rank">{rankText(rank)}</span>
              <span className="fb-pick-owner">{owner === 'none' ? '' : owner === 'N' ? 'N' : 'S'}</span>
            </button>
          );
        })}
      </div>
      <button type="button" className="btn small-btn" onClick={() => onChange([], [])}>
        {TEXT.clear}
      </button>
    </div>
  );
}
