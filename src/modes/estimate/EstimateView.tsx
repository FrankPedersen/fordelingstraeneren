import { patternById } from '../../domain/patterns';
import { Klubaften } from '../../ui/Klubaften';
import { NumberPad } from '../../ui/NumberPad';
import { Skyline } from '../../ui/Skyline';
import { patternPercent } from '../../ui/text';
import { estimateTolerance, type EstimateTask } from './task';

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
      <p className="prompt">Hvor mange af aftenens 100 hænder er {pattern.id}?</p>
      <div className="center">
        <Skyline id={pattern.id} />
      </div>
      {answer === undefined ? <NumberPad onSubmit={onAnswer} /> : <p className="note">Dit svar: {answer}</p>}
      {reveal && (
        <>
          <p>
            <strong>{pattern.per100} af 100 hænder</strong> ({patternPercent(pattern)}). Rigtigt inden for ±
            {estimateTolerance(pattern.per100)}.
          </p>
          <Klubaften highlight={pattern.id} />
        </>
      )}
    </div>
  );
}
