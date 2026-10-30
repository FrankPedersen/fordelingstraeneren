import { useEffect, useMemo, useRef, useState } from 'react';
import { mulberry32 } from '../../engine/rng';
import { bandFields, fieldIdOf, linesForGoal, type BankItem } from '../analysis';
import { cardsText, rankText, type Rank } from '../model/cards';
import {
  canLead,
  dealCards,
  finished,
  followsBestLine,
  playLead,
  playThird,
  startPlay,
  thirdHandEmpty,
  type Hand,
  type PlayConnections,
  type PlayState,
  type Seat,
} from '../play/play';
import { Bridgebord } from './Bridgebord';
import { Linjekort } from './Linjekort';
import { Sandsynlighedsbånd } from './Sandsynlighedsbånd';
import { TEXT } from './texts';
import { Info } from '../../ui/Info';

interface SpilSelvProps {
  item: BankItem;
  goal: number;
  /** Seed til kortgiveren og modspillets valg mellem ligeværdige kort, så en opgave kan genskabes. */
  seed: number;
  /** I en opgave: kaldes én gang, når sidste stik er spillet. */
  onDone?(state: PlayState): void;
  /** Uden for opgaver: luk spillet. */
  onClose?(): void;
  /** Begrænsede forbindelser fra situationen i Analyse (SPEC-forbindelser.md). */
  connections?: PlayConnections;
}

const seatName = (seat: Seat) => TEXT.seats[seat];

/**
 * Spil den selv: spilføreren spiller ud fra den hånd, han vil, og lægger 3. håndens kort; modspillerne lægger efter
 * normalt modspil. Til sidst vises kortene, resultatet og om spillet fulgte en af løserens bedste linjer, og
 * sidningen lyser op i sandsynlighedsbåndet.
 */
export function SpilSelv({ item, goal, seed, onDone, onClose, connections }: SpilSelvProps) {
  const [round, setRound] = useState(0);
  const rng = useMemo(() => mulberry32((seed + Math.imul(round, 0x9e3779b1)) >>> 0), [seed, round]);
  const [state, setState] = useState<PlayState>(() => startPlay(item, dealCards(item, rng), connections));
  const reported = useRef(false);
  const done = finished(state);

  useEffect(() => {
    if (done && onDone && !reported.current) {
      reported.current = true;
      onDone(state);
    }
  }, [done, onDone, state]);

  function lead(hand: Hand, card: Rank) {
    let next = playLead(state, hand, card, rng);
    if (thirdHandEmpty(next)) next = playThird(next, 0, rng);
    setState(next);
  }

  function again() {
    const nextRound = round + 1;
    const nextRng = mulberry32((seed + Math.imul(nextRound, 0x9e3779b1)) >>> 0);
    setRound(nextRound);
    setState(startPlay(item, dealCards(item, nextRng), connections));
  }

  const current = state.current;
  const turn: Hand | null = done ? null : current ? (current.leader === 'N' ? 'S' : 'N') : null;
  // Et udspil kræver, at hånden kan nås (SPEC-forbindelser.md); uden begrænsning kan begge hænder altid spille ud.
  const playable = (hand: Hand) => !done && (current ? turn === hand : canLead(state, hand));
  const last = state.tricks[state.tricks.length - 1];

  // Det stik, der vises i kompasset: det igangværende eller det senest spillede, til næste udspil.
  const seatsFor = (leader: Hand): Seat[] => (leader === 'N' ? ['N', 'Ø', 'S', 'V'] : ['S', 'V', 'N', 'Ø']);
  const shown = current
    ? [
        { seat: seatsFor(current.leader)[0], card: current.lead },
        { seat: seatsFor(current.leader)[1], card: current.second },
      ]
    : last
      ? seatsFor(last.leader).map((seat, i) => ({ seat, card: [last.lead, last.second, last.third, last.fourth][i] }))
      : [];

  const prompt = done
    ? null
    : current
      ? TEXT.playThirdPrompt(turn === 'N' ? TEXT.owners.N : TEXT.owners.S)
      : TEXT.playLeadPrompt;

  return (
    <section className="card fb-play" aria-label={TEXT.playTitle}>
      <header className="fb-room-row">
        <h2>{TEXT.playTitle}</h2>
        <Info topic={TEXT.playTitle}>{TEXT.help.play}</Info>
        <span className="fb-note">{TEXT.playScore(state.won, goal)}</span>
        {onClose && (
          <button type="button" className="btn small-btn" onClick={onClose}>
            {TEXT.close}
          </button>
        )}
      </header>
      <Bridgebord
        north={state.north}
        south={state.south}
        west={done ? cardsText(state.deal.west) : undefined}
        east={done ? cardsText(state.deal.east) : undefined}
        play={{
          counts: done ? undefined : { V: state.west.length, Ø: state.east.length },
          canPlay: playable,
          cardLabel: (hand, c) => `${hand === 'N' ? TEXT.owners.N : TEXT.owners.S}: ${rankText(c)}`,
          onCard: (hand, c) => (current ? setState(playThird(state, c, rng)) : lead(hand, c)),
          trick: Object.fromEntries(shown.map(({ seat, card }) => [seat, card])),
        }}
      />
      {state.connections && (
        <div className="with-info">
          <p className="fb-note">{connectionsText(state.connections)}</p>
          <Info topic={TEXT.playConnectionsTitle}>{TEXT.help.playConnections}</Info>
        </div>
      )}
      {prompt && <p role="status">{prompt}</p>}
      {done && (state.north.length > 0 || state.south.length > 0) && <p className="fb-note">{TEXT.playStranded}</p>}
      {!current && last && !done && <p className="fb-note">{TEXT.playTrickWon(state.tricks.length, seatName(last.winner))}</p>}
      {done && !onDone && <PlayResult item={item} goal={goal} state={state} />}
      {done && !onDone && (
        <div className="fb-actions">
          <button type="button" className="btn primary wide" onClick={again}>
            {TEXT.playAgain}
          </button>
        </div>
      )}
    </section>
  );
}

