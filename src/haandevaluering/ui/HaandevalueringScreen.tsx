import { useCallback, useMemo, useState } from 'react';
import { dayOf } from '../../engine/dates';
import { formatInt } from '../../engine/format';
import { streakOn } from '../../engine/streak';
import { Info } from '../../ui/Info';
import { heExportDue, HE_STORAGE_KEY, loadHeSaved, saveHeSaved, type HeSaved } from '../storage';
import { warmupQueue } from '../training/deck';
import { downloadHeExport, Indstillinger } from './Indstillinger';
import { Session } from './Session';
import { TEXT } from './texts';
import '../../farvebehandling/ui/tokens.css';
import './haandevaluering.css';

type Storage = { getItem(key: string): string | null; setItem(key: string, value: string): void };

/** Browserens lagring under `haandevaluering:v1`; er den spærret (fx privat vindue), bruges en midlertidig i hukommelsen. */
function browserStorage(): Storage {
  try {
    const storage = window.localStorage;
    storage.getItem(HE_STORAGE_KEY);
    return storage;
  } catch {
    const memory = new Map<string, string>();
    return { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => void memory.set(k, v) };
  }
}

/** Håndevaluering: forsiden med dagens plan, sessionen og indstillingerne med data. */
export default function HaandevalueringScreen({ onBack }: { onBack(): void }) {
  const storage = useMemo(browserStorage, []);
  // Intet skrives, før brugeren gør noget.
  const [saved, setSaved] = useState<HeSaved>(() => loadHeSaved(storage));
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<'home' | 'session' | 'settings'>('home');
  const update = useCallback(
    (next: HeSaved) => {
      setSaved(next);
      setFailed(!saveHeSaved(storage, next));
    },
    [storage],
  );
  const home = () => {
    setView('home');
    window.scrollTo(0, 0);
  };

  let content;
  if (view === 'session') content = <Session saved={saved} update={update} onExit={home} />;
  else if (view === 'settings') content = <Indstillinger saved={saved} update={update} onBack={home} />;
  else content = <Forside saved={saved} update={update} onStart={() => setView('session')} onSettings={() => setView('settings')} />;

  return (
    <main className="screen he-screen">
      <header className="screen-head">
        <button type="button" className="round" aria-label={TEXT.back} onClick={onBack}>
          ←
        </button>
        <h1>{TEXT.title}</h1>
        <Info topic={TEXT.title}>{TEXT.help.screen}</Info>
        <span className="he-level">{TEXT.level(saved.level)}</span>
      </header>
      {failed && (
        <p role="alert" className="he-note">
          {TEXT.saveFailed}
        </p>
      )}
      {content}
    </main>
  );
}

interface ForsideProps {
  saved: HeSaved;
  update(next: HeSaved): void;
  onStart(): void;
  onSettings(): void;
}

/** Forsiden: streak og XP, dagens plan, startknappen, husketeknikkerne og indstillinger. */
function Forside({ saved, update, onStart, onSettings }: ForsideProps) {
  const today = dayOf(Date.now(), saved.settings.dayStartsAtHour);
  const streak = streakOn(saved.streak, today).current;
  const cards = warmupQueue(saved.items, today).length;
  return (
    <>
      <div className="stats">
        <div className="stat">
          <span className="stat-value">{streak}</span>
          <span className="stat-label">{TEXT.daysInRow(streak)}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatInt(saved.xp)}</span>
          <span className="stat-label">{TEXT.xp}</span>
        </div>
      </div>
      <section className="card">
        <div className="with-info">
          <h2>{TEXT.today}</h2>
          <Info topic={TEXT.today}>{TEXT.help.today}</Info>
        </div>
        <p>{TEXT.todayPlan(cards, saved.level)}</p>
        {saved.streak.lastDay === today && <p className="he-note">{TEXT.doneToday}</p>}
        <div className="with-info">
          <button type="button" className="btn primary wide" onClick={onStart}>
            {TEXT.start}
          </button>
          <Info topic={TEXT.start}>{TEXT.help.start}</Info>
        </div>
        <p className="he-note">{TEXT.ownTrack}</p>
      </section>
      {heExportDue(saved, today) && (
        <section className="card" aria-label={TEXT.data}>
          <p className="he-note">{TEXT.exportReminder}</p>
          <button type="button" className="btn small-btn" onClick={() => update({ ...saved, lastExport: downloadHeExport(saved) })}>
            {TEXT.exportNow}
          </button>
        </section>
      )}
      <section className="card" aria-labelledby="he-techniques">
        <div className="with-info">
          <h2 id="he-techniques">{TEXT.techniques}</h2>
          <Info topic={TEXT.techniques}>{TEXT.help.techniques}</Info>
        </div>
        <dl className="he-techniques">
          {TEXT.techniqueList.map((t) => (
            <div key={t.key}>
              <dt>{t.name}</dt>
              <dd>{t.text}</dd>
            </div>
          ))}
        </dl>
      </section>
      <div className="with-info">
        <button type="button" className="btn" onClick={onSettings}>
          {TEXT.settings}
        </button>
        <Info topic={TEXT.settings}>{TEXT.help.settings}</Info>
      </div>
    </>
  );
}
