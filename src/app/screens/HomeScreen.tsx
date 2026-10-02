import { dayOf } from '../../engine/dates';
import { formatInt } from '../../engine/format';
import type { Saved } from '../../engine/storage';
import { streakOn } from '../../engine/streak';
import { GRADE_LABEL } from '../../domain/patterns';
import { dueItemKeys, gradeProgress, newPatternsToday } from '../progression';

interface HomeScreenProps {
  saved: Saved;
  updateReady: boolean;
  onUpdate?: () => void;
  onStart(): void;
  onSettings(): void;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function HomeScreen({ saved, updateReady, onUpdate, onStart, onSettings }: HomeScreenProps) {
  const today = dayOf(Date.now(), saved.settings.dayStartsAtHour);
  const streak = streakOn(saved.streak, today);
  const progress = gradeProgress(saved);
  const due = dueItemKeys(saved, today).length;
  const fresh = newPatternsToday(saved, today);
  const doneToday = saved.streak.lastDay === today;
  const firstVisit = saved.sessions.length === 0 && Object.keys(saved.items).length === 0;

  return (
    <main className="screen">
      <header>
        <h1>Fordelingstræneren</h1>
      </header>

      {updateReady && (
        <div className="banner" role="status">
          <span>En ny version er klar.</span>
          <button type="button" className="btn small-btn" onClick={onUpdate}>
            Opdatér
          </button>
        </div>
      )}

      {firstVisit && (
        <section className="card">
          <h2>Velkommen</h2>
          <p>
            Fem minutter om dagen. Du lærer de 39 mønstre og deres hyppighed og øver dig i at tænke i
            mønstre, når du tæller en hånd ud.
          </p>
        </section>
      )}

      <section className="stats">
        <div className="stat">
          <span className="stat-value">{streak.current}</span>
          <span className="stat-label">{streak.current === 1 ? 'dag i træk' : 'dage i træk'}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatInt(saved.xp)}</span>
          <span className="stat-label">XP</span>
        </div>
      </section>
      <p className="muted small">
        {streak.jokerUsedThisWeek ? 'Ugens joker er brugt.' : 'Ugens joker er klar til en glemt dag.'}{' '}
        Bedste streak: {saved.streak.best}.
      </p>

      <section className="card">
        <h2>
          Niveau {progress.level} · {GRADE_LABEL[progress.grade]}
        </h2>
        <div
          className="meter"
          role="meter"
          aria-label="Emner i kasse 3 eller højere"
          aria-valuemin={0}
          aria-valuemax={progress.items}
          aria-valuenow={progress.itemsDone}
        >
          <span style={{ width: `${(progress.itemsDone / progress.items) * 100}%` }} />
        </div>
        <p className="muted small">
          {progress.itemsDone} af {progress.items} emner i kasse 3 eller højere ·{' '}
          {progress.introduced} af {progress.patterns} mønstre introduceret
        </p>
      </section>

      <section className="card">
        <h2>I dag</h2>
        <p>
          {due === 0 ? 'Ingen emner til repetition.' : `${plural(due, 'emne', 'emner')} til repetition.`}
          {fresh > 0 && ` ${plural(fresh, 'nyt mønster venter', 'nye mønstre venter')}.`}
        </p>
        {doneToday && <p className="done">✓ Dagens session er gennemført.</p>}
      </section>

      <div className="spacer" />
      <div className="actions">
        <button type="button" className="btn primary" onClick={onStart}>
          {doneToday ? 'Tag en ekstra session' : 'Start dagens session'}
        </button>
        <button type="button" className="btn" onClick={onSettings}>
          Indstillinger
        </button>
      </div>
    </main>
  );
}
