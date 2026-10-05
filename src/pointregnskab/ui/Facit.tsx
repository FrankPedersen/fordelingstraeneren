import { useMemo } from 'react';
import { hcpOf } from '../../system/interpreter';
import { Info } from '../../ui/Info';
import { SuitText } from '../../ui/SuitText';
import type { Explanation } from '../model/explain';
import type { PlacementTask, PointTask } from '../model/generator';
import { honorPoints } from '../model/points';
import { shownPoints, solve, type Placement } from '../model/solver';
import type { Graded, PointAnswer } from '../training/scoring';
import { rangeText, spanText } from './format';
import { TEXT } from './texts';

/** Facit viser de mulige placeringer, når der er så få. */
export const MAX_PLACEMENTS = 4;

/** Skabelonens sætning, bygget af løserens facit (SPEC-pointregnskab.md, Layout, Facit). */
export function facitSentence(task: PlacementTask, e: Explanation): string {
  const card = TEXT.card(e.card);
  const shown = (d: 'W' | 'E') => shownPoints(task.ledger[d].shown);
  switch (e.kind) {
    case 'other-cannot':
      return e.gap
        ? TEXT.otherCannotGap(TEXT.seat[e.other], rangeText(e.rest, 40 - shown(e.other)), card, honorPoints(e.card), TEXT.seat[e.holder], task.ledger.unseen.length === 1)
        : TEXT.otherCannot(TEXT.seat[e.other], e.rest[e.rest.length - 1]?.[1] ?? 0, card, honorPoints(e.card), TEXT.seat[e.holder]);
    case 'must-have':
      return TEXT.mustHave(TEXT.seat[e.holder], rangeText(e.rest, 40 - shown(e.holder)), e.cards.map(TEXT.card));
    case 'open':
      return TEXT.bothFit(card, e.west, e.east);
  }
}

/** Svaret i ord, til linjen "Dit svar". */
function answerText(answer: PointAnswer): string {
  switch (answer.exercise) {
    case 'sum':
      return `${answer.points}`;
    case 'running':
      return TEXT.runningAnswer(answer.W, answer.E);
    case 'can':
      return answer.yes ? TEXT.yes : TEXT.no;
    default:
      return answer.placement === 'open' ? (answer.exercise === 'finesse' ? TEXT.guess : TEXT.cantTell) : TEXT.seat[answer.placement];
  }
}

/** Facits overskrift for en placering. */
function headline(task: PlacementTask): string {
  const card = TEXT.card(task.card);
  if (task.exercise === 'can') return TEXT.canFacit(task.placement !== (task.asked === 'W' ? 'E' : 'W'), TEXT.seat[task.asked!], card);
  if (task.placement === 'open') return task.exercise === 'finesse' ? TEXT.guessFacit(card) : TEXT.openFacit(card);
  return TEXT.placementFacit(TEXT.seat[task.placement as Exclude<Placement, 'open'>], card);
}

interface FacitProps {
  task: PointTask;
  answer: PointAnswer;
  graded: Graded;
  onNext(): void;
}

export function Facit({ task, answer, graded, onNext }: FacitProps) {
  const solution = useMemo(() => (task.exercise === 'sum' || task.exercise === 'running' ? null : solve(task.ledger)), [task]);
  const title =
    graded.result === 'right' ? (graded.inTime ? TEXT.right : TEXT.rightSlow) : graded.result === 'half' ? TEXT.half : TEXT.wrong;
  let body;
  if (task.exercise === 'sum') {
    body = <p>{TEXT.sumFacit(hcpOf(task.hands.N), hcpOf(task.hands.S), task.m)}</p>;
  } else if (task.exercise === 'running') {
    body = <p>{TEXT.runningFacit(task.shown.W, task.shown.E)}</p>;
  } else {
    const feasible = solution!.feasible;
    const cards = (seat: 'W' | 'E', a: readonly ('W' | 'E')[]) =>
      task.ledger.unseen
        .filter((_, i) => a[i] === seat)
        .map(TEXT.card)
        .join(' ') || TEXT.nothing;
    body = (
      <>
        <p className="pr-facit-head">
          <SuitText text={headline(task)} />
        </p>
        <p>
          <SuitText text={facitSentence(task, task.explanation)} />
        </p>
        {feasible.length <= MAX_PLACEMENTS && (
          <div>
            <p className="pr-eyebrow">{TEXT.placements}</p>
            <ul className="pr-placements">
              {feasible.map((a) => (
                <li key={a.join('')}>
                  <SuitText text={TEXT.placementLine(cards('W', a), cards('E', a))} />
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="pr-note">
          {TEXT.solverRest(spanText(solution!.rest.W.min, solution!.rest.W.max), spanText(solution!.rest.E.min, solution!.rest.E.max))}
        </p>
        {task.exercise === 'finesse' && <p className="pr-note">{TEXT.finesseNote}</p>}
      </>
    );
  }
  return (
    <section className={`feedback ${graded.result === 'right' ? 'ok' : 'bad'}`} aria-label={title}>
      <div className="with-info">
        <p className="feedback-title">{title}</p>
        <Info topic={TEXT.facit}>{TEXT.help.facit}</Info>
      </div>
      {graded.overconfident && <p className="pr-strong">{TEXT.overconfident}</p>}
      <p className="pr-note">
        <SuitText text={TEXT.yourAnswer(answerText(answer))} /> · {TEXT.gained(graded.xp)}
      </p>
      {body}
      <button type="button" className="btn primary wide" onClick={onNext}>
        {TEXT.next}
      </button>
    </section>
  );
}
