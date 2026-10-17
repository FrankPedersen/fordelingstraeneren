import { Fragment } from 'react';
import { dayOf } from '../../engine/dates';
import { formatInt } from '../../engine/format';
import type { Saved } from '../../engine/storage';
import { streakOn } from '../../engine/streak';
import { GRADE_LABEL } from '../../domain/patterns';
import { tx } from '../../i18n';
import { isRoomOpen, palaceOf } from '../../memory/palace';
import { Footer } from '../../ui/Footer';
import { Info } from '../../ui/Info';
import { TopBar } from '../../ui/TopBar';
import { dueItemKeys, gradeProgress, newPatternsToday } from '../progression';
import { DISTRIBUTION_TRACK, GROUPS, TRACK_ITEMS, type Both, type TrackItem } from '../tracks';

interface DistributionScreenProps {
  saved: Saved;
  onStart(): void;
  onPalace(): void;
  onAlbum(): void;
  onClub(): void;
  onCurves(): void;
  onBack(): void;
  /** Menupunkterne; standard er fordelingssporets punkter i `tracks.ts`. */
  items?: readonly TrackItem[];
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Fordelingssporets egen skærm (SPEC-forside-spor.md): fordelingssporets elementer med samme indhold og i samme
 * rækkefølge, som de stod på forsiden før: streak og XP, jokeren, niveauet, I dag, Start dagens session og menupunkterne.
 */
export function DistributionScreen({ saved, onStart, onPalace, onAlbum, onClub, onCurves, onBack, items = TRACK_ITEMS }: DistributionScreenProps) {
  const today = dayOf(Date.now(), saved.settings.dayStartsAtHour);
  const streak = streakOn(saved.streak, today);
  const progress = gradeProgress(saved);
  const stations = palaceOf(saved).stations.filter((s) => isRoomOpen(s.room, progress.level));
  const named = stations.filter((s) => s.name.trim()).length;
  const due = dueItemKeys(saved, today).length;
  const fresh = newPatternsToday(saved, today);
  const doneToday = saved.streak.lastDay === today;
  const both = (b: Both) => tx(b.da, b.en);
  const counting = GROUPS.find((g) => g.id === 'counting')!;

  const screens: Record<string, (() => void) | undefined> = { palace: onPalace, album: onAlbum, club: onClub, curves: onCurves };
  const menu = items.filter((item) => item.track === DISTRIBUTION_TRACK && screens[item.screen]);

  return (
    <>
      <TopBar />
      <main className="screen">
        <header className="screen-head">
          <button type="button" className="round" aria-label={tx('Tilbage til forsiden', 'Back to the home screen')} onClick={onBack}>
            ←
          </button>
          <span className="eyebrow">{both(counting.title)}</span>
        </header>
        <div>
          <div className="with-info">
            <h1>{tx('Fordeling', 'Distribution')}</h1>
            <Info topic={tx('Fordeling', 'Distribution')}>
              {tx(
                'Fordelingssporet: de 39 mønstre og deres hyppighed. Den daglige session tager ca. 5 minutter, og her finder du også huskepaladset, albummet, klubaftenen og kurverne.',
                'The distribution track: the 39 patterns and how often they occur. The daily session takes about 5 minutes, and here you also find the memory palace, the album, the club evening and the charts.',
              )}
            </Info>
          </div>
          <p className="muted">{tx('De 39 mønstre og deres hyppighed – fem minutter om dagen.', 'The 39 patterns and how often they occur – five minutes a day.')}</p>
        </div>

        <section className="stats">
          <div className="stat">
            <span className="stat-value">{streak.current}</span>
            <span className="stat-label">{streak.current === 1 ? tx('dag i træk', 'day in a row') : tx('dage i træk', 'days in a row')}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{formatInt(saved.xp)}</span>
            <span className="stat-label">XP</span>
          </div>
        </section>
        <div className="with-info">
          <p className="muted small">
            {streak.jokerUsedThisWeek
              ? tx('Ugens joker er brugt.', "This week's joker is used.")
              : tx('Ugens joker er klar til en glemt dag.', "This week's joker is ready for a missed day.")}{' '}
            {tx('Bedste streak:', 'Best streak:')} {saved.streak.best}.
          </p>
          <Info topic={tx('Streak og XP', 'Streak and XP')}>
            {tx(
              'Streak er antal dage i træk med en gennemført session; dagen skifter kl. 04. Én glemt dag pr. uge dækkes automatisk af ugens joker. XP: 10 for et rigtigt svar, mere for hurtige svar og for mange rigtige i træk (combo).',
              'Your streak is the number of days in a row with a completed session; the day changes at 04:00. One missed day per week is covered automatically by the weekly joker. XP: 10 for a right answer, more for fast answers and for long runs of right answers (combo).',
            )}
          </Info>
        </div>

        <section className="card">
          <div className="with-info">
            <h2>
              {tx('Niveau', 'Level')} {progress.level} · {GRADE_LABEL[progress.grade]}
            </h2>
            <Info topic={tx('Niveau', 'Level')}>
              {tx(
                'Niveauet følger mønstrenes grader: almindelig, ualmindelig, sjælden, episk og legendarisk. Næste grad låses op, når alle emner i den nuværende grad står i kasse 3 eller højere i Leitner-systemet. Bjælken viser, hvor langt du er, og et nyt rum i huskepaladset åbner med niveauet.',
                'Your level follows the pattern grades: common, uncommon, rare, epic and legendary. The next grade unlocks when all items in the current grade are in box 3 or higher in the Leitner system. The bar shows how far you are, and a new room in the memory palace opens with each level.',
              )}
            </Info>
          </div>
          <div
            className="meter"
            role="meter"
            aria-label={tx('Emner i kasse 3 eller højere', 'Items in box 3 or higher')}
            aria-valuemin={0}
            aria-valuemax={progress.items}
            aria-valuenow={progress.itemsDone}
          >
            <span style={{ width: `${(progress.itemsDone / progress.items) * 100}%` }} />
          </div>
          <p className="muted small">
            {tx(
              `${progress.itemsDone} af ${progress.items} emner i kasse 3 eller højere · ${progress.introduced} af ${progress.patterns} mønstre introduceret`,
              `${progress.itemsDone} of ${progress.items} items in box 3 or higher · ${progress.introduced} of ${progress.patterns} patterns introduced`,
            )}
          </p>
          <p className="muted small">
            {tx(`Huskepalads: ${named} af ${stations.length} stationer navngivet.`, `Memory palace: ${named} of ${stations.length} stations named.`)}
          </p>
        </section>

        <section className="card">
          <div className="with-info">
            <h2>{tx('I dag', 'Today')}</h2>
            <Info topic={tx('I dag', 'Today')}>
              {tx(
                'Repetition er de emner, Leitner-systemet har sat til i dag. Et rigtigt og hurtigt svar flytter emnet en kasse op, så det kommer igen om 1, 2, 4, 8 eller 16 dage; et forkert svar sender det tilbage til kasse 1. Der kommer højst 2 nye mønstre pr. dag.',
                'Review is the items the Leitner system has scheduled for today. A right and fast answer moves the item up one box, so it returns in 1, 2, 4, 8 or 16 days; a wrong answer sends it back to box 1. At most 2 new patterns arrive per day.',
              )}
            </Info>
          </div>
          <p>
            {due === 0
              ? tx('Ingen emner til repetition.', 'No items to review.')
              : tx(`${plural(due, 'emne', 'emner')} til repetition.`, `${plural(due, 'item', 'items')} to review.`)}
            {fresh > 0 && tx(` ${plural(fresh, 'nyt mønster venter', 'nye mønstre venter')}.`, ` ${plural(fresh, 'new pattern is waiting', 'new patterns are waiting')}.`)}
          </p>
          {doneToday && <p className="done">{tx('✓ Dagens session er gennemført.', "✓ Today's session is complete.")}</p>}
        </section>
        <div className="with-info">
          <button type="button" className="btn primary" onClick={onStart}>
            {doneToday ? tx('Tag en ekstra session', 'Take an extra session') : tx('Start dagens session', "Start today's session")}
          </button>
          <Info topic={tx('Sessionen', 'The session')}>
            {tx(
              'En session tager ca. 5 minutter: repetition, niveauøvelse, lynrunde, 13-sudoku og status. Timeren er blød, så opgaven, du er i gang med, gøres altid færdig. Dagen tæller i din streak, når sessionen er gennemført.',
              'A session takes about 5 minutes: review, level practice, lightning round, 13-sudoku and status. The timer is soft, so the task you are working on is always finished. The day counts in your streak when the session is complete.',
            )}
          </Info>
        </div>
        {menu.length > 0 && (
          <div className="two">
            {menu.map((item) => (
              <Fragment key={item.id}>
                <div className="with-info">
                  <button type="button" className="btn" onClick={screens[item.screen]}>
                    {both(item.title)}
                  </button>
                  <Info topic={both(item.title)}>{both(item.help)}</Info>
                </div>
              </Fragment>
            ))}
          </div>
        )}
        <Footer />
      </main>
    </>
  );
}
