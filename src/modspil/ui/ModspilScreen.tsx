import { useCallback, useEffect, useMemo, useState } from 'react';
import { dayOf } from '../../engine/dates';
import { formatInt } from '../../engine/format';
import { randomSeed } from '../../engine/rng';
import { streakOn } from '../../engine/streak';
import { getLang } from '../../i18n';
import { Footer } from '../../ui/Footer';
import { Info } from '../../ui/Info';
import { TopBar } from '../../ui/TopBar';
import { bedoemUdspil, hentDatasaet, lavFindUdspil, type Datasaet, type FindUdspilOpgave, type UdspilSvar } from '../model/findUdspil';
import { profilNavn } from '../model/metoder';
import { loadMsSaved, msExportDue, MS_STORAGE_KEY, saveMsSaved, type MsSaved } from '../storage';
import { udspilIOpgave } from '../training/findUdspil';
import type { Svar } from '../training/scoring';
import { ANTAL_OPGAVER, answerMsTask, answerUdspilTask, nextMsStep, profilAf, REPETITIONER, repetitionsKoe, startMsSession, type MsSession } from '../training/session';
import { FindUdspil } from './FindUdspil';
import { downloadMsExport, Indstillinger } from './Indstillinger';
import { Opgave } from './Opgave';
import { T } from './tekster';
import '../../farvebehandling/ui/tokens.css';
import './modspil.css';

type Storage = { getItem(key: string): string | null; setItem(key: string, value: string): void };

/** Browserens lagring under `modspil:v1`; er den spærret (fx privat vindue), bruges en midlertidig i hukommelsen. */
function browserStorage(): Storage {
  try {
    const storage = window.localStorage;
    storage.getItem(MS_STORAGE_KEY);
    return storage;
  } catch {
    const memory = new Map<string, string>();
    return { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => void memory.set(k, v) };
  }
}

type View = 'home' | 'session' | 'settings';

/** En ny session med den første opgave; intet gemmes, før brugeren svarer. */
function nySession(saved: MsSaved): MsSession {
  const now = Date.now();
  return nextMsStep(startMsSession(saved, now, randomSeed()), saved, now).session;
}

/**
 * Modspil (SPEC-modspil.md, trin 2): sporets forside med dagens plan, sessionen med opgaverne fra trin 1 og status, og
 * Indstillinger med profil, metoder og data. `start`: skærmen begynder i dagens session (forsidens "Start dagens
 * session i …", SPEC-forside-spor.md).
 */
