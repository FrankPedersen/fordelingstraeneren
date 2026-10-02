import { formatDecimal } from '../../engine/format';
import type { Saved } from '../../engine/storage';
import { GRADES, GRADE_LABEL } from '../../domain/patterns';
import { LineChart } from '../../ui/LineChart';
import { weeklyCurves } from '../curves';

const perMinute = (v: number) => formatDecimal(v, v % 1 ? 1 : 0);
const percentText = (v: number) => `${Math.round(v * 100)} %`;

export function CurvesScreen({ saved, onBack }: { saved: Saved; onBack(): void }) {
  const weeks = weeklyCurves(saved);
  const lightning = [
    { title: 'Højere/lavere', key: 'higherLower' as const },
    { title: 'Lynaflæsning', key: 'read' as const },
  ].filter(({ key }) => weeks.some((w) => w[key] !== null));
  const grades = GRADES.filter((g) => weeks.some((w) => w.grades[g] !== undefined));

  return (
    <main className="screen">
      <header className="screen-head">
        <button type="button" className="round" aria-label="Tilbage" onClick={onBack}>
          ←
        </button>
        <h1>Kurver</h1>
      </header>

      {weeks.length === 0 ? (
        <section className="card">
          <p>Kurverne tegnes, når du har gennemført din første session.</p>
        </section>
      ) : (
        <>
          <h2>Korrekte svar pr. minut i lynrunden</h2>
          <p className="muted small">Gennemsnit pr. uge. Lynrunden skifter mellem øvelserne fra dag til dag.</p>
          {lightning.map(({ title, key }) => (
            <section key={key} className="card">
              <h3>{title}</h3>
              <LineChart
                title={`${title}: korrekte svar pr. minut`}
                points={weeks.map((w) => ({ label: w.label, value: w[key] }))}
                format={perMinute}
              />
            </section>
          ))}

          <h2>Træfsikkerhed pr. grad</h2>
          <p className="muted small">Andelen af rigtige svar uden for lynrunden, uge for uge.</p>
          {grades.map((grade) => (
            <section key={grade} className="card">
              <h3>{GRADE_LABEL[grade]}</h3>
              <LineChart
                title={`Træfsikkerhed, ${GRADE_LABEL[grade]}`}
                points={weeks.map((w) => ({ label: w.label, value: w.grades[grade] ?? null }))}
                format={percentText}
                yMax={1}
              />
            </section>
          ))}
        </>
      )}
    </main>
  );
}
