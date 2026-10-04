import { useMemo, useState } from 'react';
import { dayOf } from '../../engine/dates';
import { mulberry32, randomSeed } from '../../engine/rng';
import type { BankItem } from '../analysis';
import type { FbSaved, TaskType } from '../storage';
import { placeOf, type Technique } from '../training/palace';
import { filterOptions, logPractice, matchCount, NO_FILTER, practiceItems, type FilterKey, type PracticeFilter } from '../training/practice';
import { parseItemKey } from '../training/progression';
import { chooseType } from '../training/session';
import { grade, makeTask, type FbAnswer, type FbTask, type Graded } from '../training/tasks';
import { Facit } from './Facit';
import { Opgave } from './Opgave';
import { TEXT } from './texts';

interface SelvvalgtProps {
  bank: readonly BankItem[];
  saved: FbSaved;
  update(next: FbSaved): void;
  techniques: readonly Technique[];
}

interface Run {
  task: FbTask;
  shownAt: number;
  count: number;
  history: TaskType[];
}

const KEYS: readonly FilterKey[] = ['technique', 'cards', 'missing', 'goal'];

/** Selvvalgt: filtrene med antal kombinationer, derefter opgaver uden XP. Facit vises efter valg af linje. */
export function Selvvalgt({ bank, saved, update, techniques }: SelvvalgtProps) {
  const [filter, setFilter] = useState<PracticeFilter>(NO_FILTER);
  const [run, setRun] = useState<Run | null>(null);
  const [result, setResult] = useState<{ answer: Omit<FbAnswer, 'ms'>; graded: Graded } | null>(null);
  const order = useMemo(() => [...techniques].sort((a, b) => a.order - b.order).map((t) => t.id), [techniques]);
  const options = useMemo(() => filterOptions(bank, filter, order), [bank, filter, order]);
  const count = matchCount(bank, filter);

  function nextTask(previous: Run | null) {
    const items = practiceItems(bank, filter);
    if (!items.length) return;
    const rng = mulberry32(randomSeed());
    const pool = items.length > 1 ? items.filter((k) => k !== previous?.task.item) : items;
    const { id, goal } = parseItemKey(pool[rng.int(pool.length)]);
    const item = bank.find((b) => b.combination.id === id)!;
    const history = previous?.history ?? [];
    const task = makeTask(chooseType(item, goal, history, rng), item, goal, rng);
    setRun({ task, shownAt: Date.now(), count: (previous?.count ?? 0) + 1, history: [...history, task.type] });
    setResult(null);
  }

  function answer(a: Omit<FbAnswer, 'ms'>) {
    if (!run) return;
    const now = Date.now();
    const ms = Math.max(0, now - run.shownAt);
    const graded = grade(run.task, { ...a, ms }, saved.settings.fastMs, { optionalGuess: true });
    const day = dayOf(now, saved.settings.dayStartsAtHour);
    update(logPractice(saved, { day, item: run.task.item, task: run.task.type, score: graded.score, ms }));
    setResult({ answer: a, graded });
  }

  if (run) {
    return (
      <div className="fb-narrow">
        <div className="session-bar">
          <span className="phase">{TEXT.tabs.practice}</span>
          <button type="button" className="btn small-btn fb-push" onClick={() => setRun(null)}>
            {TEXT.changeFilter}
          </button>
        </div>
        {result ? (
          <Facit
            task={run.task}
            answer={result.answer}
            graded={result.graded}
            place={placeOf(saved, bank, techniques, run.task.bank.combination.id)}
            onNext={() => nextTask(run)}
          />
        ) : (
          <Opgave key={run.count} task={run.task} optionalGuess onAnswer={answer} />
        )}
      </div>
    );
  }

  const label = (key: FilterKey, value: string | number) => {
    if (key === 'technique') return techniques.find((t) => t.id === value)?.name ?? String(value);
    if (key === 'cards') return TEXT.cardsOption(value as number);
    if (key === 'goal') return TEXT.goalOption(value as number);
    return value === '' ? TEXT.noHonors : String(value);
  };

  return (
    <div className="fb-narrow">
      <section className="card">
        <h2>{TEXT.practiceTitle}</h2>
        <p className="fb-note">{TEXT.practiceHelp}</p>
      </section>
      {KEYS.map((key) => {
        const all = matchCount(bank, { ...filter, [key]: null });
        return (
          <section key={key} className="card" aria-labelledby={`fb-filter-${key}`}>
            <h2 id={`fb-filter-${key}`}>{TEXT.filters[key]}</h2>
            <div className="fb-filter" role="group" aria-label={TEXT.filters[key]}>
              <button
                type="button"
                className={`btn small-btn${filter[key] === null ? ' selected' : ''}`}
                aria-pressed={filter[key] === null}
                onClick={() => setFilter({ ...filter, [key]: null })}
              >
                {TEXT.option(TEXT.all, all)}
              </button>
              {(options[key] as { value: string | number; count: number }[]).map((o) => (
                <button
                  key={String(o.value)}
                  type="button"
                  className={`btn small-btn${filter[key] === o.value ? ' selected' : ''}`}
                  aria-pressed={filter[key] === o.value}
                  disabled={o.count === 0}
                  onClick={() => setFilter({ ...filter, [key]: o.value })}
                >
                  {TEXT.option(label(key, o.value), o.count)}
                </button>
              ))}
            </div>
          </section>
        );
      })}
      <button type="button" className="btn primary wide" disabled={count === 0} onClick={() => nextTask(null)}>
        {TEXT.startPractice(count)}
      </button>
    </div>
  );
}
