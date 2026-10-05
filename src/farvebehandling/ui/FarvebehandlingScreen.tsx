import { useCallback, useEffect, useMemo, useState } from 'react';
import techniquesFile from '../content/techniques.json';
import { loadBank, type BankItem } from '../analysis';
import { FB_STORAGE_KEY, loadFbSaved, requestPersistence, saveFbSaved, type FbSaved } from '../storage';
import { ensureStations } from '../training/palace';
import { Analysevindue } from './Analysevindue';
import { Selvvalgt } from './Selvvalgt';
import { TEXT } from './texts';
import { Træning } from './Træning';
import './tokens.css';
import './farvebehandling.css';
import { getLang } from '../../i18n';
import { Info } from '../../ui/Info';

type Tab = 'training' | 'practice' | 'analysis';

interface FarvebehandlingScreenProps {
  onBack(): void;
}

type Storage = { getItem(key: string): string | null; setItem(key: string, value: string): void };

/** Browserens lagring; er den spærret (fx privat vindue), bruges en midlertidig i hukommelsen. */
function browserStorage(): Storage {
  try {
    const storage = window.localStorage;
    storage.getItem(FB_STORAGE_KEY);
    return storage;
  } catch {
    const memory = new Map<string, string>();
    return { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => void memory.set(k, v) };
  }
}

/** Banken ligger i én fil pr. side, så hver fil er lille nok til, at appen kan gemme den offline. */
const pageFiles = import.meta.glob<string>('../content/app/side-*.json', { query: '?raw', import: 'default' });

let loading: Promise<BankItem[]> | null = null;

/** Første gang brugeren gemmer noget, beder appen browseren om fast lagring (én gang pr. indlæsning). */
let persistenceRequested = false;

/** Henter banken én gang; mislykkes det, prøves der igen næste gang. */
function loadAppBank(): Promise<BankItem[]> {
  loading ??= Promise.all(Object.values(pageFiles).map((load) => load()))
    .then(loadBank)
    .catch((error: unknown) => {
      loading = null;
      throw error;
    });
  return loading;
}

/** Farvebehandlingens skal: tilbage til forsiden og fanerne Træning, Selvvalgt og Analyse. */
export default function FarvebehandlingScreen({ onBack }: FarvebehandlingScreenProps) {
  const [tab, setTab] = useState<Tab>('training');
  // Kombinationen, som Analyse åbner med, når den vælges i klubaftenen.
  const [analysisStart, setAnalysisStart] = useState<string | null>(null);
  // Tekniken, som Selvvalgt åbner med, når den vælges i statistikken.
  const [practiceStart, setPracticeStart] = useState<string | null>(null);
  const [bank, setBank] = useState<BankItem[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  // Teknikkernes navn, huskeregel og billede på det aktuelle sprog.
  const techniques = techniquesFile.techniques.map((t) => (getLang() === 'en' ? { ...t, ...t.en } : t));
  const storage = useMemo(browserStorage, []);
  // Intet skrives, før brugeren gør noget; et kig i Analyse rører ikke lagringen.
  const [saved, setSaved] = useState<FbSaved>(() => loadFbSaved(storage));
  const [failed, setFailed] = useState(false);
  const update = useCallback(
    (next: FbSaved) => {
      setSaved(next);
      setFailed(!saveFbSaved(storage, next));
      if (!persistenceRequested) {
        persistenceRequested = true;
        void requestPersistence();
      }
    },
    [storage],
  );

  const openAnalysis = useCallback((id: string) => {
    setAnalysisStart(id);
    setTab('analysis');
    window.scrollTo(0, 0);
  }, []);
  const openPractice = useCallback((technique: string) => {
    setPracticeStart(technique);
    setTab('practice');
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let alive = true;
    loadAppBank().then(
      (loaded) => {
        if (!alive) return;
        setBank(loaded);
        setSaved((current) => ensureStations(current, loaded));
      },
      () => alive && setLoadFailed(true),
    );
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="fb-screen">
      <header className="fb-header">
        <button type="button" className="round" aria-label={TEXT.back} onClick={onBack}>
          ←
        </button>
        <h1>{TEXT.title}</h1>
        <nav className="fb-tabs" aria-label={TEXT.title}>
          {(['training', 'practice', 'analysis'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`fb-tab${tab === t ? ' fb-tab-current' : ''}`}
              aria-current={tab === t ? 'page' : undefined}
              onClick={() => {
                setTab(t);
                setAnalysisStart(null);
                setPracticeStart(null);
              }}
            >
              {TEXT.tabs[t]}
            </button>
          ))}
        </nav>
        <Info topic={TEXT.title}>{TEXT.help.tabs}</Info>
      </header>
      {failed && (
        <p role="alert" className="fb-note">
          {TEXT.saveFailed}
        </p>
      )}
      {!bank ? (
        <p role="status" className="fb-note">
          {loadFailed ? TEXT.loadFailed : TEXT.loading}
        </p>
      ) : (
        <>
          {tab === 'training' && (
            <Træning bank={bank} saved={saved} update={update} techniques={techniques} onOpenAnalysis={openAnalysis} onOpenPractice={openPractice} />
          )}
          {tab === 'practice' && (
            <Selvvalgt bank={bank} saved={saved} update={update} techniques={techniques} startTechnique={practiceStart ?? undefined} />
          )}
          {tab === 'analysis' && <Analysevindue bank={bank} start={analysisStart ?? undefined} saved={saved} update={update} />}
        </>
      )}
    </main>
  );
}
