import { SUIT_SYMBOLS, suitLengths } from '../../domain/cards';
import { formatDecimal } from '../../engine/format';
import { Info } from '../../ui/Info';
import { SuitText } from '../../ui/SuitText';
import type { HandTask } from '../model/generator';
import {
  contractFor,
  DECISION_MARGIN,
  LIMITS,
  naturalFrequency,
  notrumpChance,
  P_MODEL,
  SHORTCUT,
  type PBreakdown,
} from '../model/pmodel';
import { facitOf, type Graded, type HandAnswer } from '../training/scoring';
import { pointsText, signedText, tricksText } from './format';
import { gameIn, strainSuit } from './Opgave';
import { Regnskab } from './Regnskab';
import { TEXT, type ShortcutKind } from './texts';

const signed = (v: number) => `${v > 0 ? '+' : '−'} ${pointsText(Math.abs(v))}`;

/** Sætningen for p: honnørpoint, trumflængde, korthed og spildte konger. */
function pSentence(task: HandTask, b: PBreakdown, trump: number, short?: number): string {
  const lengths = suitLengths(task.hands.S);
  const parts = [TEXT.honorsPart(pointsText(b.honors))];
  if (b.trump) parts.push(TEXT.trumpPart(signedText(b.trump), lengths[trump]));
  if (b.shortness) {
    const suits = [0, 1, 2, 3].filter((s) => s !== trump && lengths[s] <= 2).map((s) => TEXT.shortSuit(lengths[s], SUIT_SYMBOLS[s]));
    parts.push(TEXT.shortnessPart(signedText(b.shortness), suits));
  }
  if (b.wasted && short !== undefined) {
    const kings = task.hands.S.filter((c) => Math.floor(c / 13) === short && c % 13 === 11).map(TEXT.card);
    parts.push(TEXT.wastedPart(signedText(b.wasted), kings));
  }
  return TEXT.pFacit(parts, pointsText(b.p));
}

/** Facits sætninger, regnet af modellen (SPEC-haandevaluering.md, Layout: én sætning med begrundelsen og chancen). */
export function facitSentences(task: HandTask): string[] {
  const facit = facitOf(task);
  switch (facit.exercise) {
    case 'honors': {
      const s = facit.shortcut;
      const counts: [ShortcutKind, number][] = [
        ['ace', s.aces],
        ['queen', s.queens],
        ['jack', s.jacks],
        ['ten', s.tens],
      ];
      const parts = counts.filter(([, n]) => n > 0).map(([kind, n]) => TEXT.shortcutPart(kind, n, signed(n * SHORTCUT[kind])));
      return [TEXT.shortcutFacit(s.hcp, parts, pointsText(facit.points))];
    }
    case 'distribution':
    case 'wasted': {
      if (task.exercise !== 'distribution' && task.exercise !== 'wasted') return [];
      const out = [pSentence(task, facit.you, task.trump, task.exercise === 'wasted' ? task.short : undefined)];
      if (suitLengths(task.hands.S)[task.trump] <= 2) out.push(TEXT.trumpShortNote);
      if (task.exercise === 'wasted' && !facit.you.wasted) {
        const minor = task.hands.S.some((c) => Math.floor(c / 13) === task.short && (c % 13 === 10 || c % 13 === 9));
        if (minor) out.push(TEXT.onlyKingNote);
      }
      return out;
    }
    case 'partner':
      return [TEXT.partnerFacit(pointsText(LIMITS.game), pointsText(facit.you), pointsText(facit.points))];
    case 'add':
      return [TEXT.addFacit[facit.terms]];
    case 'decision': {
      if (task.exercise !== 'decision') return [];
      const { P, contract, chances } = facit;
      const level = contract === 'grand' ? 7 : contract === 'slam' ? 6 : 4;
      const chance = level === 7 ? chances.grand : level === 6 ? chances.slam : chances.game;
      const { k, n } = naturalFrequency(chance);
      const out = [
        TEXT.decisionFacit(pointsText(facit.you.p), pointsText(facit.partner.p), pointsText(P), TEXT.decisions[contract].toLowerCase()),
        TEXT.tricksLine(tricksText(facit.tricks)),
        TEXT.chanceLine(`${level}${SUIT_SYMBOLS[task.trump]}`, k, n),
      ];
      if (facit.right.length > 1) {
        const limit = [LIMITS.game, LIMITS.slam, LIMITS.grand].find((l) => Math.abs(P - l) <= DECISION_MARGIN)!;
        out.push(TEXT.neighbours(pointsText(limit), TEXT.decisions[contractFor(limit - DECISION_MARGIN, facit.controls)], TEXT.decisions[contractFor(limit, facit.controls)]));
      }
      if (P >= LIMITS.slam - DECISION_MARGIN && 4 - facit.controls.aces > P_MODEL.kontroller.slemHoejstManglendeEs) {
        out.push(TEXT.controlsNote(4 - facit.controls.aces));
      }
      const [lo, hi] = P_MODEL.dobbeltdummy.stik;
      out.push(TEXT.caveat(formatDecimal(lo, 1), formatDecimal(hi, 1)));
      return out;
    }
    case 'strain': {
      if (facit.strain === 'major' && facit.trumps !== null && task.exercise === 'strain' && task.trump !== null) {
        return [TEXT.strainMajor(gameIn(task.trump), facit.trumps, formatDecimal(facit.gain!, 1))];
      }
      const [lo, hi] = P_MODEL.sans.stoppere.hcp;
      const { k, n } = naturalFrequency(notrumpChance(4) ?? 0);
      return [TEXT.strainNotrump(lo, hi, k, n)];
    }
  }
}

/** Svaret i ord, til linjen "Dit svar". */
export function answerText(task: HandTask, answer: HandAnswer): string {
  switch (answer.exercise) {
    case 'add':
      return TEXT.terms[answer.terms];
    case 'decision':
      return TEXT.decisions[answer.decision];
    case 'strain':
      return answer.strain === 'notrump' ? '3NT' : gameIn(strainSuit(task));
    default:
      return pointsText(answer.points);
  }
}

interface FacitProps {
  task: HandTask;
  answer: HandAnswer;
  graded: Graded;
  onNext(): void;
}

/** Facit: rigtigt eller forkert, dit svar, begrundelsen, chancen som naturlig frekvens og regnskabet. */
export function Facit({ task, answer, graded, onNext }: FacitProps) {
  const facit = facitOf(task);
  const title = graded.right ? (graded.inTime ? TEXT.right : TEXT.rightSlow) : TEXT.wrong;
  let count = null;
  if (facit.exercise === 'decision') count = <Regnskab you={facit.you} partner={facit.partner} total={{ P: facit.P, tricks: facit.tricks }} />;
  else if (facit.exercise === 'distribution' || facit.exercise === 'wasted') count = <Regnskab you={facit.you} />;
  return (
    <div className="task">
      <section className={`feedback ${graded.right ? 'ok' : 'bad'}`} aria-label={TEXT.facit}>
        <div className="with-info">
          <p className="feedback-title">
            {title} · {TEXT.gained(graded.xp)}
          </p>
          <Info topic={TEXT.facit}>{TEXT.help.facit}</Info>
        </div>
        <p className="he-note">
          <SuitText text={TEXT.yourAnswer(answerText(task, answer))} />
        </p>
        {facitSentences(task).map((sentence) => (
          <p key={sentence} className="he-facit-line">
            <SuitText text={sentence} />
          </p>
        ))}
        <button type="button" className="btn primary wide" onClick={onNext}>
          {TEXT.next}
        </button>
      </section>
      {count}
    </div>
  );
}
