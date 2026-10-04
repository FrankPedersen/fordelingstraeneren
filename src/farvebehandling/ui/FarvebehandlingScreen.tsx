import { useCallback, useEffect, useMemo, useState } from 'react';
import techniquesFile from '../content/techniques.json';
import { loadBank, type BankItem } from '../analysis';
import { FB_STORAGE_KEY, loadFbSaved, saveFbSaved, type FbSaved } from '../storage';
import { ensureStations } from '../training/palace';
import { Analysevindue } from './Analysevindue';
import { Selvvalgt } from './Selvvalgt';
import { TEXT } from './texts';
import { Træning } from './Træning';
import './tokens.css';
import './farvebehandling.css';

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
  const [bank, setBank] = useState<BankItem[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const techniques = techniquesFile.techniques;
  const storage = useMemo(browserStorage, []);
  // Intet skrives, før brugeren gør noget; et kig i Analyse rører ikke lagringen.
  const [saved, setSaved] = useState<FbSaved>(() => loadFbSaved(storage));
  const [failed, setFailed] = useState(false);
  const update = useCallback(
    (next: FbSaved) => {
      setSaved(next);
      setFailed(!saveFbSaved(storage, next));
    },
    [storage],
  );

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
              onClick={() => setTab(t)}
            >
              {TEXT.tabs[t]}
            </button>
          ))}
        </nav>
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
          {tab === 'training' && <Træning bank={bank} saved={saved} update={update} techniques={techniques} />}
          {tab === 'practice' && <Selvvalgt bank={bank} saved={saved} update={update} techniques={techniques} />}
          {tab === 'analysis' && <Analysevindue bank={bank} saved={saved} update={update} />}
        </>
      )}
    </main>
  );
}
