import { dayOf } from '../../engine/dates';
import { formatInt } from '../../engine/format';
import type { BankItem } from '../analysis';
import type { FbSaved } from '../storage';
import type { Technique } from '../training/palace';
import { accuracy, answerLog, byWeakness, MIN_ANSWERS, taskStats, techniqueStats, weakest, type StatRow } from '../training/stats';
import { TEXT } from './texts';
import { Info } from '../../ui/Info';

interface StatistikProps {
  bank: readonly BankItem[];
  saved: FbSaved;
  techniques: readonly Technique[];
  /** Åbner Selvvalgt med tekniken valgt. */
  onPractice(technique: string): void;
  onBack(): void;
}

const percent = (v: number | null) => (v === null ? '–' : `${formatInt(100 * v)} %`);

interface StatListProps<K extends string> {
  id: string;
  title: string;
  rows: readonly StatRow<K>[];
  name(key: K): string;
  onPractice?(key: K): void;
}

/** Rækkerne med træfsikkerhed, svageste først, og en søjle pr. række. */
function StatList<K extends string>({ id, title, rows, name, onPractice }: StatListProps<K>) {
  return (
    <section className="card" aria-labelledby={id}>
      <h3 id={id}>{title}</h3>
      <ul className="fb-stats" aria-labelledby={id}>
        {rows.map((r) => {
          const all = accuracy(r.all);
          return (
            <li key={r.key} className="fb-stat">
              <div className="fb-stat-head">
                <strong>{name(r.key)}</strong>
                <span>{r.all.answers ? TEXT.statsAll(percent(all), r.all.answers) : TEXT.statsNone}</span>
              </div>
              <span className="fb-bar" aria-hidden="true">
                <span style={{ width: `${Math.round(100 * (all ?? 0))}%` }} />
              </span>
              {r.all.answers > 0 && (
                <span className="fb-note">
                  {r.all.answers < MIN_ANSWERS ? TEXT.statsFew(MIN_ANSWERS) : TEXT.statsRecent(percent(accuracy(r.recent)), r.recent.answers)}
                </span>
              )}
              {onPractice && (
                <button type="button" className="btn small-btn" aria-label={TEXT.statsPracticeOne(name(r.key))} onClick={() => onPractice(r.key)}>
                  {TEXT.statsPractice}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Statistikken: træfsikkerhed pr. teknik og opgavetype; det svageste punkt kan øves i Selvvalgt. */
export function Statistik({ bank, saved, techniques, onPractice, onBack }: StatistikProps) {
  const today = dayOf(Date.now(), saved.settings.dayStartsAtHour);
  const ordered = [...techniques].sort((a, b) => a.order - b.order);
  const nameOf = (id: string) => techniques.find((t) => t.id === id)?.name ?? id;
  const byTechnique = byWeakness(techniqueStats(saved, bank, ordered.map((t) => t.id), today));
  const byTask = byWeakness(taskStats(saved, today));
  const weak = weakest(byTechnique);

  return (
    <div className="fb-narrow">
      <header className="screen-head">
        <button type="button" className="round" aria-label={TEXT.backToTraining} onClick={onBack}>
          ←
        </button>
        <h2>{TEXT.stats}</h2>
        <Info topic={TEXT.stats}>{TEXT.help.stats}</Info>
      </header>
      <p className="fb-note">{TEXT.statsHelp}</p>
      {answerLog(saved).length === 0 ? (
        <p>{TEXT.statsEmpty}</p>
      ) : (
        <>
          {weak && (
            <section className="card">
              <p>{TEXT.statsWeakest(nameOf(weak.key), percent(accuracy(weak.all)), weak.all.answers)}</p>
              <button type="button" className="btn primary" onClick={() => onPractice(weak.key)}>
                {TEXT.statsPractice}
              </button>
            </section>
          )}
          <StatList id="fb-stats-techniques" title={TEXT.statsTechniques} rows={byTechnique} name={nameOf} onPractice={onPractice} />
          <StatList id="fb-stats-tasks" title={TEXT.statsTasks} rows={byTask} name={(key) => TEXT.taskNames[key]} />
        </>
      )}
    </div>
  );
}
