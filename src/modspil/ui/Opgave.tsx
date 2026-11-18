import { useState } from 'react';
import type { Card } from '../../domain/cards';
import type { Seat } from '../../domain/dealer';
import { getLang } from '../../i18n';
import { Info } from '../../ui/Info';
import { SuitText } from '../../ui/SuitText';
import type { ModspilOpgave } from '../model/generator';
import { meldingTekst } from '../model/meldinger';
import { farveAf, kortTekst, SYMBOLER, vaerdiAf, valoer } from '../model/tekst';
import { erRigtigt, type Svar } from '../training/scoring';
import {
  aftale,
  egneKort,
  facitTekst,
  hpI,
  kanIkkeValg,
  maerke,
  meldeLinje,
  opslag,
  ovelsesNavn,
  regnestykke,
  skjulteOver,
  spilbareKort,
  spoergerHvilke,
  spoergsmaal,
  svarTekst,
  svarValg,
  tip,
  vaelgerKort,
  vedBordet,
} from './opgavetekst';
import { kortLabelAf, T } from './tekster';
import '../../farvebehandling/ui/tokens.css';
import './modspil.css';

export type { Svar } from '../training/scoring';

export interface OpgaveProps {
  opgave: ModspilOpgave;
  nummer: number;
  antal: number;
  /** Med svaret viser skærmen også facit (samme HTML ved alle bredder). */
  svar?: Svar;
  onSvar(svar: Svar): void;
  onNaeste(): void;
  onIndstillinger(): void;
  /** XP for svaret og rigtige i træk; vises i facit, når sessionen giver dem. */
  xp?: number;
  iTraek?: number;
}

const ORDEN: readonly Seat[] = ['W', 'N', 'E', 'S'];

/** Kortet med farvesymbol, hvor ♥ og ♦ er røde, fx ♠7 og ♥K. */
const Kort = ({ kort }: { kort: Card }) => <SuitText text={kortTekst(kort, getLang())} />;

/** Hånden som tekstlinjer pr. farve: symbolet og valørerne faldende, fx "♠ K103". */
function Haandlinje({ kort }: { kort: readonly Card[] }) {
  const sprog = getLang();
  return (
    <span className="ms-haandlinje">
      {[0, 1, 2, 3].map((f) => {
        const v = kort
          .filter((c) => farveAf(c) === f)
          .map(vaerdiAf)
          .sort((a, b) => b - a);
        if (!v.length) return null;
        return (
          <span key={f} className="ms-farvelinje">
            <SuitText text={SYMBOLER[f]} /> {v.map((x) => valoer(x, sprog)).join('')}
          </span>
        );
      })}
    </span>
  );
}

/** Det aktuelle stik: kortene fra det seneste udspil (hvert stik har fire kort). */
function aktueltStik(o: ModspilOpgave): { nummer: number; start: number } {
  if (!o.spillet.length) return { nummer: 0, start: 0 };
  const start = Math.floor((o.spillet.length - 1) / 4) * 4;
  return { nummer: start / 4 + 1, start };
}

