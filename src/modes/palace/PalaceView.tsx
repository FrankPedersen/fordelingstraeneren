import { patternById } from '../../domain/patterns';
import { LOFT_ROOM, placeOf, type RouteRoom } from '../../memory/palace';
import { PatternKeypad } from '../../ui/PatternKeypad';
import { Skyline } from '../../ui/Skyline';
import { checkPalace, type PalaceAnswer, type PalaceTask } from './task';
import { tx } from '../../i18n';
import { Info } from '../../ui/Info';

interface PalaceViewProps {
  task: PalaceTask;
  route: RouteRoom[];
  /** Brugerens svar; så låses opgaven. */
  answer?: PalaceAnswer;
  /** Vis facit. */
  reveal: boolean;
  /** Vis facit med skyline (ellers kun som tekst). */
  skylines: boolean;
  onAnswer(answer: PalaceAnswer): void;
}

export function PalaceView({ task, route, answer, reveal, skylines, onAnswer }: PalaceViewProps) {
  const pattern = patternById(task.patternId);
  const place = placeOf(pattern)!;

  if (task.direction === 'to-pattern') {
    const room = route.find((r) => r.stations.some((s) => s.place === place))!;
    const station = room.stations.find((s) => s.place === place)!;
    const typed = answer && 'pattern' in answer ? answer.pattern : undefined;
    const right = answer !== undefined && checkPalace(task, answer);
    return (
      <div className="task">
        <div className="with-info">
          <p className="prompt">{tx(`Hvilket mønster bor ved station ${place}?`, `Which pattern lives at station ${place}?`)}</p>
          <Info topic={tx('Paladsvandring', 'Palace walk')}>
            {tx('Paladsvandring øver ruten i dit huskepalads begge veje: tast mønstret, der bor ved en station, eller vælg stationen, hvor et mønster bor. Station n rummer mønstret med rang n; de episke mønstre bor på Loftet.', 'Palace walk practises the route in your memory palace both ways: type the pattern that lives at a station, or choose the station where a pattern lives. Station n holds the pattern with rank n; the epic patterns live in the Attic.')}
          </Info>
        </div>
        <p className="instruction">
          {station.name} · {room.name}
        </p>
        {typed === undefined ? (
          <PatternKeypad onPattern={(lengths) => onAnswer({ pattern: lengths.join('-') })} />
        ) : (
          <div className="pair">
            <div className={`choice${reveal ? (right ? ' right' : ' wrong') : ' chosen'}`}>
              <span className="muted small">{tx('Dit svar', 'Your answer')}</span>
              {skylines || !reveal ? <Skyline id={typed} /> : <strong>{typed}</strong>}
            </div>
            {reveal && !right && (
              <div className="choice right">
                <span className="muted small">{tx('Facit', 'Answer')}</span>
                {skylines ? <Skyline id={pattern.id} /> : <strong>{pattern.id}</strong>}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const chosen = answer && 'place' in answer ? answer.place : undefined;
  const classes = (option: number | 'loft') =>
    [
      'choice station',
      chosen === option && 'chosen',
      reveal && option === place && 'right',
      reveal && chosen === option && option !== place && 'wrong',
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div className="task">
      <div className="with-info">
        <p className="prompt">{tx(`Hvor på ruten bor ${pattern.id}?`, `Where on the route does ${pattern.id} live?`)}</p>
        <Info topic={tx('Paladsvandring', 'Palace walk')}>
          {tx('Paladsvandring øver ruten i dit huskepalads begge veje: tast mønstret, der bor ved en station, eller vælg stationen, hvor et mønster bor. Station n rummer mønstret med rang n; de episke mønstre bor på Loftet.', 'Palace walk practises the route in your memory palace both ways: type the pattern that lives at a station, or choose the station where a pattern lives. Station n holds the pattern with rank n; the epic patterns live in the Attic.')}
        </Info>
      </div>
      <div className="center">
        <Skyline id={pattern.id} />
      </div>
      {route
        .filter((r) => r.open)
        .map((r) => (
          <section key={r.room} className="route-room" aria-label={r.name}>
            <h3>{r.name}</h3>
            <div className="route-stations">
              {r.room === LOFT_ROOM ? (
                <button
                  type="button"
                  className={classes('loft')}
                  disabled={chosen !== undefined}
                  onClick={() => onAnswer({ place: 'loft' })}
                >
                  {r.name}
                </button>
              ) : (
                r.stations.map((s) => (
                  <button
                    key={s.place}
                    type="button"
                    className={classes(s.place)}
                    disabled={chosen !== undefined}
                    onClick={() => onAnswer({ place: s.place })}
                  >
                    <span className="station-number">{s.place}</span> {s.name}
                  </button>
                ))
              )}
            </div>
          </section>
        ))}
    </div>
  );
}
