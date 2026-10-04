import { useRef, useState } from 'react';
import { dayOf } from '../../engine/dates';
import { fbExportFileName, fbSummary, parseFbImport, type FbSaved } from '../storage';
import { TEXT } from './texts';

interface DataProps {
  saved: FbSaved;
  update(next: FbSaved): void;
  onBack(): void;
}

/** Farvebehandlingens egen eksport og import. Fordelingssporets data og eksport røres ikke. */
export function Data({ saved, update, onBack }: DataProps) {
  const [incoming, setIncoming] = useState<FbSaved | null>(null);
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  function exportData() {
    const today = dayOf(Date.now(), saved.settings.dayStartsAtHour);
    const blob = new Blob([JSON.stringify(saved, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fbExportFileName(today);
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
