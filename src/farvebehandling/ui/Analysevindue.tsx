import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { formatDecimal } from '../../engine/format';
import { randomSeed } from '../../engine/rng';
import {
  bandFields,
  compactLayout,
  customItem,
  disagreements,
  findCombination,
  goalCandidates,
  linesForGoal,
  sortFields,
  type BankItem,
  type BandField,
  type Grouping,
  type LineView,
} from '../analysis';
import { cardsText, rankText, type Rank } from '../model/cards';
import { eveningText } from '../model/frequency';
import type { GoalResult, LeadResult } from '../precompute';
import { createSolver, SolveCancelled } from '../solver/client';
import type { LineStep } from '../solver/lines';
import type { CombinationBase } from '../solver/results';
import type { FbSaved } from '../storage';
import { Bridgebord } from './Bridgebord';
import { Kortvælger } from './Kortvælger';
import { Linjeeditor } from './Linjeeditor';
import { Linjekort } from './Linjekort';
import { Resultatkort } from './Resultatkort';
import { Sandsynlighedsbånd } from './Sandsynlighedsbånd';
import { SpilSelv } from './SpilSelv';
import { TEXT } from './texts';
import { lineErrorText, stepText } from '../lineText';
import { Info } from '../../ui/Info';

interface AnalysevindueProps {
  bank: readonly BankItem[];
  /** Kombinationen, der vises først (fx valgt i klubaftenen); ellers den hyppigste. */
  start?: string;
  /** Egne linjer gemmes i farvebehandlingens data. */
  saved?: FbSaved;
  update?(next: FbSaved): void;
}

const percent = (p: number) => `${formatDecimal(100 * p, 2)} %`;

/** En kombination uden for banken, som løseren har regnet (Analyse fase 2). */
interface Custom {
  base: CombinationBase;
  goals: number[];
  solved: Record<string, GoalResult>;
  tricks: GoalResult;
}

/** Bogstaver til egne linjer, så de skiller sig ud fra løserens A, B, C … */
const OWN_LETTERS = ['X', 'Y', 'Z', 'W', 'V', 'U'];

/** Opdaterer visningen hvert sekund, mens løseren regner. */
function useSeconds(running: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);
  return now;
}

