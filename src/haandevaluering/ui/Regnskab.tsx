import { Info } from '../../ui/Info';
import type { PBreakdown } from '../model/pmodel';
import { pointsText, signedText, tricksText } from './format';
import { TEXT } from './texts';

interface RegnskabProps {
  you: PBreakdown;
  /** Makkers regnskab; uden det vises kun din kolonne. */
  partner?: PBreakdown;
  /** Parrets P og stikforventningen under tabellen. */
  total?: { P: number; tricks: number };
}

/** Regnskabet for dig og makker: honnørpoint, trumflængde, korthed, spildte værdier og p, og parrets P. */
export function Regnskab({ you, partner, total }: RegnskabProps) {
  const columns = partner ? [you, partner] : [you];
  const rows: { key: keyof typeof TEXT.rows; value: (b: PBreakdown) => string }[] = [
    { key: 'honors', value: (b) => pointsText(b.honors) },
    { key: 'trump', value: (b) => signedText(b.trump) },
    { key: 'shortness', value: (b) => signedText(b.shortness) },
    ...(columns.some((b) => b.wasted) ? [{ key: 'wasted' as const, value: (b: PBreakdown) => signedText(b.wasted) }] : []),
    { key: 'p', value: (b) => pointsText(b.p) },
  ];
  return (
    <section className="he-panel" aria-labelledby="he-count">
      <div className="with-info">
        <h3 id="he-count" className="he-eyebrow">
          {TEXT.count}
        </h3>
        <Info topic={TEXT.count}>{TEXT.help.count}</Info>
      </div>
      <table className="he-table">
        <thead>
          <tr>
            <td />
            <th scope="col">{TEXT.you}</th>
            {partner && <th scope="col">{TEXT.partner}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className={row.key === 'p' ? 'he-sum' : undefined}>
              <th scope="row">{TEXT.rows[row.key]}</th>
              {columns.map((b, i) => (
                <td key={i}>{row.value(b)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {total && <p className="he-total">{TEXT.total(pointsText(total.P), tricksText(total.tricks))}</p>}
    </section>
  );
}
