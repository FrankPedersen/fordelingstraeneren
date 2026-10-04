import { useMemo, useState } from 'react';
import { formatDecimal } from '../../engine/format';
import {
  bandFields,
  compactLayout,
  disagreements,
  findCombination,
  linesForGoal,
  sortFields,
  type BankItem,
  type BandField,
  type Grouping,
} from '../analysis';
import { cardsText, type Rank } from '../model/cards';
import { eveningText } from '../model/frequency';
import { Bridgebord } from './Bridgebord';
import { Kortvælger } from './Kortvælger';
import { Linjekort } from './Linjekort';
import { Resultatkort } from './Resultatkort';
import { Sandsynlighedsbånd } from './Sandsynlighedsbånd';
import { SpilSelv } from './SpilSelv';
import { randomSeed } from '../../engine/rng';
import { TEXT } from './texts';

interface AnalysevindueProps {
  bank: readonly BankItem[];
}

const percent = (p: number) => `${formatDecimal(100 * p, 2)} %`;

export function Analysevindue({ bank }: AnalysevindueProps) {
  const [item, setItem] = useState<BankItem>(bank[0]);
  const [goal, setGoal] = useState<number>(bank[0].combination.goals[0]);
  const [mode, setMode] = useState<'bank' | 'picker'>('bank');
  const [picked, setPicked] = useState<{ north: Rank[]; south: Rank[] }>({ north: [], south: [] });
  const [grouping, setGrouping] = useState<Grouping>('fordeling');
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [playSeed, setPlaySeed] = useState<number | null>(null);
  const pointValues = useMemo(() => [...new Set(bank.map((b) => b.points))].sort((a, b) => a - b), [bank]);
  const shown = points === null ? bank : bank.filter((b) => b.points === points);

  const lines = useMemo(() => linesForGoal(item, goal), [item, goal]);
  const fields = useMemo(() => sortFields(bandFields(item, lines), grouping), [item, lines, grouping]);
  const decisive = disagreements(fields);
  const field = fields.find((f) => f.id === selected) ?? null;
  const best = lines[0];

  function choose(next: BankItem) {
    setItem(next);
    setGoal(next.combination.goals[0]);
    setSelected(null);
    setShowAll(false);
    setPlaySeed(null);
  }

  function pick(north: Rank[], south: Rank[]) {
    setPicked({ north, south });
    const found = north.length && south.length ? findCombination(bank, north, south) : null;
    if (found) choose(found);
  }
  const pickedFound = picked.north.length > 0 && picked.south.length > 0 ? findCombination(bank, picked.north, picked.south) : null;

  const firstLeadText = best?.lead.steps[0]?.replace(/\.$/, '');
  const arrow = best ? (best.lead.hand === 'N' ? 'ned' : 'op') : null;

  return (
    <div className="fb-analysis">
      <div className="fb-column">
        <section className="card" aria-labelledby="fb-choose">
          <h2 id="fb-choose">{TEXT.choose}</h2>
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
                {!picked.north.length || !picked.south.length ? TEXT.pickMore : pickedFound ? '' : TEXT.notInBank}
              </p>
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
            {item.combination.goals.map((g) => (
              <button
                key={g}
                type="button"
                className={`btn small-btn${g === goal ? ' selected' : ''}`}
                aria-pressed={g === goal}
                onClick={() => {
                  setGoal(g);
                  setSelected(null);
                  setPlaySeed(null);
                }}
              >
                {TEXT.goal(g)}
              </button>
            ))}
          </div>
          {playSeed === null && (
            <button type="button" className="btn small-btn" onClick={() => setPlaySeed(randomSeed())}>
              {TEXT.playButton}
            </button>
          )}
        </section>

        {playSeed !== null && (
          <SpilSelv key={`${item.combination.id}:${goal}:${playSeed}`} item={item} goal={goal} seed={playSeed} onClose={() => setPlaySeed(null)} />
        )}

        <section className="card" aria-labelledby="fb-lines">
          <h2 id="fb-lines">{TEXT.lines}</h2>
          <div className="fb-lines">
            {lines.map((l) => (
              <Linjekort key={l.letter} line={l} />
            ))}
          </div>
          <p className="fb-note">{TEXT.assumptions}</p>
        </section>
      </div>

      <div className="fb-column">
        <section className="card" aria-labelledby="fb-difference">
          <h2 id="fb-difference">{TEXT.difference}</h2>
          <Sandsynlighedsbånd lines={lines} fields={fields} selected={selected} onSelect={setSelected} />
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
          <h2 id="fb-details">{showAll ? TEXT.details : TEXT.decisive}</h2>
          <LayoutList
            fields={showAll || !decisive.length ? fields : decisive}
            lines={lines.map((l) => l.letter)}
            selected={selected}
            onSelect={setSelected}
          />
          <button type="button" className="btn small-btn" onClick={() => setShowAll(!showAll)}>
            {showAll ? TEXT.showFewer : TEXT.showAll}
          </button>
        </section>

        {best && <Resultatkort item={item} goal={goal} best={best} />}
      </div>
    </div>
  );
}

/** Sidningerne som liste med chancen og hver linjes resultat; et tryk vælger sidningen. */
export function LayoutList({
  fields,
  lines,
  selected,
  onSelect,
}: {
  fields: readonly BandField[];
  lines: readonly string[];
  selected: string | null;
  onSelect(id: string): void;
}) {
  return (
    <ul className="fb-layouts">
      {fields.map((f) => (
        <li key={f.id}>
          <button
            type="button"
            className={`fb-layout${selected === f.id ? ' fb-layout-selected' : ''}`}
            aria-pressed={selected === f.id}
            onClick={() => onSelect(f.id)}
          >
            <span className="fb-layout-cards">{TEXT.layout(f.west, f.east)}</span>
            <span className="fb-layout-chance">{percent(f.probability)}</span>
            <span className="fb-layout-results">
              {f.outcomes.map((o, k) => (
                <span key={k} className={`fb-chip ${o > 0 ? 'fb-chip-hit' : 'fb-chip-miss'}`}>
                  {lines[k]} {o > 0 ? TEXT.hit : TEXT.miss}
                </span>
              ))}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
