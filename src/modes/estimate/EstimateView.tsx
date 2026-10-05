import { patternById } from '../../domain/patterns';
import { Klubaften } from '../../ui/Klubaften';
import { NumberPad } from '../../ui/NumberPad';
import { Skyline } from '../../ui/Skyline';
import { patternPercent } from '../../ui/text';
import { estimateTolerance, type EstimateTask } from './task';
import { tx } from '../../i18n';
import { Info } from '../../ui/Info';

interface EstimateViewProps {
  task: EstimateTask;
  answer?: number;
  reveal: boolean;
  onAnswer(count: number): void;
}

export function EstimateView({ task, answer, reveal, onAnswer }: EstimateViewProps) {
  const pattern = patternById(task.patternId);
  return (
    <div className="task">
      <div className="with-info">
        <p className="prompt">
          {tx(`Hvor mange af aftenens 100 hænder er ${pattern.id}?`, `How many of the evening's 100 hands are ${pattern.id}?`)}
        </p>
        <Info topic={tx('Klubaften-estimat', 'Club evening estimate')}>
          {tx(
            'Tast dit bud på, hvor mange af 100 hænder (25 spil × 4) der har mønstret. Svaret er rigtigt inden for ±1 op til 10 og ±2 derover.',
            'Type your estimate of how many of 100 hands (25 boards × 4) have the pattern. The answer is right within ±1 up to 10 and ±2 above.',
          )}
        </Info>
      </div>
      <div className="center">
        <Skyline id={pattern.id} />
      </div>
      {answer === undefined ? <NumberPad onSubmit={onAnswer} /> : <p className="note">{tx('Dit svar:', 'Your answer:')} {answer}</p>}
      {reveal && (
        <>
          <p>
            <strong>{tx(`${pattern.per100} af 100 hænder`, `${pattern.per100} of 100 hands`)}</strong> ({patternPercent(pattern)}).{' '}
            {tx('Rigtigt inden for ±', 'Right within ±')}
            {estimateTolerance(pattern.per100)}.
          </p>
          <Klubaften highlight={pattern.id} />
        </>
      )}
    </div>
  );
}
