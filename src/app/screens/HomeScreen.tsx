import { dayOf } from '../../engine/dates';
import { formatInt } from '../../engine/format';
import type { Saved } from '../../engine/storage';
import { streakOn } from '../../engine/streak';
import { GRADE_LABEL } from '../../domain/patterns';
import { getLang, tx, type Lang } from '../../i18n';
import { isRoomOpen, palaceOf } from '../../memory/palace';
import { Info } from '../../ui/Info';
import { dueItemKeys, gradeProgress, newPatternsToday } from '../progression';

interface HomeScreenProps {
  saved: Saved;
  updateReady: boolean;
  onUpdate?: () => void;
  onStart(): void;
  onPalace(): void;
  onAlbum(): void;
  onClub(): void;
  onCurves(): void;
  onSettings(): void;
  /** Farvebehandling: et selvstændigt spor (SPEC-farvebehandling.md). */
  onFarvebehandling?(): void;
  /** Skifter appens sprog (dansk/engelsk). */
  onLanguage?(lang: Lang): void;
  /** Den samlede vejledning. */
  onGuide?(): void;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function HomeScreen(props: HomeScreenProps) {
  const { saved, updateReady, onUpdate, onStart, onPalace, onAlbum, onClub, onCurves, onSettings, onFarvebehandling, onLanguage, onGuide } = props;
  const today = dayOf(Date.now(), saved.settings.dayStartsAtHour);
  const streak = streakOn(saved.streak, today);
  const progress = gradeProgress(saved);
  const stations = palaceOf(saved).stations.filter((s) => isRoomOpen(s.room, progress.level));
  const named = stations.filter((s) => s.name.trim()).length;
  const due = dueItemKeys(saved, today).length;
  const fresh = newPatternsToday(saved, today);
  const doneToday = saved.streak.lastDay === today;
  const firstVisit = saved.sessions.length === 0 && Object.keys(saved.items).length === 0;
  const other: Lang = getLang() === 'da' ? 'en' : 'da';

  /** En menuknap med ⓘ ved siden af. */
  const menu = (label: string, onClick: () => void, help: string) => (
    <div className="with-info">
      <button type="button" className="btn" onClick={onClick}>
        {label}
      </button>
      <Info topic={label}>{help}</Info>
    </div>
  );

  return (
    <main className="screen">
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

      {firstVisit && (
        <section className="card">
          <h2>{tx('Velkommen', 'Welcome')}</h2>
          <p>
            {tx(
              'Fem minutter om dagen. Du lærer de 39 mønstre og deres hyppighed og øver dig i at tænke i mønstre, når du tæller en hånd ud.',
              'Five minutes a day. You learn the 39 patterns and how often they occur, and practise thinking in patterns when you count out a hand.',
            )}
          </p>
          <button type="button" className="btn small-btn" onClick={onClub}>
            {tx('Se en klubaften: 100 hænder', 'See a club evening: 100 hands')}
          </button>
        </section>
      )}

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

      <div className="spacer" />
      <div className="actions">
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
        <div className="two">
          {menu(
            tx('Huskepalads', 'Memory palace'),
            onPalace,
            tx(
              'Læg de 13 mest almindelige mønstre på 13 stationer på en rute, du kender udenad, fx hjemmet eller klubben. Navngiv hver station og skriv en scene med mønstrets billede. Paladset hjælper i starten og trappes ud.',
              'Place the 13 most common patterns on 13 stations along a route you know by heart, such as your home or the club. Name each station and write a scene with the pattern’s image. The palace helps at first and is faded out.',
            ),
          )}
          {menu(
            'Album',
            onAlbum,
            tx(
              'Albummet har 39 pladser, én pr. mønster. Et mønster samles, første gang det optræder i en tilfældig hånd i Lynaflæsning; sjældne fund fejres med deres odds. Legendariske kan også låses op med tre rigtige svar.',
              'The album has 39 slots, one per pattern. A pattern is collected the first time it appears in a random hand in Lightning reading; rare finds are celebrated with their odds. Legendary ones can also be unlocked with three right answers.',
            ),
          )}
          {menu(
            tx('Klubaften', 'Club evening'),
            onClub,
            tx(
              'En klubaften er 25 spil × 4 hænder = 100 hænder. Her ser du, hvor mange af dem der i gennemsnit har hvert mønster. Tryk på et mønster for at fremhæve dets hænder.',
              'A club evening is 25 boards × 4 hands = 100 hands. Here you see how many of them have each pattern on average. Tap a pattern to highlight its hands.',
            ),
          )}
          {menu(
            tx('Kurver', 'Charts'),
            onCurves,
            tx(
              'Kurverne viser din udvikling uge for uge: rigtige svar pr. minut i lynrunden og træfsikkerheden pr. grad.',
              'The charts show your progress week by week: correct answers per minute in the lightning round and accuracy per grade.',
            ),
          )}
          {onFarvebehandling &&
            menu(
              tx('Farvebehandling', 'Suit combinations'),
              onFarvebehandling,
              tx(
                'Et selvstændigt spor om at spille én farve: hvilken linje giver størst chance for de stik, du skal bruge? Med egen daglig session, streak og XP, selvvalgt træning, analyse af 657 kombinationer og en løser.',
                'A separate track about playing one suit: which line gives the best chance of the tricks you need? With its own daily session, streak and XP, free practice, analysis of 657 combinations and a solver.',
              ),
            )}
          {menu(
            tx('Indstillinger', 'Settings'),
            onSettings,
            tx(
              'Sikkerhedskopi (eksport og import af dine data), tærsklerne for hurtige svar og visningen i Lynaflæsning.',
              'Backup (export and import of your data), the thresholds for fast answers and the display in Lightning reading.',
            ),
          )}
        </div>
      </div>
    </main>
  );
}
