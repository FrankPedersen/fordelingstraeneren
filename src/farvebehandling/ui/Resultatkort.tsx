import { formatDecimal } from '../../engine/format';
import type { BankItem, LineView } from '../analysis';
import { eveningText } from '../model/frequency';
import { TEXT } from './texts';
import { stepText } from '../lineText';

interface ResultatkortProps {
  item: BankItem;
  goal: number;
  best: LineView;
}

/** Resultatet for målet: den bedste chance, parturnering og hvor tit kombinationen opstår. */
export function Resultatkort({ item, goal, best }: ResultatkortProps) {
  const tricks = item.solution.tricks;
  const tricksBest = tricks ? tricks.leads[tricks.best] : null;
  const verified = item.combination.verified;
  const chance = `${formatDecimal(100 * best.value, 1)} %`;
  return (
    <section className="card fb-result" aria-labelledby="fb-result-title">
      <div className="with-info">
        <h2 id="fb-result-title">{TEXT.result}</h2>
      </div>
      {/* Fra 1000 px i Analyse står chancen fremhævet og den korte sætning under; ellers den lange sætning. */}
      <p className="fb-result-wide fb-result-big">{TEXT.resultBig(chance, goal)}</p>
      <p className="fb-result-wide">{TEXT.bestWith(best.letter)}</p>
      <p className="fb-result-long">{TEXT.bestChance(goal, best.letter, chance)}</p>
      {tricksBest && (
        <p className="fb-note">{TEXT.pairs(formatDecimal(tricksBest.value, 2), stepText(tricksBest.steps[0] ?? '').replace(/\.$/, '').toLowerCase())}</p>
      )}
      <h3>{TEXT.frequency}</h3>
      <p className="fb-note">{TEXT.combination(eveningText(item.frequency))}</p>
      <p className="fb-note">
        {TEXT.situation(
          TEXT.situationLabel(item.honors.ours, item.honors.theirs),
          item.north.length + item.south.length,
          eveningText(item.situation),
        )}
      </p>
      <p className="fb-note">{!item.combination.source ? TEXT.computedInApp : verified ? TEXT.verified : TEXT.unverified}</p>
    </section>
  );
}