export default function ModspilScreen({ onBack, start = false }: { onBack(): void; start?: boolean }) {
  const storage = useMemo(browserStorage, []);
  // Intet skrives, før brugeren gør noget.
  const [saved, setSaved] = useState<MsSaved>(() => loadMsSaved(storage));
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<View>(start ? 'session' : 'home');
  const [session, setSession] = useState<MsSession | null>(() => (start ? nySession(saved) : null));
  const [resultat, setResultat] = useState<{ svar: Svar; xp: number } | null>(null);
  // Øvelse 8 (SPEC-modspil-v2.md, trin 3): datasættet hentes dovent første gang, øvelsen trækkes, og opgaven laves én
  // gang pr. opgave i sessionen med profilen fra det øjeblik (som v1's opgaver).
  const [udspilData, setUdspilData] = useState<Datasaet | null>(null);
  const [udspilFejl, setUdspilFejl] = useState(false);
  const [udspilOpgave, setUdspilOpgave] = useState<{ count: number; opgave: FindUdspilOpgave } | null>(null);
  const [udspilResultat, setUdspilResultat] = useState<{ svar: UdspilSvar; xp: number } | null>(null);
  const udspilRef = session && !session.done ? udspilIOpgave(session) : null;
  const venterPaaData = udspilRef !== null && udspilData === null;

  useEffect(() => {
    if (!venterPaaData) return;
    let aktiv = true;
    hentDatasaet().then(
      (data) => aktiv && setUdspilData(data),
      () => aktiv && setUdspilFejl(true),
    );
    return () => {
      aktiv = false;
    };
  }, [venterPaaData]);

  useEffect(() => {
    if (!session || !udspilRef || !udspilData || udspilOpgave?.count === session.count) return;
    setUdspilOpgave({ count: session.count, opgave: lavFindUdspil(udspilRef.niveau, udspilRef.seed, profilAf(saved), udspilData) });
  }, [session, udspilRef, udspilData, udspilOpgave, saved]);
  const aktuelUdspil = session && udspilRef && udspilOpgave?.count === session.count ? udspilOpgave.opgave : null;

  const update = useCallback(
    (next: MsSaved) => {
      setSaved(next);
      setFailed(!saveMsSaved(storage, next));
    },
    [storage],
  );
  const vis = (v: View) => {
    setView(v);
    window.scrollTo(0, 0);
  };
  const hjem = () => {
    setSession(null);
    setResultat(null);
    setUdspilResultat(null);
    vis('home');
  };
  const startSession = () => {
    setSession(nySession(saved));
    setResultat(null);
    setUdspilResultat(null);
    vis('session');
  };
  /** Indstillinger fører tilbage til sessionen, hvis en er i gang. */
  const fraIndstillinger = () => vis(session && !session.done ? 'session' : 'home');

  function svar(s: Svar) {
    if (!session) return;
    const r = answerMsTask(session, saved, s, Date.now());
    update(r.saved);
    setSession(r.session);
    setResultat({ svar: s, xp: r.xp });
  }

  /** Svar på øvelse 8: dommen kommer fra modellen, og sessionen registrerer den som v1's svar. */
  function svarUdspil(s: UdspilSvar) {
    if (!session || !aktuelUdspil) return;
    const r = answerUdspilTask(session, saved, bedoemUdspil(aktuelUdspil, s).rigtig, Date.now());
    update(r.saved);
    setSession(r.session);
    setUdspilResultat({ svar: s, xp: r.xp });
  }

  function naeste() {
    if (!session) return;
    const r = nextMsStep(session, saved, Date.now());
    if (r.saved !== saved) update(r.saved);
    setSession(r.session);
    setResultat(null);
    setUdspilResultat(null);
    window.scrollTo(0, 0);
  }

  const frame = view !== 'session';
  let indhold;
  if (view === 'settings') {
    indhold = (
      <>
        <header className="screen-head">
          <button type="button" className="round" aria-label={T.tilbageTilSporet} onClick={fraIndstillinger}>
            ←
          </button>
          <h1>{T.indstillinger}</h1>
          <Info topic={T.indstillinger}>{T.hjaelp.indstillinger}</Info>
        </header>
        <Indstillinger saved={saved} update={update} />
      </>
    );
  } else if (view === 'session' && session) {
    indhold = session.done ? (
      <Status saved={saved} session={session} onExit={hjem} />
    ) : (
      <>
        <div className="session-bar">
          <span className="phase">
            {T.titel} · {T.faser[session.fase]}
          </span>
          <span className="session-meta">{T.sessionMeta(session.xp)}</span>
          <button type="button" className="round" aria-label={T.afbryd} onClick={hjem}>
            ✕
          </button>
        </div>
        {session.opgave && (
          <Opgave
            key={session.count}
            opgave={session.opgave}
            nummer={session.count}
            antal={ANTAL_OPGAVER}
            svar={resultat?.svar}
            xp={resultat?.xp}
            iTraek={resultat ? session.iTraek : undefined}
            onSvar={svar}
            onNaeste={naeste}
            onIndstillinger={() => vis('settings')}
          />
        )}
        {udspilRef &&
          (aktuelUdspil ? (
            <FindUdspil
              key={session.count}
              opgave={aktuelUdspil}
              nummer={session.count}
              antal={ANTAL_OPGAVER}
              svar={udspilResultat?.svar}
              xp={udspilResultat?.xp}
              iTraek={udspilResultat ? session.iTraek : undefined}
              onSvar={svarUdspil}
              onNaeste={naeste}
              onIndstillinger={() => vis('settings')}
            />
          ) : udspilFejl ? (
            <section className="card">
              <p role="alert">{T.udspil.hentFejl}</p>
              <button type="button" className="btn primary wide" onClick={naeste}>
                {T.naeste}
              </button>
            </section>
          ) : (
            <p className="ms-note" role="status">
              {T.udspil.henter}
            </p>
          ))}
      </>
    );
  } else {
    indhold = <Forside saved={saved} update={update} onBack={onBack} onStart={startSession} onSettings={() => vis('settings')} />;
  }

  return (
    <>
      {frame && <TopBar />}
      <main className={`screen ms-screen${view === 'settings' ? ' wide-screen settings-grid' : ''}`}>
        {failed && (
          <p role="alert" className="ms-note">
            {T.gemFejl}
          </p>
        )}
        {indhold}
        {frame && <Footer />}
      </main>
    </>
  );
}

