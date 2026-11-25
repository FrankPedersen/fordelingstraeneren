import type { Card } from '../../domain/cards';
import type { Seat } from '../../domain/dealer';
import { getLang } from '../../i18n';
import { Info } from '../../ui/Info';
import { SuitText } from '../../ui/SuitText';
import situationsfil from '../content/udspil/situationer.json';
import { bedoemUdspil, type FindUdspilOpgave, type SituationId, type UdspilSvar } from '../model/findUdspil';
import { procent, tiendedele } from '../model/findUdspilTekst';
import { meldingTekst } from '../model/meldinger';
import { gaeldende, metode, profilId, profilNavn } from '../model/metoder';
import { farveAf, kontraktTekst, kortTekst, SYMBOLER, vaerdiAf, valoer } from '../model/tekst';
import { udspilKategori } from '../model/udspil';
import { bedsteSvar, prisTekst, udspilPris, UNDER_TIENDEDEL, type PrisRaekke } from '../model/udspilPris';
import { FIND_UDSPIL } from '../training/findUdspil';
import { hpI } from './opgavetekst';
import { kortLabelAf, T } from './tekster';
import '../../farvebehandling/ui/tokens.css';
import './modspil.css';

/*
 * Øvelse 8, "Find udspillet", på skærmen (SPEC-modspil-v2.md, trin 3, "Skærmen" og "Prisen", og mock-up'en i
 * docs/specs/design/modspil-v2/, varianten med prisen). Accepttestene står i src/modspil/udspil-skaerme/, og
 * grænsefladen øverst i hjaelp.tsx. Opbygningen følger v1's `Opgave.tsx`: niveau og opgavenummer med mærket, så
 * meldeforløbet og Vests hånd (`.wide-left`) og spørgsmålet, svarknapperne og facit (`.wide-right`). HTML'en er den
 * samme ved alle bredder; modspil.css afgør, hvad der står hvor:
 * - under 1000 px på niveau 3–5 er hånden skjult, før der er svaret, fordi kortknapperne er hånden (mock-up 3);
 * - under 1000 px i facit står meldeforløbet trukket sammen på én linje over hånden, og spørgsmålet er skjult
 *   (mock-up 2 og 4);
 * - fra 1000 px står meldeforløbet og hånden til venstre og spørgsmålet og facit til højre (mock-up 5).
 */

export interface FindUdspilProps {
  opgave: FindUdspilOpgave;
  nummer: number;
  antal: number;
  /** Med svaret viser skærmen også facit (samme HTML ved alle bredder). */
  svar?: UdspilSvar;
  onSvar(svar: UdspilSvar): void;
  onNaeste(): void;
  onIndstillinger(): void;
  /** XP for svaret og rigtige i træk; vises i facit, når sessionen giver dem. */
  xp?: number;
  iTraek?: number;
}

const ORDEN: readonly Seat[] = ['W', 'N', 'E', 'S'];

/** Syds hp-interval fra situationsfilens krav (fx 15–17 efter 1NT). */
const SYD_HP: Readonly<Record<string, readonly [number, number]>> = Object.fromEntries(
  (situationsfil as unknown as { situationer: { id: string; krav: { S: { hp: [number, number] } } }[] }).situationer.map((s) => [s.id, s.krav.S.hp]),
);
const sydHp = (id: SituationId): readonly [number, number] => SYD_HP[id];

const seatAf = (melding: string) => melding.split(':')[0] as Seat;
const kaldAf = (melding: string) => melding.split(':')[1];
const erPas = (kald: string) => kald === 'P';

/** Kortet med farvesymbol, hvor ♥ og ♦ er røde, fx ♠7 og ♥K. */
const Kort = ({ kort }: { kort: Card }) => <SuitText text={kortTekst(kort, getLang())} />;

/** Hånden som tekstlinjer pr. farve: symbolet og valørerne faldende, fx "♠ KB76" (som v1). */
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

