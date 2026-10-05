import { Info } from '../../ui/Info';
import { panelRest } from '../model/points';
import { shownPoints, type Ledger } from '../model/solver';
import { rangeText } from './format';
import { TEXT } from './texts';

/**
 * Regnskabspanelet: interval, vist og rest for Vest og Øst. Rest er kun de tilladte point minus det viste, så panelet
 * aldrig afslører løserens slutning.
 */
export function Regnskabspanel({ ledger }: { ledger: Ledger }) {
  const rows = (['W', 'E'] as const).map((d) => {
    const shown = shownPoints(ledger[d].shown);
    return { d, range: rangeText(ledger[d].allowed), shown, left: rangeText(panelRest(ledger[d].allowed, shown), 40 - shown) };
  });
  return (
    <section className="pr-panel" aria-label={TEXT.count}>
      <div className="with-info">
        <h3 className="pr-eyebrow">{TEXT.count}</h3>
        <Info topic={TEXT.count}>{TEXT.help.panel}</Info>
      </div>
      <table className="pr-table">
        <thead>
          <tr>
            <th scope="col">
              <span className="pr-hidden">{TEXT.count}</span>
            </th>
            {rows.map((r) => (
              <th key={r.d} scope="col">
                {TEXT.seat[r.d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{TEXT.range}</th>
            {rows.map((r) => (
              <td key={r.d}>{r.range}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">{TEXT.shown}</th>
            {rows.map((r) => (
              <td key={r.d}>{r.shown}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">{TEXT.left}</th>
            {rows.map((r) => (
              <td key={r.d}>{r.left}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </section>
  );
}