export function Analysevindue({ bank, start, saved, update }: AnalysevindueProps) {
  const [item, setItem] = useState<BankItem>(() => bank.find((b) => b.combination.id === start) ?? bank[0]);
  const [goal, setGoal] = useState<number>(() => item.combination.goals[0]);
  const currentRef = useRef<HTMLButtonElement>(null);
  // Valgt i klubaftenen: banklisten ruller hen til kombinationen.
  useEffect(() => {
    if (start) currentRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [start]);
  const [mode, setMode] = useState<'bank' | 'picker'>('bank');
  const [picked, setPicked] = useState<{ north: Rank[]; south: Rank[] }>({ north: [], south: [] });
  const [grouping, setGrouping] = useState<Grouping>('fordeling');
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [playSeed, setPlaySeed] = useState<number | null>(null);
  const [custom, setCustom] = useState<Custom | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [solveError, setSolveError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editorErrors, setEditorErrors] = useState<string[]>([]);
  const [ownResults, setOwnResults] = useState<Record<string, LeadResult>>({});
  const solver = useMemo(createSolver, []);
  useEffect(() => () => solver.cancel(), [solver]);
  const now = useSeconds(busy !== null);
  const pointValues = useMemo(() => [...new Set(bank.map((b) => b.points))].sort((a, b) => a - b), [bank]);
  const shown = points === null ? bank : bank.filter((b) => b.points === points);

  // Egne linjer for kombinationen; de regnede får bogstaverne X, Y, Z …
  const ownLines = (saved?.ownLines ?? []).filter((l) => l.combination === item.combination.id);
  const lines = useMemo(() => linesForGoal(item, goal), [item, goal]);
  const ownViews: { id: string; text: string; view: LineView | null }[] = ownLines.map((l, i) => {
    const lead = ownResults[`${l.id}:${goal}`];
    return {
      id: l.id,
      text: l.text,
      view: lead ? { letter: OWN_LETTERS[i % OWN_LETTERS.length], lead, value: lead.value, best: false, nearBest: false, mixed: !lead.certified } : null,
    };
  });
  // Båndet viser løserens linjer og de egne linjer, der er regnet for målet.
  const allLines = [...lines, ...ownViews.flatMap((o) => (o.view ? [o.view] : []))];
  const fields = sortFields(bandFields(item, allLines), grouping);
  const decisive = disagreements(fields);
  const field = fields.find((f) => f.id === selected) ?? null;
  const best = lines[0];
  const solvedGoal = !!item.solution.goals[String(goal)];

  function choose(next: BankItem, nextGoal = next.combination.goals[0]) {
    setItem(next);
    setGoal(nextGoal);
    setSelected(null);
    setShowAll(false);
    setPlaySeed(null);
    setEditing(false);
  }

  function pick(north: Rank[], south: Rank[]) {
    setPicked({ north, south });
    setSolveError(null);
    const found = north.length && south.length ? findCombination(bank, north, south) : null;
    if (found) choose(found);
  }
  const complete = picked.north.length > 0 && picked.south.length > 0;
  const pickedFound = complete ? findCombination(bank, picked.north, picked.south) : null;
  const isCustom = !!custom && item.combination.id === `${custom.base.north}-${custom.base.south}`;

  /** Kør løseren; en stoppet beregning er ikke en fejl. */
  async function run<T>(work: () => Promise<T>): Promise<T | null> {
    setBusy(Date.now());
    setSolveError(null);
    try {
      return await work();
    } catch (error) {
      if (!(error instanceof SolveCancelled)) setSolveError(TEXT.solveFailed(error instanceof Error ? error.message : String(error)));
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function solveCustom() {
    const { north, south } = picked;
    const result = await run(async () => {
      const tricks = await solver.solve({ kind: 'tricks', north, south });
      if (tricks.kind !== 'tricks') throw new Error('uventet svar');
      const { goals, preferred } = goalCandidates(tricks.base, tricks.result);
      const first = await solver.solve({ kind: 'goal', north, south, goal: preferred });
      if (first.kind !== 'goal') throw new Error('uventet svar');
      return { custom: { base: tricks.base, goals, solved: { [preferred]: first.result }, tricks: tricks.result }, preferred };
    });
    if (!result) return;
    setCustom(result.custom);
    choose(customItem(result.custom.base, result.custom.goals, result.custom.solved, result.custom.tricks), result.preferred);
  }

  async function chooseGoal(g: number) {
    setGoal(g);
    setSelected(null);
    setPlaySeed(null);
    if (!isCustom || !custom || custom.solved[String(g)]) return;
    const response = await run(() => solver.solve({ kind: 'goal', north: item.north, south: item.south, goal: g }));
    if (!response || response.kind !== 'goal') return;
    const next = { ...custom, solved: { ...custom.solved, [g]: response.result } };
    setCustom(next);
    setItem(customItem(next.base, next.goals, next.solved, next.tricks));
  }

  async function computeOwn(id: string, steps: LineStep[]): Promise<string[]> {
    const response = await run(() => solver.solve({ kind: 'line', north: item.north, south: item.south, goal, line: { id, text: '', steps } }));
    if (!response || response.kind !== 'line') return [];
    if (response.lead) setOwnResults((r) => ({ ...r, [`${id}:${goal}`]: response.lead! }));
    return response.errors;
  }

  async function saveOwn(line: { text: string; steps: LineStep[] }) {
    if (!saved || !update) return;
    const id = `egen-${Date.now().toString(36)}`;
    const errors = await computeOwn(id, line.steps);
    setEditorErrors(errors.map(lineErrorText));
    if (errors.length) return;
    update({ ...saved, ownLines: [...saved.ownLines, { combination: item.combination.id, id, text: line.text, steps: line.steps }] });
    setEditing(false);
  }

  function deleteOwn(id: string) {
    if (!saved || !update) return;
    update({ ...saved, ownLines: saved.ownLines.filter((l) => l.id !== id) });
  }

  const firstLeadText = best?.lead.steps[0] ? stepText(best.lead.steps[0]).replace(/\.$/, '') : undefined;
  const arrow = best ? (best.lead.hand === 'N' ? 'ned' : 'op') : null;
  const elapsed = busy === null ? 0 : Math.max(0, Math.round((now - busy) / 1000));
  const busyNote = busy !== null && (
    <div className="fb-room-row" role="status">
      <span>{TEXT.solving(elapsed)}</span>
      <button type="button" className="btn small-btn" onClick={() => solver.cancel()}>
        {TEXT.stopSolving}
      </button>
    </div>
  );

  return (
    <div className="fb-analysis">
      <div className="fb-column">
        <section className="card" aria-labelledby="fb-choose">
<div className="with-info">
          <h2 id="fb-choose">{TEXT.choose}</h2>
          <Info topic={TEXT.choose}>{TEXT.help.choose}</Info>
        </div>
          <div className="fb-segment" role="group" aria-label={TEXT.choose}>
            <button type="button" className={`btn small-btn${mode === 'bank' ? ' selected' : ''}`} aria-pressed={mode === 'bank'} onClick={() => setMode('bank')}>
              {TEXT.bank}
            </button>
            <button type="button" className={`btn small-btn${mode === 'picker' ? ' selected' : ''}`} aria-pressed={mode === 'picker'} onClick={() => setMode('picker')}>
              {TEXT.picker}
            </button>
          </div>
          {mode === 'bank' ? (
            <>
              <p className="fb-note">{TEXT.bankHelp}</p>
              <div className="fb-filter" role="group" aria-label={TEXT.pageFilter}>
                <span>{TEXT.pageFilter}:</span>
                <button
                  type="button"
                  className={`btn small-btn${points === null ? ' selected' : ''}`}
                  aria-pressed={points === null}
                  onClick={() => setPoints(null)}
                >
                  {TEXT.option(TEXT.all, bank.length)}
                </button>
                {pointValues.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`btn small-btn${points === p ? ' selected' : ''}`}
                    aria-pressed={points === p}
                    onClick={() => setPoints(p)}
                  >
                    {TEXT.option(TEXT.hp(p), bank.filter((b) => b.points === p).length)}
                  </button>
                ))}
              </div>
              <ul className="fb-bank" aria-label={TEXT.bank}>
                {shown.map((b) => (
                  <li key={b.combination.id}>
                    <button
                      ref={b === item ? currentRef : undefined}
                      type="button"
                      className={`fb-bank-item${b === item ? ' fb-bank-current' : ''}`}
                      aria-current={b === item}
                      onClick={() => choose(b)}
                    >
                      {TEXT.bankEntry(b.rank, `${cardsText(b.south)} / ${cardsText(b.north)}`, eveningText(b.frequency))}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <Kortvælger north={picked.north} south={picked.south} onChange={pick} />
              <p className="fb-note" role="status">
                {!complete ? TEXT.pickMore : pickedFound ? '' : TEXT.notInBank}
              </p>
              {complete && !pickedFound && !isCustom && busy === null && (
                <button type="button" className="btn primary wide" onClick={() => void solveCustom()}>
                  {TEXT.solveCustom}
                </button>
              )}
              {busyNote}
              {solveError && (
                <p role="alert" className="fb-note">
                  {solveError}
                </p>
              )}
            </>
          )}
        </section>

        <section className="card" aria-labelledby="fb-problem">
          <h2 id="fb-problem">{TEXT.problem}</h2>
          <Bridgebord
            north={item.north}
            south={item.south}
            west={field?.west}
            east={field?.east}
            arrow={arrow}
            caption={firstLeadText ? TEXT.firstLead(firstLeadText.toLowerCase()) : undefined}
          />
          <div className="fb-goals" role="group" aria-label={TEXT.goalLabel}>
            <span>{TEXT.goalLabel}</span>
            <Info topic={TEXT.goalLabel}>{TEXT.help.goals}</Info>
            {item.combination.goals.map((g) => (
              <button
                key={g}
                type="button"
                className={`btn small-btn${g === goal ? ' selected' : ''}`}
                aria-pressed={g === goal}
                onClick={() => void chooseGoal(g)}
              >
                {TEXT.goal(g)}
              </button>
            ))}
          </div>
          {solvedGoal && playSeed === null && (
            <button type="button" className="btn small-btn" onClick={() => setPlaySeed(randomSeed())}>
              {TEXT.playButton}
            </button>
          )}
        </section>

        {playSeed !== null && solvedGoal && (
          <SpilSelv key={`${item.combination.id}:${goal}:${playSeed}`} item={item} goal={goal} seed={playSeed} onClose={() => setPlaySeed(null)} />
        )}

        <section className="card" aria-labelledby="fb-lines">
<div className="with-info">
          <h2 id="fb-lines">{TEXT.lines}</h2>
          <Info topic={TEXT.lines}>{TEXT.help.lines}</Info>
        </div>
          {!solvedGoal && <p className="fb-note">{TEXT.goalNotSolved}</p>}
          {!solvedGoal && mode !== 'picker' && busyNote}
          <div className="fb-lines">
            {lines.map((l) => (
              <Linjekort key={l.letter} line={l} />
            ))}
          </div>
          {saved && update && solvedGoal && (
            <>
              <div className="with-info">
                <h3>{TEXT.ownLines}</h3>
                <Info topic={TEXT.ownLines}>{TEXT.help.ownLines}</Info>
              </div>
              <div className="fb-lines">
                {ownViews.map((o, i) =>
                  o.view ? (
                    <Linjekort
                      key={o.id}
                      line={o.view}
                      title={`${TEXT.ownLineTitle(o.view.letter)}: ${o.text}`}
                      action={
                        <button type="button" className="btn small-btn" onClick={() => deleteOwn(o.id)}>
                          {TEXT.deleteOwnLine}
                        </button>
                      }
                    />
                  ) : (
                    <article key={o.id} className="fb-line" aria-label={`${TEXT.ownLineTitle(OWN_LETTERS[i % OWN_LETTERS.length])}: ${o.text}`}>
                      <header className="fb-line-head">
                        <h3>{`${TEXT.ownLineTitle(OWN_LETTERS[i % OWN_LETTERS.length])}: ${o.text}`}</h3>
                      </header>
                      <p className="fb-note">{TEXT.ownLineNotComputed}</p>
                      <div className="fb-actions">
                        <button
                          type="button"
                          className="btn small-btn"
                          disabled={busy !== null}
                          onClick={() => void computeOwn(o.id, ownLines[i].steps)}
                        >
                          {TEXT.computeOwnLine}
                        </button>
                        <button type="button" className="btn small-btn" onClick={() => deleteOwn(o.id)}>
                          {TEXT.deleteOwnLine}
                        </button>
                      </div>
                    </article>
                  ),
                )}
              </div>
              {editing ? (
                <Linjeeditor
                  north={item.north}
                  south={item.south}
                  errors={editorErrors}
                  busy={busy !== null}
                  onSave={(line) => void saveOwn(line)}
                  onCancel={() => {
                    setEditing(false);
                    setEditorErrors([]);
                  }}
                />
              ) : (
                <button type="button" className="btn small-btn" onClick={() => setEditing(true)}>
                  {TEXT.addOwnLine}
                </button>
              )}
              {mode !== 'picker' && busyNote}
            </>
          )}
          <p className="fb-note">{TEXT.assumptions}</p>
        </section>
      </div>

      <div className="fb-column">
        <section className="card" aria-labelledby="fb-difference">
<div className="with-info">
          <h2 id="fb-difference">{TEXT.difference}</h2>
          <Info topic={TEXT.difference}>{TEXT.help.band}</Info>
        </div>
          <Sandsynlighedsbånd lines={allLines} fields={fields} selected={selected} onSelect={setSelected} />
          {decisive.length ? (
            <p>
              {TEXT.disagree(
                decisive.length,
                decisive.slice(0, 3).map(compactLayout).join(', '),
                Math.max(0, decisive.length - 3),
              )}
            </p>
          ) : (
            <p>{TEXT.agree}</p>
          )}
          <div className="fb-segment" role="group" aria-label={TEXT.groupBy}>
            <span>{TEXT.groupBy}:</span>
            {(['fordeling', 'honnører'] as const).map((g) => (
              <button
                key={g}
                type="button"
                className={`btn small-btn${grouping === g ? ' selected' : ''}`}
                aria-pressed={grouping === g}
                onClick={() => setGrouping(g)}
              >
                {g === 'fordeling' ? TEXT.byDistribution : TEXT.byHonors}
              </button>
            ))}
          </div>
        </section>

        <section className="card" aria-labelledby="fb-details">
<div className="with-info">
          <h2 id="fb-details">{showAll ? TEXT.details : TEXT.decisive}</h2>
          <Info topic={TEXT.details}>{TEXT.help.layouts}</Info>
        </div>
          <LayoutList fields={fields} lines={allLines} selected={selected} onSelect={setSelected} grouping={grouping} showAll={showAll} />
          <button type="button" className="btn small-btn" onClick={() => setShowAll(!showAll)}>
            {showAll ? TEXT.showFewer : TEXT.showAll}
          </button>
        </section>

        {best && <Resultatkort item={item} goal={goal} best={best} />}
      </div>
    </div>
  );
}

/** Østs antal kort i en sidning ("–" er en renonce). */
const eastCount = (f: BandField) => (f.east === '–' ? 0 : f.east.split(' ').length);

/**
 * Sidningerne som tabel (SPEC-analysevindue-layout.md, punkt 3): Vest, Øst, chancen, én kolonne pr. linje med ✓ eller ✕
 * og antal stik, og mærket "afgør". De afgørende sidninger står først og er markeret; med `showAll` følger resten med
 * grupperingen som mellemoverskrifter. Knappen i rækkens første celle vælger sidningen som før. Mærkets ⓘ står én gang
 * over tabellen (SPEC-tema.md).
 */
export function LayoutList({
  fields,
  lines,
  selected,
  onSelect,
  grouping = 'fordeling',
  showAll = true,
}: {
  fields: readonly BandField[];
  lines: readonly LineView[];
  selected: string | null;
  onSelect(id: string): void;
  grouping?: Grouping;
  showAll?: boolean;
}) {
  const decides = (f: BandField) => lines.length > 1 && f.outcomes.some((o) => o !== f.outcomes[0]);
  const decisive = fields.filter(decides);
  const groups: { label: string; rows: BandField[] }[] = [];
  if (showAll || !decisive.length) {
    for (const f of fields.filter((f) => !decides(f))) {
      const label =
        grouping === 'fordeling' ? TEXT.groupCount(f.westCount, eastCount(f)) : TEXT.groupHonors(f.westHonors.map(rankText).join(' '));
      const last = groups[groups.length - 1];
      if (last?.label === label) last.rows.push(f);
      else groups.push({ label, rows: [f] });
    }
  }
  const row = (f: BandField) => (
    <tr key={f.id} className={[decides(f) && 'fb-row-decides', selected === f.id && 'fb-row-selected'].filter(Boolean).join(' ') || undefined}>
      <td>
        <button
          type="button"
          className="fb-row-select"
          aria-pressed={selected === f.id}
          aria-label={TEXT.layout(f.west, f.east)}
          onClick={() => onSelect(f.id)}
        >
          {f.west}
        </button>
      </td>
      <td>{f.east}</td>
      <td>{percent(f.probability)}</td>
      {lines.map((l, k) => {
        const hit = f.outcomes[k] > 0;
        const tricks = l.lead.tricks?.[f.layout];
        return (
          <td key={l.letter}>
            <span className={`fb-chip ${hit ? 'fb-chip-hit' : 'fb-chip-miss'}`}>
              {hit ? TEXT.hit : TEXT.miss}
              {tricks !== undefined && ` ${tricks}`}
            </span>
          </td>
        );
      })}
      <td>{decides(f) && <span className="fb-decides">{TEXT.decides}</span>}</td>
    </tr>
  );
  return (
    <>
      {decisive.length > 0 && (
        <div className="with-info">
          <span className="fb-decides">{TEXT.decides}</span>
          <Info topic={TEXT.decides}>{TEXT.help.decides}</Info>
        </div>
      )}
      <div className="fb-table-scroll">
        <table className="fb-layout-table">
          <thead>
            <tr>
              <th scope="col">{TEXT.west}</th>
              <th scope="col">{TEXT.east}</th>
              <th scope="col">{TEXT.chanceHeader}</th>
              {lines.map((l) => (
                <th key={l.letter} scope="col">
                  {TEXT.line(l.letter)}
                </th>
              ))}
              <th scope="col">
                <span className="fb-sr">{TEXT.decides}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {decisive.map(row)}
            {groups.map((g) => (
              <Fragment key={g.label}>
                <tr className="fb-group-row">
                  <th scope="rowgroup" colSpan={4 + lines.length}>
                    {g.label}
                  </th>
                </tr>
                {g.rows.map(row)}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