/** Mærket: profilens navn og metoden for udspillet mod kontraktens art, fx "Standard · 4.-højeste". */
function maerke(o: FindUdspilOpgave): string {
  const navn = profilNavn(profilId(o.profil.valg));
  const g = gaeldende(o.profil, udspilKategori(o.art), o.art);
  const m = metode(g.kategori, g.id);
  return getLang() === 'en' ? T.maerkeLabel(navn.tekstEn, m.tekstEn) : T.maerkeLabel(navn.tekst, m.tekst);
}

/** Meldeforløbet som skema med fire kolonner (Vest, Nord, Øst, Syd), kontrakten fremhævet, og linjen om kontrakten. */
function Meldeforloeb({ o }: { o: FindUdspilOpgave }) {
  const sprog = getLang();
  const kontraktIndeks = o.meldinger.reduce((sidst, m, i) => (erPas(kaldAf(m)) ? sidst : i), -1);
  const celler: ({ tekst: string; kontrakt: boolean; pas: boolean } | null)[] = [
    ...Array(ORDEN.indexOf(o.giver)).fill(null),
    ...o.meldinger.map((m, i) => ({ tekst: meldingTekst(kaldAf(m), sprog), kontrakt: i === kontraktIndeks, pas: erPas(kaldAf(m)) })),
  ];
  while (celler.length % 4) celler.push(null);
  const raekker: (typeof celler)[] = [];
  for (let i = 0; i < celler.length; i += 4) raekker.push(celler.slice(i, i + 4));
  const [min, max] = sydHp(o.situation);
  return (
    <section className="card ms-meldinger">
      <table className="ms-meldeskema" aria-label={T.meldeforloebet}>
        <thead>
          <tr>
            {ORDEN.map((p) => (
              <th key={p} scope="col">
                {p === 'W' ? `${T.plads.W} · ${T.dig}` : T.plads[p]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {raekker.map((r, i) => (
            <tr key={i}>
              {r.map((m, j) => (
                <td key={j} className={m ? (m.kontrakt ? 'ms-melding ms-kontrakt' : m.pas ? undefined : 'ms-melding') : undefined}>
                  {m && <SuitText text={m.tekst} />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="ms-note">
        <SuitText text={`${T.kontrakt(kontraktTekst(o.kontrakt))} ${T.udspil.vist(min, max)} ${T.udspil.duSpillerUd}`} />
      </p>
    </section>
  );
}

/** Meldeforløbet på én linje, fx "Syd 1NT – Nord 3NT · alle passer" (i facit under 1000 px, mock-up 2 og 4). */
function kortForloeb(o: FindUdspilOpgave): string {
  const sprog = getLang();
  const kald = o.meldinger.filter((m) => !erPas(kaldAf(m))).map((m) => `${T.plads[seatAf(m)]} ${meldingTekst(kaldAf(m), sprog)}`);
  return `${kald.join(' – ')} · ${T.udspil.allePasser}`;
}

/** Svaret som tekst, fx "♦" eller "♥4". */
const svarTekst = (svar: { farve: number } | { kort: Card }): string => ('farve' in svar ? SYMBOLER[svar.farve] : kortTekst(svar.kort, getLang()));

const erValgt = (svar: UdspilSvar | undefined, s: UdspilSvar): boolean =>
  svar !== undefined && ('farve' in svar ? 'farve' in s && s.farve === svar.farve : 'kort' in s && s.kort === svar.kort);

/** Koster-cellen: "–", prisen med én decimal eller "< 0,1". */
function kosterTekst(koster: number | null): string {
  const sprog = getLang();
  if (koster === null) return '–';
  return koster < UNDER_TIENDEDEL ? `< ${prisTekst(UNDER_TIENDEDEL, sprog)}` : prisTekst(koster, sprog);
}

/** Første celle: farven eller kortet og mærket "✓ bedst", "table feeling" eller "dit svar". */
function UdspilCelle({ r }: { r: PrisRaekke }) {
  return (
    <>
      <SuitText text={r.kort === undefined ? SYMBOLER[r.farve] : kortTekst(r.kort, getLang())} />
      {r.rigtig && <span className="ms-raekke-maerke ms-raekke-bedst"> ✓ {T.udspil.bedst}</span>}
      {r.tableFeeling && <span className="ms-raekke-maerke"> {T.udspil.tableFeeling}</span>}
      {r.ditSvar && <span className="ms-raekke-maerke"> {T.udspil.ditSvarRaekke}</span>}
    </>
  );
}

interface FacitProps {
  o: FindUdspilOpgave;
  svar: UdspilSvar;
  xp?: number;
  iTraek?: number;
  onNaeste(): void;
}

/** Facit: mærket, "Dit svar" med prisen, domsteksten, tabellen, forklaringen, "Ved bordet", ordbogen og Næste opgave. */
function Facit({ o, svar, xp, iTraek, onNaeste }: FacitProps) {
  const sprog = getLang();
  const dom = bedoemUdspil(o, svar);
  const { pris, raekker } = udspilPris(o, svar);
  const meta = [xp !== undefined ? T.xpVundet(xp) : null, iTraek && iTraek > 1 ? T.iTraek(iTraek) : null].filter(Boolean).join(' · ');
  const bedste = bedsteSvar(o).map(svarTekst);
  return (
    <section className="card ms-facit" aria-labelledby="ms-dom">
      <div className="ms-dom" data-dom={dom.rigtig ? 'rigtigt' : 'forkert'}>
        <span className="ms-dom-ikon" aria-hidden="true">
          {dom.rigtig ? '✓' : '✗'}
        </span>
        <h2 id="ms-dom">
          <SuitText text={T.dom(dom.rigtig, T.udspil.flestStik(bedste))} />
        </h2>
      </div>
      <p className="ms-note ms-dit-svar">
        {T.ditSvar}: <SuitText text={svarTekst(svar)} />
        {pris !== null && (
          <>
            {' · '}
            <span className="ms-pris">{pris < UNDER_TIENDEDEL ? T.udspil.kosterUnder(prisTekst(UNDER_TIENDEDEL, sprog)) : T.udspil.koster(prisTekst(pris, sprog))}</span>
          </>
        )}
        {meta && ` · ${meta}`}
      </p>
      {dom.tekst && (
        <p className="ms-domtekst">
          <SuitText text={dom.tekst[sprog]} />
        </p>
      )}
      <table className="ms-udspil-tabel" aria-label={T.udspil.tabelNavn}>
        <thead>
          <tr>
            {T.udspil.kolonner.map((k) => (
              <th key={k} scope="col">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {raekker.map((r) => (
            <tr key={`${r.farve}-${r.kort ?? ''}-${r.ditSvar}`} className={r.rigtig ? 'ms-raekke-rigtig' : r.ditSvar && !r.tableFeeling ? 'ms-raekke-dit' : undefined}>
              <th scope="row">
                <UdspilCelle r={r} />
              </th>
              <td>{tiendedele(r.middel, sprog)}</td>
              <td>{T.udspil.procent(procent(r.saet, o.facit.fordelinger))}</td>
              <td>{kosterTekst(r.koster)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="ms-note ms-tabel-note">
        <SuitText text={T.udspil.tabelNote(kontraktTekst(o.kontrakt), o.facit.fordelinger)} />
      </p>
      <p className="ms-forklaring">
        <SuitText text={o.forklaring[sprog]} />
      </p>
      <div className="ms-ved-bordet">
        <span className="ms-ved-titel">{T.vedBordet}</span>
        <p>
          <SuitText text={o.vedBordet[sprog]} />
        </p>
      </div>
      <div className="ms-facit-knapper">
        <a className="btn small-btn" href="https://www.kontraktbridge.dk/ordbog/#udspil" target="_blank" rel="noopener">
          {T.ordbog.udspil}
        </a>
        <button type="button" className="btn small-btn primary" onClick={onNaeste}>
          {T.naeste}
        </button>
      </div>
    </section>
  );
}

/**
 * Øvelse 8's skærm: opgaven og, med `svar`, facit. Et klik på en farve- eller kortknap svarer med det samme; der er
 * ingen "Kan ikke afgøres" i øvelse 8.
 */
export function FindUdspil({ opgave: o, nummer, antal, svar, onSvar, onNaeste, onIndstillinger, xp, iTraek }: FindUdspilProps) {
  const facit = svar !== undefined;
  const gjort = Math.min(antal, nummer - 1 + (facit ? 1 : 0));
  const navn = T.udspil.navn;
  const antalI = (f: number) => o.vest.filter((c) => farveAf(c) === f).length;
  const rigtig = (s: UdspilSvar) => facit && ('farve' in s ? o.facit.farver.includes(s.farve) : o.facit.kort.includes(s.kort));
  const farver = [0, 1, 2, 3].filter((f) => antalI(f) > 0);

  return (
    <article className="ms-opgave ms-udspil" data-ovelse={FIND_UDSPIL} data-niveau={o.niveau} data-seed={o.seed} data-svar={o.svar} data-facit={facit ? '' : undefined}>
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
        <section className="card ms-udspil-haand">
          {facit && (
            <span className="ms-udspil-forloeb">
              <SuitText text={kortForloeb(o)} />
            </span>
          )}
          <div className="ms-haand" data-haand="dig">
            <span className="eyebrow">
              {T.plads.W} · {T.dig} · <span className="ms-hp">{T.hp(hpI(o.vest))}</span>
            </span>
            <Haandlinje kort={o.vest} />
          </div>
        </section>
      </div>

      <div className="wide-right">
        <section className="card ms-spoergsmaal">
          <div className="with-info">
            <span className="eyebrow">{navn}</span>
            <Info topic={navn}>{T.udspil.hjaelp}</Info>
          </div>
          <h1 className="ms-spm">{o.svar === 'farve' ? T.udspil.spmFarve : T.udspil.spmKort}</h1>
          {o.svar === 'farve' ? (
            <div className="ms-farveknapper" role="group" aria-label={T.svar}>
              {[0, 1, 2, 3].map((f) => {
                const n = antalI(f);
                const s = { farve: f };
                return (
                  <button
                    key={f}
                    type="button"
                    className={`ms-valg ms-farveknap${n === 0 ? ' ms-tom-farve' : ''}${rigtig(s) ? ' ms-rigtig' : ''}`}
                    aria-label={T.udspil.farveLabel(f, n)}
                    aria-pressed={facit ? erValgt(svar, s) : undefined}
                    disabled={facit || n === 0}
                    onClick={() => onSvar(s)}
                  >
                    <SuitText text={SYMBOLER[f]} />
                    <span className="ms-farveantal">{T.udspil.antalKort(n)}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="ms-kortraekker" role="group" aria-label={T.svar}>
              {farver.map((f) => (
                <div key={f} className="ms-kortraekke">
                  {o.vest
                    .filter((c) => farveAf(c) === f)
                    .sort((a, b) => b - a)
                    .map((c) => {
                      const s = { kort: c };
                      return (
                        <button
                          key={c}
                          type="button"
                          className={`ms-kortknap${rigtig(s) ? ' ms-rigtig' : ''}`}
                          aria-label={kortLabelAf(c)}
                          aria-pressed={facit ? erValgt(svar, s) : undefined}
                          disabled={facit}
                          onClick={() => onSvar(s)}
                        >
                          <Kort kort={c} />
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          )}
        </section>
        {facit && <Facit o={o} svar={svar} xp={xp} iTraek={iTraek} onNaeste={onNaeste} />}
      </div>
    </article>
  );
}
