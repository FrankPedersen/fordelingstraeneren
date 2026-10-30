import { dayOf } from '../../engine/dates';
import type { Saved } from '../../engine/storage';
import { GRADE_LABEL } from '../../domain/patterns';
import { getLang, tx, type Lang } from '../../i18n';
import { Footer } from '../../ui/Footer';
import { Info } from '../../ui/Info';
import { TopBar } from '../../ui/TopBar';
import { todayOverview, trackStatuses, type TrackStatus } from '../status';
import { GROUPS, TRACK_CARDS, type Both, type TrackCard } from '../tracks';

interface HomeScreenProps {
  saved: Saved;
  updateReady: boolean;
  onUpdate?: () => void;
  /** Starter fordelingssporets session (Velkomst, og I dag, når Fordeling er det næste spor). */
  onStart(): void;
  onClub(): void;
  onSettings(): void;
  /** Skifter appens sprog (dansk/engelsk). */
  onLanguage?(lang: Lang): void;
  /** Den samlede vejledning. */
  onGuide?(): void;
  /** Åbner et spors skærm (kortene). Uden onOpen vises sporene ikke. */
  onOpen?(screen: string): void;
  /** Åbner et spors skærm og starter dets session (I dag for de andre spor end Fordeling); uden den åbnes skærmen. */
  onStartTrack?(screen: string): void;
  /** Sporenes kort; standard er listen i `tracks.ts`. */
  cards?: readonly TrackCard[];
  /** Sporenes status; standard læses fra lagringen uden at skrive (`status.ts`). */
  statuses?: Record<string, TrackStatus>;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Lagringen til at læse sporenes status; er den spærret (fx privat vindue), er der ingen data. */
function readableStorage(): { getItem(key: string): string | null } {
  try {
    const storage = window.localStorage;
    storage.getItem('fordelingstraener:v1');
    return storage;
  } catch {
    return { getItem: () => null };
  }
}

/** "tirsdag 13. oktober" / "Tuesday 13 October" for en dag i formen 2026-10-13. */
function dayText(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12);
  const locale = getLang() === 'en' ? 'en-GB' : 'da-DK';
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
  const month = new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
  return tx(`${weekday} ${d}. ${month}`, `${weekday} ${d} ${month}`);
}

/**
 * Forsiden (SPEC-forside-spor.md): topbjælken, hovedet, I dag (eller Velkomst ved første besøg), de fire spor som kort i
 * grupperne Optælling, Spilføring og Vurdering, Vejledning, Indstillinger og sidefoden. Et kort uden status (modulet
 * Analyse, SPEC-analyse-modul.md) står i sin gruppe, men tælles ikke med i I dag og Velkomst. Fordelingssporets
 * elementer står på Fordeling-skærmen (`DistributionScreen.tsx`). Forsiden læser sporenes data, men skriver intet.
 */
