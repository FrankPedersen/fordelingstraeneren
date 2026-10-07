import { ALL_RANKS, rankText, TEN, type Rank } from '../model/cards';
import { TEXT } from './texts';

interface BridgebordProps {
  north: readonly Rank[];
  south: readonly Rank[];
  /** Vests og Østs kort i den valgte sidning; ellers "?". */
  west?: string;
  east?: string;
  /** Pilen viser spilleretningen i første udspil; den står foran billedteksten. */
  arrow?: 'ned' | 'op' | null;
  caption?: string;
}

/**
 * Klassisk diagram (det godkendte artboard "Analysevindue v2", SPEC-tema.md): Nord (bordet) øverst og Syd (dig) nederst,
 * skrevet som i systemnotatet ("♠ B432"), Vest og Øst ved siderne og i midten et kompas med N, V, Ø, S og de kort,
 * modparten har.
 */
export function Bridgebord({ north, south, west, east, arrow = null, caption }: BridgebordProps) {
  const missing = ALL_RANKS.filter((r) => !north.includes(r) && !south.includes(r)).sort((a, b) => b - a);
  const missingText = TEXT.missing(missing.length ? missing.map(rankText).join(' ') : '–');
  return (
    <figure className="fb-table" aria-label={caption ?? TEXT.problem}>
      <div className="fb-seat fb-seat-north">
        <span className="fb-seat-name">{TEXT.north}</span>
        <Hand ranks={north} />
      </div>
      <div className="fb-seat fb-seat-west">
        <span className="fb-seat-name">{TEXT.west}</span>
        <span className="fb-hidden-hand">
          {TEXT.suit} {west ?? TEXT.unknown}
        </span>
      </div>
      <div className="fb-compass">
        <span className="fb-compass-row" aria-hidden="true">
          {TEXT.compass.N}
        </span>
        <span className="fb-compass-row fb-compass-middle">
          <span aria-hidden="true">{TEXT.compass.W}</span>
          <span className="fb-compass-missing">{missingText}</span>
          <span aria-hidden="true">{TEXT.compass.E}</span>
        </span>
        <span className="fb-compass-row" aria-hidden="true">
          {TEXT.compass.S}
        </span>
      </div>
      <div className="fb-seat fb-seat-east">
        <span className="fb-seat-name">{TEXT.east}</span>
        <span className="fb-hidden-hand">
          {TEXT.suit} {east ?? TEXT.unknown}
        </span>
      </div>
      <div className="fb-seat fb-seat-south">
        <Hand ranks={south} />
        <span className="fb-seat-name">{TEXT.south}</span>
      </div>
      {caption && (
        <figcaption className="fb-note">
          {arrow && <span aria-hidden="true">{arrow === 'ned' ? '↓ ' : '↑ '}</span>}
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/** Hånden som i systemnotatet, fx "♠ B432"; skærmlæsere får kortene med mellemrum. */
export function Hand({ ranks }: { ranks: readonly Rank[] }) {
  const sorted = [...ranks].sort((a, b) => b - a);
  return (
    <span className="fb-hand">
      <span aria-hidden="true">
        <span className="fb-suit">{TEXT.suit}</span>
        {sorted.length === 0
          ? '–'
          : sorted.map((r) => (
              <span key={r} className={r >= TEN ? 'fb-honor' : undefined}>
                {rankText(r)}
              </span>
            ))}
      </span>
      <span className="fb-sr">{sorted.length === 0 ? '–' : sorted.map(rankText).join(' ')}</span>
    </span>
  );
}