/** Forbindelserne undervejs, fx "Nord inde · Syd 0 indgange": hånden, der er inde, og de begrænsede indgange. */
function connectionsText(c: NonNullable<PlayState['connections']>): string {
  const name = (hand: Hand) => TEXT.situationPanel.hands[hand];
  const parts = [c.inde ? TEXT.situationPanel.leadChip(name(c.inde)) : TEXT.playNoLead];
  for (const hand of ['N', 'S'] as const) if (c.entries[hand] !== Infinity) parts.push(TEXT.situationPanel.entries1(name(hand), c.entries[hand]));
  return parts.join(' · ');
}

/**
 * Resultatet af et spil: stikkene, om en af de bedste linjer blev fulgt, og sidningen i båndet. I Træning sættes
 * opgavens bedømmelse som overskrift (`title`) og XP som `meta`.
 */
export function PlayResult({ item, goal, state, title, meta }: { item: BankItem; goal: number; state: PlayState; title?: string; meta?: string }) {
  const lines = useMemo(() => linesForGoal(item, goal), [item, goal]);
  const fields = useMemo(() => bandFields(item, lines), [item, lines]);
  const [selected, setSelected] = useState(() => fieldIdOf(item, state.deal.layout, state.deal.west));
  const made = state.won >= goal;
  const followed = followsBestLine(item, goal, state);
  const tone = followed ? (made ? TEXT.playGoodMade : TEXT.playGoodUnlucky) : made ? TEXT.playLuckyMade : TEXT.betterLine(lines[0].letter);
  return (
    <div className="fb-play-result">
      <div className={`feedback ${followed ? 'ok' : 'bad'}`} role="status">
        <span className="feedback-title">{title ?? TEXT.playResult(state.won, goal, made)}</span>
        {title && <span>{TEXT.playResult(state.won, goal, made)}</span>}
        <span>{tone}</span>
        <span>{followed ? TEXT.playFollowed : TEXT.playNotFollowed}</span>
        {meta && <span className="feedback-meta">{meta}</span>}
      </div>
      <p className="fb-note">{TEXT.playLayoutNote}</p>
      <Sandsynlighedsbånd lines={lines} fields={fields} selected={selected} onSelect={setSelected} />
      <Linjekort line={lines[0]} />
    </div>
  );
}
