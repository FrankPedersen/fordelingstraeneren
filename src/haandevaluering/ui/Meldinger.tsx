import { Info } from '../../ui/Info';
import { SuitText } from '../../ui/SuitText';
import { TEXT } from './texts';

/** Meldingerne: det, der er kendt i situationen, fx "Fit fundet i ♠" eller makkers åbning med hp-intervallet. */
export function Meldinger({ lines }: { lines: readonly string[] }) {
  return (
    <section className="he-auction" aria-label={TEXT.auction}>
      <div className="with-info">
        <p className="he-eyebrow">{TEXT.auction}</p>
        <Info topic={TEXT.auction}>{TEXT.help.auction}</Info>
      </div>
      {lines.map((line) => (
        <p key={line} className="he-auction-line">
          <SuitText text={line} />
        </p>
      ))}
    </section>
  );
}
