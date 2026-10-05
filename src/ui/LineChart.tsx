import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { tx } from '../i18n';

export interface ChartPoint {
  label: string;
  value: number | null;
}

interface LineChartProps {
  /** Hvad kurven viser; bruges som tilgængeligt navn og overskrift i tabelvisningen. */
  title: string;
  points: ChartPoint[];
  format(value: number): string;
  /** Fast top for y-aksen (fx 1 for 100 %); ellers rundes den største værdi op. */
  yMax?: number;
}

const W = 340;
const H = 168;
const PAD = { left: 34, right: 44, top: 14, bottom: 26 };

/** Rund op til et pænt tal: 1, 2 eller 5 gange en tierpotens. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 5, 10].map((m) => m * power).find((m) => m >= value)!;
}

/** Én serie over uger: 2px linje, markører med ring i fladens farve, slutværdi og trådkors på tryk. */
export function LineChart({ title, points, format, yMax }: LineChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const tableId = useId();
  const values = points.map((p) => p.value).filter((v): v is number => v !== null);
  const top = yMax ?? niceMax(Math.max(...values, 0));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;

  // Linjen brydes, hvor en uge mangler data.
  const segments: string[] = [];
  let current = '';
  points.forEach((p, i) => {
    if (p.value === null) {
      if (current) segments.push(current);
      current = '';
    } else {
      current += `${current ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`;
    }
  });
  if (current) segments.push(current);

  const lastIndex = points.reduce((last, p, i) => (p.value !== null ? i : last), -1);
  const nearest = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    });
    return best;
  };
  const onPointer = (e: PointerEvent<SVGSVGElement>) => setActive(nearest(e.clientX, e.currentTarget.getBoundingClientRect()));
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const step = e.key === 'ArrowRight' ? 1 : -1;
    setActive(Math.min(points.length - 1, Math.max(0, (active ?? lastIndex) + step)));
  };

  const shown = active !== null ? points[active] : null;
  const ticks = [0, top / 2, top];

  return (
    <div className="chart">
      <div
        className="chart-frame"
        tabIndex={0}
        role="img"
        aria-label={`${title}. ${points
          .filter((p) => p.value !== null)
          .map((p) => `${p.label}: ${format(p.value!)}`)
          .join(', ')}`}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} onPointerDown={onPointer} onPointerMove={onPointer} onPointerLeave={() => setActive(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line className="chart-grid" x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
              <text className="chart-tick" x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end">
                {format(t)}
              </text>
            </g>
          ))}
          <text className="chart-tick" x={x(0)} y={H - 6} textAnchor={points.length === 1 ? 'middle' : 'start'}>
            {points[0].label}
          </text>
          {points.length > 1 && (
            <text className="chart-tick" x={x(points.length - 1)} y={H - 6} textAnchor="end">
              {points.at(-1)!.label}
            </text>
          )}
          {active !== null && <line className="chart-crosshair" x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotH} />}
          {segments.map((d) => (
            <path key={d} className="chart-line" d={d} />
          ))}
          {points.map((p, i) =>
            p.value === null ? null : (
              <circle key={i} className="chart-dot" cx={x(i)} cy={y(p.value)} r={active === i ? 5.5 : 4} />
            ),
          )}
          {lastIndex >= 0 && active === null && (
            <text className="chart-end" x={x(lastIndex) + 8} y={y(points[lastIndex].value!)} dy="0.32em">
              {format(points[lastIndex].value!)}
            </text>
          )}
        </svg>
        <p className="chart-readout" aria-live="polite">
          {shown ? (
            <>
              <strong>{shown.value === null ? tx('ingen data', 'no data') : format(shown.value)}</strong> · {shown.label}
            </>
          ) : (
            tx('Tryk på kurven for at se en uge.', 'Tap the curve to see a week.')
          )}
        </p>
      </div>
      <details className="chart-table">
        <summary>{tx('Vis som tabel', 'Show as a table')}</summary>
        <table aria-describedby={tableId}>
          <caption id={tableId}>{title}</caption>
          <tbody>
            {points.map((p) => (
              <tr key={p.label}>
                <th scope="row">{p.label}</th>
                <td>{p.value === null ? '–' : format(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
