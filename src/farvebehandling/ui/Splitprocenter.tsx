import { formatDecimal } from '../../engine/format';
import { BoardColumn } from '../../ui/BoardColumn';
import { Info } from '../../ui/Info';
import { dropCard, dropChance, splitRows, toppingHonors, wholePercent, type SplitOption, type SplitQuestion } from '../training/split';
import type { FbAnswer, FbTask, Graded } from '../training/tasks';
import { TEXT } from './texts';

/**
 * Splitprocenter i Træning og Selvvalgt (SPEC-splitprocenter.md) i Farvebehandlings opgave- og facitlayout: i det
 * brede layout står spørgsmålet i venstre spalte (hvor bordet står i de andre opgaver) og svarknapperne til højre.
 */

/** Procent med én decimal som i facit, fx "67,8 %". */
const percent = (p: number) => `${formatDecimal(100 * p, 1)} %`;

/** Knappens tekst: hele procent ("68 %") eller sidningen ("4-2"). */
const optionText = (o: SplitOption) => o.label ?? `${wholePercent(o.value!)} %`;

export function SplitOpgave({ question, onAnswer }: { question: SplitQuestion; onAnswer(answer: Omit<FbAnswer, 'ms'>): void }) {
  const name = TEXT.taskNames.splitprocenter;
  const text = TEXT.splitQuestion(question);
  return (
    <section className="card fb-task cols" aria-label={name}>
      <BoardColumn>
        <div className="with-info">
          <p className="prompt">{name}</p>
          <Info topic={name}>{TEXT.help.tasks.splitprocenter}</Info>
        </div>
        <h2 className="fb-task-heading">{text}</h2>
      </BoardColumn>
      <div className="wide-right">
        <div className="fb-intervals" role="group" aria-label={text}>
          {question.options.map((o, i) => (
            <button key={optionText(o)} type="button" className="btn small-btn" onClick={() => onAnswer({ choice: i })}>
              {optionText(o)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

interface SplitFacitProps {
  task: FbTask & { type: 'splitprocenter' };
  answer: Omit<FbAnswer, 'ms'>;
  graded: Graded;
  reward?: { xp: number; combo: number };
  onNext(): void;
}

/**
 * Facit: svaret med én decimal, alle sidninger for antallet som en lille tabel (de spurgte med fed), huskereglen
 * (niveau 1–3) eller regnestykket bag honnøren alene (niveau 4) og hvad det betyder, når farven toppes: chancen for, at
 * kortet under topkortene falder (`dropChance`).
 */
export function SplitFacit({ task, answer, graded, reward, onNext }: SplitFacitProps) {
  const q = task.split;
  const rows = splitRows(q.n);
  const asked = new Set(q.level === 2 ? [rows[0].label] : q.splits);
  const chosen = q.options[answer.choice ?? -1];
  return (
    <div className="fb-facit cols">
      <section className={`feedback ${graded.score > 0 ? 'ok' : 'bad'}`} role="status">
        <span className="feedback-title">{graded.score === 1 ? TEXT.right : TEXT.wrong}</span>
        <span>{TEXT.splitAnswer(q, rows[0].label, percent(q.value))}</span>
        {chosen && <span>{TEXT.splitChoice(optionText(chosen), chosen.correct)}</span>}
        {reward && reward.xp > 0 && <span className="feedback-meta">{TEXT.gained(reward.xp, reward.combo)}</span>}
      </section>

      <BoardColumn>
        <section className="card" aria-labelledby="fb-split-rows">
          <h2 id="fb-split-rows">{TEXT.splitRowsTitle(q.n)}</h2>
          <table className="fb-forms">
            <thead>
              <tr>
                <th scope="col">{TEXT.splitColumn}</th>
                <th scope="col">{TEXT.splitChanceColumn}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{asked.has(r.label) ? <strong>{r.label}</strong> : r.label}</th>
                  <td>{asked.has(r.label) ? <strong>{percent(r.chance)}</strong> : percent(r.chance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </BoardColumn>

      <section className="card" aria-labelledby="fb-split-why">
        <h2 id="fb-split-why">{TEXT.splitWhy}</h2>
        {q.level === 4 ? (
          <p>{TEXT.splitSingleton(q, percent(rows.find((r) => r.label === q.splits[0])!.chance), percent(q.value))}</p>
        ) : (
          <p>
            <span className="fb-label">{TEXT.memory}:</span> {TEXT.splitRule}
          </p>
        )}
        <p>
          <span className="fb-label">{TEXT.splitInPractice}:</span> {TEXT.splitMeaning(q.n, toppingHonors(q.n), dropCard(q.n), percent(dropChance(q.n)))}
        </p>
      </section>

      <div className="fb-actions">
        <button type="button" className="btn primary wide" onClick={onNext}>
          {TEXT.next}
        </button>
      </div>
    </div>
  );
}
