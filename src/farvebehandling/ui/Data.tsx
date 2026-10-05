import { useEffect, useRef, useState } from 'react';
import { dayOf } from '../../engine/dates';
import { fbExportFileName, fbSummary, parseFbImport, persistence, requestPersistence, type FbSaved, type Persistence } from '../storage';
import { TEXT } from './texts';

interface DataProps {
  saved: FbSaved;
  update(next: FbSaved): void;
  onBack(): void;
}

/** Gemmer en kopi af dataene som fil og giver dagen tilbage, så den kan gemmes som `lastExport`. */
export function downloadFbExport(saved: FbSaved, now = Date.now()): string {
  const today = dayOf(now, saved.settings.dayStartsAtHour);
  const blob = new Blob([JSON.stringify(saved, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fbExportFileName(today);
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return today;
}

/** Farvebehandlingens egen eksport og import. Fordelingssporets data og eksport røres ikke. */
export function Data({ saved, update, onBack }: DataProps) {
  const [incoming, setIncoming] = useState<FbSaved | null>(null);
  const [message, setMessage] = useState('');
  const [stored, setStored] = useState<Persistence | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    void persistence().then((p) => alive && setStored(p));
    return () => {
      alive = false;
    };
  }, []);

  function exportData() {
    const today = downloadFbExport(saved);
    update({ ...saved, lastExport: today });
    setMessage(TEXT.exported);
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    const result = parseFbImport(await file.text());
    if (result.ok) {
      setIncoming(result.saved);
      setMessage('');
    } else {
      setIncoming(null);
      setMessage(result.error);
    }
  }

  function confirmImport() {
    if (!incoming) return;
    update(incoming);
    setIncoming(null);
    setMessage(TEXT.imported);
  }

  const summary = incoming ? fbSummary(incoming) : null;
  return (
    <div className="fb-narrow">
      <header className="screen-head">
        <button type="button" className="round" aria-label={TEXT.backToTraining} onClick={onBack}>
          ←
        </button>
        <h2>{TEXT.data}</h2>
      </header>
      <section className="card">
        <p className="fb-note">{TEXT.dataHelp}</p>
        <button type="button" className="btn" onClick={exportData}>
          {TEXT.exportData}
        </button>
        <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
          {TEXT.importData}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          aria-label={TEXT.importFile}
          hidden
          onChange={(e) => {
            void readFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {message && (
          <p role="status" className="fb-note">
            {message}
          </p>
        )}
      </section>
      <section className="card" aria-labelledby="fb-persist">
        <h3 id="fb-persist">{TEXT.persistTitle}</h3>
        {stored && (
          <p className="fb-note">{stored === 'fast' ? TEXT.persistFast : stored === 'midlertidig' ? TEXT.persistTemporary : TEXT.persistUnknown}</p>
        )}
        {stored === 'midlertidig' && (
          <button type="button" className="btn small-btn" onClick={() => void requestPersistence().then(setStored)}>
            {TEXT.persistAsk}
          </button>
        )}
        <p className="fb-note">{saved.lastExport ? TEXT.lastExport(TEXT.dateText(saved.lastExport)) : TEXT.neverExported}</p>
      </section>
      {summary && (
        <section className="card" aria-label={TEXT.importData}>
          <p>{TEXT.importSummary(summary.xp, summary.items, summary.sessions, summary.streak)}</p>
          <div className="fb-actions">
            <button type="button" className="btn small-btn" onClick={() => setIncoming(null)}>
              {TEXT.cancel}
            </button>
            <button type="button" className="btn small-btn primary" onClick={confirmImport}>
              {TEXT.replace}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
