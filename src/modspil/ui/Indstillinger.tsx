import { useRef, useState } from 'react';
import { dayOf } from '../../engine/dates';
import { getLang } from '../../i18n';
import { Info } from '../../ui/Info';
import { KATEGORI_DATA, medMetode, metode, PROFILER, profil, profilNavn, type KategoriId, type Metode, type ProfilId } from '../model/metoder';
import { msExportFileName, parseMsImport, type MsSaved } from '../storage';
import { T } from './tekster';

/** Gemmer en kopi af dataene som fil og giver dagen tilbage, så den kan gemmes som `lastExport`. */
export function downloadMsExport(saved: MsSaved, now = Date.now()): string {
  const today = dayOf(now, saved.settings.dayStartsAtHour);
  const blob = new Blob([JSON.stringify(saved, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = msExportFileName(today);
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return today;
}

const stort = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Navnets første ord, fx "romersk" af "romersk kald" og "Roman" af "Roman signals". */
const foersteOrd = (s: string) => s.split(' ')[0];

/**
 * Metodens navn i rullelisten, kort nok til at kunne ses helt ved 390 px (Franks svar 2, 18. nov. 2026). En metode, der
 * mod sans spilles som en anden (romersk kald), siger den anden metode og sit eget første ord mod farve, fx
 * "Lavt = kald; romersk mod farve". En metode, der mod farve spilles som en anden (ALA), har kun sit navn, der selv
 * siger sans, fx "ALA mod sans". Teksterne bygges af metodernes navne i metoder.json, aldrig af deres id.
 */
function metodeNavn(kategori: KategoriId, m: Metode): string {
  const tekst = (x: Metode) => (getLang() === 'en' ? x.tekstEn : x.tekst);
  if (m.sans) return stort(`${tekst(metode(kategori, m.sans))}; ${T.modFarve(foersteOrd(tekst(m)))}`);
  return stort(tekst(m));
}

interface IndstillingerProps {
  saved: MsSaved;
  update(next: MsSaved): void;
}

/**
 * Indstillinger (SPEC-modspil.md, trin 2, og mock-up 4): de tre profiler som radioknapper og de syv metoder som
 * rullelister; en ændret metode gør profilen til "Egen". Desuden niveauet og Modspils egen eksport og import som i
 * Pointregnskab. Valget gemmes straks i `modspil:v1`.
 */
export function Indstillinger({ saved, update }: IndstillingerProps) {
  const [indkommende, setIndkommende] = useState<MsSaved | null>(null);
  const [besked, setBesked] = useState('');
  const fil = useRef<HTMLInputElement>(null);
  const en = getLang() === 'en';
  const navnPaa = (id: ProfilId | 'egen') => {
    const n = profilNavn(id);
    return en ? n.tekstEn : n.tekst;
  };

  function vaelgProfil(id: ProfilId) {
    update({ ...saved, profil: id, metoder: { ...profil(id).valg } });
  }

  function vaelgMetode(kategori: KategoriId, id: string) {
    const ny = medMetode({ id: saved.profil, valg: saved.metoder }, kategori, id);
    update({ ...saved, profil: ny.id as ProfilId | 'egen', metoder: { ...ny.valg } });
  }

  function eksporter() {
    update({ ...saved, lastExport: downloadMsExport(saved) });
    setBesked(T.eksporteret);
  }

  async function laesFil(f: File | undefined) {
    if (!f) return;
    const r = parseMsImport(await f.text());
    if (r.ok) {
      setIndkommende(r.saved);
      setBesked('');
    } else {
      setIndkommende(null);
      setBesked(T.importFejl[r.error]);
    }
  }

  return (
    <>
      <fieldset className="card ms-profiler">
        <legend className="ms-legend">{T.profilOgMetoder}</legend>
        <p className="ms-note">{T.profilIntro}</p>
        {PROFILER.map((p) => {
          const id = p.id as ProfilId;
          return (
            <label key={id} className="ms-profil">
              <input type="radio" name="ms-profil" value={id} checked={saved.profil === id} onChange={() => vaelgProfil(id)} />{' '}
              <span className="ms-profil-tekst">
                <span className="ms-profil-navn">{navnPaa(id)}</span> <span className="ms-note">{T.profilResume[id]}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <section className="card ms-metoder" aria-labelledby="ms-metoder-titel">
        <div className="with-info">
          <h2 id="ms-metoder-titel">{T.metoderneI(navnPaa(saved.profil))}</h2>
          <Info topic={T.metoder}>{T.hjaelp.metoder}</Info>
        </div>
        {KATEGORI_DATA.map((k) => (
          <div key={k.id} className="ms-metode">
            <label htmlFor={`ms-metode-${k.id}`}>{en ? k.tekstEn : k.tekst}</label>
            <select id={`ms-metode-${k.id}`} value={saved.metoder[k.id]} onChange={(e) => vaelgMetode(k.id, e.target.value)}>
              {k.metoder.map((m) => (
                <option key={m.id} value={m.id}>
                  {metodeNavn(k.id, m)}
                </option>
              ))}
            </select>
          </div>
        ))}
        <p className="ms-note">{T.egenNote}</p>
      </section>

      <section className="card" aria-labelledby="ms-data">
        <div className="with-info">
          <h2 id="ms-data">{T.data}</h2>
          <Info topic={T.data}>{T.hjaelp.data}</Info>
        </div>
        <div className="with-info">
          <p>{T.niveauNu(saved.level, T.niveauNavne[saved.level])}</p>
          <Info topic={T.niveau(saved.level)}>{T.hjaelp.niveau}</Info>
        </div>
        <p className="ms-note">{T.dataHjaelp}</p>
        <button type="button" className="btn" onClick={eksporter}>
          {T.eksporter}
        </button>
        <button type="button" className="btn" onClick={() => fil.current?.click()}>
          {T.importer}
        </button>
        <input
          ref={fil}
          type="file"
          accept="application/json,.json"
          aria-label={T.importFil}
          hidden
          onChange={(e) => {
            void laesFil(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {besked && (
          <p role="status" className="ms-note">
            {besked}
          </p>
        )}
        <p className="ms-note">{saved.lastExport ? T.senesteEksport(T.datoTekst(saved.lastExport)) : T.aldrigEksporteret}</p>
      </section>

      {indkommende && (
        <section className="card" aria-label={T.importer}>
          <p>{T.importResume(indkommende.xp, Object.keys(indkommende.items).length, indkommende.sessions.length, indkommende.streak.current)}</p>
          <div className="ms-handlinger">
            <button type="button" className="btn small-btn" onClick={() => setIndkommende(null)}>
              {T.annuller}
            </button>
            <button
              type="button"
              className="btn small-btn primary"
              onClick={() => {
                update(indkommende);
                setIndkommende(null);
                setBesked(T.importeret);
              }}
            >
              {T.erstat}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
