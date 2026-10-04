import type { BankItem } from '../analysis';
import { eveningText } from '../model/frequency';
import type { Room } from '../training/palace';
import { Bridgebord } from './Bridgebord';
import { Rumkort } from './Rumkort';
import { TEXT } from './texts';

interface IntroduktionProps {
  item: BankItem;
  room: Room | null;
  onNext(): void;
}

/**
 * En ny kombination: problemet, hvor tit den opstår, og rummet i paladset med huskeregel og billede. Linjerne vises
 * først i facit, så brugeren selv får prøvet.
 */
export function Introduktion({ item, room, onNext }: IntroduktionProps) {
  return (
    <section className="card fb-intro" aria-label={TEXT.newCombination}>
      <p className="eyebrow">{TEXT.newCombination}</p>
      <Bridgebord north={item.north} south={item.south} />
      <p className="prompt">{TEXT.goalsText(item.combination.goals)}</p>
      <p className="fb-note">{TEXT.combination(eveningText(item.frequency))}</p>
      {room && <Rumkort room={room} station={room.stations.length + 1} fresh />}
      <button type="button" className="btn primary wide" onClick={onNext}>
        {TEXT.tryIt}
      </button>
    </section>
  );
}
