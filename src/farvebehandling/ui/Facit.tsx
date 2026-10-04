import { useMemo, useState } from 'react';
import { formatDecimal } from '../../engine/format';
import { bandFields, compactLayout, disagreements, sortFields, type Grouping, type LineView } from '../analysis';
import { guessInterval } from '../model/guess';
import type { Room, Station } from '../training/palace';
import { bestOption, vacantWeights, type FbAnswer, type FbTask, type Graded } from '../training/tasks';
import { LayoutList } from './Analysevindue';
import { Bridgebord } from './Bridgebord';
import { Linjekort } from './Linjekort';
import { letteredLines } from './Opgave';
import { Resultatkort } from './Resultatkort';
import { Rumkort } from './Rumkort';
import { Sandsynlighedsbånd } from './Sandsynlighedsbånd';
import { TEXT } from './texts';

interface FacitProps {
  task: FbTask;
  answer: Omit<FbAnswer, 'ms'>;
  graded: Graded;
  /** Kun i Træning: XP og rigtige i træk. */
  reward?: { xp: number; combo: number };
  place: { room: Room; station: Station | null } | null;
  onNext(): void;
}

const percent = (p: number) => `${formatDecimal(100 * p, 1)} %`;

/** Opgavens linjer med bogstaverne fra opgaven; den bedste markeres. */
function facitLines(task: FbTask): LineView[] {
  const best = bestOption(task);
  const options = task.type === 'chancen' || task.type === 'find-hullet' ? [task.line] : task.options;
  return letteredLines(options).map((l, i) => ({ ...l, best: options[i] === best, nearBest: false }));
}

/**
 * Facitskærmen er analysevinduet for opgaven: først svaret, så linjerne og forskellen i sandsynlighedsbåndet;
 * "Hvorfor" viser huskeregel, billede og alle sidninger. Tonen skiller beslutning fra resultat.
 */
