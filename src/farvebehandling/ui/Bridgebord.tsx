import { rankText, TEN, type Rank } from '../model/cards';
import { TEXT } from './texts';

interface BridgebordProps {
  north: readonly Rank[];
  south: readonly Rank[];
  /** Vests og Østs kort i den valgte sidning; ellers "?". */
  west?: string;
  east?: string;
  /** Pilen viser spilleretningen i første udspil. */
  arrow?: 'ned' | 'op' | null;
  caption?: string;
}

/** Nord (bordet) øverst, Syd (dig) nederst, Vest til venstre og Øst til højre. Honnører står med fed. */
export function Bridgebord({ north, south, west, east, arrow = null, caption }: BridgebordProps) {
  return (
    <figure className="fb-table" aria-label={caption ?? TEXT.problem}>
      <div className="fb-seat fb-seat-north">
        <span className="fb-seat-name">{TEXT.north}</span>
        <Hand ranks={north} />
      </div>
      <div className="fb-seat fb-seat-west">
        <span className="fb-seat-name">{TEXT.west}</span>
        <span className="fb-hidden-hand">{west ?? TEXT.unknown}</span>
      </div>
      <div className="fb-table-center" aria-hidden="true">
        {arrow === 'ned' ? '↓' : arrow === 'op' ? '↑' : ''}
      </div>
      <div className="fb-seat fb-seat-east">
        <span className="fb-seat-name">{TEXT.east}</span>
        <span className="fb-hidden-hand">{east ?? TEXT.unknown}</span>
      </div>
      <div className="fb-seat fb-seat-south">
        <Hand ranks={south} />
        <span className="fb-seat-name">{TEXT.south}</span>
      </div>
      {caption && <figcaption className="fb-note">{caption}</figcaption>}
    </figure>
  );
}

export function Hand({ ranks }: { ranks: readonly Rank[] }) {
  return (
    <span className="fb-hand">
      <span className="fb-suit" aria-hidden="true">
        {TEXT.suit}
      </span>
      {ranks.length === 0 ? (
        <span>–</span>
      ) : (
        [...ranks]
          .sort((a, b) => b - a)
          .map((r) => (
            <span key={r} className={r >= TEN ? 'fb-honor' : undefined}>
              {rankText(r)}
            </span>
          ))
      )}
    </span>
  );
}
