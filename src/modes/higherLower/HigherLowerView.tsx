import { compareFrequency } from '../../domain/compare';
import { patternById } from '../../domain/patterns';
import { Skyline } from '../../ui/Skyline';
import { patternPercent } from '../../ui/text';
import type { HigherLowerAnswer, HigherLowerTask } from './task';

interface HigherLowerViewProps {
  task: HigherLowerTask;
  /** Brugerens svar; så låses opgaven. */
  chosen?: HigherLowerAnswer;
  /** Vis facit: sandsynlighederne og det rigtige svar. */
  reveal: boolean;
  onAnswer(answer: HigherLowerAnswer): void;
}

export function HigherLowerView({ task, chosen, reveal, onAnswer }: HigherLowerViewProps) {
  const a = patternById(task.a);
  const b = patternById(task.b);
  const scale = Math.max(8, a.lengths[0], b.lengths[0]);
  const right = compareFrequency(a, b);

  const classes = (answer: HigherLowerAnswer) =>
    [
      'choice',
      chosen === answer && 'chosen',
      reveal && answer === right && 'right',
      reveal && chosen === answer && answer !== right && 'wrong',
    ]
      .filter(Boolean)
      .join(' ');

  const option = (answer: 'a' | 'b') => {
    const pattern = answer === 'a' ? a : b;
    return (
      <button
        type="button"
        className={classes(answer)}
        disabled={chosen !== undefined}
        aria-pressed={chosen === answer}
        onClick={() => onAnswer(answer)}
      >
        <Skyline id={pattern.id} scale={scale} />
        {reveal && (
          <span className="choice-facit">
            <strong>{patternPercent(pattern)}</strong>
            <span>{pattern.per100} pr. 100 hænder</span>
            {answer === right && <span className="badge">Hyppigst</span>}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="task">
      <p className="prompt">Hvilket mønster er hyppigst?</p>
      <div className="pair">
        {option('a')}
        {option('b')}
      </div>
      <button
        type="button"
        className={`${classes('equal')} equal`}
        disabled={chosen !== undefined}
        aria-pressed={chosen === 'equal'}
        onClick={() => onAnswer('equal')}
      >
        ≈ Lige hyppige
        {reveal && right === 'equal' && <span className="badge">Under 2 % forskel</span>}
      </button>
    </div>
  );
}
