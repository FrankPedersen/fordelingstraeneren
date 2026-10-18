import { useState } from 'react';
import type { BankItem } from '../analysis';
import type { Rank } from '../model/cards';
import { canStep, HP_MAX, isStandard, STANDARD, step, type Seat, type Situation, type SituationField } from '../model/situation';
import type { GoalResult } from '../precompute';
import type { CombinationBase } from '../solver/results';
import { Info } from '../../ui/Info';
import { TEXT } from './texts';

/**
 * Panelet Situationen i Analyse (SPEC-analyse-situation.md): kendte kort i andre farver og maks. hp i farven hos Vest og
 * Øst som trinvælgere. Foldet sammen, når alt står på standard. En knap, der ville gøre situationen umulig, er grået ud.
 */
interface SituationspanelProps {
  north: readonly Rank[];
  south: readonly Rank[];
  situation: Situation;
  onChange(next: Situation): void;
}

const SEATS: readonly Seat[] = ['west', 'east'];
const seatName = (seat: Seat) => (seat === 'west' ? TEXT.west : TEXT.east);

/** Kombinationen med situationens løsning: bankens oplysninger (hyppighed, teknik …) og løsningen regnet med situationen. */
export function situationItem(item: BankItem, goal: number, base: CombinationBase, result: GoalResult): BankItem {
  return { ...item, solution: { ...base, goals: { [String(goal)]: result }, tricks: undefined } };
}

/** Chips under bordet: ét pr. felt, der ikke står på standard, fx "Vest 5 kendte kort" og "Øst maks. 0 hp". */
export function situationChips(s: Situation): string[] {
  const chips: string[] = [];
  for (const seat of SEATS) if (s.known[seat] !== STANDARD.known[seat]) chips.push(TEXT.situationPanel.known1(seatName(seat), s.known[seat]));
  for (const seat of SEATS) if (s.maxHp[seat] !== HP_MAX) chips.push(TEXT.situationPanel.hp1(seatName(seat), s.maxHp[seat]));
  return chips;
}

/** Forudsætningslinjen under linjerne: a priori eller situationen, fx "Vest 5 og Øst 2 kendte kort · Øst maks. 0 hp · …". */
export function assumptionsText(s: Situation): string {
  if (isStandard(s)) return TEXT.assumptions;
  const parts: string[] = [];
  const { known, maxHp } = s;
  if (known.west && known.east) parts.push(TEXT.situationPanel.knownBoth(known.west, known.east));
  else if (known.west || known.east) parts.push(TEXT.situationPanel.known1(seatName(known.west ? 'west' : 'east'), known.west || known.east));
  const west = maxHp.west < HP_MAX, east = maxHp.east < HP_MAX;
  if (west && east) parts.push(TEXT.situationPanel.hpBoth(maxHp.west, maxHp.east));
  else if (west || east) parts.push(TEXT.situationPanel.hp1(seatName(west ? 'west' : 'east'), west ? maxHp.west : maxHp.east));
  return TEXT.situationPanel.assumptions(parts.join(' · '));
}

export function Situationspanel({ north, south, situation, onChange }: SituationspanelProps) {
  const [open, setOpen] = useState(false);
  const standard = isStandard(situation);
  const expanded = open || !standard;
  const fields: { field: SituationField; label: string; help: string }[] = [
    { field: 'known', label: TEXT.situationPanel.known, help: TEXT.help.known },
    { field: 'maxHp', label: TEXT.situationPanel.maxHp, help: TEXT.help.maxHp },
  ];
  return (
    <section className="card" aria-labelledby="fb-situation">
      <div className="with-info">
        <h2 id="fb-situation">{TEXT.situationPanel.title}</h2>
        <Info topic={TEXT.situationPanel.title}>{TEXT.help.situation}</Info>
      </div>
      {!expanded ? (
        <div className="fb-room-row">
          <span>{TEXT.situationPanel.standard}</span>
          <button type="button" className="btn small-btn" aria-expanded={false} onClick={() => setOpen(true)}>
            {TEXT.situationPanel.open}
          </button>
        </div>
      ) : (
        <>
          {fields.map(({ field, label, help }) => (
            <div key={field} className="fb-situation-field">
              <div className="with-info">
                <h3>{label}</h3>
                <Info topic={label}>{help}</Info>
              </div>
              <div className="fb-situation-seats">
                {SEATS.map((seat) => {
                  const name = `${label}, ${seatName(seat)}`;
                  return (
                    <div key={seat} className="fb-stepper" role="group" aria-label={name}>
                      <span className="fb-stepper-seat">{seatName(seat)}</span>
                      <button
                        type="button"
                        className="btn small-btn fb-step"
                        aria-label={TEXT.situationPanel.less(label, seatName(seat))}
                        disabled={!canStep(north, south, situation, field, seat, -1)}
                        onClick={() => onChange(step(situation, field, seat, -1))}
                      >
                        −
                      </button>
                      <output className="fb-stepper-value" aria-label={name}>
                        {situation[field][seat]}
                      </output>
                      <button
                        type="button"
                        className="btn small-btn fb-step"
                        aria-label={TEXT.situationPanel.more(label, seatName(seat))}
                        disabled={!canStep(north, south, situation, field, seat, 1)}
                        onClick={() => onChange(step(situation, field, seat, 1))}
                      >
                        +
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="fb-actions">
            {standard ? (
              <button type="button" className="btn small-btn" aria-expanded={true} onClick={() => setOpen(false)}>
                {TEXT.situationPanel.close}
              </button>
            ) : (
              <button
                type="button"
                className="btn small-btn"
                onClick={() => {
                  setOpen(false);
                  onChange(STANDARD);
                }}
              >
                {TEXT.situationPanel.reset}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
