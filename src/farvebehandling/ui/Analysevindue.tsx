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
import { aprioriFieldCount, isPossible, isStandard, situationFor, STANDARD, type Situation } from '../model/situation';
import type { GoalResult, LeadResult } from '../precompute';
import { createSolver, SolveCancelled } from '../solver/client';
import type { LineStep } from '../solver/lines';
import type { CombinationBase } from '../solver/results';
import type { FbSaved } from '../storage';
import { Bridgebord } from './Bridgebord';
import { Importfelt } from './Importfelt';
import { Kortvælger } from './Kortvælger';
import { Linjeeditor } from './Linjeeditor';
import { Linjekort } from './Linjekort';
import { Resultatkort } from './Resultatkort';
import { Sandsynlighedsbånd } from './Sandsynlighedsbånd';
import { SpilSelv } from './SpilSelv';
import { assumptionsText, situationChips, situationItem, Situationspanel } from './Situationspanel';
import { allLinesForGoal, leadKey, uniqueWinners } from './linjevalg';
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
const percent1 = (p: number) => `${formatDecimal(100 * p, 1)} %`;

/** En kombination uden for banken, som løseren har regnet (Analyse fase 2). */
interface Custom {
  base: CombinationBase;
  goals: number[];
  solved: Record<string, GoalResult>;
  tricks: GoalResult;
}

/** Bogstaver til egne linjer, så de skiller sig ud fra løserens A, B, C … */
const OWN_LETTERS = ['X', 'Y', 'Z', 'W', 'V', 'U'];

