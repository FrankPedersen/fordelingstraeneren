import { compareFrequency } from '../../domain/compare';
import { patternById } from '../../domain/patterns';
import { Skyline } from '../../ui/Skyline';
import { patternPercent } from '../../ui/text';
import type { HigherLowerAnswer, HigherLowerTask } from './task';
import { tx } from '../../i18n';
import { Info } from '../../ui/Info';

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
            <span>
              {pattern.per100} {tx('pr. 100 hænder', 'per 100 hands')}
            </span>
            {answer === right && <span className="badge">{tx('Hyppigst', 'Most frequent')}</span>}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="task">
      <div className="with-info">
        <p className="prompt">{tx('Hvilket mønster er hyppigst?', 'Which pattern is more frequent?')}</p>
        <Info topic={tx('Højere/lavere', 'Higher/lower')}>
          {tx(
            'Tryk på det mønster, der forekommer oftest. Er forskellen under 2 %, er "≈ Lige hyppige" rigtigt, fx 5-4-2-2 mod 4-3-3-3. Søjlerne er farvernes længder, længste først.',
            'Tap the pattern that occurs more often. If the difference is under 2 %, "≈ Equally frequent" is right, e.g. 5-4-2-2 against 4-3-3-3. The bars are the suit lengths, longest first.',
          )}
        </Info>
      </div>
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
        {tx('≈ Lige hyppige', '≈ Equally frequent')}
        {reveal && right === 'equal' && <span className="badge">{tx('Under 2 % forskel', 'Less than 2 % apart')}</span>}
      </button>
    </div>
  );
}
