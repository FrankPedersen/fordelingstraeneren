import { ALL_RANKS, rankText, TEN, type Rank } from '../model/cards';
import type { Seat } from '../play/play';
import { TEXT } from './texts';

/** Spil den selv (SPEC-forside-bred.md, del 3): kortene, der kan spilles, og stikket i kompasset. */
export interface BridgebordPlay {
  /** Kan hånden lægge et kort nu? Ellers er dens kort deaktiveret. */
  canPlay(hand: 'N' | 'S'): boolean;
  /** Skærmlæserens navn for kortet, fx "bordet: D". */
  cardLabel(hand: 'N' | 'S', card: Rank): string;
  onCard(hand: 'N' | 'S', card: Rank): void;
  /** Stikkets kort ved hver side (0 = intet kort i farven); tomt før første udspil. */
  trick: Partial<Record<Seat, number>>;
}

interface BridgebordProps {
  north: readonly Rank[];
  south: readonly Rank[];
  /** Vests og Østs kort i den valgte sidning; ellers "?". */
  west?: string;
  east?: string;
  /** Pilen viser spilleretningen i første udspil; den står foran billedteksten. */
  arrow?: 'ned' | 'op' | null;
  caption?: string;
  /** Spil den selv: kortene er knapper i hånden, og stikket står i kompasset. Uden feltet er bordet som før. */
  play?: BridgebordPlay;
}

/**
 * Klassisk diagram (det godkendte artboard "Analysevindue v2", SPEC-tema.md): Nord (bordet) øverst og Syd (dig) nederst,
 * skrevet som i systemnotatet ("♠ B432"), Vest og Øst ved siderne og i midten et kompas med N, V, Ø, S og de kort,
 * modparten har. I Spil den selv står stikkets kort ved hver sides bogstav i kompasset.
 */
export function Bridgebord({ north, south, west, east, arrow = null, caption, play }: BridgebordProps) {
  const missing = ALL_RANKS.filter((r) => !north.includes(r) && !south.includes(r)).sort((a, b) => b - a);
  const missingText = TEXT.missing(missing.length ? missing.map(rankText).join(' ') : '–');
  // I Spil den selv står kortene i et eget element, så "? (3 kort)" kan findes for sig.
  const hidden = (cards?: string) =>
    play ? (
      <span className="fb-hidden-hand">
        {TEXT.suit} <span>{cards ?? TEXT.unknown}</span>
      </span>
    ) : (
      <span className="fb-hidden-hand">
        {TEXT.suit} {cards ?? TEXT.unknown}
      </span>
    );
  const trickStarted = !!play && Object.keys(play.trick).length > 0;
  return (
    <figure className={play ? 'fb-table fb-table-play' : 'fb-table'} aria-label={caption ?? TEXT.problem}>
      <div className="fb-seat fb-seat-north">
        <span className="fb-seat-name">{TEXT.north}</span>
        {play ? <PlayHand hand="N" ranks={north} play={play} /> : <Hand ranks={north} />}
      </div>
      <div className="fb-seat fb-seat-west">
        <span className="fb-seat-name">{TEXT.west}</span>
        {hidden(west)}
      </div>
      {play ? (
        <div className="fb-compass" aria-live="polite" aria-label={TEXT.playTrick}>
          <span className="fb-compass-row">
            <CompassSeat seat="N" play={play} />
          </span>
          <span className="fb-compass-row fb-compass-middle">
            <CompassSeat seat="V" play={play} />
            {!trickStarted && <span className="fb-compass-missing">{missingText}</span>}
            <CompassSeat seat="Ø" play={play} />
          </span>
          <span className="fb-compass-row">
            <CompassSeat seat="S" play={play} />
          </span>
        </div>
      ) : (
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
      )}
      <div className="fb-seat fb-seat-east">
        <span className="fb-seat-name">{TEXT.east}</span>
        {hidden(east)}
      </div>
      <div className="fb-seat fb-seat-south">
        {play ? <PlayHand hand="S" ranks={south} play={play} /> : <Hand ranks={south} />}
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

const LETTER: Record<Seat, string> = { N: 'N', V: 'W', Ø: 'E', S: 'S' };

/** En side i kompasset: bogstavet og stikkets kort; Østs kort står inden for bogstavet, så kortene vender mod midten. */
function CompassSeat({ seat, play }: { seat: Seat; play: BridgebordPlay }) {
  const letter = <span aria-hidden="true">{TEXT.compass[LETTER[seat] as keyof typeof TEXT.compass]}</span>;
  const card = play.trick[seat];
  if (card === undefined) return <span className="fb-compass-seat" data-seat={seat}>{letter}</span>;
  const shown = (
    <>
      <span className="fb-sr">{TEXT.seats[seat]}</span>
      <span className={card >= TEN ? 'fb-compass-card fb-honor' : 'fb-compass-card'}>{card ? rankText(card as Rank) : '–'}</span>
    </>
  );
  return (
    <span className="fb-compass-seat" data-seat={seat}>
      {seat === 'Ø' ? shown : letter}
      {seat === 'Ø' ? letter : shown}
    </span>
  );
}

/** Hånden i Spil den selv: som i systemnotatet, men hvert kort er en knap med en trykflade på mindst 44 px. */
function PlayHand({ hand, ranks, play }: { hand: 'N' | 'S'; ranks: readonly Rank[]; play: BridgebordPlay }) {
  const sorted = [...ranks].sort((a, b) => b - a);
  const can = play.canPlay(hand);
  return (
    <span className="fb-hand fb-hand-play">
      <span className="fb-suit" aria-hidden="true">
        {TEXT.suit}
      </span>
      {sorted.length === 0 ? (
        <span>–</span>
      ) : (
        sorted.map((r) => (
          <button
            key={r}
            type="button"
            className={r >= TEN ? 'fb-hand-card fb-honor' : 'fb-hand-card'}
            disabled={!can}
            aria-label={play.cardLabel(hand, r)}
            onClick={() => play.onCard(hand, r)}
          >
            {rankText(r)}
          </button>
        ))
      )}
    </span>
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
