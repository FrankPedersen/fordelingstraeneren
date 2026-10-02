import { useState } from 'react';
import { dayOf } from '../../engine/dates';
import { formatInt } from '../../engine/format';
import { randomSeed } from '../../engine/rng';
import type { Saved } from '../../engine/storage';
import { GRADE_LABEL, patternById, type Pattern } from '../../domain/patterns';
import { imageOf } from '../../memory/images';
import { Skyline } from '../../ui/Skyline';
import { patternPercent } from '../../ui/text';
import { albumByGrade, legendaryQuiz, unlockLegendary, type QuizQuestion } from '../album';

interface AlbumScreenProps {
  saved: Saved;
  onSave(saved: Saved): void;
  onBack(): void;
}

export function AlbumScreen({ saved, onSave, onBack }: AlbumScreenProps) {
  const [open, setOpen] = useState<string | null>(null);
  const grades = albumByGrade(saved);
  const collected = grades.reduce((sum, g) => sum + g.slots.filter((s) => s.entry).length, 0);

  return (
    <main className="screen">
      <header className="screen-head">
        <button type="button" className="round" aria-label="Tilbage" onClick={onBack}>
          ←
        </button>
        <h1>Album</h1>
      </header>
      <p className="muted small">
        {collected} af 39 mønstre samlet. Et mønster samles første gang, det dukker op i en tilfældig hånd i
        Lynaflæsning. De legendariske kan også låses op med tre rigtige svar.
      </p>

      {grades.map(({ grade, slots }) => (
        <section key={grade} className="card">
          <h2>
            {GRADE_LABEL[grade]}{' '}
            <span className="muted small">
              {slots.filter((s) => s.entry).length} af {slots.length}
            </span>
          </h2>
          <div className="album-grid">
            {slots.map(({ pattern, entry }) => (
              <button
                key={pattern.id}
                type="button"
                className={`slot${entry ? ' collected' : ''}`}
                onClick={() => setOpen(pattern.id)}
              >
                {entry ? <Skyline id={pattern.id} size="sm" label={false} /> : <span className="slot-mark">?</span>}
                <strong>{pattern.id}</strong>
                <span className="muted small">
                  {entry ? `× ${entry.count}` : `1 ud af ${formatInt(pattern.oneIn)}`}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {open && (
        <SlotDialog saved={saved} pattern={patternById(open)} onSave={onSave} onClose={() => setOpen(null)} />
      )}
    </main>
  );
}

interface SlotDialogProps {
  saved: Saved;
  pattern: Pattern;
  onSave(saved: Saved): void;
  onClose(): void;
}

function SlotDialog({ saved, pattern, onSave, onClose }: SlotDialogProps) {
  const entry = saved.album[pattern.id];
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const image = imageOf(saved, pattern.id);

  function setImage(text: string) {
    const images = { ...saved.images };
    if (text) images[pattern.id] = text;
    else delete images[pattern.id];
    onSave({ ...saved, images });
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="slot-title">
      <div className="dialog">
        <h2 id="slot-title">{pattern.id}</h2>
        {quiz ? (
          <Quiz
            questions={quiz}
            onDone={(passed) => {
              if (passed) onSave(unlockLegendary(saved, pattern.id, dayOf(Date.now(), saved.settings.dayStartsAtHour)));
              setQuiz(null);
            }}
          />
        ) : (
          <>
            <div className="center">
              <Skyline id={pattern.id} />
            </div>
            <p>
              {GRADE_LABEL[pattern.grade]} · {patternPercent(pattern)} · 1 ud af {formatInt(pattern.oneIn)} ·{' '}
              {pattern.placements} placeringer
            </p>
            {entry ? (
              <p className="muted small">
                {entry.count > 0
                  ? `Set i ${entry.count} ${entry.count === 1 ? 'hånd' : 'hænder'}, første gang ${entry.first}.`
                  : `Låst op ${entry.first}.`}
              </p>
            ) : (
              <p className="muted small">Ikke samlet endnu.</p>
            )}
            <label className="field">
              <span>Billede</span>
              <input
                value={saved.images[pattern.id] ?? ''}
                placeholder={image?.own ? '' : (image?.name ?? 'Skriv dit eget billede')}
                onChange={(e) => setImage(e.target.value)}
              />
            </label>
            {!entry && pattern.grade === 'legendary' && (
              <button type="button" className="btn primary" onClick={() => setQuiz(legendaryQuiz(pattern, randomSeed()))}>
                Lås op med tre spørgsmål
              </button>
            )}
          </>
        )}
        <button type="button" className="btn" onClick={onClose}>
          Luk
        </button>
      </div>
    </div>
  );
}

function Quiz({ questions, onDone }: { questions: QuizQuestion[]; onDone(passed: boolean): void }) {
  const [answers, setAnswers] = useState<string[]>([]);
  const done = answers.length === questions.length;
  const passed = done && answers.every((a, i) => a === questions[i].answer);

  if (done) {
    return (
      <div className="quiz" role="status">
        <p className="feedback-title">{passed ? '✓ Låst op!' : '✗ Ikke helt'}</p>
        {questions.map((q, i) => (
          <p key={q.prompt} className="small">
            {answers[i] === q.answer ? '✓' : '✗'} {q.prompt} {q.answer}
          </p>
        ))}
        <button type="button" className="btn primary" onClick={() => onDone(passed)}>
          {passed ? 'Til albummet' : 'Prøv igen senere'}
        </button>
      </div>
    );
  }

  const q = questions[answers.length];
  return (
    <div className="quiz">
      <p className="muted small">
        Spørgsmål {answers.length + 1} af {questions.length}
      </p>
      <p className="prompt">{q.prompt}</p>
      <div className="quiz-options">
        {q.options.map((option) => (
          <button key={option} type="button" className="btn" onClick={() => setAnswers([...answers, option])}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
