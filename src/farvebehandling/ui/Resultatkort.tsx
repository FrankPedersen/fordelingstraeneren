import { formatDecimal } from '../../engine/format';
import type { BankItem, LineView } from '../analysis';
import { eveningText } from '../model/frequency';
import { TEXT } from './texts';
import { stepText } from '../lineText';
import { Info } from '../../ui/Info';

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
  return (
    <section className="card fb-result" aria-labelledby="fb-result-title">
      <div className="with-info">
        <h2 id="fb-result-title">{TEXT.result}</h2>
        <Info topic={TEXT.result}>{TEXT.help.result}</Info>
      </div>
      <p>{TEXT.bestChance(goal, best.letter, `${formatDecimal(100 * best.value, 1)} %`)}</p>
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