export function Facit({ task, answer, graded, reward, place, onNext }: FacitProps) {
  const [page, setPage] = useState<'facit' | 'why'>('facit');
  const [grouping, setGrouping] = useState<Grouping>('fordeling');
  const lines = useMemo(() => facitLines(task), [task]);
  const weights = useMemo(() => (task.type === 'optælling' ? vacantWeights(task.bank, task.vacant) : undefined), [task]);
  const fields = useMemo(() => sortFields(bandFields(task.bank, lines, weights), grouping), [task, lines, weights, grouping]);
  const failing = task.type === 'find-hullet' ? task.fields.find((f) => f.outcomes[0] === 0) ?? null : null;
  const [selected, setSelected] = useState<string | null>(failing?.id ?? null);
  const field = fields.find((f) => f.id === selected) ?? null;
  const best = lines.find((l) => l.best) ?? lines[0];
  const decisive = lines.length > 1 ? disagreements(fields) : fields.filter((f) => f.outcomes[0] === 0);

  const title = graded.score === 1 ? TEXT.right : graded.score === 0.5 ? TEXT.half : TEXT.wrong;
  const details: string[] = [];
  switch (task.type) {
    case 'chancen':
      details.push(TEXT.chanceIs(percent(best.value), TEXT.intervals[guessInterval(100 * best.value)]));
      details.push(TEXT.yourGuess(TEXT.intervals[answer.guess ?? 0], !!graded.guessCorrect));
      break;
    case 'find-hullet': {
      const chosen = task.fields.find((f) => f.id === answer.field);
      if (failing) details.push(TEXT.holeIs(TEXT.layout(failing.west, failing.east)));
      if (chosen) details.push(TEXT.yourHole(TEXT.layout(chosen.west, chosen.east), !!graded.lineCorrect));
      break;
    }
    default: {
      const chosen = lines[answer.line ?? -1];
      if (chosen) details.push(TEXT.yourLine(chosen.letter, !!graded.lineCorrect));
      details.push(TEXT.bestLine(best.letter, percent(best.value)));
      if (task.type !== 'linje-mod-linje') {
        details.push(answer.guess === undefined ? TEXT.noGuess : TEXT.yourGuess(TEXT.intervals[answer.guess], !!graded.guessCorrect));
      }
    }
  }
  const tone =
    graded.score === 1 ? TEXT.goodDecision : graded.score === 0.5 ? TEXT.halfDecision : task.type === 'chancen' || task.type === 'find-hullet' ? null : TEXT.betterLine(best.letter);

  const next = (
    <button type="button" className="btn primary wide" onClick={onNext}>
      {TEXT.next}
    </button>
  );

  if (page === 'why') {
    return (
      <div className="fb-facit">
        {place && <Rumkort room={place.room} station={place.station?.order ?? null} scene={place.station?.scene} />}
        <section className="card" aria-labelledby="fb-all-layouts">
          <h2 id="fb-all-layouts">{TEXT.allLayouts}</h2>
          <GroupingButtons grouping={grouping} onChange={setGrouping} />
          <LayoutList fields={fields} lines={lines.map((l) => l.letter)} selected={selected} onSelect={setSelected} />
        </section>
        <Resultatkort item={task.bank} goal={task.goal} best={best} />
        <div className="fb-actions">
          <button type="button" className="btn small-btn" onClick={() => setPage('facit')}>
            {TEXT.back2}
          </button>
          {next}
        </div>
      </div>
    );
  }

  return (
    <div className="fb-facit">
      <section className={`feedback ${graded.score > 0 ? 'ok' : 'bad'}`} role="status">
        <span className="feedback-title">{title}</span>
        {tone && <span>{tone}</span>}
        {details.map((d) => (
          <span key={d}>{d}</span>
        ))}
        {reward && reward.xp > 0 && <span className="feedback-meta">{TEXT.gained(reward.xp, reward.combo)}</span>}
      </section>

      <section className="card" aria-labelledby="fb-facit-problem">
        <h2 id="fb-facit-problem">{TEXT.goalPrompt(task.goal)}</h2>
        <Bridgebord north={task.bank.north} south={task.bank.south} west={field?.west} east={field?.east} />
      </section>

      <section className="card" aria-labelledby="fb-facit-difference">
        <h2 id="fb-facit-difference">{TEXT.difference}</h2>
        <Sandsynlighedsbånd lines={lines} fields={fields} selected={selected} onSelect={setSelected} />
        {lines.length > 1 && (
          <p>
            {decisive.length
              ? TEXT.disagree(decisive.length, decisive.slice(0, 3).map(compactLayout).join(', '), Math.max(0, decisive.length - 3))
              : TEXT.agree}
          </p>
        )}
        {task.type === 'optælling' && <p className="fb-note">{TEXT.countingNote}</p>}
      </section>

      <section className="card" aria-labelledby="fb-facit-lines">
        <h2 id="fb-facit-lines">{TEXT.lines}</h2>
        <div className="fb-lines">
          {lines.map((l, i) => (
            <Linjekort key={l.letter} line={l} chosen={answer.line === i && task.type !== 'chancen' && task.type !== 'find-hullet'} />
          ))}
        </div>
        <p className="fb-note">{TEXT.assumptions}</p>
      </section>

      <div className="fb-actions">
        <button type="button" className="btn small-btn" onClick={() => setPage('why')}>
          {TEXT.why}
        </button>
        {next}
      </div>
    </div>
  );
}

function GroupingButtons({ grouping, onChange }: { grouping: Grouping; onChange(g: Grouping): void }) {
  return (
    <div className="fb-segment" role="group" aria-label={TEXT.groupBy}>
      <span>{TEXT.groupBy}:</span>
      {(['fordeling', 'honnører'] as const).map((g) => (
        <button
          key={g}
          type="button"
          className={`btn small-btn${grouping === g ? ' selected' : ''}`}
          aria-pressed={grouping === g}
          onClick={() => onChange(g)}
        >
          {g === 'fordeling' ? TEXT.byDistribution : TEXT.byHonors}
        </button>
      ))}
    </div>
  );
}