/** Ventetid fra sidste tryk på en trinvælger, til situationen regnes, så flere tryk i træk giver én beregning. */
const SITUATION_DELAY = 600;

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
  // Situationen ved bordet (SPEC-analyse-situation.md) lever kun her, mens fanen er åben. Resultaterne gemmes pr.
  // kombination, mål og situation, så et skift tilbage ikke regnes igen.
  const [situation, setSituation] = useState<Situation>(STANDARD);
  const [situated, setSituated] = useState<Record<string, { base: CombinationBase; result: GoalResult }>>({});
  const [stopped, setStopped] = useState<string | null>(null);
  const situationRun = useRef<string | null>(null);
  // Valg af linjer (leverancetrin 4): alle udspil og de linjer, der sammenlignes (nøgle pr. første udspil).
  const [allLeads, setAllLeads] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);
  const solver = useMemo(createSolver, []);
  useEffect(() => () => solver.cancel(), [solver]);
  const now = useSeconds(busy !== null);
  const pointValues = useMemo(() => [...new Set(bank.map((b) => b.points))].sort((a, b) => a - b), [bank]);
  const shown = points === null ? bank : bank.filter((b) => b.points === points);

  // Bankens tal bruges kun på standard; ellers regnes kombinationen med situationen, og chancerne er betingede. Har
  // begge hænder mindst lige så mange indgange, som de har kort, er forbindelserne ubegrænsede (SPEC-forbindelser.md).
  const standard = isStandard(situationFor(item.north, item.south, situation));
  const chips = situationChips(situation);
  const situationTag = JSON.stringify(situation);
  const situationKey = `${item.combination.id}|${goal}|${situationTag}`;
  const situationSolved = standard ? null : (situated[situationKey] ?? null);
  const pending = !standard && !situationSolved;
  const view = useMemo(
    () => (situationSolved ? situationItem(item, goal, situationSolved.base, situationSolved.result) : item),
    [item, goal, situationSolved],
  );
  const ownKey = (id: string) => (standard ? `${id}:${goal}` : `${id}:${goal}:${situationTag}`);

  // Egne linjer for kombinationen; de regnede får bogstaverne X, Y, Z …
  const ownLines = (saved?.ownLines ?? []).filter((l) => l.combination === item.combination.id);
  const lines = useMemo(() => (pending ? [] : allLeads ? allLinesForGoal(view, goal) : linesForGoal(view, goal)), [view, goal, pending, allLeads]);
  const moreLeads = !pending && allLinesForGoal(view, goal).length > linesForGoal(view, goal).length;
  const ownViews: { id: string; text: string; view: LineView | null }[] = ownLines.map((l, i) => {
    const lead = pending ? undefined : ownResults[ownKey(l.id)];
    return {
      id: l.id,
      text: l.text,
      view: lead ? { letter: OWN_LETTERS[i % OWN_LETTERS.length], lead, value: lead.value, best: false, nearBest: false, mixed: !lead.certified } : null,
    };
  });
  // Båndet viser løserens linjer og de egne linjer, der er regnet for målet. Er præcis to krydset af med Sammenlign,
  // viser båndet og tabellen kun dem, og "afgør" gælder dem; ellers sammenlignes de viste linjer som før.
  const keyed = [
    ...lines.map((l) => ({ key: leadKey(l.lead), view: l })),
    ...ownViews.flatMap((o) => (o.view ? [{ key: `egen:${o.id}`, view: o.view }] : [])),
  ];
  const allLines = keyed.map((k) => k.view);
  const chosenLines = keyed.filter((k) => compare.includes(k.key)).map((k) => k.view);
  const comparing = compare.length === 2 && chosenLines.length === 2;
  const shownLines = comparing ? chosenLines : allLines;
  const toggleCompare = (key: string) => setCompare((c) => (c.includes(key) ? c.filter((x) => x !== key) : [...c, key]));
  const allFields = pending ? [] : sortFields(bandFields(view, shownLines), grouping);
  // Sidninger, situationen udelukker (chance 0), står ikke i båndet og tabellen; linjen under tabellen tæller dem.
  const fields = standard ? allFields : allFields.filter((f) => f.probability > 0);
  const excluded = standard || pending ? 0 : aprioriFieldCount(view.solution.gaps) - fields.length;
  const unique = comparing ? uniqueWinners(fields, 0, 1) : null;
  const decisive = disagreements(fields);
  const field = fields.find((f) => f.id === selected) ?? null;
  const best = lines[0];
  const solvedGoal = !pending && !!view.solution.goals[String(goal)];

  // Med en situation regnes målet i browseren, kort efter sidste ændring. Et skift af situation, kombination eller mål
  // stopper en beregning, der er i gang; en stoppet beregning startes igen med knappen "Regn med situationen".
  useEffect(() => {
    if (standard || situationSolved || stopped === situationKey) return;
    const request = { kind: 'goal' as const, north: item.north, south: item.south, goal, situation };
    const key = situationKey;
    const timer = setTimeout(() => {
      situationRun.current = key;
      void run(() => solver.solve(request)).then((response) => {
        if (situationRun.current === key) situationRun.current = null;
        if (response?.kind === 'goal') setSituated((c) => ({ ...c, [key]: { base: response.base, result: response.result } }));
      });
    }, SITUATION_DELAY);
    return () => {
      clearTimeout(timer);
      if (situationRun.current === key) {
        situationRun.current = null;
        solver.cancel();
      }
    };
    // Nøglen dækker kombination, mål og situation.
  }, [situationKey, standard, situationSolved, stopped]);

  function stop() {
    if (situationRun.current) setStopped(situationRun.current);
    solver.cancel();
  }

  function choose(next: BankItem, nextGoal = next.combination.goals[0]) {
    setCompare([]);
    // Situationen følger med til en ny kombination, når den kan lade sig gøre dér; ellers står den på standard.
    if (!isPossible(next.north, next.south, situation)) setSituation(STANDARD);
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
    setCompare([]);
    setSelected(null);
    setPlaySeed(null);
    // Med en situation regnes målet med situationen (ovenfor), ikke a priori.
    if (!standard || !isCustom || !custom || custom.solved[String(g)]) return;
    const response = await run(() => solver.solve({ kind: 'goal', north: item.north, south: item.south, goal: g }));
    if (!response || response.kind !== 'goal') return;
    const next = { ...custom, solved: { ...custom.solved, [g]: response.result } };
    setCustom(next);
    setItem(customItem(next.base, next.goals, next.solved, next.tricks));
  }

  async function computeOwn(id: string, steps: LineStep[]): Promise<string[]> {
    const key = ownKey(id);
    const request = { kind: 'line' as const, north: item.north, south: item.south, goal, line: { id, text: '', steps } };
    const response = await run(() => solver.solve(standard ? request : { ...request, situation }));
    if (!response || response.kind !== 'line') return [];
    if (response.lead) setOwnResults((r) => ({ ...r, [key]: response.lead! }));
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
      <button type="button" className="btn small-btn" onClick={stop}>
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
              <Importfelt onImport={pick} />
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
          {chips.length > 0 && (
            <ul className="fb-situation-chips" aria-label={TEXT.situationPanel.title}>
              {chips.map((chip) => (
                <li key={chip} className="fb-chip fb-chip-situation">
                  {chip}
                </li>
              ))}
            </ul>
          )}
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

        <Situationspanel north={item.north} south={item.south} situation={situation} onChange={setSituation} />

        {playSeed !== null && solvedGoal && (
          <SpilSelv
            key={`${situationKey}:${playSeed}`}
            item={view}
            goal={goal}
            seed={playSeed}
            onClose={() => setPlaySeed(null)}
            connections={situation.entries && (situation.entries.north !== null || situation.entries.south !== null) ? { entries: situation.entries, lead: situation.lead ?? 'S' } : undefined}
          />
        )}

        <section className="card" aria-labelledby="fb-lines">
<div className="with-info">
          <h2 id="fb-lines">{TEXT.lines}</h2>
          <Info topic={TEXT.lines}>{TEXT.help.lines}</Info>
        </div>
          {pending && (
            <div className="fb-room-row">
              <p className="fb-note">{stopped === situationKey ? TEXT.situationPanel.stopped : TEXT.situationPanel.pending}</p>
              {stopped === situationKey && (
                <button type="button" className="btn small-btn" onClick={() => setStopped(null)}>
                  {TEXT.situationPanel.compute}
                </button>
              )}
            </div>
          )}
          {!pending && !solvedGoal && <p className="fb-note">{TEXT.goalNotSolved}</p>}
          {!solvedGoal && mode !== 'picker' && busyNote}
          <div className="fb-lines">
            {lines.map((l) => (
              <Linjekort
                key={l.letter}
                line={l}
                compare={{ checked: compare.includes(leadKey(l.lead)), onToggle: () => toggleCompare(leadKey(l.lead)) }}
              />
            ))}
          </div>
          {solvedGoal && (
            <div className="with-info">
              {(moreLeads || allLeads) && (
                <button type="button" className="btn small-btn" aria-pressed={allLeads} onClick={() => setAllLeads(!allLeads)}>
                  {allLeads ? TEXT.lineChoice.showMain : TEXT.lineChoice.showAll}
                </button>
              )}
              {(moreLeads || allLeads) && <Info topic={TEXT.lineChoice.showAll}>{TEXT.help.allLeads}</Info>}
              <span className="fb-note">{TEXT.lineChoice.compare}</span>
              <Info topic={TEXT.lineChoice.compare}>{TEXT.help.compare}</Info>
            </div>
          )}
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
                      compare={{ checked: compare.includes(`egen:${o.id}`), onToggle: () => toggleCompare(`egen:${o.id}`) }}
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
          <p className="fb-note">{assumptionsText(situation)}</p>
        </section>
      </div>

      <div className="fb-column">
        <section className="card" aria-labelledby="fb-difference">
<div className="with-info">
          <h2 id="fb-difference">{TEXT.difference}</h2>
          <Info topic={TEXT.difference}>{TEXT.help.band}</Info>
        </div>
          {pending ? (
            <p className="fb-note">{TEXT.situationPanel.pending}</p>
          ) : (
            <>
              <Sandsynlighedsbånd lines={shownLines} fields={fields} selected={selected} onSelect={setSelected} />
              {decisive.length ? (
                <p>{disagreeText(decisive)}</p>
              ) : (
                <p>{TEXT.agree}</p>
              )}
            </>
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
          {unique && (
            <p>
              {TEXT.lineChoice.unique(
                shownLines[0].letter,
                unique.a.count,
                percent1(unique.a.probability),
                shownLines[1].letter,
                unique.b.count,
                percent1(unique.b.probability),
              )}
            </p>
          )}
          {pending ? (
            <p className="fb-note">{TEXT.situationPanel.pending}</p>
          ) : (
            <LayoutList fields={fields} lines={shownLines} selected={selected} onSelect={setSelected} grouping={grouping} showAll={showAll} />
          )}
          {excluded > 0 && <p className="fb-note">{TEXT.situationPanel.excluded(excluded)}</p>}
          <button type="button" className="btn small-btn" onClick={() => setShowAll(!showAll)}>
            {showAll ? TEXT.showFewer : TEXT.showAll}
          </button>
        </section>

        {best && <Resultatkort item={view} goal={goal} best={best} />}
      </div>
    </div>
  );
}

/** Østs antal kort i en sidning ("–" er en renonce). */
const eastCount = (f: BandField) => (f.east === '–' ? 0 : f.east.split(' ').length);

const sidings = (fields: readonly BandField[]) => fields.reduce((s, f) => s + f.count, 0);
const chanceOf = (fields: readonly BandField[]) => fields.reduce((s, f) => s + f.probability, 0);

/**
 * "Linjerne er uenige i …" under båndet i Analyse og facit: antallet er de konkrete sidninger (summen af rækkernes
 * antal), og de tre første rækker står i den korte form med antallet i parentes (SPEC-notation-sidninger.md).
 */
export function disagreeText(decisive: readonly BandField[]): string {
  return TEXT.disagree(sidings(decisive), decisive.slice(0, 3).map(compactLayout).join(', '), sidings(decisive.slice(3)));
}

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
  const groups: { name: string; rows: BandField[] }[] = [];
  if (showAll || !decisive.length) {
    for (const f of fields.filter((f) => !decides(f))) {
      const name =
        grouping === 'fordeling' ? TEXT.groupCount(f.westCount, eastCount(f)) : TEXT.groupHonors(f.westHonors.map(rankText).join(' '));
      const last = groups[groups.length - 1];
      if (last?.name === name) last.rows.push(f);
      else groups.push({ name, rows: [f] });
    }
  }
  // En række samler sidninger, der kun adskiller sig i små kort: antallet står i Øst-cellen og chancen pr. sidning under
  // den samlede chance (SPEC-notation-sidninger.md), så der kommer ingen ny kolonne.
  const row = (f: BandField) => (
    <tr key={f.id} className={[decides(f) && 'fb-row-decides', selected === f.id && 'fb-row-selected'].filter(Boolean).join(' ') || undefined}>
      <td>
        <button
          type="button"
          className="fb-row-select"
          aria-pressed={selected === f.id}
          aria-label={TEXT.layoutRow(f.west, f.east, f.count, percent(f.each), percent(f.probability))}
          onClick={() => onSelect(f.id)}
        >
          {f.west}
        </button>
      </td>
      <td>{TEXT.countSuffix(f.east, f.count)}</td>
      <td>
        {percent(f.probability)}
        {f.count > 1 && <span className="fb-each">{TEXT.eachChance(f.count, percent(f.each))}</span>}
      </td>
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
          <span className="fb-decisive-summary">{TEXT.decisiveSummary(sidings(decisive), percent(chanceOf(decisive)))}</span>
          <Info topic={TEXT.decides}>{TEXT.help.decides}</Info>
        </div>
      )}
      <div className="fb-table-scroll">
        <table className="fb-layout-table">
          <thead>
            <tr>
              <th scope="col">{TEXT.west}</th>
              <th scope="col">{TEXT.east}</th>
              <th scope="col">
                <span className="fb-th-info">
                  {TEXT.chanceHeader}
                  <Info topic={TEXT.chanceHeader}>{TEXT.help.chanceColumn}</Info>
                </span>
              </th>
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
              <Fragment key={g.name}>
                <tr className="fb-group-row">
                  <th scope="rowgroup" colSpan={4 + lines.length}>
                    {TEXT.groupSummary(g.name, percent(chanceOf(g.rows)), sidings(g.rows))}
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
