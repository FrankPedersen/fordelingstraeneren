import { formatDecimal } from '../../engine/format';
import type { Saved } from '../../engine/storage';
import { GRADES, GRADE_LABEL } from '../../domain/patterns';
import { LineChart } from '../../ui/LineChart';
import { weeklyCurves } from '../curves';
import { tx } from '../../i18n';
import { Info } from '../../ui/Info';

const perMinute = (v: number) => formatDecimal(v, v % 1 ? 1 : 0);
const percentText = (v: number) => `${Math.round(v * 100)} %`;

export function CurvesScreen({ saved, onBack }: { saved: Saved; onBack(): void }) {
  const weeks = weeklyCurves(saved);
  const lightning = [
    { title: tx('Højere/lavere', 'Higher/lower'), key: 'higherLower' as const },
    { title: tx('Lynaflæsning', 'Lightning reading'), key: 'read' as const },
  ].filter(({ key }) => weeks.some((w) => w[key] !== null));
  const grades = GRADES.filter((g) => weeks.some((w) => w.grades[g] !== undefined));

  return (
    <main className="screen">
      <header className="screen-head">
        <button type="button" className="round" aria-label={tx('Tilbage', 'Back')} onClick={onBack}>
          ←
        </button>
        <h1>{tx('Kurver', 'Charts')}</h1>
        <Info topic={tx('Kurver', 'Charts')}>
          {tx(
            'Hvert diagram viser én ting uge for uge. Stiger kurven for rigtige pr. minut, genkender du mønstrene hurtigere; træfsikkerheden pr. grad viser, hvilke mønstre der sidder, og hvilke der skal øves mere.',
            'Each chart shows one thing week by week. If the correct-per-minute curve rises, you recognise the patterns faster; accuracy per grade shows which patterns are secure and which need more practice.',
          )}
        </Info>
      </header>

      {weeks.length === 0 ? (
        <section className="card">
          <p>{tx('Kurverne tegnes, når du har gennemført din første session.', 'The charts are drawn once you have completed your first session.')}</p>
        </section>
      ) : (
        <>
          <h2>{tx('Korrekte svar pr. minut i lynrunden', 'Correct answers per minute in the lightning round')}</h2>
          <p className="muted small">
            {tx('Gennemsnit pr. uge. Lynrunden skifter mellem øvelserne fra dag til dag.', 'Average per week. The lightning round alternates between the exercises from day to day.')}
          </p>
          {lightning.map(({ title, key }) => (
            <section key={key} className="card">
              <h3>{title}</h3>
              <LineChart
                title={tx(`${title}: korrekte svar pr. minut`, `${title}: correct answers per minute`)}
                points={weeks.map((w) => ({ label: w.label, value: w[key] }))}
                format={perMinute}
              />
            </section>
          ))}

          <h2>{tx('Træfsikkerhed pr. grad', 'Accuracy per grade')}</h2>
          <p className="muted small">{tx('Andelen af rigtige svar uden for lynrunden, uge for uge.', 'The share of right answers outside the lightning round, week by week.')}</p>
          {grades.map((grade) => (
            <section key={grade} className="card">
              <h3>{GRADE_LABEL[grade]}</h3>
              <LineChart
                title={tx(`Træfsikkerhed, ${GRADE_LABEL[grade]}`, `Accuracy, ${GRADE_LABEL[grade]}`)}
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