interface ForsideProps {
  saved: MsSaved;
  update(next: MsSaved): void;
  onBack(): void;
  onStart(): void;
  onSettings(): void;
}

/** Sporets forside: streak og XP, dagens plan, startknappen, profilen og Indstillinger. */
function Forside({ saved, update, onBack, onStart, onSettings }: ForsideProps) {
  const today = dayOf(Date.now(), saved.settings.dayStartsAtHour);
  const streak = streakOn(saved.streak, today).current;
  const repetition = Math.min(REPETITIONER, repetitionsKoe(saved, today).length);
  const navn = profilNavn(saved.profil);
  return (
    <>
      <header className="screen-head">
        <button type="button" className="round" aria-label={T.tilbage} onClick={onBack}>
          ←
        </button>
        <h1>{T.titel}</h1>
        <Info topic={T.titel}>{T.hjaelp.skaerm}</Info>
        <span className="ms-niveau">{T.niveau(saved.level)}</span>
      </header>
      <div className="stats">
        <div className="stat">
          <span className="stat-value">{streak}</span>
          <span className="stat-label">{T.dageITraek(streak)}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatInt(saved.xp)}</span>
          <span className="stat-label">{T.xp}</span>
        </div>
      </div>
      <section className="card" aria-labelledby="ms-i-dag">
        <div className="with-info">
          <h2 id="ms-i-dag">{T.iDag}</h2>
          <Info topic={T.iDag}>{T.hjaelp.iDag}</Info>
        </div>
        <p>{T.dagensPlan(repetition, ANTAL_OPGAVER, saved.level)}</p>
        {saved.streak.lastDay === today && <p className="ms-note">{T.gennemfoertIDag}</p>}
        <div className="with-info">
          <button type="button" className="btn primary wide" onClick={onStart}>
            {T.start}
          </button>
          <Info topic={T.start}>{T.hjaelp.start}</Info>
        </div>
        <p className="ms-note">{T.egetSpor}</p>
      </section>
      {msExportDue(saved, today) && (
        <section className="card" aria-label={T.data}>
          <p className="ms-note">{T.eksportPaamindelse}</p>
          <button type="button" className="btn small-btn" onClick={() => update({ ...saved, lastExport: downloadMsExport(saved) })}>
            {T.eksportNu}
          </button>
        </section>
      )}
      <section className="card" aria-labelledby="ms-metoder">
        <div className="with-info">
          <h2 id="ms-metoder">{T.metoder}</h2>
          <Info topic={T.metoder}>{T.hjaelp.metoder}</Info>
        </div>
        <p>{T.dinProfil(getLang() === 'en' ? navn.tekstEn : navn.tekst)}</p>
        <div className="with-info">
          <button type="button" className="btn" onClick={onSettings}>
            {T.indstillinger}
          </button>
          <Info topic={T.indstillinger}>{T.hjaelp.indstillinger}</Info>
        </div>
      </section>
    </>
  );
}

/** Status efter sessionens sidste opgave: resultatet, streak, XP og niveauet. Sessionen er registreret. */
function Status({ saved, session, onExit }: { saved: MsSaved; session: MsSession; onExit(): void }) {
  const today = dayOf(Date.now(), saved.settings.dayStartsAtHour);
  return (
    <section className="card" aria-labelledby="ms-status">
      <div className="with-info">
        <h1 id="ms-status">{T.sessionGennemfoert}</h1>
        <Info topic={T.sessionGennemfoert}>{T.hjaelp.status}</Info>
      </div>
      <p>{T.sessionScore(session.correct, session.total)}</p>
      <p>{T.sessionXp(session.xp)}</p>
      <div className="stats">
        <div className="stat">
          <span className="stat-value">{streakOn(saved.streak, today).current}</span>
          <span className="stat-label">{T.streak}</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatInt(saved.xp)}</span>
          <span className="stat-label">{T.xp}</span>
        </div>
      </div>
      <p>{T.niveauNu(saved.level, T.niveauNavne[saved.level])}</p>
      <button type="button" className="btn primary wide" onClick={onExit}>
        {T.tilbageTilSporet}
      </button>
    </section>
  );
}