export function HomeScreen(props: HomeScreenProps) {
  const { saved, updateReady, onUpdate, onStart, onClub, onSettings, onLanguage, onGuide, onOpen, onStartTrack } = props;
  const cards = props.cards ?? TRACK_CARDS;
  // Sporene med status; kun de tæller i I dag og Velkomst og kan foreslås til dagens session.
  const tracked = cards.filter((card) => card.status !== false);
  const statuses = props.statuses ?? trackStatuses(saved, readableStorage(), Date.now());
  const today = dayOf(Date.now(), saved.settings.dayStartsAtHour);
  const other: Lang = getLang() === 'da' ? 'en' : 'da';
  const both = (b: Both) => tx(b.da, b.en);
  const statusOf = (track: string): TrackStatus =>
    statuses[track] ?? { track, started: false, streak: 0, level: null, grade: null, doneToday: false, due: 0, fresh: 0 };

  const firstVisit = tracked.every((card) => !statusOf(card.track).started);
  const overview = todayOverview(
    tracked.map((c) => c.track),
    statuses,
  );
  const nextCard = tracked.find((c) => c.track === overview.next);
  const firstCard = tracked[0];
  /** Starter det næste spors session direkte: Fordelings her, de andre sporers på deres skærm. */
  const startTrack = (card: TrackCard) => (card.track === 'fordeling' ? onStart() : (onStartTrack ?? onOpen)?.(card.screen));

  /** "Næste: Fordeling, med 4 emner til repetition og 1 nyt mønster. Ca. 5 minutter." */
  function nextText(card: TrackCard): string {
    const s = statusOf(card.track);
    const da = [s.due > 0 && `${plural(s.due, 'emne', 'emner')} til repetition`, s.fresh > 0 && plural(s.fresh, 'nyt mønster', 'nye mønstre')].filter(Boolean);
    const en = [s.due > 0 && `${plural(s.due, 'item', 'items')} to review`, s.fresh > 0 && plural(s.fresh, 'new pattern', 'new patterns')].filter(Boolean);
    return tx(
      `Næste: ${card.title.da}${da.length ? `, med ${da.join(' og ')}` : ''}. Ca. 5 minutter.`,
      `Next: ${card.title.en}${en.length ? `, with ${en.join(' and ')}` : ''}. About 5 minutes.`,
    );
  }

  /** Kortets mærke: trænet i dag, emner til repetition, ikke startet endnu eller ikke trænet i dag. */
  function badge(s: TrackStatus) {
    if (!s.started) return <span className="track-badge waiting">{tx('Ikke startet endnu', 'Not started yet')}</span>;
    if (s.doneToday) return <span className="track-badge trained">{tx('✓ Trænet i dag', '✓ Trained today')}</span>;
    if (s.due > 0) return <span className="track-badge due">{tx(`${plural(s.due, 'emne', 'emner')} til repetition`, `${plural(s.due, 'item', 'items')} to review`)}</span>;
    return <span className="track-badge waiting">{tx('Ikke trænet i dag', 'Not trained today')}</span>;
  }

  /** Et spors kort; et kort uden status (SPEC-analyse-modul.md) har kun navn, pil, beskrivelse og ⓘ. */
  function trackCard(card: TrackCard) {
    const withStatus = card.status !== false;
    const s = statusOf(card.track);
    const info = `track-${card.track}-info`;
    const level = s.level === null ? null : tx(`Niveau ${s.level}`, `Level ${s.level}`) + (s.grade ? ` · ${GRADE_LABEL[s.grade]}` : '');
    return (
      <div key={card.track} className="with-info">
        <button type="button" className="track-card" aria-label={both(card.title)} aria-describedby={info} onClick={() => onOpen?.(card.screen)}>
          <span className="track-card-head">
            <span>{both(card.title)}</span>
            <span className="track-card-arrow" aria-hidden="true">
              →
            </span>
          </span>
          <span id={info} className="track-card-body">
            <span className="track-card-desc">{both(card.description)}</span>
            {withStatus && s.started && (
              <span className="track-card-stats">
                <span>
                  <b>{s.streak}</b> {s.streak === 1 ? tx('dag i træk', 'day in a row') : tx('dage i træk', 'days in a row')}
                </span>
                {level && <span>{level}</span>}
              </span>
            )}
            {withStatus && badge(s)}
          </span>
        </button>
        <Info topic={both(card.title)}>{both(card.help)}</Info>
      </div>
    );
  }

  return (
    <>
      <TopBar />
      <main className="screen home">
        <header className="home-head">
          <h1>Fordelingstræneren</h1>
          {onLanguage && (
            <button
              type="button"
              className="btn small-btn"
              lang={other}
              aria-label={tx('Skift sprog til engelsk', 'Switch language to Danish')}
              onClick={() => onLanguage(other)}
            >
              {tx('English', 'Dansk')}
            </button>
          )}
        </header>

        {updateReady && (
          <div className="banner" role="status">
            <span>{tx('En ny version er klar.', 'A new version is ready.')}</span>
            <button type="button" className="btn small-btn" onClick={onUpdate}>
              {tx('Opdatér', 'Update')}
            </button>
          </div>
        )}

        {firstVisit ? (
          <section className="card" aria-labelledby="welcome">
            <h2 id="welcome">{tx('Velkommen', 'Welcome')}</h2>
            <p>
              {tx(
                'Bridgetræning fem minutter om dagen. Appen har fire spor, og hvert spor har sin egen daglige session, streak og XP.',
                'Bridge practice five minutes a day. The app has four tracks, and each track has its own daily session, streak and XP.',
              )}
            </p>
            <p className="muted small">
              {tx(
                'Start med Fordeling, hvis du er i tvivl. Du kan altid skifte spor her på forsiden.',
                'Start with Distribution if you are unsure. You can always switch tracks here on the home screen.',
              )}
            </p>
            <button type="button" className="btn primary" onClick={onStart}>
              {tx('Start med Fordeling', 'Start with Distribution')}
            </button>
            <button type="button" className="btn small-btn" onClick={onClub}>
              {tx('Se en klubaften: 100 hænder', 'See a club evening: 100 hands')}
            </button>
          </section>
        ) : (
          <section className="card" aria-labelledby="today">
            <div className="with-info">
              <span className="eyebrow">
                {tx('I dag', 'Today')} · {dayText(today)}
              </span>
              <Info topic={tx('I dag', 'Today')}>
                {tx(
                  'Et spor er trænet, når dagens session i sporet er gennemført; dagen skifter kl. 04. Næste spor er det første spor her på forsiden, der ikke er trænet i dag, og knappen starter dets session.',
                  "A track is trained when today's session in the track is complete; the day changes at 04:00. The next track is the first track on this screen that is not yet trained today, and the button starts its session.",
                )}
              </Info>
            </div>
            <h2 id="today">{tx(`${overview.done} af ${overview.total} spor er trænet`, `${overview.done} of ${overview.total} tracks trained`)}</h2>
            <div
              className="meter"
              role="meter"
              aria-label={tx('Spor trænet i dag', 'Tracks trained today')}
              aria-valuemin={0}
              aria-valuemax={overview.total}
              aria-valuenow={overview.done}
            >
              <span style={{ width: `${(overview.done / overview.total) * 100}%` }} />
            </div>
            {nextCard ? (
              <>
                <p className="muted small">{nextText(nextCard)}</p>
                <button type="button" className="btn primary" onClick={() => startTrack(nextCard)}>
                  {tx(`Start dagens session i ${nextCard.title.da}`, `Start today's session in ${nextCard.title.en}`)}
                </button>
              </>
            ) : (
              <>
                <p className="muted small">
                  {tx(`Alle ${overview.total === 4 ? 'fire' : overview.total} spor er trænet i dag.`, `All ${overview.total === 4 ? 'four' : overview.total} tracks are trained today.`)}
                </p>
                <button type="button" className="btn primary" onClick={() => startTrack(firstCard)}>
                  {tx(`Tag en ekstra session i ${firstCard.title.da}`, `Take an extra session in ${firstCard.title.en}`)}
                </button>
              </>
            )}
          </section>
        )}

        {/* Grupperne står side om side fra 1000 px (SPEC-forside-bred.md); under det er beholderen display: contents. */}
        {onOpen && (
          <div className="home-groups">
            {GROUPS.map((group) => {
              const own = cards.filter((card) => card.group === group.id);
              if (!own.length) return null;
              return (
                <section key={group.id} className="home-group" aria-labelledby={`group-${group.id}`}>
                  <div className="with-info">
                    <h2 id={`group-${group.id}`} className="eyebrow">
                      {both(group.title)}
                    </h2>
                    <Info topic={both(group.title)}>{both(group.help)}</Info>
                  </div>
                  {own.map(trackCard)}
                </section>
              );
            })}
          </div>
        )}

        {onGuide && (
          <section className="card">
            <h2>{tx('Vejledning', 'Guide')}</h2>
            <p className="muted small">
              {tx(
                'Sådan bruger du appen: sessionen, øvelserne, husketeknikkerne, farvebehandling, sprog og dine data. Tryk på ⓘ ved et element for at få en kort forklaring.',
                'How to use the app: the session, the exercises, the memory techniques, suit combinations, language and your data. Tap ⓘ next to an element for a short explanation.',
              )}
            </p>
            <button type="button" className="btn small-btn" onClick={onGuide}>
              {tx('Læs vejledningen', 'Read the guide')}
            </button>
          </section>
        )}

        <div className="two">
          <div className="with-info">
            <button type="button" className="btn" onClick={onSettings}>
              {tx('Indstillinger', 'Settings')}
            </button>
            <Info topic={tx('Indstillinger', 'Settings')}>
              {tx(
                'Sikkerhedskopi (eksport og import af dine data), tærsklerne for hurtige svar og visningen i Lynaflæsning.',
                'Backup (export and import of your data), the thresholds for fast answers and the display in Lightning reading.',
              )}
            </Info>
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