/** Meldeforløbet som skema med fire kolonner (Vest, Nord, Øst, Syd) og linjen om intervallerne og kontrakten. */
function Meldeforloeb({ o }: { o: ModspilOpgave }) {
  const celler: (string | null)[] = [...Array(ORDEN.indexOf(o.meldeforloeb.giver)).fill(null), ...o.meldeforloeb.meldinger.map((m) => meldingTekst(m.melding, getLang()))];
  while (celler.length % 4) celler.push(null);
  const raekker: (string | null)[][] = [];
  for (let i = 0; i < celler.length; i += 4) raekker.push(celler.slice(i, i + 4));
  return (
    <section className="card ms-meldinger">
      <table className="ms-meldeskema" aria-label={T.meldeforloebet}>
        <thead>
          <tr>
            {ORDEN.map((p) => (
              <th key={p} scope="col">
                {T.plads[p]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {raekker.map((r, i) => (
            <tr key={i}>
              {r.map((m, j) => (
                <td key={j} className={m && m !== 'pas' && m !== 'pass' ? 'ms-melding' : undefined}>
                  {m && <SuitText text={m} />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="ms-note">
        <SuitText text={meldeLinje(o)} />
      </p>
    </section>
  );
}

/** Stikket på det grønne felt: makkers udspil med orange ring og brugerens tomme plads med stiplet kant. */
function Stik({ o }: { o: ModspilOpgave }) {
  const { nummer, start } = aktueltStik(o);
  const kort = o.spillet.slice(start);
  if (!kort.length) return null;
  const harLagt = kort.some((s) => s.plads === o.plads);
  const sprog = getLang();
  const label = T.stikLabel(nummer, [...kort.map((s) => `${T.plads[s.plads]} ${kortTekst(s.kort, sprog)}`), ...(harLagt ? [] : [T.skalLaegge(T.plads[o.plads])])]);
  const syd = kort.find((s) => s.plads === 'S');
  return (
    <div className={`ms-stik${syd ? ' ms-stik-syd' : ''}`} role="img" aria-label={label}>
      {(['N', 'W', 'E', 'S'] as const).map((p) => {
        const s = kort.find((k) => k.plads === p);
        const navn = p === 'S' ? `${T.pladsKort.S} · ${T.spilfoerer}` : T.pladsKort[p];
        return (
          <span key={p} className={`ms-plads ms-plads-${p}`}>
            {s ? (
              <span className="ms-spillekort" data-udspil={s === kort[0] ? '' : undefined}>
                <Kort kort={s.kort} />
              </span>
            ) : p === o.plads ? (
              <span className="ms-spillekort ms-tom" data-tom="" />
            ) : null}
            <span className="ms-pladsnavn">{navn}</span>
          </span>
        );
      })}
      <span className="ms-stik-midte">
        {T.stik(nummer)}
        <br />
        <SuitText text={T.udspilMidte(kortTekst(kort[0].kort, sprog))} />
      </span>
    </div>
  );
}

/** De stik, der er spillet før det aktuelle (Første afkast og Forsinket kald). */
function Tidligere({ o }: { o: ModspilOpgave }) {
  const { start } = aktueltStik(o);
  if (start === 0) return null;
  const stik: string[] = [];
  const sprog = getLang();
  for (let i = 0; i < start; i += 4) {
    stik.push(`${T.stik(i / 4 + 1)}: ${o.spillet.slice(i, i + 4).map((s) => `${T.pladsKort[s.plads]} ${kortTekst(s.kort, sprog)}`).join(' · ')}`);
  }
  return (
    <div className="ms-tidligere">
      <span className="eyebrow">{T.tidligere}</span>
      <ul>
        {stik.map((s) => (
          <li key={s}>
            <SuitText text={s} />
          </li>
        ))}
      </ul>
    </div>
  );
}

const visHp = (o: ModspilOpgave) => o.ovelse === 'point' || o.ovelse === 'regel11' || o.ovelse === 'laengde';

interface FacitProps {
  o: ModspilOpgave;
  svar: Svar;
  rigtigt: boolean;
  xp?: number;
  iTraek?: number;
  onNaeste(): void;
}

/** Facit: mærket, regnestykket, forklaringen fra trin 1, "Ved bordet", ordbogen og Næste opgave. */
function Facit({ o, svar, rigtigt, xp, iTraek, onNaeste }: FacitProps) {
  const raekker = regnestykke(o);
  const link = opslag(o);
  const meta = [xp !== undefined ? T.xpVundet(xp) : null, iTraek && iTraek > 1 ? T.iTraek(iTraek) : null].filter(Boolean).join(' · ');
  return (
    <section className="card ms-facit" aria-labelledby="ms-dom">
      <div className="ms-dom" data-dom={rigtigt ? 'rigtigt' : 'forkert'}>
        <span className="ms-dom-ikon" aria-hidden="true">
          {rigtigt ? '✓' : '✗'}
        </span>
        <h2 id="ms-dom">
          <SuitText text={T.dom(rigtigt, facitTekst(o))} />
        </h2>
      </div>
      <p className="ms-note">
        {T.ditSvar}:{' '}
        <span className={rigtigt ? undefined : 'ms-overstreget'}>
          <SuitText text={svarTekst(o, svar)} />
        </span>
        {meta && ` · ${meta}`}
      </p>
      {raekker && (
        <table className="ms-regnestykke" aria-label={T.regnestykket}>
          <tbody>
            {raekker.map((r) => (
              <tr key={r.tekst} className={r.sum ? 'ms-sum' : undefined}>
                <th scope="row">
                  <SuitText text={r.tekst} />
                </th>
                <td>{r.tal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="ms-forklaring">
        <SuitText text={getLang() === 'en' ? o.forklaring.en : o.forklaring.da} />
      </p>
      <div className="ms-ved-bordet">
        <span className="ms-ved-titel">{T.vedBordet}</span>
        <p>
          <SuitText text={vedBordet(o)} />
        </p>
      </div>
      <div className="ms-facit-knapper">
        <a className="btn small-btn" href={`https://www.kontraktbridge.dk/ordbog/#${link.id}`} target="_blank" rel="noopener">
          {link.tekst}
        </a>
        <button type="button" className="btn small-btn primary" onClick={onNaeste}>
          {T.naeste}
        </button>
      </div>
    </section>
  );
}

const ens = (a: Svar, b: Svar) => (a.type === 'tal' && b.type === 'tal' ? a.tal === b.tal : JSON.stringify(a) === JSON.stringify(b));

/**
 * Modspils opgaveskærm (SPEC-modspil.md, trin 2, Layoutet, og mock-up'en i docs/specs/design/modspil/): niveau og
 * opgavenummer med mærket for profil og metode, statuslinjen, meldeforløbet, bordet med stikket og brugerens hånd,
 * spørgsmålet og svarknapperne; med `svar` også facit. HTML'en er den samme ved alle bredder; fra 1000 px står
 * meldeforløbet og bordet i venstre spalte og spørgsmålet og facit i højre (kun CSS).
 */
export function Opgave({ opgave: o, nummer, antal, svar, onSvar, onNaeste, onIndstillinger, xp, iTraek }: OpgaveProps) {
  // Regel 11 og 12 fra niveau 4: antallet er valgt, og "Hvilke?" venter på kortene.
  const [hvilkeFor, setHvilkeFor] = useState<number | null>(null);
  const [valgte, setValgte] = useState<Card[]>([]);
  const facit = svar !== undefined;
  const rigtigt = facit && erRigtigt(o, svar);
  const sprog = getLang();
  const gjort = Math.min(antal, nummer - 1 + (facit ? 1 : 0));

  const egne = egneKort(o);
  const spilbare = spilbareKort(o);
  const rest = vaelgerKort(o) ? egne.filter((c) => !spilbare.includes(c)) : egne;
  const valg = svarValg(o);
  const skjulte = spoergerHvilke(o) ? skjulteOver(o) : [];
  const aft = aftale(o);
  const navn = ovelsesNavn(o);

  function vaelgTal(s: Svar) {
    if (s.type !== 'tal' || !spoergerHvilke(o)) return onSvar(s);
    // 0 kort eller alle de skjulte: kortene følger af antallet.
    if (s.tal === 0) return onSvar({ type: 'tal', tal: 0, hvilke: [] });
    if (s.tal === skjulte.length) return onSvar({ type: 'tal', tal: s.tal, hvilke: [...skjulte] });
    setHvilkeFor(s.tal);
    setValgte([]);
  }

  const klasse = (s: Svar) => {
    if (!facit) return hvilkeFor !== null && s.type === 'tal' && s.tal === hvilkeFor ? 'ms-valg ms-valgt' : 'ms-valg';
    return `ms-valg${erRigtigt(o, s) ? ' ms-rigtig' : ''}`;
  };
  const trykket = (s: Svar) => (facit ? ens(s, svar) : hvilkeFor !== null && s.type === 'tal' ? s.tal === hvilkeFor : undefined);
  const plads = T.plads[o.plads];

  return (
    <article className="ms-opgave" data-ovelse={o.ovelse} data-niveau={o.niveau} data-seed={o.seed} data-facit={facit ? '' : undefined}>
      <div className="ms-hoved">
        <div className="ms-hoved-linje">
          <span className="eyebrow">{T.hoved(o.niveau, nummer, antal)}</span>
          <button type="button" className="ms-maerke" onClick={onIndstillinger}>
            {maerke(o)}
          </button>
        </div>
        <div className="ms-status" role="progressbar" aria-label={T.status} aria-valuemin={0} aria-valuemax={antal} aria-valuenow={gjort}>
          <span style={{ width: `${(100 * gjort) / antal}%` }} />
        </div>
      </div>

      <div className="wide-left">
        <Meldeforloeb o={o} />
        <section className="card ms-bord">
          <div className="ms-haand" data-haand="nord">
            <span className="eyebrow">
              {T.plads.N} · {T.bordet}
              {visHp(o) && ` · ${T.hp(hpI(o.haender.N))}`}
            </span>
            <Haandlinje kort={o.haender.N.filter((c) => !o.spillet.some((s) => s.kort === c))} />
          </div>
          <Stik o={o} />
          <Tidligere o={o} />
          <div className="ms-haand" data-haand="dig">
            <span className="eyebrow">
              {plads} · {T.dig}
              {visHp(o) && ` · ${T.hp(hpI(o.haender[o.plads]))}`}
              {vaelgerKort(o) && ` · ${o.ovelse === 'afkast' ? T.afkastet : T.dineKort(o.farve)}`}
            </span>
            {spilbare.length > 0 && (
              <div className="ms-kortknapper">
                {spilbare.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`ms-kortknap${facit && erRigtigt(o, { type: 'kort', kort: c }) ? ' ms-rigtig' : ''}`}
                    aria-label={kortLabelAf(c)}
                    aria-pressed={facit ? svar.type === 'kort' && svar.kort === c : undefined}
                    disabled={facit}
                    onClick={() => onSvar({ type: 'kort', kort: c })}
                  >
                    <Kort kort={c} />
                  </button>
                ))}
              </div>
            )}
            {rest.length > 0 && (
              <span className={vaelgerKort(o) ? 'ms-resten' : undefined}>
                <Haandlinje kort={rest} />
              </span>
            )}
          </div>
        </section>
      </div>

      <div className="wide-right">
        <section className="card ms-spoergsmaal">
          <div className="with-info">
            <span className="eyebrow">{navn}</span>
            <Info topic={navn}>{T.ovelseHjaelp[o.ovelse]}</Info>
          </div>
          <h1 className="ms-spm">
            <SuitText text={spoergsmaal(o)} />
          </h1>
          {aft && (
            <details className="ms-aftale">
              <summary>{aft.titel}</summary>
              {aft.tekst && (
                <p>
                  <SuitText text={aft.tekst} />
                </p>
              )}
            </details>
          )}
          {!vaelgerKort(o) && (
            <div className={`ms-svar${o.ovelse === 'regel11' ? ' ms-tal' : ''}`} role="group" aria-label={T.svar}>
              {valg.map((v) => (
                <button key={v.tekst} type="button" className={klasse(v.svar)} aria-pressed={trykket(v.svar)} disabled={facit} onClick={() => vaelgTal(v.svar)}>
                  <SuitText text={v.tekst} />
                </button>
              ))}
              <button
                type="button"
                className={`${klasse(kanIkkeValg().svar)} ms-kan-ikke`}
                aria-pressed={facit ? svar.type === 'kan-ikke-afgoeres' : undefined}
                disabled={facit}
                onClick={() => onSvar(kanIkkeValg().svar)}
              >
                {T.kanIkke}
              </button>
            </div>
          )}
          {!facit && hvilkeFor !== null && (
            <div className="ms-hvilke" role="group" aria-label={T.hvilke}>
              <p className="ms-note">
                <SuitText text={T.hvilkeSpm(hvilkeFor, kortTekst(o.spillet[0].kort, sprog))} />
              </p>
              <div className="ms-kortknapper">
                {skjulte.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="ms-kortknap"
                    aria-label={kortLabelAf(c)}
                    aria-pressed={valgte.includes(c)}
                    onClick={() => setValgte((v) => (v.includes(c) ? v.filter((x) => x !== c) : [...v, c]))}
                  >
                    <Kort kort={c} />
                  </button>
                ))}
              </div>
              <div className="ms-hvilke-knapper">
                <button type="button" className="btn small-btn" onClick={() => onSvar({ type: 'tal', tal: hvilkeFor, hvilke: 'kan-ikke-afgoeres' })}>
                  {T.kanIkke}
                </button>
                <button
                  type="button"
                  className="btn small-btn primary"
                  disabled={valgte.length !== hvilkeFor}
                  onClick={() => onSvar({ type: 'tal', tal: hvilkeFor, hvilke: [...valgte].sort((a, b) => a - b) })}
                >
                  {T.svarKnap}
                </button>
              </div>
            </div>
          )}
          {tip(o) && <p className="ms-note">{T.tip}</p>}
        </section>
        {facit && <Facit o={o} svar={svar} rigtigt={rigtigt} xp={xp} iTraek={iTraek} onNaeste={onNaeste} />}
      </div>
    </article>
  );
}
